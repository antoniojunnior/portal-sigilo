/**
 * Testa mapInsightItemsToInsightResponse — mapeamento sem duplicação (RF-01).
 *
 * A função converte items: string[] (3 insights da IA) em:
 *   { summary, description, recommendations }
 * Onde description e recommendations NUNCA compartilham o mesmo texto.
 *
 * Execute com: npx ts-node scripts/test-insights-mapping.ts
 */

import assert from "node:assert";

function mapInsightItemsToInsightResponse(items: string[]): {
  summary: string;
  description: string;
  recommendations: string[];
} {
  if (items.length === 0) {
    return { summary: "", description: "", recommendations: [] };
  }
  const summary = items[0] ?? "";
  const description = items.length >= 2 ? items[1] : "";
  const recommendations = items.length >= 2 ? items.slice(2) : [];
  return { summary, description, recommendations };
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}`);
    throw err;
  }
}

console.log("\n🧪 Testes: mapInsightItemsToInsightResponse\n");

test("3 itens: description não aparece em recommendations", () => {
  const items = ["Insight A", "Insight B", "Insight C"];
  const result = mapInsightItemsToInsightResponse(items);
  assert.strictEqual(result.summary, "Insight A");
  assert.strictEqual(result.description, "Insight B");
  assert.deepStrictEqual(result.recommendations, ["Insight C"]);
  assert.strictEqual(result.recommendations.includes(result.description), false);
});

test("2 itens: description usa items[1], recommendations vazio", () => {
  const items = ["Insight X", "Insight Y"];
  const result = mapInsightItemsToInsightResponse(items);
  assert.strictEqual(result.summary, "Insight X");
  assert.strictEqual(result.description, "Insight Y");
  assert.deepStrictEqual(result.recommendations, []);
});

test("1 item: só summary, description e recommendations vazios", () => {
  const items = ["Apenas um insight"];
  const result = mapInsightItemsToInsightResponse(items);
  assert.strictEqual(result.summary, "Apenas um insight");
  assert.strictEqual(result.description, "");
  assert.deepStrictEqual(result.recommendations, []);
});

test("array vazio: todos os campos vazios", () => {
  const result = mapInsightItemsToInsightResponse([]);
  assert.strictEqual(result.summary, "");
  assert.strictEqual(result.description, "");
  assert.deepStrictEqual(result.recommendations, []);
});

console.log("\n✅ Todos os testes de mapeamento passaram!\n");
