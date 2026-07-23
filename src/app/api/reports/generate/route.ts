import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getCategoriaLegal } from "@/lib/triagem";
import { buildReportDedupKey, findRecentDuplicateReport, reserveReportSlot } from "@/lib/reports/dedup";
import type { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface RequestBody {
  periodoInicio: string;
  periodoFim: string;
  tipo?: "padrao" | "personalizado" | "analitico";
  departamentos?: string[];
  categorias?: string[];
  filtros?: Record<string, unknown>;
}

interface LinhaTabela {
  departamento: string;
  categoria_legal: string;
  mes: string;
  total: number;
}

interface RiscoPsicossocialMetricas {
  total: number;
  por_subcategoria: Record<string, number>;
}

function buildTabelaAnalitica(cases: Record<string, unknown>[]): LinhaTabela[] {
  const mapa: Record<string, LinhaTabela> = {};

  for (const c of cases) {
    const departamento = ((c.triagem_ia as Record<string, unknown> | undefined)?.area_risco as string | undefined)
      ?? (c.departamento as string | undefined)
      ?? "Não informado";
    const categoriaLegal = getCategoriaLegal(c);
    const createdAt = (c.created_at as { toDate?: () => Date } | undefined)?.toDate?.();
    const mes = createdAt
      ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`
      : "desconhecido";

    const key = `${departamento}|${categoriaLegal}|${mes}`;
    if (!mapa[key]) {
      mapa[key] = { departamento, categoria_legal: categoriaLegal, mes, total: 0 };
    }
    mapa[key].total++;
  }

  return Object.values(mapa).sort((a, b) =>
    a.departamento.localeCompare(b.departamento) ||
    a.categoria_legal.localeCompare(b.categoria_legal) ||
    a.mes.localeCompare(b.mes)
  );
}

const DEDUP_WINDOW_MS = 60_000;

function aggregateRiscoPsicossocial(cases: Record<string, unknown>[]): RiscoPsicossocialMetricas {
  const result: RiscoPsicossocialMetricas = { total: 0, por_subcategoria: {} };

  for (const c of cases) {
    const triagem = c.triagem_ia as Record<string, unknown> | undefined;
    const catLegal = getCategoriaLegal(c);
    const leisAplicaveis = (triagem?.lei_aplicavel as string[] | undefined) ?? [];

    if (catLegal !== "risco_psicossocial" && !leisAplicaveis.includes("nr1")) continue;

    result.total++;
    const subcategoria = (triagem?.subcategoria as string | undefined) ?? "Não especificado";
    result.por_subcategoria[subcategoria] = (result.por_subcategoria[subcategoria] ?? 0) + 1;
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
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

  const { periodoInicio, periodoFim, tipo = "padrao", departamentos, categorias, filtros } = body;

  if (!periodoInicio || !periodoFim) {
    return Response.json({ error: "periodoInicio e periodoFim são obrigatórios" }, { status: 400 });
  }

  const inicio = new Date(periodoInicio);
  const fim = new Date(periodoFim);

  const dedupKey = buildReportDedupKey(session.orgId, tipo, periodoInicio, periodoFim, departamentos, categorias);

  try {
  // BUG-20260723-DUP1: pré-checagem barata — evita o custo de Claude no caso comum
  // (duplicidade sequencial, não simultânea). Não fecha a corrida sozinha; ver transação abaixo.
  const dedupPrecheck = await findRecentDuplicateReport(session.orgId, dedupKey, DEDUP_WINDOW_MS);

  if (dedupPrecheck) {
    return Response.json({ reportId: dedupPrecheck.id, status: dedupPrecheck.status, tipo, deduplicated: true });
  }

  const snapshot = await adminDb
    .collection("cases")
    .where("org_id", "==", session.orgId)
    .where("created_at", ">=", inicio)
    .where("created_at", "<=", fim)
    .get();

  let cases = snapshot.docs.map((d) => d.data());

  // Filtros em memória (D-02)
  if (departamentos && departamentos.length > 0) {
    const deptSet = new Set(departamentos);
    cases = cases.filter((c) => {
      const areaRisco = (c.triagem_ia as Record<string, unknown> | undefined)?.area_risco as string | undefined
        ?? c.departamento as string | undefined
        ?? "";
      return deptSet.has(areaRisco);
    });
  }

  if (categorias && categorias.length > 0) {
    const catSet = new Set(categorias);
    cases = cases.filter((c) => catSet.has(getCategoriaLegal(c)));
  }

  const totalCases = cases.length;
  const categories: Record<string, number> = {};
  const leis: Record<string, number> = {};
  let resolvidos = 0;
  let totalDias = 0;
  let casosComPrazo = 0;

  cases.forEach((c) => {
    const cat = getCategoriaLegal(c);
    categories[cat] = (categories[cat] ?? 0) + 1;

    const leisArr: string[] = Array.isArray((c.triagem_ia as Record<string, unknown> | undefined)?.lei_aplicavel)
      ? (c.triagem_ia as Record<string, unknown> | undefined)?.lei_aplicavel as string[]
      : (c.triagem_ia as Record<string, unknown> | undefined)?.lei_aplicavel ? [(c.triagem_ia as Record<string, unknown> | undefined)?.lei_aplicavel as string] : [];
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

  const riscoPsicossocial = aggregateRiscoPsicossocial(cases);

  let textoClaude = "";
  let tabela_analitica: LinhaTabela[] | undefined;

  if (tipo === "analitico") {
    tabela_analitica = buildTabelaAnalitica(cases);
  } else {
    const mes = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const prompt = `Dados de ${mes}: ${totalCases} relatos, categorias: ${topCats.map(([c, n]) => `${c} (${n})`).join(", ")}, resolvidos: ${resolvidos}, pendentes: ${pendentes}, tempo medio: ${prazoMedio}d, categorias_legais_acionadas: ${topLeis.join(", ") || "nenhuma"}.

Gere relatório executivo em português formal:
(1) sumário em 3 parágrafos,
(2) análise de tendências,
(3) alertas de risco com referência legal,
(4) recomendações priorizadas.

Não inclua conteúdo individual de relatos. Não invente dados.`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      textoClaude = response.content[0].type === "text" ? response.content[0].text : "";
    } catch (claudeErr) {
      console.error("[POST /api/reports/generate] Claude error:", claudeErr);
    }
  }

  const reportsCollection = adminDb.collection("reports");
  const newReportRef = reportsCollection.doc();

  const reportData: Record<string, unknown> = {
    id: newReportRef.id,
    org_id: session.orgId,
    periodo: {
      inicio: Timestamp.fromDate(inicio),
      fim: Timestamp.fromDate(fim),
    },
    gerado_em: FieldValue.serverTimestamp(),
    texto_claude: textoClaude,
    aprovado: false,
    exportado: false,
    tipo: tipo === "analitico" ? "personalizado" : tipo,
    status: "rascunho",
    dedup_key: dedupKey,
    metricas: {
      total: totalCases,
      resolvidos,
      pendentes,
      prazoMedio,
      topCategorias: topCats.slice(0, 3).map(([c]) => c),
    },
    risco_psicossocial: riscoPsicossocial,
    filtros: {
      periodoInicio,
      periodoFim,
      ...(departamentos && departamentos.length > 0 ? { departamentos } : {}),
      ...(categorias && categorias.length > 0 ? { categorias } : {}),
      ...(filtros ?? {}),
    },
  };

  if (tabela_analitica) {
    reportData.tabela_analitica = tabela_analitica;
  }

  // BUG-20260723-DUP1: re-checagem transacional — fecha a janela de corrida entre o
  // pré-check acima e este write. Se outra requisição concorrente já criou um relatório
  // compatível nesse meio-tempo, reaproveita o dela em vez de gravar um segundo.
  const { reportId, deduplicated } = await reserveReportSlot(
    session.orgId,
    dedupKey,
    DEDUP_WINDOW_MS,
    newReportRef,
    reportData
  );

  if (!deduplicated) {
    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "report_generated",
      detalhes: {
        reportId,
        tipo,
        periodoInicio,
        periodoFim,
        ...(departamentos ? { departamentos } : {}),
        ...(categorias ? { categorias } : {}),
        risco_psicossocial: riscoPsicossocial.total,
      },
    });
  }

  return Response.json({ reportId, status: "rascunho", tipo, ...(deduplicated ? { deduplicated: true } : {}) });
  } catch (err) {
    console.error("[POST /api/reports/generate] inner error:", err);
    return Response.json({ error: "Erro ao gerar relatório. Tente novamente." }, { status: 500 });
  }
  } catch (err) {
    console.error("[POST /api/reports/generate] outer error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Erro interno: ${msg}` }, { status: 500 });
  }
}

// Lista relatórios da org
export async function GET(request: NextRequest) {
  try {
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
      const filtros = d.filtros as Record<string, unknown> | undefined;
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
        departamentos: (filtros?.departamentos as string[] | undefined) ?? [],
        categorias: (filtros?.categorias as string[] | undefined) ?? [],
      };
    });

    return Response.json({ reports });
  } catch (err) {
    console.error("[GET /api/reports/generate]", err);
    return Response.json({ error: "Erro ao listar relatórios." }, { status: 500 });
  }
}
