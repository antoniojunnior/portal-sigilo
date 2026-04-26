"use client";

import { useState, useRef, useEffect } from "react";
import { Spinner } from "./Spinner";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  /** Context passed to the AI (e.g., current case summary) */
  context?: string;
  className?: string;
}

/** Slide-in AI assistant panel for the dashboard. Fase 6 wires this to Claude. */
export function AIAssistantPanel({ open, onClose, context, className = "" }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Olá. Sou o assistente de IA do Portal Sigilo. Como posso ajudar na análise deste caso?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Fase 3: replace with actual Claude API call via server action
    await new Promise((r) => setTimeout(r, 1200));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "O assistente de IA estará disponível na Fase 3. Por enquanto, esta é uma simulação.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] lg:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        aria-label="Assistente de IA"
        className={[
          "fixed right-0 top-0 bottom-0 z-[var(--z-overlay)] lg:z-[var(--z-raised)]",
          "flex flex-col bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-[var(--shadow-xl)]",
          "w-80 lg:w-72 xl:w-80",
          "transition-transform duration-[var(--duration-slow)] ease-[var(--easing-out)]",
          open ? "translate-x-0" : "translate-x-full",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-anon-pulse" aria-hidden />
            <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">Assistente IA</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Context */}
        {context && (
          <div className="px-4 py-3 bg-[var(--color-primary-surface)] border-b border-[var(--color-border)] flex-shrink-0">
            <p className="text-[var(--text-xs)] font-medium text-[var(--color-primary-dark)] mb-1">Contexto ativo</p>
            <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] line-clamp-2">{context}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-[var(--text-xs)] leading-relaxed",
                  msg.role === "user"
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-tr-sm"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-tl-sm border border-[var(--color-border)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Spinner size="xs" className="text-[var(--color-text-tertiary)]" />
                <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Analisando…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3">
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="ai-panel-input">Mensagem para o assistente</label>
            <textarea
              ref={inputRef}
              id="ai-panel-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Perguntar ao assistente…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--text-xs)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-50 max-h-24 overflow-y-auto"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="flex-shrink-0 w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center hover:bg-[var(--color-primary-dark)] disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            >
              <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M2 7l10-5-5 10V8L2 7z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
