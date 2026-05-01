"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { CaseRow } from "@/components/ui/CaseRow";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

export default function CasosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [sortValue, setSortValue] = useState("created_at|desc");
  const [protocolSearch, setProtocolSearch] = useState("");
  const [protocolDebounced, setProtocolDebounced] = useState("");

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
        <div className="mb-4 space-y-3">
          {/* Protocol search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 16 16" width="14" height="14" fill="none"
              stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" aria-hidden
            >
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="M11 11l2.5 2.5" />
            </svg>
            <input
              type="search"
              placeholder="Buscar por protocolo (ex: ETK-2024-…)"
              value={protocolSearch}
              onChange={(e) => { setProtocolSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              aria-label="Buscar por protocolo"
            />
          </div>

          {/* Filter row — scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            <div className="flex-shrink-0 w-44 sm:w-48">
              <Select
                label="Status"
                srOnly
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-shrink-0 w-40 sm:w-44">
              <Select
                label="Urgência"
                srOnly
                options={URGENCY_OPTIONS}
                value={urgencyFilter}
                onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-shrink-0 w-36 sm:w-40">
              <Select
                label="Canal"
                srOnly
                options={CHANNEL_OPTIONS}
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-shrink-0 w-40 sm:w-44">
              <Select
                label="Ordenar por"
                srOnly
                options={SORT_OPTIONS}
                value={sortValue}
                onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="flex-shrink-0">
                Limpar filtros
              </Button>
            )}

            {/* CSV export — plan-gated */}
            <div className="ml-auto flex-shrink-0">
              {canExportCSV ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={cases.length === 0}
                  onClick={() => exportCSV(cases)}
                  iconLeft={
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                      <path d="M8 2v8M5 7l3 3 3-3" />
                      <path d="M3 12h10" />
                    </svg>
                  }
                >
                  Exportar CSV
                </Button>
              ) : (
                <span
                  title="Exportação disponível nos planos Gestão e Enterprise"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[var(--text-xs)] text-[var(--color-text-tertiary)] cursor-default select-none"
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    <rect x="5" y="8" width="6" height="5" rx="1" />
                    <path d="M5 8V6a3 3 0 1 1 6 0v2" />
                  </svg>
                  Exportar CSV
                </span>
              )}
            </div>
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
              {total} {total === 1 ? "caso encontrado" : "casos encontrados"}
              {hasActiveFilters && " com os filtros ativos"}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} height="40px" rounded="md" />
              ))}
            </div>
          ) : cases.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 640 }}>
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] w-12">Urg.</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] w-24">Canal</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Categoria</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Protocolo</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Status</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] text-right w-20">Em aberto</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] text-right w-20">Prazo</th>
                  </tr>
                </thead>
                <tbody>
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
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 gap-3">
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ← Anterior
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Próximo →
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
