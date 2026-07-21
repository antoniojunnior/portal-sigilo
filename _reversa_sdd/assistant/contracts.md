# Assistant, Contratos

## POST /api/assistant

**Autenticação:** cookie `__session` (obrigatório)

**Request body:**
```json
{
  "caseId": "string",
  "messages": [{"role": "user|assistant", "content": "string"}],
  "includeFullReport": false
}
```

**Response 200:** `Content-Type: text/event-stream`
```
data: {"type":"token","content":"..."}

data: {"type":"done"}
```
ou em erro de stream: `data: {"type":"error","message":"..."}`

**Erros:**
| Status | Condição | Body |
|---|---|---|
| 400 | corpo inválido / faltando caseId ou messages | `{"error": "..."}` |
| 401 | sem cookie ou sessão inválida | `{"error": "Não autenticado" \| "Sessão inválida"}` |
| 403 | plano incompatível, acesso negado à org, ou mencionado | `{"error": "feature_not_available" \| "plan_suspended" \| "Acesso negado" \| "..."}` (às vezes com `plano`) |
| 404 | caso não encontrado | `{"error": "Caso não encontrado"}` |

## PUT /api/assistant

**Autenticação:** cookie `__session`, `role === "admin"`

**Request body:**
```json
{"items": ["string", "string", "string"]}
```

**Response 200:**
```json
{"ok": true}
```

**Erros:** 400 (`items` não é array), 401, 403 (`Acesso negado`)
