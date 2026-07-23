# Pente-fino: features 004/005 (relatórios) pós-incidente de produção

> Contexto: `relatorios`
> Varredura: `varredura-02-pos-incidente-producao`
> Data: 2026-07-23
> Gatilho: usuário pediu pente-fino nas features 004, 005 e 006 após uma sequência de commits de correção ao vivo em resposta ao incidente `BUG-20260723-IDX1` (500 em produção)

## 1. Mapa da feature

### Specs
- `_reversa_forward/005-relatorios-auto-geracao/requirements.md` e `roadmap.md` (D-01 a D-09)
- `_reversa_sdd/addenda/005-relatorios-auto-geracao.md`

### Código (estado atual, pós 6 commits de correção ao vivo desde o último push desta sessão)
- `src/app/api/reports/generate/route.ts` — POST e GET, ambos agora com `try/catch`
- `src/lib/reports/dedup.ts` — `reserveReportSlot` **perdeu a transação** (commit `4239b75`)
- `src/app/api/reports/diagnostic/route.ts` — **novo endpoint, criado durante o debug ao vivo, nunca removido** (commit `2937e14`)
- `firestore.indexes.json` — índices `reports(org_id, gerado_em)` e `cases(org_id, created_at ASC)` restaurados/adicionados (commits `73241bb`, `82f130b`)

### Testes
- `scripts/test-reports-auto-generate.ts` (16 testes) — ainda passa 100%
- `scripts/test-reports-error-messages.ts` (3 testes) — ainda passa 100%
- `scripts/test-reports-dedup.ts` (5 testes) — **1 falha** (concorrência), confirmando a regressão

### Bugs existentes da feature
`BUG-20260723-SCP1` (fixed, intacto), `BUG-20260723-PSU1` (fixed, intacto), `BUG-20260723-DUP1` (fixed conforme `DONE.md`, mas **o código que ele corrigiu foi revertido depois**), `BUG-20260723-IDX1` (fechado com `DONE.md`, causa raiz e correção documentadas no próprio `DONE.md`).

## 2. Achados por lente

```yaml
- finding_id: F-CONCORRENCIA-01
  lens: "Concorrência e consistência"
  summary: "reserveReportSlot perdeu a transação Firestore que fechava o TOCTOU do BUG-20260723-DUP1 — o teste de regressão original volta a falhar"
  confidence: alta
  evidence:
    - "src/lib/reports/dedup.ts (diff do commit 4239b75)"
    - "execução ao vivo de scripts/test-reports-dedup.ts contra Firestore emulator: 2 documentos criados em 2 chamadas concorrentes"
  suspected_severity: medium
  signals: [operational-risk, intermittency]
  promoted_to: BUG-20260723-DUP2

- finding_id: F-SEGURANCA-01
  lens: "Segurança/autorização (condicional, ativada por sinal do histórico git)"
  summary: "Endpoint de diagnóstico criado durante o incidente (/api/reports/diagnostic) nunca foi removido; sem checagem de role, vaza org_id/role/plano e stack trace completo pra qualquer usuário autenticado"
  confidence: alta
  evidence:
    - "src/app/api/reports/diagnostic/route.ts:9-13 (sem checagem de role/plano)"
    - "src/app/api/reports/diagnostic/route.ts:65-72 (stack trace no corpo da resposta)"
  suspected_severity: high
  signals: [security, operational-risk]
  promoted_to: BUG-20260723-DGN1

- finding_id: F-PROCESSO-01
  lens: "Cobertura de testes (achado sobre o processo de fechamento, não sobre código de produto)"
  summary: "BUG-20260723-DUP1 foi encerrado com DONE.md citando scripts/test-reports-dedup.ts como prova, mas o commit seguinte (4239b75) quebrou exatamente esse teste sem reexecutá-lo antes de declarar closure"
  confidence: alta
  evidence:
    - "_reversa_bugs/relatorios/bugs/BUG-20260723-DUP1-toctou-geracao-duplicada/DONE.md"
    - "scripts/test-reports-dedup.ts falha contra o HEAD atual"
  suspected_severity: low
  signals: []
  promoted_to: null

- finding_id: F-SCHEMA-01
  lens: "Cobertura de testes (invariante do próprio registro de bugs, não do produto)"
  summary: "BUG-20260723-IDX1 tem DONE.md (encerrado) mas o front matter do bug.md nunca foi atualizado para status: resolved / resolution_kind: fixed — inconsistência que o /reversa-debugger-graph deveria sinalizar como erro"
  confidence: alta
  evidence:
    - "_reversa_bugs/relatorios/bugs/BUG-20260723-IDX1-get-reports-500-indice-ausente/bug.md (status: open, resolution_kind: null no front matter, apesar do DONE.md presente)"
  suspected_severity: low
  signals: []
  promoted_to: null

- finding_id: F-ERROS-01
  lens: "Estados de erro e edge cases"
  summary: "POST /api/reports/generate ganhou um catch externo que devolve `Erro interno: ${err.message}` ao client — vaza mensagem de erro interna (não stack completo, mas texto potencialmente sensível, ex. URLs de criação de índice do Firebase) em qualquer falha não prevista"
  confidence: média
  evidence:
    - "src/app/api/reports/generate/route.ts (diff do commit 0267da1, catch externo)"
  suspected_severity: low
  signals: [operational-risk]
  promoted_to: null
```

## 3. Clusters

**Cluster do incidente IDX1**: `F-CONCORRENCIA-01` (DUP2) e `F-SEGURANCA-01` (DGN1) nasceram do MESMO evento — a resposta ao vivo ao incidente de produção `BUG-20260723-IDX1`. Sob pressão de um 500 em produção, duas decisões de correção introduziram novos defeitos: remover a transação (achando que era incompatível com Vercel) e deixar uma ferramenta de debug esquecida no ar. Isso não invalida a resposta ao incidente (o 500 real, `IDX1`, parece de fato corrigido — índice restaurado, `try/catch` adicionado), mas mostra o padrão clássico de "corrigir rápido sob pressão introduz nova dívida".

`F-PROCESSO-01` e `F-SCHEMA-01` não são bugs de produto — são achados sobre a integridade do próprio processo de fechamento de bugs do Reversa (testes citados como prova que pararam de passar; front matter dessincronizado do `DONE.md`). Reportados para visibilidade, não registrados como bugs formais.

## 4. O que NÃO foi coberto

- Não foi verificado se o incidente `IDX1` está de fato resolvido em produção (sem acesso a logs reais da Vercel/console Firebase nesta sessão) — a inspeção confia na documentação do `DONE.md` e na presença dos índices no `firestore.indexes.json` atual.
- Não foi investigada a razão real por trás do commit `4239b75` ("compatibilidade Vercel") — se `runTransaction` de fato falha no ambiente serverless da Vercel por algum motivo real (não apenas suposição durante o debug), isso muda a estratégia de correção do `DUP2` (não é só "desfazer o commit").
- Lentes condicionais de desempenho e configuração/migração não deram sinal nesta rodada, não foram aprofundadas.

## Bugs registrados

| ID | Severidade | Título |
|---|---|---|
| BUG-20260723-DUP2 | medium | reserveReportSlot voltou a ser sequencial — TOCTOU reaberto |
| BUG-20260723-DGN1 | high (security_suspected) | Endpoint de diagnóstico esquecido em produção |
