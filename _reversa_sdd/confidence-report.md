# Relatório de Confiança — portal-sigilo

> Gerado pelo Reviewer em 2026-07-20.
> Revisão cruzada via Codex: **não realizada** — plugin Codex não detectado como disponível nesta sessão (esperado; `doc_level=completo` torna a revisão cruzada opcional, não obrigatória).

---

## Resumo Geral

| Nível | Quantidade | Percentual |
|-------|-----------|------------|
| 🟢 CONFIRMADO | 555 | 72.6% |
| 🟡 INFERIDO   | 97 | 12.7% |
| 🔴 LACUNA     | 112 | 14.7% |
| **Total**     | 764 | 100% |

**Confiança geral:** ((555 + 97×0.5) / 764) ≈ **79.0%**

> Nota metodológica: a contagem de 🔴 é inflada por `_reversa_sdd/permissions.md`, onde a Matriz por recurso reaproveita 🔴 como valor "não permitido" (booleano de acesso), não como lacuna de conhecimento — ver nota de revisão inserida no topo desse arquivo. Descontando esse uso duplo (~36 ocorrências na matriz de permissões que não são lacunas reais), a confiança geral efetiva sobre conhecimento do sistema é mais próxima de **83-84%**.

---

## Por Spec (units, granularidade `endpoint`)

| Spec | 🟢 | 🟡 | 🔴 | Confiança |
|------|----|----|-----|-----------|
| `assistant/` | 25 | 1 | 3 | 88% |
| `auth/` | 24 | 2 | 1 | 93% |
| `billing/` | 24 | 1 | 3 | 89% |
| `cases/` | 23 | 1 | 2 | 90% |
| `chat/` | 29 | 4 | 2 | 89% |
| `checkout/` | 15 | 4 | 1 | 85% |
| `dashboard/` | 43 | 4 | 3 | 90% |
| `messages/` | 9 | 3 | 1 | 81% |
| `orgs/` | 8 | 2 | 4 | 64% |
| `reports/` | 26 | 2 | 1 | 93% |
| `upload-attachment/` | 22 | 2 | 3 | 85% |

## Por Documento Global

| Documento | 🟢 | 🟡 | 🔴 | Observação |
|---|----|----|-----|---|
| `inventory.md` + `dependencies.md` | 15 | 8 | 4 | Scout |
| `code-analysis.md` | 13 | 7 | 7 | Archaeologist |
| `data-dictionary.md` | 107 | 10 | 8 | Archaeologist — maior volume de afirmações granulares (campo a campo) |
| `domain.md` | 9 | 3 | 3 | Detective |
| `state-machines.md` | 4 | 4 | 7 | Detective — concentra as lacunas mais relevantes do sistema (ciclo de vida de plano) |
| `permissions.md` | 63 | 6 | 36 | Detective — ver nota metodológica acima sobre uso duplo de 🔴 |
| `architecture.md`, `c4-*.md`, `erd-complete.md` | 23 | 18 | 13 | Architect |
| `traceability/*.md` | 58 | 7 | 2 | Architect + Writer |
| `adrs/*.md` (5 arquivos) | 15 | 7 | 7 | Detective — decisões retroativas, naturalmente mais inferência |

---

## Lacunas Pendentes 🔴 (as mais relevantes, priorizadas)

### Ciclo de vida de plano incompleto
- **Sem endpoint de upgrade/downgrade de plano nem de reativação pós-suspensão** — apesar de existir `docs/stories/9.6.alterar-plano-upgrade-downgrade.story.md` e menções de UI "Alterar Plano" nas stories 9.7-9.10.
  - Pergunta correspondente: `questions.md#pergunta-1`

### Anexos órfãos
- **Path `orgs/{org_id}/cases/temp/{uuid}/...` gerado pelo upload nunca é lido/promovido** por nenhuma rota encontrada (`cases`, `chat`, `dashboard`) — o vínculo entre anexo enviado e `case.anexos[]`/`message.anexos[]` não foi localizado.
  - Pergunta correspondente: `questions.md#pergunta-2`

