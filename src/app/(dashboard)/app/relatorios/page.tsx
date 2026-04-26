import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/ui/MetricCard";
import { RiskCell } from "@/components/ui/RiskCell";
import { EmptyState } from "@/components/ui/EmptyState";

const RISK_MATRIX = [
  { category: "Assédio moral", scores: [45, 72, 88, 60, 35] },
  { category: "Fraude", scores: [20, 30, 55, 42, 18] },
  { category: "Segurança", scores: [10, 15, 25, 30, 12] },
  { category: "Discriminação", scores: [30, 50, 65, 78, 40] },
];

const DEPARTMENTS = ["RH", "TI", "Vendas", "Ops", "Legal"];

export default function RelatoriosPage() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Relatórios" }]}
        periodLabel="Últimos 90 dias"
        user={{ name: "Admin" }}
      />

      <PageContainer>
        {/* Summary metrics */}
        <section aria-label="Métricas do período" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total de casos" value={47} trendValue="+8%" trend="up" compareLabel="vs. trim. anterior" />
          <MetricCard label="Resolvidos" value={31} trendValue="+15%" trend="up" compareLabel="taxa de resolução" />
          <MetricCard label="Prazo médio" value="22d" trend="neutral" compareLabel="meta: 30d" />
          <MetricCard label="Reincidências" value={3} trendValue="-40%" trend="down" compareLabel="vs. trim. anterior" />
        </section>

        {/* Risk heatmap */}
        <section aria-label="Mapa de risco por departamento" className="mb-6">
          <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-3">
            Mapa de risco
          </h2>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">
                    Categoria
                  </th>
                  {DEPARTMENTS.map((d) => (
                    <th
                      key={d}
                      className="px-3 py-3 text-center text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RISK_MATRIX.map((row) => (
                  <tr key={row.category} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                      {row.category}
                    </td>
                    {row.scores.map((score, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        <div className="flex justify-center">
                          <RiskCell score={score} label={`${row.category} / ${DEPARTMENTS[i]}`} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-3 flex-wrap">
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Escala de risco:</span>
              <div className="flex items-center gap-1.5">
                {[0, 20, 40, 60, 80, 100].map((v) => (
                  <RiskCell key={v} score={v} />
                ))}
              </div>
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] ml-1">0 → 100</span>
            </div>
          </div>
        </section>

        {/* Empty state for charts (Fase 5) */}
        <section aria-label="Gráficos — em breve">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
            <EmptyState
              illustration="empty"
              title="Gráficos disponíveis na Fase 5"
              description="Tendências, canais de origem e análise temporal serão implementados com a integração de analytics."
            />
          </div>
        </section>
      </PageContainer>
    </>
  );
}
