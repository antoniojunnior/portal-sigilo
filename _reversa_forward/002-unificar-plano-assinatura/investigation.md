# Investigation: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`

## Achado técnico principal: o modelo de cobrança pedido não é nativo do Asaas

O `requirements.md` (RN-08, RF-01/RF-02) descreve: assinatura recorrente, ciclo anual, cartão tokenizado uma única vez na adesão, e a cada renovação o cliente escolhe pagar a fatura à vista ou parcelada em até 12x sem juros. Antes de este ponto virar ação em `actions.md`, foi necessário verificar se a API do Asaas suporta isso nativamente, porque o código atual (`src/lib/asaas/createPaymentLink.ts`) já usa o mecanismo de assinatura nativa (`chargeType: "RECURRENT"`, `cycle: "YEARLY"`) e seria o caminho mais barato se servisse.

**Pesquisa (docs.asaas.com, consultado em 2026-07-21):**

- Assinatura (`subscription`) no Asaas cobra periodicamente um valor fixo por ciclo (`MONTHLY`/`YEARLY`/etc.) — cada ocorrência gera **uma única cobrança**, sem parâmetros de parcelamento (`installmentCount`, `installmentValue`) no payload de criação de assinatura com cartão de crédito.
- Parcelamento (`installmentCount` até 21x para Visa/Mastercard) é um recurso de **cobrança avulsa** (`chargeType: "INSTALLMENT"`): todas as parcelas são geradas de uma vez, como uma venda parcelada — não é uma cobrança recorrente que se repete indefinidamente.
- Conclusão: **não existe, na API do Asaas, uma "assinatura recorrente cujas ocorrências podem ser parceladas"**. São dois mecanismos de cobrança distintos e mutuamente exclusivos no desenho da API.

