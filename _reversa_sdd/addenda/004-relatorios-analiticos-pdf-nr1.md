# Adendo: Relatórios Analíticos por Período, Departamento e Categoria (com Export PDF e Alinhamento NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: `2026-07-22`
> Cenário: `legado`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Vigência

Vigente desde 2026-07-22.

## Resumo da entrega

Estende o fluxo de relatórios existente com: (1) formulário de geração com período customizado, filtros por departamento/categoria e tipo consolidado/analítico; (2) correção do BUG-20260722-CAT1 (6 sites liam campo `triagem_ia.categoria` inexistente) via função `getCategoriaLegal()`; (3) modo analítico com tabela agregada departamento×categoria×mês sem IA; (4) seção NR-1 no PDF e tela (riscos psicossociais); (5) 3 scripts de teste unitário. 11/11 ações concluídas.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `architecture.md` | "Route Handlers" | `regra-alterada` | `POST /api/reports/generate` ganha filtros `departamentos`/`categorias`, tipo `"analitico"`, métricas NR-1 e `tabela_analitica`. `GET /api/reports/[reportId]/export` ganha 2 blocos novos de PDF. |
| `architecture.md` | "Páginas React" | `regra-alterada` | `/app/relatorios` troca botão único por formulário completo. `[reportId]/page.tsx` renderiza tabela analítica e NR-1. |
| `code-analysis.md` §1 | `assistant/route.ts` | `regra-alterada` | Usa `getCategoriaLegal()` — corrige leitura de campo inexistente (CAT1) |
| `code-analysis.md` §12 | `aiInsights.ts`, `scheduledReports.ts` | `regra-alterada` | Correção inline do campo CAT1 (`triagem_ia?.categoria_legal`) nos 2 arquivos de functions |
| `code-analysis.md` §7 | `reports/generate/route.ts` | `regra-alterada` | Além da correção CAT1: filtros departamento/categoria, modo analítico, NR-1, `tabela_analitica` |
| `domain.md` | "BUG-20260722-CAT1" | `regra-corrigida` | 6 sites liam campo inexistente `triagem_ia.categoria` — corrigidos via `getCategoriaLegal()` centralizado em `triagem.ts` |
| `domain.md` | NR-1 (riscos psicossociais) | `regra-nova` | Seção dedicada sempre presente no PDF/tela, mesmo com zero ocorrências (RN-06, D-06) |

## Regras sob vigilância

W001–W010 em `_reversa_forward/004-relatorios-analiticos-pdf-nr1/regression-watch.md`. Destaque:

- **W001**: zero ocorrências de `triagem_ia?.categoria` nos 6 sites corrigidos
- **W003/04**: `tipo: "analitico"` pula Claude e gera `tabela_analitica`
- **W006**: seção NR-1 sempre presente no PDF (mesmo zero)
- **W010**: functions corrigidas inline (`categoria_legal`, não `categoria`)

## Fontes

- `_reversa_forward/004-relatorios-analiticos-pdf-nr1/legacy-impact.md`
- `_reversa_forward/004-relatorios-analiticos-pdf-nr1/regression-watch.md`
- `_reversa_forward/004-relatorios-analiticos-pdf-nr1/requirements.md`
- `_reversa_forward/004-relatorios-analiticos-pdf-nr1/roadmap.md`
- `_reversa_forward/004-relatorios-analiticos-pdf-nr1/progress.jsonl` (11 ações concluídas)
