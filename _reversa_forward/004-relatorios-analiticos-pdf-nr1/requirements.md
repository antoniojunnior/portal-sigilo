# Requirements: Relatórios Analíticos por Período, Departamento e Categoria (com Export PDF e Alinhamento NR-1)

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A rota `/app/relatorios` já tem um fluxo funcional completo: gera relatório executivo via IA (`POST /api/reports/generate`), fluxo de aprovação (rascunho→aprovado→exportado, com auditoria), e exportação em PDF já implementada (`GET /api/reports/[reportId]/export`, `pdf-lib`, multi-página, com métricas e texto executivo). O que falta, e é o pedido desta feature: (1) período customizado exposto na UI (o backend já aceita, só o botão "Gerar relatório do mês" trava no mês corrente); (2) quebra por departamento (dado já existe em `case.departamento`, usado no heatmap, nunca usado em relatórios); (3) quebra por categoria confiável — **acha um bug bloqueante durante o levantamento**: todo o código de agregação por categoria (relatórios, insights, assistente) lê um campo (`triagem_ia.categoria`) que nunca existiu (`BUG-20260722-CAT1`); (4) modo analítico vs consolidado (hoje só existe o consolidado); (5) alinhamento com a atualização da NR-1 (riscos psicossociais, Portaria MTE 1.419/2024, fiscalização punitiva desde 26/05/2026), que já é modelada em parte no sistema (`categoria_legal: "risco_psicossocial"`, `lei_aplicavel: "nr1"` já existem em `triagem.ts`) mas nunca aparece destacada em nenhum relatório.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `src/app/api/reports/generate/route.ts` | Já aceita `periodoInicio`/`periodoFim` customizados e um campo `filtros` genérico (nunca populado pela UI); agrega `categorias`, `leis` (`lei_aplicavel`), calcula `resolvidos`/`pendentes`/`prazoMedio` | 🟢 |
| `src/app/api/reports/[reportId]/export/route.ts` | PDF já funcional: `pdf-lib`, cabeçalho com nome da org, período, métricas, texto executivo da IA paginado, rodapé de confidencialidade — só falta estender o CONTEÚDO (novas seções), não construir do zero | 🟢 |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | UI atual só tem um botão "Gerar relatório do mês" (período fixo = mês corrente, `tipo: "padrao"` fixo) — sem seletor de período, departamento, categoria ou tipo analítico/consolidado | 🟢 |
| `src/lib/triagem.ts` | `CATEGORIAS_LEGAIS` já inclui `"risco_psicossocial"`; `LEIS_APLICAVEIS` já inclui `"nr1"` — o sistema JÁ categoriza NR-1 na triagem por IA, mas nenhum relatório atual destaca essa dimensão | 🟢 |
| `src/app/api/dashboard/heatmap/route.ts` | Padrão já estabelecido de usar `orgs.configuracoes.departamentos` como lista canônica de departamentos pra agregação — reaproveitável para relatórios | 🟢 |
| `_reversa_bugs/categorizacao-de-casos/bugs/BUG-20260722-CAT1-.../bug.md` | **Bloqueante confirmado nesta sessão**: 6 sites de leitura (incl. `reports/generate/route.ts`) leem `triagem_ia.categoria`, campo que nunca existiu (`TriagemResult` só tem `categoria_legal`). Toda agregação "por categoria" hoje usa texto livre do denunciante ou `"outro"`, nunca a categorização legal real | 🟢 |
| `_reversa_sdd/data-dictionary.md` (linha 21, 241) | `OrgConfiguracoes.departamentos` já documentado como usado mas ausente do tipo declarado — LACUNA de tipo pré-existente, não desta feature | 🟡 |
| Pesquisa externa: Portaria MTE nº 1.419/2024, blog bcompliance (2026-05-24) | NR-1 atualizada exige PGR com inventário de riscos psicossociais categorizados (sobrecarga, assédio moral, assédio sexual, pressão abusiva por metas, conflito interpessoal, falha de gestão, isolamento, discriminação), rastreáveis por data/categoria/status, com **análise mínima trimestral para empresas de médio/grande porte**. Fiscalização punitiva iniciada em 26/05/2026 | 🟡 (fonte externa, não `_reversa_sdd/`) |
| Pesquisa externa: Lei 14.457/2022, Lei 12.846/2013 (Lei Anticorrupção), Lei 13.608/2018 | Base legal da obrigatoriedade do canal de denúncias em si (já implementado, fora do escopo desta feature) — citada aqui só como pano de fundo pra entender por que a documentação/relatório importa juridicamente | 🟡 (fonte externa) |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor de compliance (admin) | Gerar relatório executivo mensal pra liderança | Seleciona período do mês, gera consolidado, aprova, exporta PDF — fluxo já existente, sem mudança |
| Gestor de RH/SESMT (admin) | Documentar riscos psicossociais pro PGR (NR-1) | Seleciona período trimestral, filtra por categoria `risco_psicossocial` e/ou departamento, gera relatório com seção dedicada de NR-1, exporta PDF pra anexar ao PGR |
| Gestor de compliance (admin) | Investigar concentração de casos numa área específica | Filtra por departamento, escolhe modo analítico (mais detalhe, menos sumarização), identifica padrão antes de decidir ação |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O usuário pode escolher um período customizado (data início/fim livres) na UI de geração de relatório, não só o mês corrente. 🟢
   - Origem no legado: `reports/generate/route.ts` já aceita `periodoInicio`/`periodoFim` — a UI (`relatorios/page.tsx`) que trava no mês corrente
   - Tipo: alterada (UI), backend já suporta
