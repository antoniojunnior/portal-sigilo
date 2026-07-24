---
schema_version: 1
id: BUG-20260722-CAT1
display_number: 1
title: 6 sites de leitura referenciam "triagem_ia.categoria", campo que nunca existiu — categoria_legal é o campo real
status: resolved
phase: resolved
severity: high
priority: P1
created: 2026-07-22
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: lib-shared
feature: triagem-ia
labels: [dado-incorreto, categorizacao]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "6/6"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs: []
  affected_code:
    - "src/lib/triagem.ts"
    - "src/app/api/assistant/route.ts"
    - "src/app/api/dashboard/insights/regenerate/route.ts"
    - "src/app/api/reports/generate/route.ts"
    - "src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx"
    - "functions/src/scheduledReports.ts"
    - "functions/src/aiInsights.ts"
  root_cause:
    state: confirmed
    hypothesis: "TriagemResult (src/lib/triagem.ts) declara o campo `categoria_legal`, nunca `categoria`. O único ponto de escrita de `case.triagem_ia` (triagem.ts:169, `{...triagem, gerado_em}`) nunca inclui a chave `categoria`. Todo `c.triagem_ia?.categoria` no código é sempre `undefined`, caindo no fallback `?? c.categoria` (texto livre do denunciante, não a categoria legal triada por IA) ou `?? 'outro'`."
    causal_path:
      - "triagem.ts define TriagemResult com categoria_legal (não categoria)"
      - "triagem.ts:169 grava case.triagem_ia = {...triagem, gerado_em} — sem chave categoria"
      - "6 sites de leitura em 4 features distintas (assistant, insights, reports, UI de caso) leem triagem_ia?.categoria, sempre undefined"
      - "Toda agregação 'por categoria' (relatórios, insights, resumo do assistente) usa a categoria bruta do denunciante ou 'outro', nunca a categoria_legal triada"
      - "Página de detalhe do caso (casos/[caseId]/page.tsx:467) também não mostra o campo Categoria (condicional falso sempre)"
    evidence:
      - ref: "grep -rn 'triagem_ia?.categoria' src/ functions/src/"
        observation: "6 ocorrências, nenhuma correspondendo a um campo real de TriagemResult"
    code_refs:
      - { file: "src/lib/triagem.ts", symbol: "TriagemResult, categoria_legal, getCategoriaLegal", commit: null }
  reproduction_tests: []
  regression_tests:
    - "scripts/test-reports-categoria.ts (getCategoriaLegal: presente/fallback/fallback-final)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/triagem.ts"
    purpose: "Adiciona getCategoriaLegal(caseData) centralizando a leitura correta"
    diff: null
  - id: CHG-002
    kind: code
    artifact: "src/app/api/assistant/route.ts, src/app/api/dashboard/insights/regenerate/route.ts, src/app/api/reports/generate/route.ts"
    purpose: "Usam getCategoriaLegal em vez de triagem_ia?.categoria"
    diff: null
  - id: CHG-003
    kind: code
    artifact: "functions/src/aiInsights.ts, functions/src/scheduledReports.ts"
    purpose: "Corrige inline (runtime separado, não compartilha import com src/): triagem_ia?.categoria_legal ?? categoria ?? 'outro'"
    diff: null
  - id: CHG-004
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx"
    purpose: "Corrige a condicional que nunca mostrava 'Categoria' (lia categoria_legal, tipo compartilhado TriagemIA dizia categoria)"
    diff: null
  - id: CHG-005
    kind: code
    artifact: "src/lib/types/index.ts"
    purpose: "Corrige o tipo compartilhado TriagemIA.categoria → categoria_legal — achado durante verificação desta sessão (typecheck acusou TS2339 após corrigir CHG-004, revelando que o próprio tipo compartilhado tinha o nome errado, mesma causa raiz)"
    diff: null
  - id: CHG-006
    kind: test
    artifact: "scripts/test-reports-categoria.ts"
    purpose: "Teste de regressão de getCategoriaLegal (4 casos: presente, sem triagem_ia, sem categoria_legal, sem nada)"
    diff: null

closure:
  policy: production-service
  satisfied: true
  delivery:
    kind: commit
    ref: "36a9afe"
    code_commit: "eeda528"
    delivered_at: "2026-07-23"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-23"
    closed_at: "2026-07-23"
    window: "waived — usuário decidiu promover a resolved tratando a entrega já confirmada (push origin/main) como suficiente, sem aguardar janela de observação adicional. Decisão registrada em 2026-07-23 via /reversa-debugger-graph."
    status: "closed"
resolution_kind: fixed
---

# 6 sites de leitura referenciam "triagem_ia.categoria", campo inexistente

## Summary

`TriagemResult` (`src/lib/triagem.ts`) declara o campo `categoria_legal` (não `categoria`). O único ponto de escrita de `case.triagem_ia` nunca inclui a chave `categoria`. Seis pontos de leitura em quatro áreas do produto (assistente IA, insights do dashboard, relatórios executivos, página de detalhe do caso) leem `triagem_ia?.categoria`, sempre `undefined`, caindo em fallback pra texto livre do denunciante ou `"outro"`/`"não classificado"`.

