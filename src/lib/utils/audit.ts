import "server-only";

import { adminDb } from "@/lib/firebase-admin/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function logAudit(params: {
  orgId: string;
  userId: string;
  acao: string;
  caseId?: string;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  try {
    const ref = adminDb.collection("audit_logs").doc();
    await ref.set({
      id: ref.id,
      org_id: params.orgId,
      user_id: params.userId,
      acao: params.acao,
      ...(params.caseId ? { case_id: params.caseId } : {}),
      ...(params.detalhes ? { detalhes: params.detalhes } : {}),
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[logAudit] Falha ao registrar audit log:", err);
  }
}
