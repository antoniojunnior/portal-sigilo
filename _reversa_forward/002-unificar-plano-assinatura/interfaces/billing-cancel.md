# Interface: `DELETE /api/billing/cancel`

> Identificador: `002-unificar-plano-assinatura`
> Contrato: HTTP
> Origem: achado do `/reversa-audit` (A001, CRITICAL) — não existia como `interfaces/` na primeira versão deste roadmap, porque `requirements.md` RF-12 assumia (incorretamente) que a rota não precisaria mudar

## Antes

```
DELETE /api/billing/cancel

1. Busca orgs.asaas_customer_id da sessão
2. getSubscription(customerId) → precisa de subscription_id
3. cancelSubscription(subscription_id) → DELETE /v3/subscriptions/{id} na Asaas
4. orgs.plano_ativo = "cancelado"
5. logAudit("assinatura_cancelada", { subscription_id })

Response 200: { ok: true }
Response 400: { error: "Nenhuma assinatura vinculada" }       // sem asaas_customer_id
Response 404: { error: "Assinatura ativa não encontrada" }    // sub?.subscription_id ausente
Response 502: { error: "Falha ao cancelar assinatura" }       // cancelSubscription lança
```

## Depois (D-10 do `roadmap.md`)

```
DELETE /api/billing/cancel

1. Busca a org da sessão (não depende mais de asaas_customer_id nem de subscription_id)
2. orgs.plano_ativo = "cancelado"
3. orgs.renovacao_cancelada = true  (novo campo, ver data-delta.md §2 — impede a próxima cobrança agendada)
4. logAudit("assinatura_cancelada", { motivo: "cancelamento_voluntario" })

Response 200: { ok: true }
Response 404: { error: "Organização não encontrada" }
```

- Nenhuma chamada à Asaas é feita neste endpoint — `cancelSubscription.ts` é removido do projeto
- O código de erro 502 (falha ao chamar a Asaas) deixa de existir, já que não há mais chamada externa nesta rota
- O código de erro 400 ("Nenhuma assinatura vinculada") deixa de existir — toda org com `plano_ativo` diferente de `suspenso`/`cancelado` pode cancelar, independente de ter ou não `asaas_customer_id` (ex.: uma org provisionada manualmente por engano ainda deve poder ser cancelada)

## Idempotência e erros

- Idempotente por natureza: cancelar uma org já `"cancelado"` só reafirma o mesmo estado, sem erro
- **Limitação conhecida (ver `roadmap.md` §4, premissa sobre parcelas):** este endpoint não estorna parcelas já geradas da venda parcelada do ciclo anual vigente — apenas impede a próxima renovação. Se o negócio precisar de estorno de parcelas futuras do ciclo corrente, é escopo adicional não confirmado até aqui
