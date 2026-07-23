"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles, ChevronRight, FileText, Clock, CheckCircle2, Download, AlertCircle, Filter, Calendar } from "lucide-react";

interface ReportSummary {
  id: string;
  tipo: "padrao" | "personalizado" | "esg";
  status: "rascunho" | "aprovado" | "exportado";
  gerado_em: string | null;
  aprovado_em: string | null;
  periodo: { inicio: string | null; fim: string | null };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORIAS_LEGAIS = [
  "assedio_moral", "assedio_sexual", "discriminacao_salarial", "discriminacao",
  "fraude", "desvio_etico", "violacao_lgpd", "seguranca_trabalho",
  "risco_psicossocial", "conflito_interesses", "outro",
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    rascunho: { label: "Rascunho", color: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]", icon: <Clock size={11} /> },
    aprovado: { label: "Aprovado", color: "bg-[var(--color-success-surface)] text-[var(--color-success)]", icon: <CheckCircle2 size={11} /> },
    exportado: { label: "Exportado", color: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]", icon: <Download size={11} /> },
  };
  const s = map[status] ?? map.rascunho;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.color}`}>
      {s.icon}{s.label}
    </span>
  );
}

function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function getMonthEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

function getQuarterStart(): string {
  const d = new Date();
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), qMonth, 1).toISOString().split("T")[0];
}

function getQuarterEnd(): string {
  const d = new Date();
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), qMonth + 3, 0).toISOString().split("T")[0];
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState(getMonthStart());
  const [periodoFim, setPeriodoFim] = useState(getMonthEnd());
  const [preset, setPreset] = useState<"mes" | "trimestre" | "custom">("mes");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [tipo, setTipo] = useState<"padrao" | "analitico">("padrao");
  const [depts, setDepts] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/org")
      .then(r => r.ok ? r.json() as Promise<{ configuracoes: { departamentos?: string[] } }> : Promise.reject(null))
      .then(d => { if (d?.configuracoes?.departamentos) setDepts(d.configuracoes.departamentos); })
      .catch(() => {});
  }, []);

  const { data, isLoading, mutate } = useSWR<{ reports: ReportSummary[] }>(
    user ? "/api/reports/generate" : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const applyPreset = useCallback((p: "mes" | "trimestre" | "custom") => {
    setPreset(p);
    if (p === "mes") {
      setPeriodoInicio(getMonthStart());
      setPeriodoFim(getMonthEnd());
    } else if (p === "trimestre") {
      setPeriodoInicio(getQuarterStart());
      setPeriodoFim(getQuarterEnd());
    }
  }, []);

  const toggleDept = useCallback((d: string) => {
    setSelectedDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }, []);

  const toggleCat = useCallback((c: string) => {
    setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const body: Record<string, unknown> = {
        periodoInicio,
        periodoFim,
        tipo,
      };
      if (selectedDepts.length > 0) body.departamentos = selectedDepts;
      if (selectedCats.length > 0) body.categorias = selectedCats;

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      await mutate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar relatório";
      setGenerateError(msg);
    } finally {
      setGenerating(false);
    }
  }, [periodoInicio, periodoFim, tipo, selectedDepts, selectedCats, mutate]);

  if (!user) return null;

  const reports = data?.reports ?? [];

  return (
    <>
      <DashboardHeader />
      <main className="pb-28 lg:pb-10 overflow-y-auto h-full">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">

          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
                Relatórios
              </h1>
              <p className="mt-2 text-lg text-[var(--color-text-secondary)]">Relatórios executivos gerados por IA, revisados e aprovados pelo gestor.</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-all active:scale-95"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Gerando…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Gerar relatório
                </>
              )}
            </button>
          </div>

          {/* Filtros */}
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            <Filter size={14} />
            {showFilters ? "Ocultar filtros" : "Configurar período e filtros"}
          </button>

          {showFilters && (
            <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] space-y-5">
              {/* Período */}
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Período</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["mes", "trimestre", "custom"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        preset === p
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {p === "mes" ? "Mês atual" : p === "trimestre" ? "Trimestre atual" : "Customizado"}
                      {p === "trimestre" && (
                        <span className="block text-[10px] opacity-70 mt-0.5">NR-1 — análise mínima trimestral</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[var(--color-text-tertiary)]" />
                    <input
                      type="date"
                      value={periodoInicio}
                      onChange={e => { setPeriodoInicio(e.target.value); setPreset("custom"); }}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                    />
                    <span className="text-xs text-[var(--color-text-tertiary)]">até</span>
                    <input
                      type="date"
                      value={periodoFim}
                      onChange={e => { setPeriodoFim(e.target.value); setPreset("custom"); }}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Tipo de relatório</label>
                <div className="mt-2 flex gap-2">
                  {(["padrao", "analitico"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        tipo === t
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {t === "padrao" ? "Consolidado (IA)" : "Analítico (tabela)"}
                    </button>
                  ))}
                </div>
                {tipo === "analitico" && (
                  <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                    Tabela agregada por departamento × categoria × mês, sem sumarização por IA.
                  </p>
                )}
              </div>

              {/* Departamentos */}
              {depts.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Departamentos</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {depts.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDept(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          selectedDepts.includes(d)
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorias */}
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Categorias legais</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CATEGORIAS_LEGAIS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCat(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        selectedCats.includes(c)
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {c.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {generateError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 px-4 py-3">
              <AlertCircle size={16} className="text-[var(--color-danger)] flex-shrink-0" />
              <p className="text-sm text-[var(--color-danger)]">{generateError}</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5">
                  <Skeleton height="20px" width="200px" className="mb-2" />
                  <Skeleton height="14px" width="120px" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center mb-4">
                <FileText size={28} className="text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Nenhum relatório ainda</h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                Configure o período e os filtros e clique em "Gerar relatório" para criar o primeiro relatório.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const inicio = report.periodo.inicio ? new Date(report.periodo.inicio).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "—";
                const geradoEm = report.gerado_em ? new Date(report.gerado_em).toLocaleDateString("pt-BR") : "—";

                return (
                  <div key={report.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center justify-between gap-4 hover:bg-[var(--color-card-hover)] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-surface)] flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-[var(--color-primary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          Relatório de {inicio}
                          <span className="ml-2 text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">{report.tipo}</span>
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">Gerado em {geradoEm}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={report.status} />
                      <Link
                        href={`/app/relatorios/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-surface)] hover:bg-[var(--color-primary)]/10 transition-colors"
                      >
                        Ver <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
