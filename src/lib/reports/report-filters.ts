export interface ReportFilters {
  periodoInicio: string;
  periodoFim: string;
  tipo: "padrao" | "analitico";
  selectedDepts: string[];
  selectedCats: string[];
}

function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function getMonthEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

export function getDefaultFilters(): ReportFilters {
  return {
    periodoInicio: getMonthStart(),
    periodoFim: getMonthEnd(),
    tipo: "padrao",
    selectedDepts: [],
    selectedCats: [],
  };
}

export function filtersEqual(a: ReportFilters, b: ReportFilters): boolean {
  return (
    a.periodoInicio === b.periodoInicio &&
    a.periodoFim === b.periodoFim &&
    a.tipo === b.tipo &&
    arraysEqual(a.selectedDepts, b.selectedDepts) &&
    arraysEqual(a.selectedCats, b.selectedCats)
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function isReportWithinHours(
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
