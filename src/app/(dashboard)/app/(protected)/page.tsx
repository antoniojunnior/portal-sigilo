"use client";

import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Heatmap } from "@/components/ui/Heatmap";
import { AIInsightsCard } from "@/components/ui/AIInsightsCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DataTable } from "@/components/ui/DataTable";
import { UrgencyIndicator } from "@/components/ui/UrgencyIndicator";
import type { UrgencyLevel } from "@/components/ui/UrgencyIndicator";
import type { UrgenciaNivel, CaseStatus } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderOpen,
  RefreshCcw,
  ArrowRight,
  MoreHorizontal,
  FileText
} from "lucide-react";

interface TrendInfo {
  value: number;
  direction: "up" | "down" | "stable";
  label: string;
}

interface MetricsData {
  total: number;
  emApuracao: number;
  resolvidos30d: number;
  prazoMedio: number | null;
  byUrgency: Record<string, number>;
  byChannel: Record<string, number>;
  byCategory?: Record<string, number>;
  semRespostaUrgente: number;
  totalTrend: TrendInfo | null;
  emApuracaoTrend: TrendInfo | null;
  resolvidosTrend: TrendInfo | null;
}

interface RecentCase {
  id: string;
  protocolo: string;
  urgencia?: UrgenciaNivel;
  status: CaseStatus;
  categoria?: string;
  created_at?: string;
  prazo?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function greeting(nome: string): string {
  const h = new Date().getHours();
  const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const first = nome.split(" ")[0];
  return `${saudacao}, ${first}.`;
}

function getUrgencyClasses(level?: UrgenciaNivel): string {
  const map: Record<number, string> = {
    1: "bg-[var(--color-urgency-1-surface)] text-[var(--color-urgency-1)]",
    2: "bg-[var(--color-urgency-2-surface)] text-[var(--color-urgency-2)]",
    3: "bg-[var(--color-urgency-3-surface)] text-[var(--color-urgency-3)]",
    4: "bg-[var(--color-urgency-4-surface)] text-[var(--color-urgency-4)]",
    5: "bg-[var(--color-urgency-5-surface)] text-[var(--color-urgency-5)]",
  };
  return level ? map[level] : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]";
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    aguardando_triagem: "Triagem",
    em_apuracao: "Apurando",
    pendente_informacao: "Pendente",
    encerrado_sem_infracao: "Encerrado",
    encerrado_com_acao: "Encerrado",
  };
  return map[status] || status;
}

function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    aguardando_triagem: "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
    em_apuracao: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
    pendente_informacao: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
    encerrado_sem_infracao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
    encerrado_com_acao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  };
  return map[status] || "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]";
}

function getSlaColor(hours: number): string {
  if (hours < 0) return "bg-[var(--color-danger)]";
  if (hours <= 8) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-success)]";
}

function calculateSlaHours(prazo?: string, createdAt?: string): number {
  const deadlineDate = prazo ? new Date(prazo) : null;
  const createdDate = createdAt ? new Date(createdAt) : null;

  // Use explicit prazo if available, otherwise fallback to createdAt + 15 days
  let deadlineMs: number;
  if (deadlineDate && !isNaN(deadlineDate.getTime())) {
    deadlineMs = deadlineDate.getTime();
  } else if (createdDate && !isNaN(createdDate.getTime())) {
    deadlineMs = createdDate.getTime() + (30 * 24 * 60 * 60 * 1000);
  } else {
    return 24; // Ultimate fallback
  }

  const now = new Date().getTime();
  const diffMs = deadlineMs - now;
  return Math.round(diffMs / (1000 * 60 * 60));
}

