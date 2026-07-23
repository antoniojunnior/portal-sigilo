# Onboarding: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22
> Para: humano testando a feature pela primeira vez após `/reversa-coding`

## Pré-requisitos

- `.env.local` com `ANTHROPIC_API_KEY` válida (mesma variável já usada por `/api/assistant`)
- Uma org com `plano_ativo: "unico"` e ao menos alguns documentos em `cases` (pra sair do caminho "nenhum caso registrado")
- Sessão de admin dessa org (`role: "admin"`)

## Passo a passo

### 1. Dedupe do insight (RF-01)

1. Force `orgs/{orgId}.ai_insights` a ter 3 itens distintos (ou aguarde a próxima geração real)
2. Abra `/app` logado como admin
3. Confira: a descrição do card mostra um dos 3 insights; a lista de recomendações mostra os OUTROS 2 — nenhum texto repetido entre as duas áreas

### 2. Badge de fonte só em fallback (RF-04)

1. Com `ai_insights` presente (caminho "IA real"): confira que NENHUM badge de fonte aparece no card
2. Apague `ai_insights` do documento da org (ou use uma org nova sem geração ainda) e recarregue `/app`: confira que aparece o caminho de fallback heurístico E um badge indicando que não é análise de IA completa

### 3. Regeneração manual + rate limit (RF-02, RF-03)

1. No card, clique em "Atualizar agora" (ou botão equivalente)
2. Confira que uma nova chamada real à Anthropic API acontece (log do servidor, ou os 3 insights mudam de texto)
3. Clique em "Atualizar agora" de novo, imediatamente
4. Confira que a segunda tentativa é recusada com mensagem clara de rate limit (24h), SEM nova chamada à Anthropic API

### 4. CTA leva à página nova (RF-05)

1. Com o card carregado, clique em "Ver análise completa"
2. Confira que a navegação leva à nova página dedicada `/app/insights` (não a `/app/relatorios`, não fica parado na mesma tela)
3. Confira que a página nova mostra o insight completo, sem truncamento

### 5. (Se RF-06 entrar no escopo do `/reversa-to-do`) Link filtrado por departamento/categoria

1. Na página `/app/insights`, com um insight do caminho heurístico (departamento/categoria concentrando casos)
2. Confira que há um link pra lista de casos já filtrada por esse departamento/categoria

## O que NÃO testar aqui (fora do escopo desta feature)

- `PUT /api/assistant` continua existindo como está (órfão) — não precisa de teste novo, RN-05 é satisfeita pelo endpoint novo (D-01), não por mudança nesse `PUT`
- Geração agendada (`generateDailyInsights`) — comportamento inalterado, já coberto pela feature 002

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
