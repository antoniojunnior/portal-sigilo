"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatBubble } from "@/components/portal/ChatBubble";
import { AnonymousBadge } from "@/components/ui/AnonymousBadge";
import { PortalFooter } from "@/components/layout/PortalFooter";
import { AcompanharForm } from "../AcompanharForm";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  aguardando_triagem: "Aguardando triagem",
  em_apuracao: "Em apuração",
  pendente_informacao: "Pendente de informação",
  encerrado_sem_infracao: "Encerrado — sem infração",
  encerrado_com_acao: "Encerrado com ação",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  aguardando_triagem: {
    background: "rgba(186,117,23,0.10)",
    border: "0.5px solid rgba(186,117,23,0.25)",
    color: "#854F0B",
  },
  em_apuracao: {
    background: "rgba(42,96,112,0.10)",
    border: "0.5px solid rgba(42,96,112,0.25)",
    color: "#1a4a58",
  },
  pendente_informacao: {
    background: "rgba(192,90,74,0.10)",
    border: "0.5px solid rgba(192,90,74,0.25)",
    color: "#7a2a1a",
  },
  encerrado_sem_infracao: {
    background: "rgba(29,158,117,0.10)",
    border: "0.5px solid rgba(29,158,117,0.25)",
    color: "#0a4a35",
  },
  encerrado_com_acao: {
    background: "rgba(29,158,117,0.10)",
    border: "0.5px solid rgba(29,158,117,0.25)",
    color: "#0a4a35",
  },
};

interface CaseData {
  id: string;
  protocolo: string;
  status: string;
  created_at: string | null;
  historico: Array<{ acao: string; timestamp: string | null; detalhes?: string | null }>;
}

interface MessageData {
  id: string;
  autor: string;
  texto: string;
  seq: number | null;
  timestamp: string | null;
}

