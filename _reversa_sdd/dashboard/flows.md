# Dashboard, Fluxos

> Diagramas Mermaid completos em `_reversa_sdd/flowcharts/dashboard.md`. Esta unit tem 12 rotas agrupadas em 4 famílias de fluxo.

## Família 1 — Casos (listagem, detalhe, atualização, mencionados, mensagens, audit)

Compartilham o mesmo padrão: `verifySession` → carregar caso → validar `org_id` + exclusão de `mencionados` → operação específica. `PATCH` é o único fluxo de escrita nesta família e é o único que grava tanto `historico` (arrayUnion) quanto `audit_logs` — as duas trilhas coexistem porque servem públicos diferentes (`historico` é exibido na UI do caso; `audit_logs` é a trilha legal imutável).

## Família 2 — Analytics (metrics, heatmap, insights)

Todas leem **todos** os casos da org (sem paginação) e agregam em memória. `metrics` é a mais complexa: calcula duas janelas de tempo (atual e anterior) sobre o mesmo dataset para produzir tendências, sem duas queries separadas — reaproveita os mesmos documentos carregados uma vez.

## Família 3 — Administração (org, users, notifications/count)

`users` é a única família com uma regra de negócio de limite (plano) aplicada no servidor por necessidade (Admin SDK ignora Firestore Rules). `org` e `notifications/count` são CRUD/leitura simples sem regra de negócio adicional além de autorização por role.

## Interseção entre famílias

`dashboard/insights` e `dashboard/metrics` leem a mesma coleção `cases` que `dashboard/cases` lista — uma mudança no schema de `Case` (ex.: renomear `triagem_ia.categoria`) exige atualizar as 3 rotas simultaneamente. Ver `_reversa_sdd/traceability/spec-impact-matrix.md`.
