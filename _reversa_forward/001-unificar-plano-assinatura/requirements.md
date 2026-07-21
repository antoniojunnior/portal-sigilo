# Requirements: Unificação para plano único de assinatura

> Identificador: `001-unificar-plano-assinatura`
> Data: `2026-07-21`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Substituir o modelo comercial atual de dois planos self-service (`entrada` e `gestao`) por um único plano de assinatura, eliminando toda diferenciação de acesso a features, limites de uso e preço entre eles. Resolve a fragmentação de gates de feature espalhados por 6+ pontos do backend e a divergência de fonte de preço já documentada como débito técnico na extração reversa. Não descreve como será implementado — apenas o que deve passar a ser verdade sobre o produto.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/domain.md#regras-de-negocio-centrais` | "Planos são gates de feature aplicados no servidor, nunca só no client" — 6 pontos distintos de gate por plano `entrada` | 🟢 |
| `_reversa_sdd/billing/design.md` | `VALUE_TO_PLANO` mapeia valor pago → plano (`getSubscription.ts`); frágil a mudança de preço | 🟢 |
| `_reversa_sdd/checkout/design.md` | Duas fontes de preço independentes: `PLANOS_CONFIG` (`createPaymentLink.ts`) e `PLANOS` (`src/lib/planos.ts`) — já registrado como risco 🟡 | 🟢 |
| `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md` | `determinarPlano(payload)` no webhook decide `entrada`/`gestao` por faixa de valor pago | 🟢 |
| `_reversa_sdd/dashboard/requirements.md` §RF-07, `firestore.rules#getPlanoLimit` | Limite de usuários por plano (`entrada`=1, `gestao`=10, `enterprise`=∞), duplicado em Route Handler e Firestore Rules | 🟢 |
| `_reversa_sdd/upload-attachment/requirements.md` | Limite de armazenamento por plano (`entrada`=2GB, `gestao`=20GB, `enterprise`=∞) | 🟢 |
| `_reversa_sdd/reports/requirements.md` | Relatório tipo "personalizado" exige plano ≥ gestão | 🟢 |
| `_reversa_sdd/chat/requirements.md`, `_reversa_sdd/domain.md` | Triagem automática por IA desabilitada no plano `entrada` (`runTriagem` early-return) | 🟢 |
| `_reversa_sdd/assistant/requirements.md`, `_reversa_sdd/dashboard/design.md` | Assistente de IA e Insights de IA bloqueados no plano `entrada` | 🟢 |
| `_reversa_sdd/state-machines.md#3` | Sem endpoint de upgrade/downgrade de plano encontrado hoje — relevante porque a migração de assinantes existentes precisa de um caminho técnico | 🔴 (lacuna já registrada em `questions.md#pergunta-1`) |
| `docs/PRD_PortalSigilo_v2.md` §3 | Tabela oficial "Planos e limites por tenant" — precisa ser reescrita para refletir plano único | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Novo cliente (visitante) | Contratar o Portal Sigilo | Acessa `/planos`, vê uma única oferta, faz checkout sem comparar tiers |
| Admin de org já assinante (`entrada` ou `gestao`) | Continuar usando o produto sem fricção após a mudança | Org é migrada para o plano único sem perder acesso, sem re-contratação manual |
| Time de produto/growth | Simplificar operação comercial | Deixa de manter dois preços, duas configurações de limite e lógica de upgrade/downgrade |
| Denunciante | Não afetado | Nenhum comportamento do portal público de denúncia muda |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Não há mais diferenciação de acesso a feature por plano — toda org com assinatura ativa (não `suspenso`/`cancelado`) tem acesso pleno a assistente de IA, insights de IA, triagem automática por IA e relatórios personalizados. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#regras-de-negocio-centrais` (regra "Planos são gates de feature")
   - Tipo: alterada
2. **RN-02:** O mapeamento de valor pago → identificador de plano (`VALUE_TO_PLANO` em `getSubscription.ts`, `determinarPlano` no webhook Asaas) deixa de existir — toda assinatura confirmada resolve para o único plano existente. 🟢
   - Origem no legado: `_reversa_sdd/billing/design.md`, `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md`
   - Tipo: removida
