# Roadmap: Relatórios Analíticos por Período, Departamento e Categoria (com Export PDF e Alinhamento NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22
> Requirements: `_reversa_forward/004-relatorios-analiticos-pdf-nr1/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Estende o que já existe em vez de reconstruir: `POST /api/reports/generate` ganha filtros opcionais (período livre já suportado, departamento/categoria novos, aplicados EM MEMÓRIA sobre o snapshot já buscado por `org_id`+período — sem novo índice Firestore) e um novo `tipo: "analitico"` que pula a chamada Claude e monta uma tabela agregada por dimensão. `GET /api/reports/[reportId]/export` ganha 2 blocos novos de PDF (tabela analítica quando presente; seção NR-1 sempre). A UI de `/app/relatorios` troca o botão único por um formulário (período, departamentos, categorias, tipo, preset trimestral). Primeiro passo do roadmap: corrigir `BUG-20260722-CAT1` (6 sites lendo campo inexistente), pré-requisito real pra RF-03/RF-05 terem dado correto.

## 2. Princípios aplicados

Sem `principles.md` neste projeto — seção n/a.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Corrige `BUG-20260722-CAT1` centralizando a leitura em `getCategoriaLegal(caseData): string`, exportada de `src/lib/triagem.ts` (mesmo arquivo que já declara `TriagemResult`/`CATEGORIAS_LEGAIS`), usada nos 6 sites afetados | Evita o mesmo erro se o campo mudar de nome de novo; correção cirúrgica, sem alterar o schema de `TriagemResult` | Renomear `categoria_legal` pra `categoria` no schema — rejeitado, quebraria o `[caseId]/page.tsx` que já lê `categoria_legal` corretamente em outros pontos e o histórico de dados gravados | 🟢 |
| D-02 | Filtros de departamento/categoria em `POST /api/reports/generate` aplicados EM MEMÓRIA sobre o array de `cases` já buscado por `org_id`+período (mesmo padrão já usado pra agregar `categorias`/`leis` no arquivo) | Volume de casos por org (canal de denúncia) é tipicamente baixo — filtro em memória evita índice composto novo e mantém a mudança cirúrgica | `.where("departamento", "in", [...])`/`.where("triagem_ia.categoria_legal", "in", [...])` no Firestore — rejeitado: exigiria índice composto novo (`firestore.indexes.json`) e "in" tem limite de 10 valores, complexidade desnecessária pro volume esperado | 🟢 |
| D-03 | Modo analítico é um novo valor `tipo: "analitico"` em `POST /api/reports/generate` que PULA a chamada à Anthropic API e monta uma tabela agregada (departamento×categoria×mês) direto do snapshot, salva em `reports.tabela_analitica` (novo campo, array de linhas) | RN-04 do requirements: agregado por dimensão, sem sumarização por IA, sem dado individual de caso — não precisa de IA nenhuma, só agregação determinística | Gerar a tabela via IA também (Claude resumindo em formato tabular) — rejeitado: adiciona custo/latência/variabilidade a um requisito que é puramente determinístico (contagem) | 🟢 |
| D-04 | `GET /api/reports/[reportId]/export` ganha 2 blocos novos no PDF: tabela analítica (quando `reports.tabela_analitica` existe) e seção "Riscos Psicossociais (NR-1)" (sempre, mesmo zero — RF-05) | Reaproveita a infra de `pdf-lib` já madura no arquivo (`splitTextLines`, `checkSpace`, paginação) — só adiciona funções de desenho de tabela, sem tocar no que já funciona (texto executivo, métricas, cabeçalho) | Gerar um PDF separado só pra tabela analítica — rejeitado, fragmenta a experiência e duplica boilerplate de cabeçalho/rodapé | 🟢 |
| D-05 | UI de `/app/relatorios` troca o botão único "Gerar relatório do mês" por um formulário: seletor de período (livre + presets mês/trimestre), multi-select de departamentos, multi-select de categorias, toggle consolidado/analítico | RF-01/02/03/04/07 — todos exigem input do usuário que hoje não existe na UI | Modal separado pra configuração — considerado, mas formulário inline é mais consistente com o resto do dashboard (sem padrão de modal de config complexo já estabelecido) | 🟢 |
| D-06 | Seção NR-1 no PDF/tela SEMPRE aparece quando o relatório é gerado (mesmo com contagem zero), não só quando há casos | RF-05 do requirements: "documentar ausência também tem valor pro PGR" — decisão explícita, não omitir silenciosamente | Omitir a seção quando zero — rejeitado no `requirements.md`, contraria o valor de conformidade documentado | 🟢 |

## 4. Premissas

Nenhuma. Todos os `[DÚVIDA]` do `requirements.md` foram resolvidos no `/reversa-clarify` antes deste plano.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `src/lib/triagem.ts` | `_reversa_sdd/code-analysis.md#12-cross-cutting` | regra-alterada | Adiciona `getCategoriaLegal` (corrige BUG-CAT1, D-01) |
| `src/app/api/assistant/route.ts` | `_reversa_sdd/code-analysis.md#1-assistant` | regra-alterada | Usa `getCategoriaLegal` em vez de `triagem_ia?.categoria` |
| `src/app/api/dashboard/insights/regenerate/route.ts` | feature 003 (`_reversa_sdd/addenda/003-*.md`) | regra-alterada | Usa `getCategoriaLegal` |
| `functions/src/aiInsights.ts`, `functions/src/scheduledReports.ts` | `_reversa_sdd/architecture.md#Camadas` (Firebase Functions) | regra-alterada | Usam `getCategoriaLegal` — MESMA correção duplicada nos 2 runtimes (não compartilhável entre `src/` e `functions/src/`, mesmo motivo do D-01 da feature 003) |
| `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx` | `_reversa_sdd/code-analysis.md` | regra-alterada | Corrige a condicional que nunca mostrava "Categoria" |
| `src/app/api/reports/generate/route.ts` | `_reversa_sdd/code-analysis.md#7-dashboard` (área correlata) | regra-alterada | Filtros departamento/categoria (D-02), novo `tipo: "analitico"` (D-03) |
| `src/app/api/reports/[reportId]/export/route.ts` | idem | regra-alterada | Blocos novos de PDF (D-04) |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | idem | regra-alterada | Formulário novo (D-05) |

