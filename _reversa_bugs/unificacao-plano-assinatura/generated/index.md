<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 9 bugs (6 válidos/resolved, 3 inconsistências de invariante) -->

# Índice de Bugs — unificacao-plano-assinatura

## ⚠️ Inconsistências de invariante (não corrigidas automaticamente)

| Bug | Problema | Detalhe |
|---|---|---|
| BUG-20260722-T6R2 | `status: resolved` com `closure.satisfied: false` no front matter | A prosa da seção Resolution afirma `closure.satisfied: true` (janela de observação waived por decisão do usuário, evidência: 6/6 pagamentos `CONFIRMED` em sandbox real), mas o campo YAML nunca foi atualizado pra refletir isso — front matter e prosa contradizem um ao outro |
| BUG-20260722-Q5J9 | `resolution_kind: fixed` com `regression_tests: []` | Regra "`fixed` exige `regression_tests` não vazio" violada — correção foi de PRD/documentação (26 ocorrências removidas), não há teste automatizado listado |
| BUG-20260721-D8L4 | `resolution_kind: fixed` com `regression_tests: []` | Mesma causa: correção de documentação (PRD §2.2), sem `regression_tests` registrado |

**Ação humana recomendada:** para T6R2, decidir entre corrigir `closure.satisfied` para `true` (documentando o waiver no próprio campo) ou reverter a prosa; para Q5J9/D8L4, decidir se documentação conta como `regression_tests` válido (ex.: "grep confirma 0 ocorrências residuais") e preencher o campo, ou trocar `resolution_kind`.

Estas 3 inconsistências já haviam sido detectadas em execução anterior deste skill (relatada ao usuário no chat), mas não tinham sido registradas nesta view até agora.

## Resumo por status

| Status | Contagem |
|---|---|
| open | 0 |
| active | 0 |
| resolved | 9 (6 válidos, 3 com inconsistência — ver acima) |

## Resumo por phase

| Phase | Contagem |
|---|---|
| resolved | 9 |

## Bugs válidos e travados (`DONE.md`)

| # | ID | Prioridade | Severidade | Título | Fix |
|---|----|-----------|-----------|--------|-----|
| 1 | BUG-20260721-K9M2 | P0 | critical | Checkout envia payload errado a POST /v3/paymentLinks | ✅ testado (sandbox real) |
| 7 | BUG-20260721-V3F7 | P0 | critical | renovarAssinatura.ts envia value em vez de installmentValue | ✅ testado (sandbox real) |
| 2 | BUG-20260721-R4T8 | P0 | critical | getPlanoLimit trata suspenso/cancelado como sem limite | ✅ testado (Firestore Emulator) |
| 3 | BUG-20260721-P2W5 | P1 | high | billing/cancel ainda retorna 400 sem asaas_customer_id | ✅ testado (Firestore real) |
| 4 | BUG-20260721-N7Q1 | P2 | medium | checkout/create trata parcelas como opcional | ✅ testado (Firestore real) |
| 5 | BUG-20260721-H3X6 | P2 | medium | billing/subscription diverge do contrato | ✅ testado (sandbox real) |

## Bugs com inconsistência (ver seção acima, não incluídos nas contagens de "válidos")

- BUG-20260721-D8L4 (P3, low) — PRD §2.2 ainda usa "Enterprise" como rótulo
- BUG-20260722-Q5J9 (P3, low) — PRD documentava gating por tier em 6+ seções
- BUG-20260722-T6R2 (P1, high) — getInvoices/getSubscription mapeamento de status incompleto

## Bugs restritos

Nenhum bug com `visibility: restricted` neste contexto.
