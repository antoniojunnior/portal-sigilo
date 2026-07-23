# Interface: `POST /api/dashboard/insights/regenerate`

> Identificador: `003-insights-ia-dashboard-admin`
> Contrato: HTTP
> Origem: contrato novo (RF-02, RF-03, RN-02, RN-05, D-01, D-02)

## Antes

Não existe. `domain.md#Insight` já previa geração "sob demanda", nunca implementada.

## Depois

```
POST /api/dashboard/insights/regenerate

Auth: sessão válida, role === "admin" (mesma checagem de PUT /api/assistant)
Body: nenhum — o endpoint NÃO aceita conteúdo de insight do cliente (RN-05).
      Toda geração roda inteiramente no servidor.

1. Verifica sessão e role === admin (401/403 nos moldes já usados no projeto)
2. Lê orgs/{orgId}.ai_insights.gerado_em
3. Se (Date.now() - gerado_em) < 24h: retorna 429 com
   { error: "Regeneração disponível a partir de <ISO 8601>" } (D-02)
4. Senão: busca cases dos últimos 7 dias da org (mesma janela usada por
   generateDailyInsights), monta o mesmo prompt (top categorias, contagem de
   urgentes), chama a Anthropic API (mesmo modelo já corrigido em
   functions/src/aiInsights.ts: claude-sonnet-4-6) — lógica duplicada
   deliberadamente (D-01), não compartilhada com a Firebase Function
5. Em sucesso: grava orgs/{orgId}.ai_insights = { items, gerado_em: now },
   igual ao formato já usado pela function agendada — retorna
   { ok: true, generatedAt }
6. Em falha da Anthropic API: retorna 500 com mensagem genérica, SEM consumir
   a janela de rate limit (gerado_em só é atualizado em sucesso)
```

## Idempotência e erros

- NÃO idempotente por natureza (cada chamada bem-sucedida gera conteúdo novo) — a idempotência de fato vem do rate limit de 24h (D-02), não de deduplicação de requisição
- 401: sem sessão válida
- 403: sessão válida mas `role !== "admin"`
- 429: dentro da janela de rate limit (corpo inclui o horário exato de liberação)
- 500: falha na chamada à Anthropic API (mesma politica de erro genérico já usada em `/api/assistant`)

## Consumidores conhecidos

- Botão "Atualizar agora" em `AIInsightsCard.tsx` (RF-02) — único consumidor previsto nesta feature
