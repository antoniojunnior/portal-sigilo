---
schema_version: 1
id: BUG-20260723-MOB1
display_number: 15
title: Nenhum caminho de navegação até /app/configuracoes/faturamento em viewport mobile (<640px)
status: resolved
phase: resolved
severity: high
priority: P1
created: 2026-07-23
updated: 2026-07-23

change_risk:
  classification: baixa
  motivos:
    - "Mudança isolada em BottomNav.tsx, componente sem outros consumidores"
    - "Sem infra de teste de componente React no projeto — verificação via typecheck/lint + revisão manual do código, não teste automatizado ou captura de tela"

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [responsive, navigation]

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
    - "_reversa_forward/006-split-configuracoes/requirements.md#RF-01"
  affected_code:
    - "src/components/layout/DashboardLayout.tsx:15"
    - "src/components/layout/BottomNav.tsx:7-12"
    - "src/components/layout/DashboardHeader.tsx:130-131"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "RF-01 da feature 006 pede o submenu 'Configurações > Organização | Faturamento' apenas em src/components/layout/Sidebar.tsx — escopo restrito ao sidebar desktop, sem mencionar BottomNav.tsx nem continuidade mobile"
      - "DashboardLayout.tsx:15 renderiza a Sidebar com classe `hidden lg:flex` — invisível abaixo do breakpoint lg"
      - "BottomNav.tsx:7-12 (navegação mobile) tem itens hardcoded (Visão geral, Casos, Relatórios, Configurações) sem nenhum item de Faturamento nem lógica de submenu"
      - "DashboardHeader.tsx:130-131, o badge/link que também levava a faturamento, usa classe `hidden sm:inline-flex` — some abaixo de 640px"
      - "Resultado: em mobile, não existe NENHUM elemento de UI que leve a /app/configuracoes/faturamento, exceto digitar a URL manualmente"
    evidence:
      - ref: "src/components/layout/DashboardLayout.tsx:15"
        observation: "Sidebar com `hidden lg:flex`"
      - ref: "src/components/layout/BottomNav.tsx:7-12"
        observation: "items hardcoded sem 'Faturamento', sem adminOnly"
      - ref: "src/components/layout/DashboardHeader.tsx:130-131"
        observation: "badge/link de faturamento com `hidden sm:inline-flex`"
    code_refs:
      - {file: "src/components/layout/BottomNav.tsx", symbol: null, commit: "79425a8"}
      - {file: "src/components/layout/Sidebar.tsx", symbol: null, commit: "79425a8"}
  reproduction_tests:
    - "n/a — sem infra de teste de componente React neste projeto; reprodução provada por leitura estática (ver evidence/reproduction.md)"
  regression_tests: []

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/components/layout/BottomNav.tsx"
    purpose: "Item Config. ganha submenu (Organização/Faturamento) via popover ancorado, filtrado por adminOnly como no Sidebar desktop"

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

# Sem navegação mobile até Faturamento

## Summary

A feature 006 moveu o acesso a Faturamento para um submenu do `Sidebar.tsx` (desktop, `hidden lg:flex`). Nenhum componente de navegação mobile (`BottomNav.tsx`) ganhou item equivalente, e o link alternativo do header também está oculto abaixo de 640px. Usuários em celular perdem completamente o caminho de UI até `/app/configuracoes/faturamento`.

## Expected Behavior

`requirements.md#RF-01` pede acesso ao Faturamento via submenu de navegação — implicitamente, em qualquer viewport suportado pelo produto (o app já tem `BottomNav.tsx` dedicado a mobile, indicando que mobile é viewport suportado).

## Actual Behavior

Em telas <640px: `Sidebar.tsx` (`hidden lg:flex`) não renderiza; `BottomNav.tsx` não tem item de Faturamento; badge do header (`hidden sm:inline-flex`) também não renderiza. Nenhum caminho de UI leva à rota — só digitação manual da URL.

## Steps to Reproduce

1. Abrir o app em viewport <640px (ou emular mobile no DevTools).
2. Tentar navegar até "Configurações > Faturamento" por qualquer elemento de UI visível.
3. **Esperado**: algum item de navegação leva à rota.
4. **Observado**: nenhum elemento visível leva lá.

## Evidence

Leitura de código (`DashboardLayout.tsx`, `BottomNav.tsx`, `DashboardHeader.tsx`) — ver `traceability.root_cause` no front matter.

## Suspected Area

`client-ui` (`BottomNav.tsx`, `Sidebar.tsx`, `DashboardHeader.tsx`).

## Acceptance Criteria

- `BottomNav.tsx` (ou algum componente mobile equivalente) ganha caminho de navegação até Faturamento, respeitando `adminOnly`

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `BottomNav.tsx` tinha itens fixos sem item de Faturamento; `Sidebar.tsx` (desktop) e badge do header ficam ocultos abaixo de 640px.

**Veredito de spec:** `spec-correta` — `RF-01` já implicava acesso ao submenu como navegação geral do app; código não cobriu a superfície mobile. Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/components/layout/BottomNav.tsx` | Item "Config." ganha popover com Organização/Faturamento, filtrado por `adminOnly` |

**Verificação:** `npx tsc --noEmit` e `eslint` limpos. Sem infra de teste de componente React no projeto (dívida técnica pré-existente, F-TESTES-01) — sem verificação em browser real nesta sessão.

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `0e70981` (código) / `d7ae0c0` (trava), push para `origin/main`. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente, dispensando espera adicional pela janela de observação.

## Agent Notes

- Achado via `/reversa-depth-inspection` (varredura features 004/005/006), lente "Conformidade com spec", subagente dedicado à feature 006.
- Evidência é 100% leitura de código; não houve captura de tela/teste em browser real.
