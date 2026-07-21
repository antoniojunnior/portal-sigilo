# Interface: `GET /api/billing/subscription`

> Identificador: `002-unificar-plano-assinatura`
> Contrato: HTTP
> Origem: achado do `/reversa-audit` (A002, HIGH) — não existia como `interfaces/` na primeira versão deste roadmap

## Antes

```
GET /api/billing/subscription

1. Busca orgs.asaas_customer_id da sessão
2. getSubscription(customerId) → consulta /v3/subscriptions?customer=... na Asaas
3. Se encontrado: retorna { source: "asaas", plano_ativo, valor, ciclo, proximo_vencimento, status, subscription_id }
4. Se não encontrado ou sem asaas_customer_id: fallback { source: "firestore", plano_ativo, valor: null, ciclo: null, proximo_vencimento, status: null, subscription_id: null }
```

## Depois (D-11 do `roadmap.md`)

```
GET /api/billing/subscription

1. Busca orgs.plano_ativo, orgs.data_renovacao, orgs.proxima_cobranca_parcelas da sessão (Firestore)
2. Busca a cobrança mais recente via getInvoices.ts (consulta por customer, continua funcionando sob a Opção A)
3. Retorna:
   {
     source: "firestore",
     plano_ativo,
     valor: <valor da parcela mais recente encontrada em getInvoices, ou null se nenhuma>,
     ciclo: "YEARLY",
     proximo_vencimento: orgs.data_renovacao,
     status: <status da parcela mais recente: "ACTIVE" | "OVERDUE" | null>,
     subscription_id: null,
     parcelas: orgs.proxima_cobranca_parcelas
   }
```

- `source` deixa de variar (`"asaas"` nunca mais é retornado) — sempre `"firestore"`, já que não há mais objeto `subscription` na Asaas a consultar
- Campo novo: `parcelas` (quantas parcelas o cliente escolheu na renovação mais recente/próxima) — informação que existia implicitamente antes (dentro do objeto subscription) e agora precisa ser exposta explicitamente
- `subscription_id` é mantido na forma de resposta por compatibilidade de contrato com o frontend, mas sempre `null` — **verificar em `/reversa-coding` se algum componente do frontend toma decisão de UI com base nesse campo antes de removê-lo de vez**

## Idempotência e erros

- Sem mudança: é uma consulta somente-leitura, idempotente por natureza
- Sem mudança nos códigos de erro (401/403/404 de autenticação/autorização)
