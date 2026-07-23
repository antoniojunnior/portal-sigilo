# Intake: Inspeção de código — Feature 003

> Data: 2026-07-22
> Contexto: `insights-ia-dashboard`
> Origem: Inspeção proativa pós-`/reversa-coding`

## Problema 1: `source` não é persistido no Firestore

**Relato:** O `POST /api/dashboard/insights/regenerate` calcula um campo `source` (linha 111: `"fallback"` para zero casos, `"ai_generated"` para os demais), mas esse valor só aparece no corpo da resposta HTTP — NUNCA é gravado em `orgs.ai_insights`. O `GET /api/dashboard/insights`, ao ler os dados de volta, infere `source: "ai_generated"` sempre que `items` existe, independentemente de como os itens foram gerados (Claude ou hardcoded).

**Esperado:** O `source` deveria ser persistido junto com `items` e `gerado_em` no documento `orgs.ai_insights`, para que o `GET` retorne a fonte correta (ex.: `"fallback"` para zero casos, `"ai_generated"` para geração real).

**Observado:** O `source` retornado pelo `GET` é sempre `"ai_generated"` quando há `items`, mesmo para itens hardcoded (zero casos). O badge de "Estimativa automática" (RF-04) nunca aparece para itens gerados pelo caminho de zero casos, que são efetivamente fallback.

**Severidade:** LOW — impacto visual mínimo; o texto dos itens hardcoded é genérico o suficiente para não enganar o usuário.

---

## Problema 2: TOCTOU no rate limit de regeneração

**Relato:** O endpoint de regeneração lê `orgs.ai_insights.gerado_em` para verificar o rate limit (linha 30), faz a chamada à Anthropic API que pode levar vários segundos (linhas 82-86), e só então grava o novo `gerado_em` via `FieldValue.serverTimestamp()` (linhas 113-118). Em casos extremos (dois admins concorrentes, ou um admin com dois tabs), duas requisições podem passar pela checagem de rate limit antes que a primeira grave o novo timestamp.

**Esperado:** Usar uma transação Firestore (`runTransaction`) para ler `gerado_em` e escrever o novo `ai_insights` atomicamente, ou usar um campo de lock.

**Observado:** Check e write são não-atômicos. Cenário de corrida exige dois admins da mesma org agindo simultaneamente (raro), mas é tecnicamente possível.

**Severidade:** LOW — cenário de corrida muito improvável em uso real (operação de admin é rara). Custo de 1 chamada extra à Anthropic API por dia por org em caso de colisão.
