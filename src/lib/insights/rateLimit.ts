import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { FieldValue } from "firebase-admin/firestore";

const HOURS_24 = 24 * 60 * 60 * 1000;

export function isRegenerationAllowed(lastGeneratedAt: Date | null, now: Date): boolean {
  if (!lastGeneratedAt) return true;
  return now.getTime() - lastGeneratedAt.getTime() >= HOURS_24;
}

export type RegenerationReservation =
  | { allowed: true }
  | { allowed: false; nextAllowedAt: string };

/**
 * BUG-20260722-TCT1: leitura de gerado_em e escrita do novo timestamp precisam
 * ser atômicas (Firestore transaction), senão duas chamadas concorrentes podem
 * ler o mesmo gerado_em antigo e ambas passarem pelo rate limit.
 */
export async function reserveRegenerationSlot(orgId: string): Promise<RegenerationReservation> {
  let result: RegenerationReservation = { allowed: true };

  await adminDb.runTransaction(async (tx) => {
    const orgRef = adminDb.collection("orgs").doc(orgId);
    const orgSnap = await tx.get(orgRef);
    const aiInsights = orgSnap.data()?.ai_insights as { gerado_em?: { toDate: () => Date } } | undefined;
    const lastGeneratedAt = aiInsights?.gerado_em?.toDate?.() ?? null;
    const now = new Date();

    if (!isRegenerationAllowed(lastGeneratedAt, now)) {
      const nextAllowed = lastGeneratedAt ? new Date(lastGeneratedAt.getTime() + HOURS_24) : new Date();
      result = { allowed: false, nextAllowedAt: nextAllowed.toISOString() };
      return;
    }

    tx.update(orgRef, {
      "ai_insights.gerado_em": FieldValue.serverTimestamp(),
      "ai_insights.pending": true,
    });
  });

  return result;
}
