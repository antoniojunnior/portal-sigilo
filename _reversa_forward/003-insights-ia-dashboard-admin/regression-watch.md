# Regression Watch: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: `2026-07-22`
> Legacy Impact: `_reversa_forward/003-insights-ia-dashboard-admin/legacy-impact.md`

## Watch items

| ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------|----------------------------|---------------------|-------------------|
| W001 | `legacy-impact.md` § "Correção de mapeamento" | `items[1]` não aparece simultaneamente em `description` e `recommendations` no `GET /api/dashboard/insights` | `ausência` | `aiInsights.items.slice(1)` como `recommendations` com `aiInsights.items[1]` também em `description` |
| W002 | `legacy-impact.md` § "Correção de mapeamento" | `source` retornado é `"ai_generated"` (não `"ai_scheduled"`) quando há `ai_insights.items` | `presença` | String literal `"ai_scheduled"` em `src/app/api/dashboard/insights/route.ts` |
| W003 | `legacy-impact.md` § "Regeneração manual" | `POST /api/dashboard/insights/regenerate` existe e é restrito a `role === admin` | `presença` | Rota ausente ou sem verificação de role |
| W004 | `legacy-impact.md` § "Regeneração manual" | Regeneração rejeita 429 quando `isRegenerationAllowed` retorna `false` | `presença` | Regeneração aceita sem verificação de rate limit |
| W005 | `legacy-impact.md` § "Indicador de fonte" | Badge "Estimativa automática" aparece SOMENTE quando `source` é `"fallback"` ou `"fallback_heuristic"` | `presença` | Badge renderizado quando `source === "ai_generated"` |
| W006 | `legacy-impact.md` § "Indicador de fonte" | `AIInsightsCard.tsx` não renderiza badge quando `source` é `"ai_generated"` | `ausência` | Badge visível para insights gerados por IA real |
| W007 | `legacy-impact.md` § "CTA" | Botão "Ver análise completa" navega para `/app/insights` | `presença` | Botão sem `href` ou sem `onClick` (CTA morto) |
| W008 | `legacy-impact.md` § "CTA" | Página `/app/insights` existe e carrega dados de `GET /api/dashboard/insights` | `presença` | Rota `/app/insights` retornando 404 ou página sem fetch |
| W009 | `legacy-impact.md` § "Regeneração manual" | Regeneração NUNCA aceita `items` do corpo da requisição | `ausência` | `req.json()` body contendo `items` sendo usado para gravar `ai_insights` |
| W010 | `legacy-impact.md` § "Regeneração manual" | `ai_insights.gerado_em` é atualizado após regeneração bem-sucedida | `presença` | Campo `gerado_em` não atualizado em `POST /regenerate` |

## Histórico de re-extrações

<!-- Preenchido pelo agente reverso ao rodar /reversa novamente -->

| Data | Re-extração | Watch items violados | Ação tomada |
|------|-------------|---------------------|-------------|
| - | - | - | - |

## Arquivadas

<!-- Watch items que foram removidos por re-extração confirmando conformidade -->

| ID | Data de arquivamento | Motivo |
|----|---------------------|--------|
| - | - | - |

## Observações

RF-06 (Could) implementado com filtros `department`/`category` em `GET /api/dashboard/cases`. O link na página `/app/insights` usa `href="/app/casos"` — a filtragem por departamento/categoria fica a cargo do usuário selecionar na página de casos. Caso se queira passar os filtros como query params da URL, requer alteração na página de casos para ler `searchParams`.

Duplicação de lógica de prompt/parsing entre `src/app/api/dashboard/insights/regenerate/route.ts` e `functions/src/aiInsights.ts` (D-01) — risco de divergência futura. Considerar extração para lib compartilhada se um terceiro ponto de geração surgir.
