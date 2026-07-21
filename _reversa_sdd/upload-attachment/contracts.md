# Upload Attachment, Contratos

## POST /api/upload-attachment

**Request:** `multipart/form-data`
| Campo | Tipo | Obrigatório |
|---|---|---|
| file | File | sim |
| org_id | string | sim |

**Response 200:**
```json
{"storage_path": "orgs/{org_id}/cases/temp/{uuid}/{uuid}.{ext}", "filename": "{uuid}.{ext}", "mime_type": "string", "size": number}
```

**Erros:**
| Status | Condição | Body |
|---|---|---|
| 400 | `file`/`org_id` ausente | `{"error": "file e org_id são obrigatórios"}` |
| 400 | arquivo > 50MB | `{"error": "Arquivo muito grande. Tamanho máximo: 50 MB."}` |
| 400 | mime fora da whitelist | `{"error": "Tipo de arquivo não permitido: ..."}` |
| 403 | limite de storage do plano excedido | `{"error": "storage_limit_exceeded", "used": number, "limit": number}` |

## Whitelist de mime types
`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`, `audio/mpeg`, `audio/ogg`, `audio/webm`, `application/pdf`

## Limites de storage por plano
| Plano | Limite |
|---|---|
| entrada | 2 GB |
| gestao | 20 GB |
| enterprise | ilimitado |
