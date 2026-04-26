import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { UrgencyIndicator } from "@/components/ui/UrgencyIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heatmap } from "@/components/ui/Heatmap";
import { AIInsightsCard } from "@/components/ui/AIInsightsCard";

const MOCK_METRICS = [
  { label: "Casos abertos", value: 12, trendValue: "+3", trend: "up" as const, compareLabel: "vs. mês anterior" },
  { label: "Em apuração", value: 7, trendValue: "-1", trend: "down" as const, compareLabel: "vs. mês anterior" },
  { label: "Resolvidos (30d)", value: 5, trendValue: "+2", trend: "up" as const, compareLabel: "vs. mês anterior" },
  { label: "Prazo médio", value: "18d", trend: "neutral" as const, compareLabel: "meta: 30d" },
];

const MOCK_RECENT = [
  { protocolo: "ETK-2024-0042", urgency: 5 as const, status: "em_apuracao" as const, category: "Assédio moral", dep: "Manufatura" },
  { protocolo: "ETK-2024-0041", urgency: 3 as const, status: "aguardando_triagem" as const, category: "Fraude", dep: "Comercial" },
  { protocolo: "ETK-2024-0040", urgency: 2 as const, status: "em_apuracao" as const, category: "Conflito de interesse", dep: "RH" },
];

const URGENCY_DIST = [
  { label: "Crítica (5)", value: 1, color: "#9A2020", max: 4 },
  { label: "Alta (4)", value: 2, color: "#C05A4A", max: 4 },
  { label: "Média (3)", value: 4, color: "#B07020", max: 4 },
  { label: "Moderada (2)", value: 3, color: "#4A8A2A", max: 4 },
  { label: "Baixa (1)", value: 2, color: "#1A7A5A", max: 4 },
];

const CHANNEL_DIST = [
  { label: "Web", value: 78, color: "#0369a1" },
  { label: "WhatsApp", value: 42, color: "#15803d" },
  { label: "App", value: 18, color: "#6d28d9" },
  { label: "0800", value: 9, color: "#a16207" },
];

export default function DashboardOverview() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral" }]}
        periodLabel="Últimos 30 dias"
        notifications={3}
        user={{ name: "Admin" }}
      />

      <PageContainer>
        {/* Metric cards */}
        <section aria-label="Métricas resumidas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {MOCK_METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </section>

        {/* Heatmap + AI Insights (PLUS) */}
        <section
          aria-label="Análise avançada — plano Plus"
          className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mb-5"
          style={{ minHeight: 340 }}
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
            <a
              href="/app/casos"
              className="text-[var(--text-sm)] text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
            >
              Ver todos →
            </a>
          </div>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
            {MOCK_RECENT.length === 0 ? (
              <EmptyState
                illustration="empty"
                title="Nenhum caso aberto"
                description="Quando novos relatos chegarem, aparecerão aqui."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {["Urgência", "Categoria", "Departamento", "Protocolo", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_RECENT.map((c) => (
                      <tr
                        key={c.protocolo}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-card-hover)] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <UrgencyIndicator level={c.urgency} showLabel />
                        </td>
                        <td className="px-4 py-3 text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                          {c.category}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                          {c.dep}
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                          {c.protocolo}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="status" status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Distribution charts — Essencial */}
        <section aria-label="Distribuição de casos" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Urgency distribution */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
            <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
              Distribuição por urgência
            </h3>
            <div className="flex flex-col gap-2.5">
              {URGENCY_DIST.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] w-24 flex-shrink-0">
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
          </div>

          {/* Channel origin */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
            <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
              Canais de origem
            </h3>
            <div
              className="flex items-end gap-2 pb-2 border-b border-[var(--color-border)]"
              style={{ height: 120 }}
            >
              {CHANNEL_DIST.map((b) => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[var(--text-2xs)] font-semibold text-[var(--color-text-secondary)]">
                    {b.value}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: `${b.value}%`,
                      background: b.color,
                      borderRadius: "4px 4px 0 0",
                      opacity: 0.85,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex mt-2">
              {CHANNEL_DIST.map((b) => (
                <span
                  key={b.label}
                  className="flex-1 text-[var(--text-2xs)] text-[var(--color-text-tertiary)] text-center"
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
}
