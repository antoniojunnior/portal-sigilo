# Checkout, Tarefas de Implementação

## Pré-requisitos
- [ ] `ASAAS_API_KEY`, `ASAAS_BASE_URL`/`ASAAS_SANDBOX` configurados

## Tarefas

- [ ] T-01, Implementar validação de `plano`/`ciclo`
  - Origem no legado: `src/app/api/checkout/create/route.ts:9-15,27-39`
  - Critério de pronto: valores fora da whitelist retornam 400; ciclo ausente usa "mensal"
  - Confiança: 🟢

- [ ] T-02, Implementar `createPaymentLink` com preços fixos por plano/ciclo
  - Origem no legado: `src/lib/asaas/createPaymentLink.ts`
  - Critério de pronto: valor cobrado na Asaas corresponde exatamente a `PLANOS_CONFIG`
  - Confiança: 🟢

- [ ] T-03, Implementar mapeamento de erro para status HTTP diferenciado
  - Origem no legado: `src/app/api/checkout/create/route.ts:46-71`
  - Critério de pronto: falta de API key → 503; falha Asaas → 502; erro inesperado → 500
  - Confiança: 🟢 (considerar reimplementar via tipos de erro em vez de comparação de string — ver design.md)

## Tarefas de Teste

- [ ] TT-01, Teste do happy path (plano+ciclo válidos → url retornada)
- [ ] TT-02, Teste de plano/ciclo inválidos → 400
- [ ] TT-03, Teste de API key ausente → 503
- [ ] TT-04, Teste de falha da Asaas → 502

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. T-02 (cliente Asaas) antes de T-01/T-03 (rota que o consome)

## Lacunas Pendentes (🔴)
- Consolidar `PLANOS_CONFIG` (aqui) e `PLANOS` (`src/lib/planos.ts`) em uma única fonte de verdade de preço, para evitar divergência entre UI e cobrança real
