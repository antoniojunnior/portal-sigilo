# BUG-20260723-PSU1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: `route.ts` POST retornava `error: "plan_suspended"` (código de máquina). `page.tsx` usava `err.error` diretamente como mensagem, sem tradução.

Correção:
- `src/lib/reports/error-messages.ts`: módulo `translateGenerateErrorMessage` com mapeamento de códigos para texto
- `page.tsx` handleGenerate: `translateGenerateErrorMessage(rawMsg)` antes de lançar `GenerateError`
- Testes em `scripts/test-reports-error-messages.ts`

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