### Divergência SECURITY.md vs. implementação (S7/S8)
- **Limite de 200MB/caso e 10 arquivos/relato documentados em `docs/SECURITY.md` não implementados** em `upload-attachment` (só há limite de 50MB/arquivo e limite de storage por plano).
- **Criptografia de campo para dados sensíveis (S8) não encontrada** em nenhuma rota que grava `messages.texto`/`cases.triagem_ia`.
  - Pergunta correspondente: `questions.md#pergunta-3`

### Auditor e o assistente de IA
- **`POST /api/assistant` não bloqueia explicitamente `role === "auditor"`**, diferente de `reports/generate`/`approve`/`export` e `dashboard/cases/[caseId]/mencionados`, que bloqueiam auditor de forma redundante à Firestore Rule.
  - Pergunta correspondente: `questions.md#pergunta-4`

### Notificações sem endpoint de leitura
- **Só existe contagem de não lidas** (`GET /dashboard/notifications/count`) — nenhuma rota para marcar como lida foi encontrada.
  - Pergunta correspondente: `questions.md#pergunta-5`

### Busca de orgs não escala
- Confirmado como débito técnico conhecido, não uma lacuna de conhecimento — não gera pergunta, já documentado em `orgs/design.md` e `orgs/tasks.md`.

Demais lacunas 🔴 (menores, específicas de unit) estão listadas nos respectivos `tasks.md` de cada unit, seção "Lacunas Pendentes".

---

## Recomendações

- [ ] `state-machines.md` (Org.plano_ativo) e `billing/` — priorizar validação do ciclo de vida de plano com o time de produto antes de qualquer reimplementação da unit `billing`/`checkout`
- [ ] `upload-attachment/` — confirmar com o time se a promoção de anexo temp→definitivo existe em algum lugar não coberto pela extração (client-side, outra branch) antes de assumir que é lacuna real
- [ ] `docs/SECURITY.md` — reconciliar o documento com a implementação real (S7/S8) ou implementar o que falta; risco de compliance se o documento for usado para alegações a clientes
- [ ] `permissions.md` — se o Reversa rodar novamente sobre este projeto, considerar usar um marcador diferente de 🟢/🔴 para "permitido/negado" em matrizes de acesso, reservando a escala de confiança exclusivamente para afirmações epistêmicas

---

## Histórico de Reclassificações

| De | Para | Afirmação | Evidência |
|----|------|-----------|-----------|
| — | — | Nenhuma reclassificação de 🟡/🔴 individual foi necessária nesta revisão — as classificações do Archaeologist/Detective/Architect/Writer se mantiveram consistentes na conferência cruzada contra o código-fonte já lido nesta sessão | — |
| N/A | Nota adicionada | `permissions.md` — esclarecido uso duplo do símbolo 🔴 (valor de matriz vs. confiança) | `_reversa_sdd/permissions.md:4-6` [Revisão] |

## Validação das Matrizes

- **`code-spec-matrix.md`**: ✅ completa — todos os 31 Route Handlers mapeados a alguma unit (100%); frontend (`src/app/**/page.tsx`, `src/components/**`) explicitamente marcado como fora de escopo desta rodada (🔴 documentado, não omitido silenciosamente)
- **`spec-impact-matrix.md`**: ✅ reflete as dependências reais observadas no código (`verifySession`, `logAudit`, `triagem.ts`, etc.) — conferido contra as citações de arquivo:linha em cada unit

## Cobertura das Units vs. Plano Original

Todas as 11 units previstas em `.reversa/plan.md` (Fase 2, granularidade `endpoint`) foram geradas com os 3 arquivos canônicos + `contracts.md`, e as 4 units com múltiplos fluxos complexos (`chat`, `dashboard`, `billing`, `reports`) receberam `flows.md` adicional, conforme planejado no Passo 1 do Writer.
