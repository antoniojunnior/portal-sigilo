# Requirements: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

O card "Insight da IA" já existe na home do dashboard administrativo (`AIInsightsCard.tsx`), alimentado por uma function agendada diária (`generateDailyInsights`) que chama a Anthropic API e grava até 3 insights curtos em `orgs.ai_insights`. O componente e o endpoint já funcionam, mas entregam menos valor percebido do que poderiam: o CTA "Ver análise completa" não leva a lugar nenhum, o texto exibido duplica o mesmo trecho como descrição e como primeira recomendação, não há como o admin saber se está vendo um insight real de IA ou um fallback heurístico, e não existe forma de forçar uma atualização sob demanda. Esta feature refina o que já está pronto — sem trocar a arquitetura — para o gestor de compliance perceber o insight como acionável e confiável, não como um enfeite estático na tela.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/domain.md#Insight` | "Texto curto gerado por IA (diário, ou sob demanda) resumindo padrões nos casos recentes da org" — o legado já previa geração "sob demanda", nunca implementada | 🟢 |
| `_reversa_sdd/code-analysis.md#1-assistant` | `PUT /api/assistant` é "endpoint interno, não exposto ao browser", restrito a `role === admin`, atualiza `orgs.ai_insights.items` — hoje sem nenhum caller no frontend (órfão, confirmado via grep nesta sessão) | 🟢 |
| `_reversa_sdd/code-analysis.md#7-dashboard` | `GET /insights`: "usa `ai_insights` pré-gerado por scheduled function, ou fallback heurístico local" — dois caminhos com qualidade bem diferente, hoje indistinguíveis na UI | 🟢 |
| `_reversa_sdd/code-analysis.md#12-cross-cutting` | `aiInsights.ts` (scheduled, 07h BRT diário): "gera até 3 insights por IA... grava em `orgs.ai_insights`" — nota da extração diz elegibilidade por plano `gestao`/`enterprise`; **superado** pelo adendo da feature 002 (plano único `unico`), já refletido no código atual lido nesta sessão | 🟡 |
| `_reversa_sdd/addenda/002-unificar-plano-assinatura.md` | Confirma que o modelo Claude hardcoded em `aiInsights.ts` já foi corrigido para `claude-sonnet-4-6` (bug pré-existente, não relacionado a esta feature) e que o gating de features por plano foi removido de forma geral no dashboard | 🟢 |
| Leitura direta do código (`src/app/api/dashboard/insights/route.ts`) | O mapeamento de `items: string[]` (3 strings da IA) para `{summary, highlight, description, recommendations}` usa `items[1]` tanto em `description` quanto como primeiro elemento de `recommendations` (via `items.slice(1)`) — duplicação real, confirmada por leitura do código nesta sessão | 🟢 |
| Leitura direta do código (`AIInsightsCard.tsx`) | Botão "Ver análise completa" não tem `href` nem `onClick` — CTA morto, confirmado por leitura do código nesta sessão | 🟢 |
| Leitura direta do código (`src/app/(dashboard)/app/(protected)/relatorios/page.tsx`) | Já existe uma página de relatórios mensais (`/app/relatorios`) gerada por `generateMonthlyReports` — candidato natural de destino para o CTA, mas escopo (mensal/estruturado) difere do insight (semanal/curto) | 🟡 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor de compliance (admin) | Entender rapidamente, ao abrir o dashboard, se há algo que merece atenção esta semana | Abre `/app`, vê o card de insight, decide em segundos se precisa investigar mais ou pode seguir o dia |
| Gestor de compliance (admin) | Confiar no que está vendo antes de agir sobre ele | Precisa saber se o texto veio de uma análise real de IA sobre os casos recentes ou de uma heurística genérica de fallback |
| Gestor de compliance (admin) | Aprofundar quando o insight aponta um padrão | Clica em "Ver análise completa" esperando ver os casos por trás do insight, não uma página desconectada |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O texto usado como `description` do insight não pode ser reaproveitado como item de `recommendations` — cada um dos 3 insights gerados pela IA deve aparecer em exatamente um lugar da UI. 🟢
   - Origem no legado: nenhuma regra formal — comportamento atual é efeito colateral do mapeamento em `dashboard/insights/route.ts`, não uma decisão documentada
   - Tipo: alterada
