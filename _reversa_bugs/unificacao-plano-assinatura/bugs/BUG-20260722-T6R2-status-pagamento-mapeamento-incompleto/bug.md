---
schema_version: 1
id: BUG-20260722-T6R2
display_number: 9
title: getInvoices/getSubscription mapeiam status de pagamento Asaas de forma incompleta — CONFIRMED e status de problema caem no mesmo default
status: active
phase: observing
severity: high
priority: P1
created: 2026-07-22
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: lib-shared
feature: planos-unificacao
labels: [financeiro]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260721-H3X6
    type: related-to
    state: confirmed
    evidence:
      - "evidence/reproduction.md"

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md"
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-11"
  affected_code:
    - "src/lib/asaas/getInvoices.ts"
    - "src/lib/asaas/getSubscription.ts"
    - "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx"
  root_cause:
    state: confirmed
    hypothesis: "Invoice['status'] declara só 4 valores (RECEIVED, PENDING, OVERDUE, CANCELLED); a Asaas real retorna outros (CONFIRMED confirmado, e outros documentados: RECEIVED_IN_CASH, REFUNDED, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE, AWAITING_RISK_ANALYSIS). O cast 'as Invoice[\"status\"]' não valida nada; o switch em getSubscription trata qualquer valor não reconhecido (incluindo os de problema) como 'ACTIVE' via default"
    causal_path:
      - "getInvoices.ts faz cast não verificado de p.status para um union type incompleto"
      - "Toda cobrança bem-sucedida real retorna 'CONFIRMED', que não bate em nenhum case do switch de getSubscription.ts"
      - "default: status = 'ACTIVE' — coincide com o resultado certo para CONFIRMED, mas também captura REFUNDED/CHARGEBACK_* (status de problema real)"
      - "Tela de faturamento do admin mostraria 'ACTIVE' mesmo quando o pagamento foi estornado ou está em disputa de chargeback"
      - "AMPLIAÇÃO DO DIAGNÓSTICO (2026-07-22, antes do fix): faturamento/page.tsx declara seu próprio Invoice['status'] duplicado (não importado do lib), com INVOICE_STATUS: Record<Invoice['status'], ...> exaustivo sobre o union antigo. inv.status='CONFIRMED' (valor real, confirmado) não bate nenhuma chave → INVOICE_STATUS[inv.status] retorna undefined → badge.className na linha 357 quebra em runtime (TypeError, sem guard). Ou seja: HOJE, a tabela de faturas na tela /configuracoes/faturamento quebra para qualquer org com pagamento real confirmado. Mesma causa raiz, superfície de dano maior do que o registrado originalmente."
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "GET /v3/payments contra sandbox real, customer com 6 pagamentos reais: todos status=CONFIRMED, nenhum RECEIVED"
      - ref: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:344,357"
        observation: "INVOICE_STATUS[inv.status] sem guard de undefined; badge.className quebraria para status='CONFIRMED'"
      - ref: "WebFetch https://docs.asaas.com/reference/list-payments (2026-07-22)"
        observation: "Enum oficial de payment.status tem 14 valores: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, RECEIVED_IN_CASH, REFUND_REQUESTED, REFUND_IN_PROGRESS, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE, AWAITING_CHARGEBACK_REVERSAL, DUNNING_REQUESTED, DUNNING_RECEIVED, AWAITING_RISK_ANALYSIS — CANCELLED não consta nesta lista (mantido no código por precaução, sem evidência de ocorrência real)"
    code_refs:
      - { file: "src/lib/asaas/getInvoices.ts", symbol: "Invoice, getInvoices", commit: null }
      - { file: "src/lib/asaas/getSubscription.ts", symbol: "getSubscription, switch(lastInvoice.status)", commit: null }
      - { file: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx", symbol: "Invoice, INVOICE_STATUS, STATUS_BADGE", commit: null }
  reproduction_tests:
    - "scripts/test-billing-route-fixes.ts (mapInvoiceStatusToSubscriptionStatus mapeia os 3 buckets explicitamente)"
  regression_tests:
    - "scripts/test-billing-route-fixes.ts (getSubscription retorna status ACTIVE para customer real com pagamentos CONFIRMED)"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/asaas/getInvoices.ts"
    purpose: "Invoice['status'] ampliado para PaymentStatus (9 valores: + CONFIRMED, RECEIVED_IN_CASH, REFUNDED, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE)"
    diff: "fix/CHG-001.diff"
  - id: CHG-002
    kind: code
    artifact: "src/lib/asaas/getSubscription.ts"
    purpose: "Extrai mapInvoiceStatusToSubscriptionStatus (exportada, testável); casos explícitos p/ CONFIRMED/RECEIVED/RECEIVED_IN_CASH→ACTIVE e REFUNDED/CHARGEBACK_*→DISPUTED (novo valor)"
    diff: "fix/CHG-002.diff"
  - id: CHG-003
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx"
    purpose: "Amplia tipos/labels duplicados no frontend p/ mesmo conjunto; adiciona fallback defensivo em INVOICE_STATUS[inv.status] (raiz do crash real de hoje)"
    diff: "fix/CHG-003.diff"
  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260722-T6R2-v001.md"
    purpose: "Adendo aditivo (spec-gap): documenta o mapeamento completo payment.status → SubscriptionData.status pela 1ª vez"
    diff: null

closure:
  policy: production-service
  satisfied: false
  delivery:
    kind: commit
    ref: "16cb31c"
    code_commit: "5a16080"
    delivered_at: "2026-07-22"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-22"
    window: "a definir (recomendado: até o próximo ciclo de renovação/cobrança real observado sem recorrência, ou min. 1 fatura real processada com status CONFIRMED sem quebra reportada)"
    status: "observing"
resolution_kind: fixed
---

# getInvoices/getSubscription mapeiam status de pagamento Asaas de forma incompleta

## Summary

`src/lib/asaas/getInvoices.ts` declara `Invoice.status` como `"RECEIVED" | "PENDING" | "OVERDUE" | "CANCELLED"`, mas a API real da Asaas retorna outros valores para os mesmos conceitos de negócio — confirmado nesta sessão: toda cobrança bem-sucedida real vem com `status: "CONFIRMED"`, nunca `"RECEIVED"`. O cast `p.status as Invoice["status"]` não valida nada em runtime. Em `getSubscription.ts`, o `switch` sobre esse status não tem `case` para `"CONFIRMED"` (nem para `REFUNDED`, `CHARGEBACK_REQUESTED`, `CHARGEBACK_DISPUTE`, todos estados reais de problema na Asaas) — todos caem no mesmo `default: status = "ACTIVE"`.

## Expected Behavior

`interfaces/billing-subscription.md` (D-11): a tela de faturamento deve refletir o `status` real da cobrança mais recente (`"ACTIVE" | "OVERDUE" | null`). Implicitamente, um pagamento estornado ou em disputa de chargeback não deveria aparecer como "ACTIVE" para o admin.

## Actual Behavior

Qualquer status de pagamento real que não seja literalmente `"RECEIVED"`, `"OVERDUE"` ou `"CANCELLED"` cai no `default: "ACTIVE"` do switch — incluindo `"CONFIRMED"` (o caso comum, resultado certo por acidente) e `"REFUNDED"`/`"CHARGEBACK_REQUESTED"`/`"CHARGEBACK_DISPUTE"` (casos de problema real, resultado errado).

## Steps to Reproduce

1. Consultar `GET /v3/payments?customer=<id>` no sandbox Asaas real para qualquer cobrança confirmada → `status: "CONFIRMED"` (ver `evidence/reproduction.md`).
2. Ler `getInvoices.ts`: `Invoice["status"]` não inclui `"CONFIRMED"`.
3. Ler `getSubscription.ts`: `switch (lastInvoice.status)` não tem `case "CONFIRMED"` — cai em `default: "ACTIVE"`.

## Evidence

- `evidence/reproduction.md` — chamada real ao sandbox, 5 pagamentos, todos `CONFIRMED`
- `src/lib/asaas/getInvoices.ts`, `src/lib/asaas/getSubscription.ts`
- `scripts/test-billing-route-fixes.ts` — não testa o campo `status` da resposta

## Suspected Area

`src/lib/asaas/getInvoices.ts`, `src/lib/asaas/getSubscription.ts`.

## Acceptance Criteria

- [x] `Invoice["status"]` inclui os valores reais documentados pela Asaas (no mínimo `CONFIRMED`, `RECEIVED`, `RECEIVED_IN_CASH`, `OVERDUE`, `REFUNDED`, `CHARGEBACK_REQUESTED`, `CHARGEBACK_DISPUTE`, `PENDING`)
- [x] `getSubscription.ts` mapeia `CONFIRMED`/`RECEIVED`/`RECEIVED_IN_CASH` para `"ACTIVE"` explicitamente (não via default)
- [x] `getSubscription.ts` mapeia `REFUNDED`/`CHARGEBACK_REQUESTED`/`CHARGEBACK_DISPUTE` para um status que sinalize problema ao admin (não `"ACTIVE"`) — decisão de produto: novo valor `"DISPUTED"`
- [x] Teste de regressão cobre o campo `status`, não só `parcelas`/`subscription_id`

## Traceability

- Specs: `interfaces/billing-subscription.md`, `roadmap.md#D-11`
- Código afetado: `src/lib/asaas/getInvoices.ts`, `src/lib/asaas/getSubscription.ts`
- Testes: `scripts/test-billing-route-fixes.ts` não cobre este campo

## Resolution

**Causa raiz (confirmed):** `Invoice["status"]` tinha só 4 valores + cast não validado; `getSubscription.ts` não tratava `CONFIRMED` nem os status de estorno/chargeback, todos caindo no mesmo `default: "ACTIVE"`. Diagnóstico ampliado durante o fix: `faturamento/page.tsx` tinha um `INVOICE_STATUS` exaustivo sem guard — `inv.status === "CONFIRMED"` (o caso real/comum) já quebrava a tabela de faturas em produção HOJE. Por isso a severidade subiu de `medium`/P2 para `high`/P1 antes da correção.

**Decisão de produto (usuário):** `REFUNDED`/`CHARGEBACK_REQUESTED`/`CHARGEBACK_DISPUTE` → novo valor `"DISPUTED"` (não reaproveita `SUSPENDED`).

**Veredito de spec: `spec-gap`** — `interfaces/billing-subscription.md` nunca definiu o que fazer com estorno/chargeback. Adendo aditivo: `_reversa_sdd/addenda/bug-BUG-20260722-T6R2-v001.md`.

**Change Set:**

| CHG | Artefato | O que faz |
|---|---|---|
| CHG-001 | `src/lib/asaas/getInvoices.ts` | `Invoice["status"]` → `PaymentStatus` (9 valores) |
| CHG-002 | `src/lib/asaas/getSubscription.ts` | Extrai `mapInvoiceStatusToSubscriptionStatus` (exportada); casos explícitos p/ os 3 buckets + `DISPUTED` |
| CHG-003 | `faturamento/page.tsx` | Tipos/labels ampliados + fallback defensivo em `INVOICE_STATUS[inv.status]` (corrige o crash real) |
| CHG-004 | Adendo de spec | `spec-gap`, aditivo |

**Testes — vermelho → verde:**

```
# ANTES do fix (código stashado, teste já escrito):
TSError: ⨯ Unable to compile TypeScript:
scripts/test-billing-route-fixes.ts(13,27): error TS2305: Module '"../src/lib/asaas/getSubscription"'
has no exported member 'mapInvoiceStatusToSubscriptionStatus'.

# DEPOIS do fix:
  cancelarAssinatura cancela org sem asaas_customer_id (BUG-20260721-P2W5)... ✓ PASSOU
  isParcelasValido(undefined) é false ... (BUG-20260721-N7Q1)... ✓ PASSOU
  getSubscription retorna 'parcelas' (não 'total_parcelas') e subscription_id: null (BUG-20260721-H3X6)... ✓ PASSOU
  mapInvoiceStatusToSubscriptionStatus mapeia os 3 buckets explicitamente (BUG-20260722-T6R2)... ✓ PASSOU
  getSubscription retorna status ACTIVE para customer real com pagamentos CONFIRMED (BUG-20260722-T6R2)... ✓ PASSOU

5 passou(aram), 0 falhou(aram) de 5 teste(s)
```

`npx tsc --noEmit` (projeto inteiro): `EXIT:0`, sem erros novos.

**Fechamento:** `status: active`, `phase: observing` — entregue via commit `5a16080` (código) / `16cb31c` (rastreabilidade), push `70dbd47..16cb31c` para `origin/main` em 2026-07-22. `closure.satisfied: false` até a janela de `post_fix_observation` confirmar não recorrência (política `production-service`). Sem `DONE.md` ainda — ver próxima chamada de `/reversa-debugger-fix` para encerrar a observação.

## Agent Notes

- Fora do escopo: `PENDING`, `REFUND_REQUESTED`, `REFUND_IN_PROGRESS`, `AWAITING_CHARGEBACK_REVERSAL`, `DUNNING_REQUESTED`, `DUNNING_RECEIVED`, `AWAITING_RISK_ANALYSIS` continuam no `default: "ACTIVE"` — sem evidência real de ocorrência nesta sessão, registrado como observação para próxima varredura, não promovido a bug.
- Fora do escopo: divergência pré-existente entre `interfaces/billing-subscription.md` (diz `"ACTIVE"|"OVERDUE"|null`) e o código (`INACTIVE`/`SUSPENDED` já existiam antes de T6R2) — não redescoberta nem corrigida aqui.
- `CANCELLED` mantido no código por precaução mesmo não constando no enum oficial de 14 valores consultado via `WebFetch` — sem evidência de ocorrência real, não removido.
