"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { UrgencyIndicator } from "@/components/ui/UrgencyIndicator";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { AuditEntry } from "@/components/ui/AuditEntry";
import { AIAssistantPanel } from "@/components/ui/AIAssistantPanel";
import { Button } from "@/components/ui/Button";
import { StatusTimeline } from "@/components/ui/StatusTimeline";

interface Props {
  params: Promise<{ caseId: string }>;
}

const MOCK_CASE = {
  protocolo: "ETK-2024-0042",
  urgency: 5 as const,
  channel: "web" as const,
  category: "Assédio moral",
  status: "em_apuracao" as const,
  summary: "Denúncia de assédio moral sistemático por parte de liderança direta. Situação relatada com ocorrências ao longo de 6 meses.",
  createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
};

const MOCK_AUDIT = [
  { action: "Caso criado via portal web", user: "Sistema", timestamp: new Date(Date.now() - 86400000 * 7).toISOString() },
  { action: "Triagem inicial realizada", user: "ana.silva@empresa.com", timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), details: "Urgência classificada como 5/5" },
  { action: "Comitê notificado", user: "Sistema", timestamp: new Date(Date.now() - 86400000 * 4).toISOString() },
];

const TIMELINE_STEPS = [
  { label: "Recebido", desc: "Relato registrado e triagem iniciada.", done: true },
  { label: "Em apuração", desc: "Comitê conduz investigação.", active: true },
  { label: "Conclusão", desc: "Resultado disponível pelo protocolo." },
];

export default function CaseDetailPage() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Casos", href: "/app/casos" },
          { label: MOCK_CASE.protocolo },
        ]}
        user={{ name: "Admin" }}
      />

      <PageContainer className="overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Case header card */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-1">{MOCK_CASE.protocolo}</p>
                  <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{MOCK_CASE.category}</h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <UrgencyIndicator level={MOCK_CASE.urgency} showLabel />
                  <ChannelBadge channel={MOCK_CASE.channel} />
                </div>
              </div>

              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {MOCK_CASE.summary}
              </p>

              <div className="flex items-center gap-3">
                <Badge variant="status" status={MOCK_CASE.status} />
                <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                  Registrado em {new Date(MOCK_CASE.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Audit log */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
                Log de auditoria
              </h2>
              {MOCK_AUDIT.map((entry, i) => (
                <AuditEntry key={i} {...entry} />
              ))}
            </div>
          </div>

          {/* Sidebar column */}
          <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-5">
            {/* Timeline */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-4">
                Progresso
              </h2>
              <StatusTimeline steps={TIMELINE_STEPS} />
            </div>

            {/* AI button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setAiOpen(true)}
              iconLeft={
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <circle cx="8" cy="8" r="5"/>
                  <path d="M6 8a2 2 0 0 1 4 0" strokeLinecap="round"/>
                  <path d="M8 13v1M3 8H2M14 8h-1" strokeLinecap="round"/>
                </svg>
              }
            >
              Analisar com IA
            </Button>

            {/* Atribuição */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-3">
                Atribuição
              </h2>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-xs)] font-semibold flex-shrink-0"
                  style={{ background: "var(--color-accent-surface)", color: "var(--color-accent-dark)" }}
                >
                  AS
                </div>
                <div>
                  <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">Ana Silva</p>
                  <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Comitê de ética</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      <AIAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={`Caso ${MOCK_CASE.protocolo}: ${MOCK_CASE.category} — ${MOCK_CASE.summary}`}
      />
    </>
  );
}
