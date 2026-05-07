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

    const { orgId, uid } = session;
    const { searchParams } = request.nextUrl;

    const statusFilter = searchParams.get("status") as CaseStatus | null;
    const urgencyFilter = searchParams.get("urgency");
    const channelFilter = searchParams.get("channel") as CanalOrigem | null;
    const protocolFilter = searchParams.get("protocol")?.trim().toLowerCase() ?? null;
    const dateFrom = searchParams.get("dateFrom"); // ISO string
    const dateTo = searchParams.get("dateTo");     // ISO string
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const sortBy = searchParams.get("sortBy") ?? "created_at"; // created_at | urgencia | prazo
    const sortDir = searchParams.get("sortDir") ?? "desc";

    let query: FirebaseFirestore.Query = adminDb
      .collection("cases")
      .where("org_id", "==", orgId);

    if (statusFilter) {
      query = query.where("status", "==", statusFilter);
    }

    if (channelFilter) {
      query = query.where("canal_origem", "==", channelFilter);
    }

    // Urgency filter applied in memory (avoids composite index requirement)
    const urgencyNum = urgencyFilter ? (parseInt(urgencyFilter, 10) as UrgenciaNivel) : null;

    const snapshot = await query.orderBy("created_at", "desc").get();

    const now = Date.now();

    // In-memory: mencionados exclusion + remaining filters
    type CaseWithId = Record<string, unknown> & { id: string };
    let allCases: CaseWithId[] = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((c) => {
        const mencionados = (c as { mencionados?: string[] }).mencionados ?? [];
        if (mencionados.includes(uid)) return false;
        if (urgencyNum && (c as { urgencia?: number }).urgencia !== urgencyNum) return false;
        if (protocolFilter) {
          const proto = ((c as { protocolo?: string }).protocolo ?? "").toLowerCase();
          if (!proto.includes(protocolFilter)) return false;
        }
        if (dateFrom) {
          const createdAt = timestampToMs((c as Record<string, unknown>).created_at);
          if (createdAt !== null && createdAt < new Date(dateFrom).getTime()) return false;
        }
        if (dateTo) {
          const createdAt = timestampToMs((c as Record<string, unknown>).created_at);
          if (createdAt !== null && createdAt > new Date(dateTo).getTime()) return false;
        }
        return true;
      });

    // Sort
    if (sortBy === "urgencia") {
      allCases = allCases.sort((a, b) => {
        const ua = (a.urgencia as number | undefined) ?? 0;
        const ub = (b.urgencia as number | undefined) ?? 0;
        return sortDir === "asc" ? ua - ub : ub - ua;
      });
    } else if (sortBy === "prazo") {
      allCases = allCases.sort((a, b) => {
        const pa = timestampToMs(a.prazo) ?? Infinity;
        const pb = timestampToMs(b.prazo) ?? Infinity;
        return sortDir === "asc" ? pa - pb : pb - pa;
      });
    }
    // default: created_at already sorted by Firestore query

    const totalCases = allCases.length;
    const totalPages = Math.ceil(totalCases / limit);
    const offset = (page - 1) * limit;
    const paginated = allCases.slice(offset, offset + limit);

    const serialized = paginated.map((c) => {
      const s = serializeCase(c);
      // Inject dias_em_aberto
      const createdMs = c.created_at
        ? timestampToMs(c.created_at)
        : null;
      s.dias_em_aberto = createdMs
        ? Math.floor((now - createdMs) / (24 * 60 * 60 * 1000))
        : null;
      return s;
    });

    return Response.json({
      cases: serialized,
      total: totalCases,
      page,
      totalPages,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Firestore missing index errors include a URL to create the index — log it clearly.
    if (msg.includes("index")) {
      console.error("[GET /api/dashboard/cases] MISSING FIRESTORE INDEX:", msg);
    } else {
      console.error("[GET /api/dashboard/cases]", err);
    }
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

function timestampToMs(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

function serializeCase(c: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(c)) {
    if (
      value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: unknown }).toDate === "function"
    ) {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    } else if (key === "triagem_ia" && value && typeof value === "object") {
      result[key] = serializeCase(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
