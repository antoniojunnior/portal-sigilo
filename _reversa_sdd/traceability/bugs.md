<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-22T03:00:00Z a partir de 8 bugs -->

# Rastreabilidade Spec ↔ Bug

Espelho do lado da spec. Source of truth: cada `_reversa_bugs/<contexto>/bugs/<ID>/bug.md`. Este arquivo é projeção regenerável.

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-04`

- BUG-20260721-K9M2 (active/patching, P0, fix aplicado e testado, aguarda delivery): Checkout envia payload errado a POST /v3/paymentLinks — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-06`

- BUG-20260721-R4T8 (active/patching, P0, fix aplicado e testado, aguarda delivery): getPlanoLimit trata org suspensa/cancelada como "sem limite", permitindo criação ilimitada de gestores via Firestore direto — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-R4T8-limite-usuarios-org-suspensa/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-10`

- BUG-20260721-P2W5 (active/patching, P1, fix aplicado e testado, aguarda delivery): DELETE /api/billing/cancel ainda retorna 400 quando falta asaas_customer_id, contradizendo D-10 — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-P2W5-cancel-400-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-11`

- BUG-20260721-H3X6 (active/patching, P2, fix aplicado e testado, aguarda delivery): GET /api/billing/subscription responde com campos divergentes do contrato de interfaces/billing-subscription.md — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-H3X6-subscription-contrato-divergente/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-16`

- BUG-20260721-D8L4 (active/patching, P3, fix aplicado e testado, aguarda delivery): docs/PRD_PortalSigilo_v2.md §2.2 ainda usa "Enterprise" como rótulo do modelo multi-unidade — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-D8L4-prd-enterprise-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-02`

- BUG-20260721-N7Q1 (active/patching, P2, fix aplicado e testado, aguarda delivery): POST /api/checkout/create trata parcelas como opcional com default silencioso de 12, contrato exige obrigatório — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-N7Q1-parcelas-opcional-default-silencioso/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-05`, `#RF-12`

- BUG-20260721-R4T8 (active/patching, P0): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-11`

- BUG-20260721-D8L4 (active/patching, P3): ver acima
- BUG-20260722-Q5J9 (active/awaiting-human, P3, fix parcial — 9/26 linhas, resto aguarda decisão de produto): docs/PRD_PortalSigilo_v2.md documenta gating de feature por "Gestao e Enterprise" em 6+ seções, muito além do escopo original de D8L4 — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260722-Q5J9-prd-gating-generalizado-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RN-01`

- BUG-20260722-Q5J9 (active/awaiting-human, P3): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md`

- BUG-20260721-N7Q1 (active/patching, P2): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/webhook-asaas.md`

- BUG-20260721-K9M2 (active/patching, P0): ver acima
- BUG-20260721-V3F7 (active/patching, P0, fix aplicado e testado, aguarda delivery): renovarAssinatura.ts envia value em vez de installmentValue — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-V3F7-renovacao-installmentvalue-faltando/`

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-cancel.md`

- BUG-20260721-P2W5 (active/patching, P1): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md`

- BUG-20260721-H3X6 (active/patching, P2): ver acima

## `_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md`

- BUG-20260721-R4T8 (active/patching, P0): ver acima
