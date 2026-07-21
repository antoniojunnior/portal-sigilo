# ADR-002 — Revogação de sessão via flag `ativo` no Firestore, não via `checkRevoked` do Firebase

**Status:** 🟢 Confirmado (retroativo)
**Local:** `src/lib/utils/auth.ts`

## Contexto

Sessões usam Firebase session cookies válidos por 5 dias. É preciso um mecanismo para revogar acesso de um usuário desativado antes da expiração natural do cookie.

## Decisão

`verifySession` chama `adminAuth.verifySessionCookie(sessionCookie, false)` — o segundo parâmetro `checkRevoked=false` **desliga** a verificação de revogação nativa do Firebase (que exigiria uma chamada de rede adicional ao Firebase Auth a cada request). Em vez disso, a revogação é implementada checando `users/{uid}.ativo === true` no Firestore, que já precisa ser lido de qualquer forma para montar o `SessionUser` (papel, org, etc.).

## Alternativas consideradas

🔴 Não documentadas. Alternativa óbvia seria `checkRevoked=true`, que adicionaria uma chamada de rede ao Firebase Auth por request.

## Consequências

- 🟢 Performance: evita um round-trip de rede extra por request autenticado — a leitura de `users/{uid}` já era necessária
- 🟢 Controle simples de desativação: setar `ativo=false` em um documento já frequentemente atualizado (via `dashboard/users/[userId]` PATCH) é suficiente para revogar acesso, sem precisar chamar `adminAuth.revokeRefreshTokens`
- 🟡 Trade-off: revogação por `ativo=false` só funciona porque o código **sempre** consulta o Firestore em `verifySession` — se um caminho de autenticação alternativo aparecer no futuro que confie só no JWT decodificado, a desativação deixaria de ter efeito imediato
- 🟢 Logout explícito (`POST /api/auth/logout`) ainda chama `adminAuth.revokeRefreshTokens` — a decisão de não usar `checkRevoked` foi especificamente para o caminho de leitura de sessão (alto volume), não para o de logout (baixo volume, evento único)
