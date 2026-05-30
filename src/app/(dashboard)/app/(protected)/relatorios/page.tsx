"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Lock, Download, Sparkles, ChevronRight, FileText, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface ReportSummary {
  id: string;
  tipo: "padrao" | "personalizado" | "esg";
  status: "rascunho" | "aprovado" | "exportado";
  gerado_em: string | null;
  aprovado_em: string | null;
  periodo: { inicio: string | null; fim: string | null };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 bg-gradient-to-br from-[var(--color-primary-surface)] to-[var(--color-bg-secondary)] shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
        <Lock size={36} strokeWidth={1.2} className="text-[var(--color-primary)]" />
      </div>
      <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Relatórios de IA</h2>
      <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-md">
        Geração automática de relatórios executivos disponível nos planos <strong className="text-[var(--color-text-primary)]">Gestão</strong> e <strong className="text-[var(--color-text-primary)]">Enterprise</strong>.
      </p>
      <Link href="/app/configuracoes" className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-base shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5">
        Conhecer Planos <ChevronRight size={20} />
      </Link>
    </div>
  );
}

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

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{ reports: ReportSummary[] }>(
    user && user.plano !== "entrada" ? "/api/reports/generate" : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const now = new Date();
      const periodoFim = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const periodoInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodoInicio, periodoFim, tipo: "padrao" }),
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
  }, [mutate]);

  if (!user) return null;

  if (user.plano === "entrada") {
    return (
      <>
        <DashboardHeader />
        <main className="pb-28 lg:pb-10 overflow-y-auto h-full">
          <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
            <PlanGate />
          </div>
        </main>
      </>
    );
  }

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
                  Gerar relatório do mês
                </>
              )}
            </button>
          </div>

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
                Clique em "Gerar relatório do mês" para criar o primeiro relatório executivo automaticamente.
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
