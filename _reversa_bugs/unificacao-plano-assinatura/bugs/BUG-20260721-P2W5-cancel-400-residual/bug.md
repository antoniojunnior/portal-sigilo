---
schema_version: 1
id: BUG-20260721-P2W5
display_number: 3
title: DELETE /api/billing/cancel ainda retorna 400 quando falta asaas_customer_id, contradizendo D-10
status: active
phase: patching
severity: high
priority: P1
created: 2026-07-21
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: route-handlers
feature: planos-unificacao
labels: []

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
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-10"
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-cancel.md"
  affected_code:
    - "src/app/api/billing/cancel/route.ts:20-24"
  root_cause:
    state: confirmed
    hypothesis: "billing/cancel/route.ts manteve o bloco de checagem de asaas_customer_id que D-10 explicitamente revogou"
    causal_path:
      - "Comparação textual direta: interfaces/billing-cancel.md 'Depois (D-10)' não tem checagem de asaas_customer_id"
      - "Código real ainda tinha if (!customerId) { 400 }, idêntico ao comportamento 'Antes' da mesma interface"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:billing-fixes: cancelarAssinatura cancela org sem asaas_customer_id com sucesso, contra Firestore real"
    code_refs:
      - { file: "src/app/api/billing/cancel/route.ts", symbol: "cancelarAssinatura (extraída)", commit: null }
  reproduction_tests: []
  regression_tests:
    - "scripts/test-billing-route-fixes.ts (cancelarAssinatura cancela org sem asaas_customer_id)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/billing/cancel/route.ts"
    purpose: "Remove checagem de asaas_customer_id; extrai cancelarAssinatura (testável) seguindo interfaces/billing-cancel.md à risca (logAudit com motivo: cancelamento_voluntario)"
    diff: "fix/CHG-001.diff"
  - id: CHG-002
    kind: test
    artifact: "scripts/test-billing-route-fixes.ts"
    purpose: "Regressão contra Firestore real, cobre P2W5 + N7Q1 + H3X6"
    diff: "fix/CHG-002-teste.diff"

closure:
  policy: production-service
  satisfied: false
resolution_kind: null
---

# DELETE /api/billing/cancel ainda retorna 400 quando falta asaas_customer_id, contradizendo D-10

## Summary

`interfaces/billing-cancel.md` (gerado por `/reversa-plan`, decisão D-10) diz explicitamente: "O código de erro 400 ('Nenhuma assinatura vinculada') deixa de existir — toda org com `plano_ativo` diferente de `suspenso`/`cancelado` pode cancelar, independente de ter ou não `asaas_customer_id`". O código implementado (`T019`, marcada `[X]`) manteve exatamente esse 400 que a spec mandou remover.

## Expected Behavior

Per `interfaces/billing-cancel.md` seção "Depois (D-10)": a rota só depende da org da sessão, marca `plano_ativo = "cancelado"` e `renovacao_cancelada = true`, registra audit log — sem checar `asaas_customer_id` antes. Resposta esperada: `200 { ok: true }` ou `404` só se a org em si não existir.

## Actual Behavior

`src/app/api/billing/cancel/route.ts` linhas 20-24:
```ts
const customerId = orgDoc.data()?.asaas_customer_id as string | undefined;
if (!customerId) {
  return Response.json({ error: "Nenhuma assinatura vinculada" }, { status: 400 });
}
```
Esse bloco bloqueia o cancelamento de qualquer org sem `asaas_customer_id` (ex.: org provisionada manualmente, ou um estado transitório onde o campo não foi preenchido) — exatamente o comportamento que D-10 revogou explicitamente.

## Steps to Reproduce

Achado por leitura estática de `src/app/api/billing/cancel/route.ts` comparado a `interfaces/billing-cancel.md`:

1. Ler `interfaces/billing-cancel.md` seção "Depois (D-10)": não há checagem de `asaas_customer_id` nem erro 400 no fluxo novo.
2. Ler `src/app/api/billing/cancel/route.ts:20-24`: a checagem e o erro 400 continuam lá, idênticos ao comportamento "Antes" documentado na mesma interface.

## Evidence

- `src/app/api/billing/cancel/route.ts` linhas 15-24
- `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-cancel.md` seção "Depois (D-10)"

## Suspected Area

`DELETE /api/billing/cancel`.

## Acceptance Criteria

- [ ] `DELETE /api/billing/cancel` cancela a org da sessão independente de `asaas_customer_id` estar preenchido
- [ ] Resposta 400 "Nenhuma assinatura vinculada" removida do código
- [ ] Único erro além de auth/sessão é 404 "Organização não encontrada"

## Traceability

- Specs: `roadmap.md#D-10`, `interfaces/billing-cancel.md`
- Código afetado: `src/app/api/billing/cancel/route.ts:20-24`
- Testes: nenhum teste automatizado cobre este endpoint

## Resolution

**Causa raiz (confirmed):** rota mantinha bloco de checagem de `asaas_customer_id` que `interfaces/billing-cancel.md` (D-10) explicitamente revogou.

**Veredito de spec: `spec-correta`** — sem adendo.

**Change Set:** CHG-001 remove a checagem, extrai `cancelarAssinatura(orgId, userId)` (testável, sem depender de sessão/auth), ajusta `logAudit` para `{ motivo: "cancelamento_voluntario" }` conforme a interface. CHG-002 é o script de teste (compartilhado com N7Q1/H3X6).

**Teste — verde contra Firestore real** (sem vermelho ao vivo capturado nesta rodada, ver `evidence/reproduction.md` para a justificativa):
```
cancelarAssinatura cancela org sem asaas_customer_id (BUG-20260721-P2W5)... ✓ PASSOU
```

**Fechamento:** `status: active`, `phase: patching` — falta `delivery` + observação (closure policy production-service), mesma pendência dos demais bugs desta rodada.

## Agent Notes

Fix é literalmente remover o bloco `if (!customerId) { ... 400 ... }` — o resto da rota (linhas 26+) já não usa `customerId` para nada além dessa checagem removida (confirmar antes de apagar).
