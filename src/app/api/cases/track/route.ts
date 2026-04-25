import { adminDb } from "@/lib/firebase-admin/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const protocolo = request.nextUrl.searchParams.get("protocolo")?.trim();
  const org_id = request.nextUrl.searchParams.get("org_id")?.trim();

  if (!protocolo || !org_id) {
    return Response.json({ error: "protocolo e org_id obrigatórios" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("cases")
    .where("org_id", "==", org_id)
    .where("protocolo", "==", protocolo)
    .limit(1)
    .get();

  if (snapshot.empty) {
    // Não revelar se o protocolo existe ou não — mensagem genérica
    return Response.json({ found: false });
  }

  const data = snapshot.docs[0].data();

  // Retornar apenas campos necessários — nunca o conteúdo do relato
  return Response.json({
    found: true,
    case: {
      id: data.id as string,
      protocolo: data.protocolo as string,
      status: data.status as string,
      created_at: (data.created_at as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? null,
      historico: (data.historico as Array<{ acao: string; timestamp: unknown; detalhes?: string }> ?? []).map(
        (h) => ({
          acao: h.acao,
          timestamp: (h.timestamp as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? null,
          detalhes: h.detalhes ?? null,
        })
      ),
    },
  });
}
