"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { CaseRow } from "@/components/ui/CaseRow";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { StatusValue, ChannelValue } from "@/components/ui/Badge";
import type { UrgencyLevel } from "@/components/ui/UrgencyIndicator";

interface CaseRecord {
  protocolo: string;
  urgency: UrgencyLevel;
  channel: ChannelValue;
  category: string;
  status: StatusValue;
  deadline?: string;
}

const MOCK_CASES: CaseRecord[] = [
  { protocolo: "ETK-2024-0042", urgency: 5, channel: "web", category: "Assédio moral", status: "em_apuracao", deadline: new Date(Date.now() - 86400000 * 2).toISOString() },
  { protocolo: "ETK-2024-0041", urgency: 4, channel: "whatsapp", category: "Fraude", status: "aguardando_triagem", deadline: new Date(Date.now() + 86400000 * 5).toISOString() },
  { protocolo: "ETK-2024-0040", urgency: 3, channel: "web", category: "Conflito de interesse", status: "em_apuracao", deadline: new Date(Date.now() + 86400000 * 12).toISOString() },
  { protocolo: "ETK-2024-0039", urgency: 2, channel: "app", category: "Segurança do trabalho", status: "pendente_informacao" },
  { protocolo: "ETK-2024-0038", urgency: 1, channel: "0800", category: "Relacionamento", status: "encerrado_com_acao" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "aguardando_triagem", label: "Aguardando triagem" },
  { value: "em_apuracao", label: "Em apuração" },
  { value: "pendente_informacao", label: "Pendente de informação" },
  { value: "encerrado_sem_infracao", label: "Encerrado — sem infração" },
  { value: "encerrado_com_acao", label: "Encerrado com ação" },
];

export default function CasosPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter
    ? MOCK_CASES.filter((c) => c.status === statusFilter)
    : MOCK_CASES;

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Casos" }]}
        periodLabel="Últimos 30 dias"
        user={{ name: "Admin" }}
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
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm">
            Exportar
          </Button>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              illustration="search"
              title="Nenhum caso encontrado"
              description="Tente ajustar os filtros para encontrar o que procura."
              action={
                <Button variant="ghost" size="sm" onClick={() => setStatusFilter("")}>
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
                  {filtered.map((c) => (
                    <CaseRow
                      key={c.protocolo}
                      {...c}
                      onClick={() => window.location.assign(`/app/casos/${c.protocolo}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
