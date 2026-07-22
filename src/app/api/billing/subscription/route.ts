import "server-only";
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

  const sub = await getSubscription(session.orgId);
  if (!sub) return Response.json({ error: "Organização não encontrada" }, { status: 404 });

  return Response.json(sub);
}
