# EPIC 9c — Gerenciamento de Assinatura

## Status
Draft

## Objetivo
Transformar `/configuracoes/faturamento` em uma página funcional de gerenciamento de assinatura, consumindo a API Asaas para dados reais, e ajustar o label do CTA em `/configuracoes` de acordo com o estado do customer.

## Contexto
- Epic 9 (Checkout) marcado como concluído mas a rota `/configuracoes/faturamento` não exibe dados reais da assinatura — apenas dados estáticos do Firestore.
- O botão "Fazer Upgrade" em `/configuracoes` deve ser "Gerenciar Assinatura" para orgs com `asaas_customer_id`.
- O endpoint `/api/billing/portal` tentava redirecionar para um portal externo Asaas inexistente — deve ser removido e substituído por UI interna.
- Story 9.6 (`/alterar-plano`) já cobre o fluxo de upgrade/downgrade — esta epic apenas adiciona o CTA de entrada nessa rota a partir do faturamento.

## Stories

| ID | Título | Prioridade | Executor |
|----|--------|-----------|---------|
| 9.7 | CTA "Gerenciar Assinatura" em /configuracoes | Alta | @dev |
| 9.8 | Dados da assinatura ativa via Asaas API | Alta | @dev |
| 9.9 | Faturas recentes via Asaas API | Média | @dev |
| 9.10 | CTA "Alterar Plano" → /alterar-plano | Baixa | @dev |
| 9.11 | Cancelar assinatura com confirmação | Média | @dev |

## Dependências
- `asaas_customer_id` presente na org no Firestore (resolvido via script seed)
- `.env.local`: `ASAAS_API_KEY` com aspas simples (fix aplicado)
- Story 9.6 (`/alterar-plano`) deve estar Done antes de Story 9.10

## APIs Asaas utilizadas
- `GET /v3/subscriptions?customer={id}` — assinatura ativa
- `GET /v3/payments?customer={id}&limit=5` — faturas recentes
- `DELETE /v3/subscriptions/{id}` — cancelamento

## Arquivos principais impactados
- `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx`
- `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx`
- `src/app/api/billing/info/route.ts`
- `src/app/api/billing/portal/route.ts` (remover ou repurpose)
- `src/app/api/billing/subscription/route.ts` (novo)
- `src/app/api/billing/invoices/route.ts` (novo)
- `src/app/api/billing/cancel/route.ts` (novo)
