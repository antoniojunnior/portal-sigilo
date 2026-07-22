<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-22T03:00:00Z a partir de 8 bugs -->

# Índice de Bugs — unificacao-plano-assinatura

## Resumo por status

| Status | Contagem |
|---|---|
| open | 0 |
| active | 8 |
| resolved | 0 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| patching | 7 |
| awaiting-human | 1 |

## Bugs abertos / ativos

| # | ID | Prioridade | Severidade | Título | Fix aplicado? |
|---|----|-----------|-----------|--------|----------------|
| 1 | BUG-20260721-K9M2 | P0 | critical | Checkout envia payload errado a POST /v3/paymentLinks | ✅ testado (sandbox real) |
| 7 | BUG-20260721-V3F7 | P0 | critical | renovarAssinatura.ts envia value em vez de installmentValue | ✅ testado (sandbox real) |
| 2 | BUG-20260721-R4T8 | P0 | critical | getPlanoLimit trata suspenso/cancelado como sem limite | ✅ testado (Firestore Emulator) |
| 3 | BUG-20260721-P2W5 | P1 | high | billing/cancel ainda retorna 400 sem asaas_customer_id | ✅ testado (Firestore real) |
| 4 | BUG-20260721-N7Q1 | P2 | medium | checkout/create trata parcelas como opcional | ✅ testado (Firestore real) |
| 5 | BUG-20260721-H3X6 | P2 | medium | billing/subscription diverge do contrato | ✅ testado (sandbox real) |
| 6 | BUG-20260721-D8L4 | P3 | low | PRD §2.2 ainda usa "Enterprise" como rótulo | ✅ aplicado (documentação) |
| 8 | BUG-20260722-Q5J9 | P3 | low | PRD documenta gating por tier em 6+ seções (achado ao corrigir D8L4) | ⚠️ parcial — 9/26 linhas, resto aguarda decisão de produto |

## Resolvidos

Nenhum bug `resolved` ainda. Todos os 8 têm trabalho aplicado (7 fix completo + testado, 1 parcial). `closure_policy: production-service` exige `delivery` (commit/deploy) + janela de observação antes de fechar qualquer um. `BUG-20260722-Q5J9` também depende de decisão humana sobre escopo (roadmap Enterprise futuro) antes de poder fechar por completo.

## Bugs restritos

Nenhum bug com `visibility: restricted` neste contexto.
