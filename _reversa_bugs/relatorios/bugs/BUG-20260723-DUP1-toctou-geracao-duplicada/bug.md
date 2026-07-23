---
schema_version: 1
id: BUG-20260723-DUP1
display_number: 3
title: Sem dedupe no servidor — acessos concorrentes (multi-aba/multi-usuário) podem gerar relatórios duplicados para o mesmo período
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: route-handlers
feature: reports
labels: [toctou, concurrency, cost]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2 (2 chamadas concorrentes, 2 documentos criados no padrão antigo, contra Firestore emulator real)"
  suspected_triggers: ["duas abas/sessões acessando /app/relatorios quase simultaneamente, antes da primeira geração completar"]

blocking: []

relationships:
  - bug: BUG-20260722-TCT1
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_forward/005-relatorios-auto-geracao/roadmap.md#D-02"
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01"
  affected_code:
    - "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:183-201 (useEffect de mount, decisão de reaproveitar vs gerar)"
    - "src/app/api/reports/generate/route.ts:79-262 (POST, sem checagem de relatório recente antes de criar)"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "D-02 (roadmap.md) decide calcular o reaproveitamento 100% no client, comparando o `GET` já carregado — alternativa 'checar reaproveitamento no servidor' foi descartada explicitamente"
      - "page.tsx:183-201: o mount faz GET, decide localmente (sem lock) que não há relatório recente, e dispara POST"
      - "route.ts POST (linhas 110-240): cria incondicionalmente um novo `reportRef = adminDb.collection('reports').doc()` e grava — não há nenhuma query/transação que verifique 'já existe um relatório com esses filtros nas últimas 24h' no servidor antes de criar"
      - "Consequência: se duas sessões (duas abas do mesmo usuário, ou dois gestores da mesma org) acessam /app/relatorios quase ao mesmo tempo, ambas fazem GET (nenhuma vê o relatório da outra ainda, pois nenhuma foi gravada), ambas decidem 'não há recente', ambas disparam POST — dois relatórios idênticos (mesmo período/tipo) são criados, dobrando o custo de chamada ao Claude e duplicando entradas de auditoria (`report_generated`)"
    evidence:
      - ref: "_reversa_forward/005-relatorios-auto-geracao/roadmap.md#D-02"
        observation: "decisão explícita de reaproveitamento client-side, com 'checar reaproveitamento no servidor' listado como alternativa descartada — a decisão não registra ou mitiga o race condition entre múltiplas sessões concorrentes"
      - ref: "src/app/api/reports/generate/route.ts:110-240"
        observation: "nenhuma query condicional (ex.: `where('gerado_em', '>=', ...)` seguida de checagem) nem transação Firestore antes do `reportRef.set()`"
      - ref: "_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-TCT1-toctou-rate-limit"
        observation: "mesma classe de defeito (TOCTOU entre checagem client/servidor e ação) já confirmada e registrada em outro contexto do mesmo projeto — reforça que é um padrão de risco recorrente, não um caso isolado"
    code_refs:
      - {file: "src/app/api/reports/generate/route.ts", symbol: "POST", commit: null}
      - {file: "src/app/(dashboard)/app/(protected)/relatorios/page.tsx", symbol: "useEffect (mount auto-generate)", commit: null}
  reproduction_tests:
    - "verificação ad-hoc: 2 chamadas concorrentes com create() incondicional (padrão antigo) → 2 documentos criados no Firestore emulator real"
  regression_tests:
    - "scripts/test-reports-dedup.ts (\"reserveReportSlot: 2 chamadas concorrentes... exatamente 1 cria documento novo\")"
    - "scripts/test-reports-dedup.ts (\"reserveReportSlot: chamada subsequente... também reaproveita o slot\")"
    - "scripts/test-reports-dedup.ts (buildReportDedupKey: ordem de array e diferenciação de escopo)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/reports/dedup.ts (novo)"
    purpose: "buildReportDedupKey, findRecentDuplicateReport (pré-check barato) e reserveReportSlot (transação que fecha a corrida)"
  - id: CHG-002
    kind: code
    artifact: "src/app/api/reports/generate/route.ts"
    purpose: "POST usa o pré-check antes do Claude e reserveReportSlot no write final, em vez de reportRef.set() incondicional"
  - id: CHG-003
    kind: migration
    artifact: "firestore.indexes.json"
    purpose: "Índice composto novo (org_id, dedup_key, gerado_em) exigido pelas queries de dedupe — requer 'firebase deploy --only firestore:indexes' antes de produção"
  - id: CHG-004
    kind: test
    artifact: "scripts/test-reports-dedup.ts (novo), package.json (script test:reports-dedup)"
    purpose: "5 testes contra Firestore emulator real, incluindo concorrência de verdade via Promise.all"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed

change_risk:
  classification: média
  motivos:
    - "Exige deploy de índice composto novo no Firestore antes de funcionar em produção — se esquecido, a query falha em runtime (não silenciosamente; erro visível nos logs do Route Handler)"
    - "Transação Firestore (reserveReportSlot) muda o caminho de escrita do relatório — testado ao vivo contra emulador com concorrência real, mas nunca rodou contra produção"
    - "Reversível: reverter para create() incondicional é uma troca de poucas linhas, sem migração de dados a desfazer (campo dedup_key novo é aditivo, não quebra documentos antigos sem ele)"
---

# TOCTOU entre checagem client-side e geração — relatórios duplicados em acesso concorrente

