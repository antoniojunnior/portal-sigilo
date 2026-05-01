import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { FieldValue } from "firebase-admin/firestore";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const CATEGORIAS_LEGAIS = [
  "assedio_moral", "assedio_sexual", "discriminacao_salarial", "discriminacao",
  "fraude", "desvio_etico", "violacao_lgpd", "seguranca_trabalho",
  "risco_psicossocial", "conflito_interesses", "outro",
] as const;

const LEIS_APLICAVEIS = ["lei_14457", "nr1", "lei_14611", "lgpd", "clt", "outro"] as const;

interface TriagemResult {
  categoria_legal: string;
  subcategoria: string | null;
  urgencia: number;
  lei_aplicavel: string[];
  area_risco: string | null;
  recomendacao: string;
}

interface ColetaIA {
  categoria: string;
  descricao_resumida: string;
  urgencia: number;
  ha_evidencias: boolean;
  recorrente: boolean;
  areas_mencionadas: string[];
}

function buildSystemPrompt(): string {
  return `Você é um sistema de triagem automatizada de casos de um canal de denúncias corporativo.
Analise o caso e retorne APENAS um JSON válido, sem texto antes ou depois.

Estrutura obrigatória:
{
  "categoria_legal": "${CATEGORIAS_LEGAIS.join(" | ")}",
  "subcategoria": "string descritivo ou null",
  "urgencia": <inteiro 1-5>,
  "lei_aplicavel": ["lei_14457" | "nr1" | "lei_14611" | "lgpd" | "clt" | "outro"],
  "area_risco": "departamento ou área ou null",
  "recomendacao": "ação recomendada ao comitê em até 200 caracteres"
}

Escala de urgência:
1 = baixo impacto, sem risco imediato
2 = moderado, atenção nos próximos 15 dias
3 = alto, atenção em até 7 dias
4 = muito alto, ação em 48 horas
5 = crítico — risco imediato à integridade física ou dano financeiro grave

lei_aplicavel — inclua todas as leis relevantes:
- lei_14457: assédio moral/sexual no trabalho
- nr1: riscos psicossociais e segurança do trabalho
- lei_14611: discriminação salarial por gênero ou raça
- lgpd: violação de dados pessoais
- clt: demais violações trabalhistas
- outro: demais casos`;
}

function buildUserMessage(coleta: ColetaIA): string {
  return `Caso para triagem:
Categoria relatada pelo denunciante: ${coleta.categoria}
Descrição resumida: ${coleta.descricao_resumida}
Urgência indicada pelo chatbot: ${coleta.urgencia}/5
Há evidências: ${coleta.ha_evidencias ? "sim" : "não"}
Recorrente: ${coleta.recorrente ? "sim" : "não"}
Áreas mencionadas: ${coleta.areas_mencionadas.join(", ") || "não informadas"}`;
}

function validateTriagem(raw: unknown): TriagemResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const categoria_legal =
    typeof r.categoria_legal === "string" &&
    (CATEGORIAS_LEGAIS as readonly string[]).includes(r.categoria_legal)
      ? r.categoria_legal
      : null;
  if (!categoria_legal) return null;

  const urgencia =
    typeof r.urgencia === "number" &&
    Number.isInteger(r.urgencia) &&
    r.urgencia >= 1 &&
    r.urgencia <= 5
      ? r.urgencia
      : null;
  if (!urgencia) return null;

  const lei_aplicavel = Array.isArray(r.lei_aplicavel)
    ? r.lei_aplicavel.filter(
        (l): l is string =>
          typeof l === "string" &&
          (LEIS_APLICAVEIS as readonly string[]).includes(l)
      )
    : [];

  return {
    categoria_legal,
    subcategoria: typeof r.subcategoria === "string" ? r.subcategoria : null,
    urgencia,
    lei_aplicavel,
    area_risco: typeof r.area_risco === "string" ? r.area_risco : null,
    recomendacao: typeof r.recomendacao === "string" ? r.recomendacao.slice(0, 200) : "",
  };
}

async function callClaude(coleta: ColetaIA): Promise<TriagemResult | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserMessage(coleta) }],
      });

      const text =
        response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

      // Strip markdown code fences if Claude wraps JSON in them
      const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed: unknown = JSON.parse(json);
      const result = validateTriagem(parsed);
      if (result) return result;
    } catch (err) {
      console.error(`[triagem] attempt ${attempt} failed:`, err);
    }
  }
  return null;
}

export async function runTriagem(
  caseId: string,
  orgId: string,
  planoAtivo: string,
  coleta: ColetaIA,
  protocolo: string,
): Promise<void> {
  const batch = adminDb.batch();
  const caseRef = adminDb.collection("cases").doc(caseId);
  const auditRef = adminDb.collection("audit_logs").doc();

  // Plano Entrada: triagem manual, sem IA
  if (planoAtivo === "entrada") {
    batch.update(caseRef, { triagem_manual: true });
    batch.set(auditRef, {
      id: auditRef.id,
      org_id: orgId,
      user_id: "sistema",
      acao: "triagem_manual_indicada",
      case_id: caseId,
      detalhes: { motivo: "plano_entrada" },
      timestamp: new Date(),
    });
    await batch.commit();
    return;
  }

  const triagem = await callClaude(coleta);

  if (!triagem) {
    batch.update(caseRef, {
      triagem_ia: { needs_manual_review: true, gerado_em: new Date() },
    });
    batch.set(auditRef, {
      id: auditRef.id,
      org_id: orgId,
      user_id: "sistema",
      acao: "triagem_ia_falhou",
      case_id: caseId,
      detalhes: { tentativas: 2, needs_manual_review: true },
      timestamp: new Date(),
    });
    await batch.commit();
    return;
  }

  batch.update(caseRef, {
    triagem_ia: { ...triagem, gerado_em: new Date() },
  });

  // Notificação para urgência >= 4
  if (triagem.urgencia >= 4) {
    const notifRef = adminDb.collection("notifications").doc();
    batch.set(notifRef, {
      id: notifRef.id,
      org_id: orgId,
      case_id: caseId,
      protocolo,
      tipo: "alerta_urgencia",
      urgencia: triagem.urgencia,
      categoria: triagem.categoria_legal,
      lida: false,
      created_at: FieldValue.serverTimestamp(),
    });
  }

  batch.set(auditRef, {
    id: auditRef.id,
    org_id: orgId,
    user_id: "sistema",
    acao: "triagem_ia_concluida",
    case_id: caseId,
    detalhes: {
      categoria_legal: triagem.categoria_legal,
      urgencia: triagem.urgencia,
      lei_aplicavel: triagem.lei_aplicavel,
    },
    timestamp: new Date(),
  });

  await batch.commit();
}
