<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 14 bugs (9 resolved em unificacao-plano-assinatura, 2 active/observing em insights-ia-dashboard, 3 active/delivering fixed em relatorios) -->

# Rastreabilidade Spec ↔ Bug

Espelho do lado da spec. Source of truth: cada `_reversa_bugs/<contexto>/bugs/<ID>/bug.md`. Este arquivo é projeção regenerável.

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-04`

- BUG-20260721-K9M2 (resolved/fixed, P0): Checkout envia payload errado a POST /v3/paymentLinks — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-06`

- BUG-20260721-R4T8 (resolved/fixed, P0): getPlanoLimit trata org suspensa/cancelada como "sem limite" — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-R4T8-limite-usuarios-org-suspensa/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-10`

- BUG-20260721-P2W5 (resolved/fixed, P1): DELETE /api/billing/cancel ainda retorna 400 quando falta asaas_customer_id — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-P2W5-cancel-400-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-11`

- BUG-20260721-H3X6 (resolved/fixed, P2): GET /api/billing/subscription responde com campos divergentes — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-H3X6-subscription-contrato-divergente/`
- BUG-20260722-T6R2 (resolved/fixed, P1): getInvoices/getSubscription mapeiam status de pagamento Asaas de forma incompleta — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260722-T6R2-status-pagamento-mapeamento-incompleto/`

## `_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-16`

- BUG-20260721-D8L4 (resolved/fixed, P3): docs/PRD_PortalSigilo_v2.md §2.2 ainda usa "Enterprise" — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-D8L4-prd-enterprise-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-02`

- BUG-20260721-N7Q1 (resolved/fixed, P2): POST /api/checkout/create trata parcelas como opcional — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-N7Q1-parcelas-opcional-default-silencioso/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-05`, `#RF-12`

- BUG-20260721-R4T8 (resolved/fixed, P0): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-11`

- BUG-20260721-D8L4 (resolved/fixed, P3): ver acima
- BUG-20260722-Q5J9 (resolved/fixed, P3): PRD gating generalizado — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260722-Q5J9-prd-gating-generalizado-residual/`

## `_reversa_forward/002-unificar-plano-assinatura/requirements.md#RN-01`

- BUG-20260722-Q5J9 (resolved/fixed, P3): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md`

- BUG-20260721-N7Q1 (resolved/fixed, P2): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/webhook-asaas.md`

- BUG-20260721-K9M2 (resolved/fixed, P0): ver acima
- BUG-20260721-V3F7 (resolved/fixed, P0): renovarAssinatura.ts envia value em vez de installmentValue — `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-V3F7-renovacao-installmentvalue-faltando/`

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-cancel.md`

- BUG-20260721-P2W5 (resolved/fixed, P1): ver acima

## `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md`

- BUG-20260721-H3X6 (resolved/fixed, P2): ver acima
- BUG-20260722-T6R2 (resolved/fixed, P1): ver acima

## `_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md`

- BUG-20260721-R4T8 (resolved/fixed, P0): ver acima

## `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-04`

- BUG-20260722-SRC1 (active/observing, P3, fixed): "source" do insight não é persistido no Firestore — `_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-SRC1-source-nao-persistido/`

## `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-03`, `roadmap.md#D-02`

- BUG-20260722-TCT1 (active/observing, P3, fixed): TOCTOU no rate limit de regeneração — `_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-TCT1-toctou-rate-limit/`

## `_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01`

- BUG-20260723-SCP1 (active/delivering, P1, fixed): Reaproveitamento de relatório ignora departamento/categoria — `_reversa_bugs/relatorios/bugs/BUG-20260723-SCP1-reaproveitamento-ignora-escopo-filtro/`
- BUG-20260723-DUP1 (active/delivering, P2, fixed): TOCTOU — geração duplicada em acesso concorrente — `_reversa_bugs/relatorios/bugs/BUG-20260723-DUP1-toctou-geracao-duplicada/`

## `_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-01`

- BUG-20260723-SCP1 (active/delivering, P1, fixed): ver acima

## `_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-06`, `#RF-07`

- BUG-20260723-PSU1 (active/delivering, P2, fixed): Org com plano suspenso/cancelado vê "plan_suspended" cru na tela — `_reversa_bugs/relatorios/bugs/BUG-20260723-PSU1-mensagem-erro-plano-suspenso-crua/`

## `_reversa_forward/005-relatorios-auto-geracao/roadmap.md#D-02`

- BUG-20260723-DUP1 (active/delivering, P2, fixed): ver acima
