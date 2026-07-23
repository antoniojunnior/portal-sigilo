# Investigation: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22

## Pesquisa de fundo

Toda a investigação desta feature foi leitura direta do código já em produção, sem pesquisa externa — não há biblioteca nova nem padrão de mercado a avaliar, é um refinamento cirúrgico sobre uma funcionalidade que já existe e já funciona.

## O que foi lido nesta sessão

| Arquivo | O que confirmou |
|---------|------------------|
| `functions/src/aiInsights.ts` | Scheduled function `generateDailyInsights`, 07h BRT, filtra `orgs` por `plano_ativo == "unico"`, chama `claude-sonnet-4-6` com prompt fixo pedindo exatamente 3 insights curtos em JSON, grava `{items, gerado_em}` em `orgs.ai_insights` |
| `src/app/api/dashboard/insights/route.ts` | Lê `ai_insights.items` se existir (`source: "ai_scheduled"`); senão roda heurística local sobre `cases` (top departamento/categoria, contagem da semana) sem chamar Claude (`source: "fallback_heuristic"` ou `"fallback"` se não há casos) |
| `src/components/ui/AIInsightsCard.tsx` | Renderiza `summary`/`highlight`/`description`/`recommendations`; botão "Ver análise completa" sem `href`/`onClick`; nenhum uso do campo `source` |
| `src/app/api/assistant/route.ts` (função `PUT`) | Endpoint órfão (nenhum caller no frontend, confirmado via grep), aceita `{items: string[]}` direto do corpo — não valida que veio de geração real |
| `src/app/api/dashboard/cases/route.ts` | Filtros disponíveis hoje: `status`, `urgency`, `channel`, `protocol`, `dateFrom`/`dateTo`, paginação, ordenação — sem `department`/`category` (relevante para RF-06) |
| `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx` | Padrão de página de detalhe já estabelecido no projeto: `useSWR` + `DashboardHeader` + `Skeleton` + `useRouter` — reaproveitado como referência de estilo pra página nova (D-04) |
| `_reversa_sdd/architecture.md#Camadas` | Confirma que Route Handlers (Next.js, mesmo deploy) e Firebase Functions (deploy separado) são runtimes distintos — motivou D-01 (duplicar lógica em vez de compartilhar) |

## Alternativas avaliadas

1. **Compartilhar lógica de geração entre Route Handler e Firebase Function via lib comum** — descartada por exigir refactor cross-project (dois `tsconfig`/builds diferentes) fora do escopo de uma feature de refinamento de UX. Ver D-01 no `roadmap.md`.
2. **Regeneração manual chamando a function agendada via HTTP** — descartada por adicionar uma camada de invocação entre runtimes pra um caso de uso que não precisa disso.
3. **Reaproveitar `/app/relatorios` como destino do CTA** — descartada no `/reversa-clarify` (usuário escolheu página nova dedicada) por desalinhamento de escopo (mensal/estruturado vs semanal/curto).
4. **Novo campo Firestore pra controlar rate limit da regeneração manual** — descartado (D-02), `ai_insights.gerado_em` já responde "quando foi a última geração".

## Padrões aplicáveis do próprio projeto

- Rate limiting por comparação de timestamp já é o padrão implícito usado em `renovarAssinatura.ts` (campo `ultima_cobranca_ciclo`, feature 002) — mesma técnica (comparar timestamp gravado vs `Date.now()`) reaproveitada aqui para `ai_insights.gerado_em` (D-02), sem inventar mecanismo novo.
- Estados de loading/error/retry do `AIInsightsCard.tsx` já seguem o padrão usado em outros componentes do dashboard (`Skeleton`, mensagem de erro com botão de retry) — reaproveitado sem modificação estrutural.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
