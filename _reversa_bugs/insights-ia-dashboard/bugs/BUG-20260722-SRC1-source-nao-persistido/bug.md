---
schema_version: 1
id: BUG-20260722-SRC1
display_number: 10
title: "source" do insight não é persistido no Firestore — GET sempre retorna "ai_generated"
status: active
phase: observing
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
  classification: deterministic
  rate: "10/10"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/addenda/003-insights-ia-dashboard-admin.md#RF-04 (Indicador de fonte)"
    - "_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-04"
  affected_code:
    - "src/app/api/dashboard/insights/regenerate/route.ts"
    - "src/app/api/dashboard/insights/route.ts"
    - "src/lib/insights/mapItems.ts"
  root_cause:
    state: confirmed
    hypothesis: "POST /regenerate calculava `source` mas só usava em console.log/resposta HTTP, nunca persistia em orgs.ai_insights; GET inferia sempre 'ai_generated' na ausência do campo"
    causal_path:
      - "regenerate/route.ts calculava source (fallback|ai_generated) em variável local"
      - "O .update() em orgs.ai_insights não incluía essa variável"
      - "GET /insights lia aiInsights.source, sempre undefined, caindo no default 'ai_generated'"
      - "Badge de fallback (RF-04) nunca aparecia mesmo com conteúdo genérico"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:insights-bugs: 4/4 verde, incl. round-trip real no Firestore confirmando persistência do campo"
    code_refs:
      - { file: "src/app/api/dashboard/insights/regenerate/route.ts", symbol: "POST, linha 145 (source no update)", commit: null }
      - { file: "src/app/api/dashboard/insights/route.ts", symbol: "GET, resolveInsightSource", commit: null }
  reproduction_tests:
    - "scripts/test-insights-bugs.ts (resolveInsightSource(undefined) reproduz o fallback legado)"
  regression_tests:
    - "scripts/test-insights-bugs.ts (resolveInsightSource('fallback') preserva a fonte real; round-trip Firestore real)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/dashboard/insights/regenerate/route.ts"
    purpose: "Persiste `source` em orgs.ai_insights junto com items e gerado_em (já aplicado antes desta sessão, confirmado por leitura de código)"
    diff: null
  - id: CHG-002
    kind: code
    artifact: "src/app/api/dashboard/insights/route.ts"
    purpose: "Lê source do Firestore via resolveInsightSource, fallback 'ai_generated' para dados antigos (já aplicado antes desta sessão)"
    diff: null
  - id: CHG-003
    kind: test
    artifact: "scripts/test-insights-bugs.ts"
    purpose: "Testes de reprodução + regressão (NOVO nesta sessão de /reversa-debugger-fix)"
    diff: "fix/CHG-003-new-test-file.ts.snapshot"
  - id: CHG-004
    kind: code
    artifact: "src/lib/insights/mapItems.ts, src/app/api/dashboard/insights/route.ts"
    purpose: "Extrai resolveInsightSource como função pura testável (NOVO nesta sessão, necessário pro Gate 1)"
    diff: "fix/CHG-004.diff"

closure:
  policy: production-service
  satisfied: false
  delivery:
    kind: commit
    ref: "b906ca5"
    code_commit: "22edd28"
    delivered_at: "2026-07-22"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-22"
    window: "a definir — recomendado: 1 regeneração manual real observada em produção mostrando badge de fallback correto, ou 1 ciclo da scheduled function sem badge indevido"
    status: "observing"
resolution_kind: fixed

agent_notes: |
  Encontrado durante inspeção proativa pós-/reversa-coding da feature 003.
  O mesmo problema existe na function agendada functions/src/aiInsights.ts (não persiste source).
  A function agendada não foi corrigida nesta sessão por ser anterior à feature 003 e não fazer
  parte do escopo do actions.md. Corrigir em iteração futura se necessário.
  Formalização retroativa: CHG-001/CHG-002 já estavam aplicados no código antes desta sessão de
  /reversa-debugger-fix (execução autônoma anterior sem os gates deste skill). Esta sessão
  adicionou CHG-003 (testes) e CHG-004 (extração p/ testabilidade) e conduziu o veredito de spec
  + fechamento formal.
