# Máquinas de Estado — portal-sigilo

> Gerado pelo Detective em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

## 1. `Case.status`

🟢 Valores confirmados em `src/lib/types/index.ts` (`CaseStatus`) e uso real em `src/app/api/dashboard/cases/[caseId]/route.ts` (PATCH), `src/app/api/dashboard/metrics/route.ts` (cálculo de resolvidos).

```mermaid
stateDiagram-v2
    [*] --> aguardando_triagem: case criado (POST /api/cases ou /api/chat)
    aguardando_triagem --> em_apuracao: gestor assume o caso (PATCH status)
    em_apuracao --> pendente_informacao: gestor solicita mais info (PATCH status)
    pendente_informacao --> em_apuracao: denunciante responde / gestor retoma
    em_apuracao --> encerrado_sem_infracao: PATCH status
    em_apuracao --> encerrado_com_acao: PATCH status
    pendente_informacao --> encerrado_sem_infracao: PATCH status
    pendente_informacao --> encerrado_com_acao: PATCH status
    encerrado_sem_infracao --> [*]
    encerrado_com_acao --> [*]
```

🟡 **Transições não enforçadas no código**: `PATCH /api/dashboard/cases/[caseId]` aceita **qualquer** valor de `CaseStatus` sem validar se a transição a partir do status atual é permitida (não há máquina de estados explícita no servidor — é uma atualização de campo livre, não uma transição guardada). O diagrama acima é a transição **esperada pelo domínio**, inferida a partir dos nomes e do uso em métricas (`resolvidos` = union de `encerrado_sem_infracao`/`encerrado_com_acao`), não uma regra imposta pelo código.

🔴 **LACUNA**: não há validação server-side impedindo, por exemplo, reabrir um caso `encerrado_com_acao` de volta para `em_apuracao`, nem impedindo pular direto de `aguardando_triagem` para `encerrado_com_acao`. Se isso for indesejado no negócio real, é uma regra que falta implementar.

Toda transição de `status` gera:
- Item em `historico` via `FieldValue.arrayUnion` (append-only)
- Audit log `case_status_changed` com `detalhes: {from, to}`

## 2. `Report.status`

🟢 Única máquina de estado com transições **efetivamente guardadas** no código (`src/app/api/reports/[reportId]/approve/route.ts`, `.../export/route.ts`).

```mermaid
stateDiagram-v2
    [*] --> rascunho: POST /api/reports/generate
    rascunho --> aprovado: POST /approve (bloqueado para role=auditor)
    aprovado --> rascunho: DELETE /approve (somente role=admin)
    aprovado --> exportado: GET /export
    exportado --> [*]

    note right of aprovado
        POST /approve em status
        aprovado ou exportado
        retorna 409 (idempotência)
    end note
    note right of exportado
        GET /export com status
        != aprovado retorna 409
    end note
```

Guardas confirmadas:
- `rascunho → aprovado`: role ≠ `auditor`; se já `aprovado`/`exportado`, 409
- `aprovado → rascunho`: role === `admin` apenas
- `aprovado → exportado`: só permitido com `status === "aprovado"` (senão 409); role ≠ `auditor`
- Não existe transição `exportado → *` no código — `exportado` é terminal

Cada transição gera audit log dedicado: `report_generated`, `report_approved`, `report_reverted`, `report_exported`.

## 3. `Org.plano_ativo`

🟡 Não modelado como enum fechado em `types/index.ts` (`Plano` só declara `entrada`/`gestao`/`enterprise`), mas o comportamento em runtime revela uma máquina de estados implícita com 5 estados efetivos.

```mermaid
stateDiagram-v2
    [*] --> entrada: webhook Asaas provisiona org (determinarPlano por valor pago)
    [*] --> gestao: webhook Asaas provisiona org (valor >= 197 ou anual >= 97)
    entrada --> gestao: 🔴 upgrade — endpoint não encontrado no código
    gestao --> entrada: 🔴 downgrade — endpoint não encontrado no código
    entrada --> suspenso: webhook PAYMENT_OVERDUE
    gestao --> suspenso: webhook PAYMENT_OVERDUE
    suspenso --> entrada: 🔴 reativação — não encontrada
    suspenso --> gestao: 🔴 reativação — não encontrada
    entrada --> cancelado: DELETE /api/billing/cancel ou webhook SUBSCRIPTION_CANCELED
    gestao --> cancelado: DELETE /api/billing/cancel ou webhook SUBSCRIPTION_CANCELED
    cancelado --> [*]
```

🔴 **LACUNA relevante**: as stories do Epic 9 (9.7-9.11, `docs/stories/`) mencionam "Alterar Plano" / "CTA Alterar Plano" nos títulos, e `docs/stories/9.6.alterar-plano-upgrade-downgrade.story.md` existe — mas nenhuma rota de API para upgrade/downgrade de plano foi encontrada em `src/app/api/`. Ou (a) o endpoint existe em outro nome não coberto pela varredura do Scout, ou (b) a story 9.6 ainda não foi implementada em código apesar de ter arquivo de story. Requer validação humana — ver também `_reversa_sdd/domain.md` sobre o TODO de "desativação do canal".

🟡 **Reativação de plano suspenso**: nenhuma rota trata a transição `suspenso → ativo` explicitamente; presumivelmente ocorre via novo webhook `PAYMENT_CONFIRMED` da Asaas reativando a assinatura, mas `provisionOrg` (que trata `PAYMENT_CONFIRMED`) tem guarda de idempotência que **ignora** orgs já provisionadas (`asaas_customer_id` já existe) — ou seja, um pagamento em atraso que é quitado depois **não parece reverter `plano_ativo` de volta a `entrada`/`gestao`** no código lido. Isso é uma lacuna funcional em potencial, não só de documentação.

## 4. `Case` — sub-fluxo de triagem (não é status, mas afeta o dado)

🟢 Não é uma state machine de status, mas os campos `triagem_manual` / `triagem_ia.needs_manual_review` / `triagem_ia` (preenchido) são mutuamente exclusivos e refletem o caminho percorrido em `runTriagem`:

```mermaid
stateDiagram-v2
    [*] --> pendente: case criado
    pendente --> triagem_manual: plano == entrada
    pendente --> triagem_ia_ok: Claude retorna JSON válido (até 2 tentativas)
    pendente --> triagem_ia_falhou: Claude falha 2x ou retorna JSON inválido
    triagem_manual --> [*]
    triagem_ia_ok --> [*]
    triagem_ia_falhou --> [*]
```

Este sub-fluxo nunca transiciona depois de decidido — não há retry manual de triagem observado no código.
