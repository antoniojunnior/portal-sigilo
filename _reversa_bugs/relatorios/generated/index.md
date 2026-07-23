<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (5 na view pública, 1 restricted omitido) -->

# Índice de Bugs — relatorios

## ⚠️ Inconsistência de schema detectada (não corrigida automaticamente)

`BUG-20260723-IDX1` tem `DONE.md` (encerrado) na pasta, mas o front matter do `bug.md` continua com `status: open`, `phase: triaging`, `resolution_kind: null`. Ação humana recomendada: reconciliar o front matter com o `DONE.md`.

## Resumo por status

| Status | Contagem |
|---|---|
| open | 1 (IDX1, ver inconsistência acima) |
| active | 4 |
| resolved | 0 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| triaging | 1 |
| delivering | 4 |

## ✅ Corrigidos nesta sessão

**BUG-20260723-DUP2** (medium) — `runTransaction` restaurado em `reserveReportSlot`, fechando de novo o TOCTOU. Investigação concluiu que a alegação original de "incompatibilidade Vercel" não tinha sustentação; 5/5 testes verdes.

**BUG-20260723-DGN1** (high, restricted) — endpoint de diagnóstico removido do repositório.

## Bugs abertos / ativos (visibility: normal)

| ID | # | Título | Severidade | Prioridade | Phase | Resolution |
|---|---|---|---|---|---|---|
| BUG-20260723-IDX1 | 12 | GET /api/reports/generate 500 em produção | critical | P0 | triaging | — (ver inconsistência) |
| BUG-20260723-SCP1 | 1 | Reaproveitamento de relatório ignora departamento/categoria | high | P1 | delivering | fixed |
| BUG-20260723-DUP2 | 13 | reserveReportSlot sem transação — TOCTOU reaberto | medium | P2 | delivering | fixed |
| BUG-20260723-PSU1 | 2 | "plan_suspended" cru na tela | medium | P2 | delivering | fixed |
| BUG-20260723-DUP1 | 3 | TOCTOU original (ver DUP2) | medium | P2 | delivering | fixed |

## Bugs de visibilidade restrita

1 bug com `visibility: restricted` (`security_suspected: true`), corrigido nesta sessão (removido). Não listado aqui por regra do README.

## Bugs resolvidos

Nenhum ainda — todos `active/delivering` (aguardando `delivery` real + janela de `post_fix_observation`, `closure_policy: production-service`).

## Travados (`DONE.md`)

- BUG-20260723-IDX1 (inconsistência de front matter, ver acima)
- BUG-20260723-DUP1 (fechado; correção foi revertida e re-corrigida via BUG-20260723-DUP2)
