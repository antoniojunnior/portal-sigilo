import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/types";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    if (session.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    // Verify user belongs to same org
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });

    const userData = userDoc.data()!;
    if (userData.org_id !== session.orgId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json() as { role?: Role; ativo?: boolean };

    const updates: Record<string, unknown> = {};
    const validRoles: Role[] = ["admin", "gestor", "auditor"];

    if (body.role !== undefined) {
      if (!validRoles.includes(body.role)) {
        return Response.json({ error: "role inválido" }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.ativo !== undefined) {
      updates.ativo = body.ativo;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ ok: true });
    }

    await adminDb.collection("users").doc(userId).update(updates);

    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "user_atualizado",
      detalhes: { target_user_id: userId, changes: updates },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/dashboard/users/[userId]]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
