"use client";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "application/pdf",
];
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface AttachmentPreview {
  file: File;
  previewUrl: string | null;
  error: string | null;
}

interface ChatAttachmentProps {
  attachment: AttachmentPreview;
  onRemove: () => void;
}

export function validateAttachment(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Tipo não permitido: ${file.type || "desconhecido"}. Use imagens, vídeos, áudios ou PDF.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

export function createPreview(file: File): AttachmentPreview {
  const error = validateAttachment(file);
  if (error) return { file, previewUrl: null, error };

  const previewUrl = file.type.startsWith("image/")
    ? URL.createObjectURL(file)
    : null;

  return { file, previewUrl, error: null };
}

export function ChatAttachment({ attachment, onRemove }: ChatAttachmentProps) {
  const { file, previewUrl, error } = attachment;
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
        error ? "border-red-200 bg-red-50 text-red-700" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="h-10 w-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <span className="text-xl flex-shrink-0" aria-hidden>
          {file.type.startsWith("audio/")
            ? "🎵"
            : file.type.startsWith("video/")
            ? "🎬"
            : file.type === "application/pdf"
            ? "📄"
            : "📎"}
        </span>
      )}
      <span className="truncate max-w-[160px]">
        {error ?? `${file.name} · ${sizeMB} MB`}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${file.name}`}
        className="ml-auto text-zinc-400 hover:text-zinc-700 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        ✕
      </button>
    </div>
  );
}
