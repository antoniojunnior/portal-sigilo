# Dashboard, Design Técnico

> Fonte: `src/app/api/dashboard/**/route.ts`, `_reversa_sdd/flowcharts/dashboard.md`. Ver também `flows.md` desta unit para os 12 fluxos individuais.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| GET | `/api/dashboard/cases` | query (status, urgency, channel, protocol, dateFrom/To, page, limit, sortBy, sortDir) | `{cases[], total, page, totalPages}` | 200, 401 |
| GET | `/api/dashboard/cases/[caseId]` | — | `Case` completo | 200, 401, 403, 404 |
| PATCH | `/api/dashboard/cases/[caseId]` | `{status?, responsavel_id?, notas_internas?, prazo?}` | `{ok: true}` | 200, 401, 403, 404 |
| GET | `/api/dashboard/cases/[caseId]/audit` | — | `{logs[]}` (máx 20) | 200, 401, 403, 404 |
| POST | `/api/dashboard/cases/[caseId]/mencionados` | `{userId}` | `{ok: true}` | 200, 400, 401, 403, 404 |
| GET/POST | `/api/dashboard/cases/[caseId]/messages` | (POST) `{texto}` | `{messages[]}` / `{id, ok}` | 200, 400, 401, 403, 404 |
| GET | `/api/dashboard/heatmap` | — | `{departments[], categories[], rows[]}` | 200, 401 |
| GET | `/api/dashboard/insights` | — | `{summary, highlight, description, recommendations[], generatedAt, source}` | 200, 401 |
| GET | `/api/dashboard/metrics` | query `period` (dias) | métricas + trends | 200, 401 |
| GET | `/api/dashboard/notifications/count` | — | `{unreadCount}` | 200, 401 |
| GET/PATCH | `/api/dashboard/org` | (PATCH) `{nome?, configuracoes?}` | `Org` / `{ok:true}` | 200, 401, 403, 404 |
| GET/POST | `/api/dashboard/users` | (POST) `{email, nome, role, password?}` | `{users[]}` / `{id, ok}` | 200, 400, 401, 403, 404, 500 |
| PATCH | `/api/dashboard/users/[userId]` | `{role?, ativo?}` | `{ok: true}` | 200, 400, 401, 403, 404 |

## Fluxo Principal (representativo — GET /cases, ver `flows.md` para os 12)
1. `verifySession` (401 se ausente/inválida)
2. Query Firestore por `org_id` (+ `status`/`canal_origem` se informados)
3. Filtra em memória: exclui `mencionados`, aplica `urgencia`/`protocolo`/`dateFrom`/`dateTo`
4. Ordena (`created_at` já vem ordenado do Firestore; `urgencia`/`prazo` re-ordenados em memória)
5. Pagina (`slice`), serializa Timestamps, injeta `dias_em_aberto`

## Dependências
- `verifySession`, `logAudit` — transversais a quase toda rota
- Coleções `cases`, `messages`, `audit_logs`, `orgs`, `users`, `notifications`

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Filtros secundários (urgência, protocolo, datas) aplicados em memória para evitar múltiplos índices compostos | `cases/route.ts:40-68` | 🟢 |
| Insights com fallback em 3 camadas (gate de plano → IA pré-gerada → heurística local) para nunca deixar a UI sem conteúdo | `insights/route.ts` | 🟢 |
| Verificação de acesso a caso (`checkCaseAccess`) só extraída como helper em `messages/route.ts`; demais rotas reimplementam inline | `cases/[caseId]/messages/route.ts:23-36` vs demais | 🟡 inconsistência de padrão, ver ADR-005 |

## Estado Interno
Nenhum em memória entre requests — toda leitura consulta Firestore a cada chamada (sem cache de heatmap/métricas, por exemplo).

## Observabilidade
`console.error` por rota, com tratamento especial em `dashboard/cases`: detecta mensagens de erro contendo `"index"` e loga como `MISSING FIRESTORE INDEX` para facilitar diagnóstico operacional.

## Riscos e Lacunas
- 🟡 Heatmap e insights (fallback heurístico) carregam **todos** os casos da org sem paginação — risco de latência/custo crescente com o volume de casos
- 🟡 Checagem de acesso a caso duplicada em 5 rotas sem abstração central (exceto `messages`)
- 🔴 Não há rota para marcar notificação como lida (só contagem) — ver `_reversa_sdd/data-dictionary.md`
- 🔴 `responsavel_id` no PATCH de caso não é validado contra `users` existentes
