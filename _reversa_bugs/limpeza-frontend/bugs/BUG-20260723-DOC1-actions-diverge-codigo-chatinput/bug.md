---
schema_version: 1
id: BUG-20260723-DOC1
display_number: 23
title: actions.md T001 (marcado concluído) descreve deletar ChatInput.tsx/ChatAttachment.tsx, mas os arquivos continuam existindo e têm consumidor real
status: active
phase: delivering

change_risk:
  classification: baixa
  motivos:
    - "Correção puramente textual (adendo), nenhum código tocado — ChatInput.tsx/ChatAttachment.tsx continuam intocados, como devem"
severity: medium
priority: P2
created: 2026-07-23
updated: 2026-07-23

origin:
  type: inspection
  external_ref: null

area: saas-core
module: client-ui
feature: unclassified
labels: [documentation-integrity, process]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: null
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_forward/007-limpeza-frontend/actions.md#T001"
    - "_reversa_forward/007-limpeza-frontend/requirements.md#2"
  affected_code:
    - "src/components/portal/ChatInput.tsx"
    - "src/components/portal/ChatAttachment.tsx"
  root_cause:
    state: confirmed
    hypothesis: null
    causal_path:
      - "requirements.md#2 (Contexto a partir do legado) afirma: '7 componentes com 0 imports (ProgressSteps, RiskCell, ChatInput, ChatAttachment, PortalLayout, PortalHeader, diagnostic endpoint)' — a premissa 'ChatInput/ChatAttachment com 0 imports' está ERRADA"
      - "ChatInput.tsx e ChatAttachment.tsx são importados por src/components/portal/ChatContainer.tsx, que por sua vez é importado por src/app/[slug]/chat/page.tsx — cadeia de consumo real e ativa, não órfã"
      - "actions.md#T001 lista explicitamente 'Deletar arquivos: ProgressSteps.tsx, RiskCell.tsx, PortalLayout.tsx, PortalHeader.tsx, ChatInput.tsx, ChatAttachment.tsx' e está marcado `[X]` (concluído)"
      - "Na execução real (commit d7ae0c0), só 4 dos 6 arquivos listados foram de fato deletados (ProgressSteps, RiskCell, PortalLayout, PortalHeader) — ChatInput.tsx e ChatAttachment.tsx permanecem intactos no repositório, corretamente preservados por terem consumidor real"
      - "O checkbox [X] e a descrição da tarefa não foram atualizados pra refletir essa divergência consciente — o registro (actions.md) hoje afirma algo que não aconteceu, sem nota explicando por quê"
    evidence:
      - ref: "_reversa_forward/007-limpeza-frontend/actions.md#T001"
        observation: "lista ChatInput.tsx/ChatAttachment.tsx entre os arquivos a deletar, status [X]"
      - ref: "grep -rln \"ChatInput\\|ChatAttachment\" src/"
        observation: "ambos os arquivos existem; ChatContainer.tsx os importa; ChatContainer.tsx é importado por src/app/[slug]/chat/page.tsx"
      - ref: "git show d7ae0c0 --stat"
        observation: "mensagem de commit e diff real só removem ProgressSteps/RiskCell/PortalLayout/PortalHeader — ChatInput/ChatAttachment não aparecem como deletados"
    code_refs:
      - {file: "src/components/portal/ChatInput.tsx", symbol: null, commit: null}
      - {file: "src/components/portal/ChatAttachment.tsx", symbol: null, commit: null}
  reproduction_tests:
    - "scripts/test-chatinput-alive.ts (\"ChatInput.tsx e ChatAttachment.tsx continuam existindo\")"
  regression_tests:
    - "scripts/test-chatinput-alive.ts (guarda contra deleção futura baseada na premissa incorreta)"

spec_verdict: spec-desatualizada

change_set:
  - id: CHG-001
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260723-DOC1-v001.md"
    purpose: "Formaliza que ChatInput.tsx/ChatAttachment.tsx tinham consumidor real e nunca deveriam constar como '0 imports'/deletados; actions.md#T001 e requirements.md#2 originais permanecem intocados, leitura corrigida via adendo"
  - id: CHG-002
    kind: test
    artifact: "scripts/test-chatinput-alive.ts (novo)"
    purpose: "Guarda de regressão: ChatInput.tsx/ChatAttachment.tsx devem continuar existindo com ChatContainer.tsx como consumidor"

closure:
  policy: production-service
  satisfied: false
resolution_kind: fixed
---

# Divergência entre actions.md e código real (ChatInput/ChatAttachment)

