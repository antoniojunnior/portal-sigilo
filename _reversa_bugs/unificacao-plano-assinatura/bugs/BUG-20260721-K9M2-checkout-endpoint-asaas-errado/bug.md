---
schema_version: 1
id: BUG-20260721-K9M2
display_number: 1
title: Checkout envia payload errado a POST /v3/paymentLinks (installmentCount/totalValue), toda tentativa de checkout falha com 400
status: active
phase: patching
severity: critical
priority: P0
created: 2026-07-21
updated: 2026-07-21

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
  rate: "4/4"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260721-N7Q1
    type: related-to
    state: proposed
    evidence: []
  - bug: BUG-20260721-V3F7
    type: related-to
    state: confirmed
    evidence:
      - "evidence/reproduction.md"

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-04"
    - "_reversa_forward/002-unificar-plano-assinatura/interfaces/webhook-asaas.md"
    - "_reversa_forward/002-unificar-plano-assinatura/investigation.md"
  affected_code:
    - "src/lib/asaas/createPaymentLink.ts"
    - "functions/src/webhookAsaas.ts"
  root_cause:
    state: confirmed
    hypothesis: "createPaymentLink.ts envia campos que não existem no schema real de POST /v3/paymentLinks (installmentCount, totalValue), causando 400 em toda tentativa de checkout"
    causal_path:
      - "createPaymentLink.ts monta o body com installmentCount + totalValue"
      - "API real da Asaas (POST /v3/paymentLinks) exige maxInstallmentCount + value para esse chargeType"
      - "Toda chamada real retorna 400 invalid_object, capturada pelo catch genérico da rota, que responde 502 ao cliente"
      - "Checkout está inoperante hoje — nenhum cliente novo consegue nem gerar o link de pagamento"
    evidence:
      - ref: "evidence/reproduction.md (Achado 1)"
        observation: "Payload atual reproduzido contra sandbox real: 400 invalid_object 'Informe o número máximo de parcelas'"
      - ref: "evidence/reproduction.md (Achado 2)"
        observation: "Mesmo payload com maxInstallmentCount/value: 200, link criado com sucesso"
      - ref: "evidence/reproduction.md (Achado 4)"
        observation: "Cobrança direta via /v3/payments com cartão bruto retorna creditCardToken sem parâmetro extra — a premissa de tokenização automática da arquitetura D-04 é plausível, ainda que o caminho específico via Payment Link pago não tenha sido exercitado (exigiria navegador)"
    code_refs:
      - { file: "src/lib/asaas/createPaymentLink.ts", symbol: "createPaymentLink, body do fetch", commit: null }
  reproduction_tests:
    - "evidence/reproduction.md (Achado 1, red capturado também via npm run test:asaas antes do fix)"
  regression_tests:
    - "scripts/test-asaas-billing-payloads.ts (Teste 1: createPaymentLink)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/asaas/createPaymentLink.ts"
    purpose: "Trocar installmentCount/totalValue por maxInstallmentCount/value no payload de POST /v3/paymentLinks"
    diff: "fix/CHG-001.diff"
  - id: CHG-003
    kind: test
    artifact: "scripts/test-asaas-billing-payloads.ts"
    purpose: "Script de regressão contra sandbox Asaas real (novo arquivo — conteúdo integral no path, git diff não aplicável)"
    diff: null
  - id: CHG-004
    kind: configuration
    artifact: "package.json"
    purpose: "Novo script npm test:asaas"
    diff: "fix/CHG-003-e-CHG-004.diff"

closure:
  policy: production-service
  satisfied: false
resolution_kind: null
---

# Checkout envia payload errado a POST /v3/paymentLinks, toda tentativa de checkout falha com 400

## Summary

