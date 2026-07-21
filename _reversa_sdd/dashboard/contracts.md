# Dashboard, Contratos

**Autenticação:** todas as rotas exigem cookie `__session` válido (401 senão).

## GET /api/dashboard/cases
**Query:** `status?, urgency?, channel?, protocol?, dateFrom?, dateTo?, page? (default 1), limit? (default 10, máx 50), sortBy? (created_at|urgencia|prazo), sortDir? (asc|desc)`
**Response 200:** `{"cases": [Case & {dias_em_aberto}], "total": number, "page": number, "totalPages": number}`

## GET /api/dashboard/cases/[caseId]
**Response 200:** `Case` serializado (Timestamps → ISO)
**Erros:** 403 `Acesso negado` / `identificado como parte`, 404

## PATCH /api/dashboard/cases/[caseId]
**Request:** `{"status"?, "responsavel_id"?, "notas_internas"?, "prazo"?}` (todos opcionais)
**Response 200:** `{"ok": true}`

## GET /api/dashboard/cases/[caseId]/audit
**Response 200:** `{"logs": [AuditLog]}` (máx 20, desc)

## POST /api/dashboard/cases/[caseId]/mencionados
**Request:** `{"userId": "string"}`
**Response 200:** `{"ok": true}`
**Erros:** 400 `userId obrigatório`, 403 `Permissão insuficiente`, 404 `Usuário não encontrado`

## GET/POST /api/dashboard/cases/[caseId]/messages
**POST Request:** `{"texto": "string"}`
**Response 200:** GET `{"messages": [Message]}`; POST `{"id": "string", "ok": true}`

## GET /api/dashboard/heatmap
**Response 200:** `{"departments": [string], "categories": [string], "rows": [{"dept": string, "values": [number]}]}`

## GET /api/dashboard/insights
**Response 200:** `{"summary","highlight","description","recommendations": [string], "generatedAt": ISO, "source": "plano_gate|ai_scheduled|fallback|fallback_heuristic"}`

## GET /api/dashboard/metrics?period=30
**Response 200:** `{"total","emApuracao","resolvidos30d","prazoMedio","byUrgency","byChannel","semRespostaUrgente","totalTrend","emApuracaoTrend","resolvidosTrend"}` (trends: `{value,direction,label}|null`)

## GET /api/dashboard/notifications/count
**Response 200:** `{"unreadCount": number}`

## GET/PATCH /api/dashboard/org
**PATCH Request:** `{"nome"?, "configuracoes"?: object}`
**Response 200:** GET retorna `Org` parcial; PATCH `{"ok": true}`
**Erros PATCH:** 403 `Acesso restrito a administradores`

## GET/POST /api/dashboard/users
**POST Request:** `{"email","nome","role": "admin|gestor|auditor", "password"?}`
**Response 200/201:** GET `{"users": [User]}`; POST `{"id": "string", "ok": true}` (201)
**Erros POST:** 400, 403 `user_limit_reached` (com `plano`, `limit`), 500

## PATCH /api/dashboard/users/[userId]
**Request:** `{"role"?, "ativo"?}`
**Response 200:** `{"ok": true}`
