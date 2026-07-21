# Requirements: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA
> Sucede: `_reversa_forward/001-unificar-plano-assinatura` (pausada em `paused-features`, estágio físico `coding-em-progresso`, 0/20 ações — abandonada por revisão de modelo de negócio antes da primeira ação ser codada)

## 1. Resumo executivo

Substituir o modelo comercial atual de dois planos self-service (`entrada` e `gestao`) e do plano `enterprise` por um **único plano de assinatura** ("unico"), eliminando toda diferenciação de acesso a features, limites de uso e preço. Resolve a fragmentação de gates de feature espalhados por 6+ pontos do backend e a divergência de fonte de preço já documentada como débito técnico na extração reversa. Como a aplicação ainda não tem clientes pagantes reais (apenas ambiente de testes), a transição de dados não exige migração — a base de teste é reiniciada e repovoada já sob a nova lógica. Não descreve como será implementado — apenas o que deve passar a ser verdade sobre o produto.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/domain.md#regras-de-negocio-centrais` | "Planos são gates de feature aplicados no servidor, nunca só no client" — 6 pontos distintos de gate por plano `entrada` | 🟢 |
| `_reversa_sdd/billing/design.md` | `VALUE_TO_PLANO` mapeia valor pago → plano (`getSubscription.ts`); frágil a mudança de preço | 🟢 |
| `_reversa_sdd/checkout/design.md` | Duas fontes de preço independentes: `PLANOS_CONFIG` (`createPaymentLink.ts`) e `PLANOS` (`src/lib/planos.ts`) — já registrado como risco 🟡 | 🟢 |
| `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md` | `determinarPlano(payload)` no webhook decide `entrada`/`gestao` por faixa de valor pago em ciclo mensal — modelo de cobrança diferente do adotado nesta feature (ver RNF de compatibilidade, §6) | 🟢 |
| `_reversa_sdd/dashboard/requirements.md` §RF-07, `firestore.rules#getPlanoLimit` | Limite de usuários por plano (`entrada`=1, `gestao`=10, `enterprise`=∞), duplicado em Route Handler e Firestore Rules | 🟢 |
| `_reversa_sdd/upload-attachment/requirements.md` | Limite de armazenamento por plano (`entrada`=2GB, `gestao`=20GB, `enterprise`=∞) | 🟢 |
| `_reversa_sdd/reports/requirements.md` | Relatório tipo "personalizado" exige plano ≥ gestão | 🟢 |
| `_reversa_sdd/chat/requirements.md`, `_reversa_sdd/domain.md` | Triagem automática por IA desabilitada no plano `entrada` (`runTriagem` early-return) | 🟢 |
| `_reversa_sdd/assistant/requirements.md`, `_reversa_sdd/dashboard/design.md` | Assistente de IA e Insights de IA bloqueados no plano `entrada` | 🟢 |
| `_reversa_sdd/state-machines.md#1` | `Case.status` conhecido: `aguardando_triagem`, `em_apuracao`, `pendente_informacao`, `encerrado_sem_infracao`, `encerrado_com_acao` — usado para os dados mockados do reseed (§5, RF-08) | 🟢 |
| `src/lib/triagem.ts` (`CATEGORIAS_LEGAIS`) | 11 categorias de classificação legal de caso: `assedio_moral`, `assedio_sexual`, `discriminacao_salarial`, `discriminacao`, `fraude`, `desvio_etico`, `violacao_lgpd`, `seguranca_trabalho`, `risco_psicossocial`, `conflito_interesses`, `outro` — usado para os dados mockados do reseed (§5, RF-08) | 🟢 |
| `docs/PRD_PortalSigilo_v2.md` §3 | Tabela oficial "Planos e limites por tenant" — precisa ser reescrita para refletir plano único, sem linha de Enterprise | 🟢 |
| `_reversa_sdd/data-dictionary.md#audit_logs` | Catálogo de ações de audit log já existente; regra de imutabilidade S6 não muda | 🟢 |
| `_reversa_forward/001-unificar-plano-assinatura/requirements.md` §9 | Sessão anterior assumiu (YOLO) preço R$227/197, 10 usuários, 20GB, Enterprise preservado e migração automática — todas essas suposições foram revistas e substituídas pelas decisões desta versão | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Novo cliente (visitante) | Contratar o Portal Sigilo | Acessa `/planos`, vê uma única oferta anual, faz checkout informando o cartão uma única vez |
| Admin de org | Gerenciar a assinatura sem se preocupar com tiers | Assina uma vez; a cada aniversário do ciclo, escolhe pagar a fatura à vista ou parcelada em até 12x, sem re-inserir o cartão |
| Time de produto/growth | Simplificar operação comercial | Deixa de manter três ofertas (entrada/gestão/enterprise), três configurações de limite e lógica de upgrade/downgrade |
| Time de QA/dev | Testar o produto sob a nova lógica sem dado legado contaminando cenários | Reseta a base de teste e obtém uma org mockada já íntegra sob o plano único, com departamentos e casos variados para exercitar dashboards e relatórios |
| Denunciante | Não afetado | Nenhum comportamento do portal público de denúncia muda |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Não há mais diferenciação de acesso a feature por plano — toda org com assinatura ativa (não `suspenso`/`cancelado`) tem acesso pleno a assistente de IA, insights de IA, triagem automática por IA e relatórios personalizados. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#regras-de-negocio-centrais` (regra "Planos são gates de feature")
   - Tipo: alterada
