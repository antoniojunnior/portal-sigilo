import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { getSubscription } from "@/lib/asaas/getSubscription";
import { cancelSubscription } from "@/lib/asaas/cancelSubscription";
import { logAudit } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";

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

  const customerId = orgDoc.data()?.asaas_customer_id as string | undefined;
  if (!customerId) {
    return Response.json({ error: "Nenhuma assinatura vinculada" }, { status: 400 });
  }

  const sub = await getSubscription(customerId);
  if (!sub?.subscription_id) {
    return Response.json({ error: "Assinatura ativa não encontrada" }, { status: 404 });
  }

  try {
    await cancelSubscription(sub.subscription_id);

    await adminDb.collection("orgs").doc(session.orgId).update({
      plano_ativo: "cancelado",
    });

    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "assinatura_cancelada",
      detalhes: { subscription_id: sub.subscription_id },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[/api/billing/cancel]", err);
    return Response.json({ error: "Falha ao cancelar assinatura" }, { status: 502 });
  }
}