2. **RN-02:** O relatório pode ser filtrado e/ou quebrado por departamento, usando `orgs.configuracoes.departamentos` como lista canônica (mesmo padrão do heatmap). 🟢
   - Origem no legado: `dashboard/heatmap/route.ts` — padrão de agregação por departamento já existe, nunca aplicado a relatórios
   - Tipo: nova
3. **RN-03:** O relatório pode ser filtrado e/ou quebrado por categoria legal (`categoria_legal`), não pela categoria bruta do denunciante. 🟢
   - Origem no legado: `triagem.ts#CATEGORIAS_LEGAIS` — depende da correção de `BUG-20260722-CAT1`, embutida como ação desta feature (decisão de `/reversa-clarify`, 2026-07-22)
   - Tipo: alterada (corrige leitura de campo) + nova (exposição em relatório)
4. **RN-04:** O relatório pode ser gerado em modo **analítico** (agregado por dimensão — departamento×categoria×mês, sem sumarização por IA, sem dado individual de caso) ou **consolidado** (resumo executivo por IA, comportamento atual). 🟢
   - Origem no legado: nenhuma — `tipo: "padrao" | "personalizado" | "esg"` já existe no schema de `reports`. Decisão de `/reversa-clarify` (2026-07-22): analítico fica agregado por dimensão, NUNCA lista caso a caso (menor risco de reidentificação/LGPD num PDF que pode circular fora do sistema)
   - Tipo: nova
5. **RN-05:** A UI oferece um preset de período "trimestral", alinhado à exigência de análise mínima trimestral da NR-1 (Portaria MTE 1.419/2024) para empresas de médio/grande porte. Sem automação/lembrete novo — é só um atalho manual no seletor (decisão de `/reversa-clarify`, 2026-07-22). 🟡
   - Origem: pesquisa externa (não há regra correspondente em `_reversa_sdd/`)
   - Tipo: nova
6. **RN-06:** Quando o período do relatório contém casos com `categoria_legal === "risco_psicossocial"` ou `lei_aplicavel` incluindo `"nr1"`, o relatório (tela e PDF) destaca uma seção separada com a contagem e distribuição por subcategoria de risco psicossocial. 🟡
   - Origem: pesquisa externa (categorias de risco psicossocial exigidas pela NR-1: sobrecarga, assédio moral, assédio sexual, pressão abusiva por metas, conflito interpessoal, falha de gestão, isolamento, discriminação) — este é o "insight que gera valor" pedido explicitamente no argumento da feature
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | UI de geração de relatório ganha seletor de período customizado (data início/fim), além dos presets "mês atual" e "trimestre atual" | Must | Usuário escolhe datas livres OU um preset; relatório gerado reflete exatamente o período escolhido | 🟢 |
| RF-02 | UI ganha filtro opcional por departamento (multi-select, usando `configuracoes.departamentos`) | Must | Relatório gerado só considera casos do(s) departamento(s) selecionado(s); sem seleção, considera todos | 🟢 |
| RF-03 | UI ganha filtro opcional por categoria legal (multi-select, usando `CATEGORIAS_LEGAIS`) | Must | Relatório gerado só considera casos da(s) categoria(s) selecionada(s); depende de `BUG-20260722-CAT1` corrigido | 🟢 |
| RF-04 | Novo seletor de tipo: "Consolidado" (atual, resumo executivo por IA) vs "Analítico" (tabela agregada por dimensão — departamento×categoria×mês —, sem sumarização por IA, sem dado individual de caso) | Should | Relatório analítico mostra tabela agregada por dimensão, sem o texto corrido gerado por Claude e sem listar casos individuais | 🟢 |
| RF-05 | Seção dedicada "Riscos Psicossociais (NR-1)" no relatório (tela e PDF), com contagem total e distribuição por `categoria_legal`/`lei_aplicavel` relacionados a NR-1 | Should | Quando há casos de `risco_psicossocial`/`nr1` no período, a seção aparece com números reais; quando não há, seção mostra "nenhum caso no período" (não desaparece silenciosamente — valor de conformidade é mostrar ausência também) | 🟡 |
| RF-06 | Export PDF estendido para incluir as novas quebras (departamento, categoria, seção NR-1) mantendo o layout/marca já existente | Must | PDF exportado reflete todos os filtros/seções aplicados na geração, não só o texto executivo genérico atual | 🟢 |
| RF-07 | Preset de período "Trimestral" disponível no seletor, com nota explicativa citando a exigência de análise mínima trimestral da NR-1 para médio/grande porte | Should | Preset seleciona automaticamente os últimos 3 meses; texto de apoio menciona a NR-1 | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Filtros de departamento/categoria não introduzem novo vetor de acesso cross-org — toda query já filtra por `org_id` (padrão existente em `reports/generate/route.ts`) | Código atual já filtra por `org_id`, só precisa manter o padrão ao adicionar `.where()` extras | 🟢 |
| Segurança | Mesma restrição de role já existente (`auditor` bloqueado de gerar/exportar relatórios) permanece sem mudança nesta feature | `reports/generate/route.ts`, `export/route.ts` já bloqueiam `role === "auditor"` | 🟢 |
| Desempenho | Período customizado longo (ex.: 1 ano) não deve travar a geração — considerar limite razoável ou aviso de volume grande | Query atual sem paginação; períodos maiores multiplicam o tamanho do array de `cases` carregado em memória | 🟡 |
| Auditoria | Toda geração de relatório (com os novos filtros) continua registrando `logAudit` com os parâmetros usados (período, departamento, categoria, tipo) | Padrão já existente (`acao: "report_generated"`), só precisa incluir os novos campos em `detalhes` | 🟢 |
| Consistência de dados | Filtro por categoria só é confiável após `BUG-20260722-CAT1` corrigido — não faz sentido implementar RF-03 sobre o campo errado | Achado desta sessão, ver `[DÚVIDA]` sobre ordem de execução | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Relatório com período customizado
  Dado que o admin está na tela de geração de relatório
  Quando ele escolhe um período de 45 dias fora do mês corrente
  Então o relatório gerado considera exatamente esse período
  E o PDF exportado mostra esse período no cabeçalho

