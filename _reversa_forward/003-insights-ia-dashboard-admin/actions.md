# Actions: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22
> Roadmap: `_reversa_forward/003-insights-ia-dashboard-admin/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 13 |
| Paralelizáveis (`[//]`) | 12 |
| Maior cadeia de dependência | 5 (T003→T005→T007→T009→T013) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar `POST /api/dashboard/insights/regenerate` com apenas o guard de auth/role admin (401/403), corpo da lógica ainda não implementado (retorno temporário) | - | `[//]` | `src/app/api/dashboard/insights/regenerate/route.ts` | 🟢 | `[X]` |
| T002 | Criar página `/app/insights` com layout base (`DashboardHeader` + `Skeleton`), sem fetch ainda, seguindo o padrão de `relatorios/[reportId]/page.tsx` (D-04) | - | `[//]` | `src/app/(dashboard)/app/(protected)/insights/page.tsx` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Escrever teste unitário cobrindo `mapInsightItemsToInsightResponse(items: string[])` (ainda não implementada): 3 itens sem duplicação entre `description`/`recommendations`, 1 item só, array vazio (RF-01) | - | `[//]` | `scripts/test-insights-mapping.ts` | 🟢 | `[X]` |
| T004 | Escrever teste unitário cobrindo `isRegenerationAllowed(lastGeneratedAt: Date, now: Date): boolean` (ainda não implementada): dentro da janela de 24h → false, fora → true, sem `lastGeneratedAt` → true (RF-03, D-02) | - | `[//]` | `scripts/test-insights-ratelimit.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Implementar `mapInsightItemsToInsightResponse` satisfazendo T003 — dedupe de `items[1]` entre `description` e `recommendations` (RF-01) | T003 | `[//]` | `src/lib/insights/mapItems.ts` | 🟢 | `[X]` |
| T006 | Implementar `isRegenerationAllowed` satisfazendo T004 — comparação de `lastGeneratedAt` vs `now` com janela de 24h (D-02) | T004 | `[//]` | `src/lib/insights/rateLimit.ts` | 🟢 | `[X]` |
| T007 | Atualizar `GET /api/dashboard/insights/route.ts`: usar `mapInsightItemsToInsightResponse` (RF-01) e trocar `source: "ai_scheduled"` → `"ai_generated"` (D-03) | T005 | `[//]` | `src/app/api/dashboard/insights/route.ts` | 🟢 | `[X]` |
| T008 | Implementar lógica completa de `POST /api/dashboard/insights/regenerate`: chamar `isRegenerationAllowed` (T006), montar o mesmo prompt/janela de 7 dias/modelo `claude-sonnet-4-6` de `functions/src/aiInsights.ts` (duplicado deliberadamente, D-01), gravar `orgs.ai_insights` em sucesso, RN-05 (nunca aceitar `items` do corpo da requisição) | T001, T006 | `[//]` | `src/app/api/dashboard/insights/regenerate/route.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Atualizar `AIInsightsCard.tsx`: badge de fonte só em fallback (RF-04, usa `source` de T007), botão "Atualizar agora" chamando o endpoint de T008 com tratamento de 429 (RF-02/03), CTA "Ver análise completa" com `href="/app/insights"` (RF-05) | T007, T008, T002 | `[//]` | `src/components/ui/AIInsightsCard.tsx` | 🟢 | `[X]` |
| T010 | Implementar fetch + render completo em `/app/insights/page.tsx`: reaproveita `GET /api/dashboard/insights` (T007), mostra o insight sem truncamento (RF-05, D-04) | T002, T007 | `[//]` | `src/app/(dashboard)/app/(protected)/insights/page.tsx` | 🟢 | `[X]` |
| T011 | (Could, D-06) Adicionar filtro opcional `department`/`category` em `GET /api/dashboard/cases` e link correspondente na página `/app/insights` (RF-06) | T010 | - | `src/app/api/dashboard/cases/route.ts`, `src/app/(dashboard)/app/(protected)/insights/page.tsx` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T012 | Adicionar log server-side (padrão já usado em `aiInsights.ts`: `logger.info`/`logger.error` equivalente) em `POST /api/dashboard/insights/regenerate` — `orgId`, `source` resultante, contagem de itens | T008 | `[//]` | `src/app/api/dashboard/insights/regenerate/route.ts` | 🟢 | `[X]` |
| T013 | Revisar copy final (não placeholder) das mensagens de erro de rate limit (horário exato de liberação) e do badge de fallback em `AIInsightsCard.tsx` | T009 | `[//]` | `src/components/ui/AIInsightsCard.tsx` | 🟢 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-to-do` | reversa |
