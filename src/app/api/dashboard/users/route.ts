import { adminAuth, adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    if (session.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection("users")
      .where("org_id", "==", session.orgId)
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        email: data.email,
        role: data.role,
        ativo: data.ativo,
        criado_em: data.criado_em?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    return Response.json({ users });
  } catch (err) {
    console.error("[GET /api/dashboard/users]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    if (session.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const body = await request.json() as {
      email?: string;
      nome?: string;
      role?: Role;
      password?: string;
    };

    if (!body.email || !body.nome || !body.role) {
      return Response.json({ error: "email, nome e role são obrigatórios" }, { status: 400 });
    }

    const validRoles: Role[] = ["admin", "gestor", "auditor"];
    if (!validRoles.includes(body.role)) {
      return Response.json({ error: "role inválido" }, { status: 400 });
    }

    // Create user in Firebase Auth
    const firebaseUser = await adminAuth.createUser({
      email: body.email,
      displayName: body.nome,
      password: body.password ?? Math.random().toString(36).slice(2, 10) + "Aa1!",
      emailVerified: false,
    });

    // Create user document in Firestore
    const userRef = adminDb.collection("users").doc(firebaseUser.uid);
    await userRef.set({
      id: firebaseUser.uid,
      org_id: session.orgId,
      nome: body.nome,
      email: body.email,
      role: body.role,
      ativo: true,
      criado_em: FieldValue.serverTimestamp(),
    });

    await logAudit({
      orgId: session.orgId,
      userId: session.uid,
      acao: "user_criado",
      detalhes: { email: body.email, role: body.role },
    });

    return Response.json({ id: firebaseUser.uid, ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/dashboard/users]", err);
    return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