Fontes:
- [Cobrança recorrente no Asaas: automatize as assinaturas!](https://blog.asaas.com/cobranca-recorrente-no-asaas/)
- [Criando assinatura com cartão de crédito](https://docs.asaas.com/docs/criando-assinatura-com-cartao-de-credito) — schema de criação de assinatura não inclui campos de parcelamento
- [Cobranças via cartão de crédito](https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito) — parcelamento é atributo de cobrança avulsa, não de assinatura
- [Introdução — Assinaturas](https://docs.asaas.com/docs/assinaturas)

### Duas arquiteturas possíveis para atender ao requisito de negócio

| Opção | Como funcionaria | Trade-off |
|---|---|---|
| **A — Venda parcelada anual disparada por agendador próprio** (recomendada) | Abandona o objeto `subscription` do Asaas. No primeiro checkout, cria uma cobrança avulsa `INSTALLMENT` (1x a 12x, conforme escolha do cliente) via cartão, e Asaas retorna um `creditCardToken` reutilizável. A cada aniversário do ciclo (`data_renovacao`), uma Cloud Function agendada (Cloud Scheduler) dispara uma **nova** cobrança `INSTALLMENT` usando o token salvo — sem pedir o cartão de novo. | Verdadeiramente atende "cartão uma vez, parcelamento a cada renovação". Mas é uma **arquitetura de cobrança nova**: substitui `chargeType: RECURRENT` por gestão própria do ciclo anual, exige campo novo para guardar o token do cartão, exige uma function agendada que hoje não existe, e muda o formato de eventos que `webhookAsaas.ts` recebe (webhooks de `PAYMENT_CONFIRMED` passam a disparar até 12x por ano por cliente, um por parcela, em vez de 1x) |
| **B — Assinatura nativa `YEARLY`, sem parcelamento real (só parcelamento "de fachada" na comunicação)** | Mantém `chargeType: RECURRENT`/`cycle: YEARLY` como já existe hoje, cobrando o valor cheio uma vez por ano. "Até 12x" viraria só uma opção de parcelamento no cartão SE a operadora do cartão do cliente permitir parcelamento nativo da bandeira na hora do checkout (fora do controle do Asaas) | Mais simples de implementar (reaproveita 100% do código atual), mas não garante ao cliente a opção de parcelar — depende da bandeira do cartão dele, não é uma escolha oferecida pelo Portal Sigilo. **Não atende literalmente ao requisito confirmado pelo dono do negócio.** |

**Recomendação:** Opção A é a única que cumpre o requisito de negócio como descrito. **Confirmada pelo dono do negócio em 2026-07-21** e registrada em `roadmap.md` (D-04) — segue marcada 🟡 apenas porque falta validação em sandbox do Asaas antes de virar ação em `actions.md` (a pesquisa até aqui foi feita via documentação pública, não testada contra a API real do projeto), não porque haja dúvida sobre qual arquitetura adotar.

**Falha na cobrança de renovação:** também confirmado pelo dono do negócio (2026-07-21) — suspende o acesso da org (`plano_ativo = "suspenso"`), reaproveitando a transição já usada hoje para `PAYMENT_OVERDUE`. Ver D-09 em `roadmap.md` e `interfaces/webhook-asaas.md`.

**Consequência para `webhookAsaas.ts`:** o payload e a lógica de eventos mudam de formato. Hoje, `PAYMENT_CONFIRMED` dispara `provisionOrg` (que já é idempotente via `asaas_customer_id`). Na Opção A, o mesmo evento dispara até 12 vezes por ano por cliente (uma por parcela) — a idempotência de `provisionOrg` já protege contra reprovisionamento, mas não há hoje nenhum tratamento para "registrar que uma parcela da renovação anual foi paga" nem para "disparar a próxima venda parcelada no aniversário do ciclo". Isso é novo escopo de código, detalhado em `interfaces/webhook-asaas.md`.

## Levantamento de todos os pontos de diferenciação por plano no código atual

Busca sistemática por toda ocorrência de comparação/uso de `plano`/`plano_ativo` no código-fonte real (confirma e atualiza o levantamento já feito na feature `001` abandonada, que preservava Enterprise — aqui Enterprise também é alvo de remoção):

| # | Ponto | Arquivo real | Tipo de diferenciação | Ação nesta feature |
|---|---|---|---|---|
| 1 | Gate do assistente de IA | `src/app/api/assistant/route.ts:59-65` | Bloqueio total (`entrada`) + bloqueio por estado (`suspenso`/`cancelado`, preservado) | Remover bloqueio por `entrada` |
| 2 | Gate de insights de IA | `src/app/api/dashboard/insights/route.ts:16-24` | Mensagem fixa de upgrade (menciona "planos Gestão e Enterprise") no lugar do insight real | Remover o gate inteiro |
| 3 | Gate de triagem automática | `src/lib/triagem.ts:150-163` | Early-return para triagem manual quando `planoAtivo === "entrada"` | Remover o early-return |
| 4 | Gate de relatório personalizado | `src/app/api/reports/generate/route.ts:47-49` | Bloqueio de subtipo "personalizado" para `entrada` | Remover a checagem |
| 5 | Limite de usuários | `src/app/api/dashboard/users/route.ts:9-13` (`PLAN_USER_LIMITS`), `firestore.rules:76-81` (`getPlanoLimit`) | Valor numérico diferente por plano (1/10/∞) | Colapsar para 50 fixo nos dois lugares |
| 6 | Limite de storage | `src/app/api/upload-attachment/route.ts:6-10` (`STORAGE_LIMITS_BYTES`) | Valor numérico diferente por plano (2GB/20GB/∞) | Colapsar para 2GB fixo |
| 7 | Preço/nome exibido (3 planos) | `src/lib/planos.ts` (`PLANOS`, 3 entradas) | Conteúdo de UI, inclui feature matrix do Enterprise | Colapsar para 1 entrada, remover `enterprise` |
| 8 | Preço cobrado | `src/lib/asaas/createPaymentLink.ts` (`PLANOS_CONFIG`, 2 chaves × 2 ciclos) | Valor cobrado na Asaas, hoje `chargeType: RECURRENT` | Substituir por lógica de cobrança parcelada (Opção A acima) |
| 9 | Validação de checkout | `src/app/api/checkout/create/route.ts:7-11` (`isPlanoValido`) | Whitelist `"entrada" \| "gestao"` | Aceitar só `"unico"` |
| 10 | Resolução de plano por valor pago (consulta) | `src/lib/asaas/getSubscription.ts:26-31` (`VALUE_TO_PLANO`) | Mapeamento inverso valor→plano | Remover (só existe 1 valor/plano agora) |
| 11 | Resolução de plano por valor pago (provisionamento) | `functions/src/webhookAsaas.ts:93-98` (`determinarPlano`) | Mesma lógica, duplicada no webhook | Remover; ver também mudança de arquitetura de cobrança acima |
| 12 | Toggle de ciclo mensal/anual na UI | `src/app/planos/BillingToggle.tsx`, `src/app/planos/page.tsx` | Ciclo mensal deixa de existir (só há ciclo anual agora) | Substituir por seletor de forma de pagamento (à vista / até 12x), não de ciclo |
| 13 | Menções a Enterprise fora do código de gate | `docs/PRD_PortalSigilo_v2.md` (WhatsApp, multi-unidade, white-label listados como exclusivos do Enterprise) | Documentação de produto | Remover menções — essas features nunca foram implementadas (Fases 7/8/10 pendentes), então não há código a tocar, só texto |
| 14 | Cancelamento de assinatura (`DELETE /api/billing/cancel`) | `src/app/api/billing/cancel/route.ts`, `src/lib/asaas/cancelSubscription.ts` | Depende de `subscription_id` (objeto `subscription` da Asaas) para chamar `DELETE /v3/subscriptions/{id}` | **Achado pelo `/reversa-audit` (A001, CRITICAL), não pela varredura original desta investigação** — sob a Opção A não há mais `subscription_id`, então a rota sempre falharia com 404. Corrigido por D-10 do `roadmap.md`: cancelar passa a operar só sobre o Firestore |
| 15 | Consulta de assinatura (tela de faturamento) | `src/app/api/billing/subscription/route.ts`, `src/lib/asaas/getSubscription.ts` | Consulta `/v3/subscriptions` por `customer`, usada para exibir valor/ciclo/status na tela de faturamento | **Achado pelo `/reversa-audit` (A002, HIGH)** — sob a Opção A essa consulta nunca retorna resultado, degradando a tela silenciosamente. Corrigido por D-11: passa a derivar de Firestore + `getInvoices.ts` |

Confirmação: nenhum ponto adicional de diferenciação por plano foi encontrado ao cruzar contra `_reversa_sdd/traceability/spec-impact-matrix.md`. `docs/SECURITY.md` não menciona plano — não precisa de edição (RF-11 do requirements fica parcialmente satisfeito, só PRD precisa mudar).

**Nota sobre os pontos #14 e #15:** a varredura original (2026-07-21, feita durante a primeira execução de `/reversa-plan`) buscou por comparação/uso literal de `plano`/`plano_ativo` no código — mas não seguiu a cadeia de consequências de abandonar o objeto `subscription` da Asaas (D-04) sobre rotas que não mencionam plano diretamente, só `subscription_id`. O `/reversa-audit` encontrou isso ao verificar se `billing/cancel` e `billing/subscription` (citados em `requirements.md` RF-12) de fato continuariam funcionando sem mudança, como o requirements assumia. Lição para a `investigation.md` de próximas features: quando uma decisão técnica remove um recurso externo inteiro (aqui, o objeto `subscription`), vale grep por esse recurso (`subscription_id`, `getSubscription`, `cancelSubscription`) além de grep pelo termo de negócio (`plano`).

## Verificação de `billing/invoices` (não afetado)

`GET /api/billing/invoices` (via `getInvoices.ts`) consulta `/v3/payments?customer=...` — busca por cliente, não por assinatura. Continua funcionando sem alteração sob a Opção A, já que cobranças avulsas parceladas também são objetos `payment` normais na Asaas. Verificado durante a auditoria (A002), registrado aqui para não precisar reverificar depois.

## Departamento não é um campo do caso — é inferido de `triagem_ia.area_risco`

Achado relevante para o reseed (RF-10 do requirements): não existe campo `departamento` no documento `Case`. A associação de um caso a um departamento é feita pelo dashboard de heatmap (`src/app/api/dashboard/heatmap/route.ts:36-37`) usando `triagem_ia.area_risco`, comparado contra a lista `orgs.configuracoes.departamentos` (array de strings livres, já usado assim em `scripts/seed-emulator.ts`). Ou seja: para o reseed gerar "casos distribuídos entre 5 departamentos" de forma que apareça corretamente no heatmap, cada caso mockado precisa ter `triagem_ia.area_risco` igual a um dos 5 nomes de departamento configurados na org — não existe (nem deve ser criado) um campo `departamento` direto no `Case`.

## O que NÃO foi encontrado (e por quê isso importa)

- **Nenhuma rota de upgrade/downgrade de plano** — lacuna já conhecida da extração (`_reversa_sdd/state-machines.md#3`). Irrelevante agora: não há mais "outro plano" para o qual fazer upgrade.
- **Nenhum campo hoje para armazenar token de cartão reutilizável** — precisa ser adicionado em `orgs` se a Opção A for confirmada (ver `data-delta.md`).
- **Nenhuma Cloud Function agendada (`onSchedule`) existe hoje no projeto** — todas as functions atuais são `onRequest` (webhook) ou triggers de Firestore. A Opção A introduz o primeiro uso de `onSchedule` no projeto.

## Alternativas avaliadas (fora da arquitetura de billing, já discutida acima)

| Alternativa | Descartada por quê |
|---|---|
| Manter Enterprise no tipo `Plano` só como valor morto, sem UI | Descartado — o dono do negócio pediu remoção completa, não ocultação |
| Migrar dado de orgs em vez de reset+reseed | Descartado explicitamente pelo dono do negócio: sem clientes pagantes reais, reset é mais simples e não deixa código de migração para manter |
| Gerar mais de 1 org no reseed (ex. cobrir múltiplos cenários de billing) | Descartado — RF-10 pede exatamente 1 org; cenários adicionais podem ser cobertos por `scripts/seed-emulator.ts` de forma incremental depois, fora do escopo desta feature |

## Padrões aplicáveis já usados no projeto

- Scripts one-shot/reseed já existem (`scripts/seed-emulator.ts`, `scripts/seed-remote.ts`) — o script de reset+reseed desta feature segue o mesmo padrão de localização, execução (`npx ts-node` / `npm run seed`) e uso de IDs fixos para referência cruzada
- Audit log por mutação relevante já é padrão em toda escrita de `orgs`/`users` (`_reversa_sdd/data-dictionary.md#audit_logs`) — o reseed pode opcionalmente gravar audit logs de teste, mas não é obrigatório já que o ambiente é efêmero
