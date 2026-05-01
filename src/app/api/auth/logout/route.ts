import { adminAuth } from "@/lib/firebase-admin/admin";
import { logAudit } from "@/lib/utils/audit";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;

    if (sessionCookie) {
      try {
        const session = await verifySession(sessionCookie);
        if (session) {
          await logAudit({
            orgId: session.orgId,
            userId: session.uid,
            acao: "user_logout",
          });
          // Revoke refresh tokens
          await adminAuth.revokeRefreshTokens(session.uid);
        }
      } catch {
        // Non-critical — proceed with logout
      }
    }

    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "__session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      },
    });

    return response;
  } catch (err) {
    console.error("[POST /api/auth/logout]", err);
    // Still clear cookie even on error
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "__session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      },
    });
  }
}
