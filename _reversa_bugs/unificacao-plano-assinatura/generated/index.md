<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 9 bugs (9 resolved, 0 inconsistências) -->

# Índice de Bugs — unificacao-plano-assinatura

## Resumo por status

| Status | Contagem |
|---|---|
| open | 0 |
| active | 0 |
| resolved | 9 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| resolved | 9 |

## Bugs resolvidos e travados (`DONE.md`)

| # | ID | Prioridade | Severidade | Título | Fix |
|---|----|-----------|-----------|--------|-----|
| 1 | BUG-20260721-K9M2 | P0 | critical | Checkout envia payload errado a POST /v3/paymentLinks | ✅ testado (sandbox real) |
| 7 | BUG-20260721-V3F7 | P0 | critical | renovarAssinatura.ts envia value em vez de installmentValue | ✅ testado (sandbox real) |
| 2 | BUG-20260721-R4T8 | P0 | critical | getPlanoLimit trata suspenso/cancelado como sem limite | ✅ testado (Firestore Emulator) |
| 3 | BUG-20260721-P2W5 | P1 | high | billing/cancel ainda retorna 400 sem asaas_customer_id | ✅ testado (Firestore real) |
| 4 | BUG-20260721-N7Q1 | P2 | medium | checkout/create trata parcelas como opcional | ✅ testado (Firestore real) |
| 5 | BUG-20260721-H3X6 | P2 | medium | billing/subscription diverge do contrato | ✅ testado (sandbox real) |
| 6 | BUG-20260721-D8L4 | P3 | low | PRD §2.2 ainda usa "Enterprise" como rótulo | ✅ `scripts/test-prd-enterprise-residual.ts` |
| 8 | BUG-20260722-Q5J9 | P3 | low | PRD documentava gating por tier em 6+ seções | ✅ `scripts/test-prd-enterprise-residual.ts` |
| 9 | BUG-20260722-T6R2 | P1 | high | getInvoices/getSubscription mapeamento de status incompleto | ✅ testado (sandbox real, observação waived) |

## Inconsistências reconciliadas em 2026-07-23

- **T6R2**: `closure.satisfied` estava `false` no front matter contradizendo a prosa (`true`) — reconciliado.
- **Q5J9/D8L4**: `regression_tests: []` — preenchido com `scripts/test-prd-enterprise-residual.ts` (novo). Q5J9 também teve a prosa atualizada: as 17 ocorrências "deliberadamente não tocadas" foram na verdade endereçadas numa sessão posterior (commit `c178138`), restando só 1 referência deliberada ao roadmap futuro.

## Bugs restritos

Nenhum bug com `visibility: restricted` neste contexto.
