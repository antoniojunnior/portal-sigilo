# Actions: Limpeza de Frontend

> Identificador: `007-limpeza-frontend`
> Data: `2026-07-23`

## Resumo

| Metrica | Valor |
|---------|-------|
| Total de acoes | 6 |
| Paralelizaveis | 4 |

## Fase 1, Preparacao

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Status |
|----|-----------|--------------|-------------|--------------|--------|
| T001 | Deletar arquivos: ProgressSteps.tsx, RiskCell.tsx, PortalLayout.tsx, PortalHeader.tsx, ChatInput.tsx, ChatAttachment.tsx | - | `[//]` | `src/components/` | `[X]` |
| T002 | Atualizar barrel export `ui/index.ts`: remover `ProgressSteps` e `RiskCell` | T001 | - | `src/components/ui/index.ts` | `[X]` |

## Fase 2, Nucleo

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Status |
|----|-----------|--------------|-------------|--------------|--------|
| T003 | Deletar endpoints orfaos: `src/app/api/billing/info/` e `src/app/api/billing/subscription/` | - | `[//]` | `src/app/api/billing/` | `[X]` |
| T004 | Deletar endpoint de diagnostico: `src/app/api/reports/diagnostic/` | - | `[//]` | `src/app/api/reports/` | `[X]` |
| T005 | Remover `useRouter` nao usado em `relatorios/[reportId]/page.tsx` | - | `[//]` | `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx` | `[X]` |

## Fase 3, Integracao

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Status |
|----|-----------|--------------|-------------|--------------|--------|
| T006 | Adicionar `ErrorBoundary` no `DashboardLayout.tsx` + item `/app/insights` no `Sidebar.tsx` | - | - | `src/components/layout/DashboardLayout.tsx`, `src/components/layout/Sidebar.tsx` | `[X]` |

## Historico de alteracoes

| Data | Alteracao | Autor |
|------|-----------|-------|
| 2026-07-23 | Executado em YOLO mode | reversa |
