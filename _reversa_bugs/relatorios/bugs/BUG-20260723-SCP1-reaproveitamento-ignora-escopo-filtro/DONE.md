# BUG-20260723-SCP1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: `isReportWithinHours` não comparava departamentos/categorias do relatório com os filtros esperados. `GET /api/reports/generate` não expunha os campos `departamentos`/`categorias`.

Correção:
- `route.ts` GET: expõe `departamentos`/`categorias` no ReportSummary (BUG-20260723-SCP1)
- `report-filters.ts`: `isReportWithinHours` compara `departamentos`/`categorias` via `arraysEqual`
- `page.tsx`: ReportSummary ganha campos opcionais `departamentos`/`categorias`
- `scripts/test-reports-auto-generate.ts`: testes de reprodução + regressão

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
