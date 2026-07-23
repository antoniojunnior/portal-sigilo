/**
 * Testa getCategoriaLegal — correção de BUG-20260722-CAT1 (T001, T002).
 *
 * Execute com: npx ts-node scripts/test-reports-categoria.ts
 */

import assert from "node:assert";

function getCategoriaLegal(caseData: Record<string, unknown>): string {
  const triagemIa = caseData.triagem_ia as Record<string, unknown> | undefined;
  return (triagemIa?.categoria_legal as string | undefined)
    ?? (caseData.categoria as string | undefined)
    ?? "outro";
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  \u2713 ${name}`); }
  catch (err) { console.log(`  \u2717 ${name}`); throw err; }
}

console.log("\n\ud83e\uddea Testes: getCategoriaLegal\n");

test("com categoria_legal presente retorna categoria_legal", () => {
  const result = getCategoriaLegal({ triagem_ia: { categoria_legal: "assedio_moral" }, categoria: "assédio" });
  assert.strictEqual(result, "assedio_moral");
});

test("sem triagem_ia, fallback para c.categoria", () => {
  const result = getCategoriaLegal({ categoria: "fraude" });
  assert.strictEqual(result, "fraude");
});

test("com triagem_ia mas sem categoria_legal, fallback para c.categoria", () => {
  const result = getCategoriaLegal({ triagem_ia: { urgencia: 3 }, categoria: "discriminacao" });
  assert.strictEqual(result, "discriminacao");
});

test("sem triagem_ia e sem categoria, fallback para 'outro'", () => {
  const result = getCategoriaLegal({ status: "aguardando_triagem" });
  assert.strictEqual(result, "outro");
});

console.log("\n\u2705 Todos os testes de getCategoriaLegal passaram!\n");
