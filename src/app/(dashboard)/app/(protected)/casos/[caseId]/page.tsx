"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { UrgencyIndicator } from "@/components/ui/UrgencyIndicator";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { AuditEntry } from "@/components/ui/AuditEntry";
import { AIAssistantPanel } from "@/components/ui/AIAssistantPanel";
import { Button } from "@/components/ui/Button";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Lock, Sparkles, Plus, ArrowLeft, Send, MessageSquare, History, Calendar, User, ShieldCheck, AlertCircle, Check, Paperclip, Download } from "lucide-react";
import type { CaseStatus, UrgenciaNivel, CanalOrigem, TriagemIA } from "@/lib/types";

interface Props {
  params: Promise<{ caseId: string }>;
}

interface AnexoData {
  id: string;
  nome: string;
  tipo: string;
  url?: string;
}

interface CaseData {
  id: string;
  protocolo: string;
  canal_origem: CanalOrigem;
  categoria?: string;
  urgencia?: UrgenciaNivel;
  status: CaseStatus;
  created_at: string;
  triagem_ia?: TriagemIA & { gerado_em: string };
  mencionados: string[];
  responsavel_id?: string;
  notas_internas?: string;
  prazo?: string;
  anexos?: AnexoData[];
}

interface MessageData {
  id: string;
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  timestamp: string;
}

interface AuditLogData {
  id: string;
  acao: string;
  user_id: string;
  timestamp: string;
  detalhes?: Record<string, unknown>;
}

interface UserOption {
  id: string;
  nome: string;
  email: string;
  role: string;
}

const STATUS_OPTIONS: { value: CaseStatus | ""; label: string }[] = [
  { value: "", label: "Selecionar status" },
  { value: "aguardando_triagem", label: "Aguardando triagem" },
  { value: "em_apuracao", label: "Em apuração" },
  { value: "pendente_informacao", label: "Pendente de informação" },
  { value: "encerrado_sem_infracao", label: "Encerrado — sem infração" },
  { value: "encerrado_com_acao", label: "Encerrado com ação" },
];

function buildTimelineSteps(status: CaseStatus) {
  return [
    {
      label: "Recebido",
      desc: "Relato registrado e triagem iniciada.",
      done: true,
      active: status === "aguardando_triagem",
    },
    {
      label: "Em apuração",
      desc: "Comitê conduz investigação.",
      done: ["em_apuracao", "pendente_informacao", "encerrado_sem_infracao", "encerrado_com_acao"].includes(status),
      active: status === "em_apuracao" || status === "pendente_informacao",
    },
    {
      label: "Conclusão",
      desc: "Resultado disponível pelo protocolo.",
      done: status === "encerrado_sem_infracao" || status === "encerrado_com_acao",
      active: status === "encerrado_sem_infracao" || status === "encerrado_com_acao",
    },
  ];
}

const ACAO_LABELS: Record<string, string> = {
  case_viewed: "Caso visualizado",
  case_status_changed: "Status alterado",
  case_responsavel_changed: "Responsável alterado",
  message_sent: "Mensagem enviada",
  mencionado_adicionado: "Parte identificada adicionada",
  case_criado: "Caso criado",
};

function formatAuditAction(acao: string, detalhes?: Record<string, unknown>): string {
  let label = ACAO_LABELS[acao] ?? acao;
  if (acao === "case_status_changed" && detalhes?.from && detalhes?.to) {
    label += `: ${detalhes.from} → ${detalhes.to}`;
  }
  return label;
}

