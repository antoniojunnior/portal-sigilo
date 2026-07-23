# Legacy Impact: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: `2026-07-22`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Componentes afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/lib/insights/mapItems.ts` | Lib — Insights | `componente-novo` | LOW | Mapeamento de `items[]` → `{summary, description, recommendations}` sem duplicação (RF-01) |
| `src/lib/insights/rateLimit.ts` | Lib — Insights | `componente-novo` | LOW | Rate limit de 24h para regeneração manual (RF-03, D-02) |
| `src/app/api/dashboard/insights/route.ts` | GET /insights | `regra-alterada` | MEDIUM | Usa `mapInsightItemsToInsightResponse` (dedupe) e `source: "ai_generated"` (D-03) |
| `src/app/api/dashboard/insights/regenerate/route.ts` | POST /insights/regenerate | `componente-novo` | MEDIUM | Regeneração manual restrita a admin, com rate limit e prompt Claude duplicado da function agendada (D-01, RF-02) |
| `src/components/ui/AIInsightsCard.tsx` | UI — Card de insight | `regra-alterada` | MEDIUM | Badge de fonte (fallback), botão "Atualizar agora", CTA link para `/app/insights` (RF-04, RF-02/03, RF-05) |
| `src/app/(dashboard)/app/(protected)/insights/page.tsx` | UI — Página de insights | `componente-novo` | LOW | Página dedicada de detalhamento do insight semanal (RF-05, D-04) |
| `src/app/api/dashboard/cases/route.ts` | GET /cases | `regra-alterada` | LOW | Novos filtros `department` e `category` como query params (RF-06, Could) |
| `scripts/test-insights-mapping.ts` | Testes | `componente-novo` | LOW | Testes unitários de `mapInsightItemsToInsightResponse` |
| `scripts/test-insights-ratelimit.ts` | Testes | `componente-novo` | LOW | Testes unitários de `isRegenerationAllowed` |
| `functions/src/aiInsights.ts` | Function agendada | `preservada` | n/a | Sem alterações — comentários cruzados via D-01 para alertar sobre duplicação de lógica |

## Diff conceitual por componente

### Correção de mapeamento (RF-01)
O mapeamento de `ai_insights.items: string[]` (3 insights da IA) para os campos da UI mudou: `items[1]` não é mais usado simultaneamente como `description` e como primeiro elemento de `recommendations`. A função `mapInsightItemsToInsightResponse` dedica `items[1]` exclusivamente a `description` e usa `items[2]` para recommendations.

### Regeneração manual (RF-02/03)
Novo endpoint `POST /api/dashboard/insights/regenerate` replica a lógica de prompt/parsing de `functions/src/aiInsights.ts` no lado Next.js (D-01 — duplicação deliberada, não compartilhamento cross-runtime). Rate limit de 24h por org usa `orgs.ai_insights.gerado_em` como fonte de verdade (D-02), retornando 429 quando violado. Nunca aceita `items` do corpo da requisição (RN-05).

### Indicador de fonte (RF-04)
O campo `source` da resposta do endpoint, agora `"ai_generated"` (D-03), é consumido pelo `AIInsightsCard`. Badge "Estimativa automática" só aparece quando `source` é `"fallback"` ou `"fallback_heuristic"`. "Silêncio = IA real".

### CTA e página dedicada (RF-05/06)
O botão "Ver análise completa" agora navega para `/app/insights`. A página mostra o insight sem truncamento, com sumário, destaque, análise e recomendações. Inclui link para a lista de casos com suporte a filtros `department`/`category` (Could, RF-06).

## Preservadas

Regras do `_reversa_sdd/domain.md` que continuam intactas:

- 🟢 `generateDailyInsights` (scheduled function) continua rodando diariamente — sem alterações
- 🟢 `orgs.ai_insights` mantém a mesma estrutura de dados (`items`, `gerado_em`) — sem novos campos
- 🟢 `PUT /api/assistant` permanece órfão, sem alterações — RN-05 é satisfeita pelo novo endpoint, não por modificar o existente
- 🟢 Fallback heurístico local em `GET /api/dashboard/insights` preservado como caminho de degradação

## Modificadas

Regras que foram alteradas:

- 🟢 Mapeamento `items[1]` duplicado entre `description` e `recommendations` — **corrigido** via `mapInsightItemsToInsightResponse` (RF-01)
- 🟢 `source: "ai_scheduled"` — **renomeado** para `"ai_generated"`, cobrindo geração agendada e manual igualmente (D-03)
