---
schema_version: 1
id: BUG-20260723-EBD1
display_number: 21
title: ErrorBoundary do DashboardLayout não cobre Sidebar/SuspensoBanner/BottomNav — RF-05 parcialmente atendido
status: active
phase: delivering

change_risk:
  classification: baixa
  motivos:
    - "Cada componente de chrome ganha seu próprio ErrorBoundary com fallback null — mudança isolada, reversível, sem tocar lógica de negócio"
    - "Ajuste em ErrorBoundary.tsx (fallback !== undefined) é backward-compatible: quem já usava fallback truthy continua funcionando igual, só null passa a ser tratado corretamente"
severity: high
priority: P1
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [error-handling, resilience]

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
    - "_reversa_forward/007-limpeza-frontend/requirements.md#RF-05"
  affected_code:
    - "src/components/layout/DashboardLayout.tsx"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "RF-05 pede: 'ErrorBoundary wrapper protegendo todas as páginas do dashboard' e o critério de aceite diz 'DashboardLayout renderiza children dentro de <ErrorBoundary>'"
      - "A implementação literal fez exatamente isso: `<ErrorBoundary>{children}</ErrorBoundary>` — mas `Sidebar`, `SuspensoBanner` e `BottomNav` são renderizados como IRMÃOS do ErrorBoundary, fora dele, dentro do mesmo `DashboardLayout`"
      - "Confirmado que não existe nenhum ErrorBoundary em nível superior: `src/app/(dashboard)/layout.tsx` só tem `<AuthProvider>{children}</AuthProvider>`, sem ErrorBoundary; buscando `ErrorBoundary` em todo `src/app/`, só aparece dentro de `page.tsx` da home (proteção adicional de widgets específicos) e dentro do próprio `DashboardLayout.tsx`"
      - "Consequência: uma exceção não tratada em Sidebar, SuspensoBanner ou BottomNav (componentes renderizados em TODA página do dashboard, não só uma) ainda derruba o dashboard inteiro sem fallback — exatamente o cenário que RF-05 diz que deveria ser evitado ('Entao o dashboard exibe fallback em vez de tela branca/crash')"
      - "Risco concreto, não hipotético: Sidebar.tsx e BottomNav.tsx foram modificados na mesma sessão anterior (correções BUG-20260723-CLP1/ACT1/MOB1), aumentando a superfície de estado/lógica condicional exatamente nos componentes que ficaram de fora da proteção"
    evidence:
      - ref: "src/components/layout/DashboardLayout.tsx"
        observation: "`<Sidebar />`, `<SuspensoBanner />` e `<BottomNav />` renderizados fora do `<ErrorBoundary>`, que só envolve `{children}`"
      - ref: "src/app/(dashboard)/layout.tsx"
        observation: "layout superior não tem ErrorBoundary, só AuthProvider"
      - ref: "grep -rn \"ErrorBoundary\" src/app/"
        observation: "único uso fora do DashboardLayout é dentro de `(protected)/page.tsx` (home), protegendo só widgets específicos daquela página, não o chrome"
    code_refs:
      - {file: "src/components/layout/DashboardLayout.tsx", symbol: "DashboardLayout", commit: "d7ae0c0"}
  reproduction_tests:
    - "scripts/test-dashboard-errorboundary.ts (\"Sidebar/SuspensoBanner/BottomNav tem um <ErrorBoundary antes...\")"
  regression_tests:
    - "scripts/test-dashboard-errorboundary.ts (\"ErrorBoundary usa 'fallback !== undefined'...\")"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/components/layout/DashboardLayout.tsx"
    purpose: "Sidebar, SuspensoBanner e BottomNav passam a ter ErrorBoundary próprio (fallback null)"
  - id: CHG-002
    kind: code
    artifact: "src/components/ui/ErrorBoundary.tsx"
    purpose: "Checagem de fallback muda de truthiness para !== undefined, permitindo fallback={null} funcionar como pretendido"
  - id: CHG-003
    kind: test
    artifact: "scripts/test-dashboard-errorboundary.ts (novo)"
    purpose: "Prova estrutural de que os 3 componentes estão protegidos + regressão do fix em ErrorBoundary"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# ErrorBoundary não cobre o chrome compartilhado do dashboard

