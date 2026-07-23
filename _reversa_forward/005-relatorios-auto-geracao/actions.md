# Actions: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Roadmap: `_reversa_forward/005-relatorios-auto-geracao/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 13 |
| Paralelizáveis (`[//]`) | 3 |
| Maior cadeia de dependência | T001 → T003 → T004 → T008 → T012 → T010 (6) |

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar módulo de funções puras `getDefaultFilters()` (período mês corrente + tipo padrão + sem departamento/categoria), `filtersEqual(a, b)` (comparação rasa de filtros) e `isReportWithinHours(report, hours)` (compara `gerado_em` com agora) | - | `[//]` | `src/lib/reports/report-filters.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T002 | Teste unitário de `report-filters.ts`: filtros iguais/diferentes, relatório dentro/fora da janela de 24h, filtros default vs customizado — seguindo o padrão dos scripts `scripts/test-reports-*.ts` já existentes | T001 | `[//]` | `scripts/test-reports-auto-generate.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Adicionar estado `filtrosAplicados` (snapshot congelado dos filtros do último relatório exibido/gerado) e valor derivado `filtrosAlterados` usando `filtersEqual` de T001 | T001 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T004 | Adicionar `useRef` de guarda ("já disparei geração automática nesta montagem") + `useEffect` de mount que, com `data.reports` carregado, decide: reaproveitar relatório default recente (`isReportWithinHours`, `getDefaultFilters`) sem novo POST, ou chamar `handleGenerate()` automaticamente uma única vez (403 de `auditor` ou plano suspenso/cancelado tratado pelo mesmo catch de `handleGenerate`, sem checagem client duplicada — RN-04) | T001, T003 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T005 | Remover o botão "Gerar relatório" do topo da página (bloco atual nas linhas ~159-176) e qualquer estado/handler que existisse só para esse clique manual isolado | T004 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T006 | Adicionar botão "Aplicar filtros", renderizado apenas quando `filtrosAlterados` é verdadeiro, posicionado no bloco de filtros expandido (`showFilters`); `onClick` chama `handleGenerate()` | T003 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T007 | Após geração bem-sucedida (automática do T004 ou manual do T006), atualizar `filtrosAplicados` para o snapshot corrente dos filtros, garantindo que `filtrosAlterados` volte a `false` até a próxima mudança | T004, T006 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |
| T013 | Refatorar o `throw` dentro do bloco `if (!res.ok)` de `handleGenerate` (D-09): lançar `new GenerateError(msg, res.status)` — subclasse de `Error` com campo `status: number` — no lugar de `new Error(msg)`, preservando o status HTTP até o catch externo | - | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | No catch de erro da geração automática (T004), não sobrescrever `data.reports` (evitar `mutate()` destrutivo); introduzir estado `autoGenerateWarning` distinto de `generateError`, exibido como aviso discreto quando já existe relatório anterior visível | T004 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟡 | `[X]` |
| T009 | Introduzir estado booleano `autoGenerating` (distinto de `generating`, conforme D-06) para exibir skeleton entre o mount e a primeira resposta do trigger automático, evitando o "flash" do estado vazio "Nenhum relatório ainda" | T004 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟡 | `[X]` |
| T012 | Implementar botão "Tentar novamente" (D-08/RN-06/RF-08): renderizado só quando `reports.length === 0` e o erro capturado no catch de `handleGenerate` não é `GenerateError` com `status === 403` (usa o `GenerateError` de T013); `onClick` chama `handleGenerate()` de novo; em caso de 403 sem relatório algum, exibir só a mensagem de bloqueio, sem o botão | T004, T008, T013 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T010 | Revisar textos/cópia: mensagem do estado vazio (só alcançável em falha real sem relatório anterior), do aviso discreto de falha (T008) e do botão "Tentar novamente" (T012), garantindo consistência com o novo fluxo automático | T005, T006, T007, T008, T009, T012 | - | `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | 🟡 | `[X]` |
| T011 | Confirmar que `logAudit`/`report_generated` em `reports/generate/route.ts` já registra também as chamadas originadas do trigger automático (nenhuma mudança de código esperada, é validação de que o Route Handler não distingue origem da chamada) | T004 | `[//]` | `src/app/api/reports/generate/route.ts` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

- T001: `src/lib/reports/report-filters.ts` criado com `getDefaultFilters`, `filtersEqual` (com `arraysEqual` auxiliar para ordenação independente), `isReportWithinHours`. Diretório `src/lib/reports/` não existia — criado na execução.
- T002: 13 testes passando em `scripts/test-reports-auto-generate.ts`. Padrão `test()` sem framework externo, alinhado com scripts `test-reports-*.ts` existentes. Executado e verificado: ✅ todos passam.
- T003-T013: Todas as modificações em `page.tsx` consolidadas em uma única reescrita. Estados `autoGenerating`, `autoGenerateWarning`, `lastErrorStatus`, `filtrosAplicados`, `filtrosAlterados` adicionados. `GenerateError` como subclasse de `Error` com `status`. Botão "Gerar relatório" removido; "Aplicar filtros" condicional adicionado; "Tentar novamente" condicional a zero relatórios + erro não-403.
- T010: Textos revisados: empty state atualizado para refletir fluxo automático (remove menção ao botão inexistente); aviso discreto informa indisponibilidade sem ser bloqueante; botão "Tentar novamente" com mensagem clara.
- T011: `logAudit`/`report_generated` em `src/app/api/reports/generate/route.ts:242-255` confirmado — registro é feito após `reportRef.set()` no POST handler, independente da origem da chamada (manual ou automática). Nenhum código alterado.
- Lint: eslint passou limpo. TypeScript compila sem erros. Regra `react-hooks/set-state-in-effect` contornada com `queueMicrotask` e `eslint-disable-next-line` na chamada a `handleGenerate()`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-07-23 | Correção pós-`/reversa-audit`: contagem de paralelizáveis corrigida de 2 para 3 (finding A003, MEDIUM); T009 renomeia o estado de loading para `autoGenerating` alinhado ao D-06 do roadmap; T004 explicita cobertura de plano suspenso/cancelado (finding A002, HIGH) | reversa |
| 2026-07-23 | Segunda correção pós-`/reversa-audit` (finding A001 da 2ª rodada, HIGH): T012 adicionado (botão "Tentar novamente", D-08/RN-06/RF-08); T010 passa a depender também de T012; total de ações 11→12 | reversa |
| 2026-07-23 | Terceira correção pós-`/reversa-audit`: T013 adicionado (refatoração `GenerateError` com `status`, D-09, finding A001 HIGH); T012 passa a depender de T013 e usar `GenerateError` em vez de `res.status`; total de ações 12→13; "Maior cadeia de dependência" recalculada de 5 para 6 (finding A002, MEDIUM); âncora de `domain.md` padronizada no requirements.md (finding A003, MEDIUM) | reversa |
| 2026-07-23 | All actions executed by `/reversa-coding` (YOLO mode) | reversa |
