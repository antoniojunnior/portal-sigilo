import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
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

  const data = orgDoc.data()!;

  const dataRenovacao = (data.data_renovacao as { toDate?: () => Date } | undefined)?.toDate?.();

  return Response.json({
    plano_ativo: data.plano_ativo as string,
    data_renovacao: dataRenovacao?.toISOString() ?? null,
    has_asaas_customer: !!data.asaas_customer_id,
  });
}