`src/lib/asaas/createPaymentLink.ts` chama `POST /v3/paymentLinks` da Asaas com os campos `installmentCount` e `totalValue`. **Confirmado contra sandbox Asaas real nesta investigação**: esses não são os nomes de campo aceitos por esse endpoint — a API responde `400 invalid_object: "Informe o número máximo de parcelas"`. O checkout está **inoperante hoje**: nenhuma tentativa de compra chega a gerar o link de pagamento. Os campos corretos são `maxInstallmentCount` e `value` (confirmado: o mesmo payload com esses nomes retorna 200 e cria o link normalmente). Ver cápsula de reprodução completa em `evidence/reproduction.md`.

A hipótese original deste bug (token de cartão nunca capturado) segue como preocupação secundária válida, mas o achado agora `confirmed` é mais simples e mais grave: é um erro de nome de campo, não uma questão de arquitetura, e ele quebra 100% das tentativas de checkout, não só a renovação.

## Expected Behavior

`_reversa_forward/002-unificar-plano-assinatura/roadmap.md` D-04 e `interfaces/checkout-create.md`: o checkout deve gerar um link de pagamento parcelado válido, o cliente paga, a org é provisionada. `actions.md` T014 (nunca executada) era exatamente a tarefa de validar este payload em sandbox antes de `T015` ser codada.

## Actual Behavior

`POST /v3/paymentLinks` com `{ chargeType: "INSTALLMENT", installmentCount, totalValue }` retorna `400 invalid_object` sempre — confirmado por chamada real ao sandbox. `POST /api/checkout/create` (rota Next.js) trata esse erro genericamente, respondendo `502 "Falha ao criar link de pagamento"` ao cliente, sem indicar a causa real.

## Steps to Reproduce

Reproduzido contra sandbox Asaas real (não apenas leitura estática) — ver `evidence/reproduction.md` para request/response completos:

1. Enviar o payload exato de `createPaymentLink.ts` (`installmentCount`, `totalValue`) a `POST https://sandbox.asaas.com/api/v3/paymentLinks` → `400 invalid_object`.
2. Reenviar trocando por `maxInstallmentCount`, `value` → `200`, link criado.
3. (Achado relacionado, ver `BUG-20260721-V3F7`) mesmo padrão de erro em `renovarAssinatura.ts`, campo `installmentValue` ausente.

## Evidence

- `evidence/reproduction.md` — cápsula completa com os 4 testes contra sandbox real
- `evidence/01-paymentlink-payload-atual-400.json`, `02-paymentlink-payload-correto-200.json`, `03-payment-direto-payload-atual-renovar-400.json`, `04-payment-direto-payload-correto-200-com-token.json`
- `src/lib/asaas/createPaymentLink.ts` (arquivo completo)
- `_reversa_forward/002-unificar-plano-assinatura/actions.md`: `T014` `[ ]`, `T015` `[X]` (dependência declarada violada na execução)

## Suspected Area

`src/lib/asaas/createPaymentLink.ts` (fluxo de checkout/billing da feature `002-unificar-plano-assinatura`, Opção A de cobrança, D-04).

## Acceptance Criteria

- [ ] `createPaymentLink.ts` envia `maxInstallmentCount` e `value` (não `installmentCount`/`totalValue`) a `POST /v3/paymentLinks`
- [ ] Checkout de teste em sandbox real gera o link com sucesso (200)
- [ ] Confirmado (idealmente via teste manual pagando o link em sandbox) que o webhook resultante inclui `creditCardToken` reutilizável — item que segue `supported`, não `confirmed`, nesta investigação

## Traceability

- Specs: `roadmap.md#D-04`, `interfaces/checkout-create.md`, `investigation.md`
- Código afetado: `src/lib/asaas/createPaymentLink.ts`
- Testes: nenhum teste automatizado cobre este arquivo; reprodução feita via curl direto ao sandbox nesta sessão

## Resolution

**Causa raiz (confirmed):** `createPaymentLink.ts` enviava `installmentCount`/`totalValue` a `POST /v3/paymentLinks`; a API real da Asaas exige `maxInstallmentCount`/`value` para esse `chargeType`. Confirmado por chamada direta ao sandbox (ver `evidence/reproduction.md`).