function CriticalAlert({ count }: { count: number }) {
  return (
    <section className="animate-[pulse_3s_ease-in-out_infinite] rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-surface)] p-4 shadow-[var(--shadow-sm)] md:flex md:items-center md:justify-between md:p-5">
      <div className="flex gap-4">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)] text-[var(--color-danger)]">
          <AlertTriangle size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Existe {count} caso{count > 1 ? "s" : ""} crítico{count > 1 ? "s" : ""} aguardando atenção imediata.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">Conforme as diretrizes, casos urgentes devem ser respondidos em até 48 horas.</p>
        </div>
      </div>
      <Link 
        href="/app/casos?filtro=urgente"
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--color-danger-surface)] md:mt-0"
      >
        Ver casos
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: metrics, isLoading: loadingMetrics } = useSWR<MetricsData>(
    "/api/dashboard/metrics",
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: casesData, isLoading: loadingCases } = useSWR<{ cases: RecentCase[] }>(
    "/api/dashboard/cases?limit=5&sortBy=created_at&sortDir=desc",
    fetcher,
    { refreshInterval: 60000 }
  );

  const recentCases = casesData?.cases ?? [];
  const isLoading = loadingMetrics || loadingCases;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date());

  const capitalizeDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <>
      <DashboardHeader />

      <main className="pb-28 lg:pb-10 overflow-y-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
          {/* ── Hero greeting ── */}
          <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary-xdark)] via-[var(--color-primary-dark)] to-[var(--color-primary)] px-6 py-6 shadow-[var(--shadow-md)] md:px-8 md:py-8">
            {/* decorative orbs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-[var(--color-accent)]/10" />
            <div className="pointer-events-none absolute right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/30 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">{capitalizeDate}</p>
                {user ? (
                  <h1 className="mt-2 font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight text-white">
                    {greeting(user.nome)}
                  </h1>
                ) : (
                  <div className="mt-2"><Skeleton width="260px" height="44px" /></div>
                )}
                <p className="mt-1.5 text-sm text-white/60">Aqui está o resumo de hoje.</p>

                {/* Status chips */}
                {metrics && !loadingMetrics && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {metrics.semRespostaUrgente > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-danger)] shadow-[0_0_6px_var(--color-danger)]" />
                        {metrics.semRespostaUrgente} crítico{metrics.semRespostaUrgente !== 1 ? "s" : ""}
                      </span>
                    )}
                    {metrics.emApuracao > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
                        {metrics.emApuracao} em apuração
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                      {metrics.resolvidos30d} resolvidos (30d)
                    </span>
                  </div>
                )}
                {loadingMetrics && (
                  <div className="mt-4 flex gap-2">
                    <Skeleton width="88px" height="28px" rounded="full" />
                    <Skeleton width="108px" height="28px" rounded="full" />
                    <Skeleton width="116px" height="28px" rounded="full" />
                  </div>
                )}
              </div>

              {/* Refresh pill */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                <RefreshCcw size={13} className={isLoading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{isLoading ? "Atualizando…" : "Atualizado"}</span>
              </div>
            </div>
          </section>

          <div className="space-y-5 md:space-y-6">
            {!loadingMetrics && metrics && metrics.semRespostaUrgente > 0 && (
              <CriticalAlert count={metrics.semRespostaUrgente} />
            )}

            <ErrorBoundary>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard 
                  label="Total de relatos" 
                  value={metrics?.total ?? 0} 
                  trend={metrics?.totalTrend ?? undefined}
                  tone="primary"
                  icon={FolderOpen} 
                  loading={loadingMetrics} 
                />
                <MetricCard 
                  label="Casos em apuração" 
                  value={metrics?.emApuracao ?? 0} 
                  trend={metrics?.emApuracaoTrend ?? undefined}
                  tone="primary"
                  icon={RefreshCcw} 
                  loading={loadingMetrics} 
                />
                <MetricCard 
                  label="Tempo médio de resposta" 
                  value={metrics?.prazoMedio != null ? `${metrics.prazoMedio}h` : "—"} 
                  trend="Dentro do esperado"
                  icon={Clock3} 
                  loading={loadingMetrics} 
                />
                <MetricCard 
                  label="Resolvidos (30 dias)" 
                  value={metrics?.resolvidos30d ?? 0} 
                  trend={metrics?.resolvidosTrend ?? undefined}
                  tone="success"
                  icon={CheckCircle2} 
                  loading={loadingMetrics} 
                />
              </section>
            </ErrorBoundary>

            {/* ── Quick actions ── */}
            <section className="grid grid-cols-3 gap-3">
              <Link
                href="/app/casos?filtro=urgente"
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] px-4 py-3.5 text-center transition hover:brightness-95 active:scale-[0.98] focus-visible:shadow-[var(--shadow-focus-danger)]"
              >
                <span className="text-sm font-bold text-[var(--color-danger)]">Urgentes</span>
                {metrics && !loadingMetrics ? (
                  <span className="text-xs text-[var(--color-danger)]/70">{metrics.semRespostaUrgente} caso{metrics.semRespostaUrgente !== 1 ? "s" : ""}</span>
                ) : <Skeleton width="40px" height="12px" />}
              </Link>
              <Link
                href="/app/casos"
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-surface)] px-4 py-3.5 text-center transition hover:brightness-95 active:scale-[0.98] focus-visible:shadow-[var(--shadow-focus)]"
              >
                <span className="text-sm font-bold text-[var(--color-primary-dark)]">Em triagem</span>
                {metrics && !loadingMetrics ? (
                  <span className="text-xs text-[var(--color-primary-dark)]/60">{metrics.emApuracao} em andamento</span>
                ) : <Skeleton width="40px" height="12px" />}
              </Link>
              <Link
                href="/app/relatorios"
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3.5 text-center transition hover:bg-[var(--color-card-hover)] active:scale-[0.98] focus-visible:shadow-[var(--shadow-focus)]"
              >
                <span className="text-sm font-bold text-[var(--color-text-secondary)]">Relatórios</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">Exportar dados</span>
              </Link>
            </section>

            {metrics?.byCategory && Object.keys(metrics.byCategory).length > 0 && (
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-sm)]">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5">Categorias</h2>
                <div className="space-y-3">
                  {Object.entries(metrics.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const total = Object.values(metrics.byCategory!).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-4">
                          <span className="w-40 shrink-0 text-sm font-medium text-[var(--color-text-secondary)] truncate">{cat}</span>
                          <div className="flex-1 h-2.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
                            />
                          </div>
                          <span className="text-xs font-bold text-[var(--color-text-secondary)] w-10 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-card)] to-[var(--color-bg-secondary)]/30">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Relatos Recentes</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Últimos relatos recebidos via canais oficiais</p>
                    </div>
                    <Link href="/app/casos" className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 transition-all hover:gap-2">
                      Ver todos
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="hidden md:block">
                    <DataTable 
                      columns={[
                        {
                          header: "Protocolo",
                          accessor: (item) => (
                            <div className="flex items-center gap-3">
                              <UrgencyIndicator level={((item.urgencia || 1) as UrgencyLevel)} showLabel />
                              <span className="font-[var(--font-mono)] font-bold text-[var(--color-text-primary)]">{item.protocolo}</span>
                            </div>
                          )
                        },
                        { header: "Categoria", accessor: "categoria", className: "text-[var(--color-text-secondary)] font-medium" },
                        { 
                          header: "Status", 
                          accessor: (item) => (
                            <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          )
                        },
                        { 
                          header: "SLA", 
                          accessor: (item) => {
                            const hours = calculateSlaHours(item.prazo, item.created_at);
                            return (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-12 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                                  <div className={`h-full rounded-full ${getSlaColor(hours)}`} style={{ width: hours < 0 ? "100%" : `${Math.max(20, Math.min(100, (hours / 360) * 100))}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${hours < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>{hours}h</span>
                              </div>
                            );
                          }
                        },
                        {
                          header: "",
                          accessor: () => <MoreHorizontal size={17} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />,
                          className: "w-10 text-right"
                        }
                      ]}
                      data={recentCases}
                      loading={loadingCases}
                      onRowClick={(item) => router.push(`/app/casos/${item.id}`)}
                      emptyMessage="Nenhum caso recente encontrado."
                    />
                  </div>

                  <div className="divide-y divide-[var(--color-border)] md:hidden">
                    {loadingCases ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-5">
                          <Skeleton height="72px" rounded="xl" />
                        </div>
                      ))
                    ) : recentCases.length === 0 ? (
                      <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                        Nenhum caso recente encontrado.
                      </div>
                    ) : (
                      recentCases.map((item) => {
                        const slaHours = calculateSlaHours(item.prazo, item.created_at);
                        const isHighUrgency = (item.urgencia || 0) >= 4;
                        
                        return (
                          <Link
                            key={item.id}
                            href={`/app/casos/${item.id}`}
                            className="flex items-center justify-between p-5 transition-colors active:bg-[var(--color-bg-secondary)]"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95 ${isHighUrgency ? "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" : "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"}`}>
                                <FileText size={22} strokeWidth={1.8} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight truncate">
                                  {item.categoria || "Sem categoria"}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                  <span className="font-[var(--font-mono)] text-[10px] font-bold text-[var(--color-text-tertiary)]">
                                    #{item.protocolo}
                                  </span>
                                  <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className={`text-sm font-bold ${slaHours < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
                                {slaHours < 0 ? "Atrasado" : `${slaHours}h`}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">SLA</p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <ErrorBoundary>
                  <Heatmap />
                </ErrorBoundary>
                <ErrorBoundary>
                  <AIInsightsCard />
                </ErrorBoundary>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
