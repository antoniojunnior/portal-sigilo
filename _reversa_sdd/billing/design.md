# Billing, Design Técnico

> Fonte: `src/app/api/billing/*/route.ts`, `src/lib/asaas/*.ts`, `_reversa_sdd/flowcharts/billing.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| GET | `/api/billing/info` | cookie (admin) | `{plano_ativo, data_renovacao, has_asaas_customer}` | 200, 401, 403, 404 |
| GET | `/api/billing/subscription` | cookie (admin) | `SubscriptionData` | 200, 401, 403, 404 |
| GET | `/api/billing/invoices` | cookie (admin) | `{invoices: Invoice[]}` | 200, 401, 403 |
| DELETE | `/api/billing/cancel` | cookie (admin) | `{ok: true}` | 200, 400, 401, 403, 404, 502 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `getSubscription` | `(customerId: string)` | `Promise<SubscriptionData \| null>` | `null` em falha de rede/API — nunca lança |
| `getInvoices` | `(customerId: string)` | `Promise<Invoice[]>` | `[]` em falha — nunca lança |
| `cancelSubscription` | `(subscriptionId: string)` | `Promise<void>` | Lança `Error` em falha (única função que propaga erro) |

## Fluxo Principal (subscription)
1. Autentica + exige admin (`route.ts:8-16`)
2. `orgs/{orgId}.get()` → `asaas_customer_id` (`:18-22`)
3. Sem customerId → `firestoreFallback()` (`:24-37`)
4. Com customerId → `getSubscription`; `null`/erro → fallback também (`:39-40`)
5. Sucesso → mapeia `value` para `plano_ativo` via `VALUE_TO_PLANO` e retorna `source: "asaas"` (`getSubscription.ts:47-55`)

## Fluxo Principal (cancel)
1. Autentica + exige admin (`cancel/route.ts:10-18`)
2. Busca org, exige `asaas_customer_id` (400 se ausente) (`:20-26`)
3. `getSubscription` para obter `subscription_id` (404 se ausente) (`:28-31`)
4. `cancelSubscription` na Asaas — 502 em falha (`:33-51`)
5. Só após sucesso: `orgs.update({plano_ativo: "cancelado"})` + `logAudit` (`:36-45`)

## Fluxos Alternativos
- **Asaas fora do ar em `getSubscription`/`getInvoices`:** ambas engolem exceção e retornam `null`/`[]` — o chamador nunca recebe 500 por causa da Asaas
- **`cancelSubscription` falha:** única chamada Asaas que lança, propagada como 502 explícito

## Dependências
- `verifySession` — autenticação e role
- `adminDb` — leitura/escrita `orgs`
- `logAudit` — auditoria do cancelamento
- Asaas API (`ASAAS_API_KEY`, `ASAAS_BASE_URL`) — fonte de verdade de assinatura/faturas

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Fallback silencioso para Firestore em toda consulta de leitura à Asaas, mas propagação de erro explícita no cancelamento | `getSubscription.ts:56-58`, `cancel/route.ts:33-35` | 🟢 |
| Cancelamento é estritamente sequencial (Asaas → Firestore), nunca o inverso | `cancel/route.ts:33-45` | 🟢 |

## Estado Interno
Nenhum estado em memória — toda leitura consulta Firestore/Asaas a cada request (sem cache).

## Observabilidade
`console.error` em `[cancelSubscription]`, `[createPaymentLink]` (lib), `[/api/billing/cancel]` (rota).

## Riscos e Lacunas
- 🟡 `VALUE_TO_PLANO` é hardcoded — mudança de preço sem atualizar essa tabela classifica o plano errado (fallback silencioso para `"gestao"`)
- 🔴 Sem rota de upgrade/downgrade de plano nesta unit nem em nenhuma outra encontrada — ver `_reversa_sdd/state-machines.md` §3
