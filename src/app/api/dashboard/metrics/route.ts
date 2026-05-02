import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";
import type { CaseStatus, UrgenciaNivel, CanalOrigem } from "@/lib/types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

interface PeriodStats {
  total: number;
  emApuracao: number;
  resolvidos: number;
  prazoMedio: number | null;
  byUrgency: Record<number, number>;
  byChannel: Record<string, number>;
  semRespostaUrgente: number; // cases urgencia>=4, open, no messages in last 48h
}

function computeStats(
  docs: QueryDocumentSnapshot<DocumentData>[],
  uid: string,
  windowStart: number,
  windowEnd: number
): PeriodStats {
  const byUrgency: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byChannel: Record<string, number> = { web: 0, whatsapp: 0, app: 0, "0800": 0 };

  let total = 0;
  let emApuracao = 0;
  let resolvidos = 0;
  let totalPrazoDays = 0;
  let prazoCount = 0;
  let semRespostaUrgente = 0;

  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const now = Date.now();

  for (const doc of docs) {
    const data = doc.data();
    const mencionados: string[] = data.mencionados ?? [];
    if (mencionados.includes(uid)) continue;

    const createdAt = data.created_at?.toDate?.()?.getTime?.() ?? 0;
    if (createdAt < windowStart || createdAt >= windowEnd) continue;

    total++;

    const status = data.status as CaseStatus;
    if (status === "em_apuracao") emApuracao++;

    const isResolved = status === "encerrado_sem_infracao" || status === "encerrado_com_acao";
    if (isResolved) resolvidos++;

    if (data.prazo) {
      const prazoMs = data.prazo.toDate?.()?.getTime?.() ?? 0;
      if (prazoMs && createdAt) {
        totalPrazoDays += (prazoMs - createdAt) / (24 * 60 * 60 * 1000);
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

    // Case urgent, not closed, no recent response
    const isClosed = status === "encerrado_sem_infracao" || status === "encerrado_com_acao";
    if (
      urgencia != null &&
      urgencia >= 4 &&
      !isClosed
    ) {
      const lastUpdated = data.updated_at?.toDate?.()?.getTime?.() ?? createdAt;
      if (now - lastUpdated > fortyEightHoursMs) {
        semRespostaUrgente++;
      }
    }
  }

  return {
    total,
    emApuracao,
    resolvidos,
    prazoMedio: prazoCount > 0 ? Math.round(totalPrazoDays / prazoCount) : null,
    byUrgency,
    byChannel,
    semRespostaUrgente,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    const periodDays = Math.min(
      365,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("period") ?? "30", 10))
    );

    const snapshot = await adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .get();

    const now = Date.now();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const currentStart = now - periodMs;
    const prevStart = now - 2 * periodMs;

    const current = computeStats(snapshot.docs, uid, currentStart, now);
    const prev = computeStats(snapshot.docs, uid, prevStart, currentStart);

    function pctChange(cur: number, pre: number): string | null {
      if (pre === 0) return cur > 0 ? "+100%" : null;
      const delta = ((cur - pre) / pre) * 100;
      return (delta >= 0 ? "+" : "") + delta.toFixed(0) + "%";
    }

    return Response.json({
      // current period
      total: current.total,
      emApuracao: current.emApuracao,
      resolvidos30d: current.resolvidos,
      prazoMedio: current.prazoMedio,
      byUrgency: current.byUrgency,
      byChannel: current.byChannel,
      semRespostaUrgente: current.semRespostaUrgente,
      // comparison
      totalTrend: pctChange(current.total, prev.total),
      emApuracaoTrend: pctChange(current.emApuracao, prev.emApuracao),
      resolvidosTrend: pctChange(current.resolvidos, prev.resolvidos),
    });
  } catch (err) {
    console.error("[GET /api/dashboard/metrics]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
