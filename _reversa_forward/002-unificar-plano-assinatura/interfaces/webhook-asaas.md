# Interface: `webhookAsaas` (Firebase Function `onRequest`) + nova function agendada de renovação

> Identificador: `002-unificar-plano-assinatura`
> Contrato: HTTP (webhook Asaas) + agendamento (Cloud Scheduler, novo)
> Origem no legado: `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md`, `functions/src/webhookAsaas.ts`
> 🟡 A Opção A (venda parcelada anual via agendador próprio) foi confirmada pelo dono do negócio (D-04 do `roadmap.md`, 2026-07-21) — este contrato já assume essa arquitetura. Resta apenas validação técnica em sandbox Asaas antes de virar ação em `actions.md`.

## Antes

- Evento `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` → `provisionOrg` (cria org uma vez, idempotente por `asaas_customer_id`) com `plano_ativo = determinarPlano(payload)` (`"entrada"` ou `"gestao"` por faixa de valor)
- Evento `PAYMENT_OVERDUE` → `plano_ativo = "suspenso"`
- Evento `SUBSCRIPTION_CANCELED`/`SUBSCRIPTION_INACTIVATED` → `plano_ativo = "cancelado"`
- Modelo pressupõe 1 evento de pagamento por ciclo (mensal ou anual), gerado automaticamente pela assinatura nativa do Asaas

## Depois (assumindo Opção A)

- `determinarPlano` é removido — toda org provisionada recebe `plano_ativo = "unico"` diretamente
- Evento `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` da **primeira** parcela do primeiro ano → `provisionOrg` (como hoje, idempotente) + persiste `asaas_credit_card_token` (retornado pela Asaas na cobrança) em `orgs.asaas_credit_card_token`
- Evento `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` das parcelas **2 a 12** do mesmo ano → **não deve re-provisionar** (idempotência de `provisionOrg` já cobre isso) nem precisa de tratamento novo além de log informativo — cada parcela é só a confirmação de mais um pagamento da mesma venda parcelada
- Evento `PAYMENT_OVERDUE` de qualquer parcela → continua suspendendo a org (`plano_ativo = "suspenso"`), comportamento preservado
- Evento `PAYMENT_DELETED` → cancelamento da org (`plano_ativo = "cancelado"`), implementado no switch de eventos do webhook como case explícito; cobre remoção manual de cobrança na Asaas
- Evento `SUBSCRIPTION_CANCELED`/`SUBSCRIPTION_INACTIVATED` → deixa de existir neste desenho, já que não há mais objeto `subscription` no Asaas (Opção A usa cobranças avulsas, não assinatura) — cancelamento passaria a ser uma ação explícita no dashboard (`billing/cancel`, já existente) que apenas marca `plano_ativo = "cancelado"` e impede a próxima cobrança agendada de disparar
- **Nova function agendada** (`onSchedule`, primeiro uso desse tipo de trigger no projeto): roda diariamente, busca orgs cujo `data_renovacao` é hoje **e `renovacao_cancelada` é `false`** (campo novo de D-10 — orgs canceladas pelo cliente, ver `interfaces/billing-cancel.md`, são puladas em vez de cobradas), e para as demais dispara uma nova cobrança avulsa usando `orgs.asaas_credit_card_token` — sem pedir cartão novamente. Usa o endpoint `/v3/payments` (não `/v3/paymentLinks`) com `installmentCount` e `installmentValue` (valor de CADA parcela = total / parcelas). A Asaas rejeita `value` (valor total) nesse endpoint com `invalid_installmentValue`. Validado em sandbox. Atualiza `data_renovacao` para o próximo aniversário anual após sucesso.

## ⚠️ Limitação conhecida: parcelamento fixo em 12x

`proxima_cobranca_parcelas` é hardcoded para `12` em `provisionOrg` (`functions/src/webhookAsaas.ts:150`), independentemente da escolha do cliente na tela de pagamento hospedada da Asaas. A Asaas não retorna `installmentCount` no webhook de confirmação de pagamento para cobranças criadas via `/v3/paymentLinks` — portanto o sistema não tem como saber quantas parcelas o cliente escolheu. Toda org é provisionada com 12x.

O fallback em `renovarAssinatura.ts:129` (`?? 12`) mantém consistência: se o campo estiver ausente por qualquer motivo, assume 12x.

**Impacto:** nenhum funcional hoje (o preço total independe do parcelamento). A limitação existe porque a Asaas (sandbox validado) não expõe `installmentCount` no payload do webhook `PAYMENT_CONFIRMED`/`PAKMENT_RECEIVED` quando a cobrança foi gerada via link de pagamento.

## Idempotência e erros

- `provisionOrg` mantém a checagem por `asaas_customer_id` — nenhuma mudança de comportamento aí
- A nova function agendada precisa ser idempotente por org+ciclo (ex.: não disparar duas vezes no mesmo aniversário se rodar mais de uma vez no mesmo dia) — usa o campo `orgs.ultima_cobranca_ciclo` (ano) para essa checagem (D-15 do `roadmap.md`, corrige A003 do `/reversa-audit`, 2ª rodada), análogo ao padrão de idempotência já usado em `provisionOrg`: se `ultima_cobranca_ciclo` já for o ano corrente no momento da execução, a org é pulada nesse disparo
- **Falha ao cobrar a renovação (cartão recusado, token expirado ou qualquer erro ao criar/confirmar a nova cobrança `INSTALLMENT`): suspende o acesso da org imediatamente** (`plano_ativo = "suspenso"`), chamando a mesma função `atualizarPlanoOrg(customerId, "suspenso", "plan_suspended")` já usada hoje para o evento `PAYMENT_OVERDUE` — decisão confirmada pelo dono do negócio em 2026-07-21 (D-09 do `roadmap.md`). Não há retentativa automática nem período de carência; a primeira falha confirmada já suspende
