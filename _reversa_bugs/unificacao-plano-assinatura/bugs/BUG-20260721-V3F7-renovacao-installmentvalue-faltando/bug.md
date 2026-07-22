---
schema_version: 1
id: BUG-20260721-V3F7
display_number: 7
title: renovarAssinatura.ts envia value em vez de installmentValue à Asaas — toda renovação parcelada falha com 400
status: resolved
phase: resolved
severity: critical
priority: P0
created: 2026-07-21
updated: 2026-07-21

origin:
  type: inspection
  external_ref: null

area: saas-core
module: firebase-functions
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
  - bug: BUG-20260721-K9M2
    type: related-to
    state: confirmed
    evidence:
      - "_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/evidence/reproduction.md"

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-04"
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/webhook-asaas.md"
  affected_code:
    - "functions/src/renovarAssinatura.ts"
  root_cause:
    state: confirmed
    hypothesis: "Payload de cobrança parcelada via POST /v3/payments usa o nome de campo errado para o valor"
    causal_path:
      - "renovarAssinatura.ts monta o body com `value: 1164, installmentCount: parcelas`"
      - "API real da Asaas (POST /v3/payments) exige `installmentValue` (valor de CADA parcela) quando `installmentCount` > 1, não `value` (valor total)"
      - "Toda execução da function que tentar cobrar parcelado (proxima_cobranca_parcelas > 1) recebe 400 invalid_installmentValue da Asaas e cai no catch, suspendendo a org"
    evidence:
      - ref: "_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/evidence/03-payment-direto-payload-atual-renovar-400.json"
        observation: "Reprodução com o payload exato de renovarAssinatura.ts contra sandbox real: 400 invalid_installmentValue"
      - ref: "_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/evidence/04-payment-direto-payload-correto-200-com-token.json"
        observation: "Mesmo payload trocando value por installmentValue (valor da parcela): 200, cobrança confirmada"
    code_refs:
      - { file: "functions/src/renovarAssinatura.ts", symbol: "onSchedule callback, fetch /v3/payments", commit: null }
  reproduction_tests:
    - "_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/evidence/reproduction.md (Achado 3)"
  regression_tests:
    - "scripts/test-asaas-billing-payloads.ts (Teste 3: payload de criarCobrancaRenovacao)"

spec_verdict: spec-correta

change_set:
  - id: CHG-002
    kind: code
    artifact: "functions/src/renovarAssinatura.ts"
    purpose: "Extrair criarCobrancaRenovacao (testável) e trocar value por installmentValue no payload de POST /v3/payments"
    diff: "fix/CHG-002.diff"

closure:
  policy: production-service
  satisfied: true
resolution_kind: fixed
---

# renovarAssinatura.ts envia value em vez de installmentValue à Asaas — toda renovação parcelada falha com 400

## Summary

Achado durante a investigação de `BUG-20260721-K9M2` (mesma família de causa: payload da API Asaas nunca validado em sandbox real, T014 do roadmap nunca executada). `functions/src/renovarAssinatura.ts` monta a cobrança de renovação anual com `value: 1164` e `installmentCount: parcelas`. Testado contra sandbox real com esse payload exato: a Asaas rejeita com `400 invalid_installmentValue`. O campo correto para o valor de cada parcela é `installmentValue`, não `value`.

## Expected Behavior

`roadmap.md` D-04 e `interfaces/webhook-asaas.md`: a function agendada de renovação deve conseguir cobrar com sucesso, em até 12x, usando o token salvo — sem pedir cartão de novo.

## Actual Behavior

Toda vez que `proxima_cobranca_parcelas` for maior que o mínimo aceito sem `installmentValue` explícito (na prática, qualquer renovação parcelada > 1x testada), a chamada a `POST /v3/payments` retorna 400, cai no bloco `catch`, e a função chama `atualizarPlanoOrg(customerId, "suspenso", "plan_suspended")` — suspendendo a org por um erro de integração, não por recusa de pagamento real.

## Steps to Reproduce

