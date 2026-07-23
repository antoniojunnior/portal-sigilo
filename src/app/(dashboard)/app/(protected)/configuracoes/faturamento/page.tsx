"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { CreditCard, AlertTriangle, ShieldAlert } from "lucide-react";

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
  data_pagamento: string | null;
}

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  RECEIVED: { label: "Pago", className: "bg-[var(--color-success-surface)] text-[var(--color-success)]" },
  CONFIRMED: { label: "Pago", className: "bg-[var(--color-success-surface)] text-[var(--color-success)]" },
  RECEIVED_IN_CASH: { label: "Pago (dinheiro)", className: "bg-[var(--color-success-surface)] text-[var(--color-success)]" },
  PENDING: { label: "Aguardando", className: "bg-yellow-100 text-yellow-700" },
  OVERDUE: { label: "Atrasado", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
  CANCELLED: { label: "Cancelado", className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]" },
  REFUNDED: { label: "Estornado", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
  CHARGEBACK_REQUESTED: { label: "Chargeback solicitado", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
  CHARGEBACK_DISPUTE: { label: "Chargeback em disputa", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
};

const FALLBACK_INVOICE_BADGE = {
  label: "Status desconhecido",
  className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
};

function formatDate(iso: string): string {
  // BUG-20260723-DAT1: parse manual da parte de data, ignorando qualquer
  // componente de hora/timezone. new Date(iso) trataria "YYYY-MM-DD" (data
  // pura, sem hora) como meia-noite UTC, que em America/Sao_Paulo (UTC-3)
  // exibiria o dia anterior. Construir a data com ano/mês/dia locais evita
  // o offset, funcionando tanto para data pura quanto para ISO com horário.
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FaturamentoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelText, setCancelText] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchInvoices();
    }
  }, [user?.role, fetchInvoices]);

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
      await fetchInvoices();
    } catch {
      setCancelError("Erro ao cancelar assinatura.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (!user || user.role !== "admin") return null;

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

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Faturamento</h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">Gerencie suas informações de cobrança.</p>
          </div>

          {/* ── Faturas ── */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-6">
              <CreditCard className="text-[var(--color-primary)]" size={20} />
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Faturas</h2>
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
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Vencimento</th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Descrição</th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Valor</th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Pagamento</th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {invoices.map((inv) => {
                        const badge = INVOICE_STATUS[inv.status] ?? FALLBACK_INVOICE_BADGE;
                        return (
                          <tr key={inv.id} className="hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                            <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{formatDate(inv.vencimento)}</td>
                            <td className="py-3 pr-4 text-[var(--color-text-secondary)] max-w-[160px] truncate">{inv.descricao ?? "—"}</td>
                            <td className="py-3 pr-4 font-semibold text-[var(--color-text-primary)]">{formatBRL(inv.valor)}</td>
                            <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{inv.data_pagamento ? formatDate(inv.data_pagamento) : "—"}</td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>{badge.label}</span>
                            </td>
                            <td className="py-3">
                              {inv.invoice_url ? (
                                <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--color-primary)] hover:underline">Ver fatura</a>
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
            <Button variant="ghost" onClick={() => { setCancelOpen(false); setCancelText(""); setCancelError(null); }} disabled={cancelLoading}>
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