Cenário: Relatório filtrado por departamento
  Dado que a org tem casos em 3 departamentos diferentes
  Quando o admin filtra por 1 departamento específico
  Então o relatório só considera os casos daquele departamento
  E as métricas (total, resolvidos, pendentes) refletem só esse subconjunto

Cenário: Seção NR-1 aparece quando há casos de risco psicossocial
  Dado que o período selecionado tem ao menos 1 caso com categoria_legal="risco_psicossocial"
  Quando o relatório é gerado
  Então a seção "Riscos Psicossociais (NR-1)" aparece com a contagem real
  E o PDF exportado inclui essa seção

Cenário: Seção NR-1 mostra ausência quando não há casos
  Dado que o período selecionado NÃO tem nenhum caso de risco psicossocial
  Quando o relatório é gerado
  Então a seção "Riscos Psicossociais (NR-1)" ainda aparece, mostrando "nenhum caso no período"
  E isso não é omitido silenciosamente (valor de documentar ausência para o PGR)

Cenário: Auditor não pode gerar relatório (comportamento preservado)
  Dado um usuário com role="auditor"
  Quando ele tenta gerar um relatório com os novos filtros
  Então a resposta é 403, igual ao comportamento atual sem os filtros
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01 | Must | Backend já suporta, é só expor — baixo custo, alto valor de UX |
| RF-02 | Must | Pedido explícito do usuário, dado já existe (heatmap prova o padrão) |
| RF-03 | Must | Pedido explícito, mas bloqueado por `BUG-20260722-CAT1` — ver `[DÚVIDA]` |
| RF-04 | Should | Pedido explícito ("analítica ou consolidada"), mas não bloqueia o valor central (período+departamento+categoria+PDF) |
| RF-05 | Should | É o "insight que gera valor" pedido — mas depende de RF-03 (categoria correta) primeiro |
| RF-06 | Must | Sem isso, os filtros novos (RF-01/02/03) não aparecem no PDF — a entrega ficaria incompleta |
| RF-07 | Should | Reforça alinhamento NR-1, mas é um atalho de UX sobre RF-01 (que já permite período livre) |

## 9. Esclarecimentos

### Sessão 2026-07-22

- **Q:** `BUG-20260722-CAT1` bloqueia RF-03/RF-05. Como tratar?
  **R:** Embutir no `actions.md` desta feature — corrige os 6 sites como ação(ões) do roadmap, antes das ações que dependem de categoria correta. Um só ciclo, sem `/reversa-debugger-fix` separado.
- **Q:** Modo "analítico" (RF-04) mostra dado individual de caso ou fica agregado por dimensão?
  **R:** Agregado por dimensão (departamento×categoria×mês), nunca lista caso a caso — menor risco de LGPD/reidentificação num PDF que pode circular.
- **Q:** Preset "Trimestral" (RF-07) precisa de lembrete/notificação automática?
  **R:** Não — só atalho manual no seletor, sem infraestrutura nova (scheduled function/notificação).

## 10. Lacunas

Nenhuma pendente. As 3 lacunas da versão inicial foram resolvidas na sessão de `/reversa-clarify` de 2026-07-22 (ver seção 9).

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-07-22 | `/reversa-clarify` resolveu os 3 `[DÚVIDA]` (ordem CAT1, granularidade analítico, automação NR-1) | reversa |
