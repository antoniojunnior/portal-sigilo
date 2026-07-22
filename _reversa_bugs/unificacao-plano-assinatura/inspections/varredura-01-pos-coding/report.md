# Pente-fino: unificacao-plano-assinatura (feature 002-unificar-plano-assinatura)

> Data: 2026-07-21
> Varredura: `varredura-01-pos-coding`
> Gatilho: `/reversa-coding` da feature `002-unificar-plano-assinatura` concluiu 30 de 32 ações (T014 e T025 seguem `[ ]`); inspeção solicitada logo após a execução.
> Método: leitura estática do código real contra a spec efetiva da feature (`requirements.md`, `roadmap.md`, `actions.md`, `data-delta.md`, `interfaces/*.md`) e contra a extração do legado (`_reversa_sdd/`). Nenhuma execução dinâmica (sem emulador, sem sandbox Asaas, sem rodar testes) — ver "O que não foi coberto".

## Mapa da feature

**Specs (spec efetiva):**
- `_reversa_forward/002-unificar-plano-assinatura/requirements.md` (RN-01..11, RF-01..12, RNF)
- `_reversa_forward/002-unificar-plano-assinatura/roadmap.md` (D-01..17)
- `_reversa_forward/002-unificar-plano-assinatura/actions.md` (T001..032)
- `_reversa_forward/002-unificar-plano-assinatura/data-delta.md`, `investigation.md`, `onboarding.md`
- `_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md`, `webhook-asaas.md`, `billing-cancel.md`, `billing-subscription.md`
- Sem adendos vigentes em `_reversa_sdd/addenda/` (feature ainda não convergida via `/reversa-sync`)
- Legado de apoio: `_reversa_sdd/domain.md`, `state-machines.md`, `adrs/003-*.md`, `adrs/005-*.md`, `dashboard/`, `upload-attachment/`, `reports/`, `chat/`, `assistant/`, `checkout/`, `billing/`

**Código (arquivos tocados por `actions.md`, 30/32 ações `[X]`):**
`src/lib/types/index.ts`, `src/lib/planos-config.ts`, `src/lib/planos.ts`, `scripts/reset-and-seed-unico.ts`, `scripts/test-rules.ts`, `src/app/api/assistant/route.ts`, `src/app/api/dashboard/insights/route.ts`, `src/lib/triagem.ts`, `src/app/api/reports/generate/route.ts`, `src/app/api/dashboard/users/route.ts`, `src/app/api/upload-attachment/route.ts`, `firestore.rules`, `src/app/api/checkout/create/route.ts`, `functions/src/aiInsights.ts`, `functions/src/scheduledReports.ts`, `src/app/(dashboard)/app/(protected)/casos/page.tsx`, `.../relatorios/page.tsx`, `.../casos/[caseId]/page.tsx`, `src/lib/asaas/createPaymentLink.ts`, `functions/src/webhookAsaas.ts`, `functions/src/renovarAssinatura.ts`, `src/app/api/billing/cancel/route.ts`, `src/lib/asaas/getSubscription.ts`, `src/app/planos/*`, `docs/PRD_PortalSigilo_v2.md`, `docs/SECURITY.md`, `src/components/ui/Badge.tsx`, `src/components/layout/DashboardHeader.tsx`, `configuracoes/page.tsx`, `configuracoes/faturamento/page.tsx`. Não implementadas: `T014` (validação sandbox Asaas), `T025` (execução manual do `onboarding.md`).

**Testes:** `scripts/test-rules.ts` (Firestore Rules, cobertura parcial — ver achados). Nenhum teste automatizado para Route Handlers ou Cloud Functions desta feature.

**Dados:** Firestore `orgs` (`plano_ativo`, `asaas_customer_id`, `asaas_credit_card_token`, `proxima_cobranca_parcelas`, `renovacao_cancelada`, `ultima_cobranca_ciclo`, `data_renovacao`, `users_count`), `users`, `cases`; `firestore.rules`; API Asaas (`/v3/paymentLinks`, `/v3/payments`, `/v3/customers`, webhook).

**Bugs existentes da feature:** nenhum (primeira varredura, registro criado nesta sessão).

## Achados por lente

### Conformidade com spec