## Expected Behavior

Toda agregação "por categoria" (relatórios executivos, insights de IA, resumo do assistente, detalhe do caso) deveria refletir a `categoria_legal` triada por IA — a categorização confiável, mapeada às leis aplicáveis (`lei_14457`, `nr1`, `lei_14611`, etc.), não o texto livre digitado pelo denunciante no formulário inicial.

## Actual Behavior

Todo `c.triagem_ia?.categoria` é `undefined`. Relatórios e insights agregam por `c.categoria` (texto livre do denunciante) ou `"outro"`. A página de detalhe do caso nunca mostra o campo "Categoria" (condicional sempre falso). O resumo do assistente IA descreve a categoria como "não classificado" mesmo quando a triagem por IA já rodou e classificou corretamente.

## Steps to Reproduce

1. Ler `src/lib/triagem.ts`: `TriagemResult.categoria_legal`, sem campo `categoria`.
2. Ler `src/lib/triagem.ts:169`: `triagem_ia: {...triagem, gerado_em}` — confirma que `categoria` nunca é gravado.
3. `grep -rn "triagem_ia?.categoria" src/ functions/src/` → 6 ocorrências.

## Evidence

- `src/lib/triagem.ts` (definição de `TriagemResult` e ponto de escrita único de `triagem_ia`)
- `src/app/api/assistant/route.ts:92`, `dashboard/insights/regenerate/route.ts:65`, `reports/generate/route.ts:69`, `casos/[caseId]/page.tsx:467,470`, `functions/src/scheduledReports.ts:57`, `functions/src/aiInsights.ts:50`

## Suspected Area

`src/lib/triagem.ts` e os 6 sites de leitura listados acima.

## Acceptance Criteria

- [x] Todos os 6 sites de leitura passam a usar `getCategoriaLegal`/`categoria_legal` centralizado
- [x] Relatórios/insights existentes que já foram gerados com a categoria errada não precisam ser regenerados retroativamente (fora de escopo — dado histórico, não corrompido, só mal-lido)
- [x] Teste de regressão cobre `getCategoriaLegal`, provando que a categoria correta aparece

## Traceability

- Código afetado: ver `affected_code` no front matter (6 arquivos)
- Bloqueia: `_reversa_forward/004-relatorios-analiticos-pdf-nr1` (relatórios "por categoria" precisam ler o campo certo pra ter valor real)

## Resolution

**Causa raiz (confirmed):** `TriagemResult` só tem `categoria_legal`; 6 sites liam `triagem_ia?.categoria` (sempre `undefined`). Achado adicional durante verificação desta sessão: o TIPO compartilhado `TriagemIA` (`src/lib/types/index.ts`) também declarava o campo errado (`categoria` em vez de `categoria_legal`) — mesma causa raiz, manifestada também no nível de tipos, não só em runtime. `npx tsc --noEmit` acusou isso (TS2339) depois de corrigir `casos/[caseId]/page.tsx`, confirmando que o tipo em si precisava da mesma correção.

**Veredito de spec: `spec-correta`** — não havia spec formal, mas o comportamento correto (agregar pela categoria triada por IA) já era a intenção óbvia do sistema (a IA de triagem existe justamente pra isso). Sem adendo.

**Change Set:** 6 itens — `getCategoriaLegal` centralizado em `triagem.ts` (CHG-001), 3 sites em `src/` usando a função (CHG-002), 2 sites em `functions/src/` corrigidos inline por causa da separação de runtime (CHG-003), página de detalhe de caso corrigida (CHG-004), tipo compartilhado `TriagemIA` corrigido (CHG-005, achado nesta sessão), teste de regressão (CHG-006).

**Testes:**
```
🧪 Testes: getCategoriaLegal
  ✓ com categoria_legal presente retorna categoria_legal
  ✓ sem triagem_ia, fallback para c.categoria
  ✓ com triagem_ia mas sem categoria_legal, fallback para c.categoria
  ✓ sem triagem_ia e sem categoria, fallback para 'outro'
✅ Todos os testes de getCategoriaLegal passaram!
```
`npx tsc --noEmit` (projeto + functions): limpo, `EXIT:0` nos dois.

**Fechamento:** `status: resolved`, `phase: resolved` — entregue via commit `eeda528` (código) / `36a9afe` (docs), push `560a90f..36a9afe` para `origin/main` em 2026-07-23. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente. `DONE.md` já existia (criado junto do commit `79425a8`, feature 006); front matter agora reconciliado com a trava.

## Agent Notes

- Achado durante levantamento de contexto pra feature 004 (relatórios analíticos), não durante uma inspeção dedicada — registrado direto por já ter causa raiz confirmed via leitura de código.
- Corrigido como parte da feature 004 (decisão do `/reversa-clarify` daquela feature: embutir no `actions.md` em vez de ciclo separado).
- CHG-005 (tipo `TriagemIA`) foi um achado DURANTE a verificação de qualidade desta sessão (não estava no plano original de 6 sites) — o typecheck revelou que o tipo compartilhado tinha o mesmo nome de campo errado.