**Veredito de spec: `spec-correta`.** `roadmap.md#D-04` e `interfaces/checkout-create.md` já descreviam corretamente o comportamento esperado (cobrança parcelada, token reutilizável) em termos abstratos, sem prescrever nomes de campo da API — o código divergiu por erro de implementação contra a API real, não porque a spec estivesse errada. Nenhum adendo gerado.

**Correction Change Set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/lib/asaas/createPaymentLink.ts` | `installmentCount`/`totalValue` → `maxInstallmentCount`/`value` |
| CHG-003 | test | `scripts/test-asaas-billing-payloads.ts` (novo) | Regressão contra sandbox Asaas real |
| CHG-004 | configuration | `package.json` | Script `npm run test:asaas` |

Diffs: `fix/CHG-001.diff`, `fix/CHG-003-e-CHG-004.diff` (CHG-003 é arquivo novo, sem baseline git — conteúdo integral já no path do repositório).

**Testes — vermelho→verde, contra sandbox real (não mock):**

Antes do fix (`npm run test:asaas` contra o código original):
```
createPaymentLink('unico', 12) cria link de pagamento com sucesso no sandbox real (BUG-20260721-K9M2)... ✗ FALHOU
    Falha ao criar link de pagamento
Cobrança direta com cartão bruto retorna creditCardToken reutilizável (sustenta D-04)... ✓ PASSOU
1 passou(aram), 1 falhou(aram) de 2 teste(s)
```

Depois do fix (CHG-001 aplicado, mais o Teste 3 de `BUG-20260721-V3F7` adicionado ao mesmo script):
```
createPaymentLink('unico', 12) cria link de pagamento com sucesso no sandbox real (BUG-20260721-K9M2)... ✓ PASSOU
Cobrança direta com cartão bruto retorna creditCardToken reutilizável (sustenta D-04)... ✓ PASSOU
Payload de criarCobrancaRenovacao (installmentValue + creditCardToken) cobra com sucesso (BUG-20260721-V3F7)... ✓ PASSOU
3 passou(aram), 0 falhou(aram) de 3 teste(s)
```

**Escopo confirmado vs. não confirmado:** o erro 400 (causa deste bug) está `confirmed` com evidência real. A pergunta original do bug (token chega via webhook após pagamento feito *através da URL do Payment Link*, não de chamada direta) segue `supported`, não `confirmed` — evidência favorável (Achado 4/5 de `evidence/reproduction.md`: tokenização funciona sem parâmetro especial em cobrança direta), mas o caminho específico via checkout hospedado não foi exercitado (exige navegador, fora do alcance desta sessão). Recomenda-se validar isso manualmente (T025 do roadmap) antes de considerar a feature pronta para produção.

**Fechamento (closure policy: production-service):** regressão passando + veredito de spec preenchido, mas a política exige também `delivery` (commit/deploy) e uma janela de observação sem recorrência antes de `status: resolved`. Nenhum commit ou deploy foi feito nesta sessão — fica a critério do usuário. Bug permanece `status: active`, `phase: patching` até isso acontecer.

## Agent Notes

- Este achado é a razão estrutural de maior risco da feature inteira: o item que o próprio roadmap chamou de "maior risco técnico" (T014) nunca foi validado, mas o código que dependia dele foi implementado e marcado como pronto mesmo assim.
- Investigado nesta sessão com acesso real a sandbox Asaas (chave em `.env.local`, atualizada pelo usuário após a original retornar 401). Diagnóstico original (endpoint arquiteturalmente errado) foi refinado: o endpoint (`/v3/paymentLinks`) está certo para o caso de uso, o problema é só o nome de dois campos do payload.
- `BUG-20260721-V3F7` (mesma investigação, `renovarAssinatura.ts`) tem o mesmo padrão de erro — corrigir os dois juntos é mais eficiente, já que o teste de sandbox já está pronto.
- `T025` (execução do `onboarding.md`) segue `[ ]` — a confirmação de que o `creditCardToken` chega de fato via webhook após um pagamento real através do link exige teste manual num navegador contra o sandbox, fora do alcance de curl.
