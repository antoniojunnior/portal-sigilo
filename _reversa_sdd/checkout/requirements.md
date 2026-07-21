# Checkout

> Fonte: `_reversa_sdd/code-analysis.md` §6.

## Visão Geral
Geração de link de pagamento Asaas para contratação de plano (`entrada`/`gestao`), ciclo mensal/anual. Único ponto de entrada para novos clientes. 🟢

## Responsabilidades
- Validar plano e ciclo solicitados 🟢
- Gerar link de pagamento recorrente na Asaas 🟢
- Tratar erros de configuração/API de forma diferenciada 🟢

## Regras de Negócio
- Planos aceitos: `entrada`, `gestao` (Enterprise é "sob consulta", fora deste fluxo) 🟢
- Ciclo default é `mensal` quando omitido 🟢
- Preços fixos por plano/ciclo (`PLANOS_CONFIG`): entrada R$117/97, gestão R$227/197 🟢
- Link é `CREDIT_CARD` + `RECURRENT` (assinatura recorrente, não cobrança avulsa) 🟢
- Este endpoint **não cria** nenhuma org — apenas gera o link; a criação real acontece no webhook (unit externa, ver `functions/webhookAsaas.ts`) 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Validar `plano` contra whitelist | Must | Valor fora de `entrada`/`gestao` retorna 400 |
| RF-02 | Validar `ciclo` contra whitelist, com default `mensal` | Must | Valor inválido retorna 400; ausente usa mensal |
| RF-03 | Gerar link de pagamento com preço correto por plano/ciclo | Must | Valor cobrado bate com `PLANOS_CONFIG` |
| RF-04 | Diferenciar erro de configuração (503) de falha da API (502) de erro inesperado (500) | Should | Cada causa retorna status HTTP distinto |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Disponibilidade | Erro de configuração (chave ausente) não derruba o processo, retorna 503 tratado | `src/app/api/checkout/create/route.ts:49-55` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado plano="gestao" e ciclo="anual"
Quando POST /api/checkout/create é chamado
Então um link de pagamento Asaas de R$197/mês (cobrança anual) é retornado

Dado plano="premium" (inválido)
Quando POST /api/checkout/create é chamado
Então retorna 400 "Plano inválido. Valores aceitos: entrada, gestao"
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Geração de link com preço correto | Must | Impacto direto em receita |
| Tratamento diferenciado de erro | Should | Melhora diagnóstico, não bloqueia o fluxo principal |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/checkout/create/route.ts` | `POST` | 🟢 |
| `src/lib/asaas/createPaymentLink.ts` | `createPaymentLink` | 🟢 |
