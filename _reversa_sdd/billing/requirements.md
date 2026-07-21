# Billing

> Fonte: `_reversa_sdd/code-analysis.md` §3, `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md`.

## Visão Geral
Consulta e gestão da assinatura/cobrança da org via Asaas, com fallback para dados locais quando a API externa está indisponível ou não vinculada. 🟢

## Responsabilidades
- Expor dados básicos do plano (`plano_ativo`, `data_renovacao`) 🟢
- Consultar assinatura ativa e faturas recentes na Asaas 🟢
- Cancelar assinatura (Asaas + Firestore) 🟢

## Regras de Negócio
- Todas as 4 rotas exigem `role === "admin"` 🟢
- Mapeamento de valor pago → plano é hardcoded (`VALUE_TO_PLANO`): 117/97→entrada, 227/197→gestao 🟢
- Ausência de `asaas_customer_id` ou falha na chamada Asaas cai em fallback com dados do Firestore (`source: "firestore"`) 🟢
- Cancelamento marca `plano_ativo: "cancelado"` no Firestore **após** sucesso na Asaas (não antes) 🟢
- Cancelamento sem `asaas_customer_id` ou sem assinatura ativa retorna erro (400/404), não cancela nada silenciosamente 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Exigir role admin em todas as rotas | Must | Não-admin recebe 403 |
| RF-02 | Retornar dados básicos do plano (info) | Must | `plano_ativo`, `data_renovacao`, `has_asaas_customer` |
| RF-03 | Consultar assinatura ativa via Asaas com fallback Firestore | Must | Resposta sempre inclui `source` |
| RF-04 | Listar até 5 faturas recentes | Should | Vazio se sem customer vinculado |
| RF-05 | Cancelar assinatura de forma transacional (Asaas primeiro, depois Firestore) | Must | Falha na Asaas não altera `plano_ativo` |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Disponibilidade | Fallback gracioso quando Asaas está fora do ar | `src/app/api/billing/subscription/route.ts:24-40` | 🟢 |
| Segurança | Todas as rotas restritas a admin | `src/app/api/billing/*/route.ts` | 🟢 |
| Auditabilidade | Cancelamento gera audit log | `src/app/api/billing/cancel/route.ts:40-45` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um admin cuja org tem asaas_customer_id vinculado e assinatura ativa
Quando GET /api/billing/subscription é chamado
Então retorna dados da Asaas com source="asaas"

Dado um admin cuja org não tem asaas_customer_id
Quando GET /api/billing/subscription é chamado
Então retorna dados do Firestore com source="firestore", sem erro

Dado um admin com assinatura ativa
Quando DELETE /api/billing/cancel é chamado e a Asaas confirma o cancelamento
Então plano_ativo muda para "cancelado" e um audit log é gravado
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Consulta de assinatura com fallback | Must | Base do painel de faturamento |
| Cancelamento | Must | Requisito legal/contratual de autoatendimento |
| Listagem de faturas | Should | Conveniência, não bloqueia outros fluxos |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/billing/info/route.ts` | `GET` | 🟢 |
| `src/app/api/billing/subscription/route.ts` | `GET` | 🟢 |
| `src/app/api/billing/invoices/route.ts` | `GET` | 🟢 |
| `src/app/api/billing/cancel/route.ts` | `DELETE` | 🟢 |
| `src/lib/asaas/{getSubscription,getInvoices,cancelSubscription}.ts` | — | 🟢 |
