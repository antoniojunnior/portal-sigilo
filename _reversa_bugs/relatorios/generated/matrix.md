<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (1 restricted, arestas dele omitidas por regra) -->

# Matriz de Relações — relatorios

| Origem | Tipo | Destino | Estado | Evidência |
|---|---|---|---|---|
| BUG-20260723-DUP1 | related-to | BUG-20260722-TCT1 (contexto insights-ia-dashboard) | proposed | — |
| BUG-20260723-IDX1 | related-to | BUG-20260723-DUP1 | proposed | Hipótese: mesmo deploy de índice Firestore que fechou o DUP1 pode ter removido o índice que o GET precisava |
| BUG-20260723-DUP2 | regression-of | BUG-20260723-DUP1 | confirmed | Teste de regressão original (scripts/test-reports-dedup.ts) falha contra o código atual — a transação que fechava o TOCTOU foi removida |

## Sem relações

BUG-20260723-SCP1 e BUG-20260723-PSU1 não têm arestas registradas.

## Nota

O bug com `visibility: restricted` tem 1 relação registrada (`caused-by BUG-20260723-IDX1`), omitida desta matriz pública por regra do README do registro.
