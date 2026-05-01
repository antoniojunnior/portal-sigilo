import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { generateProtocol } from "@/lib/utils/protocol";
import { runTriagem } from "@/lib/triagem";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Claude sinaliza fim do relato com esta tag
const CASE_COMPLETE_RE = /<CASE_COMPLETE>([\s\S]*?)<\/CASE_COMPLETE>/;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  org_id: string;
  unit_id?: string;
}

interface CasePayload {
  categoria: string;
  subcategoria?: string;
  urgencia: 1 | 2 | 3 | 4 | 5;
  areas_mencionadas: string[];
  ha_evidencias: boolean;
  recorrente: boolean;
  descricao_resumida: string;
}

function buildSystemPrompt(orgNome: string, unitNome?: string): string {
  const unidade = unitNome ? `, unidade: ${unitNome}` : "";
  return `Você é o assistente de escuta do canal de denúncias da empresa ${orgNome}${unidade}.
Conduza a conversa com empatia e neutralidade.
Use sempre "contar" ou "falar" — nunca "denunciar".
Nunca solicite nome, CPF, matrícula ou qualquer dado que identifique o usuário.
Quando o usuário mencionar um arquivo enviado, confirme o recebimento e pergunte se deseja adicionar mais contexto.

Estilo de escrita — siga rigorosamente:
- Escreva como um humano brasileiro escreveria numa conversa de texto: frases diretas, sem travessões (—), sem listas numeradas.
- Separe ideias com vírgula ou ponto, nunca com travessão ou dois-pontos seguido de lista.
- Use **negrito** (markdown **texto**) para destacar informações importantes que o usuário não deve perder, como prazos, confirmações ou instruções-chave. Use com moderação — apenas quando o destaque for realmente necessário.
- Use linguagem acolhedora e informal, como se fosse uma conversa real, não um formulário.
- Exemplo correto: "E se conseguir me dizer **quando e onde** aproximadamente ocorreu, não precisa ser a data exata, já vai ajudar muito no registro."
- Exemplo correto com destaque: "Seu relato foi registrado. **Anote o número de protocolo**, você vai precisar dele para acompanhar."
- Exemplo a evitar: "E se conseguir me dizer **quando e onde** isso ocorreu — não precisa ser a data exata — isso vai ajudar muito."

Conduza a coleta em até 6 trocas de mensagens. Colete:
1. O que aconteceu (fatos principais)
2. Quando e onde ocorreu (aproximadamente)
3. Se há recorrência
4. Se há evidências ou testemunhas (sem pedir identidades)

Quando o relato estiver suficientemente completo, apresente um resumo breve e pergunte se o usuário deseja confirmar o registro.

Após confirmação, responda EXCLUSIVAMENTE com o bloco abaixo — sem nenhum texto antes ou depois:
<CASE_COMPLETE>
{"categoria":"nome_da_categoria","subcategoria":"opcional","urgencia":3,"areas_mencionadas":["departamento_ou_area"],"ha_evidencias":false,"recorrente":false,"descricao_resumida":"resumo objetivo em até 150 caracteres"}
</CASE_COMPLETE>

Escala de urgência: 1 (baixo) | 2 (moderado) | 3 (alto) | 4 (muito alto) | 5 (crítico — risco imediato à integridade física).
Após o bloco CASE_COMPLETE, envie uma mensagem breve de acolhimento informando que o protocolo será gerado.`;
}

