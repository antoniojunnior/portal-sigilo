# Data Delta: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`

## 1. Resumo

Nenhum campo novo, removido ou migrado no Firestore. A feature e 100% de mudanca de UI + um ajuste no mapeamento de resposta da API Asaas (campo `paymentDate`).

## 2. Campos existentes reaproveitados (sem alteracao de schema)

| Campo | Entidade | Uso nesta feature |
|-------|----------|---------------------|
| `orgs.plano_ativo` | Org | Continua sendo exibido no badge da pagina de organizacao (nao removido) |
| `orgs.asaas_customer_id` | Org | Usado por `getInvoices(customerId)` para buscar faturas — sem alteracao |
| `orgs.configuracoes.*` | Org | Campos de configuracao da org mantidos na pagina de organizacao (nome, slug, boas_vindas, prazo_padrao_dias, departamentos) |
| `users.*` | User | Lista de membros mantida na pagina de organizacao — sem alteracao |

## 3. Campos novos

Nenhum no Firestore.

### Extensao da interface `Invoice` (TypeScript, nao Firestore)

| Campo | Tipo | Fonte | Descricao |
|-------|------|-------|-----------|
| `data_pagamento` | `string \| null` | `paymentDate` da resposta Asaas `GET /v3/payments` | Data em que a cobranca foi efetivamente paga; `null` para faturas PENDING/OVERDUE/CANCELLED |

Arquivos que declaram `Invoice` e precisam ser atualizados:
- `src/lib/asaas/getInvoices.ts` — interface `Invoice`, adicionar `data_pagamento: string | null`
- `src/lib/asaas/getInvoices.ts` — mapeamento `AsaasPayment → Invoice`, adicionar `data_pagamento: p.paymentDate ?? null`
- `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` — interface `Invoice` local, adicionar `data_pagamento: string | null`

## 4. Campos removidos

Nenhum no Firestore. No codigo:

| Campo/Estado removido | Local | Motivo |
|---|---|---|
| `billingInfo` state | `configuracoes/page.tsx:86` | Bloco "Plano e Faturamento" removido (RN-03) |
| `billingLoading` state | `configuracoes/page.tsx:87` | Idem |
| `fetchBillingInfo` callback | `configuracoes/page.tsx:112-127` | Idem |
| Chamada `fetchBillingInfo()` no useEffect | `configuracoes/page.tsx:147` | Idem |
| `subscription` state | `faturamento/page.tsx:134` | Bloco "Assinatura Ativa" removido (RN-04) |
| `subLoading` state | `faturamento/page.tsx:135` | Idem |
| `subError` state | `faturamento/page.tsx:136` | Idem |
| `fetchSubscription` callback | `faturamento/page.tsx:147-163` | Idem |
| Chamada `fetchSubscription()` no useEffect | `faturamento/page.tsx:192` | Idem |
| `SubscriptionData` interface | `faturamento/page.tsx:14-22` | Idem |
| Constantes `CICLO_LABELS` e `STATUS_BADGE` | `faturamento/page.tsx:50-72` | Idem (usadas apenas no bloco Assinatura Ativa) |
| Navegacao de volta (ArrowLeft) | `faturamento/page.tsx` | RN-04, substituida pelo submenu no sidebar |

## 5. Migracoes necessarias

Nenhuma. Dados existentes em Firestore permanecem inalterados.

## 6. Indices Firestore

Nenhum indice novo. As queries existentes (`orgs/{orgId}`, `users` com filtro por `org_id`) nao mudam.
