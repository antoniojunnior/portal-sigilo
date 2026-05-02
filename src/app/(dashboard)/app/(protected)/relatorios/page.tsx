"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/ui/MetricCard";
import { RiskCell } from "@/components/ui/RiskCell";
import { Skeleton } from "@/components/ui/Skeleton";

interface MetricsData {
  total: number;
  emApuracao: number;
  resolvidos30d: number;
  prazoMedio: number | null;
  byUrgency: Record<string, number>;
  byChannel: Record<string, number>;
  totalTrend: string | null;
  resolvidosTrend: string | null;
}

interface HeatmapData {
  departments: string[];
  categories: string[];
  rows: { dept: string; values: number[] }[];
}

function parseTrend(t: string | null | undefined): "up" | "down" | "neutral" {
  if (!t) return "neutral";
  if (t.startsWith("+")) return "up";
  if (t.startsWith("-")) return "down";
  return "neutral";
}

// ── Plan gate ────────────────────────────────────────────────────────────────

function PlanGate({ plano }: { plano: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--color-primary-surface)" }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-2">
        Relatórios disponíveis no plano Gestão
      </h2>
      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        Você está no plano <strong>{plano}</strong>. Faça upgrade para acessar relatórios mensais gerados por IA, gráficos de tendência e exportação em PDF.
      </p>
      <Link
        href="/app/configuracoes"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-[var(--text-sm)] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
      >
        Ver planos e fazer upgrade →
      </Link>
    </div>
  );
}

// ── Risk heatmap table ───────────────────────────────────────────────────────

