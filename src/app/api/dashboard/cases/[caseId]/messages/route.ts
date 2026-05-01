import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function checkCaseAccess(caseId: string, orgId: string, uid: string): Promise<{ allowed: boolean; error?: string; status?: number }> {
  const caseDoc = await adminDb.collection("cases").doc(caseId).get();
  if (!caseDoc.exists) return { allowed: false, error: "Caso não encontrado", status: 404 };

  const caseData = caseDoc.data()!;
  if (caseData.org_id !== orgId) return { allowed: false, error: "Acesso negado", status: 403 };

  const mencionados: string[] = caseData.mencionados ?? [];
  if (mencionados.includes(uid)) {
    return { allowed: false, error: "Você foi identificado como parte neste caso.", status: 403 };
  }

  return { allowed: true };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;
    const access = await checkCaseAccess(caseId, orgId, uid);
    if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });

    const snapshot = await adminDb
      .collection("messages")
      .where("case_id", "==", caseId)
      .where("org_id", "==", orgId)
      .orderBy("timestamp", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...serializeDoc(doc.data()),
    }));

    return Response.json({ messages });
  } catch (err) {
    console.error("[GET /api/dashboard/cases/[caseId]/messages]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;
    const access = await checkCaseAccess(caseId, orgId, uid);
    if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });

    const body = await request.json() as { texto?: string };
    if (!body.texto?.trim()) {
      return Response.json({ error: "texto obrigatório" }, { status: 400 });
    }

    const msgRef = adminDb.collection("messages").doc();
    await msgRef.set({
      id: msgRef.id,
      case_id: caseId,
      org_id: orgId,
      autor: "gestor",
      texto: body.texto.trim(),
      timestamp: FieldValue.serverTimestamp(),
      anexos: [],
    });

    await logAudit({
      orgId,
      userId: uid,
      acao: "message_sent",
      caseId,
    });

    return Response.json({ id: msgRef.id, ok: true });
  } catch (err) {
    console.error("[POST /api/dashboard/cases/[caseId]/messages]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