3. **RN-03:** O limite de usuários gestores por org deixa de variar por plano — passa a existir um único valor de limite: **10 usuários** (herdado do antigo plano "Gestão"), aplicado tanto no Route Handler (`dashboard/users`) quanto nas Firestore Rules (`getPlanoLimit`). 🟡 (decisão de produto assumida em `/reversa-clarify`, ver Esclarecimentos §9, pendente de confirmação do dono do negócio)
   - Origem no legado: `_reversa_sdd/dashboard/requirements.md#RF-07`, `firestore.rules:78-81`
   - Tipo: alterada
4. **RN-04:** O limite de armazenamento por org deixa de variar por plano — passa a existir um único valor de limite: **20 GB** (herdado do antigo plano "Gestão"). 🟡 (decisão de produto assumida em `/reversa-clarify`, ver Esclarecimentos §9, pendente de confirmação do dono do negócio)
   - Origem no legado: `_reversa_sdd/upload-attachment/requirements.md`
   - Tipo: alterada
5. **RN-05:** O tipo de relatório "personalizado" deixa de exigir um plano específico — disponível a qualquer org com assinatura ativa. 🟢
   - Origem no legado: `_reversa_sdd/reports/requirements.md`
   - Tipo: alterada
6. **RN-06:** A triagem automática por IA (`runTriagem`) deixa de ter o caminho de "triagem manual forçada" hoje disparado por `planoAtivo === "entrada"` — toda org ativa recebe triagem por IA. 🟢
   - Origem no legado: `_reversa_sdd/chat/requirements.md`, `_reversa_sdd/domain.md`
   - Tipo: alterada
7. **RN-07:** O checkout (`POST /api/checkout/create`) passa a aceitar um único identificador de plano, com um único par de preços (mensal/anual) — a validação `isPlanoValido` que hoje aceita `entrada`/`gestao` é substituída por validação de plano único. 🟢
   - Origem no legado: `_reversa_sdd/checkout/requirements.md`
   - Tipo: alterada
8. **RN-08:** Orgs existentes com `plano_ativo` igual a `entrada` ou `gestao` são migradas **automaticamente** para o plano único, sem re-contratação manual — orgs em `entrada` ganham imediatamente as features antes restritas ao `gestao`; o valor cobrado ajusta a partir do próximo ciclo de cobrança (não retroativo). 🟡 (decisão de produto assumida em `/reversa-clarify`, ver Esclarecimentos §9, pendente de confirmação do dono do negócio)
   - Origem no legado: `_reversa_sdd/state-machines.md#3`, `_reversa_sdd/data-dictionary.md`
   - Tipo: nova (migração de dado)
9. **RN-09:** O plano `enterprise` ("sob consulta", fora do checkout self-service) **continua existindo como camada separada** acima do plano único — esta feature unifica apenas os dois planos self-service (`entrada`/`gestao`), não o Enterprise. 🟡 (decisão de produto assumida em `/reversa-clarify`, ver Esclarecimentos §9, pendente de confirmação do dono do negócio)
   - Origem no legado: `docs/PRD_PortalSigilo_v2.md#3`, `src/lib/planos.ts`
   - Tipo: preservada (fora do escopo desta feature)