function HeatmapTable({ data }: { data: HeatmapData }) {
  if (data.rows.length === 0) {
    return (
      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-4 text-center">
        Nenhum dado de triagem disponível ainda.
      </p>
    );
  }

  // Compute score 0–100 relative to max count
  const maxVal = Math.max(...data.rows.flatMap((r) => r.values), 1);
  function toScore(v: number) { return Math.round((v / maxVal) * 100); }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth: 420 }}>
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-4 py-3 text-left text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">
              Departamento
            </th>
            {data.categories.map((c) => (
              <th key={c} className="px-3 py-3 text-center text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] whitespace-nowrap">
                {c.length > 10 ? c.slice(0, 9) + "…" : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.dept} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{row.dept}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-3 py-3 text-center">
                  <div className="flex justify-center">
                    <RiskCell score={toScore(v)} label={`${row.dept} / ${data.categories[i]}: ${v}`} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-3 flex-wrap">
        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Escala de risco:</span>
        <div className="flex items-center gap-1.5">
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <RiskCell key={v} score={v} />
          ))}
        </div>
        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] ml-1">baixo → alto</span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.plano === "entrada") { setLoading(false); return; }

    Promise.all([
      fetch("/api/dashboard/metrics?period=90").then((r) => r.ok ? r.json() as Promise<MetricsData> : null),
      fetch("/api/dashboard/heatmap").then((r) => r.ok ? r.json() as Promise<HeatmapData> : null),
    ])
      .then(([m, h]) => { if (m) setMetrics(m); if (h) setHeatmap(h); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const isEntrada = user.plano === "entrada";
  const isEnterprise = user.plano === "enterprise";
  const canExportPDF = !isEntrada;

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Relatórios" }]}
        periodLabel="Últimos 90 dias"
      />

      <PageContainer>
        {isEntrada ? (
          <PlanGate plano={user.plano} />
        ) : (
          <div className="space-y-6">
            {/* Summary metrics */}
            <section aria-label="Métricas do período">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
                  Resumo do período
                </h2>
                {canExportPDF && (
                  <button
                    type="button"
                    onClick={() => alert("Exportação PDF disponível na Fase 6 (Assistente IA).")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--text-xs)] font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                      <path d="M8 2v8M5 7l3 3 3-3" /><path d="M3 12h10" />
                    </svg>
                    Exportar PDF
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {loading || !metrics ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
                      <Skeleton height="12px" width="60%" className="mb-3" />
                      <Skeleton height="28px" width="40%" />
                    </div>
                  ))
                ) : (
                  <>
                    <MetricCard
                      label="Total de casos"
                      value={metrics.total}
                      trendValue={metrics.totalTrend ?? undefined}
                      trend={parseTrend(metrics.totalTrend)}
                      compareLabel="vs. período anterior"
                    />
                    <MetricCard
                      label="Resolvidos"
                      value={metrics.resolvidos30d}
                      trendValue={metrics.resolvidosTrend ?? undefined}
                      trend={parseTrend(metrics.resolvidosTrend)}
                      compareLabel="vs. período anterior"
                    />
                    <MetricCard
                      label="Prazo médio"
                      value={metrics.prazoMedio !== null ? `${metrics.prazoMedio}d` : "—"}
                      trend="neutral"
                      compareLabel="meta: 30d"
                    />
                    <MetricCard
                      label="Em apuração"
                      value={metrics.emApuracao}
                      trend="neutral"
                      compareLabel="casos abertos"
                    />
                  </>
                )}
              </div>
            </section>

            {/* AI report stub — Fase 6 */}
            <section aria-label="Relatório gerado por IA">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)" }}
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden>
                      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
                      Relatório executivo mensal
                    </p>
                    <p className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">
                      Gerado automaticamente por IA · revisão do gestor antes de exportar
                    </p>
                  </div>
                  <span
                    className="text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded flex-shrink-0"
                    style={{ background: "var(--color-primary-surface)", color: "var(--color-primary-dark)" }}
                  >
                    FASE 6
                  </span>
                </div>
                <div className="px-5 py-8 text-center">
                  <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] max-w-sm mx-auto leading-relaxed">
                    A geração automática de relatórios por IA será implementada na Fase 6 — Assistente IA.
                    O relatório incluirá análise de tendências, alertas legais e recomendações priorizadas.
                  </p>
                </div>
              </div>
            </section>

            {/* Risk heatmap */}
            <section aria-label="Mapa de risco por departamento">
              <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-3">
                Mapa de risco
              </h2>
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-x-auto">
                {loading || !heatmap ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} height="36px" rounded="md" />
                    ))}
                  </div>
                ) : (
                  <HeatmapTable data={heatmap} />
                )}
              </div>
            </section>

            {/* Channel distribution */}
            {metrics && (
              <section aria-label="Distribuição por canal">
                <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-3">
                  Canais de origem
                </h2>
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
                  <div className="space-y-3">
                    {Object.entries(metrics.byChannel)
                      .filter(([, v]) => v > 0)
                      .map(([ch, count]) => {
                        const max = Math.max(...Object.values(metrics.byChannel), 1);
                        return (
                          <div key={ch} className="flex items-center gap-3">
                            <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] w-20 flex-shrink-0 capitalize">
                              {ch === "whatsapp" ? "WhatsApp" : ch}
                            </span>
                            <div className="flex-1 h-2.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(count / max) * 100}%`, background: "var(--color-primary)" }}
                                className="h-full rounded-full"
                              />
                            </div>
                            <span className="text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)] tabular-nums w-6 text-right">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </section>
            )}

            {/* ESG — Enterprise only */}
            {isEnterprise && (
              <section aria-label="Indicadores ESG">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                    <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
                      Indicadores ESG
                    </p>
                    <span
                      className="text-[var(--text-2xs)] font-semibold px-1.5 py-0.5 rounded ml-auto"
                      style={{ background: "var(--color-accent-surface)", color: "var(--color-accent-dark)" }}
                    >
                      ENTERPRISE
                    </span>
                  </div>
                  <div className="px-5 py-8 text-center">
                    <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] max-w-sm mx-auto leading-relaxed">
                      Indicadores GRI S-OWN-2 e G-GOV-2 serão gerados automaticamente na Fase 6.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
