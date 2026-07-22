# Adendo: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-22`
> Cenário: `legado`

## Vigência

Vigente desde 2026-07-22.

## Resumo da entrega

Substituir o modelo comercial anterior (planos `entrada`, `gestao`, `enterprise`) por um único plano `"unico"`, eliminando toda diferenciação de acesso a features de IA, limites de uso e preço. 30 ações do `actions.md` concluídas (T001–T013, T015–T024, T026–T032) + 8 bugs corrigidos e fechados. T014 (validação sandbox Asaas) e T025 (onboarding manual) permanecem pendentes como validação manual.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `architecture.md` | "Como o sistema resolve seus requisitos centrais" — Gate de features por plano | `regra-alterada` | A linha "Gate de features por plano: checagem de session.plano no servidor" deve ser lida como "não há mais gate por plano — toda org ativa tem acesso pleno" |
| `architecture.md` | "Riscos arquiteturais" #5 — Ciclo de vida de plano incompleto | `regra-removida` | Risco #5 não se aplica mais (plano único elimina upgrade/downgrade/reativação como problema) |
| `domain.md` | Glossário — "Plano" | `regra-alterada` | `entrada \| gestao \| enterprise (+ suspenso/cancelado)` → `"unico" \| "suspenso" \| "cancelado"` |
| `domain.md` | "Planos são gates de feature aplicados no servidor" | `regra-alterada` | Substituída por "toda org com assinatura ativa tem acesso pleno a todas as features" |
| `domain.md` | "Divergência entre SECURITY.md (S7/S8) e implementação real" | `regra-removida` | Lacuna 🔴 permanece mas não está mais associada a tier de plano |
| `checkout/design.md` | Fonte de preço duplicada | `regra-alterada` | Criado `src/lib/planos-config.ts` como fonte única (RF-07) |
| `billing/design.md` | `VALUE_TO_PLANO` mapeia valor pago → plano | `regra-removida` | Toda assinatura resolve para `"unico"`; `getSubscription.ts` não consulta mais `/v3/subscriptions` |
| `billing/design.md` | Arquitetura de cobrança recorrente Asaas | `delta-de-contrato-externo` | `RECURRENT` → `INSTALLMENT` (cobrança avulsa parcelada); nova function `renovarAssinatura.ts` (`onSchedule`) gerencia renovação anual |
| `checkout/requirements.md` | Validação de plano no checkout | `regra-alterada` | Aceita apenas `"unico"`; campo `ciclo` substituído por `parcelas` (1 a 12) |
| `dashboard/requirements.md` | Limite de usuários por plano | `regra-alterada` | Colapsado para 50 único; `PLAN_USER_LIMITS` só tem chave `"unico"` |
| `dashboard/requirements.md` | Gate de mapa de risco por plano | `regra-removida` | Disponível a toda org ativa |
| `dashboard/design.md` | Gate `plano === "gestao"` para mapa de risco | `regra-removida` | Não há mais diferenciação |
| `assistant/requirements.md` | Assistente IA bloqueado no plano entrada | `regra-removida` | Disponível a toda org ativa |
| `chat/requirements.md` | Triagem automática desabilitada no plano entrada | `regra-removida` | Disponível a toda org ativa |
| `reports/requirements.md` | Relatório personalizado exige plano ≥ gestão | `regra-removida` | Disponível a toda org ativa |
| `upload-attachment/requirements.md` | Limite de storage por plano | `regra-alterada` | Colapsado para 2GB único |
| `adrs/003-asaas-webhook-provisionamento-automatico.md` | `determinarPlano` decide plano por faixa de valor | `regra-removida` | Webhook atribui `plano_ativo: "unico"` diretamente |
| `adrs/005-verificacao-redundante-alem-das-firestore-rules.md` | Duas camadas de limite de usuários | `regra-alterada` | Mantida, mas `getPlanoLimit` retorna 0 para suspenso/cancelado (correção BUG-R4T8) |
| `firestore.rules` (extração) | `getPlanoLimit` | `regra-alterada` | Retorna 50 fixo (não `null`) para qualquer `plano_ativo` não suspenso/cancelado; retorna 0 para suspenso/cancelado |
| `state-machines.md` | Estados de `Org.plano_ativo` | `regra-alterada` | `entrada \| gestao \| enterprise \| suspenso \| cancelado` → `unico \| suspenso \| cancelado` |
| `data-dictionary.md` | Campo `orgs.plano_ativo` | `regra-alterada` | Valores possíveis reduzidos para 3 |
| `permissions.md` | Matriz RBAC — gates de feature por plano | `regra-removida` | Não há mais restrição de feature por plano |
| `ui/Badge.tsx` (componentes) | `variant="plan"` e constantes associadas | `componente-extinto` | `PlanValue`, `PLAN_STYLES`, `PLAN_LABELS` removidos |
| `DashboardHeader.tsx` | `PLANO_BADGE` | `regra-alterada` | 5 chaves → 3 (estado de ciclo de vida, não tier) |

