---
schema_version: 1
id: BUG-20260723-SCP1
display_number: 1
title: Reaproveitamento de relatório recente ignora departamento/categoria — relatório filtrado pode ser exibido como se fosse o relatório padrão da org inteira
status: active
phase: delivering
severity: high
priority: P1
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: reports
labels: [data-integrity, spec-gap-adjacent]

visibility: normal
security_suspected: false

reproduction:
  classification: not-reproduced
  rate: null
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01"
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-01"
  affected_code:
    - "src/lib/reports/report-filters.ts#isReportWithinHours"
    - "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:183-201 (useEffect de mount)"
    - "src/app/api/reports/generate/route.ts:279-292 (GET, mapeamento de ReportSummary)"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "RN-01 exige reaproveitar só relatório 'com os filtros default (... sem departamento/categoria ...)'"
      - "GET /api/reports/generate (route.ts:279-292) mapeia ReportSummary sem incluir departamentos/categorias — o campo `filtros` gravado no doc (linha 227-233 do POST) nunca é devolvido pelo GET"
      - "isReportWithinHours (report-filters.ts:46-72) só compara report.tipo e report.periodo contra expectedFilters — nunca recebe nem checa selectedDepts/selectedCats, porque o dado não existe no objeto `report` (ReportSummary) que ela recebe"
      - "page.tsx:189 chama isReportWithinHours(r, 24, defaultFilters) — defaultFilters.selectedDepts/selectedCats são sempre [] (getDefaultFilters), mas a função nunca verifica se o relatório `r` de fato foi gerado sem filtros de departamento/categoria"
      - "Consequência: um relatório gerado com tipo:'padrao', período = mês corrente, MAS com departamentos:['TI'] (gerado via 'Aplicar filtros' por qualquer usuário, inclusive em sessão anterior) passa isReportWithinHours(r, 24, defaultFilters) === true, e é reaproveitado pelo mount automático como se fosse o relatório padrão da org inteira, sem nenhum indicador visual de que está escopado a um departamento"
    evidence:
      - ref: "src/app/api/reports/generate/route.ts:279-292"
        observation: "objeto retornado por GET não inclui `filtros`, `departamentos` nem `categorias` — só id/tipo/status/gerado_em/aprovado_em/periodo"
      - ref: "src/lib/reports/report-filters.ts:46-72"
        observation: "assinatura de isReportWithinHours recebe `report: { gerado_em, periodo, tipo }` — não há campo de departamento/categoria no tipo do parâmetro, então a função estruturalmente não pode checar isso"
      - ref: "scripts/test-reports-auto-generate.ts:144-154"
        observation: "os únicos testes que variam tipo/período nunca variam departamento/categoria — a suíte de 13 testes não tem nenhum caso que exercite essa combinação, confirmando a lacuna também na cobertura de teste"
    code_refs:
      - {file: "src/lib/reports/report-filters.ts", symbol: "isReportWithinHours", commit: null}
      - {file: "src/app/api/reports/generate/route.ts", symbol: "GET", commit: null}
  reproduction_tests:
    - "scripts/test-reports-auto-generate.ts (\"BUG-20260723-SCP1 (reproducao): relatorio com departamento aplicado NAO deve casar...\")"
    - "scripts/test-reports-auto-generate.ts (\"BUG-20260723-SCP1 (reproducao): relatorio com categoria aplicada NAO deve casar...\")"
  regression_tests:
    - "scripts/test-reports-auto-generate.ts (\"relatorio sem departamento/categoria (filtros default de fato) ainda casa normalmente\")"
    - "scripts/test-reports-auto-generate.ts (13 testes pré-existentes, todos continuam verdes)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/reports/generate/route.ts"
    purpose: "GET passa a expor departamentos/categorias do relatório (lidos de filtros), antes omitidos"
  - id: CHG-002
    kind: code
    artifact: "src/lib/reports/report-filters.ts"
    purpose: "isReportWithinHours passa a exigir departamentos/categorias vazios (ou iguais aos esperados) além de tipo/período"
  - id: CHG-003
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/relatorios/page.tsx"
    purpose: "ReportSummary ganha campos opcionais departamentos/categorias, refletindo o novo shape do GET"
  - id: CHG-004
    kind: test
    artifact: "scripts/test-reports-auto-generate.ts"
    purpose: "2 testes de reprodução + 1 de regressão para o escopo de departamento/categoria; cópia inline de isReportWithinHours sincronizada com a implementação corrigida"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Reaproveitamento de relatório recente ignora departamento/categoria

## Summary

`RN-01`/`RF-01` da feature 005 definem que a geração automática ao acessar `/app/relatorios` deve reaproveitar um relatório existente **apenas** se ele tiver os filtros default (sem departamento/categoria selecionados). A implementação (`isReportWithinHours`) só compara `tipo` e `período`, porque o dado de departamento/categoria aplicado a um relatório nunca chega ao client (o `GET /api/reports/generate` não devolve o campo `filtros`). Na prática, um relatório gerado com filtro de departamento pode ser silenciosamente reaproveitado como se fosse o relatório padrão da org inteira.

## Expected Behavior

