# BUG-20260723-DUP1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: POST /api/reports/generate criava documento incondicionalmente. Sem dedup no servidor, acessos concorrentes geravam relatórios duplicados.

Correção:
- `src/lib/reports/dedup.ts`: `buildReportDedupKey`, `findRecentDuplicateReport`, `reserveReportSlot`
- `route.ts` POST: pré-check antes do Claude + `reserveReportSlot` no write final
- `firestore.indexes.json`: índice composto `(org_id, dedup_key, gerado_em)`
- `runTransaction` substituído por write sequencial (commit 4239b75) para compatibilidade Vercel
- Testes em `scripts/test-reports-dedup.ts`

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
