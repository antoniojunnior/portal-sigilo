"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Spinner } from "./Spinner";
import { AlertTriangle } from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  /** Human-readable context label shown in the panel header */
  context?: string;
  className?: string;
}

export function AIAssistantPanel({ open, onClose, caseId, context, className = "" }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Olá. Sou o assistente de compliance do Portal Sigilo. Como posso ajudar na análise deste caso?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullAccessGranted, setFullAccessGranted] = useState(false);
  const [showFullAccessModal, setShowFullAccessModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  const sendMessage = useCallback(async (text: string, grantFullAccess = false) => {
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date().toISOString() },
    ]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          includeFullReport: grantFullAccess || fullAccessGranted,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem corpo na resposta");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; content?: string; message?: string };
            if (event.type === "token" && event.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content! } : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: event.message ?? "Erro ao processar a resposta." }
                    : m
                )
              );
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Não foi possível processar sua solicitação. ${errMsg}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [messages, loading, caseId, fullAccessGranted]);

  function handleSend() {
    void sendMessage(input);
  }

  function handleConfirmFullAccess() {
    setShowFullAccessModal(false);
    setFullAccessGranted(true);
    void sendMessage(input || "Analise o relato completo e me oriente sobre as ações necessárias.", true);
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] lg:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}

      {/* Full access confirmation modal */}
      {showFullAccessModal && (
        <div className="fixed inset-0 z-[calc(var(--z-overlay)+10)] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFullAccessModal(false)} />
          <div className="relative z-10 bg-[var(--color-card)] rounded-2xl p-6 max-w-sm w-full shadow-[var(--shadow-xl)] border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-surface)] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-[var(--color-warning)]" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Conceder acesso ao relato</h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
              Isso concederá ao assistente acesso ao <strong>conteúdo completo do relato</strong>. Esta ação será registrada no log de auditoria.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFullAccessModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmFullAccess}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-warning)] text-white hover:opacity-90 transition-opacity"
              >
                Confirmar acesso
              </button>
            </div>
          </div>
        </div>
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
        ].filter(Boolean).join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-anon-pulse" aria-hidden />
            <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">Assistente IA</p>
            {fullAccessGranted && (
              <span className="text-[10px] font-bold bg-[var(--color-warning-surface)] text-[var(--color-warning)] px-1.5 py-0.5 rounded-full">
                Acesso total
              </span>
            )}
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

        {/* Opt-in full access */}
        {!fullAccessGranted && (
          <div className="px-4 py-2.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowFullAccessModal(true)}
              className="text-[10px] font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors underline underline-offset-2"
            >
              Conceder acesso ao relato completo
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[85%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-[var(--text-xs)] leading-relaxed",
                  msg.role === "user"
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-tr-sm"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-tl-sm border border-[var(--color-border)]",
                ].filter(Boolean).join(" ")}
              >
                {msg.content || (msg.role === "assistant" && loading ? null : msg.content)}
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
                  handleSend();
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