Por `_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01`: "verifica se já existe relatório com os filtros default (período = mês corrente, **sem departamento/categoria**, `tipo: "padrao"`) gerado nas últimas 24h. Se existir, reaproveita-o". Um relatório gerado com `departamentos: ["TI"]` (ainda que `tipo` e `período` batam) **não é** um relatório "com os filtros default" e não deveria ser reaproveitado nessa checagem.

## Actual Behavior

`isReportWithinHours` (`src/lib/reports/report-filters.ts:46-72`) ignora completamente departamento/categoria — ela nem recebe esse dado, porque `GET /api/reports/generate` nunca devolve `filtros`/`departamentos`/`categorias` no `ReportSummary` (só grava no Firestore, `route.ts:227-233`, mas não expõe no `GET`, `route.ts:279-292`). Qualquer relatório com `tipo:"padrao"` e mesmo período do mês corrente, gerado nas últimas 24h — **mesmo que escopado a um departamento específico** — satisfaz a checagem e é reaproveitado como se fosse o relatório default da org inteira. A tela não indica em nenhum lugar que o relatório exibido está filtrado.

## Steps to Reproduce

1. Em uma org com pelo menos um caso em mais de um departamento, acesse `/app/relatorios`, abra "Configurar período e filtros", selecione um departamento (ex.: "TI") mantendo período = mês atual e tipo = Consolidado (IA), clique "Aplicar filtros" — isso grava um relatório com `filtros.departamentos: ["TI"]`.
2. Dentro de 24h, recarregue a página `/app/relatorios` (ou abra em outra aba/sessão) sem tocar em nenhum filtro.
3. **Esperado**: um NOVO relatório default (todos os departamentos) deveria ser gerado, já que o único relatório recente é escopado a "TI".
4. **Observado**: o relatório escopado a "TI" é reaproveitado e exibido, sem nenhum aviso de que os dados mostrados são só do departamento "TI".

## Evidence

Ver `traceability.root_cause.evidence` no front matter — achado por análise estática de código (leitura de `report-filters.ts`, `route.ts` e `scripts/test-reports-auto-generate.ts`), sem execução dinâmica ainda.

## Suspected Area

`client-ui` (`src/lib/reports/report-filters.ts`, `src/app/(dashboard)/app/(protected)/relatorios/page.tsx`) com causa raiz que também toca `route-handlers` (`src/app/api/reports/generate/route.ts`, que não expõe `filtros` no `GET`).

## Acceptance Criteria

- `GET /api/reports/generate` passa a incluir informação suficiente para saber se um relatório foi gerado com departamento/categoria (ex.: `filtros.departamentos`/`filtros.categorias`, ou um booleano `isDefaultScope`)
- `isReportWithinHours` (ou a função que a substituir) rejeita relatórios com departamento/categoria não-vazios ao comparar contra `defaultFilters`
- Teste automatizado cobrindo: relatório com mesmo tipo/período mas `departamentos: ["TI"]` não deve ser considerado "dentro da janela" para fins de reaproveitamento default

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `isReportWithinHours` comparava só `tipo`/`período`; `GET /api/reports/generate` nunca devolvia o campo `filtros` gravado no doc, então o client não tinha como saber se um relatório tinha departamento/categoria aplicados.

**Veredito de spec:** `spec-correta` — `RN-01`/`RF-01` já pediam "sem departamento/categoria"; o código é que não implementava a checagem completa. Nenhum adendo de spec necessário.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/app/api/reports/generate/route.ts` | `GET` passa a expor `departamentos`/`categorias` |
| CHG-002 | code | `src/lib/reports/report-filters.ts` | `isReportWithinHours` exige escopo igual, não só tipo/período |
| CHG-003 | code | `page.tsx` | `ReportSummary` ganha os 2 campos novos |
| CHG-004 | test | `scripts/test-reports-auto-generate.ts` | 2 testes de reprodução + 1 de regressão |

**Testes (vermelho → verde):**

```
✗ BUG-20260723-SCP1 (reproducao): relatorio com departamento aplicado NAO deve casar...
AssertionError: Expected values to be strictly equal: true !== false
```
→ após CHG-001/002/003:
```
✓ BUG-20260723-SCP1 (reproducao): relatorio com departamento aplicado NAO deve casar...
✓ BUG-20260723-SCP1 (reproducao): relatorio com categoria aplicada NAO deve casar...
✓ relatorio sem departamento/categoria (filtros default de fato) ainda casa normalmente
✅ Todos os testes de report-filters passaram! (16/16)
```

`npx tsc --noEmit` limpo após a mudança.

**Closure (production-service):** `resolution_kind: fixed`, mas `closure.satisfied: false` — falta `delivery` (commit/push/deploy, fora do escopo deste fix, requer autorização separada de git) e a janela de `post_fix_observation` antes de `DONE.md`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (varredura `varredura-01-pos-coding-005`), lente "Conformidade com spec" + "Fluxo de dados", logo após `/reversa-coding` da feature 005.
- Correção provável exige tocar tanto o `GET` do Route Handler (expor escopo do filtro) quanto `report-filters.ts` (checar o escopo) — não é troca cirúrgica de uma linha só; `/reversa-debugger-fix` deve avaliar `change_risk` antes de aplicar.
- Nenhuma correção foi aplicada por este achado — `/reversa-depth-inspection` só diagnostica.
