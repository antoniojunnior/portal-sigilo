# Cross-Check: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Artefatos analisados:
> - `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
> - `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`
> - `_reversa_forward/002-unificar-plano-assinatura/actions.md`
> - `_reversa_forward/002-unificar-plano-assinatura/investigation.md`, `data-delta.md`, `onboarding.md`, `interfaces/*.md` (apoio)
> - `_reversa_sdd/domain.md`, `_reversa_sdd/architecture.md` (coerência com o legado)
>
> Este relatório é estritamente leitor. Nenhum dos artefatos analisados foi alterado.

## Resumo

| Severidade | Contagem |
|---|---|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 3 |
| **Total** | **8** |

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | CRITICAL | Coerência com o legado / Cobertura | `DELETE /api/billing/cancel` fica inoperante para toda org contratada sob a Opção A (D-04) | `requirements.md` RF-12; `roadmap.md` D-04; `interfaces/webhook-asaas.md`; `actions.md` (sem ação) |
| A002 | HIGH | Cobertura | `GET /api/billing/subscription` perde dados de faturamento (valor/ciclo/status) para orgs sob a Opção A | `investigation.md` (levantamento incompleto); `actions.md` (sem ação) |
| A003 | HIGH | Cobertura | RF-07 (fonte única de preço) não tem ação que elimine a duplicação do valor `1164` | `requirements.md` RF-07; `actions.md` T002, T015 |
| A004 | MEDIUM | Consistência | `actions.md` T009/T010 citam decisão `D-02`, que não cobre o escopo dessas ações | `roadmap.md` D-02 vs §5; `actions.md` T009, T010 |
| A005 | MEDIUM | Sanidade do actions | T003 e T019 compartilham arquivo alvo e ambas estão marcadas `[//]` | `actions.md` T003, T019 |
| A006 | LOW | Cosmético | Nomes de fase fogem do padrão canônico do template (duas fases "Integração", nenhuma "Testes" dedicada) | `actions.md` (cabeçalhos de fase) |
| A007 | LOW | Consistência | T017 remove `determinarPlano` (D-03) mas só cita `(D-04)` | `actions.md` T017 vs `roadmap.md` D-03 |
| A008 | LOW | Consistência | T013 não cita nenhum ID de decisão na descrição | `actions.md` T013 |

## Detalhamento — CRITICAL e HIGH

### A001 (CRITICAL) — Cancelamento de assinatura quebra sob a nova arquitetura de cobrança

`requirements.md` RF-12 (Must) afirma que `billing/cancel` "não tem comportamento alterado" por esta feature, e `interfaces/webhook-asaas.md` reforça essa suposição dizendo que a rota "já existente" só precisaria marcar `plano_ativo = "cancelado"`. Isso não é o que o código real faz.

Lendo `src/app/api/billing/cancel/route.ts`: o endpoint chama `getSubscription(customerId)`, exige `sub?.subscription_id` (senão retorna 404 "Assinatura ativa não encontrada") e, se encontrado, chama `cancelSubscription(subscription_id)` (`src/lib/asaas/cancelSubscription.ts`), que executa `DELETE /v3/subscriptions/{id}` na Asaas — uma operação exclusiva de objetos `subscription`.

Sob a Opção A (D-04, confirmada), nenhuma org nova é provisionada com um objeto `subscription` na Asaas — só cobranças avulsas parceladas (`chargeType: INSTALLMENT`). Logo, `getSubscription()` nunca vai retornar `subscription_id` para essas orgs, e `DELETE /api/billing/cancel` vai **sempre** responder 404, tornando impossível cancelar a assinatura pela UI — uma regressão direta contra RF-12 (Must) e contra a própria RN-10 (🟢 confirmada, preservada do legado em `_reversa_sdd/state-machines.md#3`).

**Nenhuma ação em `actions.md` toca `cancelSubscription.ts` nem `billing/cancel/route.ts`.** T012 só remove `VALUE_TO_PLANO` de `getSubscription.ts`, sem tratar a consulta de `subscription_id` em si.

**Impacto:** se codado como está, a feature entrega um Must quebrado silenciosamente — só seria descoberto ao tentar cancelar uma assinatura de teste manualmente (que o `onboarding.md` atual nem cobre, já que seu passo de validação de suspensão/cancelamento não testa o fluxo de cancelamento voluntário via dashboard).

**Direção sugerida:** este cross-check não corrige. Revisitar `roadmap.md`/`actions.md` (via reexecução de `/reversa-plan`, ou edição manual) para decidir como `billing/cancel` deve funcionar sob a Opção A — por exemplo, cancelar significa apenas marcar `plano_ativo = "cancelado"` e impedir a próxima cobrança agendada de disparar (sem chamar nenhum endpoint de assinatura da Asaas, já que não existe mais) — e adicionar a ação correspondente antes de `/reversa-coding`.

### A002 (HIGH) — Tela de faturamento perde dados sob a nova arquitetura

`GET /api/billing/subscription` (`src/app/api/billing/subscription/route.ts`) consulta `getSubscription(customerId)`, que busca `/v3/subscriptions?customer=...` na Asaas. Sob a Opção A, essa busca nunca encontra nada para orgs novas (não há mais objeto `subscription`), então a rota sempre cai no `firestoreFallback()`, que devolve `valor: null`, `ciclo: null`, `status: null`, `subscription_id: null` — só `plano_ativo` e `proximo_vencimento` (via `data_renovacao`) continuam corretos.

Isso não quebra a rota (ainda responde 200), mas degrada silenciosamente a tela de "Faturamento" do dashboard para todo cliente contratado sob o novo modelo — nenhum artefato do plano documenta essa consequência. `investigation.md` §"Levantamento de todos os pontos" (13 pontos) não inclui `billing/subscription/route.ts` nem `getSubscription.ts` além da remoção pontual de `VALUE_TO_PLANO`.

**Impacto:** médio-alto no produto (usuário perde visibilidade de valor/status da cobrança), mas não bloqueia nenhum fluxo crítico — por isso HIGH, não CRITICAL.

**Direção sugerida:** ao resolver A001, considerar se a mesma correção de `getSubscription.ts` (ou uma nova função equivalente) também deveria derivar `valor`/`ciclo`/`status` a partir de `orgs.proxima_cobranca_parcelas`/`data_renovacao`/histórico de cobranças avulsas, em vez de consultar um endpoint de assinatura que não se aplica mais. Mesma via de correção: reexecução de `/reversa-plan` ou edição manual do roadmap/actions antes de codar.

### A003 (HIGH) — RF-07 (fonte única de preço) não é resolvido por nenhuma ação

`requirements.md` RF-07 (Should) pede uma única fonte de verdade de preço/nome do plano, "eliminando a divergência entre `PLANOS_CONFIG` e `src/lib/planos.ts`" — esse é o mesmo débito técnico já registrado em `_reversa_sdd/checkout/design.md` antes desta feature existir.

Em `actions.md`, T002 grava `precoAnual: 1164` em `src/lib/planos.ts`; T015 grava `totalValue: 1164` de forma independente em `src/lib/asaas/createPaymentLink.ts`. Nenhuma ação cria uma constante ou módulo compartilhado entre os dois — o valor `1164` fica hardcoded duas vezes, reproduzindo exatamente o padrão que RF-07 pede para eliminar. `roadmap.md` também não tem uma "Decisão técnica" (§3) dedicada a isso, apenas a linha "Config de planos (UI)" no delta arquitetural (§5), sem indicar consolidação real.

**Impacto:** não bloqueia a feature (RF-07 é "Should"), mas perpetua o débito técnico que a unificação deveria resolver — se o preço mudar de novo no futuro, alguém vai precisar lembrar de editar dois arquivos.

**Direção sugerida:** adicionar uma decisão técnica e uma ação (ex.: um módulo `src/lib/planos-config.ts` único, importado tanto por `planos.ts` quanto por `createPaymentLink.ts`) via reexecução de `/reversa-plan`/`/reversa-to-do`, ou aceitar conscientemente o débito residual e registrar essa aceitação em `roadmap.md`.

## Itens verificados que passaram

### Cobertura
- Todas as 11 Regras de Negócio (RN-01 a RN-11) do `requirements.md` têm pelo menos uma Decisão técnica correspondente em `roadmap.md` §3
- Os 7 cenários Gherkin do `requirements.md` §7 têm cobertura em ações de `actions.md` ou em passos de validação de `onboarding.md`
- RF-08/RF-09 (remoção completa do Enterprise) têm cobertura consistente em D-08 e nas ações T002, T020, T021, T022

### Consistência
- Nenhum identificador fantasma: todos os IDs de RN/RF/D/T citados cruzadamente existem nos documentos que deveriam defini-los
- Todos os arquivos do `_reversa_sdd/` citados em `roadmap.md` (checkout/design.md, checkout/contracts.md, adrs/003, assistant/requirements.md, dashboard/design.md, chat/design.md, reports/design.md, upload-attachment/design.md, data-dictionary.md, traceability/spec-impact-matrix.md) existem de fato no disco
- Os dois contratos documentados em `interfaces/` (`checkout-create.md`, `webhook-asaas.md`) aparecem corretamente listados na tabela §7 do `roadmap.md`
- Terminologia (`"unico"`, `parcelas`, `plano_ativo`, `categoria_legal`) é usada de forma consistente entre `requirements.md`, `roadmap.md` e `actions.md`

### Coerência com o legado
- A mudança à regra 🟢 "Planos são gates de feature aplicados no servidor" (`domain.md`) é intencional, corretamente identificada como alteração (não como omissão) e rastreada à origem em `requirements.md` RN-01
- `src/app/api/billing/cancel/route.ts`, `src/app/api/billing/invoices/route.ts` e `src/app/api/billing/subscription/route.ts` foram lidos e comparados contra as decisões do roadmap — `billing/invoices` (via `getInvoices.ts`, que consulta `/v3/payments` por cliente, não por assinatura) **não é afetado** pela mudança de arquitetura de cobrança, ao contrário de `billing/cancel` e `billing/subscription` (ver A001, A002)
- Nenhuma outra regra 🟢 do `domain.md` é contradita pelas decisões do roadmap

### Sanidade do actions
- Nenhum ciclo de dependência: todas as dependências de `actions.md` apontam para IDs de menor numeração, tornando um ciclo estruturalmente impossível
- Todas as 47 referências de dependência entre T001–T023 apontam para IDs que existem no documento
- Apenas 1 par de tarefas marcadas `[//]` compartilha arquivo alvo (A005); os demais 15 pares/itens `[//]` são mutuamente independentes e tocam arquivos distintos

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-audit` | reversa |
