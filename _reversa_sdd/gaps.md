# Lacunas — portal-sigilo

> Gerado pelo Reviewer em 2026-07-20. Lacunas 🔴 que permaneceram sem resposta do usuário no momento da geração deste relatório (a revisão rodou em modo autônomo, sem pausa interativa — ver `questions.md` para as perguntas formais aguardando validação humana).

## Críticas (bloqueiam reimplementação fiel sem decisão humana)

| Lacuna | Unit(s) afetada(s) | Pergunta |
|---|---|---|
| Endpoint de upgrade/downgrade de plano ausente apesar de story existente | `billing/`, `state-machines.md` | `questions.md#pergunta-1` |
| Vínculo anexo-temp → caso/mensagem não localizado | `upload-attachment/`, `erd-complete.md` | `questions.md#pergunta-2` |
| `docs/SECURITY.md` (S7/S8) documenta controles não implementados | `upload-attachment/`, `domain.md` | `questions.md#pergunta-3` |

## Moderadas (afetam correção de detalhe, não impedem reimplementação do essencial)

| Lacuna | Unit(s) afetada(s) | Pergunta |
|---|---|---|
| `auditor` não bloqueado explicitamente em `POST /api/assistant` | `assistant/`, `permissions.md` | `questions.md#pergunta-4` |
| Sem rota para marcar notificação como lida | `dashboard/` | `questions.md#pergunta-5` |
| `Case.status` sem máquina de estados guardada no servidor (aceita qualquer transição) | `dashboard/`, `state-machines.md` | não gerou pergunta formal — comportamento observável, decisão de produto sobre se deveria ser restrito |
| Reativação de org após `PAYMENT_OVERDUE` (suspenso→ativo) não observada no webhook | `billing/`, `state-machines.md` | correlata à pergunta 1 |
| `responsavel_id` no PATCH de caso não validado contra `users` existentes | `dashboard/` | débito técnico, não lacuna de conhecimento |
| `unit_id` não validado contra `units` existentes em `cases`/`chat` na criação | `cases/`, `chat/` | débito técnico, não lacuna de conhecimento |

## Cosméticas / débito técnico conhecido (não bloqueiam nada, apenas registradas)

| Item | Unit(s) afetada(s) |
|---|---|
| `orgs/search` não escala além de ~100 tenants (limite de query + filtro em memória) | `orgs/` |
| `PLANOS_CONFIG` (`checkout`) e `PLANOS` (`src/lib/planos.ts`) são duas fontes de preço independentes | `checkout/` |
| Modelo Claude hardcoded e inconsistente entre chamadas, sem constante central | `assistant/`, `chat/`, `reports/`, e Functions |
| Algoritmo de agregação de métricas de relatório duplicado 3x (`reports/generate`, `scheduledReports.ts`, `dashboard/metrics` parcialmente) | `reports/`, `dashboard/` |
| `getOrgStorageUsed` lista todos os arquivos da org a cada upload, sem cache | `upload-attachment/` |
| Sem testes automatizados de aplicação (só Firestore Rules) | transversal |
| Sem CI/CD configurado | transversal |
| Drift de versões `firebase-admin`/`@anthropic-ai/sdk`/Node entre app raiz e `functions/` | transversal |

## Como resolver

1. Preencha `_reversa_sdd/questions.md` com as respostas das 5 perguntas críticas/moderadas com pergunta formal associada
2. Para os itens sem pergunta formal (linha "não gerou pergunta formal" ou "débito técnico"), decida junto ao time de produto/engenharia se viram trabalho antes da próxima extração
3. Rode `/reversa` novamente após validação — a verificação de regressão semântica (`step-04-regression-check.md`) comparará esta extração com futuras re-extrações caso o ciclo forward já tenha alterado alguma dessas áreas
