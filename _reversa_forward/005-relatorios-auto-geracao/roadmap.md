# Roadmap: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Requirements: `_reversa_forward/005-relatorios-auto-geracao/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Sem novo endpoint: reaproveita `POST /api/reports/generate` e `GET /api/reports/generate` já existentes (`src/app/api/reports/generate/route.ts`), ambos inalterados no contrato. Toda a mudança é client-side, em `src/app/(dashboard)/app/(protected)/relatorios/page.tsx`. Um `useEffect` de mount (gate por `user` e por `data.reports` já carregado via `useSWR`) decide: se existe relatório com filtros default (`tipo: "padrao"`, sem departamento/categoria, período = mês corrente) gerado nas últimas 24h, não gera nada novo — só exibe o mais recente compatível; senão, dispara `handleGenerate()` uma única vez (guardado por `useRef` para sobreviver a re-renders sem reexecutar o efeito). O botão "Gerar relatório" atual é removido; nasce um estado derivado `filtrosAlterados` (comparação rasa entre filtros correntes e os do último relatório aplicado) que controla a visibilidade do novo botão "Aplicar filtros". Falha do `POST` automático não substitui a lista existente — o SWR mantém o último dado bom, com um banner de aviso.

## 2. Princípios aplicados

n/a — projeto não tem `.reversa/principles.md` configurado.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Trigger automático via `useEffect([user, data])` guardado por `useRef` de "já disparei nesta sessão de rota", não via `useSWR` com auto-revalidação de POST | `useSWR` é read-only por padrão (`fetcher` do projeto é `GET`); disparar `POST` dentro do `fetcher` do SWR quebraria a semântica idempotente de cache-then-revalidate da lib e correria em todo `refreshInterval` (60s), gerando POST a cada 60s | auto-disparar POST dentro do próprio `fetcher` do SWR; usar `SWR mutate` sem guarda | 🟢 |
| D-02 | Reaproveitamento de relatório recente calculado 100% no client, comparando `gerado_em` do relatório mais recente da lista (`GET`, já carregada) com "agora - 24h" e filtros default | Evita novo endpoint/contrato; o campo `gerado_em` e o filtro por `tipo`/período já vêm na resposta atual de `GET /api/reports/generate` (`ReportSummary`) | criar endpoint novo `GET /api/reports/latest?filtros=...`; checar reaproveitamento no servidor | 🟢 |
| D-03 | Estado `filtrosAlterados` como comparação rasa entre o objeto de filtros correntes e uma cópia congelada dos filtros do último relatório exibido (atualizada a cada geração bem-sucedida, manual ou automática) | Simples, sem dependência nova; equivalente ao padrão "dirty state" comum em formulários | `react-hook-form` com `isDirty` (dependência nova desnecessária pra 4 campos) | 🟢 |
| D-04 | Falha do POST automático não deve chamar `mutate()` destrutivo — o SWR mantém `data.reports` anterior; erro vira só um banner (`generateError` já existe, reaproveitado) | `requirements.md#RF-07` exige fallback silencioso, não tela de erro bloqueante; `useSWR` já preserva o `data` anterior enquanto uma nova revalidação falha (comportamento nativo da lib) | limpar `data.reports` em caso de erro; redirecionar para tela de erro | 🟢 |
| D-05 | Guarda de role (`auditor`) e de plano (`suspenso`/`cancelado`) continua 100% no servidor (`reports/generate/route.ts`, já bloqueia ambos com 403) — o client não replica nenhuma dessas checagens antes de disparar o `POST` automático | Regra inviolável do projeto: nunca confiar em checagem client-side para autorização; o 403 do POST automático (por role ou por plano) já é tratado pelo mesmo branch de erro do `handleGenerate` e cai no fallback silencioso (RF-06, RF-07) | checar `user.role !== "auditor"` ou `org.plano` no client antes do POST automático para "economizar" a chamada | 🟢 |
| D-06 | Estado de carregamento do trigger automático (RF-05) usa uma flag booleana dedicada (`autoGenerating`), distinta de `generating` (que fica reservado ao clique de "Aplicar filtros"), controlando o skeleton exibido entre o mount e a primeira resposta | Reaproveitar `generating` para os dois casos misturaria a UI do clique manual com a do mount automático (ex.: o texto do spinner do botão "Gerando…" não faz sentido antes do botão existir); separar os dois estados evita esse acoplamento acidental | reaproveitar o mesmo estado `generating` para ambos os gatilhos; usar `isLoading` do `useSWR` (que reflete o `GET` da lista, não o `POST` de geração) | 🟡 |
| D-07 | Botão "Gerar relatório" (RF-02) é removido por completo do JSX, não escondido condicionalmente | É consequência direta de D-01 (trigger automático substitui o clique como forma de gerar o relatório default); manter o botão escondido só adicionaria estado morto sem uso, já que "Aplicar filtros" (D-03) assume o papel de disparo manual quando há mudança de filtro | esconder o botão condicionalmente em vez de remover o JSX; manter o botão como "regenerar" ao lado do novo fluxo | 🟢 |
| D-08 | Botão "Tentar novamente" (RN-06/RF-08) só é renderizado quando `reports.length === 0` **e** o erro capturado não é 403 — checado via `err instanceof GenerateError && err.status === 403` no catch de `handleGenerate` (ver D-09 para a origem de `GenerateError`); em caso de 403 (auditor/plano suspenso) sem relatório algum, exibe só a mensagem de bloqueio, sem botão | Diferenciar por `status` tipado evita duplicar lógica de detecção de causa e não depende de parsear texto de mensagem | parsear a string da mensagem de erro (`message.includes("403")`) em vez de um erro tipado — frágil, acopla a decisão ao texto que pode mudar; criar uma máquina de estados de erro dedicada (`errorType: "transient" \| "forbidden"`) — complexidade desnecessária pra 1 bit de informação | 🟢 |
| D-09 | Refatorar o `throw` dentro do bloco `if (!res.ok)` de `handleGenerate` (`page.tsx:127-130` atual) para lançar `new GenerateError(msg, res.status)` — uma subclasse de `Error` com campo `status: number` — no lugar de `new Error(msg)`, preservando o status HTTP até o catch externo | Pré-requisito técnico para D-08: hoje o catch de `handleGenerate` (`page.tsx:133-136`) só recebe `err.message` (string), sem o status HTTP original — não há como distinguir 403 de outras falhas de forma confiável sem essa refatoração | parsear `err.message` por regex/substring pra extrair o código; manter um estado `lastErrorStatus` separado, atualizado manualmente a cada fetch, fora do fluxo de exceção | 🟢 |

