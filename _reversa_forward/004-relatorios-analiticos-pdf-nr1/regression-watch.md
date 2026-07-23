# Regression Watch: Relatórios Analíticos (PDF + NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: `2026-07-22`
> Legacy Impact: `_reversa_forward/004-relatorios-analiticos-pdf-nr1/legacy-impact.md`

## Watch items

| ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------|----------------------------|---------------------|-------------------|
| W001 | `legacy-impact.md` § BUG-CAT1 | Nenhum site de leitura usa `triagem_ia?.categoria` (campo inexistente) nos arquivos de `src/` e `functions/src/` | `ausência` | String `triagem_ia?.categoria` ou `triagem_ia.categoria` em qualquer arquivo listado |
| W002 | `legacy-impact.md` § BUG-CAT1 | `getCategoriaLegal` exportada de `src/lib/triagem.ts` e usada nos 4 sites de `src/` | `presença` | Função ausente ou não importada nos 4 arquivos |
| W003 | `legacy-impact.md` § Relatórios | `POST /api/reports/generate` aceita `departamentos` e `categorias` no body | `presença` | Campos não extraídos do body ou ignorados |
| W004 | `legacy-impact.md` § Relatórios | `tipo: "analitico"` pula chamada à Anthropic API e gera `tabela_analitica` | `presença` | Chamada Claude executada quando `tipo === "analitico"` |
| W005 | `legacy-impact.md` § Relatórios | `risco_psicossocial` sempre calculado e incluído no report, mesmo com total=0 | `presença` | Campo `risco_psicossocial` ausente do documento `reports` |
| W006 | `legacy-impact.md` § PDF | Seção "RISCOS PSICOSSOCIAIS (NR-1)" sempre aparece no PDF | `presença` | Seção NR-1 omitida quando `total === 0` |
| W007 | `legacy-impact.md` § PDF | Tabela analítica renderizada quando `tabela_analitica` existe no report | `presença` | `tabela_analitica` presente no documento mas ausente do PDF |
| W008 | `legacy-impact.md` § UI | `/app/relatorios` tem formulário com seletor de período, departamentos, categorias e tipo | `presença` | Botão único "Gerar relatório do mês" sem formulário de filtros |
| W009 | `legacy-impact.md` § UI | `/app/relatorios/[reportId]` exibe tabela analítica e seção NR-1 | `presença` | Novos campos ausentes da renderização da página de detalhe |
| W010 | `legacy-impact.md` § BUG-CAT1 | `functions/src/aiInsights.ts` e `scheduledReports.ts` usam `triagem_ia?.categoria_legal` como fallback correto | `presença` | `triagem_ia?.categoria` nos dois arquivos de functions |

## Histórico de re-extrações

| Data | Re-extração | Watch items violados | Ação tomada |
|------|-------------|---------------------|-------------|
| - | - | - | - |

## Arquivadas

| ID | Data de arquivamento | Motivo |
|----|---------------------|--------|
| - | - | - |

## Observações

- A function `functions/src/aiInsights.ts` mantém duplicação de lógica com `regenerate/route.ts` (D-01 da feature 003) — agora ambas precisam de sincronização no mapeamento de categoria também
- `functions/src/scheduledReports.ts` e `reports/generate/route.ts` compartilham lógica de agregação similar — considerar extração futura para lib compartilhada
- O campo `filtros` no documento `reports` agora é preenchido com `{departamentos, categorias, periodoInicio, periodoFim}` — relatórios antigos não têm esses campos (opcionais, sem quebra)