## Summary

A decisão de design `D-02` (feature 005) calcula "já existe relatório recente?" inteiramente no client, comparando o `GET` já carregado, e dispara `POST` se não encontrar. O servidor não faz nenhuma checagem própria antes de criar um novo relatório. Em acesso concorrente (duas abas, ou dois usuários da mesma org acessando a rota quase ao mesmo tempo), ambas as sessões podem decidir "gerar" antes de qualquer uma delas ver o resultado da outra, criando relatórios duplicados para o mesmo período.

## Expected Behavior

`RN-01` pede reaproveitamento "se existir relatório... gerado nas últimas 24h" — a intenção é ter no máximo um relatório default recente por org. O texto não é explícito sobre concorrência, mas o objetivo (evitar geração redundante) é violado quando dois acessos simultâneos resultam em duas gerações.

## Actual Behavior

Nada no `POST /api/reports/generate` impede a criação de um segundo relatório idêntico (mesmo `org_id`, `periodo`, `tipo`) enquanto o primeiro ainda está sendo processado por outra sessão. A checagem de "já existe" só acontece no client, contra um snapshot de dados que pode estar desatualizado no momento exato da decisão concorrente.

## Steps to Reproduce

1. Em uma org sem relatório recente (>24h ou nenhum ainda), abra `/app/relatorios` em duas abas (ou duas sessões de usuários da mesma org) o mais simultaneamente possível, antes que a primeira geração automática complete.
2. **Esperado**: apenas um relatório é criado para o período/tipo default.
3. **Observado (esperado por análise estática, não executado ainda)**: ambas as abas completam seus respectivos `GET` antes de qualquer `POST` retornar, ambas decidem "gerar", resultando em 2 documentos em `reports` para o mesmo período/tipo/org.

## Evidence

Ver `traceability.root_cause.evidence` — achado por análise estática de `roadmap.md#D-02` e `route.ts`, sem execução dinâmica ainda. Bug relacionado (`BUG-20260722-TCT1`, mesma classe TOCTOU, contexto `insights-ia-dashboard`) citado como precedente de padrão de risco no projeto.

## Suspected Area

`route-handlers` (`src/app/api/reports/generate/route.ts`, falta de dedupe/transação no `POST`), com gatilho vindo de `client-ui` (`page.tsx`, decisão de disparo sem lock).

## Acceptance Criteria

- `POST /api/reports/generate` passa a verificar no servidor (query ou transação) se já existe relatório compatível recente antes de criar um novo, OU
- Alguma forma de lock/idempotency key evita duas gerações simultâneas para o mesmo `org_id`+`periodo`+`tipo`

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `POST /api/reports/generate` criava o documento incondicionalmente (`reportRef.set()`), sem nenhuma query/transação prévia checando se outra requisição concorrente já tinha gravado um relatório equivalente. Confirmado ao vivo: 2 chamadas concorrentes com o padrão antigo (`create()` incondicional) resultaram em **2 documentos** no Firestore emulator real.

**Veredito de spec:** `spec-correta` — `RN-01` já pressupõe "no máximo um relatório default recente"; `D-02` (roadmap) só não tinha considerado o caso multi-cliente concorrente. Nenhum adendo necessário — a correção é de implementação, não de intenção.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/lib/reports/dedup.ts` (novo) | `buildReportDedupKey`, `findRecentDuplicateReport`, `reserveReportSlot` (transação) |
| CHG-002 | code | `route.ts` | Usa pré-check + transação em vez de write incondicional |
| CHG-003 | migration | `firestore.indexes.json` | Índice composto novo `(org_id, dedup_key, gerado_em)` |
| CHG-004 | test | `scripts/test-reports-dedup.ts` (novo) | 5 testes reais contra emulador, incluindo concorrência via `Promise.all` |

**Testes (vermelho → verde, com prova ao vivo):**

```
# Comportamento ANTIGO (verificação ad-hoc, descartada após uso):
Documentos criados por 2 chamadas concorrentes (sem dedupe): 2

# Comportamento NOVO (scripts/test-reports-dedup.ts):
✓ reserveReportSlot: 2 chamadas concorrentes... exatamente 1 cria documento novo
✓ reserveReportSlot: chamada subsequente... também reaproveita o slot já reservado
5 passou(aram), 0 falhou(aram) de 5 teste(s)
```

`npx tsc --noEmit` e `eslint` limpos em todos os arquivos tocados.

**Pendência de infraestrutura:** o índice composto novo em `firestore.indexes.json` precisa de `firebase deploy --only firestore:indexes` antes de valer em produção — a query falharia em runtime sem ele. Esta ação de infraestrutura NÃO foi executada por este fix (fora do escopo de uma correção de código, requer autorização/deploy separados).

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` (deploy do índice + push/merge) e a janela de `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (varredura `varredura-01-pos-coding-005`), lente "Concorrência e consistência", logo após `/reversa-coding` da feature 005.
- A relação `related-to` com `BUG-20260722-TCT1` fica em estado `proposed` — não confirmada como duplicata, apenas sinalizada como mesma classe de defeito para contexto de quem for corrigir.
- Severidade classificada como `medium` (custo de API duplicado + ruído de auditoria), não `high`, porque não há corrupção de dado nem vazamento — é redundância operacional. Reavaliar se o volume de acesso concorrente real for maior do que o suposto aqui.
- Nenhuma correção foi aplicada por este achado.
