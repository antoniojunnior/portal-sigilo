import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { getSubscription } from "@/lib/asaas/getSubscription";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role !== "admin") {
    return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const orgDoc = await adminDb.collection("orgs").doc(session.orgId).get();
  if (!orgDoc.exists) return Response.json({ error: "Organização não encontrada" }, { status: 404 });

  const orgData = orgDoc.data()!;
  const customerId = orgData.asaas_customer_id as string | undefined;

  const firestoreFallback = () => {
    const dataRenovacao = (orgData.data_renovacao as { toDate?: () => Date } | undefined)?.toDate?.();
    return Response.json({
      source: "firestore",
      plano_ativo: orgData.plano_ativo as string,
      valor: null,
      ciclo: null,
      proximo_vencimento: dataRenovacao?.toISOString() ?? null,
      status: null,
      subscription_id: null,
    });
  };

  if (!customerId) return firestoreFallback();

  const sub = await getSubscription(customerId);
  if (!sub) return firestoreFallback();

  return Response.json(sub);
}
