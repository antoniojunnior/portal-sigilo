# Legacy Impact: Relatórios Analíticos (PDF + NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: `2026-07-22`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Componentes afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/lib/triagem.ts` | Lib — Triagem | `regra-alterada` | HIGH | Adiciona `getCategoriaLegal()` + exporta `CATEGORIAS_LEGAIS` (corrige BUG-CAT1 na fonte) |
| `src/app/api/assistant/route.ts` | Assistente IA | `regra-alterada` | MEDIUM | Usa `getCategoriaLegal` — conserta leitura de campo inexistente |
| `src/app/api/dashboard/insights/regenerate/route.ts` | Insights (feature 003) | `regra-alterada` | MEDIUM | Usa `getCategoriaLegal` |
| `src/app/api/reports/generate/route.ts` | Relatórios | `regra-alterada` | HIGH | Filtros departamento/categoria + tipo "analitico" + NR-1 + tabela_analitica |
| `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx` | UI Casos | `regra-alterada` | LOW | `triagem_ia.categoria` → `categoria_legal` |
| `functions/src/aiInsights.ts` | Insights agendados | `regra-alterada` | MEDIUM | Correção inline do campo CAT1 |
| `functions/src/scheduledReports.ts` | Relatórios agendados | `regra-alterada` | MEDIUM | Correção inline do campo CAT1 |
| `src/app/api/reports/[reportId]/export/route.ts` | PDF Export | `regra-alterada` | HIGH | 2 novos blocos: tabela analítica + seção NR-1 |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | UI Relatórios | `regra-alterada` | HIGH | Formulário completo (período, departamento, categoria, tipo) |
| `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx` | UI Detalhe | `regra-alterada` | MEDIUM | Tabela analítica + NR-1 na tela |
| `scripts/test-reports-categoria.ts` | Testes | `componente-novo` | LOW | Testes de getCategoriaLegal |
| `scripts/test-reports-tabela-analitica.ts` | Testes | `componente-novo` | LOW | Testes de buildTabelaAnalitica |
| `scripts/test-reports-risco-psicossocial.ts` | Testes | `componente-novo` | LOW | Testes de aggregateRiscoPsicossocial |

## Diff conceitual por componente

### BUG-CAT1 — correção de leitura de categoria
O campo `triagem_ia.categoria` nunca existiu. A interface `TriagemResult` define `categoria_legal`. Os 6 sites que liam `triagem_ia?.categoria ?? c.categoria ?? "outro"` efetivamente usavam o fallback para `c.categoria` (texto livre do denunciante) ou `"outro"`, ignorando a categorização real da IA. A correção introduz `getCategoriaLegal()` como single source of truth.

### Relatórios — novos filtros e modo analítico
Filtros de `departamentos`/`categorias` aplicados em memória sobre o snapshot Firestore (D-02). Novo `tipo: "analitico"` pula chamada Claude e monta `buildTabelaAnalitica` (D-03). `risco_psicossocial` agregado sempre (D-06).

### PDF — novos blocos
Tabela analítica renderizada como lista quando `tabela_analitica` existe. Seção "RISCOS PSICOSSOCIAIS (NR-1)" sempre presente (zero exibe "Nenhum caso..."). Reaproveita `splitTextLines`/`checkSpace`/`addPage` existentes.

### UI — formulário de relatórios
Botão único substituído por formulário completo: presets de período (mês/trimestre/custom), multi-select de departamentos e categorias, toggle consolidado/analítico. Preset trimestral com nota NR-1.

## Preservadas

- 🟢 Auditor bloqueado de gerar/exportar relatórios (sem mudança)
- 🟢 Filtro por `org_id` em todas as queries (sem mudança)
- 🟢 `logAudit` em toda geração/exportação (mantido, com novos parâmetros)
- 🟢 Restrição de exportação apenas para status "aprovado" (sem mudança)

## Modificadas

- 🟢 Leitura de `triagem_ia.categoria` (inexistente) → `getCategoriaLegal()` nos 6 sites
- 🟢 `POST /api/reports/generate`: ganha `departamentos`, `categorias`, `tipo: "analitico"`, `tabela_analitica`, `risco_psicossocial`
- 🟢 `GET /api/reports/[reportId]/export`: PDF ganha 2 blocos novos
- 🟢 UI `/app/relatorios`: botão único → formulário completo
- 🟢 UI `/app/relatorios/[reportId]`: tabela analítica + NR-1 na tela

## Correções de bug pós-implementação (inspection)

| Bug | Arquivo | Correção |
|-----|---------|----------|
| Endpoint `/api/dashboard/configuracoes` inexistente | `relatorios/page.tsx` | Alterado para `/api/dashboard/org` |
| Shape da resposta desalinhado | `relatorios/page.tsx` | `d.org.configuracoes` → `d.configuracoes` |
| Import `Button` não usado | `relatorios/page.tsx` | Removido |
