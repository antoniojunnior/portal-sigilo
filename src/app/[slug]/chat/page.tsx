"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer, type ChatMessage } from "@/components/portal/ChatContainer";
import { AnonymousBadge } from "@/components/ui/AnonymousBadge";
import { PortalFooter } from "@/components/layout/PortalFooter";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import Link from "next/link";
import { UX_CONFIG } from "@/lib/config/ux";

const INITIAL_MESSAGE: ChatMessage = {
  id: "sys-0",
  autor: "sistema",
  texto:
    "Olá. Este é um espaço seguro e confidencial.\n\nPode me contar o que aconteceu com suas próprias palavras, no seu ritmo. Nenhuma informação que identifique você será solicitada ou armazenada.\n\nQuando quiser, é só começar.",
  textoJsx: (
    <>
      <p>Olá. Este é um espaço seguro e confidencial.</p>
      <p style={{ marginTop: "0.6rem" }}>
        Pode me contar o que aconteceu com suas próprias palavras, no seu ritmo.{" "}
        <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
          Nenhuma informação que identifique você será solicitada ou armazenada.
        </strong>
      </p>
      <p style={{ marginTop: "0.6rem" }}>Quando quiser, é só começar.</p>
    </>
  ),
  timestamp: new Date().toISOString(),
};

// Mensagem inicial que abre o histórico do Claude
const ASSISTANT_OPENING = INITIAL_MESSAGE.texto;

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

type SSEEvent =
  | { type: "token"; content: string }
  | { type: "case_created"; protocolo: string }
  | { type: "done" }
  | { type: "error"; message: string };

