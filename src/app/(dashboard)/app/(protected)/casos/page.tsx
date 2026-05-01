"use client";

import { useState, useEffect, useCallback } from "react";
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
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "aguardando_triagem", label: "Aguardando triagem" },
  { value: "em_apuracao", label: "Em apuração" },
  { value: "pendente_informacao", label: "Pendente de informação" },
  { value: "encerrado_sem_infracao", label: "Encerrado — sem infração" },
  { value: "encerrado_com_acao", label: "Encerrado com ação" },
];

const PAGE_SIZE = 10;

export default function CasosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCases = useCallback(async (status: string, currentPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (status) params.set("status", status);

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
      console.error("[CasosPage] Erro ao carregar casos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(statusFilter, page);
  }, [fetchCases, statusFilter, page]);

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Casos" }]}
        periodLabel="Últimos 30 dias"
        user={{ name: user?.nome ?? "..." }}
      />

      <PageContainer>
        {/* Filters */}
        <div className="flex items-end gap-3 mb-5 flex-wrap">
          <div className="w-56">
            <Select
              label="Filtrar por status"
              srOnly
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            />
          </div>
          {total > 0 && (
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              {total} {total === 1 ? "caso" : "casos"}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} height="40px" rounded="md" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <EmptyState
              illustration="search"
              title="Nenhum caso encontrado"
              description="Tente ajustar os filtros para encontrar o que procura."
              action={
                <Button variant="ghost" size="sm" onClick={() => handleStatusChange("")}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] w-12">Urg.</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)] w-24">Canal</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Categoria</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Protocolo</th>
                    <th className="px-4 py-3 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">Status</th>
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
          <div className="flex items-center justify-between mt-4">
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