2. **RN-02:** O mapeamento de valor pago → identificador de plano (`VALUE_TO_PLANO` em `getSubscription.ts`, `determinarPlano` no webhook Asaas) deixa de existir — toda assinatura confirmada resolve para o único plano existente, identificador `"unico"`. 🟢
   - Origem no legado: `_reversa_sdd/billing/design.md`, `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md`
   - Tipo: removida
3. **RN-03:** O limite de usuários gestores por org deixa de variar por plano — passa a existir um único valor de limite técnico: **50 usuários**, aplicado tanto no Route Handler (`dashboard/users`) quanto nas Firestore Rules (`getPlanoLimit`). A checagem redundante (servidor + Firestore Rules) é preservada como camada de defesa (`_reversa_sdd/adrs/005-*.md`), só o valor comparado muda. 🟢 (confirmado pelo dono do negócio, substitui a suposição de 10 usuários da sessão anterior)
   - Origem no legado: `_reversa_sdd/dashboard/requirements.md#RF-07`, `firestore.rules:78-81`
   - Tipo: alterada
4. **RN-04:** O limite de armazenamento por org deixa de variar por plano — passa a existir um único valor de limite: **2GB**. 🟢 (confirmado pelo dono do negócio, substitui a suposição de 20GB da sessão anterior)
   - Origem no legado: `_reversa_sdd/upload-attachment/requirements.md`
   - Tipo: alterada
5. **RN-05:** O tipo de relatório "personalizado" deixa de exigir um plano específico — disponível a qualquer org com assinatura ativa. 🟢
   - Origem no legado: `_reversa_sdd/reports/requirements.md`
   - Tipo: alterada
6. **RN-06:** A triagem automática por IA (`runTriagem`) deixa de ter o caminho de "triagem manual forçada" hoje disparado por `planoAtivo === "entrada"` — toda org ativa recebe triagem por IA. 🟢
   - Origem no legado: `_reversa_sdd/chat/requirements.md`, `_reversa_sdd/domain.md`
   - Tipo: alterada
7. **RN-07:** O checkout (`POST /api/checkout/create`) passa a aceitar um único identificador de plano (`"unico"`), com um único preço de ciclo anual — a validação `isPlanoValido` que hoje aceita `entrada`/`gestao` é substituída por validação de plano único; qualquer identificador antigo (`entrada`, `gestao`, `enterprise`) é rejeitado. 🟢
   - Origem no legado: `_reversa_sdd/checkout/requirements.md`
   - Tipo: alterada
8. **RN-08:** O ciclo de cobrança passa a ser **anual** (não mais mensal/anual diferenciados). O cartão de crédito é tokenizado uma única vez na adesão; a cada renovação (ao final do ciclo anual), a cobrança da fatura pode ser feita à vista ou parcelada em até 12x, sem juros e sem taxas, sem necessidade de o cliente informar o cartão novamente. Valor da assinatura: **R$ 1.164/ano** (equivalente a 12x R$ 97). 🟢 (confirmado pelo dono do negócio, substitui os valores R$227/mês e R$197/mês-ciclo-anual da sessão anterior)
   - Origem no legado: `_reversa_sdd/checkout/contracts.md`, `_reversa_sdd/adrs/003-*.md` (mecanismo de cobrança precisa ser revisto, ver RNF §6)
   - Tipo: alterada
