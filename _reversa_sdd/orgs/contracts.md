# Orgs, Contratos

## GET /api/orgs/search?q=

**Response 200:**
```json
{"orgs": [{"id": "string", "nome": "string", "slug": "string", "logo": "string|null", "plano_ativo": "string"}]}
```
Máximo 10 itens. `q` com menos de 3 caracteres retorna `{"orgs": []}`.
