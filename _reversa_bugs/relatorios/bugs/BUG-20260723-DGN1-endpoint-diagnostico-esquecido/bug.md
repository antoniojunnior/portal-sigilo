---
schema_version: 1
id: BUG-20260723-DGN1
display_number: 14
title: Endpoint de diagnóstico /api/reports/diagnostic esquecido em produção — sem checagem de role, vaza org_id/role/plano e stack trace
status: active
phase: delivering
severity: high
priority: P1
created: 2026-07-23
updated: 2026-07-23

change_risk:
  classification: baixa
  motivos:
    - "Remoção pura de arquivo, nenhum outro código do repositório importa ou referencia o endpoint (confirmado via grep)"
    - "Sem contrato externo dependente — endpoint nunca fez parte de nenhuma feature/spec, só existiu como ferramenta ad-hoc de debug"
    - "Reversível: git mantém o arquivo no histórico caso seja preciso recriá-lo com os devidos gates de autorização"

origin:
  type: inspection
  external_ref: null

area: saas-core
module: route-handlers
feature: reports
labels: [production-hygiene, information-disclosure, leftover-debug-endpoint]

visibility: restricted
security_suspected: true

reproduction:
  classification: deterministic
  rate: "código lido diretamente — qualquer requisição GET autenticada (qualquer role) ativa todos os passos"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260723-IDX1
    type: caused-by
    state: proposed
    evidence:
      - "Endpoint criado (commit 2937e14) como ferramenta ad-hoc para debugar o incidente IDX1 ao vivo; nunca removido depois"

traceability:
  specs: []
  affected_code:
    - "src/app/api/reports/diagnostic/route.ts"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "Durante a resposta ao incidente BUG-20260723-IDX1 (500 em produção), foi criado src/app/api/reports/diagnostic/route.ts (commit 2937e14) para isolar em qual etapa o POST/GET de relatórios falhava"
      - "O endpoint só exige um cookie de sessão válido (`verifySession`) — nenhuma checagem de `session.role` ou `session.plano`, diferente de TODOS os outros endpoints do módulo reports (que bloqueiam auditor e plano suspenso/cancelado)"
      - "Retorna no corpo: session.orgId, session.role, session.plano, resultado bruto de queries Firestore, e no catch 'fatal', err.message E err.stack (stack trace completo) — para qualquer usuário autenticado da org, incluindo roles que o resto do módulo bloqueia explicitamente (ex. auditor)"
      - "O endpoint nunca foi removido nos commits subsequentes (82f130b, 79425a8) — está presente no HEAD atual do repositório"
    evidence:
      - ref: "src/app/api/reports/diagnostic/route.ts:9-13"
        observation: "único gate é `verifySession(sessionCookie)`; nenhuma checagem de role/plano, ao contrário de POST /api/reports/generate (linhas 89-95 do route.ts irmão) que bloqueia auditor e plano suspenso"
      - ref: "src/app/api/reports/diagnostic/route.ts:65-72"
        observation: "catch 'fatal' devolve `stack: err.stack` no JSON de resposta — stack trace completo exposto ao client"
    code_refs:
      - {file: "src/app/api/reports/diagnostic/route.ts", symbol: "GET", commit: "2937e14"}
  reproduction_tests:
    - "scripts/test-no-diagnostic-endpoint.ts (\"src/app/api/reports/diagnostic/route.ts NAO deve existir\")"
  regression_tests:
    - "scripts/test-no-diagnostic-endpoint.ts (\"Diretório pai... tampouco deve existir\")"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/app/api/reports/diagnostic/route.ts (removido)"
    purpose: "Elimina o endpoint de diagnóstico esquecido — nenhuma checagem de role/plano, vazava org_id/role/plano e stack trace completo"
  - id: CHG-002
    kind: test
    artifact: "scripts/test-no-diagnostic-endpoint.ts (novo)"
    purpose: "Prova reprodução (arquivo existia) e regressão (arquivo não deve voltar a existir)"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Endpoint de diagnóstico esquecido em produção

## Summary

Durante a investigação ao vivo do incidente `BUG-20260723-IDX1`, foi criado `GET /api/reports/diagnostic` como ferramenta temporária para isolar a causa do 500. O endpoint nunca foi removido e continua acessível em produção: qualquer usuário autenticado (independente de role ou estado do plano) consegue chamá-lo e receber `org_id`, `role`, `plano` da própria sessão, resultado de queries internas ao Firestore, e — no caminho de erro fatal — a mensagem completa e o **stack trace** de qualquer exceção não tratada.

