import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    // Verify case access and org ownership
    const caseDoc = await adminDb.collection("cases").doc(caseId).get();
    if (!caseDoc.exists) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const caseData = caseDoc.data()!;
    if (caseData.org_id !== orgId) return Response.json({ error: "Acesso negado" }, { status: 403 });

    const mencionados: string[] = caseData.mencionados ?? [];
    if (mencionados.includes(uid)) {
      return Response.json({ error: "Você foi identificado como parte neste caso." }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection("audit_logs")
      .where("case_id", "==", caseId)
      .where("org_id", "==", orgId)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    return Response.json({ logs });
  } catch (err) {
    console.error("[GET /api/dashboard/cases/[caseId]/audit]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
