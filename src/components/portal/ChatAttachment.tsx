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
      className={[
        "flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] border",
        error
          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-surface)] text-[var(--color-danger)]"
          : "border-[var(--color-border)] bg-[var(--color-bg-secondary)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="h-10 w-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <span className="flex-shrink-0 w-8 h-8 rounded bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-tertiary)]" aria-hidden>
          {file.type.startsWith("audio/") ? (
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 3l5 2v3l-5 2V3z"/><circle cx="4" cy="10" r="2"/><circle cx="14" cy="8" r="2"/>
            </svg>
          ) : file.type.startsWith("video/") ? (
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="1" y="3" width="10" height="10" rx="1.5"/><path d="M11 6l4-2v8l-4-2V6z"/>
            </svg>
          ) : file.type === "application/pdf" ? (
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6L9 1z"/><path d="M9 1v5h5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M14 8.5V11a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V5.5A3.5 3.5 0 0 1 5.5 2H9l5 4.5z" strokeLinecap="round"/>
            </svg>
          )}
        </span>
      )}
      <span className="truncate max-w-[160px]">
        {error ?? `${file.name} · ${sizeMB} MB`}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${file.name}`}
        className="ml-auto flex items-center justify-center w-6 h-6 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded transition-colors"
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  );
}
