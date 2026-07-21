# Assistant, Tarefas de Implementação

## Pré-requisitos
- [ ] `ANTHROPIC_API_KEY`, credenciais Firebase Admin configuradas (`src/lib/env.ts`)
- [ ] `verifySession` e `logAudit` disponíveis
- [ ] Coleções `cases`, `messages`, `orgs` existentes com schema de `_reversa_sdd/data-dictionary.md`

## Tarefas

- [ ] T-01, Implementar autenticação por cookie de sessão e retorno 401
  - Origem no legado: `src/app/api/assistant/route.ts:49-57`
  - Critério de pronto: request sem cookie ou com cookie inválido retorna 401
  - Confiança: 🟢

- [ ] T-02, Implementar gate de plano (entrada/suspenso/cancelado)
  - Origem no legado: `src/app/api/assistant/route.ts:59-65`
  - Critério de pronto: cada plano bloqueado retorna 403 com `error` específico
  - Confiança: 🟢

- [ ] T-03, Implementar validação de caso (org_id, mencionados)
  - Origem no legado: `src/app/api/assistant/route.ts:80-94`
  - Critério de pronto: caso de outra org ou com uid mencionado retorna 403/404
  - Confiança: 🟢

- [ ] T-04, Implementar `buildSystemPrompt` com contexto do caso
  - Origem no legado: `src/app/api/assistant/route.ts:23-46`
  - Critério de pronto: prompt inclui categoria, urgência, leis, prazo, status
  - Confiança: 🟢

- [ ] T-05, Implementar acesso opt-in ao relato completo com audit log prévio
  - Origem no legado: `src/app/api/assistant/route.ts:107-131`
  - Critério de pronto: `includeFullReport=true` grava `ai_full_access_granted` antes de montar o prompt
  - Confiança: 🟢

- [ ] T-06, Implementar streaming SSE da resposta Claude
  - Origem no legado: `src/app/api/assistant/route.ts:143-184`
  - Critério de pronto: cliente recebe eventos `token` incrementais e `done` final
  - Confiança: 🟢

- [ ] T-07, Implementar PUT restrito a admin para atualizar `ai_insights`
  - Origem no legado: `src/app/api/assistant/route.ts:189-211`
  - Critério de pronto: role não-admin recebe 403; items truncado a 3
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste do happy path: gestor com plano válido recebe stream completo
- [ ] TT-02, Teste de bloqueio por plano (entrada, suspenso, cancelado)
- [ ] TT-03, Teste de bloqueio de gestor mencionado
- [ ] TT-04, Teste de audit log gravado antes da chamada quando `includeFullReport=true`

## Tarefas de Migração de Dados
Nenhuma — unit não introduz schema novo, reutiliza `cases`/`messages`/`orgs` existentes.

## Ordem Sugerida
1. T-01 → T-02 → T-03 (guardas de acesso, sequenciais e bloqueantes)
2. T-04 → T-05 (montagem de prompt, depende dos dados do caso)
3. T-06 (streaming, depende do prompt pronto)
4. T-07 (independente, pode ser feito em paralelo)

## Lacunas Pendentes (🔴)
- Confirmar se `role === "auditor"` deve ser bloqueado no `POST /api/assistant`, por consistência com `reports/generate`
