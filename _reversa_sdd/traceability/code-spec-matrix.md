# Code/Spec Matrix — portal-sigilo

> Gerado pelo Writer em 2026-07-20. Mapeia cada arquivo do legado (produto, exclui tooling/framework) para a unit de spec correspondente.
> Cobertura: 🟢 completa · 🟡 parcial · n/a candidato a análise adicional

## Route Handlers (`src/app/api/**`)

| Arquivo do legado | Unit correspondente | Cobertura |
|---|---|---|
| `src/app/api/assistant/route.ts` | `assistant/` | 🟢 |
| `src/app/api/auth/login/route.ts` | `auth/` | 🟢 |
| `src/app/api/auth/logout/route.ts` | `auth/` | 🟢 |
| `src/app/api/auth/me/route.ts` | `auth/` | 🟢 |
| `src/app/api/billing/info/route.ts` | `billing/` | 🟢 |
| `src/app/api/billing/subscription/route.ts` | `billing/` | 🟢 |
| `src/app/api/billing/invoices/route.ts` | `billing/` | 🟢 |
| `src/app/api/billing/cancel/route.ts` | `billing/` | 🟢 |
| `src/app/api/cases/route.ts` | `cases/` | 🟢 |
| `src/app/api/cases/resolve/route.ts` | `cases/` | 🟢 |
| `src/app/api/cases/track/route.ts` | `cases/` | 🟢 |
| `src/app/api/chat/route.ts` | `chat/` | 🟢 |
| `src/app/api/checkout/create/route.ts` | `checkout/` | 🟢 |
| `src/app/api/dashboard/cases/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/audit/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/mencionados/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/messages/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/heatmap/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/insights/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/metrics/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/notifications/count/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/org/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/users/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/dashboard/users/[userId]/route.ts` | `dashboard/` | 🟢 |
| `src/app/api/messages/route.ts` | `messages/` | 🟢 |
| `src/app/api/orgs/search/route.ts` | `orgs/` | 🟢 |
| `src/app/api/reports/generate/route.ts` | `reports/` | 🟢 |
| `src/app/api/reports/[reportId]/route.ts` | `reports/` | 🟢 |
| `src/app/api/reports/[reportId]/approve/route.ts` | `reports/` | 🟢 |
| `src/app/api/reports/[reportId]/export/route.ts` | `reports/` | 🟢 |
| `src/app/api/upload-attachment/route.ts` | `upload-attachment/` | 🟢 |

## Camadas transversais (`src/lib`) — cobertas nos artefatos globais do Archaeologist/Architect, referenciadas pelas units

| Arquivo do legado | Unit(s) que referenciam | Cobertura |
|---|---|---|
| `src/lib/utils/auth.ts` | `auth/`, e citado em quase toda unit autenticada | 🟢 |
| `src/lib/utils/audit.ts` | citado em `assistant/`, `auth/`, `billing/`, `chat/`, `dashboard/`, `reports/`, `upload-attachment/` | 🟢 |
| `src/lib/utils/protocol.ts` | `cases/`, `chat/` | 🟢 |
| `src/lib/triagem.ts` | `chat/` | 🟢 |
| `src/lib/asaas/getSubscription.ts` | `billing/` | 🟢 |
| `src/lib/asaas/getInvoices.ts` | `billing/` | 🟢 |
| `src/lib/asaas/cancelSubscription.ts` | `billing/` | 🟢 |
| `src/lib/asaas/createPaymentLink.ts` | `checkout/` | 🟢 |
| `src/lib/planos.ts` | citado em `checkout/design.md` (fonte de preço divergente) | 🟡 documentado como risco, sem unit própria |
| `src/lib/firebase-admin/admin.ts` | citado transversalmente | 🟢 (documentado em `_reversa_sdd/c4-components.md`, não em unit) |
| `src/lib/firebase/client.ts` | n/a — não coberto por nenhuma unit de API (é infraestrutura client-side) | n/a |
| `src/lib/env.ts` / `src/lib/env.client.ts` | citado transversalmente | 🟢 (documentado em `_reversa_sdd/c4-components.md`) |
| `src/lib/types/index.ts` | fonte primária do `_reversa_sdd/data-dictionary.md` | 🟢 |
| `src/lib/utils/protocol.ts` | ver acima | 🟢 |
| `src/middleware.ts` | citado em `_reversa_sdd/flowcharts/cross-cutting.md` | 🟡 sem unit própria (é infraestrutura, não endpoint de negócio) |

## Firebase Functions (`functions/src`) — fora do escopo de units (não são endpoints HTTP do app Next.js)

| Arquivo do legado | Cobertura |
|---|---|
| `functions/src/index.ts` | 🟢 documentado em `_reversa_sdd/c4-components.md`, `_reversa_sdd/flowcharts/cross-cutting.md` |
| `functions/src/aiInsights.ts` | 🟢 idem; referenciado por `dashboard/design.md` (fonte de `ai_insights`) |
| `functions/src/scheduledReports.ts` | 🟢 idem; duplica lógica de `reports/generate` (ver `_reversa_sdd/c4-components.md` §Dívidas técnicas #1) |
| `functions/src/webhookAsaas.ts` | 🟢 idem; referenciado por `_reversa_sdd/adrs/003-*.md` e user-story `contratar-plano-e-gerenciar-assinatura.md` |

## Frontend (`src/app/**/page.tsx`, `src/components/**`) — fora do escopo do Writer nesta execução

🔴 **Não coberto por specs de unit nesta rodada.** O plano de exploração (`.reversa/plan.md`) e a granularidade escolhida (`endpoint`) focaram nos contratos de API server-side. Páginas React, componentes de UI e o Design System (`src/components/ui`, `src/styles`) não têm `requirements.md`/`design.md`/`tasks.md` próprios. Candidatos a uma rodada adicional do Writer se granularidade `module` ou `feature` for aplicada ao frontend no futuro, ou ao agente `reversa-design-system` para tokens visuais.

## Scripts e configuração — fora do escopo de units (utilitários operacionais, não contrato de produto)

| Arquivo | Nota |
|---|---|
| `scripts/seed-emulator.ts`, `scripts/seed-remote.ts`, `scripts/seed-asaas-customer.mjs`, `scripts/test-rules.ts` | n/a — scripts de desenvolvimento/QA, não endpoints |
| `firestore.rules`, `firestore.indexes.json`, `storage.rules` | 🟢 documentados em `_reversa_sdd/permissions.md`, `_reversa_sdd/erd-complete.md` |

## Resumo de cobertura

| Categoria | Total de arquivos | Com unit própria | % |
|---|---|---|---|
| Route Handlers (`src/app/api`) | 31 arquivos `route.ts` | 31 | 100% |
| Libs transversais (`src/lib`) | 15 arquivos | 12 citados diretamente, 3 apenas em docs globais (n/a unit) | 80% direto |
| Firebase Functions | 4 arquivos | 4 (documentação global, não unit própria) | 100% (fora do padrão unit) |
| Frontend (páginas/componentes) | ~70+ arquivos `.tsx` | 0 | 0% — 🔴 fora de escopo desta rodada |
