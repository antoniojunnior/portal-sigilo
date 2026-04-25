import { adminDb } from "@/lib/firebase-admin/admin";
import { generateProtocol } from "@/lib/utils/protocol";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      org_id: string;
      unit_id?: string;
      canal_origem?: string;
      mensagens?: Array<{ autor: string; texto: string }>;
    };

    const { org_id, unit_id, mensagens = [] } = body;

    if (!org_id) {
      return Response.json({ error: "org_id obrigatório" }, { status: 400 });
    }

    // Verificar se org existe
    const orgDoc = await adminDb.collection("orgs").doc(org_id).get();
    if (!orgDoc.exists) {
      return Response.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const protocolo = await generateProtocol(org_id);
    const now = FieldValue.serverTimestamp();
    const ttl = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

    const caseRef = adminDb.collection("cases").doc();

    const caseData: Record<string, unknown> = {
      id: caseRef.id,
      org_id,
      protocolo,
      canal_origem: body.canal_origem ?? "web",
      status: "aguardando_triagem",
      created_at: now,
      ttl,
      historico: [
        {
          acao: "case_criado",
          timestamp: new Date(),
          detalhes: "Relato recebido via portal web.",
        },
      ],
      mencionados: [],
      anexos: [],
    };

    if (unit_id) caseData.unit_id = unit_id;

    const batch = adminDb.batch();
    batch.set(caseRef, caseData);

    // Gravar mensagens da conversa como messages separados
    for (const msg of mensagens) {
      const msgRef = adminDb.collection("messages").doc();
      batch.set(msgRef, {
        id: msgRef.id,
        case_id: caseRef.id,
        org_id,
        autor: msg.autor,
        texto: msg.texto,
        timestamp: new Date(),
        anexos: [],
      });
    }

    // Audit log
    const auditRef = adminDb.collection("audit_logs").doc();
    batch.set(auditRef, {
      id: auditRef.id,
      org_id,
      user_id: "sistema",
      acao: "case_criado",
      case_id: caseRef.id,
      detalhes: { protocolo, canal: "web" },
      timestamp: new Date(),
    });

    await batch.commit();

    return Response.json({ protocolo, case_id: caseRef.id });
  } catch (err) {
    console.error("[POST /api/cases]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
