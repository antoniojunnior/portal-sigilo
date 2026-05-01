import { adminAuth } from "@/lib/firebase-admin/admin";
import { logAudit } from "@/lib/utils/audit";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

const SESSION_MAX_AGE = 5 * 24 * 60 * 60; // 5 days in seconds
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { idToken?: string };
    const { idToken } = body;

    if (!idToken) {
      return Response.json({ error: "idToken obrigatório" }, { status: 400 });
    }

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    // Try to log audit
    try {
      const session = await verifySession(sessionCookie);
      if (session) {
        await logAudit({
          orgId: session.orgId,
          userId: session.uid,
          acao: "user_login",
          detalhes: { email: session.email },
        });
      }
    } catch {
      // Non-critical — don't fail login
    }

    const response = Response.json({ ok: true });
    const headers = new Headers(response.headers);
    headers.set(
      "Set-Cookie",
      [
        `__session=${sessionCookie}`,
        `HttpOnly`,
        `Secure`,
        `SameSite=Strict`,
        `Path=/`,
        `Max-Age=${SESSION_MAX_AGE}`,
      ].join("; ")
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }
}
