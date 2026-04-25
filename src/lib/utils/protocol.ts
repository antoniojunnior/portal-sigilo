import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";

function randomSuffix(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I/O/0/1 (confusos)
  let result = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const byte of bytes) {
    result += chars[byte % chars.length];
  }
  return result;
}

/** Gera protocolo único no formato ETK-YYYY-XXXXXX, verificando colisão. */
export async function generateProtocol(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const MAX_ATTEMPTS = 3;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const protocolo = `ETK-${year}-${randomSuffix()}`;
    const existing = await adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .where("protocolo", "==", protocolo)
      .limit(1)
      .get();

    if (existing.empty) return protocolo;
  }

  throw new Error("Falha ao gerar protocolo único após 3 tentativas.");
}
