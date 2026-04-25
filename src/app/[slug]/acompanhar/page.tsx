"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatBubble } from "@/components/portal/ChatBubble";
import { ChatInput } from "@/components/portal/ChatInput";
import type { AttachmentPreview } from "@/components/portal/ChatAttachment";
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

const STATUS_COLOR: Record<string, string> = {
  aguardando_triagem: "bg-amber-50 text-amber-700 border-amber-200",
  em_apuracao: "bg-blue-50 text-blue-700 border-blue-200",
  pendente_informacao: "bg-orange-50 text-orange-700 border-orange-200",
  encerrado_sem_infracao: "bg-slate-100 text-slate-600 border-slate-200",
  encerrado_com_acao: "bg-brand-light text-brand-darkest border-brand/20",
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
      setCaseData(data.case!);
      setError(null);

      const msgRes = await fetch(
        `/api/messages?case_id=${encodeURIComponent(data.case!.id)}&org_id=${encodeURIComponent(oId)}`
      );
      const msgData = await msgRes.json() as { messages: MessageData[] };
      setMessages(msgData.messages ?? []);
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
      setAttachments([]);
      await loadCase(caseData.protocolo, orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            href={`/${slug}`}
            className="text-[12px] text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded transition-colors"
          >
            ←
          </Link>
          <LogoSigilo iconSize={24} />
          <span className="text-[12px] text-slate-400">/ Acompanhar relato</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-0">

        {/* Search form (when no case loaded) */}
        {!caseData && (
          <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-6">
            <p className="text-[13px] font-medium text-slate-700 mb-3">
              Digite seu protocolo para acompanhar o relato:
            </p>
            <AcompanharForm slug={slug} />
          </div>
        )}

        {loading && (
          <div className="bg-white -mx-6 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <svg className="animate-spin" viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="#CBD5E1" strokeWidth="2"/>
                <path d="M14 8a6 6 0 0 0-6-6" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Carregando…
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-b border-red-200 -mx-6 px-6 py-4">
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}

        {caseData && (
          <>
            {/* Status card */}
            <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[13px] font-bold text-slate-800">
                  {caseData.protocolo}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                    STATUS_COLOR[caseData.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {STATUS_LABEL[caseData.status] ?? caseData.status}
                </span>
              </div>

              {caseData.created_at && (
                <p className="text-[11px] text-slate-400 mb-4">
                  Registrado em{" "}
                  {new Date(caseData.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              )}

              {caseData.historico.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    Histórico
                  </p>
                  <ol className="space-y-1.5">
                    {caseData.historico.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[12px]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" aria-hidden />
                        <span className="text-slate-600">
                          {h.detalhes ?? h.acao}
                          {h.timestamp && (
                            <span className="ml-2 text-[10px] text-slate-400">
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

            {/* Chat with committee */}
            <div className="bg-white border-b border-slate-200 -mx-6">
              <div className="px-6 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
                <p className="text-[12px] font-medium text-slate-700">Mensagens do comitê</p>
              </div>

              <div className="px-5 py-4 space-y-3 min-h-[100px] max-h-72 overflow-y-auto bg-[#F8FAFC]">
                {messages.length === 0 ? (
                  <p className="text-[12px] text-slate-400 py-4 text-center">
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

              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                attachments={attachments}
                onAddAttachments={(a) => setAttachments((prev) => [...prev, ...a].slice(0, 10))}
                onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={sending}
              />
            </div>

            <div className="bg-white -mx-6 px-6 py-3 text-center">
              <p className="text-[11px] text-slate-400">
                Atualiza automaticamente a cada 30 segundos.
              </p>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
