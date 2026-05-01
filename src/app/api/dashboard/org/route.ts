import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const orgDoc = await adminDb.collection("orgs").doc(session.orgId).get();
    if (!orgDoc.exists) return Response.json({ error: "Organização não encontrada" }, { status: 404 });

    const data = orgDoc.data()!;
    return Response.json({
      id: orgDoc.id,
      nome: data.nome,
      slug: data.slug,
      plano_ativo: data.plano_ativo,
      logo: data.logo ?? null,
      configuracoes: data.configuracoes ?? {},
    });
  } catch (err) {
    console.error("[GET /api/dashboard/org]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

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
