# Roadmap: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Requirements: `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA
> Sucede: `_reversa_forward/001-unificar-plano-assinatura` (pausada — roadmap anterior previa migração automática e preservava Enterprise, ambos revogados)

## 1. Resumo da abordagem

Colapsar os 11 pontos de diferenciação por plano identificados em `investigation.md` para um único caminho de código (plano `"unico"`), removendo por completo o identificador `enterprise`. Como não há clientes pagantes reais, a transição de dado é um reset+reseed da base de teste, não uma migração. O ponto de maior risco técnico não é a unificação em si — é o modelo de cobrança: o dono do negócio pediu assinatura anual com parcelamento em até 12x por renovação e cartão tokenizado uma única vez, e a investigação (`investigation.md`) confirmou que isso **não é nativo da API do Asaas** (assinatura recorrente e parcelamento são mecanismos distintos e mutuamente exclusivos na API). A Opção A (cobrança parcelada avulsa disparada por um agendador próprio) foi **confirmada pelo dono do negócio em 2026-07-21** como a arquitetura a adotar — ainda falta validação técnica em sandbox Asaas antes de virar ação em `actions.md`, mas não há mais pendência de decisão de negócio sobre isso. Também foi confirmado que falha na cobrança de renovação suspende o acesso da org, reaproveitando a mesma transição já usada hoje para `PAYMENT_OVERDUE` (`plano_ativo = "suspenso"`).

**Correções pós-`/reversa-audit` (2026-07-21):** o cross-check (`audit/cross-check.md`) encontrou que abandonar o objeto `subscription` da Asaas (D-04) tem duas consequências não tratadas na primeira versão deste roadmap: (1) `DELETE /api/billing/cancel` depende de `subscription_id`, que deixa de existir — cancelamento quebraria por completo (CRITICAL, RF-12); (2) `GET /api/billing/subscription` depende do mesmo dado e perderia valor/ciclo/status na tela de faturamento (HIGH). Um terceiro achado (HIGH) é que RF-07 (fonte única de preço) segue sem ação que a resolva de fato — o valor `1164` ficaria duplicado em `planos.ts` e `createPaymentLink.ts`. As três decisões novas abaixo (D-10, D-11, D-12) fecham essas lacunas.

## 2. Princípios aplicados

