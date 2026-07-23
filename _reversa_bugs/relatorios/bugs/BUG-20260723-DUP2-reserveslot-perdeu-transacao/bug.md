---
schema_version: 1
id: BUG-20260723-DUP2
display_number: 13
title: reserveReportSlot voltou a ser sequencial (sem transação) — TOCTOU do BUG-20260723-DUP1 reaberto
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

change_risk:
  classification: baixa
  motivos:
    - "Restaura exatamente o código já validado no fix original de BUG-20260723-DUP1 (mesmo padrão runTransaction), não é código novo"
    - "Índices compostos necessários (reports: org_id+dedup_key+gerado_em) confirmados presentes em firestore.indexes.json desde antes desta mudança"
    - "Investigação da causa alegada para a remoção (\"incompatibilidade Vercel\") não encontrou evidência de sustentação; cronologia do incidente aponta para causa alternativa (índice de cases, corrigido em commit separado 82f130b)"
    - "Reversível: git preserva o histórico caso a reintrodução da transação cause algum problema real não previsto em produção"

origin:
  type: inspection
  external_ref: null

area: saas-core
module: route-handlers
feature: reports
labels: [toctou, concurrency, regression]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1 rodagem do teste de regressão original (scripts/test-reports-dedup.ts) após a mudança — 2 documentos criados em 2 chamadas concorrentes, onde antes vinha 1"
  suspected_triggers: ["commit 4239b75 (\"fix: substitui runTransaction por write sequencial no reserveReportSlot\"), motivado por suposta incompatibilidade de runTransaction com Vercel"]

blocking: []

relationships:
  - bug: BUG-20260723-DUP1
    type: regression-of
    state: confirmed
    evidence:
      - "BUG-20260723-DUP1 está travado (DONE.md), fechado com resolution_kind: fixed citando scripts/test-reports-dedup.ts como prova"
      - "O mesmo scripts/test-reports-dedup.ts, rodado contra o código atual (pós-commit 4239b75), FALHA no teste de concorrência: 'esperado exatamente 1 documento criado... veio 2'"

traceability:
  specs:
    - "_reversa_forward/005-relatorios-auto-geracao/roadmap.md#D-02"
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01"
  affected_code:
    - "src/lib/reports/dedup.ts#reserveReportSlot"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "Commit 4239b75 removeu `adminDb.runTransaction(...)` de `reserveReportSlot`, substituindo por: chama `findRecentDuplicateReport` (leitura simples), se não achar, faz `reportRef.set(reportData)` direto — sem nenhuma garantia atômica entre a leitura e a escrita"
      - "Isso reabre exatamente o TOCTOU que o BUG-20260723-DUP1 original documentou e que a transação fechava: 2 chamadas concorrentes podem ambas passar pela checagem 'não achei duplicata' antes de qualquer uma escrever, resultando em 2 documentos"
      - "Comentário do próprio código (dedup.ts, docstring de reserveReportSlot) admite a regressão: 'Usa abordagem sequencial (sem transação)... A janela de corrida residual é de microssegundos, aceitável para o trade-off de evitar complexidade de transação distribuída no serverless' — ou seja, a remoção foi consciente, mas o trade-off não foi levado ao registro do bug nem à decisão humana do veredito de spec"
      - "O DONE.md de BUG-20260723-DUP1 lista 'Testes em scripts/test-reports-dedup.ts' como parte da correção validada, mas rodar esse exato arquivo contra o código atual reproduz a falha — a alegação de teste-passando na closure não é mais verdadeira"
    evidence:
      - ref: "src/lib/reports/dedup.ts (diff do commit 4239b75)"
        observation: "runTransaction removido; findRecentDuplicateReport + reportRef.set() sequenciais, sem atomicidade"
      - ref: "scripts/test-reports-dedup.ts, execução ao vivo contra Firestore emulator (2026-07-23, sessão de inspeção)"
        observation: "teste 'reserveReportSlot: 2 chamadas concorrentes... exatamente 1 cria documento novo' FALHOU: veio 2 documentos, não 1"
    code_refs:
      - {file: "src/lib/reports/dedup.ts", symbol: "reserveReportSlot", commit: "4239b75"}
  reproduction_tests:
    - "scripts/test-reports-dedup.ts (\"reserveReportSlot: 2 chamadas concorrentes...\") — já existia, reproduziu a falha (2 documentos) antes do fix"
  regression_tests:
    - "scripts/test-reports-dedup.ts (5/5 testes, incluindo o de concorrência real via Promise.all)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/reports/dedup.ts#reserveReportSlot"
    purpose: "Restaura adminDb.runTransaction, fechando a janela de corrida entre pré-check e write"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# reserveReportSlot voltou a ser sequencial — TOCTOU reaberto

## Summary

