/**
 * Testa buildTabelaAnalitica — agregação departamento x categoria_legal x mês (T003).
 *
 * Execute com: npx ts-node scripts/test-reports-tabela-analitica.ts
 */

import assert from "node:assert";

interface LinhaTabela {
  departamento: string;
  categoria_legal: string;
  mes: string;
  total: number;
}

function getCategoriaLegal(c: Record<string, unknown>): string {
  const triagem = c.triagem_ia as Record<string, unknown> | undefined;
  return (triagem?.categoria_legal as string | undefined) ?? (c.categoria as string | undefined) ?? "outro";
}

function buildTabelaAnalitica(cases: Record<string, unknown>[]): LinhaTabela[] {
  const mapa: Record<string, LinhaTabela> = {};

  for (const c of cases) {
    const departamento = (c.triagem_ia as Record<string, unknown> | undefined)?.area_risco as string | undefined
      ?? (c.departamento as string | undefined)
      ?? "Não informado";
    const categoriaLegal = getCategoriaLegal(c);
    const createdAt = (c.created_at as { toDate?: () => Date } | undefined)?.toDate?.();
    const mes = createdAt
      ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`
      : "desconhecido";

    const key = `${departamento}|${categoriaLegal}|${mes}`;
    if (!mapa[key]) {
      mapa[key] = { departamento, categoria_legal: categoriaLegal, mes, total: 0 };
    }
    mapa[key].total++;
  }

  return Object.values(mapa).sort((a, b) =>
    a.departamento.localeCompare(b.departamento) ||
    a.categoria_legal.localeCompare(b.categoria_legal) ||
    a.mes.localeCompare(b.mes)
  );
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  \u2713 ${name}`); }
  catch (err) { console.log(`  \u2717 ${name}`); throw err; }
}

function makeCase(depto: string, catLegal: string, year: number, month: number): Record<string, unknown> {
  return {
    triagem_ia: { area_risco: depto, categoria_legal: catLegal },
    created_at: { toDate: () => new Date(year, month - 1, 15) },
  };
}

console.log("\n\ud83e\uddea Testes: buildTabelaAnalitica\n");

test("caso vazio retorna tabela vazia", () => {
  const result = buildTabelaAnalitica([]);
  assert.deepStrictEqual(result, []);
});

test("2 casos mesmo depto x cat x mes — agrega em 1 linha com total=2", () => {
  const cases = [
    makeCase("RH", "assedio_moral", 2026, 7),
    makeCase("RH", "assedio_moral", 2026, 7),
  ];
  const result = buildTabelaAnalitica(cases);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].total, 2);
  assert.strictEqual(result[0].departamento, "RH");
  assert.strictEqual(result[0].categoria_legal, "assedio_moral");
  assert.strictEqual(result[0].mes, "2026-07");
});

test("3 casos em deptos/cats/meses diferentes gera 3 linhas", () => {
  const cases = [
    makeCase("RH", "assedio_moral", 2026, 7),
    makeCase("TI", "fraude", 2026, 6),
    makeCase("RH", "discriminacao", 2026, 7),
  ];
  const result = buildTabelaAnalitica(cases);
  assert.strictEqual(result.length, 3);
});

test("caso sem triagem_ia usa fallback de categoria", () => {
  const cases = [
    { departamento: "Financeiro", categoria: "fraude", created_at: { toDate: () => new Date(2026, 6, 1) } },
  ];
  const result = buildTabelaAnalitica(cases);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].categoria_legal, "fraude");
  assert.strictEqual(result[0].departamento, "Financeiro");
});

console.log("\n\u2705 Todos os testes de buildTabelaAnalitica passaram!\n");
