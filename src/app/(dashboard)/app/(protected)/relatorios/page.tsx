"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Heatmap } from "@/components/ui/Heatmap";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  Lock, 
  Download, 
  Sparkles, 
  ChevronRight, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  FileBarChart
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
  totalTrend: TrendInfo | null;
  resolvidosTrend: TrendInfo | null;
}


const fetcher = (url: string) => fetch(url).then((res) => res.json());


function PlanGate({ plano }: { plano: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 bg-gradient-to-br from-[var(--color-primary-surface)] to-[var(--color-bg-secondary)] shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
        <Lock size={36} strokeWidth={1.2} className="text-[var(--color-primary)]" />
      </div>
      <h2 className="text-3xl md:text-4xl font-[var(--font-display)] font-bold text-[var(--color-text-primary)] mb-4 tracking-tight">
        Análise Profissional de Dados
      </h2>
      <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-md mx-auto">
        Os relatórios avançados e exportações PDF estão disponíveis nos planos <strong className="text-[var(--color-text-primary)]">Gestão</strong> e <strong className="text-[var(--color-text-primary)]">Enterprise</strong>.
      </p>
      <Link
        href="/app/configuracoes"
        className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-base shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/20"
      >
        Conhecer Planos
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}


export default function RelatoriosPage() {
  const { user } = useAuth();
  const { data: metrics, isLoading: loadingMetrics } = useSWR<MetricsData>(
    user?.plano !== "entrada" ? "/api/dashboard/metrics?period=90" : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  const loading = loadingMetrics;

  if (!user) return null;

  const isEntrada = user.plano === "entrada";
  const isEnterprise = user.plano === "enterprise";
  const canExportPDF = !isEntrada;

  return (
    <>
      <DashboardHeader />

      <main className="pb-28 lg:pb-10 overflow-y-auto h-full">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
          
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
                Relatórios e Insights
              </h1>
              <p className="mt-2 text-lg text-[var(--color-text-secondary)]">Análise profunda do canal nos últimos 90 dias.</p>
            </div>
            
            {canExportPDF && !loading && (
              <button
                type="button"
                onClick={() => alert("Exportação PDF disponível na Fase 6 (Assistente IA).")}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-card-hover)] transition-all active:scale-95"
              >
                <Download size={18} strokeWidth={2} className="text-[var(--color-primary)]" />
                Exportar Relatório PDF
              </button>
            )}
          </div>

          {isEntrada ? (
            <PlanGate plano={user.plano} />
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Metric Cards Grid */}
              <section aria-label="Métricas principais">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {loading || !metrics ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
                        <Skeleton height="44px" width="44px" className="mb-4 rounded-xl" />
                        <Skeleton height="14px" width="60%" className="mb-3" />
                        <Skeleton height="32px" width="40%" className="mb-4" />
                        <Skeleton height="14px" width="50%" />
                      </div>
                    ))
                  ) : (
                    <>
                      <MetricCard
                        label="Total de relatos no período"
                        value={metrics.total}
                        trend={metrics.totalTrend ?? undefined}
                        tone="danger"
                        icon={FileBarChart}
                      />
                      <MetricCard
                        label="Relatos resolvidos"
                        value={metrics.resolvidos30d}
                        trend={metrics.resolvidosTrend ?? undefined}
                        tone="success"
                        icon={PieChart}
                      />
                      <MetricCard
                        label="Tempo médio de resposta"
                        value={metrics.prazoMedio !== null ? `${metrics.prazoMedio}h` : "—"}
                        trend="Dentro da meta de 30 dias"
                        tone="primary"
                        icon={TrendingUp}
                      />
                      <MetricCard
                        label="Casos em apuração ativa"
                        value={metrics.emApuracao}
                        trend="Monitoramento em tempo real"
                        tone="primary"
                        icon={BarChart3}
                      />
                    </>
                  )}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
                <div className="space-y-6">
                  {/* Risk heatmap */}
                  <Heatmap
                    title="Mapa de Risco"
                    subtitle="Concentração por departamento e categoria"
                  />

                  {/* Channel distribution */}
                  {metrics && (
                    <section aria-label="Distribuição por canal" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                      <div className="px-6 py-5 border-b border-[var(--color-border)]">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Canais de Origem</h2>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Origem dos relatos recebidos</p>
                      </div>
                      <div className="p-6">
                        <div className="space-y-6">
                          {Object.entries(metrics.byChannel)
                            .filter(([, v]) => v > 0)
                            .sort((a, b) => b[1] - a[1])
                            .map(([ch, count]) => {
                              const total = Object.values(metrics.byChannel).reduce((a, b) => a + b, 0);
                              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                              return (
                                <div key={ch} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[var(--color-text-primary)] capitalize">
                                      {ch === "whatsapp" ? "WhatsApp (Criptografado)" : ch}
                                    </span>
                                    <span className="text-sm font-bold text-[var(--color-primary-dark)]">
                                      {count} relato{count !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${percentage}%` }}
                                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-1000 ease-out"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                <div className="space-y-6">
                  {/* AI Assistant Insight — Enterprise only or Coming Soon */}
                  {isEnterprise ? (
                    <section aria-label="IA Insight" className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent-surface)]/30 shadow-[var(--shadow-sm)] overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Sparkles size={64} className="text-[var(--color-accent)]" />
                      </div>
                      <div className="p-6 relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-[var(--shadow-sm)]">
                            <Sparkles size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[var(--color-text-primary)]">IA Assistente</h3>
                            <span className="text-xs font-bold uppercase tracking-wider bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full">Beta</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-[var(--color-card)]/60 backdrop-blur-sm p-4 rounded-xl border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">Relatório Executivo Automático</p>
                            <p className="mt-1 text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                              A IA gera resumos executivos focados em conformidade e riscos jurídicos baseados nos relatos do período.
                            </p>
                          </div>
                          <div className="bg-[var(--color-card)]/60 backdrop-blur-sm p-4 rounded-xl border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">Predição de Tendências</p>
                            <p className="mt-1 text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                              Identificação proativa de focos de conflito antes que se tornem problemas sistêmicos.
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
                          <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">Ativado para sua organização</p>
                        </div>
                      </div>
                    </section>
                  ) : (
                    /* Upgrade Banner for Gestão users */
                    <section className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-secondary)]/50 to-[var(--color-card)] p-6 relative overflow-hidden group">
                      {/* Subtle background decoration */}
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[var(--color-primary)] opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.06] transition-opacity" />
                      
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[var(--color-border)] shadow-sm flex items-center justify-center flex-shrink-0">
                          <Sparkles size={22} className="text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-snug">Inteligência Preditiva</h3>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            Resumos automáticos e análise de risco ESG disponíveis no plano <span className="font-bold text-[var(--color-primary)]">Enterprise</span>.
                          </p>
                          <Link 
                            href="/app/configuracoes" 
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
                          >
                            Saiba mais sobre upgrade
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ESG Indicators — Enterprise only */}
                  {isEnterprise && (
                    <section aria-label="Indicadores ESG" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                      <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Indicadores ESG</h2>
                        <span className="text-xs font-bold uppercase tracking-wider bg-[var(--color-success-surface)] text-[var(--color-success)] px-2 py-0.5 rounded-full">Enterprise</span>
                      </div>
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp size={20} className="text-[var(--color-text-tertiary)]" />
                        </div>
                        <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
                          Geração automática de indicadores GRI S-OWN-2 e G-GOV-2 para seu relatório de sustentabilidade.
                        </p>
                        <p className="mt-4 text-xs font-bold text-[var(--color-text-primary)]">Consulte seu gerente de contas</p>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