9. **RN-09:** O plano `enterprise` **deixa de existir por completo** — não é mais uma camada separada preservada fora do escopo. Toda referência ao identificador `"enterprise"` é removida (união de tipos `Plano`, `firestore.rules`, página `/planos`, documentação de produto). Nenhuma funcionalidade prevista exclusivamente para o Enterprise é implementada. 🟢 (decisão do dono do negócio; revoga a RN-09 anterior, que preservava o Enterprise como "fora do escopo")
   - Origem no legado: `docs/PRD_PortalSigilo_v2.md#3`, `src/lib/planos.ts`
   - Tipo: removida
10. **RN-10:** Os estados `suspenso` e `cancelado` de `Org.plano_ativo` continuam existindo e inalterados — a unificação elimina a dimensão "qual plano contratado", não o ciclo de vida da assinatura (ativo/suspenso/cancelado). 🟢
    - Origem no legado: `_reversa_sdd/state-machines.md#3`
    - Tipo: preservada (fora do escopo desta feature)
11. **RN-11:** Não há migração automática de orgs existentes. Como a aplicação está em ambiente de testes, sem clientes pagantes reais, a base de dados de teste é reiniciada (dados removidos) e repovoada por um script de reseed que já gera dados exclusivamente sob a nova lógica de plano único (ver RF-08 para a especificação exata dos dados mockados). 🟢 (decisão do dono do negócio; revoga a RN-08 anterior, que previa migração automática com audit log por org)
    - Origem no legado: `_reversa_sdd/data-dictionary.md` (padrão de scripts one-shot `scripts/seed-*.ts` já existente no projeto)
    - Tipo: nova (substitui a estratégia de migração)

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O checkout oferece um único plano, identificador `"unico"`, ciclo anual, R$ 1.164/ano | Must | `POST /api/checkout/create` aceita apenas `plano="unico"`; qualquer outro identificador (`entrada`, `gestao`, `enterprise`) retorna 400 | 🟢 |
| RF-02 | O checkout permite ao cliente optar por pagar a fatura anual à vista ou parcelada em até 12x sem juros/taxas, tokenizando o cartão uma única vez na adesão | Must | Fluxo de pagamento aceita as duas formas sem exigir novo cadastro de cartão nas renovações | 🟢 |
| RF-03 | O webhook de pagamento resolve toda assinatura confirmada para o plano único, sem lógica de faixa de valor | Must | `provisionOrg`/`determinarPlano` não diferenciam mais por valor pago | 🟢 |
| RF-04 | O assistente de IA, insights de IA, triagem automática e relatórios personalizados ficam disponíveis a toda org com assinatura ativa | Must | Nenhuma dessas 4 rotas retorna erro de "feature não disponível" para org ativa | 🟢 |
| RF-05 | O limite de usuários gestores por org passa a ser único (50 usuários), aplicado de forma consistente no Route Handler e na Firestore Rule | Must | `PLAN_USER_LIMITS`/`getPlanoLimit` retornam sempre 50 para qualquer org ativa | 🟢 |
| RF-06 | O limite de armazenamento por org passa a ser único (2GB) | Must | `STORAGE_LIMITS_BYTES` aplica 2GB para qualquer org ativa | 🟢 |
| RF-07 | Existe uma única fonte de verdade de preço/nome do plano, eliminando a divergência entre `PLANOS_CONFIG` e `src/lib/planos.ts` | Should | Preço exibido em `/planos` é idêntico ao cobrado no checkout, verificável por leitura de um único arquivo/config | 🟢 |
| RF-08 | A página pública `/planos` exibe uma única oferta, sem comparação de tiers e sem qualquer menção a Enterprise | Must | Página não renderiza mais colunas de comparação `entrada`/`gestao`/`enterprise` | 🟢 |
| RF-09 | Todo identificador `"enterprise"` é removido do código: união de tipos `Plano`, `firestore.rules#getPlanoLimit`, `src/lib/planos.ts`, página `/planos` | Must | Busca por `"enterprise"` no código-fonte (exceto histórico de `audit_logs`, RNF §6) não retorna nenhuma ocorrência ativa | 🟢 |
| RF-10 | A base de dados de teste é reiniciada (dados removidos) e repovoada por um script de reseed que gera exatamente: 1 org; 2 usuários gestores (1 com papel admin, 1 com papel não-admin); 5 departamentos; entre 1 e 3 casos por departamento, distribuídos entre as 11 categorias de `categoria_legal` (`assedio_moral`, `assedio_sexual`, `discriminacao_salarial`, `discriminacao`, `fraude`, `desvio_etico`, `violacao_lgpd`, `seguranca_trabalho`, `risco_psicossocial`, `conflito_interesses`, `outro`) e entre os 5 estágios de `Case.status` (`aguardando_triagem`, `em_apuracao`, `pendente_informacao`, `encerrado_sem_infracao`, `encerrado_com_acao`) | Must | Script de reseed roda em ambiente de teste isolado, é idempotente (rodar de novo reseta e repovoa sem duplicar), e a org resultante tem `plano_ativo="unico"` | 🟢 |
| RF-11 | `docs/PRD_PortalSigilo_v2.md` §3 e `docs/SECURITY.md` (se citarem plano) são atualizados para refletir o modelo de plano único, sem nenhuma linha de Enterprise | Should | Tabela de planos do PRD não lista mais 3 linhas de plano (entrada/gestão/enterprise) | 🟢 |
| RF-12 | Estados `suspenso`/`cancelado` de assinatura continuam funcionando exatamente como hoje | Must | `billing/cancel`, webhook `PAYMENT_OVERDUE`/`SUBSCRIPTION_CANCELED` não têm comportamento alterado | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | A checagem redundante de limite no servidor (Route Handler + Firestore Rule) deve ser preservada mesmo com valor único (50 usuários) — não eliminar a camada de defesa documentada em `_reversa_sdd/adrs/005-verificacao-redundante-alem-das-firestore-rules.md`, só simplificar o valor comparado | `_reversa_sdd/adrs/005-*.md` | 🟢 |
| Compatibilidade de billing | O modelo de cobrança anual com parcelamento de fatura em até 12x deve ser validado tecnicamente contra a API do Asaas e contra `functions/src/webhookAsaas.ts` — a extração reversa (`_reversa_sdd/adrs/003-*.md`) documenta resolução de plano por faixa de valor pago em ciclo mensal/anual simples, não parcelamento de fatura em ciclo anual. Investigação técnica de viabilidade fica a cargo de `/reversa-plan` (`investigation.md`), não é decisão de produto em aberto. | `_reversa_sdd/adrs/003-asaas-webhook-provisionamento-automatico.md` | 🟡 |
| Compatibilidade retroativa | `audit_logs` históricos que referenciam `plano: "entrada"`/`"gestao"`/`"enterprise"` em `detalhes` não são alterados pelo reset de banco de teste (regra de imutabilidade S6) se esses logs persistirem fora do escopo de dados removidos; caso o reset também limpe `audit_logs`, a regra de imutabilidade S6 não se aplica a dados de teste descartados | `_reversa_sdd/data-dictionary.md#audit_logs`, regra inviolável S6 | 🟡 |
| Consistência de dados | O tipo `Plano` em `src/lib/types/index.ts` precisa refletir o novo conjunto de valores válidos de `plano_ativo`: apenas `"unico"` + os estados operacionais já existentes (`suspenso`/`cancelado`) — sem `entrada`, `gestao` ou `enterprise` | `_reversa_sdd/data-dictionary.md` (divergência #4 já registrada) | 🟢 |
| Ambiente | O script de reset/reseed (RF-10) só pode rodar contra o projeto Firebase de **testes** — o dono do negócio confirmou que a aplicação ainda não está em uso pelo público, mas o script não deve assumir isso silenciosamente; deve haver uma salvaguarda explícita (ex.: variável de ambiente ou flag de confirmação) antes de apagar dados | Confirmação do dono do negócio nesta sessão | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Novo cliente contrata o plano único
  Dado que estou na página pública de planos
  Quando eu escolho contratar, informo o cartão de crédito uma única vez e completo o pagamento
  Então minha organização é provisionada com o plano "unico"
  E tenho acesso imediato a todas as features de IA (assistente, insights, triagem, relatórios personalizados)

Cenário: Renovação anual com parcelamento
  Dado uma org com assinatura ativa no plano "unico" próxima do fim do ciclo anual
  Quando a renovação é cobrada
  Então o cliente pode optar por pagar a fatura à vista ou em até 12x sem juros/taxas
  E não precisa informar o cartão de crédito novamente

Cenário: Checkout rejeita identificador de plano antigo
  Dado que o front-end (ou uma integração externa) envia plano="entrada", plano="gestao" ou plano="enterprise"
  Quando POST /api/checkout/create é chamado
  Então a requisição é rejeitada com 400, pois esses identificadores não existem mais

Cenário negativo: Assinatura suspensa continua bloqueada independente do plano único
  Dado uma org com plano_ativo="suspenso"
  Quando um gestor tenta usar o assistente de IA ou gerar relatório
  Então o acesso continua bloqueado (403 plan_suspended), pois a unificação não altera o ciclo de vida de suspensão/cancelamento

Cenário: Limite de usuários e de armazenamento são iguais para toda org
  Dado qualquer org com plano_ativo="unico"
  Quando eu consulto o limite de usuários gestores e o limite de armazenamento
  Então o limite de usuários é 50 e o limite de armazenamento é 2GB

Cenário: Página pública de planos exibe oferta única, sem Enterprise
  Dado que acesso a página pública de planos sem estar autenticado
  Quando a página carrega
  Então vejo apenas uma oferta de assinatura, sem tabela comparativa e sem nenhuma menção a Enterprise

Cenário: Reseed de ambiente de teste
  Dado um ambiente de teste com dados antigos (orgs em entrada/gestao/enterprise)
  Quando o script de reset/reseed é executado
  Então a base é reiniciada e passa a conter exatamente 1 org no plano "unico", com 2 usuários gestores (1 admin, 1 não-admin), 5 departamentos e entre 1 e 3 casos por departamento, cobrindo múltiplas categorias de categoria_legal e múltiplos estágios de Case.status
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01, RF-02, RF-03, RF-04 | Must | Núcleo da mudança comercial e de cobrança — sem isso não há "plano único" de fato |
| RF-05, RF-06 | Must | Sem unificar limites, o sistema continua tecnicamente diferenciando orgs por um "plano" que não deveria mais existir como conceito de negócio |
| RF-08, RF-09 | Must | Remoção completa do Enterprise é decisão de escopo explícita do dono do negócio, não mais "poderia ficar para depois" |
| RF-10 | Must | Sem o reseed, o ambiente de teste fica inconsistente com a nova lógica e nenhum teste manual é confiável |
| RF-12 | Must | Regressão crítica se suspensão/cancelamento parar de funcionar |
| RF-07 | Should | Resolve débito técnico já conhecido, mas o sistema funciona sem essa consolidação se o valor único for replicado corretamente nos dois lugares |
| RF-11 | Should | Importante para coerência de produto e documentação, não bloqueia o funcionamento do backend |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

## 10. Lacunas

Nenhuma lacuna 🔴 bloqueante. Todas as decisões de produto que estavam pendentes na sessão anterior (identificador do plano, preço/ciclo/parcelamento, limite de usuários, limite de armazenamento, destino do Enterprise, estratégia de dados, especificação do reseed) foram confirmadas diretamente pelo dono do negócio nesta sessão de reexecução.

Um ponto fica sinalizado como **investigação técnica** (não bloqueia a escrita deste requirements, mas deve ser resolvido em `/reversa-plan`): confirmar se `functions/src/webhookAsaas.ts` já suporta o evento de cobrança de assinatura anual parcelada em até 12x da API do Asaas, ou se precisa de tratamento novo (ver RNF §6, "Compatibilidade de billing").

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-requirements`, a partir da reexecução da feature `001-unificar-plano-assinatura` com decisões de negócio já fechadas pelo dono do negócio (identificador, preço/ciclo/parcelamento, limites, remoção do Enterprise, estratégia de reset+reseed) | reversa |
