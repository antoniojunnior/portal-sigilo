# BUG-20260722-SRC1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: POST /regenerate calculava `source` mas nunca persistia em `orgs.ai_insights`. GET inferia sempre `"ai_generated"`.

Correção (commits 22edd28/b906ca5, 2026-07-22):
- `regenerate/route.ts`: persiste `source` em `orgs.ai_insights`
- `insights/route.ts`: `resolveInsightSource` lê do Firestore
- `mapItems.ts`: função pura testável extraída
- Testes em `scripts/test-insights-bugs.ts`

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
