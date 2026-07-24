---
schema_version: 1
id: BUG-20260723-DAT1
display_number: 20
title: Possível offset de 1 dia em datas de fatura (vencimento/pagamento) por parse de data pura como UTC
status: resolved
phase: resolved
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
  classification: deterministic
  rate: "confirmado ao vivo sob TZ=America/Sao_Paulo: entrada 2026-07-15 sempre exibia 14/jul com o código antigo"
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
    state: confirmed
    hypothesis: null
    causal_path:
      - "formatDate() fazia new Date(iso).toLocaleDateString('pt-BR'), aplicado tanto ao vencimento quanto ao novo campo data_pagamento (RN-06 da feature 006)"
      - "Confirmado ao vivo (scripts/test-billing-date-sort.ts, TZ=America/Sao_Paulo): entrada '2026-07-15' com o código antigo exibia '14 de jul.' — um dia a menos"
      - "Mecanismo: new Date('2026-07-15') sem componente de hora é interpretado pelo JS como meia-noite UTC; renderizado em UTC-3 (São Paulo), cai no dia anterior"
      - "Corrigido com parse manual de ano/mês/dia locais, ignorando timezone; testado sob a mesma TZ real mostra '15 de jul.' correto"
      - "Não confirmado (fora do alcance desta sessão, sem acesso a sandbox real): se a Asaas de fato retorna data pura (YYYY-MM-DD) ou com timezone explícito para este campo — mas o mecanismo do defeito e da correção está confirmado independente do formato de wire exato, já que o fix trata ambos os casos (ver regression_tests)"
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

**Root cause (confirmado ao vivo):** `formatDate` usava `new Date(iso)` direto; sob `TZ=America/Sao_Paulo`, uma entrada `"2026-07-15"` exibia "14 de jul." (dia errado). Confirmado rodando o código antigo isoladamente com essa TZ antes de aplicar o fix. **Atualização (2026-07-23):** o campo `root_cause.state` estava desatualizado como `hypothesized` mesmo com a prosa já descrevendo confirmação ao vivo — corrigido para `confirmed`, `causal_path` preenchido, `reproduction.classification` corrigido pra `deterministic`.

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

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `0e70981` (código) / `d7ae0c0` (trava), push para `origin/main`. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente, dispensando espera adicional pela janela de observação.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente "Fluxo de dados", subagente da feature 006. Confidence média — não confirmado empiricamente, depende do formato de wire real que não foi possível verificar nesta sessão.
- Observação irônica registrada pelo subagente: o próprio roadmap da feature já identificou esse risco e propôs como mitigação exatamente o código que pode causar o problema — vale revisar se a mitigação prescrita foi mal compreendida na implementação.
