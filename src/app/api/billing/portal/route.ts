import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";
import type { NextRequest } from "next/server";

interface AsaasPortalResponse {
  url?: string;
  errors?: { description: string }[];
}

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

  const asaasCustomerId = orgDoc.data()?.asaas_customer_id as string | undefined;
  if (!asaasCustomerId) {
    return Response.json({ error: "customer_not_found" }, { status: 404 });
  }

  if (!ASAAS_API_KEY) {
    return Response.json({ error: "Serviço de faturamento não configurado" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${ASAAS_BASE_URL}/v3/customerPortalUrl?customer=${encodeURIComponent(asaasCustomerId)}`,
      { headers: { access_token: ASAAS_API_KEY } }
    );

    if (!res.ok) {
      console.error("[/api/billing/portal] Asaas error:", res.status);
      return Response.json({ error: "Falha ao obter URL do portal" }, { status: 502 });
    }

    const data = (await res.json()) as AsaasPortalResponse;
    if (!data.url) {
      return Response.json({ error: "URL do portal não disponível" }, { status: 502 });
    }

    return Response.json({ url: data.url });
  } catch (err) {
    console.error("[/api/billing/portal]", err);
    return Response.json({ error: "Erro ao acessar portal de faturamento" }, { status: 500 });
  }
}
