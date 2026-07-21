# Reports, Contratos

## POST /api/reports/generate
**Request:** `{"periodoInicio": "ISO date", "periodoFim": "ISO date", "tipo"?: "padrao|personalizado", "filtros"?: object}`
**Response 200:** `{"reportId": "string", "status": "rascunho"}`
**Erros:** 400, 403 (`Auditores não podem gerar relatórios.` / `plan_suspended` / plano insuficiente para personalizado), 500

## GET /api/reports/generate
**Response 200:** `{"reports": [{"id","tipo","status","gerado_em","aprovado_em","periodo": {"inicio","fim"}}]}` (máx 50, desc)

## GET /api/reports/[reportId]
**Response 200:** `{"id","tipo","status","texto_claude","gerado_em","aprovado_em","periodo","metricas"}`
**Erros:** 403 `Acesso negado`, 404 `Relatório não encontrado`

## POST /api/reports/[reportId]/approve
**Response 200:** `{"ok": true, "status": "aprovado"}`
**Erros:** 403 `Auditores não podem aprovar relatórios.`, 404, 409 `Relatório já está aprovado.`

## DELETE /api/reports/[reportId]/approve
**Response 200:** `{"ok": true, "status": "rascunho"}`
**Erros:** 403 `Apenas administradores podem reverter relatórios.`, 404

## GET /api/reports/[reportId]/export
**Response 200:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="relatorio-....pdf"`
**Erros:** 403 `Auditores não podem exportar relatórios.`, 404, 409 `Apenas relatórios aprovados podem ser exportados.`, 500
