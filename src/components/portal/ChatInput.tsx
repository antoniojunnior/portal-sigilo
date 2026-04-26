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
  onReset?: () => void;
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
  onReset,
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
    <div
      className="flex-shrink-0"
      style={{
        background: "var(--color-card)",
        borderTop: "0.5px solid var(--color-border)",
      }}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div
          className="flex flex-col gap-1 overflow-y-auto"
          style={{ maxHeight: 128, padding: "0.5rem 1.25rem 0" }}
        >
          {attachments.map((att, i) => (
            <ChatAttachment
              key={`${att.file.name}-${i}`}
              attachment={att}
              onRemove={() => onRemoveAttachment(i)}
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-center mx-auto w-full"
        style={{
          maxWidth: 640,
          padding: "0.5rem 1.25rem 0.625rem",
          gap: 8,
        }}
      >
        {/* Reset button */}
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || !onReset}
          aria-label="Recomeçar conversa"
          title="Recomeçar conversa"
          className="flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-30"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-md)",
            border: "0.5px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-bg-secondary)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-tertiary)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 8a7 7 0 107-7"/>
            <polyline points="1 1 1 8 8 8"/>
          </svg>
        </button>

        {/* Text area */}
        <label className="sr-only" htmlFor="chat-input">Mensagem</label>
        <textarea
          id="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Escreva no seu ritmo..."
          rows={1}
          aria-label="Mensagem"
          className="flex-1 resize-none focus:outline-none transition-colors disabled:opacity-60 overflow-y-auto"
          style={{
            minHeight: 40,
            maxHeight: 128,
            height: "auto",
            padding: "0 14px",
            border: "0.5px solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-secondary)",
            fontSize: 13,
            color: "var(--color-text-primary)",
            lineHeight: "40px",
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            const h = Math.min(el.scrollHeight, 128);
            el.style.height = `${h}px`;
            el.style.lineHeight = h > 40 ? "1.6" : "40px";
            el.style.padding = h > 40 ? "9px 14px" : "0 14px";
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#2A6070";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.10)";
            e.currentTarget.style.background = "var(--color-card)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background = "var(--color-bg-secondary)";
          }}
        />

        {/* Attach button */}
        <button
          type="button"
          aria-label="Anexar arquivo"
          disabled={disabled || attachments.length >= maxAttachments}
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-30"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            border: "0.5px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-bg-secondary)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-tertiary)";
          }}
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || (!value.trim() && attachments.every((a) => a.error))}
          aria-label="Enviar mensagem"
          className="flex-shrink-0 flex items-center justify-center transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-30"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "#2A6070",
            color: "white",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M2 8l12-6-6 12V9L2 8z" />
          </svg>
        </button>
      </div>

      {/* Anonymity anchor */}
      <div
        className="flex items-center justify-center mx-auto w-full"
        style={{
          padding: "0 1.25rem 0.75rem",
          gap: 5,
          maxWidth: 640,
        }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 5, height: 5, background: "var(--color-text-tertiary)" }}
          aria-hidden
        />
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Sua identidade não está sendo registrada nesta conversa
        </p>
      </div>
    </div>
  );
}
