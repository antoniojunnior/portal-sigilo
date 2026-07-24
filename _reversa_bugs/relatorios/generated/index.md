<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (5 na view pública, 1 restricted; 4 resolved por decisão explícita do usuário, 1 excluído da promoção, 1 restricted resolved) -->

# Índice de Bugs — relatorios

## ✅ Promovidos a `resolved` nesta rodada

Usuário instruiu explicitamente: **"promove os 11 pra resolved, código já foi entregue"**. Delivery confirmado via `git merge-base --is-ancestor` em `origin/main`.

| ID | # | Título | Severidade | Prioridade | Delivery (código / trava) |
|---|---|---|---|---|---|
| BUG-20260723-SCP1 | 1 | Reaproveitamento de relatório ignora departamento/categoria | high | P1 | `03f61f7` / `79425a8` |
| BUG-20260723-PSU1 | 2 | "plan_suspended" cru na tela | medium | P2 | `03f61f7` / `79425a8` |
| BUG-20260723-DUP1 | 3 | TOCTOU original de geração duplicada | medium | P2 | `03f61f7` / `79425a8` |
| BUG-20260723-DUP2 | 13 | reserveReportSlot sem transação (reabertura do DUP1) | medium | P2 | `0e70981` / `d7ae0c0` |
| BUG-20260723-DGN1 (restricted) | 14 | endpoint de diagnóstico esquecido | high | P1 | `0e70981` / `d7ae0c0` |

Janela de `post_fix_observation` foi **waived** por decisão do usuário, não por confirmação empírica de não-recorrência.

## ⛔ Excluído da promoção: BUG-20260723-IDX1

`IDX1` tem `DONE.md` mas **não foi promovido**. Diferente dos outros: seu `bug.md` nunca completou o ciclo de fix — `spec_verdict: null`, `resolution_kind: null`, `root_cause.state: hypothesized` (não `confirmed`). O `DONE.md` foi criado (commit `79425a8`) sem nenhuma base documental no próprio bug. Promover isso a `resolved` criaria um registro pior — `resolved`/`fixed` sem veredito de spec nem causa confirmada. Precisa do ciclo completo de `/reversa-debugger-fix` antes de qualquer fechamento, mesmo que o incidente real já tenha sido mitigado por commits separados (`73241bb`, `0267da1`, `82f130b`).

## Resumo por status

| Status | Contagem |
|---|---|
| resolved | 5 (4 públicos + 1 restricted) |
| open | 1 (IDX1, excluído da promoção) |

## Travados (`DONE.md`) — reconciliados

SCP1, PSU1, DUP1, DUP2, DGN1 — todos agora `status: resolved`. IDX1 permanece com trava sem fechamento (inconsistência não corrigida, intencionalmente).

## Bugs de visibilidade restrita

1 bug (`DGN1`, `security_suspected: true`) promovido a `resolved` nesta rodada. Nenhum detalhe adicional exposto aqui.
