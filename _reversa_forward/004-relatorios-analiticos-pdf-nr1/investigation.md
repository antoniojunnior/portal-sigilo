# Investigation: Relatórios Analíticos por Período, Departamento e Categoria

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22

## O que foi lido nesta sessão

| Arquivo | O que confirmou |
|---------|------------------|
| `src/app/api/reports/generate/route.ts` | Já aceita período livre e um campo `filtros` genérico nunca populado; agrega `categorias`/`leis`/`resolvidos`/`pendentes`/`prazoMedio` em memória sobre o snapshot |
| `src/app/api/reports/[reportId]/export/route.ts` | PDF já maduro (`pdf-lib`, paginação, cabeçalho de marca, rodapé de confidencialidade) — infraestrutura de desenho reaproveitável pros blocos novos |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx`, `[reportId]/page.tsx` | UI atual: botão único, sem seletor de nada; fluxo aprovar→exportar já robusto (auditoria, revert) |
| `src/lib/triagem.ts` | `CATEGORIAS_LEGAIS` já inclui `risco_psicossocial`; `LEIS_APLICAVEIS` já inclui `nr1` — categorização NR-1 já modelada na triagem, nunca exposta em relatório |
| `src/app/api/dashboard/heatmap/route.ts` | Padrão de agregação por `configuracoes.departamentos` já estabelecido, reaproveitável |
| `firestore.indexes.json` | Índices atuais confirmam o padrão `org_id + created_at` (range) já indexado; nenhum índice pra `departamento`/`categoria_legal` — motivou D-02 (filtro em memória em vez de índice novo) |
| Grep `triagem_ia?.categoria` no repo inteiro | 6 ocorrências, campo que nunca existiu — `BUG-20260722-CAT1` registrado nesta sessão |

## Pesquisa externa: NR-1 e canal de denúncia

Pedido explícito do argumento da feature. Fontes consultadas via `WebSearch`/`WebFetch` em 2026-07-22:

1. **Portaria MTE nº 1.419, de 27/08/2024** — atualizou o Capítulo 1.5 da NR-1, incluindo riscos psicossociais no rol de riscos ocupacionais obrigatórios (PGR). Fiscalização punitiva iniciada em **26/05/2026** (já em vigor na data desta sessão).
2. **Categorias de risco psicossocial exigidas no mapeamento** (fonte: blog bcompliance, 2026-05-24): sobrecarga de trabalho, assédio moral, assédio sexual, pressão abusiva por metas, conflito interpessoal, falha de gestão, isolamento, discriminação.
3. **O que o PGR precisa conter**: inventário de riscos (evidência real, não suposição), plano de ação (medidas/responsáveis/prazos), documento de critérios (severidade/probabilidade/classificação).
4. **Cadência de análise**: "análise mínima trimestral para empresas de médio e grande porte" — motivou RN-05/RF-07 (preset trimestral).
5. **Base legal do canal de denúncias em si** (contexto, não escopo desta feature): Lei 12.846/2013 (Anticorrupção), Lei 13.608/2018 (figura do whistleblower), Lei 14.457/2022 (obrigatoriedade do canal para orgs com CIPA).

**Nota de confiabilidade**: fontes são blogs especializados em compliance (bcompliance, speaksafely, migalhas), não o texto oficial da Portaria MTE. Marcado 🟡 (inferido) no `requirements.md`, não 🟢. Recomendação para antes de produção real: validar os itens acima contra o texto oficial da Portaria MTE 1.419/2024 e da NR-1 vigente, idealmente com o jurídico/SESMT do cliente.

## Alternativas avaliadas

1. **Compartilhar a correção de `BUG-20260722-CAT1` entre `src/` e `functions/src/` via lib comum** — descartada pelo mesmo motivo já registrado na feature 003 (D-01 daquela feature): runtimes/builds distintos.
2. **Índice composto Firestore pra filtro de departamento/categoria** — descartada (D-02): volume esperado não justifica a complexidade, filtro em memória sobre o snapshot já buscado é suficiente e mais simples.
3. **Gerar a tabela analítica via Claude** — descartada (D-03): é agregação determinística, não precisa de IA.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
