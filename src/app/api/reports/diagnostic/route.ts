import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { buildReportDedupKey, findRecentDuplicateReport } from "@/lib/reports/dedup";
import type { NextRequest } from "next/server";

const DEDUP_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    results.cookie = !!sessionCookie;
    if (!sessionCookie) {
      return Response.json({ step: "auth", ok: false, error: "sem cookie de sessao", ...results });
    }

    const session = await verifySession(sessionCookie);
    results.auth = !!session;
    if (!session) {
      return Response.json({ step: "auth", ok: false, error: "sessao invalida", ...results });
    }

    results.orgId = session.orgId;
    results.role = session.role;
    results.plano = session.plano;

    try {
      await adminDb.collection("reports")
        .where("org_id", "==", session.orgId)
        .orderBy("gerado_em", "desc")
        .limit(1)
        .get();
      results.firestoreRead = true;
    } catch (e) {
      results.firestoreRead = false;
      results.firestoreReadError = e instanceof Error ? e.message : String(e);
    }

    try {
      await adminDb.collection("cases")
        .where("org_id", "==", session.orgId)
        .where("created_at", ">=", new Date("2026-07-01"))
        .where("created_at", "<=", new Date("2026-07-31"))
        .limit(1)
        .get();
      results.casesQuery = true;
    } catch (e) {
      results.casesQuery = false;
      results.casesQueryError = e instanceof Error ? e.message : String(e);
    }

    const dedupKey = buildReportDedupKey(session.orgId, "padrao", "2026-07-01", "2026-07-31");
    results.dedupKey = dedupKey;

    try {
      const dup = await findRecentDuplicateReport(session.orgId, dedupKey, DEDUP_WINDOW_MS);
      results.findDup = dup ? "found" : "not found";
    } catch (e) {
      results.findDup = false;
      results.findDupError = e instanceof Error ? e.message : String(e);
    }

    return Response.json({ step: "complete", ok: true, ...results });
  } catch (err) {
    return Response.json({
      step: "fatal",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      ...results,
    }, { status: 500 });
  }
}
