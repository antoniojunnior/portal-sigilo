# Reports, Design Técnico

> Fonte: `src/app/api/reports/**/route.ts`, `_reversa_sdd/flowcharts/reports.md`, `_reversa_sdd/state-machines.md` §2.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/reports/generate` | `{periodoInicio, periodoFim, tipo?, filtros?}` | `{reportId, status}` | 200, 400, 403, 500 |
| GET | `/api/reports/generate` | — | `{reports: [...]}` (últimos 50) | 200, 401 |
| GET | `/api/reports/[reportId]` | — | `Report` detalhado | 200, 401, 403, 404 |
| POST | `/api/reports/[reportId]/approve` | — | `{ok, status: "aprovado"}` | 200, 401, 403, 404, 409 |
| DELETE | `/api/reports/[reportId]/approve` | — | `{ok, status: "rascunho"}` | 200, 401, 403, 404 |
| GET | `/api/reports/[reportId]/export` | — | `application/pdf` | 200, 401, 403, 404, 409, 500 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `splitTextLines` | `(text, font, fontSize, maxWidth)` | `string[]` | Quebra de linha por largura real da fonte |

## Fluxo Principal (generate)
1. Autentica; bloqueia `role === "auditor"` e plano suspenso/cancelado (`:19-32`)
2. Valida `periodoInicio`/`periodoFim`; bloqueia `tipo=personalizado` em plano `entrada` (`:41-49`)
3. Query `cases` no intervalo de datas da org (`:56-62`)
4. Agrega categorias, leis, resolvidos/pendentes, prazo médio, top-5 (`:65-97`)
5. Monta prompt textual agregado, chama Claude (`:99-115`)
6. Grava `reports` com `status: "rascunho"` (`:119-143`)
7. `logAudit(report_generated)` (`:145-150`)

## Máquina de estados (ver `_reversa_sdd/state-machines.md` §2 para diagrama completo)
`rascunho → aprovado` (approve, bloqueia auditor) → `exportado` (export, exige aprovado) | `aprovado → rascunho` (approve DELETE, só admin)

## Fluxo Principal (export)
1. Autentica; bloqueia auditor (`export/route.ts:36-44`)
2. Carrega report, valida `org_id`, exige `status === "aprovado"` (409 senão) (`:48-58`)
3. Monta PDF via `pdf-lib`: header colorido, dados da org/período, bloco de métricas, parágrafos do texto Claude com quebra de linha manual, footer com paginação (`:71-158`)
4. `reports.update({status: "exportado"})`, `logAudit(report_exported)` (`:162-173`)
5. Retorna bytes do PDF com `Content-Disposition: attachment` (`:177-183`)

## Dependências
- `verifySession`, `logAudit`, `adminDb`
- `@anthropic-ai/sdk` — geração de texto
- `pdf-lib` — geração de PDF

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Máquina de estados com guardas explícitas em cada transição, única unit do sistema com esse padrão | `approve/route.ts`, `export/route.ts` | 🟢 |
| PDF gerado programaticamente (desenho manual de texto/linhas), sem template HTML→PDF | `export/route.ts:71-158` | 🟢 |
| Prompt instrui explicitamente "não invente dados" e "não inclua conteúdo individual" | `generate/route.ts:109` | 🟢 |

## Estado Interno
O documento `reports/{id}` é o próprio estado — sem cache ou estado em memória entre requests.

## Observabilidade
`console.error` em `[POST /api/reports/generate]`, `[GET /api/reports/[reportId]/export]`.

## Riscos e Lacunas
- 🟡 `metricas` gravadas no momento da geração não são recalculadas se novos casos entrarem no período depois — o relatório "congela" o dado no momento da geração, o que é provavelmente intencional mas não está documentado como decisão explícita
- 🟡 Tipo `"esg"` existe no tipo `ReportTipo` mas nenhuma rota o produz — feature Enterprise ainda não implementada nesta unit
