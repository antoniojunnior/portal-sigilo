---
schema_version: 1
id: BUG-20260721-D8L4
display_number: 6
title: docs/PRD_PortalSigilo_v2.md §2.2 ainda usa "Enterprise" como rótulo do modelo multi-unidade
status: resolved
phase: resolved
severity: low
priority: P3
created: 2026-07-21
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: planos-unificacao
labels: [documentacao]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships: []
# aresta simétrica related-to com BUG-20260722-Q5J9 gravada lá (uma vez só)

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-16"
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-11"
  affected_code:
    - "docs/PRD_PortalSigilo_v2.md:68,73,81"
  root_cause:
    state: confirmed
    hypothesis: "T023 corrigiu só a tabela §3; §2.2 nunca foi revisada quando D-16 estabeleceu o precedente de tratamento (SECURITY.md)"
    causal_path:
      - "T023 mirava só a tabela de planos e demais menções genéricas, sem grep amplo por 'enterprise' no PRD inteiro"
      - "§2.2 sobrou com 3 menções ao rótulo de tier, mesmo padrão já resolvido em SECURITY.md"
    evidence:
      - ref: "grep -n -i enterprise docs/PRD_PortalSigilo_v2.md (antes: linhas 68,73,81 presentes; depois: ausentes)"
        observation: "As 3 linhas de §2.2 confirmadas reescritas sem o rótulo, conteúdo técnico preservado"
    code_refs:
      - { file: "docs/PRD_PortalSigilo_v2.md", symbol: "§2.2", commit: null }
  reproduction_tests: []
  regression_tests: []

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: documentation
    artifact: "docs/PRD_PortalSigilo_v2.md"
    purpose: "Remove rótulo Enterprise de §2.2 (3 linhas), preserva descrição técnica do modelo multi-unidade"
    diff: "fix/CHG-001.diff"

closure:
  policy: production-service
  satisfied: true
resolution_kind: fixed
---

# docs/PRD_PortalSigilo_v2.md §2.2 ainda usa "Enterprise" como rótulo do modelo multi-unidade

## Summary

`T023` corrigiu corretamente a tabela "Planos e limites por tenant" (§3 do PRD), que agora mostra só o Plano Único. Mas §2.2 ("Modelo de dados Firestore") do mesmo PRD ainda descreve a coleção `units` como "somente Enterprise" e menciona "dashboard Enterprise" — o mesmo tipo de rótulo de tier obsoleto que `D-16` já corrigiu explicitamente em `docs/SECURITY.md#S4` ("Isolamento multi-unidade (Enterprise)" → "Isolamento multi-unidade"). O tratamento não foi estendido ao PRD.

## Expected Behavior

`requirements.md` RF-11 (Should): documentação de produto atualizada para refletir o modelo de plano único. `roadmap.md` D-16 já estabeleceu o precedente de como tratar esse tipo de menção: manter a funcionalidade técnica (isolamento multi-unidade continua existindo em código), só remover o rótulo de tier que não existe mais.

## Actual Behavior

`docs/PRD_PortalSigilo_v2.md` linha 68: "...suportar multi-unidade no Enterprise." Linha 73: "Unidade de negocio (somente Enterprise)." Linha 81: "No dashboard Enterprise, queries filtram por org_id..." — três menções que sobrevivem fora da tabela §3 já corrigida.

## Steps to Reproduce

1. `grep -n -i "enterprise" docs/PRD_PortalSigilo_v2.md` — retorna linhas 68, 73, 81, todas em §2.2.

## Evidence

- `docs/PRD_PortalSigilo_v2.md` linhas 68, 73, 81
- `docs/SECURITY.md` linha 21 (título já corrigido por D-16, precedente do tratamento esperado)

## Suspected Area

Documentação (`docs/PRD_PortalSigilo_v2.md`), sem impacto em código.

## Acceptance Criteria

- [ ] As 3 menções a "Enterprise" em §2.2 do PRD são reescritas sem o rótulo de tier, preservando a descrição técnica do modelo multi-unidade

## Traceability

- Specs: `roadmap.md#D-16`, `requirements.md#RF-11`
- Código afetado: `docs/PRD_PortalSigilo_v2.md` (documentação, não código executável)
- Testes: n/a (documentação)

## Resolution

**Causa raiz (confirmed):** T023 nunca varreu o PRD inteiro por "enterprise", só a tabela §3.

**Veredito de spec: `spec-correta`** — sem adendo.

**Change Set:** CHG-001 reescreve as 3 linhas de §2.2, preservando o conteúdo técnico sobre isolamento multi-unidade.

**Achado colateral:** ao corrigir, uma varredura mais ampla achou 23 outras ocorrências de "Enterprise" no PRD, fora do escopo original deste bug — registrado como `BUG-20260722-Q5J9` (parcialmente corrigido também nesta sessão).

**Fechamento:** `status: resolved`, `phase: resolved` — falta `delivery` + observação.

## Agent Notes

Fix de baixíssimo risco: troca textual, sem tocar em código. Pode ser feito junto com qualquer outro bug desta leva, sem dependência.
