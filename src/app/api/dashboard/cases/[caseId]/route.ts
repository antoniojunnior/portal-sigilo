import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import type { CaseStatus } from "@/lib/types";

interface RouteContext {
  params: Promise<{ caseId: string }>;
}

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" ? serializeDoc(item as Record<string, unknown>) : item
      );
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    const caseDoc = await adminDb.collection("cases").doc(caseId).get();
    if (!caseDoc.exists) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const caseData = caseDoc.data()!;

    if (caseData.org_id !== orgId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const mencionados: string[] = caseData.mencionados ?? [];
    if (mencionados.includes(uid)) {
      return Response.json({ error: "Você foi identificado como parte neste caso." }, { status: 403 });
    }

    await logAudit({
      orgId,
      userId: uid,
      acao: "case_viewed",
      caseId,
    });

    return Response.json({ id: caseDoc.id, ...serializeDoc(caseData) });
  } catch (err) {
    console.error("[GET /api/dashboard/cases/[caseId]]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    const caseDoc = await adminDb.collection("cases").doc(caseId).get();
    if (!caseDoc.exists) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const caseData = caseDoc.data()!;

    if (caseData.org_id !== orgId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const mencionados: string[] = caseData.mencionados ?? [];
    if (mencionados.includes(uid)) {
      return Response.json({ error: "Você foi identificado como parte neste caso." }, { status: 403 });
    }

    const body = await request.json() as {
      status?: CaseStatus;
      responsavel_id?: string;
      notas_internas?: string;
      prazo?: string;
    };

    const updates: Record<string, unknown> = {};
    const auditActions: Array<{ acao: string; detalhes?: Record<string, unknown> }> = [];

    if (body.status && body.status !== caseData.status) {
      updates.status = body.status;
      auditActions.push({
        acao: "case_status_changed",
        detalhes: { from: caseData.status, to: body.status },
      });
    }

    if (body.responsavel_id !== undefined && body.responsavel_id !== caseData.responsavel_id) {
      updates.responsavel_id = body.responsavel_id;
      auditActions.push({
        acao: "case_responsavel_changed",
        detalhes: { responsavel_id: body.responsavel_id },
      });
    }

    if (body.notas_internas !== undefined) {
      updates.notas_internas = body.notas_internas;
    }

    if (body.prazo !== undefined) {
      updates.prazo = new Date(body.prazo);
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ ok: true });
    }

    // Add historico entry
    const historicoItem: Record<string, unknown> = {
      acao: auditActions[0]?.acao ?? "case_atualizado",
      user_id: uid,
      timestamp: new Date(),
    };
    updates.historico = FieldValue.arrayUnion(historicoItem);

    await adminDb.collection("cases").doc(caseId).update(updates);

    for (const action of auditActions) {
      await logAudit({
        orgId,
        userId: uid,
        acao: action.acao,
        caseId,
        detalhes: action.detalhes,
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/dashboard/cases/[caseId]]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
