"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface InsightData {
  summary: string;
  highlight: string | null;
  description: string;
  recommendations: string[];
  generatedAt: string;
}

export function AIInsightsCard() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/dashboard/insights")
      .then(r => r.ok ? r.json() as Promise<InsightData> : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled) { setData(d); setError(false); } })
      .catch(err => { console.error("[AIInsightsCard]", err); if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const timeAgo = data ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    Math.round((new Date(data.generatedAt).getTime() - Date.now()) / (1000 * 60)),
    "minute"
  ) : "";

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton width="150px" height="24px" />
          <Skeleton width="80px" height="16px" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="space-y-3">
            <Skeleton width="40px" height="40px" />
            <Skeleton width="90%" height="20px" />
            <Skeleton width="60%" height="32px" />
            <Skeleton width="80%" height="40px" />
            <Skeleton width="140px" height="40px" rounded="xl" />
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
            <Skeleton width="150px" height="20px" className="mb-4" />
            <div className="space-y-3">
              <Skeleton width="100%" height="16px" />
              <Skeleton width="90%" height="16px" />
              <Skeleton width="95%" height="16px" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-sm)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
          <Sparkles size={28} className="opacity-20" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Insights indisponíveis no momento</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
          Não foi possível gerar novos insights estratégicos agora. Tente novamente em alguns instantes.
        </p>
        <button
          onClick={() => setAttempt(a => a + 1)}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary-surface)] px-6 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-primary)]/10"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
          <Sparkles className="text-[var(--color-primary)]" size={21} strokeWidth={1.8} />
          Insight da IA
        </h2>
        <span className="text-xs text-[var(--color-text-secondary)]">Gerado {timeAgo}</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
          <p className="mb-4 text-4xl leading-none text-[var(--color-primary)]/20 font-serif">“</p>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{data.summary}</p>
          {data.highlight && (
            <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{data.highlight}.</p>
          )}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {data.description}
          </p>
          <button className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]">
            Ver análise completa
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-700">
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Recomendações sugeridas</h3>
          <ul className="space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
