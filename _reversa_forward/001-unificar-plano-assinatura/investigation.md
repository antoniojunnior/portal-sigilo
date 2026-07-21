# Investigation: Unificação para plano único de assinatura

> Identificador: `001-unificar-plano-assinatura`
> Data: `2026-07-21`

## Pesquisa de fundo

Não há dependência de padrão externo de mercado a pesquisar — a mudança é de modelagem de negócio interna (colapsar 2 planos em 1), não de técnica nova. A "pesquisa" real desta feature foi 100% arqueológica sobre o próprio código-fonte já extraído em `_reversa_sdd/`, listada abaixo.

## Levantamento de todos os pontos de diferenciação por plano no código atual

Busca sistemática por toda ocorrência de comparação/uso de `plano`/`plano_ativo` nos artefatos já extraídos (`_reversa_sdd/*/design.md`, `_reversa_sdd/domain.md`, `_reversa_sdd/permissions.md`):

| # | Ponto | Arquivo real | Tipo de diferenciação |
|---|---|---|---|
| 1 | Gate do assistente de IA | `src/app/api/assistant/route.ts:59-65` | Bloqueio total (`entrada`) + bloqueio por estado (`suspenso`/`cancelado`, preservado) |
| 2 | Gate de insights de IA | `src/app/api/dashboard/insights/route.ts:16-24` | Mensagem fixa de upgrade no lugar do insight real |
| 3 | Gate de triagem automática | `src/lib/triagem.ts:150-163` | Early-return para triagem manual |
| 4 | Gate de relatório personalizado | `src/app/api/reports/generate/route.ts:47-49` | Bloqueio de um subtipo de relatório |
| 5 | Limite de usuários | `src/app/api/dashboard/users/route.ts:9-13`, `firestore.rules:78-81` | Valor numérico diferente por plano |
| 6 | Limite de storage | `src/app/api/upload-attachment/route.ts:6-10` | Valor numérico diferente por plano |
| 7 | Preço/nome exibido | `src/lib/planos.ts` | Conteúdo de UI |
| 8 | Preço cobrado | `src/lib/asaas/createPaymentLink.ts:7-16` | Valor cobrado na Asaas |
| 9 | Validação de checkout | `src/app/api/checkout/create/route.ts:9-11` | Whitelist de identificador aceito |
| 10 | Resolução de plano por valor pago (consulta) | `src/lib/asaas/getSubscription.ts:26-31` | Mapeamento inverso valor→plano |
| 11 | Resolução de plano por valor pago (provisionamento) | `functions/src/webhookAsaas.ts:93-98` | Mesma lógica, duplicada no webhook |

Confirmação: 11 pontos de código + 1 documento de produto (PRD §3) + 1 tipo TypeScript (`Plano`) = escopo total desta feature. Nenhum ponto adicional foi encontrado ao cruzar contra `_reversa_sdd/traceability/spec-impact-matrix.md`.

## O que NÃO foi encontrado (e por quê isso importa)

- **Nenhuma rota de upgrade/downgrade de plano** — já era uma lacuna conhecida da extração (`_reversa_sdd/state-machines.md#3`, `questions.md#pergunta-1`). Isso simplifica esta feature: não existe um fluxo de "trocar de plano" para adaptar, porque ele nunca existiu.
- **Nenhuma lógica de proração de cobrança** — como a migração assumida é "ajusta no próximo ciclo, não retroativo" (RN-08), não há necessidade de calcular valores parciais.

## Alternativas avaliadas

| Alternativa | Descartada por quê |
|---|---|
| Manter 2 planos no código mas esconder a diferenciação na UI | Não atende ao pedido — o requirements explicitamente pede eliminação da diferenciação de acesso, não só de apresentação |
| Migrar dado de orgs via trigger automático no primeiro login pós-deploy (lazy migration) em vez de script one-shot | Mais complexo (precisa de lock/idempotência por request), sem benefício real já que a mudança de código já concede acesso pleno independente do valor armazenado — o script one-shot é só para limpar o dado, não é bloqueante para o comportamento correto |
| Reaproveitar o literal `"gestao"` como plano único (evita migrar o valor em si) | Descartado em D-01 do `roadmap.md` — nome desalinhado do produto a longo prazo |

## Padrões aplicáveis já usados no projeto

- Scripts one-shot de manutenção de dados já existem (`scripts/seed-emulator.ts`, `scripts/seed-remote.ts`) — o script de migração desta feature segue o mesmo padrão de localização e execução (`npx ts-node`)
- Audit log por mutação relevante já é padrão em toda escrita de `orgs` (`_reversa_sdd/data-dictionary.md#audit_logs`) — a migração segue a mesma convenção
