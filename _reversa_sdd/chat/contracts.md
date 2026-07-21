# Chat, Contratos

## POST /api/chat

**Request:**
```json
{"messages": [{"role": "user|assistant", "content": "string"}], "org_id": "string", "unit_id": "string (opcional)"}
```

**Response 200:** `Content-Type: text/event-stream`
```
data: {"type":"token","content":"..."}
data: {"type":"case_created","protocolo":"ETK-YYYY-XXXXXX"}
data: {"type":"done"}
```
Em erro de parse/criação: `data: {"type":"error","message":"Erro ao registrar o relato. Tente novamente."}`
Em erro de stream: `data: {"type":"error","message":"Serviço temporariamente indisponível. Tente novamente em instantes."}`

**Erros síncronos:**
| Status | Condição |
|---|---|
| 400 | `org_id`/`messages` ausentes |
| 404 | org não encontrada |

## Payload interno `<CASE_COMPLETE>` (contrato entre prompt e parser, não exposto ao cliente)

```json
{
  "categoria": "string",
  "subcategoria": "string (opcional)",
  "urgencia": 1,
  "areas_mencionadas": ["string"],
  "ha_evidencias": false,
  "recorrente": false,
  "descricao_resumida": "string (até 150 chars)"
}
```
