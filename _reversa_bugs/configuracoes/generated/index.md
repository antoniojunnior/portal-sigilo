<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (0 resolved, 6 active/delivering fixed, 6 inconsistências de invariante) -->

# Índice de Bugs — configuracoes

## ⚠️ Inconsistências de invariante (não corrigidas automaticamente)

Validação global (`/reversa-debugger-graph`) encontrou violações da regra "`resolution_kind: fixed` exige `root_cause.state: confirmed`, `regression_tests` não vazio e `spec_verdict` preenchido":

| Bug | Problema | Causa provável |
|---|---|---|
| BUG-20260723-MOB1 | `regression_tests: []` | Sem infra de teste de componente React no projeto — verificação foi só typecheck/lint/revisão manual |
| BUG-20260723-CLP1 | `regression_tests: []` | Idem |
| BUG-20260723-ERR1 | `regression_tests: []` | Idem (mudança de servidor, sem teste automatizado do fluxo de erro end-to-end) |
| BUG-20260723-ACT1 | `regression_tests: []` | Idem |
| BUG-20260723-SRT1 | `root_cause.state: hypothesized` (não `confirmed`) | Intencional — correção defensiva aplicada por decisão explícita do usuário, sem confirmação empírica contra a API real da Asaas |
| BUG-20260723-DAT1 | `root_cause.state: hypothesized` (não `confirmed`) | Provável esquecimento: a prosa da Resolution diz "confirmado ao vivo" (teste real sob `TZ=America/Sao_Paulo`), mas o campo YAML `root_cause.state` não foi atualizado de `hypothesized` para `confirmed` |

**Ação humana recomendada:** para MOB1/CLP1/ERR1/ACT1, decidir se `resolution_kind: fixed` se sustenta sem teste automatizado (dado que não há infra de teste de componente no projeto) ou se o campo deveria refletir outra coisa. Para DAT1, corrigir o campo `root_cause.state` para `confirmed` (a prova ao vivo já existe). Para SRT1, decidir se `fixed` é apropriado dado que a causa nunca foi confirmada — alternativa seria `resolution_kind: instrumentation-required`.

## Resumo por status

## Resumo por status

| Status | Contagem |
|---|---|
| open | 0 |
| active | 6 |
| resolved | 0 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| delivering | 6 |

## ✅ Todos os 6 corrigidos nesta sessão

| ID | # | Título | Severidade | Prioridade | Resolution |
|---|---|---|---|---|---|
| BUG-20260723-MOB1 | 15 | Sem navegação mobile até Faturamento | high | P1 | fixed |
| BUG-20260723-SRT1 | 18 | sort/order não documentados na Asaas | high | P2 | fixed (defensivo, causa não confirmada) |
| BUG-20260723-CLP1 | 16 | Submenu colapsado não navega | medium | P2 | fixed |
| BUG-20260723-ERR1 | 17 | Erro de API da Asaas vira lista vazia | medium | P2 | fixed |
| BUG-20260723-DAT1 | 20 | Possível offset de 1 dia nas datas | medium | P3 | fixed |
| BUG-20260723-ACT1 | 19 | Item ativo não destaca em reload | low | P3 | fixed |

Todos `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` (commit/push) e janela de `post_fix_observation` (`closure_policy: production-service`).

## Bugs resolvidos

Nenhum ainda (aguardando fechamento de closure policy).

## Travados (`DONE.md`)

Nenhum.
