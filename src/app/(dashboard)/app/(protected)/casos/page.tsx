"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { CaseRow } from "@/components/ui/CaseRow";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, FilterX, Download } from "lucide-react";
import type { StatusValue, ChannelValue } from "@/components/ui/Badge";
import type { UrgencyLevel } from "@/components/ui/UrgencyIndicator";
import type { CaseStatus, CanalOrigem, UrgenciaNivel } from "@/lib/types";

interface CaseRecord {
  id: string;
  protocolo: string;
  urgencia?: UrgenciaNivel;
  canal_origem: CanalOrigem;
  categoria?: string;
  status: CaseStatus;
  prazo?: string;
  created_at?: string;
  dias_em_aberto?: number | null;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "aguardando_triagem", label: "Aguardando triagem" },
  { value: "em_apuracao", label: "Em apuração" },
  { value: "pendente_informacao", label: "Pendente de informação" },
  { value: "encerrado_sem_infracao", label: "Encerrado — sem infração" },
  { value: "encerrado_com_acao", label: "Encerrado com ação" },
];

const URGENCY_OPTIONS = [
  { value: "", label: "Todas as urgências" },
  { value: "5", label: "5 — Crítica" },
  { value: "4", label: "4 — Alta" },
  { value: "3", label: "3 — Média" },
  { value: "2", label: "2 — Moderada" },
  { value: "1", label: "1 — Baixa" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "Todos os canais" },
  { value: "web", label: "Web" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "app", label: "App" },
  { value: "0800", label: "0800" },
];

const SORT_OPTIONS = [
  { value: "created_at|desc", label: "Mais recentes" },
  { value: "created_at|asc", label: "Mais antigos" },
  { value: "urgencia|desc", label: "Maior urgência" },
  { value: "urgencia|asc", label: "Menor urgência" },
  { value: "prazo|asc", label: "Prazo próximo" },
];

const PAGE_SIZE = 10;

function getPaginationItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "...")[] = [1];
  if (current > 3) items.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (current < total - 2) items.push("...");
  items.push(total);
  return items;
}

const STATUS_LABELS: Record<string, string> = {
  aguardando_triagem: "Triagem",
  em_apuracao: "Apurando",
  pendente_informacao: "Pendente",
  encerrado_sem_infracao: "Encerrado",
  encerrado_com_acao: "Encerrado",
};

const STATUS_CLASSES: Record<string, string> = {
  aguardando_triagem: "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
  em_apuracao: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
  pendente_informacao: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
  encerrado_sem_infracao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  encerrado_com_acao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
};

