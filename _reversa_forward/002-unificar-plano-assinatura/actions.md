# Actions: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Roadmap: `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 25 |
| Paralelizáveis (`[//]`) | 18 |
| Maior cadeia de dependência | 7 (T001 → T002 → T015 → T017 → T018 → T024 → T025) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Atualizar `Plano` para `"unico" \| "suspenso" \| "cancelado"` e `PlanoConfig.id` correspondente; adicionar campos `asaas_credit_card_token: string \| null`, `proxima_cobranca_parcelas: number` e `renovacao_cancelada: boolean` à interface `Org` (D-01, D-04, D-10) | - | `[//]` | `src/lib/types/index.ts` | 🟢 | `[ ]` |
| T002 | Criar `src/lib/planos-config.ts` como fonte única de preço/parcelamento do plano `"unico"` (valor anual 1164, parcelamento máximo 12x, sem juros) (D-12, resolve RF-07) | - | `[//]` | `src/lib/planos-config.ts` | 🟢 | `[ ]` |
| T003 | Consolidar `PLANOS` numa única entrada (`id: "unico"`, `usuarios: 50`, `armazenamento: "2 GB"`, todas as `features` com `disponivel: true`, sem entrada de Enterprise), importando preço/parcelamento de `planos-config.ts` em vez de valor hardcoded (D-08, D-12) | T001, T002 | `[//]` | `src/lib/planos.ts` | 🟢 | `[ ]` |
| T004 | Criar o esqueleto do script de reset+reseed `scripts/reset-and-seed-unico.ts` com salvaguarda explícita de ambiente (recusa rodar sem variável/flag de confirmação de ambiente de teste), sem lógica de dados ainda (D-05, RNF Ambiente) | - | `[//]` | `scripts/reset-and-seed-unico.ts` | 🟢 | `[ ]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Atualizar `scripts/test-rules.ts` com cenário cobrindo `getPlanoLimit` retornando 50 para `plano_ativo = "unico"` | T001 | `[//]` | `scripts/test-rules.ts` | 🟡 | `[ ]` |

## Fase 3, Núcleo — gates, limites e validação de checkout

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Remover o gate `session.plano === "entrada"` em `POST /api/assistant` (D-02) | T001 | `[//]` | `src/app/api/assistant/route.ts` | 🟢 | `[ ]` |
| T007 | Remover o ramo com mensagem fixa de upgrade (menciona "Gestão e Enterprise") em `GET /api/dashboard/insights` (D-02) | T001 | `[//]` | `src/app/api/dashboard/insights/route.ts` | 🟢 | `[ ]` |
| T008 | Remover o early-return `planoAtivo === "entrada"` (triagem manual forçada) em `runTriagem` (D-02) | T001 | `[//]` | `src/lib/triagem.ts` | 🟢 | `[ ]` |
| T009 | Remover a checagem `tipo === "personalizado" && plano === "entrada"` em `POST /api/reports/generate` (D-02) | T001 | `[//]` | `src/app/api/reports/generate/route.ts` | 🟢 | `[ ]` |
| T010 | Colapsar `PLAN_USER_LIMITS` para valor único (50) em `dashboard/users` (GET/POST) — ver `roadmap.md` §5 "Limite de usuários (Route Handler)" (não há Decisão técnica dedicada além do delta arquitetural; D-06 cobre só o lado Firestore Rules) | T001 | `[//]` | `src/app/api/dashboard/users/route.ts` | 🟡 | `[ ]` |
| T011 | Colapsar `STORAGE_LIMITS_BYTES` para valor único (2GB) em `upload-attachment` — ver `roadmap.md` §5 "Limite de storage" (sem Decisão técnica dedicada, apenas delta arquitetural) | T001 | `[//]` | `src/app/api/upload-attachment/route.ts` | 🟡 | `[ ]` |
| T012 | Atualizar `getPlanoLimit` em `firestore.rules` para retornar 50 para qualquer `plano_ativo` diferente de `suspenso`/`cancelado`, atualizando o comentário (D-06) | T001 | `[//]` | `firestore.rules` | 🟡 | `[ ]` |
| T013 | Atualizar `isPlanoValido` em `POST /api/checkout/create` para aceitar apenas `"unico"` e validar novo campo `parcelas` (inteiro 1 a 12); identificadores antigos (`entrada`/`gestao`/`enterprise`) e `parcelas` fora de faixa retornam 400 (D-01; ver `interfaces/checkout-create.md`) | T001 | `[//]` | `src/app/api/checkout/create/route.ts` | 🟢 | `[ ]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | **Validar em sandbox Asaas** se uma cobrança avulsa (`chargeType: INSTALLMENT`, 1 a 12x) retorna `creditCardToken` reutilizável em cobranças futuras sem novo cartão; registrar o resultado real (atualizando `investigation.md`) antes de prosseguir — maior risco técnico da feature (D-04) | - | `[//]` | `_reversa_forward/002-unificar-plano-assinatura/investigation.md` | 🔴 | `[ ]` |
| T015 | Reescrever `createPaymentLink` para criar cobrança avulsa parcelada (`chargeType: "INSTALLMENT"`, `installmentCount` recebido do checkout, `totalValue` importado de `planos-config.ts`) no lugar de `chargeType: "RECURRENT"`, capturando o `creditCardToken` retornado (D-04, D-12) | T002, T014 | - | `src/lib/asaas/createPaymentLink.ts` | 🟡 | `[ ]` |
| T016 | Atualizar `POST /api/checkout/create` para repassar `parcelas` a `createPaymentLink` (ver `interfaces/checkout-create.md`) | T013, T015 | - | `src/app/api/checkout/create/route.ts` | 🟡 | `[ ]` |
| T017 | Atualizar `provisionOrg`: remover `determinarPlano` (D-03), atribuir sempre `plano_ativo: "unico"`, persistir `asaas_credit_card_token`, `proxima_cobranca_parcelas` e `renovacao_cancelada: false` na confirmação de pagamento (D-04) | T001, T015 | - | `functions/src/webhookAsaas.ts` | 🟡 | `[ ]` |
| T018 | Criar a nova Cloud Function agendada (`onSchedule`) de renovação anual: busca orgs com `data_renovacao` igual a hoje **e `renovacao_cancelada === false`**, dispara nova cobrança `INSTALLMENT` usando `asaas_credit_card_token`, atualiza `data_renovacao`; em caso de falha, chama `atualizarPlanoOrg(customerId, "suspenso", "plan_suspended")` (D-04, D-09, D-10) | T017 | - | `functions/src/renovarAssinatura.ts` | 🟡 | `[ ]` |
| T019 | Reescrever `DELETE /api/billing/cancel` para não chamar mais nenhum endpoint de assinatura da Asaas: marca `orgs.plano_ativo = "cancelado"` e `orgs.renovacao_cancelada = true` diretamente, mantém `logAudit("assinatura_cancelada")`; remover o arquivo `src/lib/asaas/cancelSubscription.ts` (sem mais nenhum consumidor) (D-10, corrige A001 do `/reversa-audit`; ver `interfaces/billing-cancel.md`) | T001 | `[//]` | `src/app/api/billing/cancel/route.ts` | 🟡 | `[ ]` |
| T020 | Reescrever `getSubscription.ts` (remove `VALUE_TO_PLANO`, D-03) e `GET /api/billing/subscription` para derivar `valor`/`status` da cobrança mais recente via `getInvoices.ts` e `plano_ativo`/`proximo_vencimento`/`parcelas` de `orgs` no Firestore, em vez de consultar `/v3/subscriptions` (D-11, corrige A002 do `/reversa-audit`; ver `interfaces/billing-subscription.md` e `data-delta.md` §9) | T001 | `[//]` | `src/lib/asaas/getSubscription.ts` | 🟢 | `[ ]` |
| T021 | Implementar a lógica completa do reset+reseed: apagar `orgs`/`users`/`cases` da base de teste e criar 1 org (`plano_ativo: "unico"`, 5 departamentos em `configuracoes.departamentos`), 2 usuários (1 `admin`, 1 `gestor`), 5 a 15 casos distribuídos entre as 11 categorias de `categoria_legal` e os 5 estágios de `Case.status`, cada caso com `triagem_ia.area_risco` igual a um dos 5 departamentos (D-05, RF-10) | T001, T004 | - | `scripts/reset-and-seed-unico.ts` | 🟢 | `[ ]` |
| T022 | Adaptar `BillingToggle.tsx` para seletor de forma de pagamento (à vista / até 12x) e atualizar `page.tsx`/`PlanoCard.tsx` para renderizar 1 oferta única, sem Enterprise (D-07, D-08) | T003 | `[//]` | `src/app/planos/` | 🟢 | `[ ]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T023 | Atualizar `docs/PRD_PortalSigilo_v2.md` §3 (tabela "Planos e limites por tenant") e demais menções a `entrada`/`gestao`/`enterprise` para refletir o plano único (D-08) | T003 | `[//]` | `docs/PRD_PortalSigilo_v2.md` | 🟢 | `[ ]` |
| T024 | Buscar `"enterprise"`, `"subscription_id"`, `getSubscription`, `cancelSubscription` em todo o código-fonte (`grep -rn ... src/ functions/ firestore.rules`) e confirmar/limpar qualquer ocorrência residual não coberta pelas ações anteriores (D-08; risco "Outro contrato dependente de subscription" do `roadmap.md` §9) | T006, T007, T008, T009, T010, T011, T012, T013, T017, T019, T020, T022, T023 | - | n/a (varredura) | 🟡 | `[ ]` |
| T025 | Executar `onboarding.md` passo a passo em ambiente de teste (incluindo rodar T021 duas vezes para confirmar idempotência, simular falha de renovação para validar a suspensão automática de D-09, e validar o fluxo de cancelamento de D-10 e a tela de faturamento de D-11) e registrar o resultado em "Notas de execução" abaixo | T005, T010, T011, T012, T013, T016, T018, T019, T020, T021, T022, T024 | - | n/a (validação manual) | 🟢 | `[ ]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-07-21 | Regeneração completa pós-`/reversa-audit`: novas ações para D-10/D-11/D-12 (T002, T019, T020 novos); campo `renovacao_cancelada` incorporado em T001/T017/T018; corrigidas as citações de decisão em T010/T011 (A004) e o paralelismo indevido entre o esqueleto e a lógica completa do reseed, T004/T021 (A005) | reversa |
