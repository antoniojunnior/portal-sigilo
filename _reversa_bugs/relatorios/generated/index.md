<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 4 bugs (0 resolved, 3 active/delivering fixed, 1 open/triaging critical) -->

# Índice de Bugs — relatorios

## Resumo por status

| Status | Contagem |
|---|---|
| open | 1 |
| active | 3 |
| resolved | 0 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| triaging | 1 |
| delivering | 3 |

## 🔴 Incidente ativo em produção

**BUG-20260723-IDX1** (critical, P0) — `GET /api/reports/generate` retornando 500 em produção, sem workaround. Hipótese: índice Firestore removido pelo deploy da sessão anterior (`firebase deploy --only firestore:indexes`). Aguardando `/reversa-debugger-fix` com urgência máxima.

## Bugs abertos / ativos

| ID | # | Título | Severidade | Prioridade | Phase | Resolution |
|---|---|---|---|---|---|---|
| BUG-20260723-IDX1 | 12 | GET /api/reports/generate 500 em produção | critical | P0 | triaging | — |
| BUG-20260723-SCP1 | 1 | Reaproveitamento de relatório recente ignora departamento/categoria | high | P1 | delivering | fixed |
| BUG-20260723-PSU1 | 2 | Org com plano suspenso/cancelado vê "plan_suspended" cru na tela | medium | P2 | delivering | fixed |
| BUG-20260723-DUP1 | 3 | Sem dedupe no servidor — acessos concorrentes podem duplicar relatório | medium | P2 | delivering | fixed |

## Bugs resolvidos

Nenhum ainda (aguardando fechamento de closure policy).

## Travados (`DONE.md`)

Nenhum.
