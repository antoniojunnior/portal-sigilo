---
schema_version: 1
id: BUG-20260723-DAT1
display_number: 20
title: Possível offset de 1 dia em datas de fatura (vencimento/pagamento) por parse de data pura como UTC
status: active
phase: delivering
severity: medium
priority: P3
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: billing
labels: [timezone, data-flow]

visibility: normal
security_suspected: false

reproduction:
  classification: not-reproduced
  rate: null
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/006-split-configuracoes/roadmap.md (seção de riscos, item sobre paymentDate)"
  affected_code:
    - "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:51-53"
    - "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:186"
  root_cause:
    state: hypothesized
    hypothesis: "formatDate() faz new Date(iso).toLocaleDateString('pt-BR'), aplicado tanto ao vencimento quanto ao novo campo data_pagamento (RN-06 da feature 006). Se a Asaas retorna strings de data pura (YYYY-MM-DD, sem componente de hora), o JS interpreta isso como meia-noite UTC; renderizado em fuso America/Sao_Paulo (UTC-3), o dia exibido pode ficar 1 dia atrás do valor real. O próprio roadmap.md da feature 006 lista esse risco e prescreve EXATAMENTE este código (new Date(paymentDate).toLocaleDateString('pt-BR')) como a 'mitigação' — o que sugere que o padrão de código identificado como problema é o mesmo que foi adotado como solução, não confirmado se de fato mitiga ou apenas reproduz o risco."
    causal_path: []
    evidence:
      - ref: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:51-53"
        observation: "formatDate: new Date(iso).toLocaleDateString('pt-BR')"
      - ref: "_reversa_forward/006-split-configuracoes/roadmap.md (risco sobre paymentDate)"
        observation: "risco documentado: 'paymentDate pode vir em formato diferente do esperado (ex.: com timezone offset)'; mitigação prescrita é o mesmo código citado acima"
    code_refs:
      - {file: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx", symbol: "formatDate", commit: null}
  reproduction_tests:
    - "scripts/test-billing-date-sort.ts (\"BUG-20260723-DAT1 (reproducao): data pura YYYY-MM-DD nao sofre offset de 1 dia\") — confirmado ao vivo sob TZ=America/Sao_Paulo: código antigo exibia 14/jul para entrada 2026-07-15, código novo exibe 15/jul corretamente"
  regression_tests:
    - "scripts/test-billing-date-sort.ts (\"data com horário/timezone ISO completo também é interpretada pelo dia correto\", \"entrada inválida cai no fallback\")"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx#formatDate"
    purpose: "Parse manual de ano/mês/dia locais, ignorando componente de hora/timezone, elimina o offset independente do formato de wire da Asaas"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Possível offset de 1 dia nas datas de fatura

## Summary

`formatDate()` converte strings de data (vencimento e o novo campo `data_pagamento`) via `new Date(iso).toLocaleDateString('pt-BR')`. Se a Asaas devolve datas sem componente de hora (formato `YYYY-MM-DD`), o JavaScript as interpreta como meia-noite UTC — renderizadas no fuso de São Paulo (UTC-3), podem aparecer com 1 dia a menos do que o valor real. Não foi possível confirmar nesta sessão o formato exato de wire da Asaas para este campo.

## Expected Behavior

Datas de vencimento e pagamento exibidas devem corresponder exatamente ao dia informado pela Asaas, independente do fuso horário do navegador/servidor.

## Actual Behavior

Não confirmado empiricamente — depende do formato exato retornado pela Asaas para `dueDate`/`paymentDate`. Se vier sem componente de hora, o código atual está sujeito ao offset descrito.

## Steps to Reproduce

Não reproduzido nesta sessão (sem acesso a dados reais/sandbox da Asaas para confirmar o formato de wire). Passo sugerido: inspecionar uma resposta real de `GET /v3/payments` e verificar se `paymentDate`/`dueDate` vêm como `"2026-07-15"` (data pura) ou `"2026-07-15T00:00:00-03:00"` (com timezone).

## Evidence

Leitura de `page.tsx` (`formatDate`) e do próprio `roadmap.md` da feature 006, que documenta o risco e prescreve o mesmo código como mitigação — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`configuracoes/faturamento/page.tsx#formatDate`).

## Acceptance Criteria

- Confirmar o formato de wire real da Asaas para as datas
- Se vier sem timezone, ajustar o parse pra tratar a data como local/sem componente de hora (ex.: parsear manualmente `YYYY-MM-DD` sem passar por `new Date()` puro), evitando o offset

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado ao vivo):** `formatDate` usava `new Date(iso)` direto; sob `TZ=America/Sao_Paulo`, uma entrada `"2026-07-15"` exibia "14 de jul." (dia errado). Confirmado rodando o código antigo isoladamente com essa TZ antes de aplicar o fix.

**Veredito de spec:** `spec-correta`. Nenhum adendo necessário — o próprio roadmap da 006 já esperava a data correta, só a "mitigação" sugerida estava incompleta.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `faturamento/page.tsx#formatDate` | Parse manual ano/mês/dia, ignora hora/timezone |

**Testes (vermelho → verde, confirmado ao vivo sob TZ real):**
```
# código antigo, TZ=America/Sao_Paulo:
Input: 2026-07-15 -> Output: 14 de jul. de 2026   ❌

# código novo, mesma TZ:
✓ BUG-20260723-DAT1 (reproducao): data pura YYYY-MM-DD nao sofre offset de 1 dia
✓ data com horário/timezone ISO completo também é interpretada pelo dia correto
✓ entrada inválida cai no fallback (retorna a string original, não quebra)
```

`npx tsc --noEmit` e `eslint` limpos.

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente "Fluxo de dados", subagente da feature 006. Confidence média — não confirmado empiricamente, depende do formato de wire real que não foi possível verificar nesta sessão.
- Observação irônica registrada pelo subagente: o próprio roadmap da feature já identificou esse risco e propôs como mitigação exatamente o código que pode causar o problema — vale revisar se a mitigação prescrita foi mal compreendida na implementação.
