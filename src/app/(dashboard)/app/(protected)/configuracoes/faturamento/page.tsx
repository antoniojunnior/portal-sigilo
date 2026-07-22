"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { CreditCard, ArrowLeft, AlertTriangle, Info, ArrowLeftRight, ShieldAlert } from "lucide-react";

interface SubscriptionData {
  source: "asaas" | "firestore";
  plano_ativo: string;
  valor: number | null;
  ciclo: "MONTHLY" | "YEARLY" | null;
  proximo_vencimento: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DISPUTED" | null;
  subscription_id: string | null;
}

type InvoiceStatus =
  | "RECEIVED"
  | "PENDING"
  | "OVERDUE"
  | "CANCELLED"
  | "CONFIRMED"
  | "RECEIVED_IN_CASH"
  | "REFUNDED"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE";

interface Invoice {
  id: string;
  valor: number;
  vencimento: string;
  status: InvoiceStatus;
  descricao: string | null;
  invoice_url: string | null;
}

const PLANO_LABELS: Record<string, string> = {
  unico: "Ativo",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
};

const CICLO_LABELS: Record<string, string> = {
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "ATIVO",
    className: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  },
  SUSPENDED: {
    label: "SUSPENSO",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
  INACTIVE: {
    label: "INATIVO",
    className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
  },
  DISPUTED: {
    label: "EM DISPUTA",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
};

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  RECEIVED: {
    label: "Pago",
    className: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  },
  CONFIRMED: {
    label: "Pago",
    className: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  },
  RECEIVED_IN_CASH: {
    label: "Pago (dinheiro)",
    className: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  },
  PENDING: {
    label: "Aguardando",
    className: "bg-yellow-100 text-yellow-700",
  },
  OVERDUE: {
    label: "Atrasado",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
  },
  REFUNDED: {
    label: "Estornado",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
  CHARGEBACK_REQUESTED: {
    label: "Chargeback solicitado",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
  CHARGEBACK_DISPUTE: {
    label: "Chargeback em disputa",
    className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
};

const FALLBACK_INVOICE_BADGE = {
  label: "Status desconhecido",
  className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FaturamentoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelText, setCancelText] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setSubLoading(true);
    setSubError(null);
    try {
      const res = await fetch("/api/billing/subscription");
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setSubError(d.error ?? "Erro ao carregar dados da assinatura.");
        return;
      }
      setSubscription(await res.json() as SubscriptionData);
    } catch {
      setSubError("Erro ao carregar dados da assinatura.");
    } finally {
      setSubLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const res = await fetch("/api/billing/invoices");
      if (!res.ok) {
        setInvoicesError("Erro ao carregar faturas.");
        return;
      }
      const data = await res.json() as { invoices: Invoice[] };
      setInvoices(data.invoices ?? []);
    } catch {
      setInvoicesError("Erro ao carregar faturas.");
    } finally {
      setInvoicesLoading(false);
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
      fetchSubscription();
      fetchInvoices();
    }
  }, [user?.role, fetchSubscription, fetchInvoices]);

  async function handleCancel() {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setCancelError(d.error ?? "Erro ao cancelar assinatura.");
        return;
      }
      setCancelOpen(false);
      setCancelText("");
      await fetchSubscription();
    } catch {
      setCancelError("Erro ao cancelar assinatura.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (!user || user.role !== "admin") return null;

  const statusBadge = subscription?.status ? STATUS_BADGE[subscription.status] : null;
  const hasAsaasSubscription = !!(subscription?.subscription_id);

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

          {/* ── Assinatura Ativa ── */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-6">
              <CreditCard className="text-[var(--color-primary)]" size={20} />
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Assinatura Ativa</h2>
            </div>

            <div className="p-6 space-y-6">
              {subLoading ? (
                <div className="space-y-3">
                  <Skeleton height="32px" rounded="xl" />
                  <Skeleton height="24px" rounded="xl" width="60%" />
                  <Skeleton height="24px" rounded="xl" width="40%" />
                </div>
              ) : subError ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] px-4 py-3 text-sm text-[var(--color-danger)]">
                  <AlertTriangle size={16} className="shrink-0" />
                  {subError}
                </div>
              ) : subscription ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">
                      Plano {PLANO_LABELS[subscription.plano_ativo] ?? subscription.plano_ativo}
                    </span>
                    {statusBadge && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>

                  {subscription.source === "asaas" && (
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {subscription.ciclo && (
                        <div className="space-y-1">
                          <dt className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            Ciclo
                          </dt>
                          <dd className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {CICLO_LABELS[subscription.ciclo] ?? subscription.ciclo}
                          </dd>
                        </div>
                      )}
                      {subscription.valor !== null && (
                        <div className="space-y-1">
                          <dt className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            Valor
                          </dt>
                          <dd className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {formatBRL(subscription.valor)}
                          </dd>
                        </div>
                      )}
                      {subscription.proximo_vencimento && (
                        <div className="space-y-1">
                          <dt className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            Próx. vencimento
                          </dt>
                          <dd className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {formatDate(subscription.proximo_vencimento)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {subscription.source === "firestore" && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] rounded-xl px-3 py-2">
                      <Info size={14} className="shrink-0" />
                      Dados locais — assinatura Asaas não vinculada
                    </div>
                  )}

                  {hasAsaasSubscription && (
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <Link href="/alterar-plano">
                        <Button variant="secondary" className="gap-2">
                          <ArrowLeftRight size={16} />
                          Alterar Plano
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {/* ── Faturas Recentes ── */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Faturas Recentes</h2>
            </div>

            <div className="p-6">
              {invoicesLoading ? (
                <div className="space-y-3">
                  <Skeleton height="44px" rounded="xl" />
                  <Skeleton height="44px" rounded="xl" />
                  <Skeleton height="44px" rounded="xl" />
                </div>
              ) : invoicesError ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] px-4 py-3 text-sm text-[var(--color-danger)]">
                  <AlertTriangle size={16} className="shrink-0" />
                  {invoicesError}
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Nenhuma fatura registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {invoices.map((inv) => {
                        const badge = INVOICE_STATUS[inv.status] ?? FALLBACK_INVOICE_BADGE;
                        return (
                          <tr key={inv.id} className="hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                            <td className="py-3 pr-4 text-[var(--color-text-secondary)]">
                              {formatDate(inv.vencimento)}
                            </td>
                            <td className="py-3 pr-4 text-[var(--color-text-secondary)] max-w-[160px] truncate">
                              {inv.descricao ?? "—"}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-[var(--color-text-primary)]">
                              {formatBRL(inv.valor)}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3">
                              {inv.invoice_url ? (
                                <a
                                  href={inv.invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                                >
                                  Ver fatura
                                </a>
                              ) : (
                                <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ── Cancelamento ── */}
          {hasAsaasSubscription && subscription?.status === "ACTIVE" && (
            <section className="border border-[var(--color-danger)]/30 rounded-2xl overflow-hidden bg-white">
              <div className="p-6 bg-[var(--color-danger-surface)] border-b border-[var(--color-danger)]/20">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-[var(--color-danger)]" size={20} />
                  <h2 className="text-lg font-bold text-[var(--color-danger)]">Cancelamento</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Ao cancelar a assinatura, o acesso às funcionalidades do plano será encerrado ao fim do período vigente.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => { setCancelOpen(true); setCancelError(null); setCancelText(""); }}
                  className="text-[var(--color-danger)] border border-[var(--color-danger)]/20 hover:bg-[var(--color-danger-surface)] transition-all"
                >
                  Cancelar Assinatura
                </Button>
              </div>
            </section>
          )}
        </div>
      </PageContainer>

      {/* Modal de cancelamento */}
      <Modal
        open={cancelOpen}
        onClose={() => { if (!cancelLoading) { setCancelOpen(false); setCancelText(""); setCancelError(null); } }}
        title="Cancelar Assinatura"
        persistent={cancelLoading}
        footer={
          <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-border)]">
            <Button
              variant="ghost"
              onClick={() => { setCancelOpen(false); setCancelText(""); setCancelError(null); }}
              disabled={cancelLoading}
            >
              Manter Assinatura
            </Button>
            <Button
              variant="primary"
              loading={cancelLoading}
              disabled={cancelText !== "CANCELAR"}
              onClick={handleCancel}
              className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white border-none disabled:opacity-30"
            >
              Confirmar Cancelamento
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20">
            <AlertTriangle className="text-[var(--color-danger)] shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Esta ação encerrará sua assinatura imediatamente no Asaas. O acesso às funcionalidades do plano será removido. Esta operação não pode ser desfeita automaticamente.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Digite <span className="font-mono text-[var(--color-danger)]">CANCELAR</span> para confirmar
            </label>
            <input
              type="text"
              value={cancelText}
              onChange={(e) => setCancelText(e.target.value)}
              placeholder="CANCELAR"
              className="w-full h-11 rounded-xl border border-[var(--color-border)] px-4 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]/20 transition-all"
            />
          </div>
          {cancelError && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] px-4 py-3 text-sm text-[var(--color-danger)]">
              <AlertTriangle size={16} className="shrink-0" />
              {cancelError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
