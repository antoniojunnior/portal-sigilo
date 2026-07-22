---
schema_version: 1
id: BUG-20260721-N7Q1
display_number: 4
title: POST /api/checkout/create trata parcelas como opcional com default silencioso de 12, contrato exige obrigatório
status: resolved
phase: resolved
severity: medium
priority: P2
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

relationships: []
# aresta simétrica related-to com BUG-20260721-K9M2 gravada lá (uma vez só)

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md"
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-02"
  affected_code:
    - "src/app/api/checkout/create/route.ts:24-38"
  root_cause:
    state: confirmed
    hypothesis: "checkout/create/route.ts tratava parcelas ausente como caso válido com default 12, quando interfaces/checkout-create.md declara o campo no mesmo nível de obrigatoriedade de plano"
    causal_path:
      - "if (parcelas !== undefined && !isParcelasValido(parcelas)) — só valida se preenchido"
      - "parcelasFinal = isParcelasValido(...) ? parcelas : 12 — ausência vira 12 silenciosamente"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:billing-fixes: isParcelasValido(undefined) === false, confirmando que o fix rejeita ausência de parcelas"
    code_refs:
      - { file: "src/app/api/checkout/create/route.ts", symbol: "isParcelasValido, POST", commit: null }
  reproduction_tests: []
  regression_tests:
    - "scripts/test-billing-route-fixes.ts (isParcelasValido/isPlanoValido)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/checkout/create/route.ts"
    purpose: "Remove permissividade para parcelas undefined; exporta isPlanoValido/isParcelasValido para teste"
    diff: "fix/CHG-001.diff"

closure:
  policy: production-service
  satisfied: true
resolution_kind: fixed
---

# POST /api/checkout/create trata parcelas como opcional com default silencioso de 12, contrato exige obrigatório

## Summary

`interfaces/checkout-create.md` define o request como `{ "plano": "unico", "parcelas": 1 | 2 | ... | 12 }`, sem marcar `parcelas` como opcional. O código implementado aceita a requisição sem `parcelas` e, nesse caso, assume silenciosamente `12` (o parcelamento máximo), em vez de rejeitar com 400.

## Expected Behavior

`interfaces/checkout-create.md`: request schema mostra `parcelas` como campo do corpo, no mesmo nível de obrigatoriedade de `plano` (que É validado e rejeitado se ausente/inválido). RF-02: "O checkout permite ao cliente **optar** por pagar a fatura anual à vista ou parcelada em até 12x" — a escolha deveria ser explícita do cliente, não assumida pelo backend.

## Actual Behavior

`src/app/api/checkout/create/route.ts`:
```ts
if (parcelas !== undefined && !isParcelasValido(parcelas)) { ... 400 ... }
const parcelasFinal = isParcelasValido(parcelas as unknown) ? (parcelas as number) : 12;
```
Se `parcelas` vier `undefined` no corpo, não há erro 400 — o código segue com `parcelasFinal = 12` (parcelamento máximo) sem o cliente ter escolhido isso.

## Steps to Reproduce

Achado por leitura estática de `src/app/api/checkout/create/route.ts` comparado a `interfaces/checkout-create.md`:

1. Ler `interfaces/checkout-create.md`: `parcelas` aparece no request sem indicação de opcionalidade.
2. Ler `src/app/api/checkout/create/route.ts` linha 32: `if (parcelas !== undefined && !isParcelasValido(parcelas))` — só valida se o campo veio preenchido.
3. Ler linha 38: `const parcelasFinal = isParcelasValido(parcelas as unknown) ? (parcelas as number) : 12;` — ausência de `parcelas` cai no mesmo `else` de valor inválido, mas em vez de rejeitar, aplica 12.

## Evidence

- `src/app/api/checkout/create/route.ts` linhas 24-38
- `_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md`

## Suspected Area

`POST /api/checkout/create`.

## Acceptance Criteria

- [ ] Requisição sem `parcelas` retorna 400, mesma família de erro de "Parcelamento inválido"
- [ ] `parcelasFinal` só é usado com um valor explicitamente enviado e validado pelo cliente

## Traceability

- Specs: `interfaces/checkout-create.md`, `requirements.md#RF-02`
- Código afetado: `src/app/api/checkout/create/route.ts:24-38`
- Testes: nenhum teste automatizado cobre este endpoint

## Resolution

**Causa raiz (confirmed):** validação de `parcelas` só disparava se o campo viesse preenchido; ausência caía num fallback silencioso de 12.

**Veredito de spec: `spec-correta`** — sem adendo.

**Change Set:** CHG-001 troca `if (parcelas !== undefined && !isParcelasValido(parcelas))` por `if (!isParcelasValido(parcelas))`, remove o fallback `: 12`, e usa `parcelas` diretamente (já validado). `isPlanoValido`/`isParcelasValido` exportadas para teste.

**Teste — verde:**
```
isParcelasValido(undefined) é false — parcelas ausente não vira default silencioso (BUG-20260721-N7Q1)... ✓ PASSOU
```

**Fechamento:** `status: resolved`, `phase: resolved` — falta `delivery` + observação.

## Agent Notes

Baixo custo de correção: trocar `parcelas !== undefined && !isParcelasValido(parcelas)` por `!isParcelasValido(parcelas)` (removendo a permissividade para `undefined`) e remover o fallback `: 12` do cálculo de `parcelasFinal`, já que a validação acima garante que só chega ali um valor válido.
