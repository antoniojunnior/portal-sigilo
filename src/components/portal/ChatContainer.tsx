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
  progressStep?: number; // 0-3
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
    const validAttachments = attachments.filter((a) => !a.error);
    if (!text && validAttachments.length === 0) return;
    if (sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      autor: "denunciante",
      texto: text || `[${validAttachments.length} arquivo(s) anexado(s)]`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setSending(true);

    try {
      await onSendMessage(text, validAttachments.map((a) => a.file));
    } finally {
      setSending(false);
    }
  }

  function addMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  // Expor addMessage para o parent via ref seria ideal, mas para a Fase 2
  // o parent controla o fluxo via onSendMessage. Na Fase 3 isso evolui.
  void addMessage;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden />
          {badge}
        </span>

        {/* Barra de progresso */}
        <div className="flex items-center gap-1" role="progressbar" aria-label="Progresso do relato" aria-valuenow={progressStep} aria-valuemin={0} aria-valuemax={3}>
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= progressStep ? "bg-blue-500" : "bg-zinc-200"
                }`}
                title={step}
              />
              {i < STEPS.length - 1 && (
                <div className={`h-px w-2 ${i < progressStep ? "bg-blue-500" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-zinc-500">{STEPS[progressStep]}</span>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-zinc-50">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            autor={msg.autor}
            texto={msg.texto}
            timestamp={msg.timestamp}
          />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <span className="flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
            </span>
            <span>Processando…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        attachments={attachments}
        onAddAttachments={(newOnes) =>
          setAttachments((prev) => [...prev, ...newOnes].slice(0, 10))
        }
        onRemoveAttachment={(i) =>
          setAttachments((prev) => prev.filter((_, idx) => idx !== i))
        }
        disabled={disabled || sending}
      />
    </div>
  );
}
