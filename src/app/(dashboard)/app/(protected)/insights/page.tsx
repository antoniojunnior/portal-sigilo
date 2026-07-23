"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles, AlertTriangle, TrendingUp, RefreshCw, ArrowRight, ExternalLink } from "lucide-react";

interface InsightData {
  summary: string;
  highlight: string | null;
  description: string;
  recommendations: string[];
  generatedAt: string;
  source?: string;
}

// BUG-20260723-ADM1: lança em resposta não-ok (ex.: 403 de não-admin) em vez de
// tratar o corpo de erro como se fosse InsightData válido.
const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.replace("/app");
    }
  }, [user, router]);

  const { data, isLoading, error, mutate } = useSWR<InsightData>(
    user?.role === "admin" ? "/api/dashboard/insights" : null,
    fetcher,
    { refreshInterval: 0 }
  );

  const isFallback = data?.source === "fallback" || data?.source === "fallback_heuristic";
  const isAiGenerated = data?.source === "ai_generated";

  // BUG-20260723-DTN1: Date.now() é impuro e não pode ser chamado direto no corpo
  // do componente (regra react-hooks/purity) — "agora" vira estado, atualizado em
  // efeito toda vez que generatedAt muda.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- captura o "agora" (impuro) fora do render, único jeito de sincronizar
    setNow(Date.now());
  }, [data?.generatedAt]);

  const timeAgo = data?.generatedAt && now !== null
    ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
        Math.round((new Date(data.generatedAt).getTime() - now) / (1000 * 60)),
        "minute"
      )
    : "";

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Insights de IA" }]}
        />
        <PageContainer>
          <div className="mb-8">
            <Skeleton width="250px" height="36px" />
            <Skeleton width="400px" height="20px" className="mt-2" />
          </div>
          <section className="space-y-6">
            <Skeleton width="100%" height="120px" rounded="xl" />
            <Skeleton width="100%" height="120px" rounded="xl" />
            <Skeleton width="100%" height="120px" rounded="xl" />
          </section>
        </PageContainer>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Insights de IA" }]}
        />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-[var(--color-bg-secondary)]">
              <Sparkles size={28} className="text-[var(--color-text-tertiary)] opacity-40" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Insights indisponíveis
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-md">
              Não foi possível carregar os insights. Tente novamente recarregando a página.
            </p>
            <button
              onClick={() => mutate()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-card-hover)]"
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Insights de IA" }]}
      />
      <PageContainer>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                <Sparkles className="text-[var(--color-primary)]" size={28} strokeWidth={1.8} />
                Insights de IA
              </h1>
              {isFallback && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-warning-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
                  <AlertTriangle size={12} strokeWidth={2} />
                  Estimativa automática
                </span>
              )}
              {isAiGenerated && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                  <TrendingUp size={12} strokeWidth={2} />
                  Análise IA
                </span>
              )}
            </div>
            <p className="mt-2 text-[var(--text-md)] text-[var(--color-text-secondary)]">
              Análise gerada {isAiGenerated ? "por IA" : "automaticamente"} com base nos casos recentes da sua organização.
            </p>
            {timeAgo && (
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Gerado {timeAgo}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp size={18} strokeWidth={1.8} className="text-[var(--color-primary)]" />
                Sumário
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {data.summary}
              </p>
              {data.highlight && (
                <div className="mt-4 rounded-xl border border-[var(--color-primary)]/10 bg-[var(--color-primary-surface)] p-4">
                  <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {data.highlight}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Sparkles size={18} strokeWidth={1.8} className="text-[var(--color-primary)]" />
                Análise
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {data.description}
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <ArrowRight size={18} strokeWidth={1.8} className="text-[var(--color-primary)]" />
                Recomendações
              </h2>
              <ul className="space-y-4">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                    {rec}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex justify-center pt-4">
              <Link
                href="/app/casos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                Ver todos os casos
                <ExternalLink size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