2. **RN-02:** O admin pode forçar a regeneração do insight sob demanda, respeitando um limite de frequência para controlar custo de chamadas à Anthropic API. 🟡
   - Origem no legado: `_reversa_sdd/domain.md#Insight` já previa "diário, ou sob demanda" — a parte "sob demanda" nunca foi implementada
   - Tipo: nova (completa uma regra que já existia, incompleta)
3. **RN-03:** A UI deve distinguir visualmente um insight gerado por IA (`source: ai_scheduled` ou o novo caminho sob demanda) de um insight de fallback heurístico (`source: fallback_heuristic`) ou de estado vazio (`source: fallback`). 🟢
   - Origem no legado: o campo `source` já existe na resposta do endpoint (`dashboard/insights/route.ts`), mas nunca é lido pelo componente (`AIInsightsCard.tsx` não usa esse campo)
   - Tipo: nova
4. **RN-04:** O CTA "Ver análise completa" navega para uma página nova dedicada a detalhar o insight semanal (não reaproveita `/app/relatorios`, cujo escopo é mensal/estruturado). 🟢
   - Origem no legado: nenhuma — o botão nunca teve destino definido; decisão tomada em `/reversa-clarify` (2026-07-22)
   - Tipo: nova
5. **RN-05:** A regeneração manual do endpoint de insight NÃO pode aceitar texto arbitrário do cliente — precisa rodar a mesma lógica de geração via IA (ou heurística) usada pela function agendada, do lado do servidor. 🟢
   - Origem no legado: `PUT /api/assistant` hoje aceita `{ items: string[] }` direto do corpo da requisição sem validar que veio de uma geração real — como está órfã (nenhum caller), o risco é apenas latente, mas vira relevante ao expor regeneração manual na UI
   - Tipo: alterada

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Corrigir o mapeamento em `GET /api/dashboard/insights` para que nenhum dos 3 insights gerados apareça duplicado entre `description` e `recommendations` | Must | Com 3 insights da IA, `description` mostra um deles e `recommendations` mostra os outros 2, sem repetição | 🟢 |
| RF-02 | Adicionar endpoint de regeneração sob demanda que executa a MESMA lógica de geração (IA real ou heurística de fallback) usada pela function agendada, restrito a `role === admin` da própria org | Must | Admin aciona "Atualizar agora", endpoint roda a geração server-side (sem aceitar texto do cliente) e grava novo `ai_insights` | 🟢 |
| RF-03 | Aplicar rate limit de 1x a cada 24h por org na regeneração manual | Must | Segunda tentativa dentro das 24h retorna erro claro (429 ou mensagem equivalente), sem nova chamada à Anthropic API | 🟢 |
| RF-04 | Expor o campo `source` como indicador visual SÓ quando o insight vier de fallback heurístico ou estado vazio ("silêncio = IA real": nenhum badge quando `source` for `ai_scheduled` ou regeneração manual bem-sucedida) | Should | Card mostra badge de aviso (ex.: "Estimativa automática") apenas quando `source` for `fallback_heuristic`/`fallback`; nenhum badge quando for `ai_scheduled` ou regeneração manual | 🟢 |
| RF-05 | Conectar o CTA "Ver análise completa" a uma página nova dedicada ao detalhamento do insight semanal | Must | Clique no CTA leva à nova página com mais contexto sobre o insight (não a `/app/relatorios`, nem a um botão sem efeito) | 🟢 |
| RF-06 | Dentro da nova página de detalhamento do insight, quando o caminho heurístico apontar departamento/categoria concentrando casos, oferecer link para a lista de casos já filtrada por esse critério | Could | Ao abrir a página de detalhe, há um link que leva à lista de casos filtrada pelo departamento/categoria identificado no insight | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Regeneração manual nunca aceita conteúdo de insight vindo diretamente do cliente — sempre reexecuta a geração no servidor | RN-05; `PUT /api/assistant` hoje aceitaria texto arbitrário se fosse chamado | 🟢 |
| Custo/Desempenho | Rate limit na regeneração manual evita custo descontrolado de tokens da Anthropic API por org | Scheduled function já roda 1x/dia para todas as orgs elegíveis; regeneração manual sem limite multiplicaria chamadas | 🟡 |
| Observabilidade | Toda geração (agendada ou manual) deve logar `orgId`, `source` resultante e contagem de itens gerados, seguindo o padrão já usado em `aiInsights.ts` (`logger.info`/`logger.error`) | Padrão já existe na function agendada, só precisa ser mantido no novo caminho manual | 🟢 |
| Consistência de UX | O estado de carregamento/erro do card (já implementado com `Skeleton` e retry) deve ser reaproveitado para o novo botão de regeneração manual, não criar um segundo padrão visual | `AIInsightsCard.tsx` já tem estados de loading/error/retry funcionais | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Insight sem duplicação de conteúdo
  Dado que a function agendada gerou 3 insights distintos para a org
  Quando o admin abre o dashboard
  Então a descrição do card mostra um dos 3 insights
  E a lista de recomendações mostra os outros 2, sem repetir o da descrição

