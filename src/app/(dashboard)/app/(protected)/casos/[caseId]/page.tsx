"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
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
import type { CaseStatus, UrgenciaNivel, CanalOrigem, TriagemIA } from "@/lib/types";

interface Props {
  params: Promise<{ caseId: string }>;
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
  const steps = [
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
  return steps;
}

function formatAuditAction(acao: string, detalhes?: Record<string, unknown>): string {
  const map: Record<string, string> = {
    case_viewed: "Caso visualizado",
    case_status_changed: "Status alterado",
    case_responsavel_changed: "Responsável alterado",
    message_sent: "Mensagem enviada",
    mencionado_adicionado: "Parte identificada adicionada",
    case_criado: "Caso criado",
  };
  let label = map[acao] ?? acao;
  if (acao === "case_status_changed" && detalhes?.from && detalhes?.to) {
    label += `: ${detalhes.from} → ${detalhes.to}`;
  }
  return label;
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
      console.error("[CaseDetailPage] fetchCase:", err);
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
      console.error("[CaseDetailPage] fetchMessages:", err);
    }
  }, [caseId]);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/cases/${caseId}/audit`);
      if (!res.ok) return;
      const data = await res.json() as { logs: AuditLogData[] };
      setAuditLogs(data.logs ?? []);
    } catch (err) {
      console.error("[CaseDetailPage] fetchAudit:", err);
    }
  }, [caseId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/users");
      if (!res.ok) return;
      const data = await res.json() as { users: UserOption[] };
      setUsers(data.users ?? []);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchCase();
    fetchMessages();
    fetchAudit();
    fetchUsers();

    // Poll messages every 30 seconds
    pollTimerRef.current = setInterval(() => {
      fetchMessages();
    }, 30_000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchCase, fetchMessages, fetchAudit, fetchUsers]);

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
      console.error("[CaseDetailPage] sendMessage:", err);
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
      console.error("[CaseDetailPage] statusChange:", err);
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
      console.error("[CaseDetailPage] responsavelChange:", err);
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
      console.error("[CaseDetailPage] saveNotes:", err);
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
      console.error("[CaseDetailPage] savePrazo:", err);
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
      console.error("[CaseDetailPage] addMencionado:", err);
    } finally {
      setAddingMencionado(false);
    }
  }

  // Users available as responsavel (not in mencionados)
  const availableResponsavelOptions = [
    { value: "", label: "Sem responsável" },
    ...users
      .filter((u) => !caseData?.mencionados.includes(u.id))
      .map((u) => ({ value: u.id, label: `${u.nome} (${u.role})` })),
  ];

  // Users available to add as mencionado (not already mencionado, not current user)
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

  // Access error
  if (accessError) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--color-danger-surface)] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" aria-hidden>
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-2">
            Acesso restrito
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">
            {accessError}
          </p>
          <Button variant="secondary" onClick={() => router.push("/app/casos")}>
            ← Voltar aos casos
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !caseData) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Casos", href: "/app/casos" }, { label: "Carregando..." }]}
          user={{ name: user?.nome ?? "..." }}
        />
        <PageContainer>
          <div className="space-y-4">
            <Skeleton height="120px" rounded="lg" />
            <Skeleton height="200px" rounded="lg" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Casos", href: "/app/casos" },
          { label: caseData.protocolo },
        ]}
        user={{ name: user?.nome ?? "..." }}
      />

      <PageContainer className="overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Case header card */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-1">
                    {caseData.protocolo}
                  </p>
                  <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">
                    {caseData.categoria ?? "Categoria não classificada"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {caseData.urgencia && <UrgencyIndicator level={caseData.urgencia} showLabel />}
                  <ChannelBadge channel={caseData.canal_origem} />
                </div>
              </div>

              {caseData.triagem_ia?.recomendacao && (
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  {caseData.triagem_ia.recomendacao}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Badge variant="status" status={caseData.status} />
                <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                  Registrado em{" "}
                  {new Date(caseData.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* IA triage card */}
            {caseData.triagem_ia && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
                <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                  Triagem por IA
                </h2>
                <dl className="grid grid-cols-2 gap-3">
                  {caseData.triagem_ia.categoria && (
                    <div>
                      <dt className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Categoria</dt>
                      <dd className="text-[var(--text-sm)] text-[var(--color-text-primary)]">
                        {caseData.triagem_ia.categoria}
                      </dd>
                    </div>
                  )}
                  {caseData.triagem_ia.lei_aplicavel && (
                    <div>
                      <dt className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Lei aplicável</dt>
                      <dd className="text-[var(--text-sm)] text-[var(--color-text-primary)]">
                        {caseData.triagem_ia.lei_aplicavel}
                      </dd>
                    </div>
                  )}
                  {caseData.triagem_ia.urgencia && (
                    <div>
                      <dt className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Urgência IA</dt>
                      <dd>
                        <UrgencyIndicator level={caseData.triagem_ia.urgencia} showLabel />
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Chat / messages */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
                Mensagens
              </h2>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] text-center py-4">
                    Nenhuma mensagem ainda.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={[
                        "flex",
                        msg.autor === "gestor" ? "justify-end" : "justify-start",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "max-w-[75%] rounded-[var(--radius-lg)] px-3.5 py-2.5",
                          msg.autor === "gestor"
                            ? "bg-[var(--color-primary)] text-white"
                            : msg.autor === "sistema"
                            ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] text-center w-full max-w-full"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]",
                        ].join(" ")}
                      >
                        {msg.autor !== "gestor" && msg.autor !== "sistema" && (
                          <p className="text-[var(--text-xs)] font-semibold mb-1 opacity-70">
                            Denunciante
                          </p>
                        )}
                        <p className="text-[var(--text-sm)]">{msg.texto}</p>
                        <p
                          className={[
                            "text-[var(--text-2xs)] mt-1",
                            msg.autor === "gestor" ? "text-white/70 text-right" : "text-[var(--color-text-tertiary)]",
                          ].join(" ")}
                        >
                          {new Date(msg.timestamp).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escrever mensagem para o denunciante..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                  className="flex-1 min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] px-3.5 py-2 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-50"
                />
                <Button
                  variant="primary"
                  size="md"
                  loading={sendingMessage}
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                >
                  Enviar
                </Button>
              </div>
            </div>

            {/* Audit log */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
                Log de auditoria
              </h2>
              {auditLogs.length === 0 ? (
                <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                  Nenhum registro ainda.
                </p>
              ) : (
                auditLogs.map((entry) => (
                  <AuditEntry
                    key={entry.id}
                    action={formatAuditAction(entry.acao, entry.detalhes)}
                    user={entry.user_id}
                    timestamp={entry.timestamp}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar column */}
          <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-5">
            {/* Timeline */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
                Progresso
              </h2>
              <StatusTimeline steps={buildTimelineSteps(caseData.status)} />
            </div>

            {/* Status change */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                Alterar status
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

            {/* AI button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setAiOpen(true)}
              iconLeft={
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <circle cx="8" cy="8" r="5" />
                  <path d="M6 8a2 2 0 0 1 4 0" strokeLinecap="round" />
                  <path d="M8 13v1M3 8H2M14 8h-1" strokeLinecap="round" />
                </svg>
              }
            >
              Analisar com IA
            </Button>

            {/* Responsible */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
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
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                Prazo
              </h2>
              <input
                type="date"
                value={prazoValue}
                onChange={(e) => setPrazoValue(e.target.value)}
                onBlur={handleSavePrazo}
                className="w-full min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] px-3.5 py-2 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              />
              {prazoNearby && prazoValue && (
                <p className="text-[var(--text-xs)] text-[var(--color-danger)] mt-1.5">
                  Prazo em menos de 5 dias!
                </p>
              )}
            </div>

            {/* Internal notes */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                Notas internas
              </h2>
              <Textarea
                label="Notas internas"
                srOnly
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Registre observações internas sobre este caso..."
                rows={4}
              />
              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={savingNotes}
                  onClick={handleSaveNotes}
                >
                  Salvar notas
                </Button>
              </div>
            </div>

            {/* Add mencionado */}
            {(user?.role === "admin" || user?.role === "gestor") && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
                <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                  Partes identificadas
                </h2>
                {caseData.mencionados.length > 0 && (
                  <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-3">
                    {caseData.mencionados.length} identificado(s)
                  </p>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setMencionadoModalOpen(true)}
                >
                  + Adicionar parte
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <AIAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={`Caso ${caseData.protocolo}: ${caseData.categoria ?? "sem categoria"} — ${caseData.triagem_ia?.recomendacao ?? ""}`}
      />

      <Modal
        open={mencionadoModalOpen}
        onClose={() => setMencionadoModalOpen(false)}
        title="Adicionar parte identificada"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMencionadoModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={addingMencionado}
              disabled={!mencionadoUserId}
              onClick={handleAddMencionado}
            >
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
