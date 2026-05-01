import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";
import type { CaseStatus, UrgenciaNivel } from "@/lib/types";

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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    let query = adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .orderBy("created_at", "desc");

    if (statusFilter) {
      query = adminDb
        .collection("cases")
        .where("org_id", "==", orgId)
        .where("status", "==", statusFilter)
        .orderBy("created_at", "desc");
    }

    const snapshot = await query.get();

    // Filter in memory: exclude cases where current user is in mencionados[]
    // Also filter by urgency if provided
    const urgencyNum = urgencyFilter ? (parseInt(urgencyFilter, 10) as UrgenciaNivel) : null;

    const allCases = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((c) => {
        const mencionados = (c as { mencionados?: string[] }).mencionados ?? [];
        if (mencionados.includes(uid)) return false;
        if (urgencyNum && (c as { urgencia?: number }).urgencia !== urgencyNum) return false;
        return true;
      });

    const totalCases = allCases.length;
    const totalPages = Math.ceil(totalCases / limit);
    const offset = (page - 1) * limit;
    const paginated = allCases.slice(offset, offset + limit);

    // Serialize Firestore Timestamps
    const serialized = paginated.map((c) => serializeCase(c));

    return Response.json({
      cases: serialized,
      total: totalCases,
      page,
      totalPages,
    });
  } catch (err) {
    console.error("[GET /api/dashboard/cases]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

function serializeCase(c: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(c)) {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    } else if (key === "triagem_ia" && value && typeof value === "object") {
      result[key] = serializeCase(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
