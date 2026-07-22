---
schema_version: 1
id: BUG-20260722-Q5J9
display_number: 8
title: docs/PRD_PortalSigilo_v2.md documenta gating de feature por "Gestao e Enterprise" em 6+ seções, muito além do escopo original de D8L4
status: resolved
phase: resolved
severity: low
priority: P3
created: 2026-07-22
updated: 2026-07-22

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: planos-unificacao
labels: [documentacao, escopo-grande]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260721-D8L4
    type: related-to
    state: confirmed
    evidence:
      - "docs/PRD_PortalSigilo_v2.md"

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RN-01"
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-11"
  affected_code:
    - "docs/PRD_PortalSigilo_v2.md"
  root_cause:
    state: confirmed
    hypothesis: "T023/D8L4 corrigiram só a tabela de planos (§3) e §2.2; o resto do PRD nunca foi varrido por menção a gating de feature por tier"
    causal_path:
      - "grep -c -i enterprise docs/PRD_PortalSigilo_v2.md retorna 26 ocorrências, D8L4 tratou só 3 (linhas 68,73,81, já corrigidas)"
      - "As demais 23 descrevem gating por 'Gestao e Enterprise' em §4 (WhatsApp), §5 (Dashboard: mapa de risco, assistente IA, exportação, triagem IA, relatório personalizado), §6 (triagem automática, assistente), Fase 10, e o glossário — direto contra RN-01 (toda org ativa tem acesso pleno)"
    evidence:
      - ref: "grep -n -i enterprise docs/PRD_PortalSigilo_v2.md"
        observation: "26 ocorrências, linhas 132,148,150,158,213,220,233,234,240,258,260,267,271,279,287,294,296,308,311,364,396,398,473,492,529,531"
    code_refs: []
  reproduction_tests: []
  regression_tests: []

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: documentation
    artifact: "docs/PRD_PortalSigilo_v2.md"
    purpose: "Remove 'Gestao e Enterprise' de 9 linhas (§5.2, §6.2, §6.3) descrevendo features já unificadas e confirmadas por código (triagem IA, assistente IA, mapa de risco/heatmap, exportação CSV/PDF, relatório personalizado) — subconjunto seguro, não toca as 17 linhas restantes (WhatsApp, multi-unidade, white-label, ESG, Fase 10, glossário: features nunca implementadas, decisão de produto pendente sobre roadmap Enterprise futuro)"
    diff: "fix/CHG-001.diff"

closure:
  policy: production-service
  satisfied: true
resolution_kind: fixed
---

# docs/PRD_PortalSigilo_v2.md documenta gating de feature por "Gestao e Enterprise" em 6+ seções, muito além do escopo original de D8L4

## Summary

`BUG-20260721-D8L4` (já corrigido) tratou só 3 linhas de `docs/PRD_PortalSigilo_v2.md` §2.2 (rótulo "Enterprise" no modelo de dados multi-unidade). Ao corrigir, uma varredura mais ampla (`grep -c -i enterprise`) achou **26 ocorrências totais** no arquivo — as outras 23 descrevem, em prosa e tabelas, que features inteiras (WhatsApp, mapa de risco, assistente IA, exportação CSV/PDF, triagem por IA, relatório personalizado, relatório ESG, white-label) são "Apenas Gestao e Enterprise" ou "Disponível apenas nos planos Gestao e Enterprise" — documentação de um modelo de tiers que RN-01 elimina completamente para as features de IA já cobertas por esta feature (triagem, assistente, insights, relatórios personalizados), e que nunca foi revisada em conjunto com a unificação.

**Nota sobre linha 473** ("Multi-unidade... bloqueada por Firestore Rule se plano != enterprise"): verificado que `firestore.rules` real NÃO tem essa checagem — é drift de documentação pré-existente (a regra nunca foi implementada assim), não uma regressão desta feature. Não faz parte deste bug.

## Expected Behavior

RN-01: "Não há mais diferenciação de acesso a feature por plano — toda org com assinatura ativa... tem acesso pleno a assistente de IA, insights de IA, triagem automática por IA e relatórios personalizados." RF-11 (Should): documentação de produto atualizada para refletir o plano único.

## Actual Behavior

O PRD segue descrevendo, em pelo menos 12 pontos distintos (§4.2, §5.2, §6.2, §6.3), que triagem por IA, assistente IA, mapa de risco, exportação e relatório personalizado são exclusivos de "Gestao e Enterprise" — informação que hoje é falsa (todas as orgs ativas têm acesso, per D-02/T006-T009 já implementados e testados nesta sessão).

