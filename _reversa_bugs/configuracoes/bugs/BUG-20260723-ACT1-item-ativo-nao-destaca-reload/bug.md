---
schema_version: 1
id: BUG-20260723-ACT1
display_number: 19
title: Submenu não destaca "Faturamento" como ativo em acesso direto/reload da rota
status: active
phase: delivering
severity: low
priority: P3

change_risk:
  classification: baixa
  motivos:
    - "Mudança isolada no inicializador do useState de expandedMenu em Sidebar.tsx"
    - "Sem infra de teste de componente React — verificação via typecheck/lint + revisão manual"
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [navigation, ui-polish]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: null
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260723-CLP1
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_forward/006-split-configuracoes/requirements.md#RF-07"
  affected_code:
    - "src/components/layout/Sidebar.tsx:52"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "RF-07 pede que o submenu indique o item ativo — cenário 'Submenu indica item ativo' na spec espera 'Faturamento esta destacado como subitem ativo'"
      - "Sidebar.tsx:52 inicializa `useState<Set<string>>(new Set())` sem nenhuma lógica que auto-expanda o acordeão baseada no `pathname` atual"
      - "Consequência: em acesso direto (digitar a URL) ou reload da página em /app/configuracoes/faturamento, o acordeão do submenu começa fechado — o subitem 'Faturamento' nem é renderizado no DOM (por causa da mesma condição `{!collapsed && isExpanded && (...)}` do BUG-20260723-CLP1), então não há como ele aparecer destacado como ativo"
    evidence:
      - ref: "src/components/layout/Sidebar.tsx:52"
        observation: "useState sem inicializador baseado em pathname"
    code_refs:
      - {file: "src/components/layout/Sidebar.tsx", symbol: null, commit: "79425a8"}
  reproduction_tests:
    - "n/a — sem infra de teste de componente React; reprodução provada por leitura estática (ver evidence/reproduction.md)"
  regression_tests: []

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/components/layout/Sidebar.tsx"
    purpose: "expandedMenu inicializa via função lazy que expande o item pai cujo filho corresponde ao pathname atual"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Submenu não auto-expande/destaca em acesso direto

## Summary

RF-07 pede que o submenu de Configurações destaque o subitem ativo. Isso funciona quando o usuário navega clicando dentro do próprio app, mas falha em acesso direto por URL ou reload da página — o estado de acordeão expandido não é inicializado a partir do `pathname` atual, então o subitem correspondente nem aparece no DOM pra ser destacado.

## Expected Behavior

`requirements.md#RF-07`, cenário "Submenu indica item ativo": Faturamento destacado como subitem ativo quando o usuário está na rota correspondente.

## Actual Behavior

Em reload/acesso direto a `/app/configuracoes/faturamento`, o submenu começa fechado (`isExpanded` não inicializado pelo pathname), então o subitem não renderiza e não há indicação de item ativo.

## Steps to Reproduce

1. Acessar diretamente `/app/configuracoes/faturamento` (colar a URL, ou dar reload na página).
2. Observar o sidebar.
3. **Esperado**: submenu de Configurações aparece expandido com "Faturamento" destacado.
4. **Observado**: submenu aparece fechado, sem nenhum destaque.

## Evidence

Leitura de `Sidebar.tsx:52` — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`Sidebar.tsx`).

## Acceptance Criteria

- Ao carregar a página em qualquer rota do submenu, o acordeão já inicia expandido com o subitem correspondente destacado

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `expandedMenu` iniciava sempre vazio, sem considerar o `pathname` atual.

**Veredito de spec:** `spec-correta` (RF-07). Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/components/layout/Sidebar.tsx` | `expandedMenu` inicializa expandido para o item pai da rota atual |

**Verificação:** `npx tsc --noEmit` e `eslint` limpos. Sem infra de teste de componente React.

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente "Conformidade com spec", subagente da feature 006.
- Relação `related-to BUG-20260723-CLP1` (proposed): raiz adjacente (mesma condição de renderização de children), mas o gatilho é diferente (reload/acesso direto vs. sidebar colapsada).
