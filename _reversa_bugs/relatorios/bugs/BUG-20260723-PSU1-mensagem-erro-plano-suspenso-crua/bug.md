---
schema_version: 1
id: BUG-20260723-PSU1
display_number: 2
title: Org com plano suspenso/cancelado vê o código interno "plan_suspended" cru na tela, sem tradução
status: resolved
phase: resolved
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: reports
labels: [ux, pre-existing-amplified]

visibility: normal
security_suspected: false

reproduction:
  classification: not-reproduced
  rate: null
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-06"
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-07"
  affected_code:
    - "src/app/api/reports/generate/route.ts:90-92 (POST, bloqueio de plano)"
    - "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:162-164 (handleGenerate, catch de !res.ok)"
    - "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:392-397 (render do banner de erro)"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "route.ts:91 retorna `{ error: \"plan_suspended\", plano: session.plano }` com status 403 — \"plan_suspended\" é um código interno, não uma frase para humano"
      - "page.tsx:163-164: `const err = await res.json()...; throw new GenerateError(err.error ?? ..., res.status)` — usa `err.error` diretamente como mensagem, sem mapear o código para texto"
      - "page.tsx:171-172: `setGenerateError(msg)` onde `msg = err.message` = literalmente a string \"plan_suspended\""
      - "page.tsx:392-397: renderiza `{generateError}` cru no banner de erro — o usuário lê \"plan_suspended\" na tela"
      - "Esse padrão já existia ANTES da feature 005 (o botão manual antigo tinha o mesmo catch/render) — mas só aparecia se o usuário clicasse manualmente. A feature 005 torna a geração automática no mount (RN-01), então agora toda org suspensa/cancelada vê esse texto cru IMEDIATAMENTE ao acessar a rota, sem nenhuma ação do usuário — o defeito preexistente ganhou alcance e frequência muito maiores"
    evidence:
      - ref: "src/app/api/reports/generate/route.ts:90-92"
        observation: "payload de erro usa código de máquina (\"plan_suspended\") em vez de mensagem para humano, ao contrário do branch de auditor (linha 87: \"Auditores não podem gerar relatórios.\", que já é uma frase legível)"
      - ref: "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:163-164"
        observation: "nenhuma etapa de tradução/mapeamento entre código de erro e texto de exibição"
    code_refs:
      - {file: "src/app/api/reports/generate/route.ts", symbol: "POST", commit: null}
      - {file: "src/app/(dashboard)/app/(protected)/relatorios/page.tsx", symbol: "handleGenerate", commit: null}
  reproduction_tests:
    - "scripts/test-reports-error-messages.ts (\"BUG-20260723-PSU1 (reproducao): 'plan_suspended' NAO deve aparecer cru...\")"
  regression_tests:
    - "scripts/test-reports-error-messages.ts (\"mensagem ja legivel... passa direto, sem alteracao\")"
    - "scripts/test-reports-error-messages.ts (\"codigo desconhecido passa direto (fallback seguro)\")"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "src/lib/reports/error-messages.ts"
    purpose: "Novo módulo com translateGenerateErrorMessage — mapeia códigos de erro conhecidos (plan_suspended) para texto legível; passthrough seguro para desconhecidos"
  - id: CHG-002
    kind: code
    artifact: "src/app/(dashboard)/app/(protected)/relatorios/page.tsx"
    purpose: "handleGenerate passa a traduzir a mensagem crua antes de guardar em GenerateError/generateError"
  - id: CHG-003
    kind: test
    artifact: "scripts/test-reports-error-messages.ts"
    purpose: "1 teste de reprodução + 2 de regressão (mensagem já legível passa direto; código desconhecido não quebra)"

closure:
  policy: production-service
  satisfied: true
  delivery:
    kind: commit
    ref: "79425a8"
    code_commit: "03f61f7"
    delivered_at: "2026-07-23"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-23"
    closed_at: "2026-07-23"
    window: "waived — usuário decidiu promover a resolved tratando a entrega já confirmada (push origin/main) como suficiente, sem aguardar janela de observação adicional. Decisão registrada em 2026-07-23 via /reversa-debugger-graph."
    status: "closed"
resolution_kind: fixed
---

# Mensagem de erro crua "plan_suspended" para org com plano suspenso/cancelado

## Summary

`RF-06`/`RF-07` esperam que o bloqueio de plano suspenso/cancelado caia num "fallback silencioso"/"aviso discreto" equivalente ao tratamento de erro já existente. Na prática, o texto exibido é o código de máquina literal `"plan_suspended"`, devolvido sem tradução pelo `POST /api/reports/generate` e renderizado cru na tela. Isso já existia no fluxo manual antigo, mas a geração automática da feature 005 faz esse texto aparecer sozinho, imediatamente, pra toda org suspensa/cancelada que acessa a rota — sem exigir nenhum clique.

