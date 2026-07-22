# Cápsula de reprodução — BUG-20260722-T6R2

> Data: 2026-07-22
> Ambiente: sandbox Asaas real (`https://sandbox.asaas.com/api`), customer de teste `cus_000008453055` (mesmo usado nos testes de `BUG-20260721-K9M2`/`V3F7`, já com 6 pagamentos reais confirmados)
> Classificação: deterministic

## Achado — toda cobrança bem-sucedida real retorna status "CONFIRMED", nunca "RECEIVED"

```
GET https://sandbox.asaas.com/api/v3/payments?customer=cus_000008453055&limit=5&sort=dateCreated&order=desc
```

Resposta real (5 pagamentos, todos de cobranças reais criadas nesta sessão para os bugs K9M2/V3F7): **todos os 5 têm `"status":"CONFIRMED"`**, nenhum tem `"status":"RECEIVED"`.

## Código relevante

`src/lib/asaas/getInvoices.ts`:
```ts
export interface Invoice {
  ...
  status: "RECEIVED" | "PENDING" | "OVERDUE" | "CANCELLED";
  ...
}
...
return (data.data ?? []).map((p) => ({
  ...
  status: (p.status as Invoice["status"]) ?? "PENDING",
  ...
}));
```

O tipo `Invoice["status"]` não inclui `"CONFIRMED"` (nem outros status reais da Asaas: `RECEIVED_IN_CASH`, `REFUNDED`, `CHARGEBACK_REQUESTED`, `CHARGEBACK_DISPUTE`, `AWAITING_RISK_ANALYSIS`, etc.). O cast `as Invoice["status"]` não valida nada em runtime — só engana o compilador.

`src/lib/asaas/getSubscription.ts`:
```ts
switch (lastInvoice.status) {
  case "RECEIVED": status = "ACTIVE"; break;
  case "OVERDUE": status = "SUSPENDED"; break;
  case "CANCELLED": status = "INACTIVE"; break;
  default: status = "ACTIVE";
}
```

Como `"CONFIRMED"` não bate em nenhum `case`, cai no `default: status = "ACTIVE"`. Para o caso de pagamento bem-sucedido isso dá o resultado certo **por acidente** (o default coincide com o que seria o mapeamento correto de "CONFIRMED"). Mas o mesmo `default` também captura status que deveriam significar problema — `REFUNDED` (estornado), `CHARGEBACK_REQUESTED`/`CHARGEBACK_DISPUTE` (contestação de cartão) — todos cairiam em `"ACTIVE"` na tela de faturamento do admin, escondendo um problema real de pagamento.

## Cobertura de testes

`scripts/test-billing-route-fixes.ts` (regressão de `BUG-20260721-H3X6`) nunca verifica o campo `status` da resposta de `getSubscription` — só `parcelas` e `subscription_id`. O teste que existe não teria pego este achado.
