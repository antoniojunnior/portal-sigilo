# Interface: `GET /api/dashboard/insights`

> Identificador: `003-insights-ia-dashboard-admin`
> Contrato: HTTP
> Origem: contrato existente, alterado por esta feature (RF-01, D-03)

## Antes

```
GET /api/dashboard/insights

1. Lê orgs.ai_insights.items da sessão
2. Se existir: retorna { summary: items[0], highlight: null, description: items[1],
   recommendations: items.slice(1), generatedAt, source: "ai_scheduled" }
   -- BUG: items[1] aparece em description E como recommendations[0], duplicado
3. Se não existir: roda heurística local sobre cases, retorna
   { summary, highlight, description, recommendations, generatedAt, source: "fallback_heuristic" | "fallback" }
```

## Depois (RF-01, D-03 do `roadmap.md`)

```
GET /api/dashboard/insights

1. Lê orgs.ai_insights.items da sessão (gravado por generateDailyInsights OU pelo novo
   POST /api/dashboard/insights/regenerate — mesmo formato, D-01)
2. Se existir: retorna { summary: items[0], highlight: null, description: items[1],
   recommendations: [items[2]] (ou o(s) item(ns) restante(s), SEM repetir items[1]),
   generatedAt, source: "ai_generated" }
3. Se não existir: comportamento heurístico local inalterado
   { summary, highlight, description, recommendations, generatedAt, source: "fallback_heuristic" | "fallback" }
```

- `source: "ai_scheduled"` renomeado para `"ai_generated"` — cobre origem agendada e manual igualmente (D-03)
- `recommendations` deixa de incluir o item já usado em `description`
- Nenhum campo novo na resposta; nenhuma mudança de autenticação/autorização

## Idempotência e erros

- Sem mudança: continua sendo leitura pura, idempotente por natureza
- Sem mudança nos códigos de erro (401 sem sessão, 500 em falha inesperada)

## Consumidores conhecidos

- `AIInsightsCard.tsx` (único consumidor confirmado nesta sessão) — passa a usar `source` pra decidir exibir ou não o badge de fallback (RF-04)
- Nova página `/app/insights` (D-04) também consome este mesmo endpoint, sem parâmetro adicional
