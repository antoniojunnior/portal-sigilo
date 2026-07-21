# Messages, Contratos

## GET /api/messages?case_id=&org_id=
**Response 200:** `{"messages": [{"id","autor","texto","seq": number|null,"timestamp": ISO|null}]}`
**Erros:** 400 `case_id e org_id obrigatórios`

## POST /api/messages
**Request:** `{"case_id": "string", "org_id": "string", "texto": "string"}`
**Response 200:** `{"id": "string"}`
**Erros:** 400 `Campos obrigatórios ausentes`, 404 `Caso não encontrado`, 500 `Erro interno`
