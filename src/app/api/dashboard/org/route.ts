import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    if (session.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const body = await request.json() as {
      nome?: string;
      configuracoes?: Record<string, unknown>;
    };

    const updates: Record<string, unknown> = {};

    if (body.nome !== undefined) {
      updates.nome = body.nome;
    }

    if (body.configuracoes !== undefined) {
      // Merge configuracoes fields
      for (const [key, value] of Object.entries(body.configuracoes)) {
        updates[`configuracoes.${key}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ ok: true });
    }

    await adminDb.collection("orgs").doc(session.orgId).update(updates);

    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "org_atualizada",
      detalhes: { changes: Object.keys(updates) },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/dashboard/org]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
