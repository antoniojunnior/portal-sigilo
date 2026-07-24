---
schema_version: 1
id: BUG-20260723-ERR1
display_number: 17
title: getInvoices() engole erro de rede/API da Asaas — indistinguível de "org sem faturas"
status: resolved
phase: resolved
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: lib-shared
feature: billing
labels: [error-handling, pre-existing-amplified]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: null
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/006-split-configuracoes/requirements.md (cenário \"Org sem faturas exibe estado vazio\")"
  affected_code:
    - "src/lib/asaas/getInvoices.ts:47"
    - "src/lib/asaas/getInvoices.ts:59-61"
    - "src/app/api/billing/invoices/route.ts:24-25"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "getInvoices.ts:47 — se `!res.ok` (erro HTTP da Asaas), retorna `[]` silenciosamente"
      - "getInvoices.ts:59-61 — catch de erro de rede também retorna `[]`"
      - "src/app/api/billing/invoices/route.ts:24-25 — repassa esse array diretamente pro client, sempre com 200, nunca propaga um erro upstream"
      - "A UI de faturamento tem um estado `invoicesError`, mas ele nunca é alcançado por essa falha específica — do ponto de vista do client, 'Asaas fora do ar' e 'org sem nenhuma fatura' produzem a MESMA resposta (200, invoices: [])"
      - "Padrão pré-existente à feature 006 (já valia com limit=5), mas a spec da 006 exige explicitamente distinguir os dois cenários (estado vazio vs. erro), e o próprio requirements.md relatado pelo subagente lista os dois cenários como critérios de aceite separados"
    evidence:
      - ref: "src/lib/asaas/getInvoices.ts:47"
        observation: "if (!res.ok) return [];"
      - ref: "src/lib/asaas/getInvoices.ts:59-61"
        observation: "catch retorna [] também"
      - ref: "src/app/api/billing/invoices/route.ts:24-25"
        observation: "repassa array direto, nunca propaga erro"
    code_refs:
      - {file: "src/lib/asaas/getInvoices.ts", symbol: "getInvoices", commit: null}
  reproduction_tests:
    - "n/a direta (sem mock de API externa nesta sessão); lógica de propagação de erro verificada por leitura + typecheck. A UI (faturamento/page.tsx:76-88) já tratava !res.ok corretamente — o gap era 100% servidor"
  regression_tests:
    - "scripts/test-configuracoes-residual.ts (GET /api/billing/invoices try/catch + 502 em falha)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/asaas/getInvoices.ts"
    purpose: "Lança erro em vez de retornar [] silenciosamente em falha de rede/API"
  - id: CHG-002
    kind: code
    artifact: "src/app/api/billing/invoices/route.ts"
    purpose: "Captura o erro e responde 502 com corpo de erro, em vez de sempre 200"

closure:
  policy: production-service
  satisfied: true
  delivery:
    kind: commit
    ref: "d7ae0c0"
    code_commit: "0e70981"
    delivered_at: "2026-07-23"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-23"
    closed_at: "2026-07-23"
    window: "waived — usuário decidiu promover a resolved tratando a entrega já confirmada (push origin/main) como suficiente, sem aguardar janela de observação adicional. Decisão registrada em 2026-07-23 via /reversa-debugger-graph."
    status: "closed"
resolution_kind: fixed
---

# Erro de API da Asaas vira lista vazia, indistinguível de "sem faturas"

## Summary

`getInvoices()` trata qualquer falha de rede ou erro HTTP da API da Asaas retornando um array vazio, exatamente igual ao caso legítimo de "esta org nunca teve faturas". A rota `/api/billing/invoices` sempre responde `200 {invoices: []}` nesses casos, então a UI não tem como saber se está vendo um estado vazio real ou uma falha de integração.

## Expected Behavior

A feature 006 (conforme relatado pelo subagente de inspeção a partir de `requirements.md`) trata como cenários distintos de aceite: "org sem faturas exibe estado vazio" versus falha de integração — implicitamente exigindo que a UI consiga reagir diferente a cada um (ex.: mensagem de erro vs. mensagem de "nenhuma fatura ainda").

## Actual Behavior

Ambos os cenários produzem a mesma resposta (`200`, `invoices: []`), fazendo a UI sempre cair no estado "nenhuma fatura ainda", mesmo quando a Asaas está fora do ar ou a chamada falhou por qualquer outro motivo.

## Steps to Reproduce

1. Simular indisponibilidade da API da Asaas (ex.: mockar `fetch` pra retornar erro, ou usar uma org com credencial inválida).
2. Acessar `/app/configuracoes/faturamento`.
3. **Esperado**: alguma indicação de que a lista de faturas falhou ao carregar.
4. **Observado**: tela idêntica à de uma org que nunca teve faturas.

## Evidence

Leitura de `getInvoices.ts` e `route.ts` — ver `traceability.root_cause`.

## Suspected Area

`lib-shared` (`src/lib/asaas/getInvoices.ts`), `route-handlers` (`src/app/api/billing/invoices/route.ts`).

## Acceptance Criteria

- Falha de rede/API da Asaas propaga um erro distinguível até a UI (ex.: status HTTP diferente, ou campo `error` na resposta), permitindo mostrar mensagem de erro em vez do estado vazio

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `getInvoices()` retornava `[]` tanto em `!res.ok` quanto em erro de rede; `route.ts` sempre respondia 200.

**Veredito de spec:** `spec-correta`. Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/lib/asaas/getInvoices.ts` | Lança erro em falha, não engole mais |
| CHG-002 | code | `src/app/api/billing/invoices/route.ts` | Captura e responde 502 com erro |

**Verificação:** `npx tsc --noEmit` e `eslint` limpos. A UI (`faturamento/page.tsx`) já tratava `!res.ok` corretamente antes desta mudança — bastou o servidor parar de mascarar a falha como sucesso vazio. **Atualização (2026-07-23):** `regression_tests` preenchido com `scripts/test-configuracoes-residual.ts` (prova estrutural do try/catch + resposta 502), fechando a lacuna de invariante `fixed` sem `regression_tests`.

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `0e70981` (código) / `d7ae0c0` (trava), push para `origin/main`. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente, dispensando espera adicional pela janela de observação.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente "Estados de erro e edge cases", subagente da feature 006.
- Padrão pré-existente ao 006 (já valia com `limit=5`), mas a feature aumentou a superfície de dependência dessa distinção ao explicitar os dois cenários como critérios de aceite separados.
