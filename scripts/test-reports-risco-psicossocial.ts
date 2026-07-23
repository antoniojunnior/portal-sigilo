/**
 * Testa agregação de risco_psicossocial — seção NR-1 (T004).
 *
 * Execute com: npx ts-node scripts/test-reports-risco-psicossocial.ts
 */

import assert from "node:assert";

interface RiscoPsicossocialMetricas {
  total: number;
  por_subcategoria: Record<string, number>;
}

function aggregateRiscoPsicossocial(cases: Record<string, unknown>[]): RiscoPsicossocialMetricas {
  const result: RiscoPsicossocialMetricas = { total: 0, por_subcategoria: {} };

  for (const c of cases) {
    const triagem = c.triagem_ia as Record<string, unknown> | undefined;
    const categoriaLegal = (triagem?.categoria_legal as string | undefined) ?? (c.categoria as string | undefined) ?? "outro";
    const leisAplicaveis = (triagem?.lei_aplicavel as string[] | undefined) ?? [];

    const isRiscoPsico = categoriaLegal === "risco_psicossocial" || leisAplicaveis.includes("nr1");
    if (!isRiscoPsico) continue;

    result.total++;
    const subcategoria = (triagem?.subcategoria as string | undefined) ?? "Não especificado";
    result.por_subcategoria[subcategoria] = (result.por_subcategoria[subcategoria] ?? 0) + 1;
  }

  return result;
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  \u2713 ${name}`); }
  catch (err) { console.log(`  \u2717 ${name}`); throw err; }
}

function makeCase(catLegal: string, leis?: string[], sub?: string): Record<string, unknown> {
  return { triagem_ia: { categoria_legal: catLegal, lei_aplicavel: leis ?? [], subcategoria: sub ?? null } };
}

console.log("\n\ud83e\uddea Testes: aggregateRiscoPsicossocial (NR-1)\n");

test("com caso de risco_psicossocial, total=1 e conta subcategoria", () => {
  const cases = [makeCase("risco_psicossocial", [], "assedio_moral")];
  const result = aggregateRiscoPsicossocial(cases);
  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.por_subcategoria["assedio_moral"], 1);
});

test("com caso com lei nr1, conta mesmo sem categoria_legal=risco_psicossocial", () => {
  const cases = [makeCase("assedio_moral", ["nr1", "lei_14457"])];
  const result = aggregateRiscoPsicossocial(cases);
  assert.strictEqual(result.total, 1);
});

test("sem casos de risco psicossocial, retorna total=0", () => {
  const cases = [makeCase("fraude"), makeCase("discriminacao")];
  const result = aggregateRiscoPsicossocial(cases);
  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(result.por_subcategoria, {});
});

test("array vazio retorna total=0", () => {
  const result = aggregateRiscoPsicossocial([]);
  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(result.por_subcategoria, {});
});

test("3 casos risco_psicossocial com subcategorias diferentes — 3 total, 3 subcategorias", () => {
  const cases = [
    makeCase("risco_psicossocial", [], "assedio_moral"),
    makeCase("risco_psicossocial", [], "sobrecarga"),
    makeCase("risco_psicossocial", [], "assedio_moral"),
  ];
  const result = aggregateRiscoPsicossocial(cases);
  assert.strictEqual(result.total, 3);
  assert.strictEqual(result.por_subcategoria["assedio_moral"], 2);
  assert.strictEqual(result.por_subcategoria["sobrecarga"], 1);
});

console.log("\n\u2705 Todos os testes de NR-1 passaram!\n");
