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
 * BUG-20260723-DUP2 (regressão do BUG-20260723-DUP1): fecha a janela de corrida
 * (TOCTOU) entre o pré-check e o write final dentro de uma transação Firestore —
 * re-checa se outra requisição concorrente já criou um relatório compatível;
 * se sim, reaproveita o dela em vez de gravar um segundo documento para o
 * mesmo org+escopo+período. Depende dos índices compostos já presentes em
 * firestore.indexes.json (reports: org_id+dedup_key+gerado_em).
 */
export async function reserveReportSlot(
  orgId: string,
  dedupKey: string,
  windowMs: number,
  reportRef: FirebaseFirestore.DocumentReference,
  reportData: Record<string, unknown>
): Promise<ReserveReportSlotResult> {
  const cutoff = Timestamp.fromMillis(Date.now() - windowMs);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(
      adminDb
        .collection("reports")
        .where("org_id", "==", orgId)
        .where("dedup_key", "==", dedupKey)
        .where("gerado_em", ">=", cutoff)
        .limit(1)
    );

    if (!snap.empty) {
      return { reportId: snap.docs[0].id, deduplicated: true };
    }

    tx.set(reportRef, reportData);
    return { reportId: reportRef.id, deduplicated: false };
  });
}