---

## Resolution

**Causa raiz (confirmed):** `POST /api/dashboard/insights/regenerate` calculava `source` mas só usava em `console.log`/resposta HTTP — nunca persistia em `orgs.ai_insights`. `GET /insights` inferia sempre `"ai_generated"` na ausência do campo.

**Veredito de spec: `spec-correta`** — RF-04 já definia que a fonte deveria ser distinguível; a implementação inicial não persistia o campo necessário. Sem adendo (a spec já estava certa).

**Change Set:**

| CHG | Artefato | O que faz |
|---|---|---|
| CHG-001 | `regenerate/route.ts` | Persiste `source` (já aplicado antes desta sessão) |
| CHG-002 | `insights/route.ts` | Lê `source` via `resolveInsightSource` (já aplicado antes desta sessão) |
| CHG-003 | `scripts/test-insights-bugs.ts` | Testes de reprodução + regressão (novo) |
| CHG-004 | `mapItems.ts` + `insights/route.ts` | Extrai `resolveInsightSource` como função pura testável (novo, necessário pro Gate 1) |

**Testes — vermelho → verde:**

```
# ANTES (resolveInsightSource removida temporariamente pra provar o gate):
TSError: ⨯ Unable to compile TypeScript:
scripts/test-insights-bugs.ts(7,10): error TS2305: Module '"../src/lib/insights/mapItems"'
has no exported member 'resolveInsightSource'.

# DEPOIS:
  resolveInsightSource(undefined) infere 'ai_generated' para dado legado sem o campo... ✓ PASSOU
  resolveInsightSource('fallback') preserva a fonte real gravada... ✓ PASSOU
  resolveInsightSource('ai_generated') passa direto quando já é o valor real... ✓ PASSOU
  Firestore real: orgs.ai_insights.source grava e lê de volta sem perda... ✓ PASSOU

4 passou(aram), 0 falhou(aram) de 4 teste(s)
```

`npx tsc --noEmit`: `TSC:0`, sem erros novos.

**Fechamento:** `status: active`, `phase: observing` — entregue via commit `22edd28` (código) / `b906ca5` (docs), push `f8fd9c8..b906ca5` para `origin/main` em 2026-07-22. `closure.satisfied: false` até a janela de `post_fix_observation` confirmar não recorrência. Sem `DONE.md` ainda.

## Expected Behavior

O `POST /api/dashboard/insights/regenerate` deve persistir o campo `source` em `orgs.ai_insights` junto com `items` e `gerado_em`, para que o `GET /api/dashboard/insights` possa retornar a fonte correta. Quando o regenerate gera itens hardcoded (zero casos), `source` deveria ser `"fallback"`; quando chama Claude, `"ai_generated"`.

## Observed Behavior

O `regenerate` calcula `source` na linha 111 (`"fallback"` para `totalCases === 0`, `"ai_generated"` caso contrário), mas o valor é usado apenas no `console.log` e no corpo da resposta HTTP. O campo NÃO é gravado em `orgs.ai_insights`. Quando o `GET /api/dashboard/insights` lê os dados de volta, ele infere `source: "ai_generated"` sempre que `items` existe (linha 27 do GET), independentemente de como foram gerados.

## Steps to Reproduce

1. Garantir que a org não tem casos nos últimos 7 dias.
2. Admin chama `POST /api/dashboard/insights/regenerate`.
3. O endpoint grava itens hardcoded de fallback em `orgs.ai_insights`.
4. Admin abre o dashboard — o `GET /api/dashboard/insights` retorna `source: "ai_generated"` com os itens hardcoded.
5. O badge "Estimativa automática" (RF-04) NÃO aparece, apesar do conteúdo ser fallback.

## Evidence

- `src/app/api/dashboard/insights/regenerate/route.ts:111` — `source` calculado mas não persistido
- `src/app/api/dashboard/insights/route.ts:27` — GET infere `"ai_generated"` independente da fonte real
- `_reversa_bugs/insights-ia-dashboard/intake/relato-20260722-inspection.md` — relato completo da inspeção
