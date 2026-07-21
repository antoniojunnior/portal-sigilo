# Dashboard, Tarefas de Implementação

## Pré-requisitos
- [ ] `verifySession`, `logAudit` disponíveis
- [ ] Coleções `cases`, `messages`, `audit_logs`, `orgs`, `users`, `notifications` disponíveis
- [ ] Índices Firestore compostos necessários criados (`org_id`+`status`, `org_id`+`canal_origem`, `org_id`+`created_at`, etc. — ver `firestore.indexes.json`)

## Tarefas

- [ ] T-01, Implementar `GET /api/dashboard/cases` com filtros/paginação/ordenação
  - Origem no legado: `src/app/api/dashboard/cases/route.ts`
  - Critério de pronto: todos os 7 filtros funcionam combinados; paginação correta
  - Confiança: 🟢

- [ ] T-02, Implementar `GET/PATCH /api/dashboard/cases/[caseId]` com histórico + audit
  - Origem no legado: `src/app/api/dashboard/cases/[caseId]/route.ts`
  - Critério de pronto: cada campo alterado gera `historico` item e audit log específico
  - Confiança: 🟢

- [ ] T-03, Implementar `POST /api/dashboard/cases/[caseId]/mencionados`
  - Origem no legado: `src/app/api/dashboard/cases/[caseId]/mencionados/route.ts`
  - Critério de pronto: só admin/gestor; valida usuário da mesma org
  - Confiança: 🟢

- [ ] T-04, Implementar `GET/POST /api/dashboard/cases/[caseId]/messages`
  - Origem no legado: `src/app/api/dashboard/cases/[caseId]/messages/route.ts`
  - Critério de pronto: `checkCaseAccess` reutilizável para GET e POST
  - Confiança: 🟢

- [ ] T-05, Implementar `GET /api/dashboard/cases/[caseId]/audit`
  - Origem no legado: `src/app/api/dashboard/cases/[caseId]/audit/route.ts`
  - Critério de pronto: últimos 20 logs, ordenados desc
  - Confiança: 🟢

- [ ] T-06, Implementar `GET /api/dashboard/metrics` (computeStats + trends)
  - Origem no legado: `src/app/api/dashboard/metrics/route.ts`
  - Critério de pronto: `semRespostaUrgente` e trends batem com a fórmula documentada em `design.md`
  - Confiança: 🟢

- [ ] T-07, Implementar `GET /api/dashboard/heatmap`
  - Origem no legado: `src/app/api/dashboard/heatmap/route.ts`
  - Critério de pronto: departamentos configurados aparecem mesmo com zero casos
  - Confiança: 🟢

- [ ] T-08, Implementar `GET /api/dashboard/insights` (fallback em 3 camadas)
  - Origem no legado: `src/app/api/dashboard/insights/route.ts`
  - Critério de pronto: nunca retorna erro — sempre alguma forma de insight
  - Confiança: 🟢

- [ ] T-09, Implementar `GET /api/dashboard/notifications/count`
  - Origem no legado: `src/app/api/dashboard/notifications/count/route.ts`
  - Critério de pronto: conta apenas `lida=false` da org
  - Confiança: 🟢

- [ ] T-10, Implementar `GET/PATCH /api/dashboard/org`
  - Origem no legado: `src/app/api/dashboard/org/route.ts`
  - Critério de pronto: PATCH restrito a admin; merge de `configuracoes` por chave
  - Confiança: 🟢

- [ ] T-11, Implementar `GET/POST /api/dashboard/users` com limite por plano
  - Origem no legado: `src/app/api/dashboard/users/route.ts`
  - Critério de pronto: limite de plano bloqueia criação com 403; cria em Auth + Firestore + incrementa users_count
  - Confiança: 🟢

- [ ] T-12, Implementar `PATCH /api/dashboard/users/[userId]`
  - Origem no legado: `src/app/api/dashboard/users/[userId]/route.ts`
  - Critério de pronto: `users_count` só ajusta quando `ativo` muda de valor
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste de exclusão de mencionados em todas as 12 rotas relevantes
- [ ] TT-02, Teste de isolamento por org_id em todas as rotas
- [ ] TT-03, Teste de limite de usuários por plano (entrada=1, gestao=10)
- [ ] TT-04, Teste de trends de métricas (período atual vs anterior)
- [ ] TT-05, Teste de PATCH parcial de caso (só campos enviados são alterados)

## Tarefas de Migração de Dados
- [ ] TM-01, Garantir `users_count` denormalizado consistente com contagem real de `users.ativo=true` por org antes de ativar os limites

## Ordem Sugerida
1. T-01/T-02 (núcleo de casos) primeiro
2. T-03/T-04/T-05 (sub-rotas de caso) em paralelo, depois de T-02
3. T-06/T-07/T-08 (analytics) independentes entre si
4. T-09/T-10/T-11/T-12 (administração) por último, dependem só de T-01 estar madura para consistência de `users_count`

## Lacunas Pendentes (🔴)
- Endpoint para marcar notificação como lida (existe só contagem)
- Validação de `responsavel_id` contra `users` existentes no PATCH de caso
