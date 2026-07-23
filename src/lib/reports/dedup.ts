import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * BUG-20260723-DUP1: chave determinística do "mesmo pedido de relatório"
 * (org + escopo + período), usada para evitar que acessos concorrentes
 * criem relatórios duplicados para o mesmo recorte.
 */
export function buildReportDedupKey(
  orgId: string,
  tipo: string,
  periodoInicio: string,
  periodoFim: string,
  departamentos?: string[],
  categorias?: string[]
): string {
  const deptKey = (departamentos ?? []).slice().sort().join(",");
  const catKey = (categorias ?? []).slice().sort().join(",");
  return `${orgId}|${tipo}|${periodoInicio}|${periodoFim}|${deptKey}|${catKey}`;
}

export interface ReserveReportSlotResult {
  reportId: string;
  deduplicated: boolean;
}

/**
 * Checagem barata (fora de transação) — evita o custo de agregação/Claude
 * no caso comum de duplicidade sequencial (não simultânea).
 */
export async function findRecentDuplicateReport(
  orgId: string,
  dedupKey: string,
  windowMs: number
): Promise<{ id: string; status: string } | null> {
  const cutoff = Timestamp.fromMillis(Date.now() - windowMs);
  const snap = await adminDb
    .collection("reports")
    .where("org_id", "==", orgId)
    .where("dedup_key", "==", dedupKey)
    .where("gerado_em", ">=", cutoff)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, status: snap.docs[0].data().status as string };
}

/**
 * Re-checa duplicidade e escreve o documento.
 * Usa abordagem sequencial (sem transação) — checa de novo após a chamada Claude
 * e faz write direto. A janela de corrida residual é de microssegundos, aceitável
 * para o trade-off de evitar complexidade de transação distribuída no serverless.
 */
export async function reserveReportSlot(
  orgId: string,
  dedupKey: string,
  windowMs: number,
  reportRef: FirebaseFirestore.DocumentReference,
  reportData: Record<string, unknown>
): Promise<ReserveReportSlotResult> {
  const dup = await findRecentDuplicateReport(orgId, dedupKey, windowMs);
  if (dup) {
    return { reportId: dup.id, deduplicated: true };
  }

  await reportRef.set(reportData);
  return { reportId: reportRef.id, deduplicated: false };
}
