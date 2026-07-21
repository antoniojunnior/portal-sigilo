# Auth, Contratos

## POST /api/auth/login

**Request:** `{"idToken": "string"}`
**Response 200:** `{"ok": true}` + `Set-Cookie: __session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=432000`
**Erros:** 401 `{"error": "Token inválido"}`

## POST /api/auth/logout

**Request:** cookie `__session` (opcional)
**Response 200 (sempre):** `{"ok": true}` + `Set-Cookie: __session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`

## GET /api/auth/me

**Request:** cookie `__session`
**Response 200:**
```json
{
  "uid": "string", "email": "string", "orgId": "string", "orgName": "string",
  "role": "admin|gestor|auditor", "unitId": "string|undefined",
  "nome": "string", "plano": "string"
}
```
**Erros:** 401 `{"error": "Não autenticado" | "Sessão inválida"}`, 500 `{"error": "Erro interno"}`
