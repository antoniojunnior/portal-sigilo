# Adendo: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: `2026-07-22`
> Cenário: `legado`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Vigência

Vigente desde 2026-07-22.

## Resumo da entrega

Refinamento do card "Insight da IA" no dashboard administrativo: correção de duplicação entre `description` e `recommendations` (RF-01), regeneração manual sob demanda com rate limit de 24h (RF-02/03), indicador visual de fonte só para fallback heurístico (RF-04), CTA "Ver análise completa" redirecionando para nova página dedicada `/app/insights` (RF-05), e filtros opcionais por departamento/categoria na lista de casos (RF-06, Could). 13/13 ações concluídas.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `architecture.md` | "Route Handlers" | `componente-novo` | Novo endpoint `POST /api/dashboard/insights/regenerate` restrito a admin, com lógica de prompt Claude duplicada de `functions/src/aiInsights.ts` (D-01) |
| `architecture.md` | "Páginas React" | `componente-novo` | Nova página `/app/insights` dedicada ao detalhamento do insight semanal (RF-05, D-04) |
| `architecture.md` | `GET /api/dashboard/insights` | `regra-alterada` | Mapeamento de `items[]` corrigido (dedupe, RF-01); `source` renomeado `"ai_scheduled"` → `"ai_generated"` (D-03) |
| `domain.md` | "Insight" | `regra-alterada` | Definição do legado já previa "sob demanda" — agora implementado via `POST /insights/regenerate` com rate limit (RN-02) |
| `code-analysis.md` §1 | `PUT /api/assistant` | `preservada` | Continua existindo como está (órfão) — RN-05 satisfeita pelo novo endpoint, não por alterar o `PUT` |
| `code-analysis.md` §7 | `GET /insights` | `regra-alterada` | Caminho de fallback preservado; caminho de IA agora distingue fonte via `source: "ai_generated"` (RN-03, RF-04) |
| `code-analysis.md` §12 | `aiInsights.ts` | `preservada` | Function agendada sem alterações — comentário cruzado com o novo Route Handler para alertar sobre duplicação de lógica (D-01) |

## Regras sob vigilância

W001–W010 em `_reversa_forward/003-insights-ia-dashboard-admin/regression-watch.md`. Destaque:

- **W001** (`items[1]` não duplicado entre `description` e `recommendations` — verificado em `mapItems.ts`)
- **W002** (`source: "ai_generated"` substituiu `"ai_scheduled"` — confirmado em `insights/route.ts`)
- **W004** (regeneração rejeita 429 com rate limit — confirmado em `regenerate/route.ts`)
- **W007** (CTA "Ver análise completa" navega para `/app/insights` — confirmado em `AIInsightsCard.tsx`)
- **W009** (regeneração nunca aceita `items` do corpo — confirmado: endpoint só lê `orgId` da sessão)

## Fontes

- `_reversa_forward/003-insights-ia-dashboard-admin/legacy-impact.md`
- `_reversa_forward/003-insights-ia-dashboard-admin/regression-watch.md`
- `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md`
- `_reversa_forward/003-insights-ia-dashboard-admin/roadmap.md`
- `_reversa_forward/003-insights-ia-dashboard-admin/progress.jsonl` (13 ações concluídas)

## Atualização 2026-07-22 — Correção de bugs pós-inspeção

Após inspeção com `/reversa-debugger`, dois bugs foram identificados e corrigidos:

### BUG-10: `source` não persistido no Firestore

- **Arquivo:** `src/app/api/dashboard/insights/regenerate/route.ts`
- **Correção:** `source` agora é persistido em `orgs.ai_insights` junto com `items` e `gerado_em`
- **Arquivo:** `src/app/api/dashboard/insights/route.ts`
- **Correção:** GET lê `aiInsights.source` do Firestore com fallback `?? "ai_generated"` para dados antigos

### BUG-11: TOCTOU no rate limit

- **Arquivo:** `src/app/api/dashboard/insights/regenerate/route.ts`
- **Correção:** Check de rate limit usa `adminDb.runTransaction()` para atomicidade leitura+escrita de `gerado_em`

Registros completos em `_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-SRC1-source-nao-persistido/bug.md` e `BUG-20260722-TCT1-toctou-rate-limit/bug.md`.