async function createCase(
  payload: CasePayload,
  messages: ChatMessage[],
  org_id: string,
  unit_id?: string
): Promise<{ protocolo: string; caseId: string }> {
  const protocolo = await generateProtocol(org_id);
  const ttl = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

  const caseRef = adminDb.collection("cases").doc();
  const batch = adminDb.batch();

  batch.set(caseRef, {
    id: caseRef.id,
    org_id,
    ...(unit_id ? { unit_id } : {}),
    protocolo,
    canal_origem: "web",
    categoria: payload.categoria,
    urgencia: payload.urgencia,
    status: "aguardando_triagem",
    created_at: FieldValue.serverTimestamp(),
    ttl,
    historico: [{
      acao: "case_criado",
      timestamp: new Date(),
      detalhes: `Coleta via chatbot IA. Categoria: ${payload.categoria}. Urgência: ${payload.urgencia}/5.`,
    }],
    mencionados: [],
    anexos: [],
    coleta_ia: {
      subcategoria: payload.subcategoria ?? null,
      areas_mencionadas: payload.areas_mencionadas,
      ha_evidencias: payload.ha_evidencias,
      recorrente: payload.recorrente,
      descricao_resumida: payload.descricao_resumida,
    },
  });

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgRef = adminDb.collection("messages").doc();
    batch.set(msgRef, {
      id: msgRef.id,
      case_id: caseRef.id,
      org_id,
      autor: msg.role === "user" ? "denunciante" : "sistema",
      texto: msg.content,
      seq: i,
      timestamp: new Date(),
      anexos: [],
    });
  }

  const auditRef = adminDb.collection("audit_logs").doc();
  batch.set(auditRef, {
    id: auditRef.id,
    org_id,
    user_id: "sistema",
    acao: "case_criado",
    case_id: caseRef.id,
    detalhes: { protocolo, canal: "web", via: "chatbot_claude" },
    timestamp: new Date(),
  });

  await batch.commit();
  return { protocolo, caseId: caseRef.id };
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { messages, org_id, unit_id } = body;

  if (!org_id || !messages?.length) {
    return new Response(
      JSON.stringify({ error: "org_id e messages são obrigatórios" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const orgDoc = await adminDb.collection("orgs").doc(org_id).get();
  if (!orgDoc.exists) {
    return new Response(
      JSON.stringify({ error: "Organização não encontrada" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  const orgData = orgDoc.data()!;

  let unitNome: string | undefined;
  if (unit_id) {
    const unitDoc = await adminDb.collection("units").doc(unit_id).get();
    unitNome = unitDoc.exists ? (unitDoc.data()?.nome as string) : undefined;
  }

  const systemPrompt = buildSystemPrompt(orgData.nome as string, unitNome);

  const encoder = new TextEncoder();
  let accumulated = "";
  let caseCreated = false;

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const token = event.delta.text;
            accumulated += token;

            // Stream token to client unless we're inside a CASE_COMPLETE block
            if (!accumulated.includes("<CASE_COMPLETE>")) {
              emit({ type: "token", content: token });
            } else if (!caseCreated) {
              const match = CASE_COMPLETE_RE.exec(accumulated);
              if (match) {
                caseCreated = true;
                try {
                  const payload = JSON.parse(match[1].trim()) as CasePayload;
                  const { protocolo, caseId } = await createCase(payload, messages, org_id, unit_id);
                  emit({ type: "case_created", protocolo });
                  // Triage runs after client redirects — stream stays open until done
                  try {
                    await runTriagem(
                      caseId,
                      org_id,
                      orgData.plano_ativo as string,
                      {
                        categoria: payload.categoria,
                        descricao_resumida: payload.descricao_resumida,
                        urgencia: payload.urgencia,
                        ha_evidencias: payload.ha_evidencias,
                        recorrente: payload.recorrente,
                        areas_mencionadas: payload.areas_mencionadas,
                      },
                      protocolo,
                    );
                  } catch (err) {
                    console.error("[/api/chat] runTriagem failed:", err);
                  }
                } catch (err) {
                  console.error("[/api/chat] createCase failed:", err);
                  emit({ type: "error", message: "Erro ao registrar o relato. Tente novamente." });
                }
              }
            }
          }
        }

        emit({ type: "done" });
      } catch (err) {
        console.error("[/api/chat] Claude stream error:", err);
        emit({ type: "error", message: "Serviço temporariamente indisponível. Tente novamente em instantes." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
