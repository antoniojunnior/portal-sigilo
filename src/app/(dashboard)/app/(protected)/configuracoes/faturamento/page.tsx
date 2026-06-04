"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreditCard, ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

interface BillingInfo {
  plano_ativo: string;
  data_renovacao: string | null;
  has_asaas_customer: boolean;
}

const PLANO_LABELS: Record<string, string> = {
  entrada: "Entrada",
  gestao: "Gestão",
  enterprise: "Enterprise",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
};

const PLANO_COLORS: Record<string, string> = {
  entrada: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
  gestao: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  suspenso: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  cancelado: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function FaturamentoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/info");
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Erro ao carregar informações de faturamento.");
        return;
      }
      setInfo(await res.json() as BillingInfo);
    } catch {
      setError("Erro ao carregar informações de faturamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.replace("/app");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchInfo();
    }
  }, [user?.role, fetchInfo]);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal");
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Não foi possível acessar o portal de faturamento.");
        return;
      }
      const { url } = await res.json() as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Erro ao acessar portal de faturamento.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (!user || user.role !== "admin") return null;

  const plano = info?.plano_ativo ?? user.plano;
  const isSuspended = plano === "suspenso" || plano === "cancelado";

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Visão geral", href: "/app" },
          { label: "Configurações", href: "/app/configuracoes" },
          { label: "Faturamento" },
        ]}
      />

      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/app/configuracoes"
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft size={16} />
              Configurações
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Faturamento</h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Gerencie seu plano e informações de cobrança.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] px-4 py-3 text-sm text-[var(--color-danger)]">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-6">
              <CreditCard className="text-[var(--color-primary)]" size={20} />
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Plano atual</h2>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton height="48px" rounded="xl" />
                  <Skeleton height="32px" rounded="xl" width="60%" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-[var(--color-text-primary)]">
                          {PLANO_LABELS[plano] ?? plano}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PLANO_COLORS[plano] ?? PLANO_COLORS.entrada}`}
                        >
                          {isSuspended ? plano.toUpperCase() : "ATIVO"}
                        </span>
                      </div>
                      {info?.data_renovacao && !isSuspended && (
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                          Próxima renovação: <span className="font-semibold text-[var(--color-text-secondary)]">{formatDate(info.data_renovacao)}</span>
                        </p>
                      )}
                      {isSuspended && (
                        <p className="text-sm text-[var(--color-danger)]">
                          {plano === "cancelado"
                            ? "Assinatura cancelada. Entre em contato para reativar."
                            : "Pagamento em atraso. Regularize para restaurar o acesso completo."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-4">
                    {info?.has_asaas_customer ? (
                      <Button
                        variant="primary"
                        onClick={handleManageSubscription}
                        loading={portalLoading}
                        className="gap-2"
                      >
                        <ExternalLink size={16} />
                        Gerenciar assinatura
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                        <AlertTriangle size={15} className="shrink-0" />
                        Portal de gerenciamento não disponível para esta conta.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
