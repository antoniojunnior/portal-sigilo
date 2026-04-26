"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import type { AttachmentPreview } from "./ChatAttachment";

export interface ChatMessage {
  id: string;
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  textoJsx?: React.ReactNode;
  timestamp?: string;
}

const STEP_LABELS = [
  "O que aconteceu",
  "Quando e onde",
  "Evidências",
  "Revisão",
];

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments: File[]) => Promise<void>;
  disabled?: boolean;
  progressStep?: number;
  quickReplies?: string[];
  onQuickReply?: (reply: string) => void;
  onReset?: () => void;
}

export function ChatContainer({
  messages,
  onSendMessage,
  disabled = false,
  progressStep = 0,
  quickReplies,
  onQuickReply,
  onReset,
}: ChatContainerProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    const valid = attachments.filter((a) => !a.error);
    if (!text && valid.length === 0) return;
    if (sending) return;

    if (!overrideText) {
      setInput("");
      setAttachments([]);
    }
    setSending(true);

    try {
      await onSendMessage(text, valid.map((a) => a.file));
    } finally {
      setSending(false);
    }
  }

  const totalSteps = 4;
  const progressPct = Math.round(((progressStep + 1) / totalSteps) * 100);
  const stepLabel = STEP_LABELS[Math.min(progressStep, STEP_LABELS.length - 1)];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Progress section */}
      <div
        className="flex-shrink-0"
        style={{
          background: "var(--color-card)",
          borderBottom: "0.5px solid var(--color-border)",
          padding: "0.625rem 1.25rem",
        }}
        role="progressbar"
        aria-label={`Etapa ${progressStep + 1} de ${totalSteps}`}
        aria-valuenow={progressStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "0.5rem" }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#2A6070" }}>
            Etapa {progressStep + 1} de {totalSteps}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{stepLabel}</span>
        </div>
        <div
          className="overflow-hidden"
          style={{ height: 3, background: "var(--color-bg-secondary)", borderRadius: 99 }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "#2A6070",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-[var(--color-bg-secondary)]">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            autor={msg.autor}
            texto={msg.texto}
            textoJsx={msg.textoJsx}
            timestamp={msg.timestamp}
          />
        ))}

        {sending && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center">
              <span className="block w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div
          className="flex-shrink-0 flex flex-wrap"
          style={{
            padding: "0.75rem 1.25rem 0.5rem",
            gap: 6,
            background: "var(--color-card)",
            borderTop: "0.5px solid var(--color-border)",
          }}
        >
          {quickReplies.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                onQuickReply?.(r);
                void handleSend(r);
              }}
              disabled={disabled || sending}
              className="transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-40"
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                padding: "5px 12px",
                border: "0.5px solid var(--color-border-strong)",
                borderRadius: 99,
                background: "var(--color-bg-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2A6070";
                e.currentTarget.style.color = "#2A6070";
                e.currentTarget.style.background = "rgba(42,96,112,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.background = "var(--color-bg-secondary)";
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => void handleSend()}
        onReset={onReset}
        attachments={attachments}
        onAddAttachments={(n) => setAttachments((prev) => [...prev, ...n].slice(0, 10))}
        onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
        disabled={disabled || sending}
      />
    </div>
  );
}
