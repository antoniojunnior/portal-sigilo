<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (6 resolved por decisão explícita do usuário, 4 com pendência de campo residual) -->

# Índice de Bugs — configuracoes

## ✅ Promovidos a `resolved` nesta rodada

Todos os 6 bugs tinham `DONE.md` (trava criada prematuramente por commit de feature, não pelo ciclo de fix — ver histórico abaixo) mas front matter travado em `active`. Usuário instruiu explicitamente: **"promove os 11 pra resolved, código já foi entregue"**. Delivery confirmado via `git merge-base --is-ancestor`: commit `0e70981` (código, "fix: corrige 8 bugs pos-inspecao") e `d7ae0c0` (trava) ambos em `origin/main`. Janela de `post_fix_observation` foi **waived** por decisão do usuário, não por confirmação empírica de não-recorrência.

| ID | # | Título | Severidade | Prioridade | resolution_kind |
|---|---|---|---|---|---|
| BUG-20260723-MOB1 | 15 | Sem navegação mobile até Faturamento | high | P1 | fixed |
| BUG-20260723-SRT1 | 18 | sort/order não documentados na Asaas | high | P2 | fixed |
| BUG-20260723-CLP1 | 16 | Submenu colapsado não navega | medium | P2 | fixed |
| BUG-20260723-ERR1 | 17 | Erro de API da Asaas vira lista vazia | medium | P2 | fixed |
| BUG-20260723-DAT1 | 20 | Possível offset de 1 dia nas datas | medium | P3 | fixed |
| BUG-20260723-ACT1 | 19 | Item ativo não destaca em reload | low | P3 | fixed |

## ⚠️ Pendência residual (NÃO coberta pela promoção desta rodada)

A promoção corrigiu a inconsistência `DONE.md`-sem-fechamento. Mas 4 bugs ainda violam a regra "`fixed` exige `regression_tests` não vazio + `root_cause.state: confirmed`":

| Bug | Problema |
|---|---|
| MOB1, CLP1, ERR1, ACT1 | `regression_tests: []` — sem infra de teste de componente React no projeto |
| DAT1, SRT1 | `root_cause.state: hypothesized` — SRT1 é correção defensiva intencional (causa nunca confirmada contra API real da Asaas); DAT1 tem prova ao vivo na prosa mas o campo YAML não foi atualizado |

Nenhum dos dois grupos foi alterado nesta rodada (fora do escopo da instrução do usuário). Ação humana ainda recomendada.

## Resumo por status

| Status | Contagem |
|---|---|
| resolved | 6 |

## Travados (`DONE.md`) — reconciliados

Todos os 6, agora consistentes com `status: resolved`.

## Histórico

`DONE.md` desses 6 bugs veio do commit `d7ae0c0` (feature 007, "limpeza de frontend"), bundlado com código não relacionado, sem atualização de `bug.md` na época — origem investigada e reportada via `/reversa-debugger-graph` em 2026-07-23. O código de fato corrigido veio antes, no commit dedicado `0e70981` ("fix: corrige 8 bugs pos-inspecao").
