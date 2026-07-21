# Cases, Contratos

## POST /api/cases
**Request:** `{"org_id": "string", "unit_id?": "string", "canal_origem?": "web", "mensagens?": [{"autor","texto"}]}`
**Response 200:** `{"protocolo": "ETK-YYYY-XXXXXX", "case_id": "string"}`
**Erros:** 400 `org_id obrigatório`, 404 `Organização não encontrada`, 500 `Erro interno`

## GET /api/cases/resolve?protocolo=
**Response 200:** `{"found": true, "slug": "string", "org_id": "string"}` ou `{"found": false}`
**Erros:** 400 `protocolo obrigatório`

## GET /api/cases/track?protocolo=&org_id=
**Response 200 (encontrado):**
```json
{
  "found": true,
  "case": {
    "id": "string", "protocolo": "string", "status": "CaseStatus",
    "created_at": "ISO string|null",
    "historico": [{"acao","timestamp","detalhes"}]
  }
}
```
**Response 200 (não encontrado):** `{"found": false}`
**Erros:** 400 `protocolo obrigatório`
