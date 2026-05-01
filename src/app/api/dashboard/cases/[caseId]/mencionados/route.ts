import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid, role } = session;

    if (role !== "admin" && role !== "gestor") {
      return Response.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const caseDoc = await adminDb.collection("cases").doc(caseId).get();
    if (!caseDoc.exists) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const caseData = caseDoc.data()!;
    if (caseData.org_id !== orgId) return Response.json({ error: "Acesso negado" }, { status: 403 });

    const body = await request.json() as { userId?: string };
    if (!body.userId) {
      return Response.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // Verify user belongs to the same org
    const userDoc = await adminDb.collection("users").doc(body.userId).get();
    if (!userDoc.exists || userDoc.data()?.org_id !== orgId) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    await adminDb.collection("cases").doc(caseId).update({
      mencionados: FieldValue.arrayUnion(body.userId),
    });

    await logAudit({
      orgId,
      userId: uid,
      acao: "mencionado_adicionado",
      caseId,
      detalhes: { mencionado_id: body.userId },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/dashboard/cases/[caseId]/mencionados]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
