import { adminDb } from "@/lib/firebase-admin/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return Response.json({ orgs: [] });
  }

  const lower = q.toLowerCase();

  // Firestore não tem full-text search. Usamos prefix query no campo nome_lower.
  // O campo nome_lower deve ser gravado ao criar/atualizar orgs.
  // Fallback: busca até 100 orgs e filtra em memória (suficiente para poucos tenants).
  const snapshot = await adminDb
    .collection("orgs")
    .orderBy("nome_lower")
    .limit(100)
    .get();

  const orgs = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome as string,
        slug: data.slug as string,
        logo: (data.logo as string | null) ?? null,
        plano_ativo: data.plano_ativo as string,
        nome_lower: ((data.nome_lower ?? data.nome ?? "") as string).toLowerCase(),
      };
    })
    .filter((org) => org.nome_lower.includes(lower))
    .slice(0, 10)
    .map(({ nome_lower: _nl, ...rest }) => rest);

  return Response.json({ orgs });
}
