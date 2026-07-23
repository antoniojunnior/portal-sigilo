# Cross-check: Refinamento dos Insights de IA no Dashboard Administrativo

> Data: 2026-07-22
> Feature: `003-insights-ia-dashboard-admin`
> Artefatos verificados:
> - `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md`
> - `_reversa_forward/003-insights-ia-dashboard-admin/roadmap.md`
> - `_reversa_forward/003-insights-ia-dashboard-admin/actions.md`

## Resumo

| Severidade | Contagem |
|------------|----------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 1 |

Nenhum finding bloqueante. A feature está pronta para produção sob a closure policy `production-service`.

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | LOW | Coerência com o legado | O roadmap §6 declara "Nenhum campo novo em Firestore. `orgs.ai_insights.{items, gerado_em}` continua sendo a única fonte de verdade". Após a correção de BUG-10 (source não persistido), o campo `source` foi adicionado a `orgs.ai_insights`. O roadmap original estava correto no momento do planejamento; a divergência é consequência de um bug fix pós-implementação registrado em `_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-SRC1-source-nao-persistido/bug.md`. | `roadmap.md` §6 vs código corrigido em `regenerate/route.ts:117-119` e `insights/route.ts:29` |

### A001 — Impacto e sugestão

**Impacto:** Mínimo. A frase "Nenhum campo novo em Firestore" era verdadeira na implementação inicial e no momento do planejamento. O campo `source` foi adicionado como correção de bug após a implementação. O adendo da feature (`_reversa_sdd/addenda/003-insights-ia-dashboard-admin.md`) já documenta essa correção na seção "Atualização 2026-07-22". Nenhuma ação corretiva é necessária — o adendo cobre a divergência até a próxima re-extração `/reversa`.

## Itens verificados que passaram

### Cobertura (Requirements → Roadmap)

| RF/RN/RNF | Coberto por | Status |
|-----------|------------|--------|
| RF-01 (Must) — correção de dedupe | D-05 | ✓ |
| RF-02 (Must) — endpoint de regeneração | D-01 | ✓ |
| RF-03 (Must) — rate limit 24h | D-02 | ✓ |
| RF-04 (Should) — indicador de fonte | D-03 | ✓ |
| RF-05 (Must) — CTA com destino real | D-04 | ✓ |
| RF-06 (Could) — filtros em /cases | D-06 | ✓ |
| RN-01 — sem duplicação description/recommendations | D-05 | ✓ |
| RN-02 — regeneração sob demanda | D-01, D-02 | ✓ |
| RN-03 — UI distingue fonte | D-03 | ✓ |
| RN-04 — CTA navega para página nova | D-04 | ✓ |
| RN-05 — nunca aceita items do cliente | D-01 | ✓ |
| RNF Segurança | D-01 | ✓ |
| RNF Custo | D-02 | ✓ |
| RNF Observabilidade | T012 | ✓ |
| RNF Consistência UX | T009 | ✓ |

### Cobertura (Roadmap → Actions)

| Decisão | Ações correspondentes | Status |
|---------|----------------------|--------|
| D-01 (Route Handler para regeneração) | T001, T008 | ✓ |
| D-02 (rate limit via gerado_em) | T004, T006, T008 | ✓ |
| D-03 (source "ai_generated") | T007 | ✓ |
| D-04 (página /app/insights) | T002, T010 | ✓ |
| D-05 (dedupe no GET) | T003, T005, T007 | ✓ |
| D-06 (filtros department/category) | T011 | ✓ |

### Cobertura (Gherkin → Roadmap/Actions)

| Cenário | Coberto por | Status |
|---------|------------|--------|
| Insight sem duplicação de conteúdo | T003, T005, T007 | ✓ |
| Admin distingue insight real de fallback | T007, T009 | ✓ |
| Regeneração manual respeitando rate limit | T004, T006, T008, T013 | ✓ |
| CTA leva a um destino real | T002, T009, T010 | ✓ |

### Consistência terminológica

- "insight"/"insights": consistente nos 3 documentos ✓
- "fallback"/"fallback_heuristic"/"ai_generated": consistente, com D-03 documentando a renomeação ✓
- "regeneração"/"regenerate"/"regeneration": consistente ✓
- "rate limit"/"limite de frequência": consistente ✓
- IDs (RF-01 a RF-06, RN-01 a RN-05, D-01 a D-06): todos referenciados corretamente entre documentos ✓

### Coerência com o legado

- `domain.md#Insight` ("diário, ou sob demanda"): citado como origem de RN-02, respeitado por D-01/D-02 ✓
- `architecture.md#Camadas` (separação Server vs Functions): respeitada por D-01 ✓
- `code-analysis.md#1` (`PUT /api/assistant`): preservado sem alterações no roadmap §5 ✓
- `code-analysis.md#7` (`GET /insights` dual path): fallback preservado, caminho IA refinado ✓
- Nenhuma regra 🟢 do `domain.md` é contradita ✓

### Sanidade do actions

- Todas as 13 dependências apontam para IDs existentes na tabela ✓
- Tarefas `[//]` nunca compartilham arquivo alvo na mesma fase ✓
- Nenhum ciclo de dependência detectado. Cadeia linear T003→T005→T007→T009→T013 com ramos independentes ✓
- 12 de 13 ações paralelizáveis — uso adequado de `[//]` ✓

### Contratos (interfaces/)

- `interfaces/dashboard-insights-get.md` referenciado no roadmap §7 ✓
- `interfaces/dashboard-insights-regenerate.md` referenciado no roadmap §7 ✓

### Bug fixes pós-implementação

- BUG-10 (source não persistido): corrigido, registrado em `_reversa_bugs/insights-ia-dashboard/` ✓
- BUG-11 (TOCTOU rate limit): corrigido, registrado em `_reversa_bugs/insights-ia-dashboard/` ✓
- Ambas correções documentadas no adendo `_reversa_sdd/addenda/003-insights-ia-dashboard-admin.md` ✓

## Verdict

Feature `003-insights-ia-dashboard-admin` aprovada no cross-check. Nenhum finding CRITICAL, HIGH ou MEDIUM. O único finding (A001, LOW) é cosmético e já coberto pelo adendo pós-bugfix.
