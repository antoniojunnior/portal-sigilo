"use client";

import { useState, use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Download, CheckCircle2, RotateCcw, AlertCircle, Clock } from "lucide-react";

interface Props {
  params: Promise<{ reportId: string }>;
}

interface ReportDetail {
  id: string;
  tipo: string;
  status: "rascunho" | "aprovado" | "exportado";
  texto_claude: string;
  gerado_em: string | null;
  aprovado_em: string | null;
  periodo: { inicio: string | null; fim: string | null };
  metricas?: { total: number; resolvidos: number; pendentes: number; prazoMedio: number; topCategorias: string[] };
  tabela_analitica?: { departamento: string; categoria_legal: string; mes: string; total: number }[];
  risco_psicossocial?: { total: number; por_subcategoria: Record<string, number> };
}

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export default function ReportDetailPage({ params }: Props) {
  const { reportId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const { data: report, isLoading, error, mutate } = useSWR<ReportDetail>(
    `/api/reports/${reportId}`,
    fetcher
  );

  const [approving, setApproving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleApprove() {
    setApproving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/approve`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao aprovar");
    } finally {
      setApproving(false);
    }
  }

  async function handleRevert() {
    setReverting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/approve`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao reverter");
    } finally {
      setReverting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/export`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  if (!user) return null;

  const periodoStr = report?.periodo.inicio
    ? new Date(report.periodo.inicio).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  return (
    <>
      <DashboardHeader />
      <main className="pb-28 lg:pb-10 overflow-y-auto h-full">
        <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6 md:py-8">

          <div className="mb-6">
            <Link href="/app/relatorios" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-4">
              <ArrowLeft size={14} /> Voltar para relatórios
            </Link>

            {isLoading ? (
              <>
                <Skeleton height="36px" width="300px" className="mb-2" />
                <Skeleton height="16px" width="150px" />
              </>
            ) : error ? (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 px-4 py-3">
                <AlertCircle size={16} className="text-[var(--color-danger)]" />
                <p className="text-sm text-[var(--color-danger)]">Não foi possível carregar o relatório.</p>
              </div>
            ) : report && (
              <>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Relatório de {periodoStr}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusChip status={report.status} />
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        Gerado em {report.gerado_em ? new Date(report.gerado_em).toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {report.status === "rascunho" && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-success)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {approving ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <CheckCircle2 size={15} />}
                        Aprovar e exportar PDF
                      </button>
                    )}

                    {report.status === "aprovado" && (
                      <>
                        <button
                          type="button"
                          onClick={handleExport}
                          disabled={exporting}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all"
                        >
                          {exporting ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Download size={15} />}
                          Exportar PDF
                        </button>
                        {user.role === "admin" && (
                          <button
                            type="button"
                            onClick={handleRevert}
                            disabled={reverting}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-all"
                          >
                            <RotateCcw size={14} /> Solicitar revisão
                          </button>
                        )}
                      </>
                    )}

                    {report.status === "exportado" && (
                      <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] disabled:opacity-50 transition-all"
                      >
                        {exporting ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Download size={14} />}
                        Baixar novamente
                      </button>
                    )}
                  </div>
                </div>

                {actionError && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 px-4 py-3">
                    <AlertCircle size={15} className="text-[var(--color-danger)] flex-shrink-0" />
                    <p className="text-sm text-[var(--color-danger)]">{actionError}</p>
                  </div>
                )}

                {/* Metricas */}
                {report.metricas && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total de relatos", value: report.metricas.total },
                      { label: "Resolvidos", value: report.metricas.resolvidos },
                      { label: "Pendentes", value: report.metricas.pendentes },
                      { label: "Prazo médio (dias)", value: report.metricas.prazoMedio },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                        <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela Analítica */}
                {report.tabela_analitica && report.tabela_analitica.length > 0 && (
                  <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">Tabela Analítica (Departamento × Categoria × Mês)</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="text-left py-2 font-semibold text-[var(--color-text-secondary)]">Departamento</th>
                            <th className="text-left py-2 font-semibold text-[var(--color-text-secondary)]">Categoria</th>
                            <th className="text-left py-2 font-semibold text-[var(--color-text-secondary)]">Mês</th>
                            <th className="text-right py-2 font-semibold text-[var(--color-text-secondary)]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.tabela_analitica.map((linha, i) => (
                            <tr key={i} className="border-b border-[var(--color-border)]/50">
                              <td className="py-2 text-[var(--color-text-primary)]">{linha.departamento}</td>
                              <td className="py-2 text-[var(--color-text-secondary)]">{linha.categoria_legal.replace(/_/g, " ")}</td>
                              <td className="py-2 text-[var(--color-text-secondary)]">{linha.mes}</td>
                              <td className="py-2 text-right font-medium text-[var(--color-text-primary)]">{linha.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* NR-1 */}
                {report.risco_psicossocial && (
                  <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">Riscos Psicossociais (NR-1)</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      {report.risco_psicossocial.total > 0
                        ? `Total de ocorrências no período: ${report.risco_psicossocial.total}`
                        : "Nenhum caso classificado como risco psicossocial neste período."}
                    </p>
                    {report.risco_psicossocial.total > 0 && (
                      <div className="space-y-2">
                        {Object.entries(report.risco_psicossocial.por_subcategoria)
                          .sort(([, a], [, b]) => b - a)
                          .map(([sub, count]) => (
                            <div key={sub} className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                              <span>{sub}</span>
                              <span className="font-medium text-[var(--color-text-primary)]">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Texto Claude */}
                <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
                  <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-5">Análise Executiva</h2>
                  <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {report.texto_claude || "Texto não disponível."}
                  </div>
                </div>

                {report.status === "rascunho" && (
                  <p className="mt-4 text-xs text-center text-[var(--color-text-tertiary)]">
                    Revise o relatório acima. Após aprovar, você poderá exportar o PDF.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    rascunho: { label: "Rascunho", cls: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]", icon: <Clock size={11} /> },
    aprovado: { label: "Aprovado", cls: "bg-[var(--color-success-surface)] text-[var(--color-success)]", icon: <CheckCircle2 size={11} /> },
    exportado: { label: "Exportado", cls: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]", icon: <Download size={11} /> },
  };
  const s = map[status] ?? map.rascunho;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}