Não há `.reversa/principles.md` neste projeto — nenhum princípio formal a verificar. n/a.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Identificador do plano único: `"unico"` | Decisão direta do dono do negócio | `"padrao"` (sugestão anterior, revogada) | 🟢 |
| D-02 | Remover a ramificação condicional em vez de mantê-la e sempre resolver para o mesmo valor, nos 4 gates de feature (assistente, insights, triagem, relatórios) | Ramificação morta é dívida técnica automática — remover custa o mesmo que manter, evita confusão futura | Manter os `if`s e só parar de gerar orgs com `plano_ativo` antigo | 🟢 |
| D-03 | `VALUE_TO_PLANO` (`getSubscription.ts`) e `determinarPlano` (`webhookAsaas.ts`) são removidos — não há mais valor pago a diferenciar | Só existe 1 preço agora, mapeamento perde sentido | Manter a tabela com uma entrada só | 🟢 |
| **D-04** | **Cobrança: abandonar `chargeType: RECURRENT`/assinatura nativa Asaas. Adotar cobrança avulsa parcelada (`chargeType: INSTALLMENT`) disparada uma vez por ano por uma Cloud Function agendada (`onSchedule`, novo tipo de trigger no projeto), usando um `creditCardToken` salvo em `orgs.asaas_credit_card_token` desde a primeira cobrança** | É a única arquitetura, dentre as avaliadas em `investigation.md`, que cumpre literalmente "cartão uma vez, parcelamento em até 12x a cada renovação anual" — a API do Asaas não oferece assinatura parcelável nativamente. **Confirmada pelo dono do negócio em 2026-07-21.** | Opção B: manter assinatura nativa `YEARLY` sem parcelamento real — mais simples, mas não atende ao requisito confirmado pelo dono do negócio (ver `investigation.md`) | 🟡 (decisão de negócio já confirmada; falta apenas validação técnica em sandbox real do Asaas antes de virar ação — pesquisa até aqui foi feita via documentação pública) |
| D-05 | Reset+reseed da base de teste via script one-shot, seguindo o padrão já existente (`scripts/seed-emulator.ts`, `scripts/seed-remote.ts`), no lugar de script de migração de dado | Sem clientes pagantes reais (confirmado pelo dono do negócio), reset é mais simples e não deixa código de migração para manter indefinidamente | Script de migração automática com audit log por org (abordagem da feature `001`, revogada) | 🟢 |
| D-06 | `firestore.rules#getPlanoLimit` retorna um valor fixo (50) para qualquer `plano_ativo` que não seja `suspenso`/`cancelado`, em vez de comparar contra o identificador exato do plano único | Reduz acoplamento entre a Rule e o nome exato do plano — se o nome mudar de novo no futuro, a Rule não quebra | Comparar `plano == "unico" ? 50 : ...` | 🟢 |
| D-07 | `BillingToggle.tsx` (toggle mensal/anual) é substituído por um seletor de forma de pagamento (à vista / parcelado até 12x) em vez de removido sem substituto | A escolha de parcelamento (RF-02 do requirements) precisa de alguma UI — reaproveitar o mesmo padrão visual de toggle é mais barato que desenhar um componente novo do zero | Remover o componente e não oferecer escolha de parcelamento na UI (deixaria RF-02 sem superfície de uso) | 🟢 |
| D-08 | Remoção de Enterprise inclui a 3ª entrada de `PLANOS` (`src/lib/planos.ts`), o branch `enterprise` em `PLAN_USER_LIMITS`/`STORAGE_LIMITS_BYTES`/`getPlanoLimit`, e toda menção em `docs/PRD_PortalSigilo_v2.md` — mas **não** remove nenhum código de feature exclusiva do Enterprise (WhatsApp, multi-unidade, white-label), porque essas features nunca foram implementadas (Fases 7/8/10 do projeto, `AGENTS.md`, ainda pendentes) | Não há código de feature Enterprise para remover além do texto/gate de plano — confirmado por `investigation.md` | n/a | 🟢 |
| D-09 | Falha na cobrança de renovação anual (a function agendada de D-04 não consegue confirmar o pagamento da nova venda parcelada) suspende o acesso da org (`plano_ativo = "suspenso"`), reaproveitando a mesma função `atualizarPlanoOrg`/transição já usada hoje para o evento `PAYMENT_OVERDUE` — nenhuma política nova de retentativa é criada, a suspensão é imediata à primeira falha confirmada | Decisão explícita do dono do negócio (2026-07-21): "suspender o acesso em caso de falha de renovação". Reaproveitar a transição existente evita inventar um terceiro estado ou uma máquina de retentativa não pedida | Múltiplas tentativas antes de suspender, ou período de carência — não pedido pelo dono do negócio, ficaria como suposição não solicitada | 🟢 |
| **D-10** | **Cancelamento (`DELETE /api/billing/cancel`) deixa de chamar qualquer endpoint de assinatura da Asaas. Passa a: marcar `orgs.plano_ativo = "cancelado"` diretamente; marcar `orgs.renovacao_cancelada = true` (campo novo, ver `data-delta.md`) para que a function agendada de D-04 não dispare a próxima cobrança anual; manter o `logAudit("assinatura_cancelada")` já existente.** `cancelSubscription.ts` é removido — não há mais recurso de assinatura para cancelar na Asaas | Corrige A001 (CRITICAL do `/reversa-audit`): sob a Opção A não existe `subscription_id`, então a chamada atual a `cancelSubscription()`/`DELETE /v3/subscriptions/{id}` sempre falharia com 404, quebrando RF-12 (Must) | Manter `cancelSubscription.ts` chamando a Asaas mesmo sem `subscription_id` (já rejeitado — a rota simplesmente pararia de funcionar, era exatamente o bug encontrado) | 🟡 (mesma pendência de validação em sandbox de D-04, já que reaproveita a mesma arquitetura de cobrança) |
| **D-11** | **`GET /api/billing/subscription` (via `getSubscription.ts`) deixa de consultar `/v3/subscriptions` da Asaas. Passa a montar a resposta a partir de `orgs.plano_ativo`, `orgs.data_renovacao`, `orgs.proxima_cobranca_parcelas` (Firestore) e, para `valor`/`status` da última cobrança, consulta `getInvoices.ts` (que já busca por `customer`, não por `subscription`, e portanto continua funcionando sob a Opção A sem alteração)** | Corrige A002 (HIGH): a consulta atual a `/v3/subscriptions` nunca retorna resultado para orgs sob a Opção A, degradando a tela de faturamento silenciosamente | Aceitar a degradação e não exibir valor/ciclo/status (rejeitado — perda de informação visível ao cliente sem necessidade, já que o dado existe só em outro lugar) | 🟢 |
| **D-12** | **Criar `src/lib/planos-config.ts` como fonte única do preço/config do plano único (valor anual, parcelamento máximo), importado tanto por `src/lib/planos.ts` (UI) quanto por `src/lib/asaas/createPaymentLink.ts` (cobrança Asaas)** | Corrige A003 (HIGH): sem essa consolidação, o valor `1164` fica hardcoded independentemente em dois arquivos — exatamente a divergência que RF-07 pede para eliminar, e que já era um risco documentado em `_reversa_sdd/checkout/design.md` antes desta feature | Manter os dois arquivos com o valor duplicado, confiando em revisão manual para mantê-los sincronizados (rejeitado — é exatamente o padrão de falha já documentado no legado) | 🟢 |

