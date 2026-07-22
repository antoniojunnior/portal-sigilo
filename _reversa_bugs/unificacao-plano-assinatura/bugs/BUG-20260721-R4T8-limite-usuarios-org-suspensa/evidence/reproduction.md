# Cápsula de reprodução — BUG-20260721-R4T8

> Data: 2026-07-21
> Ambiente: Firebase Firestore Emulator (local, `npx firebase emulators:start --only firestore`, porta 8181)
> Runtime: `npm run test:rules` (`scripts/test-rules.ts`, `@firebase/rules-unit-testing`)
> Classificação: deterministic
> Taxa: 1/1 (antes do fix), 0/13 falhas (depois do fix)

## Antes do fix

Novos testes 12 e 13 adicionados a `scripts/test-rules.ts`, rodados contra o código original (`firestore.rules#getPlanoLimit` retornando `null` para `suspenso`/`cancelado`):

```
getPlanoLimit retorna 50 para plano_ativo='unico' — criação de usuário abaixo do limite deve ser permitida... ✓ PASSOU
getPlanoLimit bloqueia criação de usuário para plano_ativo='suspenso' (BUG-20260721-R4T8)... ✗ FALHOU
    Expected request to fail, but it succeeded.
getPlanoLimit bloqueia criação de usuário quando users_count já atingiu 50 (BUG-20260721-R4T8)... ✓ PASSOU

Resultado: 12 passou · 1 falhou
```

Confirma exatamente o diagnóstico: o caso "limite 50 atingido" já funcionava (não é regressão), só o caso `suspenso`/`cancelado` estava quebrado — org suspensa conseguia criar usuário, quando deveria ser bloqueada.

## Depois do fix

`firestore.rules#getPlanoLimit` retorna `0` (não `null`) para `suspenso`/`cancelado`; `PLAN_USER_LIMITS[...] ?? 0` (não `?? 1`) no Route Handler:

```
getPlanoLimit retorna 50 para plano_ativo='unico' — criação de usuário abaixo do limite deve ser permitida... ✓ PASSOU
getPlanoLimit bloqueia criação de usuário para plano_ativo='suspenso' (BUG-20260721-R4T8)... ✓ PASSOU
getPlanoLimit bloqueia criação de usuário quando users_count já atingiu 50 (BUG-20260721-R4T8)... ✓ PASSOU

Resultado: 13 passou · 0 falhou
```

## Nota

O fix cobre a Firestore Rule (defesa primária desta regressão). O fallback do Route Handler (`dashboard/users/route.ts`) foi corrigido junto (mesma classe de bug, `?? 1` → `?? 0`), mas não há teste automatizado de Route Handler neste projeto (sem framework de testes para `src/app/api/`) — a correção ali foi verificada só por leitura, não por execução. Registrado em Agent Notes.