Cenário: Admin distingue insight real de fallback
  Dado que a org não tem `ai_insights` gerado ainda (nunca rodou a function agendada)
  Quando o admin abre o dashboard
  Então o card exibe o insight heurístico de fallback
  E um indicador visual deixa claro que não é uma análise de IA completa

Cenário: Regeneração manual respeitando rate limit
  Dado que o admin já regenerou o insight manualmente há poucos minutos
  Quando o admin tenta regenerar de novo dentro da janela de limite
  Então o sistema recusa a nova chamada à Anthropic API
  E mostra uma mensagem clara de quando poderá tentar de novo

Cenário: CTA leva a um destino real
  Dado que o card de insight está com dados carregados
  Quando o admin clica em "Ver análise completa"
  Então o admin é levado a uma página com mais contexto sobre o insight
  E essa página não é uma rota inexistente ou um botão sem efeito
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01 | Must | Defeito de dados visível a todo admin que olha o card — mina a credibilidade do insight |
| RF-02 | Must | É o núcleo do valor pedido: "sob demanda" já estava previsto na definição de domínio e nunca foi entregue |
| RF-03 | Must | Sem rate limit, RF-02 vira risco de custo/abuso direto na primeira semana de uso |
| RF-04 | Should | Aumenta confiança percebida sem exigir mudança de arquitetura — o dado (`source`) já existe, só falta expor |
| RF-05 | Must | CTA morto é o sinal mais visível de "insight decorativo" — conectar a algo real muda a percepção do usuário final |
| RF-06 | Could | Valor alto de percepção, mas depende de RF-05 estar resolvido primeiro e de decisão sobre filtros na tela de casos |

## 9. Esclarecimentos

### Sessão 2026-07-22

- **Q:** Destino do CTA "Ver análise completa" no card de insight (RF-05)?
  **R:** Página nova dedicada — cria uma página própria pra detalhar o insight semanal, sem forçar encaixe em `/app/relatorios` (escopo mensal/estruturado, diferente do insight semanal/curto).
- **Q:** Limite de frequência pra regeneração manual do insight (RF-03)?
  **R:** 1x a cada 24h por org — alinhado ao ciclo da function agendada (1x/dia); regeneração manual soma no máximo o dobro de chamadas à Anthropic API por org/dia.
- **Q:** Badge de fonte do insight (RF-04) — aparece em quais estados?
  **R:** Só quando é fallback — "silêncio = IA real" como padrão visual limpo; badge só aparece quando `source` for `fallback_heuristic`/`fallback`.

## 10. Lacunas

Nenhuma pendente. As 3 lacunas da versão inicial foram resolvidas na sessão de `/reversa-clarify` de 2026-07-22 (ver seção 9).

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-07-22 | `/reversa-clarify` resolveu os 3 `[DÚVIDA]` (destino do CTA, rate limit, escopo do badge de fonte) | reversa |
