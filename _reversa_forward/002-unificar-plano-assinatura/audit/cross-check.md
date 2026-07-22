# Cross-Check: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-22`
> Artefatos analisados:
> - `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
> - `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`
> - `_reversa_forward/002-unificar-plano-assinatura/actions.md`
> - `_reversa_forward/002-unificar-plano-assinatura/investigation.md`, `onboarding.md`, `legacy-impact.md`, `regression-watch.md`, `progress.jsonl`, `interfaces/*.md` (apoio)
> - `_reversa_sdd/addenda/002-unificar-plano-assinatura.md`
> - `_reversa_bugs/unificacao-plano-assinatura/` (8 bugs, todos `DONE`)
> - Código real pós-3 commits externos: `functions/src/index.ts`, `getSubscription.ts`, `billing/subscription/route.ts`, `docs/PRD_PortalSigilo_v2.md`, `assistant/route.ts`, `reports/generate/route.ts`, `aiInsights.ts`, `scheduledReports.ts`
>
> Este relatório é estritamente leitor. Nenhum dos artefatos analisados foi alterado.
>
> Nota: **4ª execução** de `/reversa-audit` para esta feature. As 3 rodadas anteriores (A001–A008, A001–A005, A001) foram corrigidas e confirmadas — os 8 bugs resultantes estão todos `DONE` em `_reversa_bugs/unificacao-plano-assinatura/`. Desde a 3ª rodada, 3 commits externos ("fecha os 8 bugs do pente-fino", "remove referências órfãs a Badge.plan", "bugs críticos encontrados rodando onboarding.md de ponta a ponta") corrigiram esses 8 bugs e mais 4 problemas reais não registrados no protocolo de bugs. Esta rodada foca em: (1) o estado físico de `T014`/`T025` em `actions.md` vs. o trabalho real já executado, (2) consistência do registro de bugs com o histórico real de commits, (3) o que mais pode ter escapado do Definition-of-Done original das ações.

## Resumo

| Severidade | Contagem |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 3 |
| LOW | 0 |
| **Total** | **3** |

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | MEDIUM | Sanidade do actions / Coerência | `T014` e `T025` seguem `[ ]` em `actions.md`, mas há evidência forte de que o trabalho substantivo de ambos já foi executado e validado contra ambiente real; `investigation.md` e "Notas de execução" nunca foram atualizadas para refletir isso | `actions.md` (T014, T025); `investigation.md` linha 29; commit `70dbd47` |
| A002 | MEDIUM | Coerência com o legado | 4 correções reais aconteceram fora do protocolo `_reversa_bugs/` (não registradas como bugs): function não exportada, fallback duplicado mascarando D-11, contradição no PRD §8.2, modelo Claude hardcoded errado em 4 arquivos | commits `70dbd47`, `_reversa_bugs/unificacao-plano-assinatura/bugs/` (sem entrada correspondente) |
| A003 | MEDIUM | Sanidade do actions | `T018` foi marcada `[X]` sem que sua descrição original exigisse exportar a function em `functions/src/index.ts` — sem esse passo, ela nunca seria implantada; só descoberto depois, fora do fluxo formal do checkbox | `actions.md` T018 (linha 55); `functions/src/index.ts` (correção externa) |

## Detalhamento

### A001 (MEDIUM) — T014/T025 fisicamente pendentes, mas o trabalho já foi feito e nunca formalizado

`actions.md` mostra `T014` (validar em sandbox Asaas) e `T025` (executar `onboarding.md` ponta a ponta) como `[ ]`. Na prática:

- Esta sessão validou exatamente o que `T014` pede: chamadas reais ao sandbox Asaas confirmaram que `creditCardToken` é reutilizável numa cobrança direta (`_reversa_bugs/.../K9M2/evidence/reproduction.md`, achados 4 e 5) — mas isso foi registrado como evidência de correção de bug, nunca copiado de volta para `investigation.md`, que na linha 29 ainda diz literalmente "falta validação em sandbox do Asaas antes de virar ação".
- O commit `70dbd47` documenta, na própria mensagem, exatamente o roteiro de `T025`: "checkout contra sandbox Asaas, creditCardToken reutilizável..., triagem automática de ponta a ponta via chatbot real (protocolo ETK-2026-2JTKD8...), relatório e assistente gerando resposta real da IA" — isso é a execução de `onboarding.md`, ou muito próximo disso.
- Apesar disso, a seção "Notas de execução" de `actions.md` segue com só o comentário placeholder, vazia.

**Impacto:** baixo risco funcional (o trabalho foi feito e validado de verdade), mas risco real de confusão/retrabalho — alguém lendo só `actions.md`/`investigation.md` concluiria que a feature ainda tem 2 pendências abertas de validação manual, quando na prática ambas já foram cobertas. O adendo (`_reversa_sdd/addenda/002-unificar-plano-assinatura.md`) é honesto sobre isso ("T014 e T025 permanecem pendentes"), mas herda a mesma imprecisão.

**Direção sugerida:** não corrigido aqui. Ao rodar `/reversa-coding` de novo (ou edição manual), atualizar `investigation.md` linha 29 com o resultado real confirmado, preencher "Notas de execução" de `actions.md` com um resumo do que já foi validado (linkando para a evidência em `_reversa_bugs/` e para o commit `70dbd47`), e então marcar `T014`/`T025` como `[X]` — ou, se ainda achar que falta algo específico não coberto, deixar isso explícito em vez do placeholder vazio.

### A002 (MEDIUM) — Registro de bugs incompleto frente ao histórico real de commits

O commit `70dbd47` corrigiu 4 problemas reais, nenhum registrado via `/reversa-debugger`:

1. `functions/src/index.ts` nunca exportava `renovarAssinatura` — a Cloud Function de renovação anual (criada por `T018`, marcada `[X]`) nunca seria implantada nem no emulador nem em produção, apesar de existir como arquivo.
2. `getSubscription.ts`/`billing/subscription/route.ts` tinham um `firestoreFallback()` local duplicado e desatualizado, que mascarava a correção de D-11/`BUG-20260721-H3X6` sempre que a org não tinha `asaas_customer_id` (o caso comum) — ou seja, o bug H3X6 foi corrigido na função certa, mas a rota ainda usava o caminho errado na maior parte das chamadas reais.
3. Tabela §8.2 do PRD contradizia outra seção do mesmo documento sobre gates já removidos.
4. Modelo Claude hardcoded (`claude-sonnet-4-20250514`, retornando 404) em 4 arquivos (`assistant/route.ts`, `reports/generate/route.ts`, `aiInsights.ts`, `scheduledReports.ts`) — corrigido para `claude-sonnet-4-6`. O próprio commit já identifica este como bug pré-existente, fora do escopo da feature 002.

**Impacto:** nenhum funcional agora (tudo corrigido e validado). O impacto é de processo: `_reversa_bugs/unificacao-plano-assinatura/` deixou de ser a fonte única de verdade sobre "o que quebrou e foi corrigido nesta feature" — itens 1 e 2 acima são diretamente relevantes ao escopo de `002` (um bloqueava o deploy da própria function que a feature criou; o outro é uma continuação direta de H3X6) e ficaram de fora do registro, das views (`generated/`) e do espelho `_reversa_sdd/traceability/bugs.md`.

**Direção sugerida:** não corrigido aqui (fora do mandato deste skill). Considerar rodar `/reversa-debugger` retroativamente para os itens 1 e 2 (registrar, vincular ao commit, marcar `DONE` direto já que já foram corrigidos e validados) — mantém a rastreabilidade íntegra para quem for entender a feature depois só pelos artefatos do Reversa. O item 4 (modelo Claude) é explicitamente fora do escopo de `002`, então cabe mais a um registro solto de manutenção do que a este contexto de bugs.

### A003 (MEDIUM) — Definition-of-Done de T018 não previa a exportação em index.ts

`actions.md` T018 diz: "Criar a nova Cloud Function agendada (`onSchedule`) de renovação anual... [lógica completa]... `functions/src/renovarAssinatura.ts`" — nunca menciona explicitamente que a function precisa ser reexportada em `functions/src/index.ts` para ser de fato implantada (padrão do Firebase Functions v2: só funções exportadas do entry point são reconhecidas no deploy). T018 foi marcada `[X]` no momento em que o arquivo `renovarAssinatura.ts` foi criado corretamente — mas sem o passo de wiring, ela nunca rodaria. Isso só foi descoberto ao testar de ponta a ponta contra emulador/sandbox reais (fora do fluxo formal de fechamento de T018).

**Impacto:** já corrigido (`functions/src/index.ts` agora exporta `renovarAssinatura`), sem risco funcional remanescente. O ponto é de acurácia do `actions.md`: uma ação marcada `[X]` cujo critério de conclusão implícito (deploy-ready) não estava explícito no texto da própria ação, então ninguém verificou antes de marcar.

**Direção sugerida:** ao gerar `actions.md` para próximas features (via `/reversa-to-do`), ações que criam Cloud Functions novas deveriam incluir explicitamente "registrar/exportar em `functions/src/index.ts`" como parte do critério de conclusão, não como passo implícito.

## Itens verificados que passaram

### Cobertura
- Todas as Regras de Negócio, Requisitos Funcionais e Decisões técnicas seguem com correspondência íntegra entre `requirements.md`, `roadmap.md` e `actions.md` (confirmado nas 3 rodadas anteriores, sem regressão nesta)
- `regression-watch.md` (W001–W021) cobre corretamente os pontos centrais da unificação, incluindo o próprio wiring de `renovarAssinatura` (W017) e o comentário `CANONICAL` de sincronização de preço (W019, confirmado presente no código real)

### Consistência
- `interfaces/billing-subscription.md` (seção "Depois") continua batendo com o comportamento real de `getSubscription.ts`/`billing/subscription/route.ts` após a mudança de assinatura (`customerId` → `orgId`) — a forma da resposta documentada (`source`, `plano_ativo`, `valor`, `ciclo`, `proximo_vencimento`, `status`, `subscription_id`, `parcelas`) confere exatamente com o código atual
- Nenhum resquício de `total_parcelas` ou de `getSubscription(customerId)` sobrevive fora de documentos históricos (bugs já `DONE`, que corretamente descrevem o "antes")
- `docs/PRD_PortalSigilo_v2.md`: apenas 1 ocorrência de "Enterprise" no arquivo inteiro, e é uma referência intencional ao bug `Q5J9` (decisão de produto já tomada pelo usuário, registrada em `DONE.md`), não um resíduo de gate

### Coerência com o legado
- Todos os 8 bugs em `_reversa_bugs/unificacao-plano-assinatura/bugs/` têm `DONE.md`, `resolution_kind: fixed`, e `spec_verdict: spec-correta` — nenhuma pasta travada foi violada nesta auditoria (todas permaneceram somente leitura)
- Adendo `_reversa_sdd/addenda/002-unificar-plano-assinatura.md` é preciso e honesto sobre o que está pendente (T014/T025), mesmo que os próprios artefatos-fonte (`investigation.md`, `actions.md`) não tenham sido atualizados em conjunto (ver A001)

### Sanidade do actions
- Nenhum ciclo de dependência, nenhum ID fantasma, nenhuma dependência apontando pra fora da lista
- Único gap remanescente é de acurácia do Definition-of-Done (A003), não de estrutura

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-audit` (achados A001–A008) | reversa |
| 2026-07-21 | 2ª execução, achados A001–A005 (functions agendadas, badges de UI, idempotência, métrica de cadeia, título SECURITY.md) | reversa |
| 2026-07-21 | 3ª execução, achado A001 (3 gates de UI residuais) | reversa |
| 2026-07-22 | 4ª execução, pós-3 commits externos que fecharam os 8 bugs e corrigiram 4 problemas adicionais não registrados. Achados A001–A003 (todos MEDIUM): T014/T025 pendentes só no papel, registro de bugs incompleto frente ao histórico real, Definition-of-Done de T018 não previa exportação em index.ts | reversa |
