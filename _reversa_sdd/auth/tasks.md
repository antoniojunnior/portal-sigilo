# Auth, Tarefas de Implementação

## Pré-requisitos
- [ ] Firebase Admin SDK configurado (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`)
- [ ] Coleções `users`, `orgs` com schema de `_reversa_sdd/data-dictionary.md`

## Tarefas

- [ ] T-01, Implementar `POST /api/auth/login` (verify idToken → session cookie)
  - Origem no legado: `src/app/api/auth/login/route.ts`
  - Critério de pronto: idToken válido retorna 200 com Set-Cookie de 5 dias
  - Confiança: 🟢

- [ ] T-02, Implementar `POST /api/auth/logout` (revoga + limpa cookie)
  - Origem no legado: `src/app/api/auth/logout/route.ts`
  - Critério de pronto: sempre retorna 200 e limpa cookie, mesmo com erro interno
  - Confiança: 🟢

- [ ] T-03, Implementar `GET /api/auth/me`
  - Origem no legado: `src/app/api/auth/me/route.ts`
  - Critério de pronto: retorna `SessionUser` para sessão válida, 401 senão
  - Confiança: 🟢

- [ ] T-04, Implementar `verifySession` com checagem de `ativo`
  - Origem no legado: `src/lib/utils/auth.ts`
  - Critério de pronto: usuário com `ativo=false` é tratado como não autenticado
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste do happy path de login/logout/me
- [ ] TT-02, Teste de idToken inválido → 401
- [ ] TT-03, Teste de usuário desativado (`ativo=false`) → sessão inválida

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. `verifySession` (T-04) — usado por praticamente toda a aplicação, implementar primeiro
2. Login (T-01) → Logout (T-02) → Me (T-03)

## Lacunas Pendentes (🔴)
Nenhuma identificada para esta unit.
