import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";
import type { CaseStatus, UrgenciaNivel, CanalOrigem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId } = session;

    const snapshot = await adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .get();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let total = 0;
    let emApuracao = 0;
    let resolvidos30d = 0;
    let totalPrazoDays = 0;
    let prazoCount = 0;

    const byUrgency: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byChannel: Record<string, number> = { web: 0, whatsapp: 0, app: 0, "0800": 0 };

    for (const doc of snapshot.docs) {
      const data = doc.data();
      total++;

      const status = data.status as CaseStatus;
      if (status === "em_apuracao") emApuracao++;

      const isResolved = status === "encerrado_sem_infracao" || status === "encerrado_com_acao";
      if (isResolved) {
        const createdAt = data.created_at?.toDate?.()?.getTime?.() ?? 0;
        if (createdAt >= thirtyDaysAgo) resolvidos30d++;
      }

      if (data.prazo) {
        const prazoDate = data.prazo.toDate?.()?.getTime?.() ?? 0;
        const createdAt = data.created_at?.toDate?.()?.getTime?.() ?? 0;
        if (prazoDate && createdAt) {
          totalPrazoDays += (prazoDate - createdAt) / (24 * 60 * 60 * 1000);
          prazoCount++;
        }
      }

      const urgencia = data.urgencia as UrgenciaNivel | undefined;
      if (urgencia && urgencia >= 1 && urgencia <= 5) {
        byUrgency[urgencia] = (byUrgency[urgencia] ?? 0) + 1;
      }

      const canal = data.canal_origem as CanalOrigem | undefined;
      if (canal && canal in byChannel) {
        byChannel[canal] = (byChannel[canal] ?? 0) + 1;
      }
    }

    const prazoMedio = prazoCount > 0 ? Math.round(totalPrazoDays / prazoCount) : null;

    return Response.json({
      total,
      emApuracao,
      resolvidos30d,
      prazoMedio,
      byUrgency,
      byChannel,
    });
  } catch (err) {
    console.error("[GET /api/dashboard/metrics]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