- **F-01** (confiança alta): `createPaymentLink.ts` usa `POST /v3/paymentLinks` (recurso genérico, sem `customer`) em vez de um fluxo de cobrança direta com tokenização, divergindo da arquitetura D-04 e do padrão correto já usado em `renovarAssinatura.ts` (`POST /v3/payments`). `promoted_to: BUG-20260721-K9M2`
- **F-02** (confiança alta): `getPlanoLimit` (Rules) e `PLAN_USER_LIMITS` (Route Handler) tratam `suspenso`/`cancelado` de formas diferentes e ambas erradas frente a RF-12. `promoted_to: BUG-20260721-R4T8`
- **F-03** (confiança alta): `DELETE /api/billing/cancel` mantém o 400 "Nenhuma assinatura vinculada" que D-10/`interfaces/billing-cancel.md` explicitamente revogou. `promoted_to: BUG-20260721-P2W5`
- **F-04** (confiança média-alta): `POST /api/checkout/create` trata `parcelas` como opcional com default silencioso 12; contrato declara obrigatório. `promoted_to: BUG-20260721-N7Q1`
- **F-05** (confiança média): `GET /api/billing/subscription`/`getSubscription.ts` divergem do schema de `interfaces/billing-subscription.md` (`total_parcelas` vs `parcelas`; `subscription_id` ausente no caminho de sucesso). `promoted_to: BUG-20260721-H3X6`
- **F-06** (confiança alta, baixo impacto): `docs/PRD_PortalSigilo_v2.md` §2.2 mantém "Enterprise" como rótulo, mesma classe já corrigida em `SECURITY.md` por D-16, não estendida ao PRD. `promoted_to: BUG-20260721-D8L4`

### Fluxo de dados

- **F-07** (confiança média, mesma causa raiz de F-01): se `asaas_credit_card_token` não for capturado no checkout (F-01), o dado nasce `null` em `orgs` e permanece assim indefinidamente — não há nenhum mecanismo de auto-correção ou alerta quando `renovarAssinatura.ts` encontra `!token` (só suspende a org silenciosamente, sem sinalizar operacionalmente que é um problema sistêmico e não um caso isolado de cliente inadimplente). `promoted_to: null` — dobra sobre F-01, registrada como nota em `BUG-20260721-K9M2`, não como bug separado.

### Contratos e integrações

- Coberto pelos achados F-01, F-03, F-05 acima (mesmo eixo, agrupados em "Conformidade com spec" por já terem causa em desvio de contrato documentado).
- **F-08** (confiança baixa, observação): nenhum tratamento de timeout/retry explícito nas chamadas `fetch` a `api.asaas.com` em `createPaymentLink.ts`, `renovarAssinatura.ts` e `webhookAsaas.ts#buscarDadosCliente` — se a Asaas demorar ou cair, a promise só rejeita pelo timeout padrão do runtime (não configurado). Não é regressão desta feature (mesmo padrão já existia no legado, per `_reversa_sdd/checkout/design.md`), então fica como observação, não bug novo. `promoted_to: null`

### Estados de erro e edge cases

- Coberto por F-02 (suspenso/cancelado) e F-03 (org sem `asaas_customer_id`) acima.
- **F-09** (confiança média): `provisionOrg` em `webhookAsaas.ts` não trata o caso de `payload.payment.customer` existir mas a busca a `buscarDadosCliente` falhar (rede fora, Asaas indisponível) além de usar dados placeholder (`admin-<uuid>@portalsigilo-pending.com`) — a org é criada mesmo assim, com e-mail de acesso não-real, e o e-mail de boas-vindas (com senha temporária) seria enviado para esse endereço inexistente, deixando o cliente pagante sem conseguir logar e sem aviso de operação. Comportamento pré-existente do padrão `provisionOrg`, não introduzido por esta feature — mantido como observação. `promoted_to: null`

### Cobertura de testes

- **F-10** (confiança alta): `scripts/test-rules.ts` só testa o caso positivo de `getPlanoLimit` (plano `unico`, abaixo do limite). Não há teste para o limite atingido (51º usuário) nem para `suspenso`/`cancelado` — exatamente o caso que esconde F-02. Dobrada como evidência em `BUG-20260721-R4T8`, não registrada como bug independente (é a causa de detecção tardia de F-02, não um defeito em si).
- Nenhum teste automatizado cobre `checkout/create`, `billing/cancel`, `billing/subscription`, `createPaymentLink`, `webhookAsaas` ou `renovarAssinatura` — toda a superfície de billing depende inteiramente de `T025` (execução manual do `onboarding.md`), que segue `[ ]`.

### Concorrência e consistência

