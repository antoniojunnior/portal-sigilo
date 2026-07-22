<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-22 a partir de 9 bugs (8 resolved, 1 open) -->

# Matriz BUG ↔ SPEC — unificacao-plano-assinatura

| Seção de spec | Active | Resolved |
|---|---|---|
| `roadmap.md#D-04` | — | BUG-20260721-K9M2 |
| `interfaces/webhook-asaas.md` | — | BUG-20260721-K9M2, BUG-20260721-V3F7 |
| `investigation.md` | — | BUG-20260721-K9M2 |
| `roadmap.md#D-06` | — | BUG-20260721-R4T8 |
| `requirements.md#RF-05` | — | BUG-20260721-R4T8 |
| `requirements.md#RF-12` | — | BUG-20260721-R4T8 |
| `_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md` | — | BUG-20260721-R4T8 |
| `roadmap.md#D-10` | — | BUG-20260721-P2W5 |
| `interfaces/billing-cancel.md` | — | BUG-20260721-P2W5 |
| `interfaces/checkout-create.md` | — | BUG-20260721-N7Q1 |
| `requirements.md#RF-02` | — | BUG-20260721-N7Q1 |
| `roadmap.md#D-11` | BUG-20260722-T6R2 | BUG-20260721-H3X6 |
| `interfaces/billing-subscription.md` | BUG-20260722-T6R2 | BUG-20260721-H3X6 |
| `roadmap.md#D-16` | — | BUG-20260721-D8L4 |
| `requirements.md#RF-11` | — | BUG-20260721-D8L4, BUG-20260722-Q5J9 |
| `requirements.md#RN-01` | — | BUG-20260722-Q5J9 |

Todos os locators acima são relativos a `_reversa_forward/002-unificar-plano-assinatura/`, exceto o ADR do legado (caminho completo indicado).

## Linha spec-gap

BUG-20260722-T6R2 tem `spec_verdict: spec-gap` — `interfaces/billing-subscription.md` nunca definiu o mapeamento de estorno/chargeback. Os outros 8 bugs têm `spec_verdict: spec-correta` (nenhum exigiu adendo).

## Adendos vigentes

- `_reversa_sdd/addenda/bug-BUG-20260722-T6R2-v001.md` — adendo aditivo (spec-gap), vigente desde 2026-07-22. Documenta o mapeamento completo `payment.status` → `SubscriptionData.status`, incluindo o novo valor `DISPUTED`.
