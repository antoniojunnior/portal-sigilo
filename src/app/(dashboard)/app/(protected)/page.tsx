"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { UrgencyIndicator } from "@/components/ui/UrgencyIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heatmap } from "@/components/ui/Heatmap";
import { AIInsightsCard } from "@/components/ui/AIInsightsCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { UrgenciaNivel, CaseStatus } from "@/lib/types";

interface MetricsData {
  total: number;
  emApuracao: number;
  resolvidos30d: number;
  prazoMedio: number | null;
  byUrgency: Record<string, number>;
  byChannel: Record<string, number>;
  semRespostaUrgente: number;
  totalTrend: string | null;
  emApuracaoTrend: string | null;
  resolvidosTrend: string | null;
}

interface RecentCase {
  id: string;
  protocolo: string;
  urgencia?: UrgenciaNivel;
  status: CaseStatus;
  categoria?: string;
  created_at?: string;
}

function greeting(nome: string): string {
  const h = new Date().getHours();
  const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const first = nome.split(" ")[0];
  return `${saudacao}, ${first}.`;
}

function parseTrend(t: string | null | undefined): { dir: "up" | "down" | "neutral"; value: string } {
  if (!t) return { dir: "neutral", value: "" };
  if (t.startsWith("+")) return { dir: "up", value: t };
  if (t.startsWith("-")) return { dir: "down", value: t };
  return { dir: "neutral", value: t };
}

