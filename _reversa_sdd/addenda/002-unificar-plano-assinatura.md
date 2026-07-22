# Adendo: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Cenário: `legado`
> Âncora: `_reversa_sdd/architecture.md`, `_reversa_sdd/domain.md`

## Vigência

Vigente desde 2026-07-21.

## Resumo da entrega

Substituição do modelo comercial de três planos (`entrada`, `gestao`, `enterprise`) por um único plano de assinatura (`"unico"`), eliminando todos os gates de feature por plano, unificando limites de usuários (50) e armazenamento (2GB), e migrando a arquitetura de cobrança de assinatura recorrente nativa Asaas para cobranças avulsas parceladas anuais via Cloud Function agendada. 28 de 32 ações concluídas; T014 (validação em sandbox Asaas) e T025 (onboarding manual) pendentes de execução manual.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `architecture.md` | "Gate de features por plano" | `regra-removida` | A linha "Checagem de `session.plano`/`role` no servidor em cada rota relevante" deixa de ser verdade — os 4 gates de API (assistant, insights, triagem, reports) foram removidos. Ver `legacy-impact.md` da feature. |
| `architecture.md` | "Cobrança recorrente" | `delta-de-contrato-externo` | A arquitetura mudou de assinatura recorrente Asaas (`RECURRENT`) para cobranças avulsas parceladas (`INSTALLMENT`) com tokenização de cartão, acionadas por uma nova Cloud Function agendada (`onSchedule`). Ver `legacy-impact.md` § "Cobrança". |
| `architecture.md` | Componente "Firebase Functions" | `componente-novo` | Nova function `renovarAssinatura` (`onSchedule`, primeiro uso deste trigger no projeto) introduzida para renovação anual. Ver `legacy-impact.md`. |
| `domain.md` | "Planos são gates de feature" | `regra-removida` | Substituída por "toda org com assinatura ativa tem acesso pleno a todas as features de IA" (RN-01). |
| `domain.md` | `VALUE_TO_PLANO` | `regra-removida` | O mapeamento de valor pago → identificador de plano deixa de existir. Toda assinatura confirmada resolve para `"unico"` (RN-02). |
| `domain.md` | Limite de usuários por plano (1/10/∞) | `regra-alterada` | Colapsado para valor único 50, aplicado no Route Handler e nas Firestore Rules (RN-03). |
| `domain.md` | Limite de armazenamento por plano (2GB/20GB/∞) | `regra-alterada` | Colapsado para valor único 2GB (RN-04). |
| `domain.md` | Relatório "personalizado" requer plano ≥ gestão | `regra-removida` | Disponível a toda org com assinatura ativa (RN-05). |
| `domain.md` | Triagem automática desabilitada no plano entrada | `regra-removida` | Toda org ativa recebe triagem por IA (RN-06). |
| `domain.md` | Plano `enterprise` como camada separada | `regra-removida` | Todas as referências ao identificador `"enterprise"` foram removidas do código e documentação (RN-09). |
| `domain.md` | Estados `suspenso`/`cancelado` | `preservada` | Continuam inalterados — a unificação elimina a dimensão "qual plano", não o ciclo de vida da assinatura (RN-10). |
| `checkout/design.md` | Divergência `PLANOS_CONFIG` × `src/lib/planos.ts` | `regra-alterada` | Resolvida com `src/lib/planos-config.ts` como fonte única de preço (RF-07, D-12). |
| `checkout/design.md` | `isPlanoValido` aceita `entrada`/`gestao` | `regra-alterada` | Agora aceita apenas `"unico"` + campo `parcelas` (inteiro 1-12) (RN-07). |
| `billing/design.md` | `getSubscription` consulta `/v3/subscriptions` | `delta-de-contrato-externo` | Agora deriva dados de Firestore (`orgs`) + `getInvoices.ts`; `subscription_id` deixa de existir (D-11). |
| `billing/design.md` | `cancelSubscription` chama Asaas | `componente-extinto` | Arquivo removido; cancelamento opera apenas sobre Firestore (D-10). |
| `firestore.rules` | `getPlanoLimit` | `regra-alterada` | Retorna 50 fixo para qualquer `plano_ativo` não `suspenso`/`cancelado` (D-06). |
| `data-dictionary.md` | `orgs.plano_ativo` | `regra-alterada` | Tipo colapsa para `"unico" \| "suspenso" \| "cancelado"`; 4 novos campos em `Org` (D-04, D-10, D-15). |
| `data-dictionary.md` | `orgs` — divergência #4 | `regra-alterada` | Resolvida: tipo declarado agora coincide com valores observados. |
| `adrs/003-asaas-webhook-provisionamento-automatico.md` | `determinarPlano` | `regra-removida` | Função removida; `provisionOrg` atribui sempre `plano_ativo: "unico"` (D-03). |
| `adrs/003-*.md` | Eventos `SUBSCRIPTION_CANCELED`/`SUBSCRIPTION_INACTIVATED` | `delta-de-contrato-externo` | Substituídos por `PAYMENT_DELETED` na nova arquitetura de cobranças avulsas. |
| `dashboard/requirements.md` §RF-07 | `PLAN_USER_LIMITS` | `regra-alterada` | Colapsado para `{ unico: 50 }`. |
| `upload-attachment/requirements.md` | `STORAGE_LIMITS_BYTES` | `regra-alterada` | Colapsado para `{ unico: 2GB }`. |
| `reports/requirements.md` | Gate de relatório personalizado | `regra-removida` | Checagem `tipo === "personalizado" && plano === "entrada"` removida. |
| `chat/requirements.md` | Early-return `planoAtivo === "entrada"` em `runTriagem` | `regra-removida` | Removido; toda org recebe triagem IA. |
| `assistant/requirements.md` | Gate `plano === "entrada"` na rota | `regra-removida` | Removido; assistente disponível para toda org ativa. |

## Regras sob vigilância

W001–W018 em `_reversa_forward/002-unificar-plano-assinatura/regression-watch.md`. Destaque:

- **W004** (`cancelSubscription.ts` não existe — confirmado na varredura T024)
- **W006** (`getPlanoLimit` retorna 50 — verificado em `firestore.rules`)
- **W009** (filtros de `aiInsights.ts`/`scheduledReports.ts` trocados para `"unico"` — confirmado)
- **W018** (nenhum gate de UI por `plano === "entrada"` — confirmado pela varredura T024)

## Fontes

- `_reversa_forward/002-unificar-plano-assinatura/legacy-impact.md`
- `_reversa_forward/002-unificar-plano-assinatura/regression-watch.md`
- `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
- `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`
- `_reversa_forward/002-unificar-plano-assinatura/progress.jsonl` (28 ações concluídas)
