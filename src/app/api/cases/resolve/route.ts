import { adminDb } from "@/lib/firebase-admin/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const protocolo = request.nextUrl.searchParams.get("protocolo")?.trim();

  if (!protocolo) {
    return Response.json({ error: "protocolo obrigatório" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("cases")
    .where("protocolo", "==", protocolo)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return Response.json({ found: false });
  }

  const orgId = snapshot.docs[0].data().org_id as string;

  const orgDoc = await adminDb.collection("orgs").doc(orgId).get();

  if (!orgDoc.exists) {
    return Response.json({ found: false });
  }

  const slug = orgDoc.data()?.slug as string;

  return Response.json({ found: true, slug, org_id: orgId });
}
