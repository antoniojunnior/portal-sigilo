# BUG-20260722-CAT1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: 6 sites liam `triagem_ia?.categoria` (campo inexistente) em vez de `triagem_ia?.categoria_legal`. O tipo compartilhado `TriagemIA` também declarava o campo errado.

Correção (commits eeda528/36a9afe, 2026-07-22):
- `triagem.ts`: centralizado `getCategoriaLegal(caseData)`
- 3 sites em `src/` corrigidos para usar `getCategoriaLegal`
- 2 sites em `functions/` corrigidos inline
- `TriagemIA.categoria` → `categoria_legal` no tipo compartilhado
- Testes de regressão em `scripts/test-reports-categoria.ts`

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
