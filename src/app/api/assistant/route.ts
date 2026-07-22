import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  caseId: string;
  messages: AssistantMessage[];
  includeFullReport?: boolean;
}

function buildSystemPrompt(
  categoria: string,
  urgencia: number,
  leis: string[],
  diasEmAberto: number,
  status: string,
  relato?: string
): string {
  const leisStr = leis.length > 0 ? leis.join(", ") : "não classificada";
  const base = `Você é um assistente de compliance do Portal Sigilo.
Caso: categoria=${categoria}, urgencia=${urgencia}/5, lei: ${leisStr}, prazo: ${diasEmAberto}d, status: ${status}.
Oriente o gestor sobre conduta, documentação e prazos legais.
Não invente jurisprudência.
Responda em português formal, de forma objetiva e prática.`;

  if (relato) {
    return `${base}

CONTEÚDO DO RELATO (acesso concedido explicitamente pelo gestor):
${relato}`;
  }

  return base;
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const session = await verifySession(sessionCookie);
  if (!session) {
    return Response.json({ error: "Sessão inválida" }, { status: 401 });
  }

  if (session.plano === "suspenso" || session.plano === "cancelado") {
    return Response.json({ error: "plan_suspended", plano: session.plano }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { caseId, messages, includeFullReport } = body;

  if (!caseId || !messages?.length) {
    return Response.json({ error: "caseId e messages são obrigatórios" }, { status: 400 });
  }

  const caseDoc = await adminDb.collection("cases").doc(caseId).get();
  if (!caseDoc.exists) {
    return Response.json({ error: "Caso não encontrado" }, { status: 404 });
  }

  const caseData = caseDoc.data()!;

  if (caseData.org_id !== session.orgId) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  const mencionados: string[] = caseData.mencionados ?? [];
  if (mencionados.includes(session.uid)) {
    return Response.json({ error: "Você foi identificado como parte neste caso." }, { status: 403 });
  }

  const categoria: string = caseData.triagem_ia?.categoria ?? caseData.categoria ?? "não classificado";
  const urgencia: number = caseData.triagem_ia?.urgencia ?? caseData.urgencia ?? 3;
  const leis: string[] = Array.isArray(caseData.triagem_ia?.lei_aplicavel)
    ? caseData.triagem_ia.lei_aplicavel
    : caseData.triagem_ia?.lei_aplicavel
      ? [caseData.triagem_ia.lei_aplicavel]
      : [];

  const createdAt: Date = caseData.created_at?.toDate?.() ?? new Date();
  const diasEmAberto = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  let relato: string | undefined;

  if (includeFullReport) {
    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "ai_full_access_granted",
      caseId,
      detalhes: { modelo: "claude-sonnet-4-20250514", sessao: new Date().toISOString() },
    });

    const messagesSnap = await adminDb
      .collection("messages")
      .where("case_id", "==", caseId)
      .orderBy("seq", "asc")
      .get();

    relato = messagesSnap.docs
      .map((d) => {
        const m = d.data();
        const autor = m.autor === "denunciante" ? "Denunciante" : "Sistema";
        return `${autor}: ${m.texto as string}`;
      })
      .join("\n");
  }

  const systemPrompt = buildSystemPrompt(categoria, urgencia, leis, diasEmAberto, caseData.status as string, relato);

  await logAudit({
    orgId: session.orgId,
    userId: session.uid,
    acao: "ai_assistant_session",
    caseId,
    detalhes: { includeFullReport: !!includeFullReport },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            emit({ type: "token", content: event.delta.text });
          }
        }

        emit({ type: "done" });
      } catch (err) {
        console.error("[/api/assistant] Claude stream error:", err);
        emit({ type: "error", message: "Serviço temporariamente indisponível. Tente novamente." });
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

// Endpoint para atualizar ai_insights gerados pela scheduled function
// Chamado internamente via API route (não exposto ao browser)
export async function PUT(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { items } = await request.json() as { items: string[] };
  if (!Array.isArray(items)) {
    return Response.json({ error: "items deve ser um array" }, { status: 400 });
  }

  await adminDb.collection("orgs").doc(session.orgId).update({
    ai_insights: {
      items: items.slice(0, 3),
      gerado_em: FieldValue.serverTimestamp(),
    },
  });

  return Response.json({ ok: true });
}
