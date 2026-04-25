"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import type { AttachmentPreview } from "./ChatAttachment";

export interface ChatMessage {
  id: string;
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  timestamp?: string;
}

interface ChatContainerProps {
  initialMessages?: ChatMessage[];
  /** Substituído na Fase 3 pela chamada ao Claude via SSE. */
  onSendMessage: (text: string, attachments: File[]) => Promise<void>;
  disabled?: boolean;
  badge?: string;
  progressStep?: number; // 0–3
}

const STEPS = ["Início", "Detalhes", "Evidências", "Confirmação"];

export function ChatContainer({
  initialMessages = [],
  onSendMessage,
  disabled = false,
  badge = "Anônimo",
  progressStep = 0,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    const valid = attachments.filter((a) => !a.error);
    if (!text && valid.length === 0) return;
    if (sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      autor: "denunciante",
      texto: text || `[${valid.length} arquivo(s) anexado(s)]`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setSending(true);

    try {
      await onSendMessage(text, valid.map((a) => a.file));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#0F6E56" strokeWidth="1.8" aria-hidden>
              <path d="M8 2L4 5v4c0 2.5 1.8 4.7 4 5 2.2-.3 4-2.5 4-5V5L8 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-800 leading-none">Assistente de escuta</p>
            <p className="text-[11px] text-brand mt-0.5">Ativo · conversa anônima</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress steps */}
          <div className="hidden sm:flex items-center gap-1" role="progressbar" aria-label="Progresso" aria-valuenow={progressStep} aria-valuemin={0} aria-valuemax={3}>
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`h-1 w-7 rounded-full transition-colors duration-300 ${i <= progressStep ? "bg-brand" : "bg-slate-200"}`}
                  title={step}
                />
              </div>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-medium text-brand-darkest">
            {badge}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            autor={msg.autor}
            texto={msg.texto}
            timestamp={msg.timestamp}
          />
        ))}

        {sending && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-light flex items-center justify-center">
              <span className="block w-2 h-2 rounded-full bg-brand" />
            </div>
            <div className="bg-slate-100 border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        attachments={attachments}
        onAddAttachments={(n) => setAttachments((prev) => [...prev, ...n].slice(0, 10))}
        onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
        disabled={disabled || sending}
      />
    </div>
  );
}
