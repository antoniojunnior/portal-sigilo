# Billing, Tarefas de Implementação

## Pré-requisitos
- [ ] `ASAAS_API_KEY`, `ASAAS_SANDBOX` configurados
- [ ] `orgs.asaas_customer_id` populado no provisionamento (ver unit `checkout`/webhook)

## Tarefas

- [ ] T-01, Implementar `GET /api/billing/info`
  - Origem no legado: `src/app/api/billing/info/route.ts`
  - Critério de pronto: retorna plano_ativo/data_renovacao/has_asaas_customer; 403 para não-admin
  - Confiança: 🟢

- [ ] T-02, Implementar `getSubscription` (cliente Asaas) com fallback nulo
  - Origem no legado: `src/lib/asaas/getSubscription.ts`
  - Critério de pronto: erro de rede/API retorna `null`, nunca lança
  - Confiança: 🟢

- [ ] T-03, Implementar `GET /api/billing/subscription` com fallback Firestore
  - Origem no legado: `src/app/api/billing/subscription/route.ts`
  - Critério de pronto: sem customerId ou com falha Asaas retorna dados do Firestore
  - Confiança: 🟢

- [ ] T-04, Implementar `getInvoices` e `GET /api/billing/invoices`
  - Origem no legado: `src/lib/asaas/getInvoices.ts`, `src/app/api/billing/invoices/route.ts`
  - Critério de pronto: até 5 faturas, `[]` em falha
  - Confiança: 🟢

- [ ] T-05, Implementar `cancelSubscription` e `DELETE /api/billing/cancel`
  - Origem no legado: `src/lib/asaas/cancelSubscription.ts`, `src/app/api/billing/cancel/route.ts`
  - Critério de pronto: Firestore só atualiza após sucesso na Asaas; falha retorna 502 sem alterar plano_ativo
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste do fallback Firestore quando Asaas indisponível
- [ ] TT-02, Teste de cancelamento bem-sucedido (Asaas + Firestore + audit log)
- [ ] TT-03, Teste de cancelamento com falha na Asaas (não altera plano_ativo)
- [ ] TT-04, Teste de bloqueio para role != admin

## Tarefas de Migração de Dados
- [ ] TM-01, Garantir que orgs existentes tenham `asaas_customer_id` retroativo quando aplicável (dado histórico, se migrando de outro billing)

## Ordem Sugerida
1. T-02/T-04 (clientes Asaas) antes das rotas que os consomem
2. T-01, T-03 (leitura) antes de T-05 (escrita/cancelamento)

## Lacunas Pendentes (🔴)
- Endpoint de upgrade/downgrade de plano não encontrado — se a story 9.6 estiver ativa, confirmar se pertence a esta unit ou a `checkout`