## 4. Premissas

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| A arquitetura de cobrança da Opção A (D-04) é tecnicamente viável na API real do Asaas (não só na documentação pública consultada) | `requirements.md` RN-08, RF-01/RF-02; RNF "Compatibilidade de billing" | Se a sandbox revelar que `creditCardToken` não é reutilizável do jeito assumido, ou que cobranças `INSTALLMENT` avulsas têm alguma restrição não documentada, D-04 precisa ser redesenhada antes de `/reversa-to-do` gerar ações de código |
| **Cancelamento (D-10) impede a próxima renovação anual, mas não interrompe parcelas já geradas da venda parcelada do ciclo vigente** — a Asaas gera todas as N parcelas de uma cobrança `INSTALLMENT` de uma vez no momento da venda (achado de `investigation.md`), então cancelar no meio do ano não estorna cobranças futuras já agendadas do ciclo corrente, a menos que o time decida chamar a Asaas para estornar cada parcela pendente individualmente — isso **não foi pedido nem confirmado pelo dono do negócio** até aqui | Não coberta explicitamente em `requirements.md`; extrapolação a partir de RF-12/RN-10 | Cliente que cancela no meio do ano continua sendo cobrado pelas parcelas restantes do ciclo já vendido, o que pode ser inesperado para o negócio ou para o cliente — vale confirmar com o dono do negócio antes de `/reversa-coding` fechar essa ação |

