---
schema_version: 1
id: BUG-20260721-R4T8
display_number: 2
title: getPlanoLimit trata org suspensa/cancelada como "sem limite", permitindo criação ilimitada de gestores via Firestore direto
status: active
phase: patching
severity: critical
priority: P0
created: 2026-07-21
updated: 2026-07-21

origin:
  type: inspection
  external_ref: null

area: saas-core
module: firestore-rules
feature: planos-unificacao
labels: [defesa-redundante-quebrada]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/002-unificar-plano-assinatura/roadmap.md#D-06"
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-05"
    - "_reversa_forward/002-unificar-plano-assinatura/requirements.md#RF-12"
    - "_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md"
  affected_code:
    - "firestore.rules:76-97"
    - "src/app/api/dashboard/users/route.ts:9-11,77-88"
  root_cause:
    state: confirmed
    hypothesis: "getPlanoLimit reaproveitou o sentinela null (antes 'sem limite' do tier Enterprise) para representar suspenso/cancelado, sem revisar a Rule consumidora, que trata null como liberado"
    causal_path:
      - "getPlanoLimit retorna null para plano_ativo suspenso/cancelado"
      - "Regra create de users: getPlanoLimit(...) == null || getOrgUsersCount(...) < getPlanoLimit(...) — null satisfaz o || sem checar contagem"
      - "Org suspensa/cancelada cria usuários sem limite via Firestore direto"
      - "Route Handler tem bug relacionado (fallback ?? 1 em vez de bloqueio), defesa redundante também falha"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "npm run test:rules contra emulador real: teste de org suspensa criando usuário deveria falhar (assertFails) e não falhou, antes do fix"
    code_refs:
      - { file: "firestore.rules", symbol: "getPlanoLimit", commit: null }
      - { file: "src/app/api/dashboard/users/route.ts", symbol: "PLAN_USER_LIMITS lookup", commit: null }
  reproduction_tests:
    - "scripts/test-rules.ts (Teste 12: org suspensa bloqueada)"
  regression_tests:
    - "scripts/test-rules.ts (Teste 12: suspenso bloqueado; Teste 13: limite 50 atingido bloqueado)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "firestore.rules"
    purpose: "getPlanoLimit retorna 0 (não null) para suspenso/cancelado"
    diff: "fix/CHG-001.diff"
  - id: CHG-002
    kind: code
    artifact: "src/app/api/dashboard/users/route.ts"
    purpose: "Fallback de PLAN_USER_LIMITS muda de ?? 1 para ?? 0"
    diff: "fix/CHG-002.diff"

closure:
  policy: production-service
  satisfied: false
resolution_kind: null
---

# getPlanoLimit trata org suspensa/cancelada como "sem limite", permitindo criação ilimitada de gestores via Firestore direto

## Summary

`firestore.rules#getPlanoLimit` retorna `null` para orgs `suspenso`/`cancelado`. A regra `create` da coleção `users` interpreta `null` como "sem limite" (`getPlanoLimit(...) == null || getOrgUsersCount(...) < getPlanoLimit(...)` — se `null`, a condição já é verdadeira, sem checar contagem). Antes desta feature, `null` era reservado para o plano `enterprise` (unlimited de verdade, um tier premium legítimo). A simplificação de D-06 reaproveitou o mesmo sentinela `null` para representar "suspenso/cancelado" — só que para esses dois estados o comportamento correto é BLOQUEAR, não liberar. Resultado: uma org suspensa ou cancelada pode criar gestores sem limite algum via escrita direta no Firestore (bypassando o Route Handler, que é exatamente o cenário que a Firestore Rule deveria cobrir como defesa redundante, per ADR-005).

## Expected Behavior

`requirements.md` RF-12 (Must): "Estados `suspenso`/`cancelado` de assinatura continuam funcionando exatamente como hoje" — nenhuma regressão de comportamento para esses estados. RN-10: a unificação não altera o ciclo de vida ativo/suspenso/cancelado. `_reversa_sdd/adrs/005-*.md` documenta a checagem redundante (Route Handler + Firestore Rule) como camada de defesa deliberada — as duas camadas deveriam concordar e, no mínimo, nenhuma delas deveria ficar mais permissiva que antes para um estado que já era restrito no legado.

## Actual Behavior

Nas Firestore Rules, `suspenso`/`cancelado` agora resulta em limite `null` (sem limite), quando deveria resultar em bloqueio total de criação de novo gestor. No Route Handler (`dashboard/users/route.ts`), o comportamento é DIFERENTE e também errado: `PLAN_USER_LIMITS[orgData.plano_ativo] ?? 1` — como o mapa só tem a chave `unico`, qualquer outro valor (`suspenso`, `cancelado`) cai no fallback `1`, permitindo criar até 1 usuário mesmo para uma org suspensa/cancelada (também contraria RF-12, embora de forma menos severa que o lado das Rules). As duas camadas de defesa redundante hoje discordam entre si e nenhuma bloqueia corretamente.

## Steps to Reproduce

