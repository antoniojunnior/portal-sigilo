---
schema_version: 1
id: BUG-20260722-TCT1
display_number: 11
title: TOCTOU no rate limit de regeneração — duas requisições concorrentes podem passar
status: active
phase: delivering
severity: low
priority: P3
created: 2026-07-22
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: route-handlers
feature: dashboard
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: environment-dependent
  rate: "1/10"
  suspected_triggers:
    - "Dois admins da mesma org clicando em 'Atualizar agora' simultaneamente"
    - "Mesmo admin com dois tabs abertos"

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-03 (Rate limit 1x a cada 24h)"
    - "_reversa_forward/003-insights-ia-dashboard-admin/roadmap.md#D-02"
  affected_code:
    - "src/app/api/dashboard/insights/regenerate/route.ts"
    - "src/lib/insights/rateLimit.ts"
  root_cause:
    state: confirmed
    hypothesis: "Leitura de gerado_em e escrita do novo timestamp não eram atômicas — a chamada à Anthropic API entre elas (segundos) criava janela de corrida real"
    causal_path:
      - "regenerate/route.ts lia orgs.ai_insights.gerado_em"
      - "Chamava a Anthropic API (latência de segundos)"
      - "Só depois gravava o novo gerado_em"
      - "2ª requisição concorrente lia o gerado_em antigo antes da 1ª escrever, passava pelo rate limit"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:insights-bugs: 2 chamadas via Promise.all contra reserveRegenerationSlot, exatamente 1 allowed=true — confirma que a transação serializa corretamente"
    code_refs:
      - { file: "src/app/api/dashboard/insights/regenerate/route.ts", symbol: "POST (antes: leitura+escrita não-atômica)", commit: null }
      - { file: "src/lib/insights/rateLimit.ts", symbol: "reserveRegenerationSlot", commit: null }
  reproduction_tests: []
  regression_tests:
    - "scripts/test-insights-bugs.ts (2 chamadas concorrentes → exatamente 1 allowed=true; 3ª chamada subsequente bloqueada)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/dashboard/insights/regenerate/route.ts"
    purpose: "Envolve check de rate limit em Firestore runTransaction (já aplicado antes desta sessão, confirmado por leitura de código)"
    diff: null
  - id: CHG-002
    kind: code
    artifact: "src/lib/insights/rateLimit.ts"
    purpose: "Extrai a transação para reserveRegenerationSlot(orgId), testável sem invocar o Route Handler HTTP (NOVO nesta sessão, necessário pro Gate 1)"
    diff: "fix/CHG-002-rateLimit-extraction.diff"
  - id: CHG-003
    kind: code
    artifact: "src/app/api/dashboard/insights/regenerate/route.ts"
    purpose: "Route simplificado pra chamar reserveRegenerationSlot em vez da transação inline; remove classe RateLimitError não mais necessária (NOVO nesta sessão)"
    diff: "fix/CHG-003-route-simplification.diff"
  - id: CHG-004
    kind: test
    artifact: "scripts/test-insights-bugs.ts"
    purpose: "Teste de concorrência real (Promise.all, 2 chamadas simultâneas contra Firestore real) — NOVO nesta sessão"
    diff: null

closure:
  policy: production-service
  satisfied: false
  delivery: null
  post_fix_observation: null
resolution_kind: fixed

agent_notes: |
  Encontrado durante inspeção proativa pós-/reversa-coding da feature 003.
  Cenário de corrida extremamente improvável em uso real (rate: 1/10 na inspeção original,
  estimativa qualitativa — não uma taxa medida sob concorrência real).
  Mitigação já aplicada antes desta sessão: Firestore runTransaction lê gerado_em e escreve
  novo timestamp atomicamente. Trade-off aceito: se a chamada ao Claude falhar após a transação,
  o slot de 24h já está consumido (custo: uma regeneração perdida, não um problema de segurança
  ou custo).
  Formalização retroativa nesta sessão de /reversa-debugger-fix: CHG-001 já estava aplicado
  (mitigação real, correta). Esta sessão extraiu a transação para uma função testável
  (CHG-002/CHG-003) e escreveu o primeiro teste de concorrência REAL contra Firestore (CHG-004) —
  sem essa extração, não havia como provar automaticamente que a mitigação funciona.
