import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId } = session;

    const snapshot = await adminDb
      .collection("notifications")
      .where("org_id", "==", orgId)
      .where("lida", "==", false)
      .get();

    return Response.json({ unreadCount: snapshot.size });
  } catch (err) {
    console.error("[GET /api/dashboard/notifications/count]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
