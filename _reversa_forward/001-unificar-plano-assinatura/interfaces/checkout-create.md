# Interface: POST /api/checkout/create

> Identificador: `001-unificar-plano-assinatura`
> Contrato de origem no legado: `_reversa_sdd/checkout/contracts.md`

## Antes (legado)

**Request:**
```json
{"plano": "entrada|gestao", "ciclo": "mensal|anual (opcional, default mensal)"}
```

**Validação:** `isPlanoValido` aceita `"entrada"` ou `"gestao"`.

## Depois (proposto)

**Request:**
```json
{"plano": "<identificador-do-plano-unico>", "ciclo": "mensal|anual (opcional, default mensal)"}
```

**Validação:** `isPlanoValido` aceita apenas o novo identificador único. Requisições com `plano="entrada"` ou `plano="gestao"` passam a ser tratadas como valor inválido.

## Response (inalterado no shape)

```json
{"url": "string (link de pagamento Asaas)"}
```

## Erros (inalterado no shape, valores aceitos mudam)

| Status | Condição | Body |
|---|---|---|
| 400 | corpo inválido / plano inválido (agora inclui `"entrada"`/`"gestao"` como inválidos) / ciclo inválido | `{"error": "..."}` |
| 503 | `ASAAS_API_KEY` não configurada | `{"error": "Serviço de pagamento não configurado."}` |
| 502 | falha na API Asaas | `{"error": "Falha ao criar link de pagamento. Tente novamente."}` |
| 500 | erro inesperado | `{"error": "Erro interno. Tente novamente em instantes."}` |

## Idempotência

Sem alteração — cada chamada gera um novo link de pagamento na Asaas, sem deduplicação (mesmo comportamento do legado, `_reversa_sdd/checkout/design.md`).

## Timeouts

Sem alteração — depende do timeout padrão do `fetch` para a API Asaas, não configurado explicitamente no código legado (herdado, não modificado por esta feature).

## Compatibilidade

**Breaking change intencional.** Qualquer client (frontend `/planos`, integração externa) que hoje envia `plano="entrada"` ou `plano="gestao"` precisa ser atualizado no mesmo deploy — não há período de transição com aceitação dos dois formatos, pois o requirements (RN-07) define que os identificadores antigos devem ser explicitamente rejeitados.