Não há mais premissa em aberto sobre política de falha de renovação — resolvida em D-09 (suspende o acesso, reaproveitando a transição de `PAYMENT_OVERDUE` já existente).

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Config de planos (UI) | `_reversa_sdd/checkout/design.md` → `src/lib/planos.ts` | regra-alterada | Array `PLANOS` passa de 3 entradas (entrada/gestao/enterprise) para 1 (`unico`) |
| Config de cobrança | `_reversa_sdd/checkout/contracts.md` → `src/lib/asaas/createPaymentLink.ts` | contrato-alterado | `PLANOS_CONFIG` substituído por lógica de cobrança parcelada avulsa (D-04) |
| Validação de checkout | `_reversa_sdd/checkout/design.md` → `src/app/api/checkout/create/route.ts` | contrato-alterado | `isPlanoValido` aceita só `"unico"`; novo campo `parcelas` (ver `interfaces/checkout-create.md`) |
| Resolução de plano no webhook | `_reversa_sdd/adrs/003-*.md` → `functions/src/webhookAsaas.ts` | contrato-alterado | `determinarPlano` removido; lógica de eventos revista para cobrança parcelada (ver `interfaces/webhook-asaas.md`) |
| **Function agendada de renovação** (nova) | n/a — não existe hoje | **componente-novo** | Primeiro uso de `onSchedule` no projeto; dispara cobrança anual usando token salvo |
| Gate de assistente de IA | `_reversa_sdd/assistant/requirements.md#RN` → `src/app/api/assistant/route.ts` | regra-removida | Bloco `if (session.plano === "entrada")` removido |
| Gate de insights de IA | `_reversa_sdd/dashboard/design.md` → `src/app/api/dashboard/insights/route.ts` | regra-removida | Ramo com mensagem fixa (menciona Enterprise) removido |
| Gate de triagem automática | `_reversa_sdd/chat/design.md` → `src/lib/triagem.ts` | regra-removida | Early-return `planoAtivo === "entrada"` removido |
| Gate de relatório personalizado | `_reversa_sdd/reports/design.md` → `src/app/api/reports/generate/route.ts` | regra-removida | Checagem `tipo === "personalizado" && plano === "entrada"` removida |
| Limite de usuários (Route Handler) | `_reversa_sdd/dashboard/design.md` → `src/app/api/dashboard/users/route.ts` | regra-alterada | `PLAN_USER_LIMITS` colapsa para 50 |
| Limite de usuários (Rules) | `firestore.rules:76-81` | regra-alterada | `getPlanoLimit` colapsa para 50 (D-06) |
| Limite de storage | `_reversa_sdd/upload-attachment/design.md` → `src/app/api/upload-attachment/route.ts` | regra-alterada | `STORAGE_LIMITS_BYTES` colapsa para 2GB |
| Tipo de domínio `Plano` | `_reversa_sdd/data-dictionary.md` → `src/lib/types/index.ts` | regra-alterada | União passa a `"unico" \| "suspenso" \| "cancelado"` (resolve divergência #4) |
| Página pública de planos | `src/app/planos/page.tsx`, `PlanoCard.tsx` | regra-alterada | Grid de 3 cards vira card único, sem comparação |
| Toggle de ciclo | `src/app/planos/BillingToggle.tsx` | **componente-alterado** | Vira seletor de forma de pagamento (D-07) |
| Documentação de produto | `docs/PRD_PortalSigilo_v2.md#3` e demais menções a Enterprise | regra-alterada | Remove todas as linhas/menções de plano além do único |
| Scripts de seed | `scripts/seed-emulator.ts`, `scripts/seed-remote.ts` | regra-alterada | Substituídos por script de reset+reseed com 1 org (D-05) |
| Cancelamento de assinatura | `src/app/api/billing/cancel/route.ts`, `src/lib/asaas/cancelSubscription.ts` | **contrato-alterado** | Deixa de chamar Asaas; passa a operar só sobre Firestore (D-10). `cancelSubscription.ts` é removido |
| Consulta de assinatura (tela de faturamento) | `src/app/api/billing/subscription/route.ts`, `src/lib/asaas/getSubscription.ts` | **contrato-alterado** | Deixa de consultar `/v3/subscriptions`; passa a derivar de Firestore + `getInvoices.ts` (D-11) |
| Fonte única de preço | `src/lib/planos.ts`, `src/lib/asaas/createPaymentLink.ts` | **componente-novo** | `src/lib/planos-config.ts` criado como fonte única, importado pelos dois (D-12, resolve RF-07) |

## 6. Delta no modelo de dados

- Resumo: `orgs.plano_ativo` passa a aceitar `"unico"` no lugar de `"entrada"`/`"gestao"`/`"enterprise"`; três campos novos (`asaas_credit_card_token`, `proxima_cobranca_parcelas` exigidos pela Opção A de billing D-04; `renovacao_cancelada` exigido pela correção de cancelamento D-10); nenhuma migração de dado real, só reset+reseed de ambiente de teste
- Detalhe completo em: `_reversa_forward/002-unificar-plano-assinatura/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `POST /api/checkout/create` | HTTP | `_reversa_forward/002-unificar-plano-assinatura/interfaces/checkout-create.md` |
| `webhookAsaas` + function agendada de renovação | HTTP (webhook) + agendamento | `_reversa_forward/002-unificar-plano-assinatura/interfaces/webhook-asaas.md` |
| `DELETE /api/billing/cancel` | HTTP | `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-cancel.md` |
| `GET /api/billing/subscription` | HTTP | `_reversa_forward/002-unificar-plano-assinatura/interfaces/billing-subscription.md` |

## 8. Plano de migração

Não há migração de dado de clientes reais (RN-11). O "plano de migração" aqui é o procedimento de reset do ambiente de teste:

1. Confirmar salvaguarda de ambiente (variável/flag que impede rodar contra produção — RNF "Ambiente" do `requirements.md`)
2. Apagar todas as `orgs`, `users`, `cases` (e demais coleções dependentes) da base de teste
3. Rodar o script de reseed (D-05), gerando exatamente 1 org, 2 usuários, 5 departamentos, 5 a 15 casos (ver `data-delta.md` §7)
4. Fazer o deploy do código (gates removidos, limites unificados, Enterprise removido) e do `firestore.rules` atualizado no mesmo deploy — evita janela onde a Rule ainda diferencia por plano antigo enquanto o Route Handler já não diferencia mais
5. Se D-04 (Opção A) for confirmada: fazer o deploy da nova Cloud Function agendada junto, não depois

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A arquitetura de cobrança parcelada anual (D-04) não funcionar exatamente como a documentação pública do Asaas sugere | alto | médio | Validar em sandbox Asaas antes de `/reversa-to-do` detalhar as ações de billing; a arquitetura em si (Opção A) já está confirmada pelo dono do negócio, só a viabilidade técnica exata segue pendente |
| Enterprise (`enterprise`) ser deixado para trás em algum ponto não mapeado nesta investigação | baixo | baixo | `_reversa_sdd/traceability/spec-impact-matrix.md` e busca `grep -rn "enterprise"` (passo 9 do `onboarding.md`) usados como checklist antes de fechar o PR |
| Outro contrato dependente do objeto `subscription` da Asaas (além de `billing/cancel` e `billing/subscription`, já corrigidos por D-10/D-11) não ter sido mapeado | médio | baixo | `grep -rn "getSubscription\|cancelSubscription\|subscription_id" src/ functions/` como checklist adicional antes de fechar o PR (`billing/invoices` já verificado como não afetado, pois consulta por `customer`) |
| Cliente que cancela no meio do ciclo anual continuar sendo cobrado pelas parcelas restantes já geradas (ver premissa em §4) | médio | médio | Confirmar com o dono do negócio se isso é aceitável antes de `/reversa-coding` fechar a ação de D-10; se não for, vira escopo adicional (estornar parcelas futuras individualmente na Asaas) |
| Remoção do gate de `plano === "entrada"` em 4 rotas esquece algum ponto não mapeado | médio | baixo | `investigation.md` §"Levantamento" já mapeia os 13 pontos de código/UI/doc afetados — usar como checklist |
| Reset de banco rodar acidentalmente contra ambiente errado | alto | baixo | Salvaguarda explícita de ambiente (RNF "Ambiente" do `requirements.md`), passo 1 do plano de migração acima |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] D-04 (arquitetura de cobrança) validada em sandbox Asaas antes de considerar a feature pronta para produção
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-plan`, a partir do `requirements.md` da feature `002` (reexecução da `001` com decisões de negócio fechadas) | reversa |
| 2026-07-21 | Reexecução: D-04 confirmada pelo dono do negócio (Opção A); D-09 adicionada (falha de renovação suspende o acesso); premissa e risco correspondentes removidos por resolvidos | reversa |
| 2026-07-21 | Reexecução pós-`/reversa-audit`: D-10 (cancelamento sem Asaas), D-11 (faturamento sem `/v3/subscriptions`) e D-12 (fonte única de preço) adicionadas, corrigindo A001/A002/A003 do `audit/cross-check.md`; nova premissa/risco sobre parcelas não estornadas em cancelamento no meio do ciclo | reversa |
