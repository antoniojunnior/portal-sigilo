# Cross-Check: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Artefatos analisados:
> - `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
> - `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`
> - `_reversa_forward/002-unificar-plano-assinatura/actions.md`
> - `_reversa_forward/002-unificar-plano-assinatura/investigation.md`, `data-delta.md`, `onboarding.md`, `interfaces/*.md` (apoio)
> - `_reversa_sdd/domain.md` (regra 🟢 sobre gates de plano)
> - Código real: `src/app/(dashboard)/app/(protected)/casos/page.tsx`, `.../casos/[caseId]/page.tsx`, `.../relatorios/page.tsx`, e busca ampla por `plano`/`plano_ativo` em `src/` e `functions/`
>
> Este relatório é estritamente leitor. Nenhum dos artefatos analisados foi alterado.
>
> Nota: esta é a **terceira execução** de `/reversa-audit` para esta feature. As duas rodadas anteriores (achados A001–A008 e A001–A005) foram corrigidas — confirmado nesta releitura, incluindo a edição manual do `requirements.md` feita após `/reversa-quality` (nova RNF de idempotência, RNF de billing reescrita, nota em §7). O achado abaixo é novo, encontrado ao ampliar a busca no código real para além dos arquivos já citados pelos artefatos da feature.

## Resumo

| Severidade | Contagem |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 0 |
| LOW | 0 |
| **Total** | **1** |

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | HIGH | Cobertura | Três gates de UI por `plano === "entrada"` (exportar CSV, página de relatórios inteira, assistente de IA no caso) não estão em nenhum artefato da feature nem na varredura do `T024` | `src/app/(dashboard)/app/(protected)/casos/page.tsx:205`; `.../relatorios/page.tsx:59,94`; `.../casos/[caseId]/page.tsx:658`; `investigation.md` (ausente); `actions.md` (sem ação; `T024` não busca por "entrada"/"gestao") |

## Detalhamento — HIGH

### A001 (HIGH) — Três gates de UI por tier de plano ficam esquecidos no código, fora do alcance até da varredura final

`investigation.md` §"Levantamento de todos os pontos de diferenciação por plano" (19 pontos, após as duas rodadas anteriores de audit) mapeia os 4 gates de feature por Route Handler (`assistant`, `dashboard/insights`, `triagem`, `reports/generate`) cobertos por D-02/T006-T009, e as duas Cloud Functions agendadas (D-13/T026). Uma busca ampla por `plano ===`/`plano !==` em todo `src/` encontrou 3 pontos adicionais de gate por `"entrada"`, nenhum deles em `investigation.md` nem em `actions.md`:

1. **`src/app/(dashboard)/app/(protected)/casos/page.tsx:205`** — `const canExportCSV = user?.plano !== "entrada";` controla se o botão de exportar CSV da lista de casos aparece habilitado. Nenhuma RN/RF do `requirements.md` menciona exportação de CSV — este ponto nunca foi um requisito explícito desta feature, é um gate de tier pré-existente que a extração original (`_reversa_sdd/domain.md` linha 34) também não documentou.
2. **`src/app/(dashboard)/app/(protected)/relatorios/page.tsx:59,94`** — a página inteira de relatórios verifica `user.plano === "entrada"` duas vezes: uma no `key` do SWR que busca os relatórios, outra bloqueando a página inteira com um componente local `PlanGate` (mensagem de upgrade). Isso é **diferente e mais amplo** do que o gate já coberto por `T009` (que só remove a checagem de subtipo "personalizado" dentro da API `POST /api/reports/generate`) — aqui é a página de listagem inteira que fica bloqueada, não só a geração de um subtipo.
3. **`src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx:658`** — dentro do detalhe de um caso, um bloco de UI mostra "Assistente de IA disponível nos planos Gestão e Enterprise" com cadeado, no lugar do botão real do assistente, quando `user?.plano === "entrada"`. É um gate de **UI** paralelo ao gate de **API** já coberto por `T006` (`POST /api/assistant`) — remover só o gate da API deixa esse bloco de UI datado, mas como o dado nunca mais será `"entrada"`, o branch simplesmente vira código morto em vez de causar erro.

**Por que isso passou despercebido até agora:** `T024` (a varredura final de "confirmar/limpar qualquer ocorrência residual") busca literalmente por `"enterprise"`, `"subscription_id"`, `getSubscription`, `cancelSubscription` — nenhum desses termos aparece nos 3 pontos acima, que usam `"entrada"` e `"gestao"`, não `"enterprise"`. A rede de segurança do fim do pipeline não cobre esses termos.

**Impacto real, com uma ressalva importante:** como o campo `orgs.plano_ativo` nunca mais assumirá o valor `"entrada"` depois desta feature (RN-02, D-01), as 3 comparações acima degradam **com segurança** — `canExportCSV` sempre vira `true` (CSV liberado pra todo mundo, que é o comportamento correto sob RN-01), a página de relatórios nunca mais mostra o `PlanGate`, e o cadeado do assistente nunca mais aparece no detalhe do caso. Não há regressão funcional como a do achado A001 da 2ª rodada (aquele quebrava um Must ao ficar permanentemente vazio). O problema aqui é puramente de dívida técnica: 3 blocos de código passam a comparar contra um valor de plano que nunca mais existirá, contrariando o próprio princípio que `D-02` já declarou ("Ramificação morta é dívida técnica automática — remover custa o mesmo que manter, evita confusão futura") — só que `D-02` e as ações que ele gerou (T006-T009) nunca chegaram a esses 3 pontos.

**Nota à parte sobre o CSV:** diferente dos outros dois pontos (que são a mesma regra de negócio de RN-01 em outra camada — UI espelhando API), a exportação de CSV nunca foi mencionada em nenhuma RN/RF desta feature. Vale uma decisão consciente do humano: unificar esse ponto também (estender D-02) ou registrar explicitamente que fica fora do escopo desta feature, para não ficar sem menção em lugar nenhum.

**Direção sugerida:** este cross-check não corrige. Estender `D-02` no `roadmap.md` para cobrir os 3 pontos de UI (ou registrar explicitamente a exclusão do ponto do CSV, se for decisão consciente), adicionar as ações correspondentes em `actions.md`, e considerar ampliar os termos de busca de `T024` para incluir `"entrada"`/`"gestao"` também, não só `"enterprise"`/`subscription`.

## Itens verificados que passaram

### Cobertura
- Todas as 11 Regras de Negócio (RN-01 a RN-11) têm pelo menos uma Decisão técnica em `roadmap.md` §3; a nova RNF "Idempotência e falha de cobrança" (adicionada após `/reversa-quality`) está corretamente coberta por D-09/D-15 e pelas ações T001/T018
- Os 7 cenários Gherkin do `requirements.md` §7 têm cobertura em ações ou em `onboarding.md`; a nota adicionada em §7 sobre RF-07/RF-09/RF-11 (sem Gherkin por serem estruturais/documentais) é coerente com os critérios de aceite dessas 3 RFs em §5
- Os 5 achados HIGH/CRITICAL da 2ª rodada (functions agendadas, badges de UI, idempotência, métrica de cadeia de dependência, título de SECURITY.md) estão de fato resolvidos por D-13/D-14/D-15/D-16 e pelas ações T001, T018, T023, T026, T027, T028, T029

### Consistência
- Nenhum identificador fantasma: todos os IDs de RN/RF/D/T citados cruzadamente (incluindo D-13 a D-16 e T026-T029) existem nos documentos que deveriam defini-los
- A RNF de billing reescrita (pós-`/reversa-quality`) não deixou nenhuma referência solta a `functions/src/webhookAsaas.ts` fora de `investigation.md`, onde ela já é detalhada corretamente
- Terminologia (`"unico"`, `parcelas`, `plano_ativo`, `ultima_cobranca_ciclo`) consistente entre `requirements.md`, `roadmap.md`, `data-delta.md` e `actions.md`

### Coerência com o legado
- A regra 🟢 de `domain.md` linha 34 ("Plano entrada: sem assistente IA... Todos os gates são checados no Route Handler") já estava incompleta na extração original — ela mesma não documentava os 3 gates de UI do achado A001 acima, então não há contradição nova introduzida por esta feature, só uma lacuna pré-existente que a feature herda e agora tem a chance de fechar
- Nenhuma outra regra 🟢 do `domain.md` é contradita pelas decisões do roadmap

### Sanidade do actions
- Nenhum ciclo de dependência: todas as dependências apontam para IDs de menor numeração
- Métrica "Maior cadeia de dependência: 5" confirmada correta nesta rodada (recalculada manualmente a partir da tabela real de dependências, incluindo T026-T029)
- Contagem de paralelizáveis (22) e total de ações (29) conferem com a contagem real de marcadores `[//]` e linhas de ação
- Nenhum par de tarefas `[//]` compartilha arquivo alvo, incluindo as 4 ações novas (T026-T029)

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-audit` | reversa |
| 2026-07-21 | Segunda execução, pós-correção de A001–A008 da 1ª rodada (confirmados resolvidos). Novos achados: A001 (CRITICAL, functions agendadas), A002 (HIGH, badges de UI), A003 (HIGH, idempotência), A004 (MEDIUM, métrica de cadeia), A005 (MEDIUM, título de SECURITY.md) | reversa |
| 2026-07-21 | Terceira execução, pós-correção de A001–A005 da 2ª rodada (confirmados resolvidos) e pós-edição manual do `requirements.md` via `/reversa-quality`. Novo achado a partir de busca ampla no código real: A001 (HIGH, 3 gates de UI por `plano === "entrada"` em `casos/page.tsx`, `relatorios/page.tsx` e `casos/[caseId]/page.tsx`, fora do alcance da varredura `T024`) | reversa |
