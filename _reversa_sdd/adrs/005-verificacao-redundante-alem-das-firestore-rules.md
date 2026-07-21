# ADR-005 — Checagem de autorização redundante nos Route Handlers, além das Firestore Rules

**Status:** 🟢 Confirmado (retroativo, inferido por padrão consistente em todo o código)
**Local:** todos os arquivos em `src/app/api/dashboard/**`, `src/app/api/billing/**`, `src/app/api/reports/**`

## Contexto

O Admin SDK do Firebase (usado em todos os Route Handlers via `adminDb`/`adminAuth`) **ignora** as Firestore Security Rules por design — Rules só se aplicam a acesso via SDK client. Isso significa que as Rules descritas em `firestore.rules` não protegem nada que passe pelos Route Handlers do Next.js.

## Decisão

Reimplementar manualmente, em **cada** Route Handler que precisa de controle de acesso, as mesmas checagens que já existem como Firestore Rules: verificação de sessão (`verifySession`), comparação de `org_id`, verificação de role, verificação de `mencionados`, e verificação de limite de plano (`PLAN_USER_LIMITS` — com comentário explícito no código reconhecendo o motivo: *"Admin SDK bypasses Firestore Rules, so we check here"*).

## Alternativas consideradas

🔴 Não documentadas. Alternativas arquiteturais possíveis não adotadas:
- Usar o SDK client (não-admin) nos Route Handlers para que as Rules se apliquem automaticamente — provavelmente rejeitado porque exigiria repassar credenciais de usuário ao servidor de forma diferente, e perderia a capacidade de operações privilegiadas (criar usuário no Auth, ajustar `users_count`, etc.)
- Middleware central único de autorização por rota — não foi adotado; cada rota faz sua própria sequência de `if` de checagem

## Consequências

- 🟢 As Firestore Rules continuam sendo úteis como camada de defesa para qualquer acesso direto client-side ao Firestore (ex.: se o app mobile futuro, Fase 8, usar o SDK client diretamente) e como documentação viva do modelo de permissões
- 🔴 **Duplicação de lógica de autorização em dois lugares** (`firestore.rules` e cada Route Handler) que precisam ser mantidos em sincronia manualmente — divergência entre os dois já foi observada (ver `_reversa_sdd/permissions.md`: `assistant` não bloqueia `auditor` explicitamente no Route Handler, diferente de `reports`/`mencionados`)
- 🟡 Sem um teste automatizado que compare as duas camadas, regressões de permissão (uma rota nova esquecendo uma checagem que a Rule "acharia" que está protegida) são o risco mais provável de segurance neste sistema
