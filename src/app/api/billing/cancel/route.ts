import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";

/**
 * Cancela a assinatura de uma org: não depende de asaas_customer_id nem chama
 * nenhum endpoint da Asaas (D-10, corrige BUG-20260721-P2W5) — toda org com
 * plano_ativo diferente de suspenso/cancelado pode cancelar.
 */
export async function cancelarAssinatura(orgId: string, userId: string): Promise<void> {
  await adminDb.collection("orgs").doc(orgId).update({
    plano_ativo: "cancelado",
    renovacao_cancelada: true,
  });

  await logAudit({
    orgId,
    userId,
    acao: "assinatura_cancelada",
    detalhes: { motivo: "cancelamento_voluntario" },
  });
}

export async function DELETE(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role !== "admin") {
    return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const orgDoc = await adminDb.collection("orgs").doc(session.orgId).get();
  if (!orgDoc.exists) return Response.json({ error: "Organização não encontrada" }, { status: 404 });

  try {
    await cancelarAssinatura(session.orgId, session.uid);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[/api/billing/cancel]", err);
    return Response.json({ error: "Falha ao cancelar assinatura" }, { status: 502 });
  }
}