## Summary

A feature 007 adicionou `ErrorBoundary` ao `DashboardLayout`, mas envolveu só `{children}` (o conteúdo específico de cada página). `Sidebar`, `SuspensoBanner` e `BottomNav` — renderizados em toda página do dashboard — ficaram fora da proteção, e não existe nenhum ErrorBoundary em nível superior que os cubra.

## Expected Behavior

`requirements.md#RF-05`: "Adicionar `ErrorBoundary` wrapper no `DashboardLayout.tsx` protegendo todas as páginas do dashboard". Cenário de aceite: "Dado que uma página protegida lança exceção não tratada... Então o dashboard exibe fallback em vez de tela branca/crash". Isso deveria valer pra qualquer componente renderizado dentro do dashboard, não só o conteúdo de página.

## Actual Behavior

`ErrorBoundary` só envolve `{children}`. Uma exceção em `Sidebar`, `SuspensoBanner` ou `BottomNav` não é capturada por nenhum boundary — o dashboard inteiro quebra (tela branca/crash), o comportamento que a feature deveria ter eliminado.

## Steps to Reproduce

1. Forçar uma exceção de render dentro de `SuspensoBanner`, `Sidebar` ou `BottomNav` (ex.: acessar propriedade de `undefined` em algum estado edge-case).
2. **Esperado**: dashboard exibe fallback de erro, resto da aplicação continua utilizável.
3. **Observado**: dashboard inteiro quebra, sem fallback (comportamento pré-feature-007 para esses componentes específicos).

## Evidence

Leitura de `DashboardLayout.tsx`, `src/app/(dashboard)/layout.tsx` e busca global por `ErrorBoundary` em `src/app/` — ver `traceability.root_cause`.

## Suspected Area

`client-ui` (`DashboardLayout.tsx`).

## Acceptance Criteria

- `Sidebar`, `SuspensoBanner` e `BottomNav` passam a estar dentro de algum `ErrorBoundary` (seja um boundary próprio para cada um, seja um boundary externo envolvendo todo o layout, incluindo `{children}`)
- Uma exceção forçada em qualquer um deles resulta em fallback, não em crash total

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `ErrorBoundary` no `DashboardLayout` só envolvia `{children}`; `Sidebar`/`SuspensoBanner`/`BottomNav` ficavam expostos, sem nenhum boundary superior.

**Achado adjacente durante o fix:** `ErrorBoundary.tsx` usava checagem de truthiness (`if (this.props.fallback)`), o que faria `fallback={null}` (o valor que este fix precisa usar) cair no card de erro padrão em vez de esconder silenciosamente — corrigido no mesmo change set (`!== undefined`), já que era pré-requisito técnico direto para a correção funcionar como pretendido.

**Veredito de spec:** `spec-correta` (RF-05 da feature 007). Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `DashboardLayout.tsx` | 3 componentes de chrome ganham `ErrorBoundary` próprio |
| CHG-002 | code | `ErrorBoundary.tsx` | `fallback !== undefined` em vez de truthiness |
| CHG-003 | test | `scripts/test-dashboard-errorboundary.ts` (novo) | Prova estrutural + regressão |

**Testes:** verdes (ver saída acima). `npx tsc --noEmit` e `eslint` limpos.

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (feature 007), lente "Conformidade com spec".
- Correção precisa de cuidado: envolver TODO o `DashboardLayout` num único `ErrorBoundary` externo mudaria o comportamento de fallback (perderia o Sidebar/BottomNav também durante o fallback, o que pode ser pior para navegação). Alternativa mais cirúrgica: um `ErrorBoundary` dedicado por componente de chrome (`Sidebar`, `SuspensoBanner`, `BottomNav`), cada um com fallback mínimo, preservando a navegação dos outros mesmo se um quebrar.
