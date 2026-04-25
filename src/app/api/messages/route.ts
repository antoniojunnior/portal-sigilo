import { adminDb } from "@/lib/firebase-admin/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const case_id = request.nextUrl.searchParams.get("case_id")?.trim();
  const org_id = request.nextUrl.searchParams.get("org_id")?.trim();

  if (!case_id || !org_id) {
    return Response.json({ error: "case_id e org_id obrigatórios" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("messages")
    .where("case_id", "==", case_id)
    .where("org_id", "==", org_id)
    .orderBy("timestamp", "asc")
    .get();

  const messages = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      autor: d.autor as string,
      texto: d.texto as string,
      timestamp: (d.timestamp as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? null,
    };
  });

  return Response.json({ messages });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      case_id: string;
      org_id: string;
      texto: string;
    };

    const { case_id, org_id, texto } = body;

    if (!case_id || !org_id || !texto?.trim()) {
      return Response.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Verificar se o case pertence à org
    const caseDoc = await adminDb.collection("cases").doc(case_id).get();
    if (!caseDoc.exists || caseDoc.data()?.org_id !== org_id) {
      return Response.json({ error: "Caso não encontrado" }, { status: 404 });
    }

    const msgRef = adminDb.collection("messages").doc();
    await msgRef.set({
      id: msgRef.id,
      case_id,
      org_id,
      autor: "denunciante",
      texto: texto.trim(),
      timestamp: new Date(),
      anexos: [],
    });

    return Response.json({ id: msgRef.id });
  } catch (err) {
    console.error("[POST /api/messages]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
