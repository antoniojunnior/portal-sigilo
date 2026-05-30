import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const { reportId } = await context.params;

  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (!reportDoc.exists) return Response.json({ error: "Relatório não encontrado" }, { status: 404 });

  const d = reportDoc.data()!;
  if (d.org_id !== session.orgId) return Response.json({ error: "Acesso negado" }, { status: 403 });

  return Response.json({
    id: reportDoc.id,
    tipo: d.tipo,
    status: d.status,
    texto_claude: d.texto_claude ?? "",
    gerado_em: (d.gerado_em as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
    aprovado_em: (d.aprovado_em as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
    periodo: {
      inicio: (d.periodo?.inicio as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
      fim: (d.periodo?.fim as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
    },
    metricas: d.metricas ?? null,
  });
}
