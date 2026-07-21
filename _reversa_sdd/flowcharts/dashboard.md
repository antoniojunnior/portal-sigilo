# Fluxograma — dashboard

## GET /api/dashboard/cases (listagem com filtros)

```mermaid
flowchart TD
    A[GET /dashboard/cases] --> B{sessão válida?}
    B -- não --> B1[401]
    B -- sim --> C["query cases where org_id (+ status, + canal se informados)"]
    C --> D[orderBy created_at desc, get]
    D --> E["filtra em memória: exclui mencionados, aplica urgencia/protocolo/dateFrom/dateTo"]
    E --> F{sortBy?}
    F -- urgencia/prazo --> G[re-sort em memória]
    F -- created_at --> H[mantém ordem Firestore]
    G --> I[pagina: slice offset,limit]
    H --> I
    I --> J[serializa Timestamps → ISO, injeta dias_em_aberto]
    J --> K[200 cases + total + page + totalPages]
```

## PATCH /api/dashboard/cases/[caseId]

```mermaid
flowchart TD
    A[PATCH /cases/caseId] --> B{sessão válida?}
    B -- não --> B1[401]
    B -- sim --> C[busca case, valida org_id e mencionados]
    C -- bloqueado --> C1[403/404]
    C -- ok --> D["monta updates{} e auditActions[] por campo alterado"]
    D --> E{updates vazio?}
    E -- sim --> E1[200 ok, sem escrita]
    E -- não --> F["updates.historico = arrayUnion(item)"]
    F --> G[cases.update updates]
    G --> H["para cada auditAction: logAudit"]
    H --> I[200 ok]
```

## GET /api/dashboard/metrics (computeStats)

```mermaid
flowchart TD
    A[GET /metrics?period] --> B[carrega todos os cases da org]
    B --> C["computeStats período atual [now-period, now]"]
    C --> D["computeStats período anterior [now-2*period, now-period]"]
    D --> E["para cada doc: exclui mencionados, agrega total/emApuracao/resolvidos/prazoMedio/byUrgency/byChannel/semRespostaUrgente"]
    E --> F["getTrend(atual, anterior) por métrica"]
    F --> G[200 métricas + trends]
```

## GET /api/dashboard/insights (fallback em cascata)

```mermaid
flowchart TD
    A[GET /insights] --> B{plano == entrada?}
    B -- sim --> B1[200 mensagem fixa de upgrade, source=plano_gate]
    B -- não --> C{orgs.ai_insights.items existe?}
    C -- sim --> C1[200 usa ai_insights, source=ai_scheduled]
    C -- não --> D{cases da org vazio?}
    D -- sim --> D1[200 mensagem padrão, source=fallback]
    D -- não --> E["agrega depts/categorias, identifica topDept/topCat"]
    E --> F{topDept concentração > 1?}
    F -- sim --> G[200 texto de alerta de concentração, source=fallback_heuristic]
    F -- não --> H[200 texto de estabilidade, source=fallback_heuristic]
```

## POST /api/dashboard/users (criação com limite de plano)

```mermaid
flowchart TD
    A[POST /users] --> B{sessão admin?}
    B -- não --> B1[401/403]
    B -- sim --> C{email/nome/role válidos?}
    C -- não --> C1[400]
    C -- sim --> D["orgs.get → planLimit = PLAN_USER_LIMITS[plano]"]
    D --> E{users_count >= planLimit?}
    E -- sim --> E1[403 user_limit_reached]
    E -- não --> F[adminAuth.createUser]
    F --> G[users.doc(uid).set]
    G --> H["orgs.update users_count += 1"]
    H --> I[logAudit user_criado]
    I --> J[201 ok]
```
