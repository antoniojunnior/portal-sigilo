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
    <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-2">
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
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M14 8.5V11a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V5.5A3.5 3.5 0 0 1 5.5 2h.5"/>
            <path d="M10 1v6M7 4l3-3 3 3"/>
          </svg>
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
          placeholder="Escreva aqui…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:bg-white disabled:opacity-60 max-h-32 overflow-y-auto transition-colors"
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
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-dark disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M2 8l12-6-6 12V9L2 8z" />
          </svg>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        Sua identidade não está sendo registrada nesta conversa
      </p>
    </div>
  );
}