export default function Tela4() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const initialProtocolo = searchParams.get("protocolo") ?? "";

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgNome, setOrgNome] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setOrgId(sessionStorage.getItem("org_id"));
    setOrgNome(sessionStorage.getItem("org_nome"));
  }, []);

  const loadCase = useCallback(async (protocolo: string, oId: string) => {
    try {
      const res = await fetch(
        `/api/cases/track?protocolo=${encodeURIComponent(protocolo)}&org_id=${encodeURIComponent(oId)}`
      );
      const data = await res.json() as { found: boolean; case?: CaseData };
      if (!data.found) {
        setError("Protocolo não encontrado. Verifique o número e tente novamente.");
        setCaseData(null);
        return;
      }
      // Sort chronologically — seq tiebreaks equal timestamps, nulls go last
      const sortByTimestamp = <T extends { timestamp: string | null; seq?: number | null }>(arr: T[]): T[] =>
        [...arr].sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : Infinity;
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;
          if (ta !== tb) return ta - tb;
          return (a.seq ?? 0) - (b.seq ?? 0);
        });

      const caseWithSortedHistory: CaseData = {
        ...data.case!,
        historico: sortByTimestamp(data.case!.historico),
      };
      setCaseData(caseWithSortedHistory);
      setError(null);

      const msgRes = await fetch(
        `/api/messages?case_id=${encodeURIComponent(data.case!.id)}&org_id=${encodeURIComponent(oId)}`
      );
      const msgData = await msgRes.json() as { messages: MessageData[] };
      setMessages(sortByTimestamp(msgData.messages ?? []));
    } catch {
      setError("Erro ao carregar. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    if (initialProtocolo && orgId) {
      setLoading(true);
      loadCase(initialProtocolo, orgId).finally(() => setLoading(false));
    }
  }, [initialProtocolo, orgId, loadCase]);

  useEffect(() => {
    if (!caseData || !orgId) return;
    intervalRef.current = setInterval(() => void loadCase(caseData.protocolo, orgId), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [caseData, orgId, loadCase]);

  async function handleSend() {
    if (!caseData || !orgId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseData.id, org_id: orgId, texto: input.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao enviar mensagem.");
      setInput("");
      await loadCase(caseData.protocolo, orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  const defaultStatusStyle: React.CSSProperties = {
    background: "var(--color-bg-secondary)",
    border: "0.5px solid var(--color-border)",
    color: "var(--color-text-tertiary)",
  };

  return (
    <div data-portal className="flex flex-col min-h-dvh" style={{ background: "var(--color-bg-tertiary)" }}>

      {/* Topbar — mesma estrutura das Telas 1, 3 */}
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
          {/* Left: back + logo + divider + org */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href={`/${slug}`}
              className="flex items-center flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
              style={{ gap: 5, fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none" }}
              aria-label="Voltar para a página do canal"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M10 3L5 8l5 5" />
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

          {/* Right: badge */}
          <AnonymousBadge className="flex-shrink-0" />
        </div>
      </header>

      {/* ── ESTADO A: busca por protocolo ── */}
      {!caseData && (
        <main className="flex-1 flex flex-col">
          <div
            className="mx-auto w-full flex flex-col"
            style={{ maxWidth: 480, padding: "2.5rem 1.25rem 2rem", gap: "1.5rem", flex: 1 }}
          >
            {/* Hero */}
            <div style={{ textAlign: "center" }}>
              <div
                aria-hidden
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "rgba(42,96,112,0.08)",
                  border: "0.5px solid rgba(42,96,112,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", marginBottom: "1rem",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 2" />
                  <line x1="13" y1="13" x2="18" y2="18" />
                </svg>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)", marginBottom: "0.4rem" }}>
                Acompanhar meu relato
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                Digite o número de protocolo recebido ao registrar seu relato.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-tertiary)", justifyContent: "center" }}>
                <svg className="animate-spin" viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="#2A6070" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Carregando…
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  background: "rgba(226,75,74,0.08)",
                  border: "0.5px solid rgba(226,75,74,0.20)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.625rem 0.875rem",
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 12, color: "#b83c3b",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="5" x2="8" y2="8.5" />
                  <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                </svg>
                {error}
              </div>
            )}

            {/* Search card */}
            <div
              style={{
                background: "var(--color-card)",
                border: "0.5px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.125rem",
                display: "flex", flexDirection: "column", gap: "0.75rem",
              }}
            >
              <label
                htmlFor="protocolo-acompanhar"
                style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
              >
                Número de protocolo
              </label>
              <AcompanharForm slug={slug} inputId="protocolo-acompanhar" variant="primary" />
            </div>

            {/* Anonymity anchor */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-text-tertiary)", flexShrink: 0 }} aria-hidden />
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Sua identidade não está sendo registrada
              </span>
            </div>
          </div>

          <PortalFooter />
        </main>
      )}

      {/* ── ESTADO B: protocolo carregado ── */}
      {caseData && (
        <main className="flex-1 flex flex-col">

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(226,75,74,0.08)",
                borderBottom: "0.5px solid rgba(226,75,74,0.20)",
                padding: "0.625rem 1.25rem",
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 12, color: "#b83c3b",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <circle cx="8" cy="8" r="6.5" />
                <line x1="8" y1="5" x2="8" y2="8.5" />
                <circle cx="8" cy="11" r="0.5" fill="currentColor" />
              </svg>
              Erro ao carregar. Tente novamente.
            </div>
          )}

          {/* Content area */}
          <div
            className="mx-auto w-full"
            style={{ maxWidth: 580, padding: "1.25rem 1.25rem 0", flex: 1 }}
          >
            {/* Main card */}
            <div
              style={{
                background: "var(--color-card)",
                border: "0.5px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              {/* Card header: protocolo + status badge */}
              <div
                style={{
                  padding: "0.875rem 1rem",
                  borderBottom: "0.5px solid var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14, fontWeight: 500,
                    color: "#2A6070",
                    letterSpacing: "0.03em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {caseData.protocolo}
                </span>
                <span
                  role="status"
                  style={{
                    fontSize: 11, fontWeight: 500,
                    padding: "3px 10px", borderRadius: 99,
                    ...(STATUS_STYLE[caseData.status] ?? defaultStatusStyle),
                  }}
                >
                  {STATUS_LABEL[caseData.status] ?? caseData.status}
                </span>
              </div>

              {/* Meta: registration date */}
              {caseData.created_at && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "0.5px solid var(--color-border)",
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Registrado em{" "}
                  {new Date(caseData.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </div>
              )}

              {/* Histórico */}
              {caseData.historico.length > 0 && (
                <div style={{ padding: "0.875rem 1rem", borderBottom: "0.5px solid var(--color-border)" }}>
                  <p
                    style={{
                      fontSize: 10, fontWeight: 500,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Histórico
                  </p>
                  <ol style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 }}>
                    {caseData.historico.map((h, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span
                          style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "var(--color-border-strong)",
                            flexShrink: 0, marginTop: 4,
                          }}
                          aria-hidden
                        />
                        <div>
                          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                            {h.detalhes ?? h.acao}
                          </span>
                          {h.timestamp && (
                            <span style={{ display: "block", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                              {new Date(h.timestamp).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Messages section */}
              <div style={{ padding: "0.875rem 1rem", borderBottom: "0.5px solid var(--color-border)" }}>
                <p
                  style={{
                    fontSize: 10, fontWeight: 500,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    color: "var(--color-text-tertiary)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Mensagens do comitê
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {messages.length === 0 ? (
                    <p
                      style={{
                        fontSize: 12, color: "var(--color-text-tertiary)",
                        textAlign: "center", padding: "1rem 0", lineHeight: 1.5,
                      }}
                    >
                      Nenhuma mensagem ainda. O comitê pode enviar perguntas aqui.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        autor={
                          msg.autor === "gestor" ? "gestor"
                            : msg.autor === "denunciante" ? "denunciante"
                              : "sistema"
                        }
                        texto={msg.texto}
                        timestamp={msg.timestamp ?? undefined}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reply input */}
          <div style={{ background: "var(--color-card)", borderTop: "0.5px solid var(--color-border)" }}>
            <div
              style={{
                maxWidth: 580, margin: "0 auto",
                padding: "0.625rem 1rem",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Escreva no seu ritmo..."
                disabled={sending}
                aria-label="Escrever mensagem para o comitê"
                className="focus:outline-none"
                style={{
                  flex: 1, height: 38, padding: "0 12px",
                  border: "0.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2A6070";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.10)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                aria-label="Enviar mensagem"
                style={{
                  width: 38, height: 38,
                  background: "#2A6070",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  opacity: sending || !input.trim() ? 0.5 : 1,
                  transition: "opacity 0.15s, background 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!sending && input.trim()) e.currentTarget.style.background = "#235260";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2A6070";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <polyline points="9 3 14 8 9 13" />
                </svg>
              </button>
            </div>

            {/* Anonymity anchor */}
            <div style={{ padding: "0 1rem 0.625rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-text-tertiary)", flexShrink: 0 }} aria-hidden />
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Sua identidade não está sendo registrada nesta conversa
              </span>
            </div>
          </div>

          {/* Auto-refresh bar */}
          <div
            style={{
              padding: "0.5rem 1rem",
              borderTop: "0.5px solid var(--color-border)",
              background: "var(--color-card)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <svg
              width="11" height="11" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ color: "var(--color-text-tertiary)" }}
              aria-hidden
            >
              <path d="M1 8a7 7 0 107-7" />
              <polyline points="1 1 1 8 8 8" />
            </svg>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Atualiza automaticamente a cada 30 segundos
            </span>
          </div>

          <PortalFooter />
        </main>
      )}
    </div>
  );
}