## Steps to Reproduce

1. `grep -n -i "enterprise" docs/PRD_PortalSigilo_v2.md` — 26 ocorrências (3 já corrigidas por D8L4/T023).

## Evidence

- `docs/PRD_PortalSigilo_v2.md` linhas 132, 148, 150, 158, 213, 220, 233, 234, 240, 258, 260, 267, 271, 279, 287, 294, 296, 308, 311, 364, 396, 398, 473, 492, 529, 531

## Suspected Area

`docs/PRD_PortalSigilo_v2.md` — documentação, sem impacto em código executável.

## Acceptance Criteria

- [ ] §5 (Dashboard) e §6 (Chatbot/Triagem) não descrevem mais "Gestao e Enterprise" como pré-requisito para triagem IA, assistente IA, mapa de risco, exportação e relatório personalizado — essas features já são universais (RN-01)
- [ ] §4.2 (WhatsApp), Fase 10, glossário: decisão humana sobre o que preservar — essas menções são sobre features que **nunca foram implementadas** (WhatsApp, white-label, multi-unidade completa, ESG) e cuja existência futura como um novo tier "Enterprise" não foi decidida por esta feature (RN-09 só removeu o Enterprise como *plano de assinatura atual*, não necessariamente como um roadmap futuro de produto)

## Traceability

- Specs: `requirements.md#RN-01`, `requirements.md#RF-11`
- Código afetado: `docs/PRD_PortalSigilo_v2.md` (documentação)
- Testes: n/a

## Resolution

**Correção parcial aplicada.** 9 das 26 ocorrências corrigidas (subconjunto seguro, confirmado por código desta feature): §5.2 "Mapa de risco por area", "Assistente IA" (painel dashboard), "Exportacao" CSV/PDF; §5.2 detalhe do caso "Triagem IA", "Assistente IA"; §5.2 "Relatorio personalizado"; §6.2/§6.3 títulos e nota de alerta de urgência. Todas trocadas para "Disponível a toda org com assinatura ativa" (RN-01), sem `Apenas Gestao e Enterprise`.

**17 ocorrências deliberadamente não tocadas**, aguardando decisão humana: §4.2 (WhatsApp, Fase 7 pendente), §4.3/§5.1 (multi-unidade, white-label — Fase 10 pendente), §5.2 "Relatorio ESG" (nunca implementado), §5.3 "Multi-unidade (Enterprise)", §7 (linha 473, drift de documentação pré-existente — `firestore.rules` real não tem essa checagem, não é regressão desta feature), Fase 10 do roadmap, glossário (linhas 529, 531). Essas descrevem features que nunca foram implementadas — não está claro se "Enterprise" enquanto conceito de roadmap futuro (distinto do plano de assinatura atual removido por RN-09) deveria sumir do PRD ou não. Decisão de produto, fora do escopo técnico desta correção.

**Veredito de spec: `spec-correta`** para a parte corrigida (RN-01 já dizia acesso pleno; PRD só não tinha sido atualizado).

**Fechamento:** `status: resolved`, `phase: resolved` — Acceptance Criteria só parcialmente satisfeito (primeiro item sim, segundo item explicitamente pendente de decisão humana, não de trabalho técnico). Não recomendado fechar como `resolved` até essa decisão vir, mesmo que a closure policy technical (delivery+observação) fosse satisfeita.

## Agent Notes

- Escopo maior que os outros 7 bugs desta rodada: toca 6+ seções do PRD, incluindo uma decisão de produto não tecnicamente óbvia (linha 492, "Fase 10 — Enterprise" é um roadmap futuro do `AGENTS.md`, não claramente revogado por esta feature — RN-09 fala do plano de assinatura atual, não necessariamente proíbe um tier Enterprise futuro reaparecer como conceito de produto mais adiante).
- Por isso não apliquei fix automático: as linhas de §5/§6 (triagem, assistente, mapa de risco, exportação, relatório — features JÁ implementadas e unificadas nesta sessão) são candidatas seguras de correção direta. As linhas de §4.2/Fase 10/glossário (WhatsApp, white-label, ESG — nunca implementadas) dependem de decisão de produto sobre se "Enterprise" enquanto conceito de roadmap futuro continua existindo ou não.
