# Auth

> Fonte: `_reversa_sdd/code-analysis.md` §2, `_reversa_sdd/domain.md`, `_reversa_sdd/adrs/002-sessao-cookie-revogacao-via-flag-ativo.md`.

## Visão Geral
Login/logout de gestores via Firebase session cookie e leitura da sessão atual. Único ponto de entrada de identidade do sistema. 🟢

## Responsabilidades
- Trocar ID token do client SDK por session cookie HttpOnly de 5 dias 🟢
- Revogar sessão no logout (refresh tokens + limpeza de cookie) 🟢
- Expor dados da sessão atual (`SessionUser`) 🟢
- Servir de base para revogação de acesso via flag `ativo` (ver ADR-002) 🟢

## Regras de Negócio
- Sessão expira em 5 dias corridos (`SESSION_MAX_AGE`) 🟢
- Cookie `__session` é `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` 🟢
- Usuário só é válido se `users/{uid}.ativo === true` — desativar o usuário revoga o acesso antes da expiração natural 🟢
- `checkRevoked=false` na verificação do cookie: decisão deliberada de performance (ADR-002) 🟢
- Logout sempre limpa o cookie, mesmo em erro interno 🟢
- Falha ao gravar audit log de login não bloqueia o login (non-crítico) 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Trocar idToken válido por session cookie | Must | Token válido resulta em `Set-Cookie __session` e 200 |
| RF-02 | Rejeitar idToken inválido | Must | Retorna 401 `Token inválido` |
| RF-03 | Revogar refresh tokens no logout | Must | `adminAuth.revokeRefreshTokens` chamado quando sessão válida |
| RF-04 | Limpar cookie mesmo em erro de logout | Must | Toda resposta de logout inclui `Set-Cookie` com `Max-Age=0` |
| RF-05 | Retornar dados da sessão atual | Must | `GET /me` retorna `SessionUser` completo quando autenticado |
| RF-06 | Considerar usuário inválido se `ativo !== true` | Must | `verifySession` retorna `null` para usuário desativado |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | Evita round-trip de rede extra ao Firebase por request (`checkRevoked=false`) | `src/lib/utils/auth.ts:19-21` | 🟢 |
| Segurança | Cookie HttpOnly/Secure/SameSite=Strict | `src/app/api/auth/login/route.ts:44-53` | 🟢 |
| Segurança | Revogação de refresh tokens no logout | `src/app/api/auth/logout/route.ts:20` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um idToken válido do Firebase client SDK
Quando POST /api/auth/login é chamado
Então a resposta 200 inclui Set-Cookie __session HttpOnly/Secure/SameSite=Strict e Max-Age de 5 dias

Dado um usuário com users/{uid}.ativo = false
Quando ele apresenta um cookie de sessão ainda não expirado
Então verifySession retorna null e a rota protegida responde 401
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Login/verifySession | Must | Base de todo o sistema autenticado |
| Logout com revogação | Must | Requisito de segurança |
| GET /me | Should | Conveniência de UI, não bloqueia outros fluxos |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/auth/login/route.ts` | `POST` | 🟢 |
| `src/app/api/auth/logout/route.ts` | `POST` | 🟢 |
| `src/app/api/auth/me/route.ts` | `GET` | 🟢 |
| `src/lib/utils/auth.ts` | `verifySession` | 🟢 |