## 4. Premissas

Nenhuma — todas as dúvidas da versão inicial do `requirements.md` foram resolvidas na sessão de esclarecimentos (ver seção 9 do `requirements.md`).

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Página `/app/relatorios` | `_reversa_sdd/code-analysis.md#10. reports` (via `_reversa_sdd/addenda/004-relatorios-analiticos-pdf-nr1.md`, seção "Páginas React") | regra-alterada | Troca gatilho de geração de "clique manual obrigatório" para "automático no mount + botão condicional só quando filtro diverge" |
| `POST /api/reports/generate` | `_reversa_sdd/code-analysis.md#10. reports` | regra-alterada (sem mudança de contrato) | Passa a ser chamado também automaticamente pelo client no mount, além do clique; nenhuma mudança no Route Handler em si |
| `GET /api/reports/generate` | `_reversa_sdd/code-analysis.md#10. reports` | regra-alterada (sem mudança de contrato) | Passa a ser usado também para decidir se reaproveita relatório recente (comparação de `gerado_em` no client), além de listar |

## 6. Delta no modelo de dados

- Resumo das mudanças: nenhum campo novo em `Report`/Firestore. Toda a lógica de "últimas 24h" e "filtros default" é derivada no client a partir de campos já existentes (`gerado_em`, `periodo`, `tipo`). Nenhuma migração.
- Detalhe completo em: `_reversa_forward/005-relatorios-auto-geracao/data-delta.md`

## 7. Delta de contratos externos

Nenhum contrato HTTP/fila/gRPC novo ou alterado — `POST`/`GET /api/reports/generate` mantêm request/response idênticos aos hoje documentados em `_reversa_sdd/code-analysis.md#10. reports`. Pasta `interfaces/` omitida.

## 8. Plano de migração

n/a — mudança é puramente de comportamento client-side, sem dado em repouso a migrar.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Geração automática dispara em loop (efeito sem guarda correta em re-render/StrictMode) | alto — custo de API Claude por chamada duplicada + ruído em `audit_logs` | médio | `useRef` de "já disparado" nesta montagem + teste específico de regressão (RF-04, cenário Gherkin "Re-render não duplica") |
| Comparação de "últimas 24h" usa `Date` do client, sujeito a fuso/relógio desalinhado do navegador | médio — reaproveita ou gera relatório fora da janela pretendida | baixo | Comparar sempre contra `gerado_em` (ISO, gerado no server) e `Date.now()` local; documentar que é aproximação aceitável, não trava crítica |
| Fallback silencioso (RF-07) mascara falha real de configuração (ex.: `ANTHROPIC_API_KEY` ausente) atrás de um "aviso discreto" que o usuário ignora | médio | baixo | Aviso discreto ainda é visível na tela (não é log silencioso); falha continua auditável via `logAudit`/console.error existente em `reports/generate/route.ts` |
| Auditor (role bloqueada) ou org suspensa/cancelada vê tela de erro no lugar do relatório, já que o trigger automático também recebe 403 nesses dois casos | baixo | médio | RF-06 já cobre ambos os casos: mesmo tratamento de erro que o botão manual tinha, sem tela quebrada — comportamento preservado, não é regressão nova (ver `requirements.md#RN-04`) |
| Org nova (zero relatórios) tem a primeira geração automática falhando por erro transitório e fica sem nenhuma forma de tentar de novo, já que RF-02 removeu o único botão manual | alto — usuário travado sem relatório algum, sem ação disponível | baixo | Botão "Tentar novamente" (D-08/RN-06/RF-08), condicionado a `reports.length === 0` e erro não-403 |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-07-23 | Correção pós-`/reversa-audit`: D-06 adicionado (decisão de loading, finding A001, HIGH); D-05 estendido para plano suspenso/cancelado (finding A002, HIGH); D-04 corrigido para citar `requirements.md#RF-07` em vez de `data-delta.md` (finding A005, MEDIUM) | reversa |
| 2026-07-23 | Segunda correção pós-`/reversa-audit` (finding A001 da 2ª rodada, HIGH): D-08 adicionado (botão "Tentar novamente" para zero-relatórios + falha transitória, RN-06/RF-08); risco correspondente adicionado à seção 9 | reversa |
| 2026-07-23 | Terceira correção pós-`/reversa-audit` (finding A001 da 3ª rodada, HIGH): D-08 corrigido para checar `err instanceof GenerateError` em vez de `res.status` (inacessível no catch); D-09 adicionado como pré-requisito técnico (refatorar `handleGenerate` para lançar erro tipado com `status`) | reversa |
