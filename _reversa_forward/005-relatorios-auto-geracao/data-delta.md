# Data Delta: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`

## 1. Resumo

Nenhum campo novo, removido ou migrado no Firestore. A feature é 100% de comportamento client-side sobre dados já existentes na coleção `reports` (ver `_reversa_sdd/data-dictionary.md` para o dicionário completo da entidade `Report`).

## 2. Campos existentes reaproveitados (sem alteração de schema)

| Campo | Entidade | Uso nesta feature |
|-------|----------|---------------------|
| `gerado_em` | `Report` | Base para calcular "gerado nas últimas 24h" (RN-01) no client |
| `periodo.inicio` / `periodo.fim` | `Report` | Comparado com `getMonthStart()`/`getMonthEnd()` para confirmar que o relatório é do "período default" |
| `tipo` | `Report` | Confirma que o relatório reaproveitável é `"padrao"` (não `"analitico"`/`"esg"`), conforme filtro default |
| `status` | `Report` | Não é critério de reaproveitamento (RN-01 não exige `status` específico — mesmo um `rascunho` recente conta) |

## 3. Campos novos

Nenhum.

## 4. Migrações necessárias

Nenhuma. Dados existentes em `reports` já têm todos os campos necessários para a nova lógica client-side.

## 5. Índices Firestore

Nenhum índice novo — a query usada para decidir reaproveitamento roda sobre o array `reports` já retornado por `GET /api/reports/generate` (últimos 50, conforme `_reversa_sdd/code-analysis.md#10. reports`), sem nova query ao Firestore.
