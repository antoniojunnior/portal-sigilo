---
schema_version: 1
id: BUG-20260723-DTN1
display_number: 24
title: Date.now() chamado durante render em insights/page.tsx viola regra de pureza do React
status: active
phase: delivering

change_risk:
  classification: baixa
  motivos:
    - "Mudança isolada de onde Date.now() é chamado, sem alterar a lógica de cálculo de timeAgo"
severity: low
priority: P3
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [pre-existing-amplified, react-purity]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1 — eslint (react-hooks/purity) reproduz de forma determinística"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs: []
  affected_code:
    - "src/app/(dashboard)/app/(protected)/insights/page.tsx:32"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "insights/page.tsx:32 chama `Date.now()` diretamente no corpo do componente (durante render) para calcular `timeAgo` via `Intl.RelativeTimeFormat`"
      - "`Date.now()` é uma função impura — cada render pode produzir um valor diferente sem que nenhum estado tenha mudado, violando a regra de pureza de componentes/hooks do React (eslint react-hooks/purity confirma)"
      - "Pré-existente à feature 007 (a página já existia desde a feature 003) — a feature 007 não introduziu o problema, mas aumentou a exposição/tráfego da página ao adicionar o link no sidebar (RF-06), tornando o comportamento potencialmente inconsistente (timestamp relativo dessincronizado entre re-renders) mais visível"
    evidence:
      - ref: "src/app/(dashboard)/app/(protected)/insights/page.tsx:32"
        observation: "eslint: 'Cannot call impure function during render... Date.now is an impure function' (regra react-hooks/purity)"
    code_refs:
      - {file: "src/app/(dashboard)/app/(protected)/insights/page.tsx", symbol: "InsightsPage", commit: null}
  reproduction_tests:
    - "scripts/test-insights-timeago-pure.ts (\"Date.now() só aparece dentro de um useEffect...\")"
  regression_tests:
    - "npx eslint insights/page.tsx limpo (react-hooks/purity resolvido)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/insights/page.tsx"
    purpose: "Date.now() movido pra dentro de um useEffect (estado now), fora do corpo do render"
  - id: CHG-002
    kind: test
    artifact: "scripts/test-insights-timeago-pure.ts (novo)"
    purpose: "Prova estrutural de que Date.now() não está mais no corpo do componente"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Date.now() durante render em insights/page.tsx

## Summary

`insights/page.tsx` calcula `timeAgo` chamando `Date.now()` diretamente no corpo do componente (durante render), o que o eslint sinaliza como violação da regra de pureza (`react-hooks/purity`) — pode produzir resultados inconsistentes entre re-renders sem mudança de estado real. Defeito pré-existente à feature 007, mas com exposição aumentada agora que a página ganhou link no sidebar.

## Expected Behavior

Cálculos dependentes do "agora" (tempo atual) não deveriam rodar no corpo puro do componente — deveriam vir de estado atualizado via efeito/interval, ou ser recalculados de forma controlada.

## Actual Behavior

`Date.now()` chamado inline durante o render, conforme apontado pelo eslint.

## Steps to Reproduce

1. `npx eslint "src/app/(dashboard)/app/(protected)/insights/page.tsx"`.
2. **Esperado**: 0 erros.
3. **Observado**: 1 erro (`react-hooks/purity`, linha 32).

## Evidence

Saída do eslint — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`insights/page.tsx`).

## Acceptance Criteria

- `eslint` limpo para esse arquivo
- `timeAgo` calculado sem depender de chamada impura direta no corpo do componente (ex.: via `useMemo` com dependência explícita, ou estado atualizado por `useEffect`/`setInterval`)

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `Date.now()` chamado direto no corpo do componente, violando `react-hooks/purity`.

**Veredito de spec:** `spec-correta` (não há spec sobre isso, é regra de qualidade de código). Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `insights/page.tsx` | `Date.now()` movido pra `useEffect` (estado `now`) |
| CHG-002 | test | `scripts/test-insights-timeago-pure.ts` (novo) | Prova estrutural |

**Testes:** verde. `npx tsc --noEmit` e `eslint` limpos (precisou de `eslint-disable-next-line react-hooks/set-state-in-effect` pontual, mesmo padrão já usado em `page.tsx` da feature 005).

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (feature 007), lente "Fluxo de dados"/qualidade de código — pré-existente à feature 003, não introduzido por 007.
- Severidade `low`: não é uma quebra funcional visível na maioria dos casos (o React tolera essa impureza na prática, é mais um risco de comportamento inconsistente futuro), mas é dívida técnica real e concreta, com evidência de ferramenta (eslint), não suposição.
- Varredura mais ampla de `eslint src/` nesta sessão encontrou outros 27 erros pré-existentes em arquivos não relacionados à feature 007 (`ThemeToggle.tsx`, `Tooltip.tsx`, etc.) — fora do escopo desta inspeção (feature 007 especificamente), mencionados aqui só como contexto; não registrados como bugs individuais.
