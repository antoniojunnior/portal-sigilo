import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/types";

const PLAN_USER_LIMITS: Record<string, number | null> = {
  unico: 50,
};

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

    // Enforce plan user limit — Admin SDK bypasses Firestore Rules, so we check here
    const orgDoc = await adminDb.collection("orgs").doc(session.orgId).get();
    if (!orgDoc.exists) return Response.json({ error: "Organização não encontrada" }, { status: 404 });
    const orgData = orgDoc.data()!;
    // Fallback 0 (não 1) para plano_ativo fora do mapa (suspenso/cancelado) — bloqueia toda
    // criação, igual à Firestore Rule (BUG-20260721-R4T8: fallback 1 permitia 1 usuário indevido)
    const planLimit = PLAN_USER_LIMITS[orgData.plano_ativo as string] ?? 0;
    const usersCount = (orgData.users_count as number) ?? 0;
    if (planLimit !== null && usersCount >= planLimit) {
      return Response.json(
        { error: "user_limit_reached", plano: orgData.plano_ativo, limit: planLimit },
        { status: 403 }
      );
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

    await adminDb.collection("orgs").doc(session.orgId).update({
      users_count: FieldValue.increment(1),
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
