# Checkout, Contratos

## POST /api/checkout/create

**Request:** `{"plano": "entrada|gestao", "ciclo": "mensal|anual (opcional, default mensal)"}`

**Response 200:** `{"url": "string (link de pagamento Asaas)"}`

**Erros:**
| Status | Condição | Body |
|---|---|---|
| 400 | corpo inválido / plano inválido / ciclo inválido | `{"error": "..."}` |
| 503 | `ASAAS_API_KEY` não configurada | `{"error": "Serviço de pagamento não configurado."}` |
| 502 | falha na API Asaas | `{"error": "Falha ao criar link de pagamento. Tente novamente."}` |
| 500 | erro inesperado | `{"error": "Erro interno. Tente novamente em instantes."}` |

## Tabela de preços (`PLANOS_CONFIG`)

| Plano | Ciclo | Valor | `billingType` | `chargeType` |
|---|---|---|---|---|
| entrada | mensal | R$117,00 | CREDIT_CARD | RECURRENT |
| entrada | anual | R$97,00 | CREDIT_CARD | RECURRENT |
| gestao | mensal | R$227,00 | CREDIT_CARD | RECURRENT |
| gestao | anual | R$197,00 | CREDIT_CARD | RECURRENT |
