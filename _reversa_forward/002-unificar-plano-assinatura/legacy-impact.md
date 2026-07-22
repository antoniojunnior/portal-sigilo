# Legacy Impact: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Componentes afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/lib/types/index.ts` | Tipos de domínio | `regra-alterada` | HIGH | `Plano` colapsa de 3 identificadores para 1 (`"unico"`); 4 novos campos em `Org` para suporte à cobrança anual parcelada |
| `src/lib/planos-config.ts` | Config de planos | `componente-novo` | MEDIUM | Fonte única de preço/parcelamento (resolução de RF-07) |
| `src/lib/planos.ts` | Config de planos (UI) | `regra-alterada` | HIGH | 3 planos → 1 único; preços/limites consolidados |
| `src/lib/asaas/createPaymentLink.ts` | Cobrança Asaas | `delta-de-contrato-externo` | HIGH | `RECURRENT` → `INSTALLMENT`; assinatura nativa abandonada |
| `src/lib/asaas/getSubscription.ts` | Cobrança Asaas | `delta-de-contrato-externo` | HIGH | Fonte muda de Asaas `/v3/subscriptions` → Firestore + `getInvoices` |
| `src/lib/asaas/cancelSubscription.ts` | Cobrança Asaas | `componente-extinto` | MEDIUM | Sem assinatura nativa, não há o que cancelar na Asaas |
| `src/app/api/checkout/create/route.ts` | Checkout | `regra-alterada` | HIGH | Validação de `plano` muda; `ciclo` substituído por `parcelas` |
| `src/app/api/billing/cancel/route.ts` | Cancelamento | `delta-de-contrato-externo` | HIGH | Deixa de chamar Asaas; opera só sobre Firestore |
| `src/app/api/assistant/route.ts` | Assistente IA | `regra-removida` | MEDIUM | Gate `plano === "entrada"` removido |
| `src/app/api/dashboard/insights/route.ts` | Insights IA | `regra-removida` | MEDIUM | Gate `plano === "entrada"` + mensagem fixa de upgrade removidos |
| `src/lib/triagem.ts` | Triagem IA | `regra-removida` | MEDIUM | Early-return `planoAtivo === "entrada"` removido |
| `src/app/api/reports/generate/route.ts` | Relatórios | `regra-removida` | MEDIUM | Gate `personalizado && entrada` removido |
| `src/app/api/dashboard/users/route.ts` | Limite de usuários | `regra-alterada` | MEDIUM | `PLAN_USER_LIMITS` colapsado para 50 |
| `src/app/api/upload-attachment/route.ts` | Limite de storage | `regra-alterada` | MEDIUM | `STORAGE_LIMITS_BYTES` colapsado para 2GB |
| `firestore.rules` | Regras de segurança | `regra-alterada` | HIGH | `getPlanoLimit` retorna 50 fixo |
| `functions/src/webhookAsaas.ts` | Webhook Asaas | `delta-de-contrato-externo` | HIGH | `determinarPlano` removido; eventos de subscription substituídos por pagamentos avulsos |
| `functions/src/renovarAssinatura.ts` | Renovação anual | `componente-novo` | HIGH | Primeiro uso de `onSchedule` no projeto; cobrança anual com idempotência |
| `functions/src/aiInsights.ts` | Insights agendados | `regra-alterada` | HIGH | Filtro `plano_ativo in ["gestao","enterprise"]` → `"unico"` |
| `functions/src/scheduledReports.ts` | Relatórios agendados | `regra-alterada` | HIGH | Filtro `plano_ativo in ["gestao","enterprise"]` → `"unico"` |
| `src/app/planos/BillingToggle.tsx` | UI Planos | `componente-alterado` | LOW | Toggle mensal/anual → seletor de parcelamento |
| `src/app/planos/PlanoCard.tsx` | UI Planos | `regra-alterada` | LOW | 3 cards comparativos → 1 card único |
| `src/app/planos/page.tsx` | UI Planos | `regra-alterada` | LOW | Grid de 3 colunas → single column |
| `src/components/ui/Badge.tsx` | UI | `componente-removido` | LOW | `PlanValue`/`PLAN_STYLES`/`PLAN_LABELS`/`variant="plan"` removidos |
| `src/components/layout/DashboardHeader.tsx` | UI | `regra-alterada` | LOW | `PLANO_BADGE` de 5 chaves → 3 (estado, não tier) |
| `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` | UI Configurações | `regra-alterada` | LOW | `PLANO_LABELS` colapsado; ternário descritivo removido |
| `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | UI Faturamento | `regra-alterada` | LOW | `PLANO_LABELS` de 4 chaves → 3 |
| `src/app/(dashboard)/app/(protected)/casos/page.tsx` | UI Casos | `regra-removida` | LOW | Gate de CSV por plano removido |
| `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx` | UI Detalhe do caso | `regra-removida` | LOW | Bloqueio do assistente IA por plano removido |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | UI Relatórios | `regra-removida` | LOW | `PlanGate` + bloqueio de página por plano removidos |
| `scripts/reset-and-seed-unico.ts` | Scripts | `componente-novo` | MEDIUM | Substitui seed de 2 orgs multi-plano por 1 org plano único |
| `scripts/test-rules.ts` | Testes | `regra-alterada` | LOW | Novo cenário de `getPlanoLimit` para `"unico"` |
| `docs/PRD_PortalSigilo_v2.md` | Documentação | `regra-alterada` | LOW | Tabela de planos reescrita |
| `docs/SECURITY.md` | Documentação | `regra-alterada` | LOW | Título S4 sem "(Enterprise)" |
| `functions/src/renovarAssinatura.ts` | Renovação anual | `regra-alterada` | LOW | Adicionado commentário apontando fonte canônica do preço (resolução de A001 do `/reversa-audit`) |
| `src/components/ui/Badge.tsx` | UI | `regra-alterada` | LOW | Comentário JSDoc corrigido (removido "subscription plan", resolução de A006 do `/reversa-audit`) |
| `interfaces/checkout-create.md` | Documentação de contrato | `regra-alterada` | LOW | Contrato externo corrigido para nomes reais dos campos Asaas (resolução de A003 do `/reversa-audit`) |
| `interfaces/webhook-asaas.md` | Documentação de contrato | `regra-alterada` | LOW | Documentado `PAYMENT_DELETED`, endpoint `/v3/payments` da renovação, e limitação do parcelamento fixo (resolução de A003/A004/A005 do `/reversa-audit`) |

## Diff conceitual por componente

### Plano e tipos de domínio
O tipo `Plano` colapsa de `"entrada" | "gestao" | "enterprise"` para `"unico" | "suspenso" | "cancelado"`, alinhando-se ao estado real observado em `orgs.plano_ativo` (resolve divergência #4 do data-dictionary). `PlanoConfig.id` acompanha. `Org` ganha 4 campos para a nova arquitetura de cobrança anual parcelada: `asaas_credit_card_token`, `proxima_cobranca_parcelas`, `renovacao_cancelada`, `ultima_cobranca_ciclo`.

### Cobrança
A arquitetura de cobrança muda radicalmente: de assinatura recorrente nativa Asaas (`RECURRENT`) para cobranças avulsas parceladas (`INSTALLMENT`) disparadas por uma Cloud Function agendada (`onSchedule`). O webhook de pagamento simplifica: remove `determinarPlano`, remove eventos de subscription, opera apenas sobre pagamentos. `cancelSubscription.ts` é removido — cancelamento passa a ser apenas marcação no Firestore. `getSubscription.ts` deixa de consultar `/v3/subscriptions` Asaas e passa a derivar dados do Firestore + `getInvoices.ts`.

### Gates de feature por plano
Todos os 6 gates de feature no backend (`assistant`, `insights`, `triagem`, `reports/generate`) e 3 gates de UI (`casos/page.tsx` CSV, `relatorios/page.tsx` bloqueio de página, `casos/[caseId]/page.tsx` cadeado do assistente) são removidos. A regra "planos são gates de feature" do `domain.md` é substituída por "toda org com assinatura ativa tem acesso pleno".

### Limites
`PLAN_USER_LIMITS` (Route Handler) e `getPlanoLimit` (Firestore Rules) colapsam para valor único 50. `STORAGE_LIMITS_BYTES` colapsa para 2GB.

### Functions agendadas
Filtros de elegibilidade em `aiInsights.ts` e `scheduledReports.ts` trocam de `plano_ativo in ["gestao","enterprise"]` para `"unico"`. Nova function `renovarAssinatura.ts` introduz `onSchedule` como novo tipo de trigger no projeto.

### Correções pós-auditoria (4ª rodada — A001 a A006)

| ID | Severidade | O quê | Como foi resolvido |
|----|-----------|-------|-------------------|
| A001 | MEDIUM | Preço 1164 duplicado em `renovarAssinatura.ts` sem referência à fonte canônica | Adicionado comentário `CANONICAL: src/lib/planos-config.ts` apontando a fonte única — aceito como limitação arquitetural (pacotes separados `src/` e `functions/` não compartilham imports) |
| A002 | MEDIUM | Branch morto com string "Enterprise" em `casos/page.tsx` | `else` inteiro removido; `canExportCSV` eliminado por ser sempre `true`; botão de exportação renderizado diretamente |
| A003 | MEDIUM | `interfaces/checkout-create.md` e `webhook-asaas.md` com nomes de campo Asaas errados | Atualizados: `installmentCount` → `maxInstallmentCount` em `/v3/paymentLinks`; documentado `/v3/payments` com `installmentValue` na renovação |
| A004 | LOW | Evento `PAYMENT_DELETED` não documentado | Adicionado à seção "Depois" de `webhook-asaas.md` |
| A005 | LOW | `proxima_cobranca_parcelas` hardcoded para 12 sem documentação | Documentada a limitação em nova seção "⚠️ Limitação conhecida" em `webhook-asaas.md` |
| A006 | LOW | Comentário "subscription plan" obsoleto em `Badge.tsx` | JSDoc corrigido para "case status, and channel origin" |

## Preservadas

Regras do `_reversa_sdd/domain.md` que continuam intactas:

- 🟢 Estados `suspenso` e `cancelado` de `Org.plano_ativo` continuam existindo — apenas o ciclo de vida de assinatura, não afetado pela unificação (RN-10)
- 🟢 `audit_logs` permanecem imutáveis (regra S6)
- 🟢 `org_id` obrigatório em todo documento (regra S3)
- 🟢 `conversation_id` = SHA-256 do número (regra S2)
- 🟢 Gestores em `mencionados[]` não acessam o caso (regra S5)
- 🟢 Checagem redundante de limites (Route Handler + Firestore Rules) preservada (ADR-005)

## Modificadas

Regras que foram alteradas ou removidas:

- 🟢 "Planos são gates de feature aplicados no servidor, nunca só no client" — **substituída**: não há mais diferenciação de acesso a feature por plano (RN-01)
- 🟢 `VALUE_TO_PLANO` mapeia valor pago → identificador de plano — **removida**: toda assinatura resolve para `"unico"` (RN-02)
- 🟢 Limite de usuários por plano (1/10/∞) — **alterada**: valor único 50 (RN-03)
- 🟢 Limite de armazenamento por plano (2GB/20GB/∞) — **alterada**: valor único 2GB (RN-04)
- 🟢 Relatório tipo "personalizado" exige plano ≥ gestão — **removida**: disponível a toda org ativa (RN-05)
- 🟢 Triagem automática desabilitada no plano entrada — **removida**: toda org ativa recebe triagem IA (RN-06)
- 🟢 Checkout aceita `entrada`/`gestao` — **alterada**: aceita apenas `"unico"` + `parcelas` (RN-07)
- 🟢 Ciclo de cobrança mensal/anual — **alterada**: apenas anual com parcelamento (RN-08)
- 🟢 Plano `enterprise` como camada separada — **removida**: todas as referências eliminadas (RN-09)

## Validação (T014, T025 — 2026-07-22)

Nenhum componente novo impactado por esta rodada (T014/T025 são ações de validação, não de código). Confirmado contra ambiente real: cobrança/tokenização Asaas (sandbox), reset+reseed idempotente (Firebase Emulator), limites e gates de UI (Firestore Emulator + grep), cancelamento/faturamento (Firestore real), features de IA (chamada real à Anthropic API). Detalhe em `actions.md` §"Notas de execução".