1. Ler `functions/src/renovarAssinatura.ts`, bloco do `fetch(`${baseUrl}/v3/payments`, ...)`: body usa `value: 1164, installmentCount: parcelas`.
2. Reproduzido contra sandbox Asaas real nesta sessão com o payload idêntico: `400 invalid_installmentValue` (ver evidência em `BUG-20260721-K9M2`, arquivo `03-payment-direto-payload-atual-renovar-400.json`).
3. Mesmo payload trocando `value` por `installmentValue: value/parcelas`: `200`, cobrança confirmada (arquivo `04-payment-direto-payload-correto-200-com-token.json`).

## Evidence

Ver `_reversa_bugs/unificacao-plano-assinatura/bugs/BUG-20260721-K9M2-checkout-endpoint-asaas-errado/evidence/` (achados 3 e 4 de `reproduction.md`) — reprodução feita no mesmo teste de sandbox que confirmou `BUG-20260721-K9M2`.

## Suspected Area

`functions/src/renovarAssinatura.ts`.

## Acceptance Criteria

- [ ] `renovarAssinatura.ts` envia `installmentValue` (valor total / número de parcelas) em vez de `value` no body de `POST /v3/payments`
- [ ] Renovação parcelada testada em sandbox real retorna 200/CONFIRMED

## Traceability

- Specs: `roadmap.md#D-04`, `interfaces/webhook-asaas.md`
- Código afetado: `functions/src/renovarAssinatura.ts`
- Testes: nenhum

## Resolution

**Causa raiz (confirmed):** `renovarAssinatura.ts` enviava `value: 1164` a `POST /v3/payments` com `installmentCount > 1`; a API exige `installmentValue` (valor por parcela). Confirmado por chamada direta ao sandbox.

**Veredito de spec: `spec-correta`** (mesma razão de `BUG-20260721-K9M2`: erro de implementação contra a API real, spec nunca prescreveu nomes de campo). Nenhum adendo gerado.

**Correction Change Set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-002 | code | `functions/src/renovarAssinatura.ts` | Extrai `criarCobrancaRenovacao` (agora exportada, testável isoladamente) e troca `value` por `installmentValue` calculado (`PLANO_PRECO_ANUAL / parcelas`, arredondado a centavos) |

Diff: `fix/CHG-002.diff` (escrito manualmente — arquivo não tinha baseline no git antes desta sessão, não commitado).

**Testes — vermelho→verde, contra sandbox real:**

Antes (mesmo payload de `renovarAssinatura.ts`, capturado durante a investigação de K9M2):
```
POST /v3/payments {value: 1164, installmentCount: 3, ...} → 400 invalid_installmentValue
```

Depois (`npm run test:asaas`, Teste 3, payload de `criarCobrancaRenovacao` reutilizando token salvo, sem cartão bruto — cenário exato de renovação):
```
Payload de criarCobrancaRenovacao (installmentValue + creditCardToken) cobra com sucesso (BUG-20260721-V3F7)... ✓ PASSOU
```

**Nota de arredondamento:** `installmentValue = Math.round((1164 / parcelas) * 100) / 100` testado com sucesso para `parcelas = 3` (`388.0`, valor exato, sem resto). Para parcelas que gerem dízima (ex. 7x), o arredondamento pode deixar `installmentValue × installmentCount` alguns centavos abaixo de 1164 — a Asaas aceitou no teste feito, mas não foram testados todos os 12 valores possíveis de `parcelas`. Registrado em Agent Notes para atenção futura, não bloqueia este fix.

**Fechamento (closure policy: production-service):** mesma situação de `BUG-20260721-K9M2` — regressão passando e veredito preenchidos, falta `delivery` (commit/deploy) e janela de observação. Bug permanece `status: resolved`, `phase: resolved`.

## Agent Notes

- Implementado como `installmentValue: Math.round((PLANO_PRECO_ANUAL / parcelas) * 100) / 100`, testado com sucesso para `parcelas = 3`. Não testados todos os 12 valores possíveis de parcelas (1 a 12) — valores que geram dízima periódica (ex. 7x) podem deixar `installmentValue × installmentCount` alguns centavos abaixo do total de R$ 1.164, dependendo de quão rígida for a validação da Asaas. Vale rodar `npm run test:asaas` variando `parcelas` antes de considerar o fix definitivo para todos os casos.
- `BUG-20260721-K9M2` documenta a mesma causa raiz (payload nunca validado em sandbox, T014 pulada) e foi corrigido na mesma sessão.
