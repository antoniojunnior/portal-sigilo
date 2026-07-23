import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { getInvoices } from "@/lib/asaas/getInvoices";
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
  if (!orgDoc.exists) return Response.json({ invoices: [] });

  const customerId = orgDoc.data()?.asaas_customer_id as string | undefined;
  if (!customerId) return Response.json({ invoices: [] });

  // BUG-20260723-ERR1: getInvoices agora propaga erro em vez de engolir —
  // distingue "org sem faturas" (array vazio, 200) de "falha ao buscar" (502).
  try {
    const invoices = await getInvoices(customerId);
    return Response.json({ invoices });
  } catch (err) {
    console.error("[GET /api/billing/invoices]", err);
    return Response.json({ error: "Não foi possível carregar as faturas. Tente novamente." }, { status: 502 });
  }
}