export default function Tela2() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgNome, setOrgNome] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  // UI messages (shown in chat bubbles)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  // History sent to Claude (excludes the static opening bubble)
  const claudeHistory = useRef<ClaudeMessage[]>([]);

  const [progressStep, setProgressStep] = useState(0);
  const [locked, setLocked] = useState(false);

  // Character-drain queue — simulates human typing cadence (~30ms/char ≈ 200 WPM)
  const pendingCharsRef = useRef<string[]>([]);
  const drainIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const drainDisplayRef = useRef<string>("");

  function stopDrain() {
    if (drainIntervalRef.current) {
      clearInterval(drainIntervalRef.current);
      drainIntervalRef.current = null;
    }
    pendingCharsRef.current = [];
    drainDisplayRef.current = "";
  }

  function startDrain(assistantId: string) {
    if (drainIntervalRef.current) return;
    drainIntervalRef.current = setInterval(() => {
      const char = pendingCharsRef.current.shift();
      if (char === undefined) return;
      drainDisplayRef.current += char;
      const snapshot = drainDisplayRef.current;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, texto: snapshot } : m))
      );
    }, UX_CONFIG.CHAT_TYPING_INTERVAL_MS);
  }

  useEffect(() => {
    setOrgId(sessionStorage.getItem("org_id"));
    setOrgNome(sessionStorage.getItem("org_nome"));
    setUnitId(sessionStorage.getItem("unit_id"));
  }, []);

  function handleReset() {
    stopDrain();
    setMessages([INITIAL_MESSAGE]);
    claudeHistory.current = [];
    setProgressStep(0);
    setLocked(false);
  }

  async function handleSendMessage(text: string, attachments: File[]) {
    if (!text.trim() || locked) return;

    setLocked(true);
    setProgressStep((prev) => prev + 1);

    // Add user bubble
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      autor: "denunciante",
      texto: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Upload attachments and collect references for context
    let attachmentContext = "";
    if (attachments.length > 0) {
      const uploaded: string[] = [];
      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("org_id", orgId ?? "");
          const res = await fetch("/api/upload-attachment", { method: "POST", body: fd });
          if (res.ok) {
            const data = await res.json() as { filename: string; mime_type: string };
            uploaded.push(`${data.filename} (${data.mime_type})`);
          }
        } catch {
          // Upload failure doesn't block the conversation
        }
      }
      if (uploaded.length > 0) {
        attachmentContext = `\n\n[Arquivos enviados: ${uploaded.join(", ")}]`;
      }
    }

    // Add user message to Claude history
    claudeHistory.current = [
      ...claudeHistory.current,
      { role: "user", content: text + attachmentContext },
    ];

    // Placeholder bubble for Claude's streaming response
    const assistantId = crypto.randomUUID();
    stopDrain();
    drainDisplayRef.current = "";
    setMessages((prev) => [
      ...prev,
      { id: assistantId, autor: "sistema", texto: "", timestamp: new Date().toISOString() },
    ]);

    // Build history sent to Claude — prepend assistant opening as first assistant turn
    const historyToSend: ClaudeMessage[] =
      claudeHistory.current.length === 1
        ? [
            { role: "assistant", content: ASSISTANT_OPENING },
            ...claudeHistory.current,
          ]
        : claudeHistory.current;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyToSend,
          org_id: orgId,
          unit_id: unitId ?? undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Falha na conexão com o servidor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(raw) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "token") {
            assistantText += event.content;
            // Push chars to drain queue; drain interval controls display speed
            pendingCharsRef.current.push(...event.content.split(""));
            startDrain(assistantId);
          } else if (event.type === "case_created") {
            // Drain remaining chars immediately then redirect
            stopDrain();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, texto: assistantText } : m
              )
            );
            claudeHistory.current = [
              ...claudeHistory.current,
              { role: "assistant", content: assistantText },
            ];
            router.push(`/${slug}/confirmacao?protocolo=${encodeURIComponent(event.protocolo)}`);
            return;
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, texto: event.message }
                  : m
              )
            );
            setLocked(false);
            return;
          }
        }
      }

      // Wait for drain queue to empty before saving history and unlocking
      await new Promise<void>((resolve) => {
        const check = () => {
          if (pendingCharsRef.current.length === 0) { resolve(); }
          else { setTimeout(check, 40); }
        };
        check();
      });
      stopDrain();

      claudeHistory.current = [
        ...claudeHistory.current,
        { role: "assistant", content: assistantText },
      ];
    } catch (err) {
      stopDrain();
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, texto: `Ocorreu um erro: ${msg} Tente novamente.` }
            : m
        )
      );
    } finally {
      setLocked(false);
    }
  }

  if (!orgId) {
    return (
      <div data-portal className="min-h-dvh flex items-center justify-center p-4" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-12 h-12 rounded-full bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/20 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" aria-hidden>
              <path d="M8 1L1 13h14L8 1z" strokeLinejoin="round"/>
              <path d="M8 6v3M8 11v.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Selecione uma empresa antes de continuar.</p>
          <a
            href="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] transition-colors"
            style={{
              borderRadius: "var(--radius-md)",
              background: "#2A6070",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: "white",
              textDecoration: "none",
            }}
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div data-portal className="flex flex-col h-dvh" style={{ background: "var(--color-bg-secondary)" }}>

      {/* Topbar */}
      <header
        className="bg-[var(--color-card)] flex-shrink-0 sticky top-0 z-[var(--z-sticky)]"
        style={{
          minHeight: 52,
          borderBottom: "0.5px solid var(--color-border)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between h-full min-h-[52px] gap-3"
          style={{ maxWidth: 580, padding: "0 1.25rem" }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href={`/${slug}`}
              className="flex items-center flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
              style={{ gap: 5, fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none" }}
              aria-label="Voltar para a página do canal"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M10 3L5 8l5 5"/>
              </svg>
              Voltar
            </Link>
            <span
              className="flex-shrink-0"
              style={{ width: 0.5, height: 20, background: "var(--color-border)" }}
              aria-hidden
            />
            <span className="flex sm:hidden flex-shrink-0">
              <LogoSigilo variant="icon" iconSize={22} />
            </span>
            <span className="hidden sm:flex items-center flex-shrink-0">
              <LogoSigilo iconSize={22} />
            </span>
            <span
              className="flex-shrink-0"
              style={{ width: 0.5, height: 20, background: "var(--color-border)" }}
              aria-hidden
            />
            <span
              className="truncate min-w-0"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}
            >
              canal de{" "}
              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {orgNome ?? slug}
              </span>
            </span>
          </div>

          <AnonymousBadge
            className="flex-shrink-0"
            aria-label="Conversa anônima — sua identidade não é registrada"
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        <ChatContainer
          messages={messages}
          onSendMessage={handleSendMessage}
          disabled={locked}
          progressStep={progressStep}
          onReset={handleReset}
        />
      </div>

      <PortalFooter />
    </div>
  );
}
