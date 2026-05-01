import "server-only";
import { adminDb, adminStorage } from "@/lib/firebase-admin/admin";
import { fileTypeFromBuffer } from "file-type";
import type { NextRequest } from "next/server";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "application/pdf",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const org_id = formData.get("org_id") as string | null;

  if (!file || !org_id) {
    return Response.json({ error: "file e org_id são obrigatórios" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Arquivo muito grande. Tamanho máximo: 50 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Detecta mime type real pelos bytes — nunca confiar no Content-Type do client (S7)
  const detected = await fileTypeFromBuffer(buffer);
  const mimeType = detected?.mime ?? null;

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    const auditRef = adminDb.collection("audit_logs").doc();
    void adminDb.collection("audit_logs").doc(auditRef.id).set({
      id: auditRef.id,
      org_id,
      user_id: "sistema",
      acao: "upload_rejeitado",
      detalhes: {
        filename: file.name,
        size: file.size,
        claimed_type: file.type,
        detected_type: mimeType,
      },
      timestamp: new Date(),
    });

    return Response.json(
      { error: `Tipo de arquivo não permitido: ${mimeType ?? "desconhecido"}.` },
      { status: 400 }
    );
  }

  const uuid = crypto.randomUUID();
  const ext = detected!.ext;
  const safeFilename = `${uuid}.${ext}`;
  const storagePath = `orgs/${org_id}/cases/temp/${uuid}/${safeFilename}`;

  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(storagePath);
  await fileRef.save(buffer, {
    metadata: { contentType: mimeType },
  });

  // Audit log do upload aceito
  const auditRef = adminDb.collection("audit_logs").doc();
  void adminDb.collection("audit_logs").doc(auditRef.id).set({
    id: auditRef.id,
    org_id,
    user_id: "sistema",
    acao: "upload_aceito",
    detalhes: {
      original_filename: file.name,
      storage_path: storagePath,
      mime_type: mimeType,
      size: file.size,
    },
    timestamp: new Date(),
  });

  return Response.json({
    storage_path: storagePath,
    filename: safeFilename,
    mime_type: mimeType,
    size: file.size,
  });
}
