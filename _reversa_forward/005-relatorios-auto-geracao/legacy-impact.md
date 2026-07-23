# Legacy Impact: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Cenário: **legado** — ancorado em `_reversa_sdd/architecture.md` + `_reversa_sdd/domain.md`

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/lib/reports/report-filters.ts` | `src/lib/*` (utilitários) | componente-novo | MEDIUM | Módulo de funções puras para filtros default, comparação e janela de reaproveitamento. Extraído do `page.tsx` para reuso e testabilidade |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | Páginas React (App Router) | regra-alterada | HIGH | Troca o gatilho de geração de "clique manual obrigatório" para "automático no mount + botão condicional só quando filtro diverge". Remove botão "Gerar relatório" existente |
| `scripts/test-reports-auto-generate.ts` | Scripts de teste | componente-novo | LOW | Testes unitários das funções puras de `report-filters.ts`, seguindo o padrão dos scripts `test-reports-*.ts` existentes |

## Diff conceitual por componente

### `src/lib/reports/report-filters.ts` (novo)

Módulo extraído do `page.tsx` com três funções puras:
- `getDefaultFilters()` — retorna filtros default (mês corrente, tipo "padrao", sem departamento/categoria)
- `filtersEqual(a, b)` — comparação rasa com ordenação de arrays para detectar divergência entre filtros correntes e aplicados
- `isReportWithinHours(report, hours, expectedFilters)` — decide se um relatório existente é reaproveitável (dentro da janela de N horas e com filtros compatíveis)

Nenhuma dependência externa além de `Date`. Testável sem Firebase.

### `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` (alterado)

**Estados novos adicionados:**
- `filtrosAplicados` — snapshot congelado dos filtros do último relatório gerado/exibido
- `autoGenerating` — controla skeleton entre mount e primeira resposta da geração automática (distinto de `generating`)
- `autoGenerateWarning` — banner de aviso discreto quando a geração automática falha mas existe relatório anterior
- `lastErrorStatus` — armazena o status HTTP do último erro para distinguir 403 de falhas transitórias
- `GenerateError` — subclasse de `Error` com campo `status: number` (substitui `new Error()` no catch de `handleGenerate`)

**Fluxos alterados:**
1. **Mount:** `useEffect` com guarda `useRef` decide entre reaproveitar relatório default recente (`isReportWithinHours`) ou disparar `handleGenerate()` uma única vez
2. **Botão removido:** "Gerar relatório" (linhas 159-176 originais) deixa de existir
3. **Botão novo:** "Aplicar filtros" aparece condicionalmente no bloco de filtros expandido, apenas quando `filtrosAlterados` (derivado de `!filtersEqual(currentFilters, filtrosAplicados)`)
4. **Fallback de erro:** erro da geração automática não sobrescreve `data.reports`; exibe `autoGenerateWarning` (aviso discreto) quando há relatórios anteriores, ou botão "Tentar novamente" quando não há nenhum e o erro não é 403
5. **Empty state:** atualizado para refletir o novo fluxo automático — remove menção ao botão "Gerar relatório" inexistente

### `scripts/test-reports-auto-generate.ts` (novo)

13 testes unitários cobrindo:
- `filtersEqual`: identidade, diferença de período/tipo/depts/cats, ordenação independente de arrays, default vs customizado
- `isReportWithinHours`: relatório recente, `gerado_em` null, relatório antigo, tipo divergente, período divergente
- `getDefaultFilters`: validação estrutural do retorno

## Preservadas

Regras 🟢 do `_reversa_sdd/domain.md` que continuam intactas:

| Regra | Onde | Status após feature |
|---|---|---|
| Anonimato do denunciante é a regra fundadora (S2) | `domain.md#anonimato` | 🟢 — reports continuam agregando sem expor texto individual, a feature não toca em `cases`/`messages` |
| Isolamento multi-tenant aplicado em duas camadas redundantes (S3) | `domain.md#isolamento` | 🟢 — `org_id` continua sendo filtrado em `GET` e `POST /api/reports/generate`, ambos inalterados no servidor |
| Planos são gates de feature aplicados no servidor, nunca só no client | `domain.md#planos` | 🟢 — RN-04 explicitamente preserva bloqueio de `auditor`, `suspenso` e `cancelado` no Route Handler; client não replica checagem |
| Bloqueio de mencionados (S5) | `domain.md#mencionados` | 🟢 — feature não mexe em `cases` nem em nenhuma rota de dashboard que lista/detalha casos |
| Auditoria (S6) — `audit_logs` imutáveis | `domain.md#auditoria` | 🟢 — T011 confirmou que `logAudit`/`report_generated` já registra gerações automáticas sem distinção de origem |

## Modificadas

Regras 🟢 do `_reversa_sdd/domain.md` que foram alteradas ou removidas:

| Regra original | Mudança | Nova semântica |
|---|---|---|
| Relatório é gerado exclusivamente por clique manual do gestor em "Gerar relatório" | regra-alterada | Relatório default é gerado automaticamente no mount (acesso à rota); clique manual permanece via "Aplicar filtros" apenas quando filtros divergem |
| Botão "Gerar relatório" no topo da página | regra-removida | Botão substituído pelo fluxo automático + botão condicional "Aplicar filtros" |
| Erro de geração exibe banner vermelho bloqueante com `generateError` | regra-alterada | Falha com relatórios existentes → aviso discreto (`autoGenerateWarning`); falha sem relatórios → mensagem + botão "Tentar novamente" (exceto 403); falha manual (Aplicar filtros) → banner vermelho mantido |
| `handleGenerate` lança `new Error(msg)` no catch de `!res.ok` | regra-alterada | Agora lança `new GenerateError(msg, res.status)`, preservando o status HTTP para decisão client-side (D-09) |
