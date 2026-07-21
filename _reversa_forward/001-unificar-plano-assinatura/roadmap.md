# Roadmap: Unificação para plano único de assinatura

> Identificador: `001-unificar-plano-assinatura`
> Data: `2026-07-21`
> Requirements: `_reversa_forward/001-unificar-plano-assinatura/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Colapsar os dois planos self-service (`entrada`/`gestao`) em um único identificador de plano, herdando o conjunto de features/limites hoje exclusivo do `gestao` (decisão RF-01/RN-03/RN-04 do requirements). A mudança é puramente de **remoção de ramificação condicional**: todo ponto do sistema que hoje faz `if (plano === "entrada")` para restringir algo passa a não ter mais esse `if` — a org simplesmente tem acesso pleno enquanto sua assinatura estiver ativa. Nenhum componente novo é criado; o trabalho é 100% edição de componentes existentes (11 arquivos de código + 1 arquivo de regras + 1 documento de produto) mais um script de migração de dados para orgs já assinantes. O Enterprise (`enterprise`, sob consulta) e o ciclo de vida `suspenso`/`cancelado` ficam intocados.

## 2. Princípios aplicados

Nenhum princípio ativo em `.reversa/principles.md` (arquivo inexistente neste projeto) — seção n/a.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Introduzir um novo identificador de plano único (ex.: `"padrao"`) em vez de reaproveitar o literal `"gestao"` como nome do plano único | Reaproveitar `"gestao"` economizaria uma migração de valor, mas deixaria o nome do plano no banco/código dessincronizado do produto (o produto não tem mais um plano "de entrada" para o qual "gestao" seria a alternativa superior) — nome novo é mais correto a longo prazo | Reaproveitar `"gestao"` sem migrar o valor | 🟡 (depende da confirmação de RN-03/04 do requirements, marcadas 🟡) |
| D-02 | Remover a ramificação condicional em vez de mantê-la e sempre resolver para o mesmo valor | Ramificação morta (`if (plano === "entrada")` que nunca mais é `true`) é dívida técnica automática — remover agora custa o mesmo que manter, mas evita confusão futura | Manter os `if`s e apenas parar de gerar orgs com `plano_ativo="entrada"` | 🟢 |
| D-03 | `VALUE_TO_PLANO` (`getSubscription.ts`) e `determinarPlano` (`webhookAsaas.ts`) são substituídos por resolução direta ao identificador único, sem tabela de faixa de valor | Não há mais 2 valores de cobrança para diferenciar — a lógica de "qual valor corresponde a qual plano" deixa de fazer sentido | Manter a tabela com uma entrada só | 🟢 |
| D-04 | Consolidar `PLANOS_CONFIG` (`createPaymentLink.ts`) e `PLANOS` (`src/lib/planos.ts`) numa única fonte, resolvendo RF-06 do requirements junto com esta mudança (já que ambos precisam ser editados de qualquer forma) | Custo marginal baixo de resolver o débito técnico já documentado (`_reversa_sdd/checkout/design.md`) enquanto os dois arquivos já estão sendo tocados | Editar os dois separadamente mantendo a duplicação | 🟢 |
| D-05 | Migração de orgs existentes via script one-shot (`scripts/`) que roda uma vez, não via lógica embutida em `webhookAsaas.ts` | O padrão de scripts one-shot já existe no projeto (`scripts/seed-*.ts`) — mais simples que embutir lógica de migração num webhook que só deveria tratar eventos novos | Migrar orgs on-the-fly na próxima leitura de sessão (`verifySession`) | 🟡 (depende de RN-08, marcada 🟡) |
| D-06 | `firestore.rules#getPlanoLimit` retorna um valor fixo (10) para qualquer `plano_ativo` que não seja `enterprise`, em vez de comparar contra o novo identificador único | Reduz acoplamento entre a Rule e o nome exato do plano único — se o nome mudar de novo no futuro, a Rule não quebra | Comparar `plano == "<novo-id>" ? 10 : ...` | 🟡 |