- **F-11** (confiança baixa, especulativo): `renovarAssinatura.ts` checa `ultima_cobranca_ciclo === anoAtual` para pular a org (idempotência, D-15), mas a leitura do documento e a escrita do novo valor não estão numa transação Firestore — se a mesma function agendada for invocada duas vezes de forma concorrente (retry de infraestrutura do Cloud Scheduler, cenário conhecido e já citado como risco em `interfaces/webhook-asaas.md`), há uma janela teórica onde as duas invocações leem o `ultima_cobranca_ciclo` antigo antes de qualquer uma escrever o novo valor, resultando em cobrança duplicada apesar da checagem existir. Não promovido a bug: é hipótese sem prova estática de caminho causal completo (depende de um cenário de concorrência real que não foi observado nem reproduzido), fica registrado para observação e possível teste de carga futuro. `promoted_to: null`

## Clusters

**Cluster A — Billing/Asaas nunca validado em sandbox (T014 pulada):** `BUG-20260721-K9M2` (endpoint errado no checkout), `BUG-20260721-H3X6` (contrato de resposta divergente), `BUG-20260721-N7Q1` (parcelas opcional) e a observação F-11 (idempotência sem transação) convergem todos no mesmo subsistema (`src/lib/asaas/*`, `functions/src/webhookAsaas.ts`, `functions/src/renovarAssinatura.ts`) e na mesma causa estrutural: `T014`, a única ação marcada 🔴 (risco alto) e explicitamente descrita no roadmap como bloqueante para as ações de billing, nunca foi executada — mas `T015` (que dependia dela) e as demais ações de billing foram implementadas e marcadas `[X]` mesmo assim. `roadmap.md §10` ainda lista, sem marcar, "D-04 validada em sandbox Asaas antes de considerar a feature pronta para produção". Recomendação: tratar `T014` como bloqueante de fato antes de aprofundar o fix de `BUG-20260721-K9M2`, já que a correção certa depende do resultado dessa validação.

**Cluster B — Reaproveitamento de sentinela `null` sem revisar consumidores (D-06):** `BUG-20260721-R4T8` é um caso isolado, mas didático: a simplificação do ternário `entrada/gestao/enterprise` para `suspenso/cancelado ? null : 50` preservou a sintaxe mas inverteu o significado de negócio de `null` (de "tier premium sem limite" para "conta bloqueada"), sem que a Rule consumidora (`create` de `users`) fosse revisada para o novo significado. Vale grep por outros usos de sentinela `null`/`undefined` reaproveitados nesta feature antes de fechar a inspeção como definitiva (não encontrado nenhum outro caso nesta varredura, mas o padrão de risco é real).

## O que não foi coberto

- **Nenhuma execução dinâmica**: sem emulador Firestore rodando, sem sandbox Asaas, sem `npm test`/`npm run build`. Todos os achados são prova estática (leitura de código contra spec), não reprodução observada — refletido em `reproduction.classification: not-reproduced` em todos os 6 bugs.
- **Lentes condicionais não ativadas**: segurança/autorização (F-02 tangencia o tema mas foi tratado como "Estados de erro"/"Conformidade com spec", não como suspeita de bypass de auth — `security_suspected: false` em todos); desempenho (nenhum sinal de N+1/loop custoso além do já documentado como dívida técnica pré-existente em `_reversa_sdd/c4-components.md`); configuração/migrations/flags (sem sinal de drift entre ambientes além da salvaguarda de `scripts/reset-and-seed-unico.ts`, não auditada em detalhe nesta rodada); observabilidade (logs via `logger`/`console.error` presentes nos pontos críticos, não avaliados quanto a alertas/dashboards externos, fora do escopo de código-fonte).
- **`T014` e `T025` não executadas**: por definição, nada que dependa de sandbox Asaas real ou de execução manual ponta a ponta pôde ser confirmado dinamicamente nesta inspeção — ver Cluster A.
- **`scripts/reset-and-seed-unico.ts`**: lido superficialmente (confirmado que a salvaguarda de ambiente existe), não auditado linha a linha quanto à distribuição exata de categorias/estágios pedida por RF-10.

## Resumo de achados

| Lente | Achados | Confiança | Promovido |
|---|---|---|---|
| Conformidade com spec | F-01 a F-06 | alta (F-01,02,03,06), média-alta (F-04), média (F-05) | 6/6 → bugs |
| Fluxo de dados | F-07 | média | observação (nota em K9M2) |
| Contratos e integrações | F-08 | baixa | observação |
| Estados de erro | F-09 | média | observação |
| Cobertura de testes | F-10 | alta | evidência em R4T8 |
| Concorrência | F-11 | baixa | observação |

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Varredura inicial pós-`/reversa-coding`, 6 bugs registrados | reversa |
