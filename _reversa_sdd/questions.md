# Perguntas para Validação — portal-sigilo

> Gerado pelo Reviewer em 2026-07-20.
> Responda cada pergunta e me avise quando terminar — basta digitar `reversa`.

---

## Pergunta 1

**Contexto:** Máquina de estados de `Org.plano_ativo` (`_reversa_sdd/state-machines.md` §3) e unit `billing/`. Existe `docs/stories/9.6.alterar-plano-upgrade-downgrade.story.md` e as stories 9.7-9.10 mencionam UI "Alterar Plano" / "CTA Alterar Plano", mas nenhuma rota de API para upgrade/downgrade de plano foi encontrada em `src/app/api/`.
**Spec afetada:** `_reversa_sdd/billing/requirements.md`, `_reversa_sdd/state-machines.md`
**Pergunta:** O endpoint de upgrade/downgrade de plano existe em algum lugar não coberto por esta varredura (branch não mergeada, PR em andamento), ou a story 9.6 ainda não foi implementada em código apesar de ter arquivo de story? Se existe, qual o caminho da rota?
**Impacto:** Se existir, a unit `billing/` precisa de uma 4ª+5ª rota documentada e o diagrama de estados de `Org.plano_ativo` precisa ser corrigido (hoje mostra as transições upgrade/downgrade como 🔴 "endpoint não encontrado").

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 2

**Contexto:** `upload-attachment` salva anexos em `orgs/{org_id}/cases/temp/{uuid}/{uuid}.{ext}`, mas nenhuma rota em `cases`, `chat` ou `dashboard` lê ou "promove" esse path para o array `case.anexos[]`/`message.anexos[]`.
**Spec afetada:** `_reversa_sdd/upload-attachment/design.md`, `_reversa_sdd/erd-complete.md`
**Pergunta:** Existe um passo de vinculação do anexo temporário ao caso/mensagem que não foi capturado nesta extração (talvez client-side puro, sem Route Handler dedicado, ou uma Cloud Function de trigger em Storage não incluída em `functions/src`)? Se sim, onde?
**Impacto:** Se não existir, é uma lacuna funcional real que impede o anexo de aparecer no caso — vale abrir como bug/débito antes de qualquer reimplementação assumir que o fluxo está completo.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 3

**Contexto:** `docs/SECURITY.md` (regras S7 e S8) documenta limite de "200 MB por caso, 10 arquivos por relato" e "criptografia a nível de campo" para dados sensíveis antes de gravar no Firestore. Nenhum dos dois foi encontrado implementado no código (`upload-attachment` só valida 50MB/arquivo + limite de storage por plano; nenhuma rotina de criptografia de campo foi localizada).
**Spec afetada:** `_reversa_sdd/domain.md`, `_reversa_sdd/upload-attachment/requirements.md`
**Pergunta:** `docs/SECURITY.md` está desatualizado (regras aspiracionais nunca implementadas) ou há uma implementação desses controles fora do código-fonte analisado (ex.: nível de infraestrutura Firebase, camada não coberta)?
**Impacto:** Se as regras nunca foram implementadas, `docs/SECURITY.md` deveria ser corrigido para não gerar uma falsa alegação de conformidade LGPD a clientes/auditores. Se implementadas em outro lugar, a spec de `upload-attachment` precisa documentar onde.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 4

**Contexto:** `POST /api/assistant` não bloqueia explicitamente `role === "auditor"` no código, diferente de `reports/generate`, `reports/approve`, `reports/export` e `dashboard/cases/[caseId]/mencionados`, que bloqueiam auditor de forma redundante à Firestore Rule (padrão consistente em todo o resto do sistema, ver ADR-005).
**Spec afetada:** `_reversa_sdd/assistant/requirements.md`, `_reversa_sdd/permissions.md`
**Pergunta:** É intencional que `auditor` possa usar o assistente de IA (diferente do restante do sistema, onde `auditor` é predominantemente leitura-apenas), ou é uma omissão a corrigir?
**Impacto:** Se for omissão, a spec de `assistant` precisa adicionar a checagem de role, e a implementação futura deve replicar o bloqueio.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 5

**Contexto:** `GET /api/dashboard/notifications/count` só conta notificações não lidas — nenhuma rota para marcar uma notificação como lida (`lida: true`) foi encontrada no código.
**Spec afetada:** `_reversa_sdd/dashboard/requirements.md`, `_reversa_sdd/data-dictionary.md`
**Pergunta:** Notificações são marcadas como lidas por algum mecanismo automático (ex.: ao visualizar o caso relacionado) que não ficou explícito no código, ou é uma feature ainda não implementada?
**Impacto:** Se for feature pendente, adicionar como requisito não coberto (RF novo) na unit `dashboard`; se for automático, documentar o gatilho real.

**Resposta:** <!-- preencha aqui -->
