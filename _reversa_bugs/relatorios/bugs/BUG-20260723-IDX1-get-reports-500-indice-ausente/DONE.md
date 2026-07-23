# BUG-20260723-IDX1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: firestore.indexes.json foi deployado sem o índice composto `reports(org_id ASC, gerado_em DESC)`, removendo-o de produção. O GET handler não tinha try/catch, resultando em 500 cru.

Correção:
- `firestore.indexes.json`: adicionado índice `reports(org_id ASC, gerado_em DESC)` (commit 73241bb)
- `cases(org_id ASC, created_at ASC)` adicionado para query de range duplo no POST (commit 82f130b)
- `route.ts` GET com try/catch + console.error (commit 73241bb)
- `route.ts` POST com double try/catch (commit 0267da1)
- `dedup.ts` runTransaction removido, substituído por write sequencial (commit 4239b75)

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
