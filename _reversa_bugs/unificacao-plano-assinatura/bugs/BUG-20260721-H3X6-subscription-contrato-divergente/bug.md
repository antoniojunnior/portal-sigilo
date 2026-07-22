---
schema_version: 1
id: BUG-20260721-H3X6
display_number: 5
title: GET /api/billing/subscription responde com campos divergentes do contrato de interfaces/billing-subscription.md
status: active
phase: patching
severity: medium
priority: P2
created: 2026-07-21
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: lib-shared
feature: planos-unificacao
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships: []
# aresta simétrica related-to com BUG-20260721-P2W5 gravada lá (uma vez só)

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-11"
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md"
  affected_code:
    - "src/lib/asaas/getSubscription.ts"
    - "src/app/api/billing/subscription/route.ts"
  root_cause:
    state: confirmed
    hypothesis: "getSubscription.ts usava total_parcelas em vez de parcelas, e não incluía subscription_id no caminho de sucesso"
    causal_path:
      - "SubscriptionData tinha campo total_parcelas, sem subscription_id"
      - "route.ts só adicionava subscription_id: null no firestoreFallback(), não no retorno de getSubscription()"
      - "Forma da resposta varia dependendo de qual ramo respondeu — quebra de contrato para o frontend"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:billing-fixes: getSubscription retorna parcelas (não total_parcelas) e subscription_id: null, contra sandbox Asaas real com customer de teste"
      - ref: "grep -rn total_parcelas src/"
        observation: "Nenhum consumidor de total_parcelas encontrado no frontend — rename seguro, confirmado antes do fix (Agent Notes)"
    code_refs:
      - { file: "src/lib/asaas/getSubscription.ts", symbol: "SubscriptionData, getSubscription", commit: null }
  reproduction_tests: []
  regression_tests:
    - "scripts/test-billing-route-fixes.ts (getSubscription parcelas/subscription_id)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/asaas/getSubscription.ts"
    purpose: "total_parcelas → parcelas; adiciona subscription_id: null sempre presente"
    diff: "fix/CHG-001.diff"

closure:
  policy: production-service
  satisfied: false
resolution_kind: null
---

# GET /api/billing/subscription responde com campos divergentes do contrato de interfaces/billing-subscription.md

## Summary

`interfaces/billing-subscription.md` (D-11) define a resposta do caminho novo com os campos `source`, `plano_ativo`, `valor`, `ciclo`, `proximo_vencimento`, `status`, `subscription_id` (sempre `null`), `parcelas`. O código implementado usa o nome `total_parcelas` em vez de `parcelas`, e o caminho de sucesso (`getSubscription.ts`) não inclui `subscription_id` nenhum — só o `firestoreFallback()` da rota inclui `subscription_id: null`. Um frontend que espera o contrato documentado (`parcelas`, `subscription_id` sempre presente) vê um formato de resposta inconsistente dependendo de qual dos dois caminhos respondeu.

## Expected Behavior

`interfaces/billing-subscription.md` seção "Depois (D-11)": objeto de resposta com chave `parcelas: orgs.proxima_cobranca_parcelas` e `subscription_id: null` sempre presentes, independente do caminho.

## Actual Behavior

`src/lib/asaas/getSubscription.ts` retorna `SubscriptionData` com campo `total_parcelas` (não `parcelas`) e sem nenhuma chave `subscription_id`. `src/app/api/billing/subscription/route.ts`: o `firestoreFallback()` local inclui `subscription_id: null`, mas o caminho de sucesso (`return Response.json(sub)`, onde `sub` vem de `getSubscription()`) não inclui essa chave — a forma da resposta muda dependendo de qual ramo respondeu.

## Steps to Reproduce

Achado por leitura estática comparando `getSubscription.ts`/`billing/subscription/route.ts` com `interfaces/billing-subscription.md`:

1. Ler `interfaces/billing-subscription.md` seção "Depois (D-11)": schema de resposta com `parcelas` e `subscription_id: null`.
2. Ler `src/lib/asaas/getSubscription.ts` interface `SubscriptionData`: campo `total_parcelas`, sem `subscription_id`.
3. Ler `src/app/api/billing/subscription/route.ts`: `firestoreFallback()` tem `subscription_id: null` explícito; o retorno de `getSubscription()` bem-sucedido não tem essa chave.

## Evidence

- `src/lib/asaas/getSubscription.ts` (interface `SubscriptionData` e função `getSubscription`)
- `src/app/api/billing/subscription/route.ts` (função `firestoreFallback` vs retorno direto de `sub`)
- `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md` seção "Depois (D-11)"

## Suspected Area

`GET /api/billing/subscription` e `src/lib/asaas/getSubscription.ts`.

## Acceptance Criteria

- [ ] Resposta de `GET /api/billing/subscription` usa a chave `parcelas` (não `total_parcelas`)
- [ ] Resposta inclui `subscription_id: null` em TODOS os caminhos (sucesso e fallback), forma consistente

## Traceability

- Specs: `roadmap.md#D-11`, `interfaces/billing-subscription.md`
- Código afetado: `src/lib/asaas/getSubscription.ts`, `src/app/api/billing/subscription/route.ts`
- Testes: nenhum teste automatizado cobre este endpoint

## Resolution

**Causa raiz (confirmed):** `SubscriptionData` usava `total_parcelas` (não `parcelas`) e omitia `subscription_id` no caminho de sucesso.

**Veredito de spec: `spec-correta`** — sem adendo.

**Change Set:** CHG-001 renomeia o campo e adiciona `subscription_id: null` ao objeto retornado por `getSubscription()`. Confirmado por grep que nenhum consumidor do frontend usava `total_parcelas` — rename seguro.

**Teste — verde, contra sandbox Asaas real:**
```
getSubscription retorna 'parcelas' (não 'total_parcelas') e subscription_id: null (BUG-20260721-H3X6)... ✓ PASSOU
```

**Fechamento:** `status: active`, `phase: patching` — falta `delivery` + observação.

## Agent Notes

Antes de renomear `total_parcelas` para `parcelas`, verificar se algum componente do frontend já consome o nome atual (`total_parcelas`) — se sim, o fix precisa trocar os dois lados juntos.