---

## Resolution

**Causa raiz (confirmed):** Leitura de `gerado_em` e escrita do novo timestamp não eram atômicas — a chamada à Anthropic API entre elas (segundos de latência) criava janela de corrida real.

**Veredito de spec: `spec-correta`** — RF-03 já exigia rate limit de 24h; a implementação inicial era não-atômica. Sem adendo.

**Change Set:**

| CHG | Artefato | O que faz |
|---|---|---|
| CHG-001 | `regenerate/route.ts` | `runTransaction` envolvendo leitura+escrita (já aplicado antes desta sessão — mitigação real e correta) |
| CHG-002 | `rateLimit.ts` | Extrai `reserveRegenerationSlot(orgId)` (novo, necessário pro Gate 1) |
| CHG-003 | `regenerate/route.ts` | Route simplificado, chama a função extraída (novo) |
| CHG-004 | `scripts/test-insights-bugs.ts` | Teste de concorrência real (novo) |

**Testes — vermelho → verde:**

```
# ANTES (reserveRegenerationSlot removida temporariamente pra provar o gate):
TSError: ⨯ Unable to compile TypeScript:
scripts/test-insights-bugs.ts(8,10): error TS2305: Module '"../src/lib/insights/rateLimit"'
has no exported member 'reserveRegenerationSlot'.

# DEPOIS:
  reserveRegenerationSlot: 2 chamadas concorrentes contra Firestore real, exatamente 1 allowed=true... ✓ PASSOU
  reserveRegenerationSlot: terceira chamada logo em seguida é bloqueada... ✓ PASSOU
```

`npx tsc --noEmit`: `TSC:0`, sem erros novos.

**Fechamento:** `status: active`, `phase: delivering` — `closure.satisfied: false` até `delivery` (commit/push) + janela de `post_fix_observation` (política `production-service`). Sem `DONE.md` ainda.

## Expected Behavior

O rate limit de 24h do `POST /api/dashboard/insights/regenerate` deve impedir que duas requisições concorrentes passem pela checagem. A leitura do `gerado_em` e a escrita do novo `ai_insights` deveriam ser atômicas.

## Observed Behavior

O endpoint lê `orgs.ai_insights.gerado_em` (linha 30), faz a chamada à Anthropic API (que pode levar vários segundos, linhas 82-86), e só então grava o novo `gerado_em` via `FieldValue.serverTimestamp()` (linhas 113-118). Entre a leitura e a escrita, uma segunda requisição concorrente pode ler o mesmo `gerado_em` antigo e passar pelo rate limit.

## Steps to Reproduce

1. Dois admins da mesma org (ou um admin com dois tabs) disparam `POST /api/dashboard/insights/regenerate` simultaneamente.
2. Ambas as requisições leem `gerado_em` antes que a primeira escreva o novo valor.
3. Ambas passam pelo `isRegenerationAllowed` (nenhuma vê o novo `gerado_em` ainda).
4. Ambas chamam a Anthropic API, resultando em 2 chamadas no mesmo ciclo de 24h.

## Evidence

- `src/app/api/dashboard/insights/regenerate/route.ts:30` — leitura de `gerado_em`
- `src/app/api/dashboard/insights/regenerate/route.ts:82-86` — chamada à Anthropic API (janela de corrida)
- `src/app/api/dashboard/insights/regenerate/route.ts:113-118` — escrita tardia do novo `gerado_em`
- `_reversa_bugs/insights-ia-dashboard/intake/relato-20260722-inspection.md` — relato completo da inspeção