## Summary

O `requirements.md` da feature 007 listou `ChatInput.tsx`/`ChatAttachment.tsx` como código morto (0 imports), e `actions.md#T001` (marcado `[X]`, concluído) descreve deletá-los junto com outros 4 componentes. Na prática, esses 2 arquivos JAMAIS foram deletados — e corretamente assim, porque têm um consumidor real (`ChatContainer.tsx`, usado em `/[slug]/chat/page.tsx`). O problema não é o código (que está certo), é que o registro da tarefa não reflete o que de fato aconteceu.

## Expected Behavior

Uma tarefa marcada `[X]` (concluída) deveria corresponder exatamente ao que foi executado. Se parte de uma tarefa foi intencionalmente NÃO executada (por ter se provado incorreta), isso deveria estar anotado explicitamente (ex.: em "Notas de execução" ou um ajuste no texto da tarefa), não silenciosamente omitido.

## Actual Behavior

`actions.md#T001` continua afirmando que `ChatInput.tsx`/`ChatAttachment.tsx` foram deletados. Não foram — e não deveriam ser, já que têm consumidor ativo. A premissa de origem (`requirements.md`, "0 imports") estava errada para esses 2 componentes especificamente (embora correta para os outros 4).

## Steps to Reproduce

1. Ler `_reversa_forward/007-limpeza-frontend/actions.md#T001`.
2. Verificar se `src/components/portal/ChatInput.tsx` e `ChatAttachment.tsx` existem: `ls src/components/portal/`.
3. **Esperado**: se T001 diz que foram deletados e está `[X]`, os arquivos não deveriam existir.
4. **Observado**: os arquivos existem, com consumidor real (`ChatContainer.tsx` → `/[slug]/chat/page.tsx`).

## Evidence

`grep` de consumidores + `git show d7ae0c0 --stat` — ver `traceability.root_cause`.

## Suspected Area

`client-ui` — na verdade, o "suspected area" real é a documentação/rastreabilidade do ciclo forward (`actions.md`), não o código de produção, que está correto.

## Acceptance Criteria

- `actions.md#T001` atualizado pra refletir a execução real: remover `ChatInput.tsx`/`ChatAttachment.tsx` da lista de arquivos deletados, com nota explicando que a premissa de "0 imports" estava errada pra esses 2 (têm consumidor via `ChatContainer.tsx`)
- `requirements.md#2` idealmente corrigido também, ou pelo menos uma nota de erratum

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

**Root cause (confirmado):** `requirements.md#2` errou a premissa "0 imports" pra `ChatInput.tsx`/`ChatAttachment.tsx` (têm consumidor real via `ChatContainer.tsx`); `actions.md#T001` herdou o erro e ficou marcado `[X]` sem nota da execução parcial (só 4 dos 6 arquivos listados foram de fato deletados, e corretamente assim).

**Veredito de spec:** `spec-desatualizada`. `actions.md`/`requirements.md` são artefatos do ciclo forward, somente leitura pra este skill — nenhuma edição direta neles. Adendo gerado: `_reversa_sdd/addenda/bug-BUG-20260723-DOC1-v001.md`, corrigindo a leitura sem alterar o texto original.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | specification | adendo v001 | Corrige leitura de `actions.md#T001`/`requirements.md#2` |
| CHG-002 | test | `scripts/test-chatinput-alive.ts` | Guarda contra deleção futura baseada na premissa errada |

**Sem change_set de código**: nenhum arquivo de produção foi tocado, conforme a nota de escopo do bug ("Nenhuma ação de código deve remover ChatInput.tsx/ChatAttachment.tsx"). `ChatInput.tsx`/`ChatAttachment.tsx` seguem intocados, como já estavam certos.

**Testes:** verde (`npx ts-node scripts/test-chatinput-alive.ts`).

**Closure (production-service):** `resolution_kind: fixed`, `closure.satisfied: false` — falta `delivery` e `post_fix_observation`.

## Agent Notes

- Achado via `/reversa-depth-inspection` (feature 007), lente "Conformidade com spec" — mas aplicada à documentação/rastreabilidade, não ao código (que está correto).
- Este bug não tem `change_set` de código esperado — a "correção" é textual (atualizar `actions.md`/`requirements.md`), possivelmente nem exigindo o ciclo completo de testes vermelho→verde do `/reversa-debugger-fix`. Avaliar se cabe fechamento simplificado.
- Nenhuma ação de código deve remover `ChatInput.tsx`/`ChatAttachment.tsx` — eles são código VIVO, não morto.