Achado por leitura estática de `firestore.rules` e `dashboard/users/route.ts`, não executado contra um emulador:

1. Ler `firestore.rules:78-81`: `function getPlanoLimit(orgId) { ... return plano == 'suspenso' || plano == 'cancelado' ? null : 50; }`
2. Ler `firestore.rules:95-97`: regra `create` de `users` permite se `getPlanoLimit(...) == null || getOrgUsersCount(...) < getPlanoLimit(...)` — `null` satisfaz o `||` sem checar contagem.
3. Simular (mentalmente/via emulador): admin de uma org com `plano_ativo: "suspenso"` cria um documento em `users/{novoId}` diretamente via SDK client-side — a Rule permite, sem limite.
4. Ler `src/app/api/dashboard/users/route.ts:9-11`: `PLAN_USER_LIMITS = { unico: 50 }`; linha 81: `PLAN_USER_LIMITS[orgData.plano_ativo] ?? 1` — fallback 1 para qualquer plano fora do mapa.

## Evidence

- `firestore.rules` linhas 76-97
- `src/app/api/dashboard/users/route.ts` linhas 9-11, 81-88
- `scripts/test-rules.ts` — só cobre o teste "Teste 11: getPlanoLimit retorna 50 para plano 'unico'" (caso positivo, abaixo do limite); não há teste para o caso negativo (limite atingido) nem para `suspenso`/`cancelado`

## Suspected Area

`firestore.rules` (defesa primária desta regressão) e `dashboard/users/route.ts` (defesa secundária, também incorreta).

## Acceptance Criteria

- [ ] Org com `plano_ativo` `suspenso` ou `cancelado` não consegue criar nenhum usuário novo, nem via Firestore Rule nem via Route Handler
- [ ] `scripts/test-rules.ts` ganha um teste negativo cobrindo explicitamente `suspenso`/`cancelado` tentando criar usuário (deve falhar)
- [ ] `scripts/test-rules.ts` ganha um teste cobrindo o limite de 50 sendo atingido para `plano_ativo: "unico"` (deve falhar ao criar o 51º)

## Traceability

- Specs: `roadmap.md#D-06`, `requirements.md#RF-05`/`RF-12`, `_reversa_sdd/adrs/005-*.md`
- Código afetado: `firestore.rules:76-97`, `src/app/api/dashboard/users/route.ts:9-11,77-88`
- Testes: `scripts/test-rules.ts` (cobertura incompleta, ver Evidence)

## Resolution

**Causa raiz (confirmed):** `getPlanoLimit` reaproveitou o sentinela `null` (antes "sem limite" do tier Enterprise) para `suspenso`/`cancelado`, sem revisar a Rule consumidora, que trata `null` como liberado. Confirmado contra emulador Firestore real (`evidence/reproduction.md`).

**Veredito de spec: `spec-correta`.** RF-12/RN-10 já diziam que `suspenso`/`cancelado` deveriam continuar bloqueando "exatamente como hoje" — o código divergiu por reaproveitamento indevido de sentinela, a spec nunca mandou tratar esses estados como "sem limite". Nenhum adendo gerado.

**Correction Change Set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `firestore.rules` | `getPlanoLimit` retorna `0` (não `null`) para suspenso/cancelado — bloqueia via a mesma comparação `count < limite`, sem reescrever a Rule consumidora |
| CHG-002 | code | `src/app/api/dashboard/users/route.ts` | Fallback `?? 1` → `?? 0`, mesma classe de bug na defesa secundária |

Diffs: `fix/CHG-001.diff`, `fix/CHG-002.diff`.

**Testes — vermelho→verde, contra Firebase Firestore Emulator real:**

Antes:
```
getPlanoLimit bloqueia criação de usuário para plano_ativo='suspenso' (BUG-20260721-R4T8)... ✗ FALHOU
    Expected request to fail, but it succeeded.
Resultado: 12 passou · 1 falhou
```

Depois:
```
getPlanoLimit bloqueia criação de usuário para plano_ativo='suspenso' (BUG-20260721-R4T8)... ✓ PASSOU
getPlanoLimit bloqueia criação de usuário quando users_count já atingiu 50 (BUG-20260721-R4T8)... ✓ PASSOU
Resultado: 13 passou · 0 falhou
```

**Fechamento (closure policy: production-service):** regressão passando + veredito preenchidos, falta `delivery` (commit/deploy) e janela de observação. Bug permanece `status: active`, `phase: patching`.

## Agent Notes

- O sentinela `null` = "sem limite" fazia sentido quando representava o plano Enterprise (tier premium real). Reaproveitar o mesmo valor para representar "conta suspensa/cancelada" inverteu o sentido sem que nenhuma checagem consumidora fosse revisada — mesmo padrão de risco vale checar em outros lugares do código que ainda usem `null` como sentinela de "sem limite" fora deste bug.
- Correção do Route Handler (CHG-002) verificada só por leitura — não há framework de testes automatizados para `src/app/api/` neste projeto.
