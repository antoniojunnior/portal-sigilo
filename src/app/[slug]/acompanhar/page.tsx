"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatBubble } from "@/components/portal/ChatBubble";
import { ChatInput } from "@/components/portal/ChatInput";
import type { AttachmentPreview } from "@/components/portal/ChatAttachment";
import { AcompanharForm } from "../AcompanharForm";

const STATUS_LABEL: Record<string, string> = {
  aguardando_triagem: "Aguardando triagem",
  em_apuracao: "Em apuração",
  pendente_informacao: "Pendente de informação",
  encerrado_sem_infracao: "Encerrado — sem infração",
  encerrado_com_acao: "Encerrado com ação",
};

const STATUS_COLOR: Record<string, string> = {
  aguardando_triagem: "bg-yellow-100 text-yellow-700",
  em_apuracao: "bg-blue-100 text-blue-700",
  pendente_informacao: "bg-orange-100 text-orange-700",
  encerrado_sem_infracao: "bg-zinc-100 text-zinc-600",
  encerrado_com_acao: "bg-green-100 text-green-700",
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
  timestamp: string | null;
}

export default function Tela4() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const initialProtocolo = searchParams.get("protocolo") ?? "";

  const [orgId, setOrgId] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setOrgId(sessionStorage.getItem("org_id"));
  }, []);

  const loadCase = useCallback(
    async (protocolo: string, oId: string) => {
      try {
        const res = await fetch(
          `/api/cases/track?protocolo=${encodeURIComponent(protocolo)}&org_id=${encodeURIComponent(oId)}`
        );
        const data = await res.json() as { found: boolean; case?: CaseData };
        if (!data.found) {
          setError(
            "Protocolo não encontrado. Verifique o número e tente novamente."
          );
          setCaseData(null);
          return;
        }
        setCaseData(data.case!);
        setError(null);

        // Carregar mensagens
        const msgRes = await fetch(
          `/api/messages?case_id=${encodeURIComponent(data.case!.id)}&org_id=${encodeURIComponent(oId)}`
        );
        const msgData = await msgRes.json() as { messages: MessageData[] };
        setMessages(msgData.messages ?? []);
      } catch {
        setError("Erro ao carregar. Tente novamente.");
      }
    },
    []
  );

  // Busca inicial se protocolo na URL
  useEffect(() => {
    if (initialProtocolo && orgId) {
      setLoading(true);
      loadCase(initialProtocolo, orgId).finally(() => setLoading(false));
    }
  }, [initialProtocolo, orgId, loadCase]);

  // Polling 30s
  useEffect(() => {
    if (!caseData || !orgId) return;
    intervalRef.current = setInterval(() => {
      void loadCase(caseData.protocolo, orgId);
    }, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [caseData, orgId, loadCase]);

  async function handleSend() {
    if (!caseData || !orgId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseData.id,
          org_id: orgId,
          texto: input.trim(),
        }),
      });
      if (!res.ok) throw new Error("Erro ao enviar mensagem.");
      setInput("");
      setAttachments([]);
      await loadCase(caseData.protocolo, orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <a
            href={`/${slug}`}
            className="text-xs text-zinc-400 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            ← Voltar
          </a>
          <h1 className="text-xl font-semibold text-zinc-900">
            Acompanhar relato
          </h1>
        </div>

        {/* Formulário de busca */}
        {!caseData && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
            <p className="text-sm font-medium text-zinc-700">
              Digite seu protocolo:
            </p>
            <AcompanharForm slug={slug} />
          </div>
        )}

        {loading && (
          <p className="text-sm text-zinc-400 text-center" role="status">
            Carregando…
          </p>
        )}

        {error && (
          <div
            className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {caseData && (
          <>
            {/* Status */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-zinc-700">
                  {caseData.protocolo}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_COLOR[caseData.status] ?? "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {STATUS_LABEL[caseData.status] ?? caseData.status}
                </span>
              </div>

              {caseData.created_at && (
                <p className="text-xs text-zinc-400">
                  Registrado em{" "}
                  {new Date(caseData.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}

              {/* Histórico de movimentações */}
              {caseData.historico.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Histórico
                  </p>
                  <ol className="space-y-2">
                    {caseData.historico.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 h-2 w-2 rounded-full bg-zinc-300 flex-shrink-0" aria-hidden />
                        <span className="text-zinc-600">
                          {h.detalhes ?? h.acao}
                          {h.timestamp && (
                            <span className="ml-2 text-xs text-zinc-400">
                              {new Date(h.timestamp).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Chat com o comitê */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100">
                <p className="text-sm font-medium text-zinc-700">
                  Mensagens do comitê
                </p>
              </div>

              <div className="px-5 py-4 space-y-3 min-h-[120px] max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    Nenhuma mensagem ainda. O comitê pode enviar perguntas aqui.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      autor={
                        msg.autor === "gestor"
                          ? "gestor"
                          : msg.autor === "denunciante"
                          ? "denunciante"
                          : "sistema"
                      }
                      texto={msg.texto}
                      timestamp={msg.timestamp ?? undefined}
                    />
                  ))
                )}
              </div>

              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                attachments={attachments}
                onAddAttachments={(a) =>
                  setAttachments((prev) => [...prev, ...a].slice(0, 10))
                }
                onRemoveAttachment={(i) =>
                  setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                }
                disabled={sending}
              />
            </div>

            <p className="text-center text-xs text-zinc-400">
              Atualiza automaticamente a cada 30 segundos.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
