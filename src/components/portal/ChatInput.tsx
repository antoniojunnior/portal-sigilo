"use client";

import { useRef } from "react";
import { ChatAttachment, createPreview, type AttachmentPreview } from "./ChatAttachment";

const ACCEPTED_MIME = [
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/quicktime",
  "audio/mpeg", "audio/ogg", "audio/webm",
  "application/pdf",
].join(",");

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  attachments: AttachmentPreview[];
  onAddAttachments: (previews: AttachmentPreview[]) => void;
  onRemoveAttachment: (index: number) => void;
  disabled?: boolean;
  maxAttachments?: number;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  disabled = false,
  maxAttachments = 10,
}: ChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = maxAttachments - attachments.length;
    const toAdd = Array.from(files).slice(0, remaining).map(createPreview);
    onAddAttachments(toAdd);
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-3 space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {attachments.map((att, i) => (
            <ChatAttachment
              key={`${att.file.name}-${i}`}
              attachment={att}
              onRemove={() => onRemoveAttachment(i)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="Anexar arquivo"
          disabled={disabled || attachments.length >= maxAttachments}
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 p-2 rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          📎
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPTED_MIME}
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>

        <label className="sr-only" htmlFor="chat-input">
          Digite sua mensagem
        </label>
        <textarea
          id="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-zinc-50 max-h-32 overflow-y-auto"
          style={{ height: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
          }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || (!value.trim() && attachments.every((a) => a.error))}
          aria-label="Enviar mensagem"
          className="flex-shrink-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 rotate-90"
            aria-hidden
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-zinc-400 text-center">
        Shift+Enter para quebrar linha · Máx. {maxAttachments} arquivos · 50 MB cada
      </p>
    </div>
  );
}