## Expected Behavior

Nenhuma spec formal cobre este endpoint (ele nunca fez parte de nenhuma feature planejada — é artefato de debug ad-hoc). O comportamento esperado, por analogia com o resto do módulo `reports` (regra inviolável do projeto, AGENTS.md: nunca confiar em client, sempre validar/autorizar no servidor) e por higiene básica de produção: ferramentas de diagnóstico não devem ficar expostas sem controle de acesso, e endpoints de produção não devem vazar stack traces.

## Actual Behavior

- Nenhuma checagem de `role` (nem `auditor`, que é bloqueado em todo o resto do módulo, é impedido de chamar este endpoint)
- Nenhuma checagem de `plano` (org suspensa/cancelada também consegue chamar)
- Vaza `org_id`, `role`, `plano` da sessão (dado próprio do usuário, risco baixo isoladamente) e, no catch fatal, `err.stack` completo (risco de exposição de detalhes internos de implementação/infra a qualquer usuário autenticado)

## Steps to Reproduce

1. Autenticar como qualquer usuário (inclusive role `auditor`, que é bloqueado de tudo relacionado a relatórios).
2. Chamar `GET /api/reports/diagnostic`.
3. **Esperado**: 404 (rota não deveria existir em produção) ou 403 (se fosse uma ferramenta admin-only).
4. **Observado**: 200 com JSON detalhando `orgId`, `role`, `plano`, resultado de cada etapa de diagnóstico; se qualquer etapa lançar exceção inesperada, `stack` completo no corpo da resposta.

## Evidence

Leitura direta de `src/app/api/reports/diagnostic/route.ts` (arquivo completo, 75 linhas) — ver `traceability.root_cause` no front matter.

## Suspected Area

`route-handlers` (`src/app/api/reports/diagnostic/route.ts`).

## Acceptance Criteria

- Endpoint removido do código de produção (era ferramenta de debug temporária, seu propósito já foi cumprido — `IDX1` está com `DONE.md`)
- Se o time decidir manter alguma ferramenta de diagnóstico permanente, ela precisa: checagem de role (ex. `admin`-only ou até restrita a um mecanismo de feature flag/allowlist), e nunca devolver `stack` no corpo da resposta (log server-side via `console.error`, nunca no JSON de retorno)

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** endpoint de debug criado durante o incidente `IDX1` (commit `2937e14`), nunca removido, sem checagem de role/plano, vazando dados de sessão e stack trace completo.

**Veredito de spec:** `spec-correta` — nenhuma spec jamais autorizou este endpoint; ele violava a convenção já estabelecida (toda rota de `reports` checa role/plano). Remoção sem adendo.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/app/api/reports/diagnostic/route.ts` (removido) | Elimina o endpoint |
| CHG-002 | test | `scripts/test-no-diagnostic-endpoint.ts` (novo) | Prova reprodução + regressão |

**Testes (vermelho → verde):**

```
✗ src/app/api/reports/diagnostic/route.ts NAO deve existir → AssertionError: true !== false
```
→ após CHG-001:
```
✓ src/app/api/reports/diagnostic/route.ts NAO deve existir
✓ Diretório pai... tampouco deve existir
✅ Endpoint de diagnóstico removido com sucesso!
```

`npx tsc --noEmit` limpo.

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` (commit/push) e janela de `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection`, lente condicional "Segurança/autorização" — ativada porque o mapa da feature (histórico git do incidente `IDX1`) deu sinal claro de um endpoint temporário criado sob pressão de incidente.
- `security_suspected: true` e `visibility: restricted`: não é um bypass de autenticação (exige sessão válida) nem cross-tenant (dado escopado ao `orgId` da própria sessão), mas é exposição de informação interna (stack trace) sem controle de autorização consistente com o resto do módulo — tratado com cautela por precaução.
- Relação `caused-by BUG-20260723-IDX1` é `proposed`: o endpoint nasceu como ferramenta de resposta a esse incidente, não é o mesmo defeito.
- Correção provável é trivial (deletar o arquivo), mas o `change_risk` deve considerar se alguém ainda está usando o endpoint ativamente para depurar algo em andamento — checar com o time antes de remover.
