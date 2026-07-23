# Actions: Relatórios Analíticos por Período, Departamento e Categoria (com Export PDF e Alinhamento NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22
> Roadmap: `_reversa_forward/004-relatorios-analiticos-pdf-nr1/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 11 |
| Paralelizáveis (`[//]`) | 8 |
| Maior cadeia de dependência | 5 (T001→T005→T007→T009→T011) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Implementa `getCategoriaLegal(caseData): string` em `triagem.ts` — corrige BUG-20260722-CAT1 na fonte (lê `triagem_ia?.categoria_legal`, fallback `c.categoria`, fallback `"outro"`) | - | - | `src/lib/triagem.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T002 | Teste unitário de `getCategoriaLegal`: com `categoria_legal` presente, sem `triagem_ia` ainda, com `triagem_ia` mas sem `categoria_legal` (fallback) | T001 | `[//]` | `scripts/test-reports-categoria.ts` | 🟢 | `[X]` |
| T003 | Teste unitário de `buildTabelaAnalitica(cases)` (ainda não implementada): agrega departamento×categoria_legal×mês corretamente, caso vazio retorna tabela vazia | - | `[//]` | `scripts/test-reports-tabela-analitica.ts` | 🟢 | `[X]` |
| T004 | Teste unitário da agregação `risco_psicossocial` (ainda não implementada): conta certo quando há casos de `categoria_legal="risco_psicossocial"`, retorna `{total: 0, por_subcategoria: {}}` quando não há | - | `[//]` | `scripts/test-reports-risco-psicossocial.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Corrige os 4 sites de leitura em `src/` pra usar `getCategoriaLegal` (mesma troca trivial de 1 linha em cada): `assistant/route.ts`, `dashboard/insights/regenerate/route.ts`, `reports/generate/route.ts` (só a leitura de categoria, não os filtros novos ainda), `casos/[caseId]/page.tsx` | T001 | `[//]` | `src/app/api/assistant/route.ts`, `src/app/api/dashboard/insights/regenerate/route.ts`, `src/app/api/reports/generate/route.ts`, `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx` | 🟢 | `[X]` |
| T006 | Corrige os 2 sites de leitura em `functions/src/` pra usar `getCategoriaLegal` (mesma troca, runtime separado — não compartilha import com `src/`) | T001 | `[//]` | `functions/src/aiInsights.ts`, `functions/src/scheduledReports.ts` | 🟢 | `[X]` |
| T007 | Implementa em `reports/generate/route.ts`: filtros `departamentos`/`categorias` aplicados em memória (D-02), `tipo: "analitico"` que pula Claude e chama `buildTabelaAnalitica` (D-03), `metricas.risco_psicossocial` sempre calculado (D-06), `logAudit` incluindo os novos parâmetros nos detalhes | T003, T004, T005 | - | `src/app/api/reports/generate/route.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Adiciona 2 blocos novos ao PDF: tabela agregada (quando `tabela_analitica` presente, substitui o texto executivo) e seção "RISCOS PSICOSSOCIAIS (NR-1)" sempre presente (mesmo zero, D-06), reaproveitando `splitTextLines`/`checkSpace`/paginação já existentes | T007 | `[//]` | `src/app/api/reports/[reportId]/export/route.ts` | 🟢 | `[X]` |
| T009 | Constrói formulário novo em `relatorios/page.tsx`: seletor de período (livre + presets mês/trimestre), multi-select de departamentos, multi-select de categorias, toggle consolidado/analítico — substitui o botão único atual | T007 | `[//]` | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T010 | Atualiza `[reportId]/page.tsx` pra exibir tabela analítica (quando presente) e seção NR-1 na tela, não só no PDF | T007 | `[//]` | `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T011 | Revisão de copy final (não placeholder): texto de apoio do preset trimestral citando a NR-1 (RF-07), mensagem "nenhum caso classificado como risco psicossocial neste período" | T009, T010 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx`, `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx` | 🟢 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-to-do` | reversa |
