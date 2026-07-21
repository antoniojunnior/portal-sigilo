# Auth, Design Técnico

> Fonte: `src/app/api/auth/{login,logout,me}/route.ts`, `src/lib/utils/auth.ts`, `_reversa_sdd/flowcharts/auth.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/auth/login` | `{idToken: string}` | `{ok: true}` + `Set-Cookie __session` | 200, 400, 401 |
| POST | `/api/auth/logout` | cookie `__session` | `{ok: true}` + `Set-Cookie` limpo | 200 (sempre) |
| GET | `/api/auth/me` | cookie `__session` | `SessionUser` | 200, 401, 500 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `verifySession` | `(sessionCookie: string)` | `Promise<SessionUser \| null>` | Decodifica cookie, valida `ativo`, monta sessão com dados de `orgs` |

## Fluxo Principal (login)
1. Recebe `idToken`, chama `adminAuth.verifyIdToken` (`src/app/api/auth/login/route.ts:19`)
2. Cria session cookie via `adminAuth.createSessionCookie` com `expiresIn=5 dias` (`:22-24`)
3. Tenta `verifySession` + `logAudit(user_login)` — falha aqui é ignorada (`:27-39`)
4. Retorna 200 com `Set-Cookie` (`:41-58`)

## Fluxo Principal (verifySession)
1. `adminAuth.verifySessionCookie(cookie, checkRevoked=false)` (`src/lib/utils/auth.ts:21`)
2. Busca `users/{uid}`; se não existe ou `ativo !== true`, retorna `null` (`:24-28`)
3. Busca `orgs/{orgId}`; se não existe, retorna `null` (`:31-32`)
4. Monta e retorna `SessionUser` (`:36-45`)

## Fluxos Alternativos
- **Token inválido no login:** captura exceção, retorna 401 `Token inválido` (`login/route.ts:59-62`)
- **Logout com cookie ausente/sessão inválida:** ainda assim limpa o cookie e retorna 200 (`logout/route.ts:10-25,39-46`)
- **`verifySession` lançando exceção interna:** capturado, retorna `null` (`auth.ts:46-48`)

## Dependências
- `adminAuth`, `adminDb` (`src/lib/firebase-admin/admin.ts`) — Firebase Admin SDK
- `logAudit` (`src/lib/utils/audit.ts`) — auditoria best-effort

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Revogação via flag `ativo` em vez de `checkRevoked=true` | `src/lib/utils/auth.ts:19-21`; ADR-002 | 🟢 |
| Cookie `__session` como único artefato de sessão (sem JWT próprio) | `login/route.ts:41-58` | 🟢 |

## Estado Interno
Não mantém estado no servidor além do que já está no Firebase Auth/Firestore — sem sessão em memória.

## Observabilidade
`console.error` em `[POST /api/auth/login]`, `[POST /api/auth/logout]`, `[GET /api/auth/me]` para erros inesperados.

## Riscos e Lacunas
- 🟡 Sem rota de refresh de sessão — sessão expira estritamente aos 5 dias, exigindo novo login
- 🟡 `verifySession` engole toda exceção como `null`, dificultando diferenciar "sessão expirada" de "erro de infraestrutura" no chamador
