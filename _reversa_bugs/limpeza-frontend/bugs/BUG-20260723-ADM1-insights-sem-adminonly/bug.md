---
schema_version: 1
id: BUG-20260723-ADM1
display_number: 22
title: Sidebar "Insights" sem adminOnly — acessível a qualquer role, inconsistente com a spec original da feature 003
status: active
phase: delivering

change_risk:
  classification: baixa
  motivos:
    - "Restringe acesso (mais permissivo → mais restrito), reduzindo superfície em vez de aumentar — baixo risco de quebrar fluxos legítimos"
    - "Segue exatamente o padrão já usado em Configurações/Faturamento (adminOnly + 403 + redirect), não inventa mecanismo novo"
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [authorization, navigation]

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
    - "_reversa_forward/007-limpeza-frontend/requirements.md#RF-06"
    - "_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-02"
  affected_code:
    - "src/components/layout/Sidebar.tsx"
    - "src/app/api/dashboard/insights/route.ts"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "RF-06 da feature 007 pede só 'Adicionar /app/insights ao NAV_ITEMS do Sidebar.tsx', sem mencionar adminOnly"
      - "O item implementado (`{ href: \"/app/insights\", label: \"Insights\", icon: Lightbulb }`) não tem `adminOnly: true`, ao contrário do item irmão 'Configurações' que tem"
      - "A spec original de /app/insights (feature 003) enquadra a feature inteira em torno do 'Gestor de compliance (admin)' como persona, e RF-02 dessa mesma feature restringe explicitamente o endpoint de regeneração a `role === admin`"
      - "GET /api/dashboard/insights (a API que a página consome) não tem NENHUMA checagem de role — qualquer usuário autenticado da org, incluindo `auditor`, consegue ler os dados agregados (departamento/categoria com mais casos, tendências)"
      - "Antes da feature 007, a página existia mas não tinha link nenhum no sidebar (só acessível via URL direta) — a feature 007 aumentou significativamente a descoberta/exposição ao adicionar navegação visível pra todos os roles"
    evidence:
      - ref: "src/components/layout/Sidebar.tsx (NAV_ITEMS)"
        observation: "item Insights sem adminOnly; item Configurações irmão tem adminOnly: true"
      - ref: "_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-02"
        observation: "endpoint de regeneração restrito a role===admin, reforçando que a feature trata insights como recurso do admin"
      - ref: "src/app/api/dashboard/insights/route.ts"
        observation: "GET não checa session.role em nenhum momento"
    code_refs:
      - {file: "src/components/layout/Sidebar.tsx", symbol: "NAV_ITEMS", commit: "d7ae0c0"}
      - {file: "src/app/api/dashboard/insights/route.ts", symbol: "GET", commit: null}
  reproduction_tests:
    - "scripts/test-insights-adminonly.ts (\"item Insights no NAV_ITEMS tem adminOnly: true\")"
  regression_tests:
    - "scripts/test-insights-adminonly.ts (checagem de role na API + redirect client-side)"

spec_verdict: spec-desatualizada

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/components/layout/Sidebar.tsx"
    purpose: "Item Insights ganha adminOnly: true"
  - id: CHG-002
    kind: code
    artifact: "src/app/api/dashboard/insights/route.ts"
    purpose: "GET passa a bloquear role !== admin com 403"
  - id: CHG-003
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/insights/page.tsx"
    purpose: "Redireciona não-admin pra /app; fetcher lança em resposta não-ok (evita render quebrado com corpo de erro tratado como dado válido)"
  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260723-ADM1-v001.md"
    purpose: "Formaliza que /app/insights é admin-only, alinhando RF-06 da 007 com a spec original da feature 003"
  - id: CHG-005
    kind: test
    artifact: "scripts/test-insights-adminonly.ts (novo)"
    purpose: "Prova estrutural das 3 camadas de restrição (sidebar, API, client)"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Insights sem adminOnly no sidebar

## Summary

A feature 007 (RF-06) adicionou `/app/insights` ao sidebar sem `adminOnly`, tornando-o navegável e acessível a qualquer role (inclusive `auditor`), enquanto a spec original da feature 003 (que criou essa página) sempre tratou insights como recurso do gestor de compliance/admin — inclusive restringindo o endpoint de regeneração manual a `role === admin`.

## Expected Behavior

Não há um RN explícito dizendo "insights é adminOnly", mas o enquadramento consistente da feature 003 (persona única: "Gestor de compliance (admin)", RF-02 restrito a admin) e o padrão do próprio sidebar (item irmão "Configurações" com `adminOnly: true`) sugerem fortemente que essa era a intenção implícita nunca formalizada como RN.

## Actual Behavior

Item "Insights" no sidebar visível e navegável para qualquer role. `GET /api/dashboard/insights` não faz nenhuma checagem de role — dados agregados (departamento/categoria com mais concentração de casos) ficam acessíveis a qualquer usuário autenticado da org, incluindo `auditor`.

## Steps to Reproduce

1. Logar como usuário não-admin (ex.: `auditor` ou gestor comum).
2. Observar o sidebar: item "Insights" está visível.
3. Acessar `/app/insights` ou chamar `GET /api/dashboard/insights` diretamente.
4. **Esperado** (se a intenção implícita da 003 se sustentar): 403 ou item oculto, igual ao padrão de "Configurações".
5. **Observado**: acesso normal, sem nenhum bloqueio.

## Evidence

Leitura de `Sidebar.tsx`, `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md` e `src/app/api/dashboard/insights/route.ts` — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`Sidebar.tsx`), `route-handlers` (`api/dashboard/insights/route.ts`).

## Acceptance Criteria

- Decisão humana: se insights deve ser admin-only (alinhar com feature 003) ou deliberadamente aberto a todos os roles (nesse caso, a spec da 003 precisa de um adendo esclarecendo a mudança de intenção)
- Se admin-only: `adminOnly: true` no item do sidebar E checagem de `role === admin` (ou ao menos bloqueio de `auditor`, seguindo o padrão de `reports`) no `GET /api/dashboard/insights`

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** RF-06 da feature 007 não especificou `adminOnly`; a implementação literal deixou insights aberto a qualquer role.

**Veredito de spec:** `spec-desatualizada` — usuário decidiu restringir a admin, alinhando com a spec original da feature 003. Adendo gerado: `_reversa_sdd/addenda/bug-BUG-20260723-ADM1-v001.md`.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `Sidebar.tsx` | `adminOnly: true` no item Insights |
| CHG-002 | code | `api/dashboard/insights/route.ts` | 403 para não-admin |
| CHG-003 | code | `insights/page.tsx` | redirect client-side + fetcher lança em não-ok |
| CHG-004 | specification | adendo v001 | Formaliza admin-only |
| CHG-005 | test | `scripts/test-insights-adminonly.ts` | Prova das 3 camadas |

**Testes:** verdes. `npx tsc --noEmit` limpo. `eslint` limpo nos arquivos deste change set (a única pendência de lint em `insights/page.tsx` é o `Date.now()` pré-existente, tratado separadamente em `BUG-20260723-DTN1`).

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (feature 007), lente "Conformidade com spec".
- Este é um caso onde o veredito de spec (`/reversa-debugger-fix` etapa 7) é especialmente relevante: pode ser `spec-desatualizada` (a intenção sempre foi admin-only, RF-06 da 007 só esqueceu) ou `spec-gap` (nunca houve RN formal, e a decisão de abrir pra todos os roles é legítima e só precisa ser documentada). Recomenda-se decisão humana explícita antes de codar a correção.
