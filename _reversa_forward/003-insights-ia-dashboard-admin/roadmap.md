# Roadmap: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22
> Requirements: `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Nenhuma peça nova de arquitetura: tudo já existe (`AIInsightsCard.tsx`, `GET /api/dashboard/insights`, `generateDailyInsights` scheduled function, `orgs.ai_insights`). O trabalho é corrigir o mapeamento de dados que já quebra (RF-01), completar a promessa "sob demanda" do `domain.md#Insight` que nunca foi entregue (RF-02/03), tornar a fonte do insight visível quando ela for menos confiável (RF-04), e dar ao CTA um destino real (RF-05/06). A única decisão técnica não trivial é onde a regeneração manual roda: por `architecture.md#Camadas` já separar "Server (Next.js, mesmo deploy)" de "Firebase Functions (deploy separado)", a lógica de geração via Claude precisa existir duplicada nos dois lados — chamar a Function agendada a partir de um Route Handler não é uma opção direta.

## 2. Princípios aplicados

Sem `principles.md` neste projeto — seção n/a.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Regeneração manual vira um novo Route Handler `POST /api/dashboard/insights/regenerate`, que reimplementa a MESMA lógica de prompt/parsing já usada em `functions/src/aiInsights.ts`, em vez de compartilhar código com a Firebase Function | `architecture.md#Camadas` já separa "Server (Next.js, mesmo deploy)" de "Firebase Functions (deploy separado)" — são dois builds/runtimes distintos; compartilhar módulo exigiria refactor cross-project maior, fora do escopo de uma feature de refinamento de UX | (a) invocar a function agendada via HTTP callable — adiciona latência/complexidade de invocação entre runtimes pra um caso de uso simples; (b) extrair lib compartilhada entre `src/` e `functions/src/` agora — invasivo demais pro valor entregue | 🟢 |
| D-02 | Rate limit de 24h calculado comparando `Date.now()` com `orgs.ai_insights.gerado_em` já existente — nenhum campo novo de controle | O campo já é a fonte de verdade de "quando foi a última geração", independente de ter vindo do cron ou do botão manual — reaproveitar evita duplicar estado | Campo novo `ultima_regeneracao_manual` — rejeitado por criar duas fontes de verdade para a mesma pergunta ("quando foi gerado por último") | 🟢 |
| D-03 | O valor de `source` retornado por `GET /api/dashboard/insights` quando há `ai_insights.items` muda de `"ai_scheduled"` para `"ai_generated"` — cobre origem agendada e manual igualmente, já que ambas produzem o mesmo formato de dado e o admin não precisa saber qual gatilho rodou | RN-03/RF-04 tratam "IA real" (agendada ou manual) como um único caso pro badge (sem badge); manter o nome `"ai_scheduled"` ficaria semanticamente errado assim que a regeneração manual existir | Manter `"ai_scheduled"` e adicionar um terceiro valor `"ai_manual"` — rejeitado: RF-04 não precisa distinguir os dois no frontend, então dois valores read-time seria complexidade sem uso | 🟢 |
| D-04 | Nova página dedicada `/app/insights` (route group `(protected)`, mesmo padrão de `relatorios/[reportId]/page.tsx`: `useSWR` + `DashboardHeader` + `Skeleton`), reaproveitando o mesmo `GET /api/dashboard/insights` sem endpoint novo de leitura | RF-05 pede destino real sem escopo de relatório mensal; a página só precisa mostrar o mesmo dado sem truncamento — não há necessidade de payload diferente | Reaproveitar `/app/relatorios` — descartado no `/reversa-clarify` por desalinhamento de escopo | 🟢 |
| D-05 | Correção do RF-01 (dedupe de `items[1]` entre `description` e `recommendations`) é só re-mapeamento dentro de `GET /api/dashboard/insights/route.ts`, sem tocar em como os dados são gravados em `orgs.ai_insights` | O defeito é de leitura (como os 3 itens viram 4 campos de UI), não de escrita — nenhuma migração de dado histórico é necessária | Reescrever o formato gravado pela scheduled function — descartado, mudaria contrato de escrita sem necessidade | 🟢 |
| D-06 | RF-06 (Could) fica condicionado a um novo query param em `GET /api/dashboard/cases` (hoje só filtra por `status`/`urgency`/`channel`/`protocol`/datas — confirmado por leitura do código, sem `department`/`category`) | Sem esse param, a página de detalhe do insight não tem como linkar filtrado; como é Could, a decisão de implementar ou não fica pro `/reversa-to-do` | — | 🟡 |

## 4. Premissas

Nenhuma. Todos os `[DÚVIDA]` do `requirements.md` foram resolvidos no `/reversa-clarify` antes deste plano.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Route Handlers (`src/app/api/dashboard/insights`) | `_reversa_sdd/architecture.md#Camadas` | regra-alterada | Corrige dedupe (RF-01), renomeia `source: "ai_scheduled"` → `"ai_generated"` (D-03) |
| Route Handlers (novo) | `_reversa_sdd/architecture.md#Camadas` | contrato-novo | `POST /api/dashboard/insights/regenerate` (D-01, D-02) |
| Páginas React (novo) | `_reversa_sdd/architecture.md#Camadas` | componente-novo | `/app/insights` (D-04) |
| `AIInsightsCard.tsx` | `_reversa_sdd/code-analysis.md#7-dashboard` (citado indiretamente via rota `dashboard/insights`) | regra-alterada | Badge de fonte (RF-04), CTA com destino real (RF-05), botão "Atualizar agora" (RF-02/03) |
| `PUT /api/assistant` | `_reversa_sdd/code-analysis.md#1-assistant` | preservado, sem mudança | Continua existindo como está (órfão) — RN-05 é satisfeita pelo novo endpoint (D-01) não reaproveitar esse caminho, não por alterar o `PUT` existente |

## 6. Delta no modelo de dados

- Nenhum campo novo em Firestore. `orgs.ai_insights.{items, gerado_em}` continua sendo a única fonte de verdade, tanto para geração agendada quanto manual (D-02).
- Detalhe completo em: `_reversa_forward/003-insights-ia-dashboard-admin/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `GET /api/dashboard/insights` | HTTP | `_reversa_forward/003-insights-ia-dashboard-admin/interfaces/dashboard-insights-get.md` |
| `POST /api/dashboard/insights/regenerate` | HTTP | `_reversa_forward/003-insights-ia-dashboard-admin/interfaces/dashboard-insights-regenerate.md` |

## 8. Plano de migração

n/a — nenhuma migração de dados. `orgs.ai_insights` de orgs que nunca tiveram `source` explícito continuam caindo no caminho de fallback existente, sem necessidade de backfill.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Duplicação de lógica de prompt entre `functions/src/aiInsights.ts` e o novo Route Handler (D-01) diverge com o tempo (uma muda, a outra não) | médio | médio | Comentário cruzado nos dois arquivos apontando um pro outro; considerar extração para lib compartilhada numa iteração futura se o padrão se repetir em uma 3ª function |
| Renomear `source: "ai_scheduled"` → `"ai_generated"` (D-03) quebra algum consumidor que não foi mapeado nesta sessão | baixo | baixo | Grep confirmou `AIInsightsCard.tsx` como único consumidor do campo `source` nesta sessão; `/reversa-coding` deve reconfirmar antes de aplicar |
| Rate limit de 24h (D-02) frustra o admin que quer testar a feature repetidamente logo após o deploy | baixo | médio | Mensagem de erro clara com horário exato da próxima liberação, não só "tente mais tarde" |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