## 4. Premissas

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| Plano único herda 10 usuários / 20GB / R$227-197 do antigo "Gestão" | §4 RN-03, RN-04; §9 Esclarecimentos (decisão YOLO) | Se o dono do negócio quiser outro preço/limite, D-01 a D-06 continuam válidas, mas os valores literais em `data-delta.md` e `interfaces/checkout-create.md` mudam |
| Enterprise continua separado, fora desta feature | §4 RN-09; §9 Esclarecimentos | Se Enterprise também deveria ser absorvido, adiciona escopo (remover a 3ª linha da tabela de planos também), não invalida o já decidido |
| Migração de assinantes é automática, sem re-contratação, preço ajusta no próximo ciclo | §4 RN-08; §9 Esclarecimentos | Se a decisão real for "preço legado protegido", D-05 muda de "atualiza `plano_ativo` e segue cobrando o valor antigo" para "atualiza `plano_ativo` mas grava um `preco_legado` na org e o checkout/billing passam a checar esse campo" — mudança de escopo maior |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Config de planos (UI) | `_reversa_sdd/checkout/design.md` → `src/lib/planos.ts` | regra-alterada | Array `PLANOS` passa de 3 entradas (entrada/gestao/enterprise) para 2 (plano único/enterprise) |
| Config de planos (cobrança) | `_reversa_sdd/checkout/contracts.md` → `src/lib/asaas/createPaymentLink.ts` | regra-alterada | `PLANOS_CONFIG` passa de 2 chaves (entrada/gestao) para 1 |
| Validação de checkout | `_reversa_sdd/checkout/design.md` → `src/app/api/checkout/create/route.ts` | contrato-alterado | `isPlanoValido` aceita só o novo identificador único |
| Resolução de plano por valor pago | `_reversa_sdd/billing/design.md` → `src/lib/asaas/getSubscription.ts` | regra-removida | `VALUE_TO_PLANO` deixa de existir |
| Resolução de plano no webhook | `_reversa_sdd/adrs/003-*.md` → `functions/src/webhookAsaas.ts` | regra-removida | `determinarPlano` deixa de existir, `provisionOrg` sempre usa o identificador único |
| Gate de assistente de IA | `_reversa_sdd/assistant/requirements.md#RN` → `src/app/api/assistant/route.ts` | regra-removida | Bloco `if (session.plano === "entrada")` removido |
| Gate de insights de IA | `_reversa_sdd/dashboard/design.md` → `src/app/api/dashboard/insights/route.ts` | regra-removida | Ramo `plano === "entrada"` (mensagem fixa de upgrade) removido |
| Gate de triagem automática | `_reversa_sdd/chat/design.md` → `src/lib/triagem.ts` | regra-removida | Early-return `planoAtivo === "entrada"` em `runTriagem` removido |
| Gate de relatório personalizado | `_reversa_sdd/reports/design.md` → `src/app/api/reports/generate/route.ts` | regra-removida | Checagem `tipo === "personalizado" && plano === "entrada"` removida |
| Limite de usuários | `_reversa_sdd/dashboard/design.md` → `src/app/api/dashboard/users/route.ts` | regra-alterada | `PLAN_USER_LIMITS` colapsa para valor único (10) |
| Limite de usuários (Rules) | `firestore.rules:78-81` | regra-alterada | `getPlanoLimit` colapsa para valor único (10), `enterprise` continua ilimitado |
| Limite de storage | `_reversa_sdd/upload-attachment/design.md` → `src/app/api/upload-attachment/route.ts` | regra-alterada | `STORAGE_LIMITS_BYTES` colapsa para valor único (20GB) |
| Tipo de domínio `Plano` | `_reversa_sdd/data-dictionary.md` → `src/lib/types/index.ts` | regra-alterada | União de valores passa a refletir o identificador único + `enterprise` + `suspenso`/`cancelado` (resolve também a divergência #4 já registrada no `data-dictionary.md`) |
| Página pública de planos | `_reversa_sdd/traceability/code-spec-matrix.md` (frontend fora de escopo da extração, mas tocado aqui) → `src/app/planos/*` | regra-alterada | Remove comparação de 2 tiers, exibe oferta única + Enterprise à parte |
| Documentação de produto | `docs/PRD_PortalSigilo_v2.md#3` | regra-alterada | Tabela "Planos e limites por tenant" perde a coluna/linha de um dos dois planos self-service |

## 6. Delta no modelo de dados

- Resumo: `orgs.plano_ativo` passa a aceitar um novo valor (identificador do plano único) no lugar de `"entrada"`/`"gestao"`; orgs existentes com esses dois valores são migradas por script one-shot. Nenhum campo novo é adicionado ao documento `Org` — é uma migração de **valor**, não de **schema**.
- Detalhe completo em: `_reversa_forward/001-unificar-plano-assinatura/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `POST /api/checkout/create` | HTTP | `_reversa_forward/001-unificar-plano-assinatura/interfaces/checkout-create.md` |

Os demais endpoints tocados (`assistant`, `dashboard/insights`, `dashboard/users`, `upload-attachment`, `reports/generate`) mudam **comportamento** (deixam de retornar erro/gate), mas não mudam **shape** de request/response — não precisam de arquivo de interface próprio, o delta já está descrito na seção 5.

## 8. Plano de migração

1. Deploy do código com o novo identificador de plano único convivendo, por um instante, com orgs ainda em `entrada`/`gestao` — os gates já removidos do código significam que, mesmo antes da migração de dados rodar, toda org ativa (independente do valor de `plano_ativo`) já passa a ter acesso pleno (a remoção do `if` é o que garante isso, não a migração de dado em si)
2. Rodar o script one-shot de migração (`scripts/migrate-plano-unico.ts`, a criar) que:
   1. Lista todas as orgs com `plano_ativo in ["entrada", "gestao"]`
   2. Atualiza `plano_ativo` para o identificador único
   3. Grava um `audit_log` por org migrada (`acao: "plano_migrado"`, `detalhes: {de: "<valor antigo>", para: "<identificador único>"}`)
3. Validar manualmente uma amostra de orgs migradas (checar `dashboard/org` retorna o novo `plano_ativo`, checar `billing/info` reflete o novo valor)
4. Atualizar `docs/PRD_PortalSigilo_v2.md` §3 e `firestore.rules#getPlanoLimit` como parte do mesmo deploy (não depois) — evita janela onde a Rule ainda diferencia por plano antigo enquanto o Route Handler já não diferencia mais

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Preço/limite assumido (D-01, RF-01/04/05) não corresponde à decisão real do dono do negócio | alto | médio | Todos os valores literais (10 usuários, 20GB, R$227/197) estão isolados em `data-delta.md`/`interfaces/checkout-create.md` — trocar é edição pontual, não redesenho; **apresentar este roadmap para validação antes de codar**, conforme pedido original do usuário |
| Migração de orgs (`plano_migrado`) falha parcialmente (algumas orgs migram, outras não) | médio | baixo | Script one-shot deve ser idempotente (rodar de novo só afeta orgs ainda em `entrada`/`gestao`) e logar cada org processada, permitindo reexecução segura |
| Janela de deploy onde `firestore.rules` ainda usa `getPlanoLimit` com valores antigos enquanto o Route Handler já mudou | médio | baixo | Passo 4 do plano de migração força os dois a irem juntos no mesmo deploy |
| Remoção do gate de `plano === "entrada"` em 4 rotas (assistant, insights, triagem, reports) esquece algum ponto não mapeado nesta extração | médio | baixo | `_reversa_sdd/traceability/spec-impact-matrix.md` já mapeia os consumidores de `session.plano`/`orgData.plano_ativo` — usar essa matriz como checklist de busca (`grep -rn "plano"`) antes de fechar o PR |
| Enterprise (`enterprise`) ser afetado sem querer, já que compartilha o mesmo campo `plano_ativo` | baixo | baixo | Toda edição desta feature deve preservar o ramo `enterprise` explicitamente (ex.: `getPlanoLimit` mantém `enterprise → null`) — verificar em code review |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] Dono do negócio validou os 3 valores assumidos (preço, limites, estratégia de migração) antes do merge

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-plan` | reversa |
