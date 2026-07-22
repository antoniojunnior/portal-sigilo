import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface RequestBody {
  periodoInicio: string; // ISO date string
  periodoFim: string;    // ISO date string
  tipo?: "padrao" | "personalizado";
  filtros?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role === "auditor") {
    return Response.json({ error: "Auditores não podem gerar relatórios." }, { status: 403 });
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

  const { periodoInicio, periodoFim, tipo = "padrao", filtros } = body;

  if (!periodoInicio || !periodoFim) {
    return Response.json({ error: "periodoInicio e periodoFim são obrigatórios" }, { status: 400 });
  }

  const inicio = new Date(periodoInicio);
  const fim = new Date(periodoFim);

  try {
  // Agregar dados do período
  const query = adminDb
    .collection("cases")
    .where("org_id", "==", session.orgId)
    .where("created_at", ">=", inicio)
    .where("created_at", "<=", fim);

  const snapshot = await query.get();
  const cases = snapshot.docs.map((d) => d.data());

  const totalCases = cases.length;
  const categories: Record<string, number> = {};
  const leis: Record<string, number> = {};
  let resolvidos = 0;
  let totalDias = 0;
  let casosComPrazo = 0;

  cases.forEach((c) => {
    const cat = (c.triagem_ia?.categoria ?? c.categoria ?? "outro") as string;
    categories[cat] = (categories[cat] ?? 0) + 1;

    const leisArr: string[] = Array.isArray(c.triagem_ia?.lei_aplicavel)
      ? c.triagem_ia.lei_aplicavel
      : c.triagem_ia?.lei_aplicavel ? [c.triagem_ia.lei_aplicavel] : [];
    leisArr.forEach((l) => { leis[l] = (leis[l] ?? 0) + 1; });

    if (["encerrado_sem_infracao", "encerrado_com_acao"].includes(c.status as string)) {
      resolvidos++;
    }

    const createdAt = (c.created_at as { toDate?: () => Date } | undefined)?.toDate?.();
    if (createdAt) {
      const dias = Math.floor((fim.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      totalDias += dias;
      casosComPrazo++;
    }
  });

  const prazoMedio = casosComPrazo > 0 ? Math.round(totalDias / casosComPrazo) : 0;
  const pendentes = totalCases - resolvidos;

  const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topLeis = Object.keys(leis).slice(0, 5);

  const mes = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const prompt = `Dados de ${mes}: ${totalCases} relatos, categorias: ${topCats.map(([c, n]) => `${c} (${n})`).join(", ")}, resolvidos: ${resolvidos}, pendentes: ${pendentes}, tempo medio: ${prazoMedio}d, categorias_legais_acionadas: ${topLeis.join(", ") || "nenhuma"}.

Gere relatório executivo em português formal:
(1) sumário em 3 parágrafos,
(2) análise de tendências,
(3) alertas de risco com referência legal,
(4) recomendações priorizadas.

Não inclua conteúdo individual de relatos. Não invente dados.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const textoClaude = response.content[0].type === "text" ? response.content[0].text : "";

  const reportRef = adminDb.collection("reports").doc();
  const reportId = reportRef.id;

  await reportRef.set({
    id: reportId,
    org_id: session.orgId,
    periodo: {
      inicio: Timestamp.fromDate(inicio),
      fim: Timestamp.fromDate(fim),
    },
    gerado_em: FieldValue.serverTimestamp(),
    texto_claude: textoClaude,
    aprovado: false,
    exportado: false,
    tipo,
    status: "rascunho",
    ...(filtros ? { filtros } : {}),
    metricas: {
      total: totalCases,
      resolvidos,
      pendentes,
      prazoMedio,
      topCategorias: topCats.slice(0, 3).map(([c]) => c),
    },
  });

  await logAudit({
    orgId: session.orgId,
    userId: session.uid,
    acao: "report_generated",
    detalhes: { reportId, tipo, periodoInicio, periodoFim },
  });

  return Response.json({ reportId, status: "rascunho" });
  } catch (err) {
    console.error("[POST /api/reports/generate]", err);
    return Response.json({ error: "Erro ao gerar relatório. Tente novamente." }, { status: 500 });
  }
}

// Lista relatórios da org
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const snap = await adminDb
    .collection("reports")
    .where("org_id", "==", session.orgId)
    .orderBy("gerado_em", "desc")
    .limit(50)
    .get();

  const reports = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      tipo: d.tipo,
      status: d.status,
      gerado_em: (d.gerado_em as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
      aprovado_em: (d.aprovado_em as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
      periodo: {
        inicio: (d.periodo?.inicio as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
        fim: (d.periodo?.fim as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
      },
    };
  });

  return Response.json({ reports });
}
