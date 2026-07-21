# Reports, Tarefas de Implementação

## Pré-requisitos
- [ ] `ANTHROPIC_API_KEY` configurada
- [ ] `pdf-lib` disponível
- [ ] Coleção `cases` populada com `triagem_ia`/`categoria`/`status` consistentes

## Tarefas

- [ ] T-01, Implementar agregação de métricas do período
  - Origem no legado: `src/app/api/reports/generate/route.ts:56-97`
  - Critério de pronto: totais, top-5 categorias/leis, prazo médio batem com cálculo manual
  - Confiança: 🟢

- [ ] T-02, Implementar `POST /api/reports/generate` com gates de role/plano
  - Origem no legado: `src/app/api/reports/generate/route.ts:19-157`
  - Critério de pronto: auditor e plano suspenso/cancelado bloqueados; personalizado exige plano≥gestão
  - Confiança: 🟢

- [ ] T-03, Implementar `GET /api/reports/generate` (listagem) e `GET /api/reports/[reportId]` (detalhe)
  - Origem no legado: `src/app/api/reports/generate/route.ts:160-190`, `src/app/api/reports/[reportId]/route.ts`
  - Critério de pronto: listagem últimos 50 desc; detalhe valida org_id
  - Confiança: 🟢

- [ ] T-04, Implementar máquina de estados `POST/DELETE /api/reports/[reportId]/approve`
  - Origem no legado: `src/app/api/reports/[reportId]/approve/route.ts`
  - Critério de pronto: aprovar já aprovado/exportado retorna 409; reverter exige admin
  - Confiança: 🟢

- [ ] T-05, Implementar `GET /api/reports/[reportId]/export` (geração de PDF)
  - Origem no legado: `src/app/api/reports/[reportId]/export/route.ts`
  - Critério de pronto: só permite export com status=aprovado; PDF paginado corretamente; status muda para exportado
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste do happy path completo: generate → approve → export
- [ ] TT-02, Teste de bloqueio de auditor em cada uma das 3 operações de escrita
- [ ] TT-03, Teste de idempotência de approve (409 em estado já aprovado/exportado)
- [ ] TT-04, Teste de export bloqueado em status != aprovado (409)
- [ ] TT-05, Teste de tipo personalizado bloqueado para plano entrada

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. T-01 antes de T-02 (agregação é usada pela geração)
2. T-02 → T-04 → T-05 (segue a máquina de estados)
3. T-03 pode ser feita em paralelo a qualquer momento após T-02

## Lacunas Pendentes (🔴)
- Confirmar se tipo `"esg"` (declarado no schema) deve ganhar rota própria ou se é escopo futuro (Enterprise)