10. **RN-10:** Os estados `suspenso` e `cancelado` de `Org.plano_ativo` continuam existindo e inalterados — a unificação elimina a dimensão "qual plano contratado", não o ciclo de vida da assinatura (ativo/suspenso/cancelado). 🟢
    - Origem no legado: `_reversa_sdd/state-machines.md#3`
    - Tipo: preservada (fora do escopo desta feature)

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O checkout oferece um único plano ("Portal Sigilo" — preço R$227/mês ou R$197/mês no ciclo anual, herdado do antigo "Gestão") em vez de `entrada`/`gestao` | Must | `POST /api/checkout/create` aceita apenas o identificador do plano único; identificadores antigos retornam 400 | 🟡 |
| RF-02 | O webhook de pagamento resolve toda assinatura confirmada para o plano único, sem lógica de faixa de valor | Must | `provisionOrg`/`determinarPlano` não diferenciam mais por valor pago | 🟢 |
| RF-03 | O assistente de IA, insights de IA, triagem automática e relatórios personalizados ficam disponíveis a toda org com assinatura ativa | Must | Nenhuma dessas 4 rotas retorna erro de "feature não disponível" para org ativa | 🟢 |
| RF-04 | O limite de usuários gestores por org passa a ser único (10 usuários), aplicado de forma consistente no Route Handler e na Firestore Rule | Must | `PLAN_USER_LIMITS`/`getPlanoLimit` retornam sempre 10 para qualquer org ativa | 🟡 |
| RF-05 | O limite de armazenamento por org passa a ser único (20 GB) | Must | `STORAGE_LIMITS_BYTES` aplica 20GB para qualquer org ativa | 🟡 |
| RF-06 | Existe uma única fonte de verdade de preço/nome do plano, eliminando a divergência entre `PLANOS_CONFIG` e `src/lib/planos.ts` | Should | Preço exibido em `/planos` é idêntico ao cobrado no checkout, verificável por leitura de um único arquivo/config | 🟢 |
| RF-07 | A página pública `/planos` exibe uma única oferta, sem comparação de tiers (Enterprise pode seguir listado como "sob consulta" à parte, conforme RN-09) | Must | Página não renderiza mais colunas de comparação `entrada` vs `gestao` | 🟢 |
| RF-08 | Orgs existentes com plano `entrada`/`gestao` são migradas automaticamente para o plano único, sem perda de acesso e sem re-contratação manual | Must | Toda org previamente ativa continua com assinatura ativa após a migração, `plano_ativo` passa a refletir o identificador único, audit log `org_atualizada` (ou ação equivalente) gravado por org migrada | 🟡 |
| RF-09 | `docs/PRD_PortalSigilo_v2.md` §3 e `docs/SECURITY.md` (se citarem plano) são atualizados para refletir o modelo de plano único | Should | Tabela de planos do PRD não lista mais 2 linhas de plano self-service | 🟢 |
| RF-10 | Estados `suspenso`/`cancelado` de assinatura continuam funcionando exatamente como hoje | Must | `billing/cancel`, webhook `PAYMENT_OVERDUE`/`SUBSCRIPTION_CANCELED` não têm comportamento alterado | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | A checagem redundante de limite no servidor (Route Handler + Firestore Rule) deve ser preservada mesmo com valor único — não eliminar a camada de defesa documentada em `_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md`, só simplificar o valor comparado | `_reversa_sdd/adrs/005-*.md` | 🟢 |
| Auditabilidade | Se a migração de orgs existentes for automática (RN-08), cada org migrada deve gerar um `audit_log` com a mudança de plano | `_reversa_sdd/data-dictionary.md#audit_logs` (catálogo de ações já existente, ex. `org_atualizada`) | 🟡 |
| Compatibilidade retroativa | `audit_logs` históricos que referenciam `plano: "entrada"`/`"gestao"` em `detalhes` não são alterados (regra de imutabilidade S6) — a mudança é prospectiva, não reescreve histórico | `_reversa_sdd/data-dictionary.md#audit_logs`, regra inviolável S6 | 🟢 |
| Consistência de dados | O tipo `Plano` em `src/lib/types/index.ts` precisa refletir o novo conjunto de valores válidos de `plano_ativo`, incluindo os estados operacionais já existentes (`suspenso`/`cancelado`) que hoje divergem do tipo declarado | `_reversa_sdd/data-dictionary.md` (divergência #4 já registrada) | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Novo cliente contrata o plano único
  Dado que estou na página pública de planos
  Quando eu escolho contratar e completo o pagamento
  Então minha organização é provisionada com o plano único
  E tenho acesso imediato a todas as features de IA (assistente, insights, triagem, relatórios personalizados)

Cenário: Checkout rejeita identificador de plano antigo
  Dado que o front-end (ou uma integração externa) envia plano="entrada" ou plano="gestao"
  Quando POST /api/checkout/create é chamado
  Então a requisição é rejeitada com 400, pois esses identificadores não existem mais

Cenário: Org existente no plano "entrada" antes da migração
  Dado uma org com plano_ativo="entrada" antes desta feature ser aplicada
  Quando a migração de dados (RN-08) é executada
  Então a org passa a ter acesso às features antes restritas ao plano "gestao"
  E um audit log registra a mudança de plano

Cenário negativo: Assinatura suspensa continua bloqueada independente do plano único
  Dado uma org com plano_ativo="suspenso"
  Quando um gestor tenta usar o assistente de IA ou gerar relatório
  Então o acesso continua bloqueado (403 plan_suspended), pois a unificação não altera o ciclo de vida de suspensão/cancelamento

Cenário: Limite de usuários e de armazenamento passam a ser iguais para toda org
  Dado duas orgs que antes estavam em planos diferentes ("entrada" e "gestao")
  Quando eu consulto o limite de usuários gestores e o limite de armazenamento de cada uma
  Então ambas retornam exatamente o mesmo valor de limite

Cenário: Página pública de planos exibe oferta única
  Dado que acesso a página pública de planos sem estar autenticado
  Quando a página carrega
  Então vejo apenas uma oferta de assinatura, sem tabela comparativa entre dois planos
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01, RF-02, RF-03 | Must | Núcleo da mudança — sem isso não há "plano único" de fato |
| RF-04, RF-05 | Must | Sem unificar limites, o sistema continua tecnicamente diferenciando orgs por um "plano" que não deveria mais existir como conceito de negócio |
| RF-08 | Must | Sem plano de migração, orgs existentes ficam em estado indefinido |
| RF-10 | Must | Regressão crítica se suspensão/cancelamento parar de funcionar |
| RF-06 | Should | Resolve débito técnico já conhecido, mas o sistema funciona sem essa consolidação se o valor único for replicado corretamente nos dois lugares |
| RF-07, RF-09 | Should | Importante para coerência de produto e documentação, não bloqueia o funcionamento do backend |
| RN-09 (fate do Enterprise) | Could | Enterprise já era "sob consulta", fora do fluxo self-service — pode ser resolvido depois, não bloqueia a unificação dos dois planos self-service |

## 9. Esclarecimentos

### Sessão 2026-07-21

> Resolvida em modo autônomo (YOLO), a pedido explícito do usuário — decisões de produto abaixo são **suposições assumidas pelo Reversa**, não confirmações do dono do negócio. Recomenda-se validação humana antes de codar (ver `plan.md`/apresentação ao usuário).

- **Q:** O plano único herda o conjunto completo de features/limites do antigo plano "Gestão", ou define um novo preço/limite específico?
  **R:** Herda o conjunto completo do "Gestão": IA irrestrita (assistente, insights, triagem automática, relatórios personalizados), 10 usuários gestores, 20GB de armazenamento, preço R$227/mês (mensal) ou R$197/mês (anual). Racional: reduzir para o tier superior é comercialmente mais seguro — nenhum cliente existente perde feature; a alternativa (criar um terceiro conjunto de limites do zero) exigiria decisão de pricing que foge do escopo desta extração.

- **Q:** O plano Enterprise ("sob consulta") continua separado ou é absorvido no plano único?
  **R:** Continua separado. Racional: leitura literal do pedido original ("dois planos" = Entrada + Gestão, os dois self-service comparados no checkout); Enterprise nunca foi self-service (preço negociado, multi-unidade, white-label) e não compartilha o mesmo mecanismo de contratação.

- **Q:** Assinantes existentes em `entrada`/`gestao` são migrados automaticamente, manualmente, ou mantidos em preço legado?
  **R:** Migração automática, sem re-contratação. Orgs em `entrada` ganham acesso pleno às features do "Gestão" imediatamente após a migração de dados; o valor cobrado ajusta a partir do próximo ciclo de cobrança (não retroativo, não há cobrança adicional sobre o ciclo já em curso). Racional: evita manter um estado "cliente legado" permanente no código, que adicionaria complexidade indefinida ao sistema.

## 10. Lacunas

Nenhuma lacuna 🔴 bloqueante restante nesta sessão. As 3 decisões acima são suposições de produto (🟡), não fatos confirmados — o dono do negócio deve validá-las antes da implementação em código (checkpoint já prometido ao usuário: "apresentar plano para validação antes de implementar").

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-07-21 | 3 dúvidas resolvidas em modo autônomo (YOLO) via `/reversa-clarify`, a pedido do usuário | reversa |
