import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    // Tentar ler insights gerados pela scheduled function
    const orgDoc = await adminDb.collection("orgs").doc(orgId).get();
    const aiInsights = orgDoc.data()?.ai_insights as { items?: string[]; gerado_em?: { toDate: () => Date } } | undefined;

    if (aiInsights?.items && aiInsights.items.length > 0) {
      const generatedAt = aiInsights.gerado_em?.toDate?.()?.toISOString() ?? new Date().toISOString();
      return Response.json({
        summary: aiInsights.items[0] ?? "",
        highlight: null,
        description: aiInsights.items[1] ?? "",
        recommendations: aiInsights.items.slice(1),
        generatedAt,
        source: "ai_scheduled",
      });
    }

    // Fallback: heurística local (sem Claude)
    const snapshot = await adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .get();

    if (snapshot.empty) {
      return Response.json({
        summary: "Nenhum caso registrado ainda.",
        highlight: null,
        description: "Acompanhe novos relatos para obter insights automáticos.",
        recommendations: [
          "Divulgue o canal de denúncias internamente.",
          "Garanta o anonimato dos denunciantes.",
          "Mantenha os treinamentos de ética em dia.",
        ],
        generatedAt: new Date().toISOString(),
        source: "fallback",
      });
    }

    const cases = snapshot.docs.map((doc) => doc.data());
    const depts: Record<string, number> = {};
    const categories: Record<string, number> = {};

    cases.forEach((c) => {
      if ((c.mencionados as string[] | undefined ?? []).includes(uid)) return;
      const dept = (c.triagem_ia?.area_risco ?? c.departamento ?? "Não informado") as string;
      const cat = (c.categoria ?? "Outro") as string;
      depts[dept] = (depts[dept] ?? 0) + 1;
      categories[cat] = (categories[cat] ?? 0) + 1;
    });

    const topDept = Object.entries(depts).sort((a, b) => b[1] - a[1])[0];
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    const weekCount = cases.filter((c) => {
      const createdAt = (c.created_at as { toDate?: () => Date } | undefined)?.toDate?.()?.getTime() ?? 0;
      return Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
    }).length;

    let summary = "";
    let highlight: string | null = null;
    let description = "";
    let recommendations: string[] = [];

    if (topDept && topDept[1] > 1) {
      summary = `${weekCount} caso${weekCount !== 1 ? "s" : ""} registrado${weekCount !== 1 ? "s" : ""} recentemente envolvem o mesmo departamento:`;
      highlight = topDept[0];
      description = `Os relatos indicam padrões relacionados a ${topCat?.[0].toLowerCase() ?? "irregularidades"} e sugerem atenção imediata da liderança local.`;
      recommendations = [
        `Investigar padrões de comunicação em ${topDept[0]}.`,
        `Avaliar necessidade de treinamentos específicos para ${topCat?.[0].toLowerCase() ?? "compliance"}.`,
        "Acompanhar novos relatos envolvendo a mesma equipe.",
      ];
    } else {
      summary = "O canal apresenta uma distribuição equilibrada de relatos.";
      highlight = "Estabilidade Detectada";
      description = "Não foram encontrados padrões críticos de concentração em departamentos específicos nas últimas semanas.";
      recommendations = [
        "Manter o monitoramento contínuo dos SLAs.",
        "Reforçar a cultura de feedback preventivo.",
        "Revisar periodicamente os treinamentos de compliance.",
      ];
    }

    return Response.json({
      summary,
      highlight,
      description,
      recommendations,
      generatedAt: new Date().toISOString(),
      source: "fallback_heuristic",
    });
  } catch (err) {
    console.error("[GET /api/dashboard/insights]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