function exportCSV(cases: CaseRecord[]) {
  const headers = ["Protocolo", "Categoria", "Urgência", "Canal", "Status", "Dias em aberto", "Prazo"];
  const rows = cases.map((c) => [
    c.protocolo,
    c.categoria ?? "",
    c.urgencia ?? "",
    c.canal_origem,
    c.status,
    c.dias_em_aberto ?? "",
    c.prazo ? new Date(c.prazo).toLocaleDateString("pt-BR") : "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CasosContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState(
    searchParams.get("filtro") === "urgente" ? "4" : ""
  );
  const [channelFilter, setChannelFilter] = useState("");
  const [sortValue, setSortValue] = useState("created_at|desc");
  const [protocolSearch, setProtocolSearch] = useState(searchParams.get("protocol") ?? "");
  const [protocolDebounced, setProtocolDebounced] = useState(searchParams.get("protocol") ?? "");

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce protocol search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setProtocolDebounced(protocolSearch), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [protocolSearch]);

  const fetchCases = useCallback(async (
    status: string,
    urgency: string,
    channel: string,
    sort: string,
    protocol: string,
    currentPage: number,
  ) => {
    setLoading(true);
    try {
      const [sortBy, sortDir] = sort.split("|");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        sortBy: sortBy ?? "created_at",
        sortDir: sortDir ?? "desc",
      });
      if (status) params.set("status", status);
      if (urgency) params.set("urgency", urgency);
      if (channel) params.set("channel", channel);
      if (protocol) params.set("protocol", protocol);

      const res = await fetch(`/api/dashboard/cases?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json() as {
        cases: CaseRecord[];
        total: number;
        page: number;
        totalPages: number;
      };
      setCases(data.cases ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("[CasosPage]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(statusFilter, urgencyFilter, channelFilter, sortValue, protocolDebounced, page);
  }, [fetchCases, statusFilter, urgencyFilter, channelFilter, sortValue, protocolDebounced, page]);

  function resetFilters() {
    setStatusFilter("");
    setUrgencyFilter("");
    setChannelFilter("");
    setSortValue("created_at|desc");
    setProtocolSearch("");
    setPage(1);
  }

  const hasActiveFilters = !!(statusFilter || urgencyFilter || channelFilter || protocolSearch);
  const canExportCSV = user?.plano !== "entrada";

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Casos" }]}
        periodLabel="Últimos 30 dias"
      />

      <PageContainer>
        {/* Search + filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Protocol search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]"
                size={18}
                strokeWidth={1.8}
              />
              <input
                type="search"
                placeholder="Buscar por protocolo (ex: ETK-2024-…)"
                value={protocolSearch}
                onChange={(e) => { setProtocolSearch(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] text-[var(--text-sm)] shadow-[var(--shadow-xs)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                aria-label="Buscar por protocolo"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" iconLeft={<FilterX size={16} strokeWidth={1.8} />}>
                  Limpar filtros
                </Button>
              )}

              {/* CSV export — plan-gated */}
              <div className="flex-shrink-0">
                {canExportCSV ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={cases.length === 0}
                    onClick={() => exportCSV(cases)}
                    className="h-10 rounded-xl px-4 font-semibold shadow-[var(--shadow-xs)]"
                    iconLeft={<Download size={16} strokeWidth={1.8} />}
                  >
                    Exportar CSV
                  </Button>
                ) : (
                  <span
                    title="Exportação disponível nos planos Gestão e Enterprise"
                    className="flex h-10 items-center gap-2 px-4 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--text-xs)] text-[var(--color-text-tertiary)] cursor-default select-none"
                  >
                    <Download size={16} strokeWidth={1.8} />
                    Exportar CSV
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter row — scrollable on mobile */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            <div className="flex-shrink-0 w-44">
              <Select
                label="Status"
                srOnly
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-10 text-sm shadow-[var(--shadow-xs)]"
              />
            </div>
            <div className="flex-shrink-0 w-44">
              <Select
                label="Urgência"
                srOnly
                options={URGENCY_OPTIONS}
                value={urgencyFilter}
                onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
                className="h-10 text-sm shadow-[var(--shadow-xs)]"
              />
            </div>
            <div className="flex-shrink-0 w-40">
              <Select
                label="Canal"
                srOnly
                options={CHANNEL_OPTIONS}
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
                className="h-10 text-sm shadow-[var(--shadow-xs)]"
              />
            </div>
            <div className="flex-shrink-0 w-44">
              <Select
                label="Ordenar por"
                srOnly
                options={SORT_OPTIONS}
                value={sortValue}
                onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                className="h-10 text-sm shadow-[var(--shadow-xs)]"
              />
            </div>

            {!loading && (
              <span className="ml-auto text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                {total} {total === 1 ? "caso" : "casos"}
              </span>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden transition-all">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="48px" rounded="xl" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="py-12">
              <EmptyState
                illustration="search"
                title="Nenhum caso encontrado"
                description={hasActiveFilters ? "Tente ajustar os filtros para encontrar o que procura." : "Quando novos relatos chegarem, aparecerão aqui."}
                action={
                  hasActiveFilters ? (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Limpar filtros
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/app/casos/${c.id}`)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${(c.urgencia ?? 1) >= 4 ? "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" : "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"}`}>
                    {c.urgencia ?? 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                      {c.categoria || "Sem categoria"}
                    </p>
                    <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                      #{c.protocolo}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_CLASSES[c.status] ?? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 800 }}>
                <thead>
                  <tr className="h-12 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider w-16">Urg.</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider w-24">Canal</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Protocolo</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-right w-24">Em aberto</th>
                    <th className="px-4 py-2 text-[var(--text-2xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-right w-24">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {cases.map((c) => (
                    <CaseRow
                      key={c.id}
                      protocolo={c.protocolo}
                      urgency={(c.urgencia ?? 1) as UrgencyLevel}
                      channel={(c.canal_origem ?? "web") as ChannelValue}
                      category={c.categoria}
                      status={c.status as StatusValue}
                      deadline={c.prazo}
                      diasEmAberto={c.dias_em_aberto ?? undefined}
                      onClick={() => router.push(`/app/casos/${c.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <span className="text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)]">
              Mostrando <span className="text-[var(--color-text-primary)]">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="text-[var(--color-text-primary)]">{Math.min(page * PAGE_SIZE, total)}</span> de <span className="text-[var(--color-text-primary)]">{total}</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl shadow-[var(--shadow-xs)]"
              >
                ← Anterior
              </Button>
              <div className="flex items-center gap-1">
                {getPaginationItems(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--color-text-tertiary)]">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === p ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)]"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl shadow-[var(--shadow-xs)]"
              >
                Próximo →
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}

export default function CasosPage() {
  return (
    <Suspense>
      <CasosContent />
    </Suspense>
  );
}