function diasEmAberto(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

export default function CaseDetailPage({ params }: Props) {
  const { caseId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingResponsavel, setUpdatingResponsavel] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [prazoValue, setPrazoValue] = useState("");

  const [aiOpen, setAiOpen] = useState(false);
  const [mencionadoModalOpen, setMencionadoModalOpen] = useState(false);
  const [mencionadoUserId, setMencionadoUserId] = useState("");
  const [addingMencionado, setAddingMencionado] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}`);
      if (res.status === 403) {
        const data = await res.json() as { error: string };
        setAccessError(data.error);
        return;
      }
      if (!res.ok) return;
      const data = await res.json() as CaseData;
      setCaseData(data);
      setNotesValue(data.notas_internas ?? "");
      if (data.prazo) {
        setPrazoValue(new Date(data.prazo).toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error("[CaseDetail] fetchCase:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}/messages`);
      if (!res.ok) return;
      const data = await res.json() as { messages: MessageData[] };
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("[CaseDetail] fetchMessages:", err);
    }
  }, [caseId]);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}/audit`);
      if (!res.ok) return;
      const data = await res.json() as { logs: AuditLogData[] };
      setAuditLogs(data.logs ?? []);
    } catch (err) {
      console.error("[CaseDetail] fetchAudit:", err);
    }
  }, [caseId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/users");
      if (!res.ok) return;
      const data = await res.json() as { users: UserOption[] };
      setUsers(data.users ?? []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchCase();
    fetchMessages();
    fetchAudit();
    fetchUsers();

    pollTimerRef.current = setInterval(() => { fetchMessages(); }, 30_000);
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [fetchCase, fetchMessages, fetchAudit, fetchUsers]);

  // Scroll messages to bottom on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
        await fetchAudit();
      }
    } catch (err) {
      console.error("[CaseDetail] sendMessage:", err);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!newStatus || !caseData) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCaseData((prev) => prev ? { ...prev, status: newStatus as CaseStatus } : prev);
        await fetchAudit();
      }
    } catch (err) {
      console.error("[CaseDetail] statusChange:", err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleResponsavelChange(userId: string) {
    setUpdatingResponsavel(true);
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavel_id: userId || null }),
      });
      if (res.ok) {
        setCaseData((prev) => prev ? { ...prev, responsavel_id: userId || undefined } : prev);
        await fetchAudit();
      }
    } catch (err) {
      console.error("[CaseDetail] responsavelChange:", err);
    } finally {
      setUpdatingResponsavel(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/dashboard/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas_internas: notesValue }),
      });
    } catch (err) {
      console.error("[CaseDetail] saveNotes:", err);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSavePrazo() {
    if (!prazoValue) return;
    try {
      await fetch(`/api/dashboard/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prazo: new Date(prazoValue).toISOString() }),
      });
      setCaseData((prev) => prev ? { ...prev, prazo: new Date(prazoValue).toISOString() } : prev);
    } catch (err) {
      console.error("[CaseDetail] savePrazo:", err);
    }
  }

  async function handleAddMencionado() {
    if (!mencionadoUserId) return;
    setAddingMencionado(true);
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}/mencionados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mencionadoUserId }),
      });
      if (res.ok) {
        setCaseData((prev) =>
          prev ? { ...prev, mencionados: [...prev.mencionados, mencionadoUserId] } : prev
        );
        setMencionadoModalOpen(false);
        setMencionadoUserId("");
      }
    } catch (err) {
      console.error("[CaseDetail] addMencionado:", err);
    } finally {
      setAddingMencionado(false);
    }
  }

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const availableResponsavelOptions = [
    { value: "", label: "Sem responsável" },
    ...users
      .filter((u) => !caseData?.mencionados.includes(u.id))
      .map((u) => ({ value: u.id, label: `${u.nome} (${u.role})` })),
  ];

  const availableMencionadoOptions = [
    { value: "", label: "Selecionar usuário" },
    ...users
      .filter((u) => !caseData?.mencionados.includes(u.id) && u.id !== user?.uid)
      .map((u) => ({ value: u.id, label: `${u.nome} — ${u.email}` })),
  ];

  const prazoDate = prazoValue ? new Date(prazoValue) : null;
  const prazoNearby = prazoDate
    ? (prazoDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000) < 5
    : false;
  const prazoVencido = prazoDate ? prazoDate.getTime() < Date.now() : false;

  if (accessError) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-danger-surface)" }}>
            <Lock size={26} strokeWidth={1.5} color="var(--color-danger)" />
          </div>
          <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-2">Acesso restrito</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">{accessError}</p>
          <Button variant="secondary" onClick={() => router.push("/app/casos")} iconLeft={<ArrowLeft size={14} strokeWidth={1.5} />}>
            Voltar aos casos
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !caseData) {
    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Casos", href: "/app/casos" }, { label: "Carregando..." }]} />
        <PageContainer>
          <div className="space-y-4">
            <Skeleton height="120px" rounded="lg" />
            <Skeleton height="200px" rounded="lg" />
          </div>
        </PageContainer>
      </>
    );
  }

  const dias = diasEmAberto(caseData.created_at);

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Casos", href: "/app/casos" }, { label: caseData.protocolo }]}
      />

      <PageContainer className="overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Case header card */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded-lg border border-[var(--color-border)]">
                      {caseData.protocolo}
                    </p>
                  </div>
                  <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight">
                    {caseData.categoria ?? "Categoria não classificada"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {caseData.urgencia && <UrgencyIndicator level={caseData.urgencia} showLabel />}
                  <ChannelBadge channel={caseData.canal_origem} />
                </div>
              </div>

              {caseData.triagem_ia?.recomendacao && (
                <div className="bg-[var(--color-primary-surface)]/30 border-l-4 border-[var(--color-primary)] p-4 mb-6 rounded-r-xl">
                   <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed italic">
                    "{caseData.triagem_ia.recomendacao}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-[var(--color-border)]">
                <Badge variant="status" status={caseData.status} />
                <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                  <Calendar size={14} strokeWidth={1.5} />
                  <span>
                    Aberto em{" "}
                    {new Date(caseData.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
                <span
                  className="text-[var(--text-xs)] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{
                    background: dias > 30 ? "var(--color-danger-surface)" : "var(--color-bg-tertiary)",
                    color: dias > 30 ? "var(--color-danger)" : "var(--color-text-secondary)",
                  }}
                >
                  {dias > 30 ? <AlertCircle size={12} /> : null}
                  {dias} dias em aberto
                </span>
              </div>
            </div>

            {/* IA triage card */}
            {caseData.triagem_ia && (
              <div className="relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 shadow-sm">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)" }}
                    aria-hidden
                  >
                    <Sparkles size={16} strokeWidth={2} color="#fff" />
                  </div>
                  <h2 className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">Triagem por Inteligência Artificial</h2>
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  {caseData.triagem_ia.categoria && (
                    <div className="space-y-1">
                      <dt className="text-[var(--text-xs)] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">Categoria sugerida</dt>
                      <dd className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">{caseData.triagem_ia.categoria}</dd>
                    </div>
                  )}
                  {caseData.triagem_ia.subcategoria && (
                    <div className="space-y-1">
                      <dt className="text-[var(--text-xs)] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">Subcategoria</dt>
                      <dd className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">{caseData.triagem_ia.subcategoria}</dd>
                    </div>
                  )}
                  {caseData.triagem_ia.lei_aplicavel && (
                    <div className="space-y-1">
                      <dt className="text-[var(--text-xs)] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">Lei aplicável</dt>
                      <dd className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                        {Array.isArray(caseData.triagem_ia.lei_aplicavel)
                          ? caseData.triagem_ia.lei_aplicavel.join(", ")
                          : caseData.triagem_ia.lei_aplicavel}
                      </dd>
                    </div>
                  )}
                  {caseData.triagem_ia.area_risco && (
                    <div className="space-y-1">
                      <dt className="text-[var(--text-xs)] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">Área de risco</dt>
                      <dd className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">{caseData.triagem_ia.area_risco}</dd>
                    </div>
                  )}
                  {caseData.triagem_ia.urgencia && (
                    <div className="space-y-1">
                      <dt className="text-[var(--text-xs)] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)]">Urgência IA</dt>
                      <dd><UrgencyIndicator level={caseData.triagem_ia.urgencia} showLabel /></dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Messages / chat */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-[var(--color-primary)]" />
                  <h2 className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">
                    Mensagens com o denunciante
                  </h2>
                </div>
                <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] flex items-center gap-1.5 bg-[var(--color-bg-secondary)] px-2 py-1 rounded-lg">
                  <ShieldCheck size={14} />
                  Criptografia de ponta a ponta
                </div>
              </div>

              <div className="space-y-6 mb-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-3">
                      <MessageSquare size={20} className="text-[var(--color-text-tertiary)] opacity-50" />
                    </div>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] max-w-xs">
                      Nenhuma mensagem ainda. O denunciante será notificado por e-mail quando você enviar uma mensagem.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={["flex w-full", msg.autor === "gestor" ? "justify-end" : "justify-start"].join(" ")}
                    >
                      {msg.autor === "sistema" ? (
                        <div className="w-full flex justify-center my-2">
                          <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)]/50 rounded-full px-4 py-1 border border-[var(--color-border)]">
                            {msg.texto}
                          </span>
                        </div>
                      ) : (
                        <div className={["max-w-[85%] sm:max-w-[70%] group", msg.autor === "gestor" ? "items-end" : "items-start"].join(" ")}>
                          <div className={["flex items-center gap-2 mb-1 px-1", msg.autor === "gestor" ? "flex-row-reverse" : "flex-row"].join(" ")}>
                            <p className="text-[var(--text-2xs)] font-bold uppercase tracking-wider"
                              style={{ color: msg.autor === "gestor" ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>
                              {msg.autor === "gestor" ? "Canal de Ética" : "Denunciante"}
                            </p>
                            <span className="text-[10px] text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(msg.timestamp).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div
                            className={[
                              "rounded-2xl px-4 py-3 shadow-sm transition-all duration-200",
                              msg.autor === "gestor" 
                                ? "bg-[var(--color-primary)] text-white rounded-tr-none hover:shadow-md" 
                                : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-tl-none border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]"
                            ].join(" ")}
                          >
                            <p className="text-[var(--text-sm)] leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                            <div className={["flex items-center gap-1 mt-1.5 opacity-60 text-[10px]", msg.autor === "gestor" ? "justify-end" : "justify-start"].join(" ")}>
                              {new Date(msg.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="relative group">
                <textarea
                  placeholder="Escrever mensagem oficial ao denunciante…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }}
                  disabled={sendingMessage}
                  rows={2}
                  className="w-full rounded-2xl border border-[var(--color-border)] pl-4 pr-16 py-3 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 transition-all resize-none shadow-inner"
                />
                <div className="absolute right-2 bottom-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    loading={sendingMessage} 
                    disabled={!newMessage.trim()} 
                    onClick={handleSendMessage} 
                    className="h-10 w-10 rounded-xl !p-0 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={18} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Audit log */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <History size={18} className="text-[var(--color-text-secondary)]" />
                <h2 className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">
                  Log de auditoria
                </h2>
              </div>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 bg-[var(--color-bg-tertiary)]/50 rounded-xl border border-dashed border-[var(--color-border)]">
                  <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">Nenhum registro de atividade ainda.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {auditLogs.map((entry) => {
                    const actor = userMap[entry.user_id];
                    return (
                      <AuditEntry
                        key={entry.id}
                        action={formatAuditAction(entry.acao, entry.detalhes)}
                        user={actor ? `${actor.nome} (${actor.role})` : entry.user_id}
                        timestamp={entry.timestamp}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar column ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-5">

            {/* Timeline */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <History size={16} />
                Progresso do Caso
              </h2>
              <StatusTimeline steps={buildTimelineSteps(caseData.status)} />
            </div>

            {/* Status change */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Badge variant="default" className="p-1"><Check size={12} /></Badge>
                Alterar Status
              </h2>
              <Select
                label="Status"
                srOnly
                options={STATUS_OPTIONS.filter((o) => o.value !== "")}
                value={caseData.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
              />
            </div>

            {/* AI assistant — gated by plan */}
            {user?.plano === "entrada" ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 text-center">
                <Lock size={20} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Assistente de IA disponível nos planos Gestão e Enterprise.
                </p>
                <Link href="/app/configuracoes" className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                  Conhecer planos →
                </Link>
              </div>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setAiOpen(true)}
                className="py-6 rounded-2xl border-2 border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold shadow-sm"
                iconLeft={<Sparkles size={18} strokeWidth={2} />}
              >
                Assistente de IA
              </Button>
            )}

            {/* Responsible */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <User size={16} />
                Responsável
              </h2>
              <Select
                label="Responsável"
                srOnly
                options={availableResponsavelOptions}
                value={caseData.responsavel_id ?? ""}
                disabled={updatingResponsavel}
                onChange={(e) => handleResponsavelChange(e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Calendar size={16} />
                Prazo de Conclusão
              </h2>
              <div className="relative">
                <input
                  type="date"
                  value={prazoValue}
                  onChange={(e) => setPrazoValue(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-[var(--color-border)] px-4 py-2 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
              {prazoValue !== (caseData.prazo ? new Date(caseData.prazo).toISOString().split("T")[0] : "") && (
                <Button variant="secondary" size="sm" fullWidth onClick={handleSavePrazo} className="mt-3 rounded-xl">
                  Salvar prazo
                </Button>
              )}
              {prazoVencido && prazoValue && (
                <div className="flex items-center gap-1.5 mt-3 text-[var(--text-xs)] text-[var(--color-danger)] font-bold animate-pulse">
                  <AlertCircle size={14} />
                  Prazo vencido!
                </div>
              )}
              {!prazoVencido && prazoNearby && prazoValue && (
                <div className="flex items-center gap-1.5 mt-3 text-[var(--text-xs)] text-[var(--color-warning)] font-bold">
                  <AlertCircle size={14} />
                  Prazo em menos de 5 dias.
                </div>
              )}
            </div>

            {/* Anexos */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Paperclip size={16} />
                Anexos
              </h2>
              {!caseData.anexos?.length ? (
                <p className="text-xs text-[var(--color-text-tertiary)]">Nenhum anexo enviado.</p>
              ) : (
                <ul className="space-y-2">
                  {caseData.anexos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs">
                      <span className="truncate text-[var(--color-text-primary)] font-medium">{a.nome}</span>
                      {a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-[var(--color-primary)] hover:underline font-bold"
                        >
                          <Download size={13} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Internal notes */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Notas Internas
              </h2>
              <Textarea
                label="Notas internas"
                srOnly
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Registre observações estratégicas…"
                rows={4}
                className="rounded-xl text-[var(--text-sm)]"
              />
              <div className="mt-4">
                <Button variant="secondary" size="sm" fullWidth loading={savingNotes} onClick={handleSaveNotes} className="rounded-xl">
                  Salvar Alterações
                </Button>
              </div>
            </div>

            {/* Mentioned parties */}
            {(user?.role === "admin" || user?.role === "gestor") && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
                <h2 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Partes Identificadas
                </h2>
                {caseData.mencionados.length > 0 ? (
                  <ul className="space-y-3 mb-5">
                    {caseData.mencionados.map((uid) => {
                      const u = userMap[uid];
                      return (
                        <li key={uid} className="flex items-center gap-3 p-2 bg-[var(--color-bg-tertiary)]/50 rounded-xl border border-[var(--color-border)]">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] font-bold text-[var(--text-xs)]">
                            {u?.nome.charAt(0) ?? "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[var(--text-xs)] font-bold text-[var(--color-text-primary)] truncate">
                              {u?.nome ?? uid}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                              {u?.role ?? "Usuário"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mb-4 p-4 text-center border border-dashed border-[var(--color-border)] rounded-xl">
                    <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Nenhuma parte adicionada</p>
                  </div>
                )}
                <Button variant="secondary" size="sm" fullWidth onClick={() => setMencionadoModalOpen(true)} iconLeft={<Plus size={14} strokeWidth={1.5} />} className="rounded-xl">
                  Adicionar Parte
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <AIAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        caseId={caseId}
        context={`Caso ${caseData.protocolo}: ${caseData.categoria ?? "sem categoria"} — ${caseData.triagem_ia?.recomendacao ?? ""}`}
      />

      <Modal
        open={mencionadoModalOpen}
        onClose={() => setMencionadoModalOpen(false)}
        title="Adicionar parte identificada"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMencionadoModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={addingMencionado} disabled={!mencionadoUserId} onClick={handleAddMencionado}>
              Adicionar
            </Button>
          </div>
        }
      >
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-4">
          Usuários adicionados como partes identificadas não poderão acessar este caso.
        </p>
        <Select
          label="Selecionar usuário"
          options={availableMencionadoOptions}
          value={mencionadoUserId}
          onChange={(e) => setMencionadoUserId(e.target.value)}
        />
      </Modal>
    </>
  );
}
