import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role === "auditor") {
    return Response.json({ error: "Auditores não podem aprovar relatórios." }, { status: 403 });
  }

  const { reportId } = await context.params;

  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (!reportDoc.exists) return Response.json({ error: "Relatório não encontrado" }, { status: 404 });

  const reportData = reportDoc.data()!;
  if (reportData.org_id !== session.orgId) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (reportData.status === "aprovado" || reportData.status === "exportado") {
    return Response.json({ error: "Relatório já está aprovado." }, { status: 409 });
  }

  await adminDb.collection("reports").doc(reportId).update({
    status: "aprovado",
    aprovado: true,
    aprovado_por: session.uid,
    aprovado_em: FieldValue.serverTimestamp(),
  });

  await logAudit({
    orgId: session.orgId,
    userId: session.uid,
    acao: "report_approved",
    detalhes: { reportId },
  });

  return Response.json({ ok: true, status: "aprovado" });
}

// Reverter para rascunho
export async function DELETE(request: NextRequest, context: RouteContext) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role !== "admin") {
    return Response.json({ error: "Apenas administradores podem reverter relatórios." }, { status: 403 });
  }

  const { reportId } = await context.params;

  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (!reportDoc.exists) return Response.json({ error: "Relatório não encontrado" }, { status: 404 });

  const reportData = reportDoc.data()!;
  if (reportData.org_id !== session.orgId) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  await adminDb.collection("reports").doc(reportId).update({
    status: "rascunho",
    aprovado: false,
    aprovado_por: null,
    aprovado_em: null,
  });

  await logAudit({
    orgId: session.orgId,
    userId: session.uid,
    acao: "report_reverted",
    detalhes: { reportId },
  });

  return Response.json({ ok: true, status: "rascunho" });
}