## 6. Delta no modelo de dados

- Resumo: `reports/{reportId}` ganha 2 campos novos opcionais: `tabela_analitica` (array de linhas agregadas, presente só quando `tipo === "analitico"`) e `filtros` (já existia no schema, nunca populado — passa a ser preenchido com `{departamentos?: string[], categorias?: string[]}`)
- Detalhe completo em: `_reversa_forward/004-relatorios-analiticos-pdf-nr1/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `POST /api/reports/generate` | HTTP | `_reversa_forward/004-relatorios-analiticos-pdf-nr1/interfaces/reports-generate.md` |
| `GET /api/reports/[reportId]/export` | HTTP | `_reversa_forward/004-relatorios-analiticos-pdf-nr1/interfaces/reports-export.md` |

## 8. Plano de migração

n/a — nenhum dado histórico precisa migrar. Relatórios já gerados (sem `filtros`/`tabela_analitica`) continuam válidos como estão (campos opcionais, ausência = comportamento antigo).

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| BUG-CAT1 corrigido nesta feature muda o valor de `categoria` em relatórios/insights JÁ existentes (histórico) que foram gerados com a leitura errada | baixo | médio | Não regenerar dados históricos (fora de escopo, já decidido no `requirements.md`) — só relatórios NOVOS, gerados após a correção, refletem a categoria certa |
| Filtro em memória (D-02) fica lento se uma org tiver volume muito alto de casos no período | baixo | baixo | Aceitável pro perfil de uso (canal de denúncia, não sistema de alto volume transacional); reavaliar se surgir queixa real de performance |
| Seção NR-1 sempre visível (D-06) pode confundir orgs que não têm nenhum risco psicossocial mapeado ainda | baixo | baixo | Texto explicativo claro ("nenhum caso classificado como risco psicossocial neste período") evita ambiguidade |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