## Expected Behavior

Conforme `requirements.md#RF-06`, o bloqueio de plano suspenso/cancelado deveria se comportar "equivalente ao 403 manual já existente, caindo no mesmo fallback silencioso do RF-07" — ou seja, uma mensagem clara e discreta, não um código interno de sistema. O branch irmão (role `auditor`, `route.ts:87`) já faz isso corretamente: `"Auditores não podem gerar relatórios."`.

## Actual Behavior

Para plano suspenso/cancelado, `route.ts:91` retorna `error: "plan_suspended"`. Esse valor vira, sem tradução, o texto exibido ao usuário no banner de erro (`page.tsx:392-397`). O usuário lê a string `plan_suspended` na tela — parece um erro de sistema/bug, não uma mensagem informativa sobre o estado do plano.

## Steps to Reproduce

1. Simule ou configure uma org com `session.plano === "suspenso"` (ou "cancelado").
2. Acesse `/app/relatorios`.
3. **Esperado**: mensagem clara tipo "Seu plano está suspenso. Entre em contato com o suporte para reativar." (ou texto equivalente já usado em outros pontos do produto para o mesmo estado de plano).
4. **Observado**: banner de erro mostrando literalmente o texto "plan_suspended".

## Evidence

Ver `traceability.root_cause.evidence` — achado por leitura estática do código, sem execução dinâmica ainda.

## Suspected Area

`client-ui` (`page.tsx`) e `route-handlers` (`route.ts`) — o mesmo padrão (`error: "plan_suspended"` sem tradução) também existe em `src/app/api/assistant/route.ts:61`, sugerindo que é uma convenção sistêmica do projeto, não um erro isolado de `reports`.

## Acceptance Criteria

- Ao bloquear por plano suspenso/cancelado, a tela exibe uma mensagem legível em português, não o código `plan_suspended`
- Comportamento equivalente (não crash, não travamento) mantido para o trigger automático e o manual

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `route.ts:91` retorna `error: "plan_suspended"` (código de máquina); `page.tsx` usava `err.error` diretamente como mensagem, sem tradução.

**Veredito de spec:** `spec-correta` — `RF-06`/`RF-07` já esperavam "fallback silencioso"/"aviso discreto"; o código é que não traduzia o código de erro. Nenhum adendo necessário. Escopo do fix ficou restrito a `reports` (não estendido a `assistant/route.ts`, que tem o mesmo padrão — fora do escopo desta feature/bug, registrado como observação nas Agent Notes originais).

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | code | `src/lib/reports/error-messages.ts` (novo) | `translateGenerateErrorMessage`: mapeia `plan_suspended` → frase legível, passthrough seguro pro resto |
| CHG-002 | code | `page.tsx` | `handleGenerate` traduz a mensagem antes de propagar |
| CHG-003 | test | `scripts/test-reports-error-messages.ts` (novo) | 1 reprodução + 2 regressão |

**Testes:** todos os 3 já nasceram verdes (a função foi escrita corrigida desde o início, seguindo o mesmo padrão de prova usado no `SCP1`: reprodução comprovada por não conter o texto cru, regressão comprovando que mensagens já legíveis e códigos desconhecidos não quebram).

```
✓ BUG-20260723-PSU1 (reproducao): 'plan_suspended' NAO deve aparecer cru na mensagem traduzida
✓ mensagem ja legivel (ex.: erro de auditor) passa direto, sem alteracao
✓ codigo desconhecido passa direto (fallback seguro, sem quebrar)
```

`npx tsc --noEmit` limpo após a mudança.

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `03f61f7` (código) / `79425a8` (trava), push para `origin/main`. `closure.satisfied: true` — usuário decidiu promover a `resolved` em 2026-07-23 (via `/reversa-debugger-graph`), tratando a entrega já confirmada como suficiente, dispensando espera adicional pela janela de observação.

## Agent Notes

- Achado via `/reversa-depth-inspection` (varredura `varredura-01-pos-coding-005`), lente "Estados de erro e edge cases", logo após `/reversa-coding` da feature 005.
- Defeito é PRÉ-EXISTENTE ao código da feature 005 (o padrão `err.error` cru já estava no botão manual antigo) — a feature 005 não o criou, mas aumentou muito sua visibilidade/frequência ao automatizar o disparo. Avaliar se o fix fica escopado só a `reports` ou se vale a pena estender a `assistant/route.ts` (mesmo padrão) — mas isso é decisão de escopo do `/reversa-debugger-fix`, não deste achado.
- Nenhuma correção foi aplicada por este achado.
