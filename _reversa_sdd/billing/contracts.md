# Billing, Contratos

## GET /api/billing/info
**Auth:** cookie (role admin)
**Response 200:** `{"plano_ativo": "string", "data_renovacao": "ISO string|null", "has_asaas_customer": boolean}`
**Erros:** 401, 403 `Acesso restrito a administradores`, 404 `Organização não encontrada`

## GET /api/billing/subscription
**Auth:** cookie (role admin)
**Response 200:**
```json
{
  "source": "asaas|firestore",
  "plano_ativo": "string",
  "valor": "number|null",
  "ciclo": "MONTHLY|YEARLY|null",
  "proximo_vencimento": "string|null",
  "status": "ACTIVE|INACTIVE|SUSPENDED|null",
  "subscription_id": "string|null"
}
```
**Erros:** 401, 403, 404

## GET /api/billing/invoices
**Auth:** cookie (role admin)
**Response 200:** `{"invoices": [{"id","valor","vencimento","status","descricao","invoice_url"}]}` (máx 5, `RECEIVED|PENDING|OVERDUE|CANCELLED`)
**Erros:** 401, 403

## DELETE /api/billing/cancel
**Auth:** cookie (role admin)
**Response 200:** `{"ok": true}`
**Erros:** 400 `Nenhuma assinatura vinculada`, 401, 403, 404 `Assinatura ativa não encontrada`, 502 `Falha ao cancelar assinatura`