const CHANNEL_COLORS: Record<string, string> = {
  web: "#0369a1",
  whatsapp: "#15803d",
  app: "#6d28d9",
  "0800": "#a16207",
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, casesRes] = await Promise.all([
          fetch("/api/dashboard/metrics"),
          fetch("/api/dashboard/cases?limit=5&sortBy=created_at&sortDir=desc"),
        ]);
        if (metricsRes.ok) {
          setMetrics(await metricsRes.json() as MetricsData);
        }
        if (casesRes.ok) {
          const d = await casesRes.json() as { cases: RecentCase[] };
          setRecentCases(d.cases ?? []);
        }
      } catch (err) {
        console.error("[DashboardOverview]", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalT = parseTrend(metrics?.totalTrend);
  const apuracaoT = parseTrend(metrics?.emApuracaoTrend);
  const resolvidosT = parseTrend(metrics?.resolvidosTrend);

  const metricCards = metrics
    ? [
        {
          label: "Casos (30d)",
          value: metrics.total,
          trend: totalT.dir,
          trendValue: totalT.value || undefined,
          compareLabel: "vs. período anterior",
        },
        {
          label: "Em apuração",
          value: metrics.emApuracao,
          trend: apuracaoT.dir,
          trendValue: apuracaoT.value || undefined,
          compareLabel: "vs. período anterior",
        },
        {
          label: "Resolvidos (30d)",
          value: metrics.resolvidos30d,
          trend: resolvidosT.dir,
          trendValue: resolvidosT.value || undefined,
          compareLabel: "vs. período anterior",
        },
        {
          label: "Prazo médio",
          value: metrics.prazoMedio !== null ? `${metrics.prazoMedio}d` : "—",
          trend: "neutral" as const,
          compareLabel: "meta: 30d",
        },
      ]
    : null;

  const urgencyDist = metrics
    ? Object.entries(metrics.byUrgency)
        .map(([level, count]) => ({
          label: `Nível ${level}`,
          value: count,
          color: `var(--color-urgency-${level})`,
          max: Math.max(...Object.values(metrics.byUrgency), 1),
        }))
        .sort((a, b) => parseInt(b.label.split(" ")[1]) - parseInt(a.label.split(" ")[1]))
    : [];

  const channelDist = metrics
    ? Object.entries(metrics.byChannel)
        .filter(([, count]) => count > 0)
        .map(([channel, count]) => ({
          label: channel === "whatsapp" ? "WhatsApp" : channel === "0800" ? "0800" : channel.charAt(0).toUpperCase() + channel.slice(1),
          value: count,
          color: CHANNEL_COLORS[channel] ?? "#999",
        }))
    : [];

  const maxChannelCount = Math.max(...channelDist.map((c) => c.value), 1);

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral" }]}
        periodLabel="Últimos 30 dias"
      />

      <PageContainer>
        {/* Greeting + SLA alert */}
        <div className="mb-5 space-y-3">
          {user && (
            <div>
              <h1 className="text-[var(--text-lg)] sm:text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] leading-tight">
                {greeting(user.nome)}
              </h1>
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] mt-0.5">
                Aqui está o resumo de hoje.
              </p>
            </div>
          )}

          {/* SLA alert */}
          {!loading && metrics && metrics.semRespostaUrgente > 0 && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3"
              style={{ background: "var(--color-danger-surface)", border: "1px solid var(--color-danger)" }}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" className="flex-shrink-0 mt-0.5" aria-hidden>
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 11h.01" strokeLinecap="round" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-sm)] font-semibold text-[var(--color-danger)]">
                  {metrics.semRespostaUrgente} caso{metrics.semRespostaUrgente > 1 ? "s urgentes" : " urgente"} sem resposta há mais de 48h
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-danger)] opacity-80 mt-0.5">
                  Revise e tome uma ação o quanto antes.
                </p>
              </div>
              <Link
                href="/app/casos?urgency=4"
                className="flex-shrink-0 text-[var(--text-xs)] font-semibold text-[var(--color-danger)] hover:underline focus:outline-none focus-visible:underline whitespace-nowrap"
              >
                Ver casos →
              </Link>
            </div>
          )}
        </div>

        {/* Metric cards */}
        <section aria-label="Métricas resumidas" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {loading || !metricCards
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
                  <Skeleton height="12px" width="60%" className="mb-3" />
                  <Skeleton height="28px" width="40%" />
                </div>
              ))
            : metricCards.map((m) => <MetricCard key={m.label} {...m} />)}
        </section>

        {/* Heatmap + AI Insights */}
        <section
          aria-label="Análise avançada"
          className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mb-5"
        >
          <Heatmap />
          <AIInsightsCard />
        </section>

        {/* Recent cases */}
        <section aria-label="Casos recentes" className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
              Casos recentes
            </h2>
            <Link
              href="/app/casos"
              className="text-[var(--text-sm)] text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
            >
              Ver todos →
            </Link>
          </div>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
            {loading ? (
              <div className="p-4 sm:p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="36px" rounded="md" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <EmptyState
                illustration="empty"
                title="Nenhum caso aberto"
                description="Quando novos relatos chegarem, aparecerão aqui."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 480 }}>
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {["Urgência", "Categoria", "Protocolo", "Status", "Data"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-card-hover)] transition-colors cursor-pointer"
                        onClick={() => window.location.assign(`/app/casos/${c.id}`)}
                      >
                        <td className="px-4 py-3">
                          {c.urgencia ? (
                            <UrgencyIndicator level={c.urgencia} showLabel />
                          ) : (
                            <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] max-w-[160px] truncate">
                          {c.categoria ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)] whitespace-nowrap">
                          {c.protocolo}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="status" status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-[var(--text-xs)] text-[var(--color-text-tertiary)] whitespace-nowrap">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Distribution charts */}
        <section aria-label="Distribuição de casos" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Urgency */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
            <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
              Distribuição por urgência
            </h3>
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height="16px" rounded="md" />
                ))}
              </div>
            ) : urgencyDist.every((r) => r.value === 0) ? (
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-2">Nenhum dado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {urgencyDist.map((row) => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] w-16 flex-shrink-0">
                      {row.label}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(row.value / row.max) * 100}%`, background: row.color }}
                        className="h-full rounded-full"
                      />
                    </div>
                    <span className="text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)] tabular-nums w-4 text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
            <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
              Canais de origem
            </h3>
            {loading ? (
              <Skeleton height="120px" rounded="md" />
            ) : channelDist.length === 0 ? (
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-2">Nenhum dado ainda.</p>
            ) : (
              <>
                <div className="flex items-end gap-2 pb-2 border-b border-[var(--color-border)]" style={{ height: 100 }}>
                  {channelDist.map((b) => (
                    <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[var(--text-2xs)] font-semibold text-[var(--color-text-secondary)]">{b.value}</span>
                      <div
                        style={{
                          width: "100%",
                          height: `${(b.value / maxChannelCount) * 72}px`,
                          background: b.color,
                          borderRadius: "4px 4px 0 0",
                          opacity: 0.85,
                          minHeight: 4,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  {channelDist.map((b) => (
                    <span key={b.label} className="flex-1 text-[var(--text-2xs)] text-[var(--color-text-tertiary)] text-center">
                      {b.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </PageContainer>
    </>
  );
}