`BUG-20260723-DUP1` foi corrigido introduzindo uma transação Firestore (`reserveReportSlot`) que fechava a corrida entre checagem de duplicata e escrita do relatório. O commit `4239b75` (parte da resposta ao vivo ao incidente `BUG-20260723-IDX1`) removeu essa transação, voltando a um padrão sequencial "checa, depois escreve" sem atomicidade — reabrindo exatamente o defeito que `DUP1` documentou. `DUP1` está travado (`DONE.md`), então este é um bug novo com `regression-of`.

## Expected Behavior

Conforme `roadmap.md#D-02` (na versão vigente após a correção de `DUP1`) e a `Resolution` do próprio `BUG-20260723-DUP1`: acessos concorrentes (multi-aba/multi-usuário) para o mesmo `org_id`+escopo+período não devem criar mais de 1 relatório. Isso era garantido pela transação em `reserveReportSlot`.

## Actual Behavior

`reserveReportSlot` faz uma leitura (`findRecentDuplicateReport`) seguida de uma escrita (`reportRef.set`) sem nenhuma garantia de atomicidade entre as duas. Provado ao vivo: rodando `scripts/test-reports-dedup.ts` (o mesmo teste que validou o fix original) contra o código atual, o teste de concorrência real via `Promise.all` falha — 2 documentos são criados onde deveria vir 1.

## Steps to Reproduce

1. `npm run test:reports-dedup` (requer Firestore emulator rodando, `FIRESTORE_EMULATOR_HOST` configurado).
2. **Esperado**: todos os 5 testes passam, incluindo "2 chamadas concorrentes... exatamente 1 cria documento novo".
3. **Observado**: esse teste específico falha, reportando 2 documentos criados (`deduplicated: false` nas duas chamadas).

## Evidence

Execução ao vivo do teste na sessão de inspeção (2026-07-23), ver `traceability.root_cause.evidence` no front matter. Diff do commit `4239b75` disponível via `git show 4239b75 -- src/lib/reports/dedup.ts`.

## Suspected Area

`route-handlers` (`src/lib/reports/dedup.ts#reserveReportSlot`).

## Acceptance Criteria

- `scripts/test-reports-dedup.ts` volta a passar 100% (5/5), incluindo o teste de concorrência real
- Se a razão real para remover `runTransaction` foi uma incompatibilidade genuína com o ambiente serverless da Vercel (não apenas suspeita), essa razão precisa ser investigada e documentada — pode exigir uma abordagem alternativa (ex.: transação com retry explícito, ou write condicional via `create()` que falha em conflito) em vez de simplesmente remover a garantia atômica

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** commit `4239b75` removeu `runTransaction` de `reserveReportSlot` sob a alegação de "incompatibilidade com Vercel". Investigação não encontrou sustentação para essa alegação — nem documentação de incompatibilidade real, nem evidência na cronologia dos commits do incidente (o índice de `cases` corrigido depois, em `82f130b`, é a causa mais provável do 500 residual observado na época).

**Veredito de spec:** `spec-correta` — a spec sempre pediu reaproveitamento único (RN-01); o código regrediu, a spec não mudou. Nenhum adendo necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/lib/reports/dedup.ts#reserveReportSlot` | Restaura `runTransaction`, fechando o TOCTOU |

**Testes (vermelho → verde):**

```
✗ reserveReportSlot: 2 chamadas concorrentes... → esperado 1, veio 2
```
→ após CHG-001:
```
✓ reserveReportSlot: 2 chamadas concorrentes... exatamente 1 cria documento novo
5 passou(aram), 0 falhou(aram) de 5 teste(s)
```

`npx tsc --noEmit` e `eslint` limpos.

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e janela de `post_fix_observation`. **Atenção**: se depois do deploy houver qualquer erro real relacionado à transação em produção (não apenas suposição), reabrir imediatamente com evidência de log real — a decisão de reintroduzir foi baseada em análise de código e cronologia, não em acesso a logs reais da Vercel do momento do incidente original.

## Agent Notes

- Achado via `/reversa-depth-inspection` (varredura across features 004/005/006), lente "Concorrência e consistência".
- **Atenção para quem for corrigir**: antes de simplesmente reintroduzir `runTransaction`, investigar POR QUE ela foi removida (mensagem do commit sugere "compatibilidade Vercel" — se isso for um problema real e reproduzível, e não uma suposição durante o debug ao vivo do incidente `IDX1`, a correção de `DUP2` precisa lidar com essa restrição real, não apenas desfazer o commit `4239b75`).
- Este achado também expôs uma inconsistência de processo: `BUG-20260723-DUP1` foi encerrado (`DONE.md`) citando um teste como prova, mas o teste não foi re-executado após a mudança subsequente que o quebrou. Vale reforçar, em correções futuras sob incidente ativo, rodar a suíte de testes relevante antes de declarar `DONE`.