## Regras sob vigilância

W001, W002, W003, W004, W005, W006, W007, W008, W009, W010, W011, W012, W013, W014, W015, W016, W017, W018, W019, W020, W021 — ver `_reversa_forward/002-unificar-plano-assinatura/regression-watch.md`.

## Fontes

- `_reversa_forward/002-unificar-plano-assinatura/legacy-impact.md`
- `_reversa_forward/002-unificar-plano-assinatura/regression-watch.md`
- `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
- `_reversa_forward/002-unificar-plano-assinatura/progress.jsonl` (36 itens concluídos)
- `_reversa_forward/002-unificar-plano-assinatura/actions.md` (30/32 ações `[X]`, 2 `[ ]` pendentes)

## Atualização 2026-07-22

`T014` e `T025` fechados — `actions.md` agora com **32/32 ações `[X]`**, entrega completa. Detalhe da validação em `actions.md` §"Notas de execução" e `investigation.md`.

Impactos adicionais em relação à versão original deste adendo (achados durante a validação de ponta a ponta, fora do `legacy-impact.md` original):

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `functions/src/index.ts` | Registro de Cloud Functions | `componente-novo` | `renovarAssinatura` (criada por T018) não estava exportada — a function nunca seria implantada; corrigido |
| `billing/design.md` | Consulta de assinatura (tela de faturamento) | `regra-alterada` | `getSubscription` muda de assinatura: recebe `orgId` (não `customerId`); `firestoreFallback()` duplicado na rota removido, elimina o caminho que mascarava a correção original de D-11 |
| `docs/PRD_PortalSigilo_v2.md` | §8.2 Controle de limites por plano | `regra-alterada` | Reescrita para não contradizer as demais seções sobre gates de IA já removidos |
| (fora do escopo desta feature) | Modelo Claude hardcoded em 4 arquivos (`assistant`, `reports/generate`, `aiInsights`, `scheduledReports`) | `regra-alterada` | `claude-sonnet-4-20250514` (404) → `claude-sonnet-4-6`; bug pré-existente, não relacionado à unificação de planos, encontrado durante validação real com a Anthropic API |

Validação real registrada: cobrança/tokenização confirmada em sandbox Asaas (2 chamadas reais, `creditCardToken` reutilizável), reset+reseed idempotente (2 execuções contra Firebase Emulator), limites e gates de UI (`npm run test:rules` 13/13, grep), cancelamento/faturamento (`npm run test:billing-fixes` 3/3 contra Firestore real), features de IA validadas com resposta real da Anthropic API (protocolo `ETK-2026-2JTKD8`).

Não verificado nesta rodada (recomendado antes de produção real): renderização visual da página `/planos` e dos badges de estado (D-14) num navegador; disparo manual de `generateDailyInsights`/`generateMonthlyReports` (D-13); simulação de invocação concorrente da function de renovação no mesmo dia (idempotência D-15, `ultima_cobranca_ciclo`) — a lógica foi revisada em código, não exercitada sob concorrência real.

Fonte adicional: commit `70dbd47` ("fix: bugs criticos encontrados rodando onboarding.md de ponta a ponta contra emuladores + sandbox real").
