---
schema_version: 1
id: BUG-20260723-CLP1
display_number: 16
title: Item "Configurações" no sidebar colapsado não navega — clique sem efeito visível
status: resolved
phase: resolved
severity: medium
priority: P2

change_risk:
  classification: baixa
  motivos:
    - "Mudança isolada no onClick do item com children em Sidebar.tsx"
    - "Sem infra de teste de componente React — verificação via typecheck/lint + revisão manual"
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [navigation, sidebar-collapsed]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: null
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260723-MOB1
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_forward/006-split-configuracoes/actions.md#T006"
  affected_code:
    - "src/components/layout/Sidebar.tsx:118-146"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "Sidebar.tsx:118-145 — todo item com `children` (como o novo item Configurações com submenu) renderiza sempre um `<button onClick={toggleExpanded}>`, nunca um `<Link>` navegável diretamente"
      - "Sidebar.tsx:146 — os `children` (subitens Organização/Faturamento) só renderizam quando `{!collapsed && isExpanded && (...)}` — ou seja, com a sidebar colapsada, `!collapsed` é falso e os filhos NUNCA aparecem, mesmo que `isExpanded` seja true"
      - "Resultado: com a sidebar colapsada, clicar no ícone de Configurações só chama `toggleExpanded` (que não tem efeito visível, já que os filhos não podem aparecer colapsado) — o clique parece não fazer nada, e não há como chegar a Organização/Faturamento sem antes expandir a sidebar inteira"
      - "actions.md T006(a) marca 'verificar responsividade do submenu em sidebar colapsada' como [X] concluído, mas o cenário de navegação colapsada não foi de fato corrigido/coberto"
    evidence:
      - ref: "src/components/layout/Sidebar.tsx:118-145"
        observation: "item com children sempre renderiza <button onClick={toggleExpanded}>, nunca <Link>"
      - ref: "src/components/layout/Sidebar.tsx:146"
        observation: "children só renderizam sob `{!collapsed && isExpanded && (...)}`"
      - ref: "_reversa_forward/006-split-configuracoes/actions.md#T006"
        observation: "item (a) marcado [X] sem que o cenário de sidebar colapsada tenha sido corrigido"
    code_refs:
      - {file: "src/components/layout/Sidebar.tsx", symbol: null, commit: "79425a8"}
  reproduction_tests:
    - "n/a — sem infra de teste de componente React; reprodução provada por leitura estática (ver evidence/reproduction.md)"
  regression_tests:
    - "scripts/test-configuracoes-residual.ts (clique colapsado expande a sidebar via setCollapsed(false))"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/components/layout/Sidebar.tsx"
    purpose: "Clique no item com children, quando colapsado, expande a sidebar inteira e já abre o submenu, em vez de só alternar um estado sem efeito visível"

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

# Submenu colapsado não navega

## Summary

Com a sidebar principal do app colapsada, o item "Configurações" (que agora tem submenu) renderiza como um botão que só alterna um estado de expansão interno — mas esse estado nunca tem efeito visível, porque os subitens só aparecem quando a sidebar NÃO está colapsada. O clique parece não fazer nada, e não há atalho pra navegar direto (ex.: pro último subitem visitado) estando colapsado.

## Expected Behavior

`actions.md#T006` previa checar/garantir responsividade do submenu com a sidebar colapsada. O comportamento esperado é que o usuário consiga chegar em Organização/Faturamento de alguma forma, mesmo com a sidebar colapsada (ex.: expandir automaticamente a sidebar ao clicar, ou navegar direto pro item pai).

## Actual Behavior

Clicar no ícone de Configurações colapsado só altera um estado `isExpanded` que nunca é lido enquanto `collapsed === true` — o clique é efetivamente um no-op do ponto de vista do usuário.

## Steps to Reproduce

1. Colapsar a sidebar principal do app.
2. Clicar no ícone de "Configurações".
3. **Esperado**: navega para `/app/configuracoes`, ou expande a sidebar mostrando os subitens, ou algum feedback visível acontece.
4. **Observado**: nada visível acontece.

## Evidence

Leitura de `Sidebar.tsx:118-146` — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`Sidebar.tsx`).

## Acceptance Criteria

- Clicar no item Configurações com a sidebar colapsada produz algum efeito navegável (expandir a sidebar, navegar para a página principal do item, ou equivalente)

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** clique no item com filhos, colapsado, só alternava `isExpanded`, que nunca tinha efeito porque os filhos só renderizam com `!collapsed`.

**Veredito de spec:** `spec-correta`. Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/components/layout/Sidebar.tsx` | Clique colapsado expande a sidebar + abre o submenu |

**Verificação:** `npx tsc --noEmit` e `eslint` limpos. Sem infra de teste de componente React. **Atualização (2026-07-23):** `regression_tests` preenchido com `scripts/test-configuracoes-residual.ts` (prova estrutural do handler `onClick` expandindo a sidebar via `setCollapsed(false)` quando colapsada), fechando a lacuna de invariante `fixed` sem `regression_tests`.

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `0e70981` (código) / `d7ae0c0` (trava), push para `origin/main`. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente, dispensando espera adicional pela janela de observação.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente "Conformidade com spec", subagente da feature 006.
- Relação `related-to BUG-20260723-MOB1` (proposed): ambos são gaps de navegação introduzidos pelo mesmo redesign de submenu, em superfícies diferentes (mobile vs. sidebar colapsada).
