/**
 * Testa report-filters.ts — funcoes puras da feature 005 (T002).
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-reports-auto-generate.ts
 */

import assert from "node:assert";

interface ReportFilters {
  periodoInicio: string;
  periodoFim: string;
  tipo: "padrao" | "analitico";
  selectedDepts: string[];
  selectedCats: string[];
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function filtersEqual(a: ReportFilters, b: ReportFilters): boolean {
  return (
    a.periodoInicio === b.periodoInicio &&
    a.periodoFim === b.periodoFim &&
    a.tipo === b.tipo &&
    arraysEqual(a.selectedDepts, b.selectedDepts) &&
    arraysEqual(a.selectedCats, b.selectedCats)
  );
}

function isReportWithinHours(
  report: {
    gerado_em: string | null;
    periodo: { inicio: string | null; fim: string | null };
    tipo: string;
    departamentos?: string[];
    categorias?: string[];
  },
  hours: number,
  expectedFilters: ReportFilters
): boolean {
  if (!report.gerado_em) return false;

  const geradoEm = new Date(report.gerado_em);
  const now = Date.now();
  const diffMs = now - geradoEm.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours > hours) return false;

  const reportPeriodoInicio = report.periodo.inicio
    ? new Date(report.periodo.inicio).toISOString().split("T")[0]
    : null;
  const reportPeriodoFim = report.periodo.fim
    ? new Date(report.periodo.fim).toISOString().split("T")[0]
    : null;

  // BUG-20260723-SCP1: um relatório com departamento/categoria aplicados não é
  // "o relatório default" mesmo com tipo/período iguais — precisa ter o mesmo escopo.
  const reportDepts = report.departamentos ?? [];
  const reportCats = report.categorias ?? [];

  return (
    report.tipo === expectedFilters.tipo &&
    reportPeriodoInicio === expectedFilters.periodoInicio &&
    reportPeriodoFim === expectedFilters.periodoFim &&
    arraysEqual(reportDepts, expectedFilters.selectedDepts) &&
    arraysEqual(reportCats, expectedFilters.selectedCats)
  );
}

function getDefaultFilters(): ReportFilters {
  return {
    periodoInicio: "2026-07-01",
    periodoFim: "2026-07-31",
    tipo: "padrao",
    selectedDepts: [],
    selectedCats: [],
  };
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  \u2713 ${name}`); }
  catch (err) { console.log(`  \u2717 ${name}`); throw err; }
}

console.log("\n\ud83e\uddea Testes: report-filters\n");

console.log("  filtersEqual");

test("filtros identicos sao iguais", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: [] };
  const b: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: [] };
  assert.strictEqual(filtersEqual(a, b), true);
});

test("periodo diferente retorna false", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: [] };
  const b: ReportFilters = { periodoInicio: "2026-06-01", periodoFim: "2026-06-30", tipo: "padrao", selectedDepts: [], selectedCats: [] };
  assert.strictEqual(filtersEqual(a, b), false);
});

test("tipo diferente retorna false", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: [] };
  const b: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "analitico", selectedDepts: [], selectedCats: [] };
  assert.strictEqual(filtersEqual(a, b), false);
});

test("departamentos em ordem diferente ainda sao iguais", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: ["RH", "TI"], selectedCats: [] };
  const b: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: ["TI", "RH"], selectedCats: [] };
  assert.strictEqual(filtersEqual(a, b), true);
});

test("departamentos diferentes retorna false", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: ["RH"], selectedCats: [] };
  const b: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: ["TI"], selectedCats: [] };
  assert.strictEqual(filtersEqual(a, b), false);
});

test("categorias diferentes retorna false", () => {
  const a: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: ["fraude"] };
  const b: ReportFilters = { periodoInicio: "2026-07-01", periodoFim: "2026-07-31", tipo: "padrao", selectedDepts: [], selectedCats: ["assedio_moral"] };
  assert.strictEqual(filtersEqual(a, b), false);
});

test("default vs customizado retorna false", () => {
  const a = getDefaultFilters();
  const b: ReportFilters = { ...getDefaultFilters(), tipo: "analitico" };
  assert.strictEqual(filtersEqual(a, b), false);
});

console.log("\n  isReportWithinHours");

const filters: ReportFilters = getDefaultFilters();

test("relatorio gerado agora esta dentro da janela de 24h", () => {
  const now = new Date().toISOString();
  const report = { gerado_em: now, periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" }, tipo: "padrao" };
  assert.strictEqual(isReportWithinHours(report, 24, filters), true);
});

test("relatorio com gerado_em null retorna false", () => {
  const report = { gerado_em: null, periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" }, tipo: "padrao" };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("relatorio muito antigo retorna false (48h atras, janela 24h)", () => {
  const doisDiasAtras = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const report = { gerado_em: doisDiasAtras, periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" }, tipo: "padrao" };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("relatorio na janela mas de tipo diferente retorna false", () => {
  const now = new Date().toISOString();
  const report = { gerado_em: now, periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" }, tipo: "personalizado" };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("relatorio na janela mas periodo diferente retorna false", () => {
  const now = new Date().toISOString();
  const report = { gerado_em: now, periodo: { inicio: "2026-06-01T00:00:00.000Z", fim: "2026-06-30T00:00:00.000Z" }, tipo: "padrao" };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("BUG-20260723-SCP1 (reproducao): relatorio com departamento aplicado NAO deve casar com filtros default, mesmo com tipo/periodo iguais", () => {
  const now = new Date().toISOString();
  const report = {
    gerado_em: now,
    periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" },
    tipo: "padrao",
    departamentos: ["TI"],
    categorias: [] as string[],
  };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("BUG-20260723-SCP1 (reproducao): relatorio com categoria aplicada NAO deve casar com filtros default, mesmo com tipo/periodo iguais", () => {
  const now = new Date().toISOString();
  const report = {
    gerado_em: now,
    periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" },
    tipo: "padrao",
    departamentos: [] as string[],
    categorias: ["fraude"],
  };
  assert.strictEqual(isReportWithinHours(report, 24, filters), false);
});

test("relatorio sem departamento/categoria (filtros default de fato) ainda casa normalmente", () => {
  const now = new Date().toISOString();
  const report = {
    gerado_em: now,
    periodo: { inicio: "2026-07-01T00:00:00.000Z", fim: "2026-07-31T00:00:00.000Z" },
    tipo: "padrao",
    departamentos: [] as string[],
    categorias: [] as string[],
  };
  assert.strictEqual(isReportWithinHours(report, 24, filters), true);
});

test("getDefaultFilters retorna mes corrente e tipo padrao", () => {
  const f = getDefaultFilters();
  assert.strictEqual(f.tipo, "padrao");
  assert.strictEqual(f.selectedDepts.length, 0);
  assert.strictEqual(f.selectedCats.length, 0);
  assert.ok(f.periodoInicio.endsWith("-01"));
  assert.ok(f.periodoFim.length === 10);
});

console.log("\n\u2705 Todos os testes de report-filters passaram!\n");
