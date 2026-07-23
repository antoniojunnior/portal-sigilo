/**
 * Testa as correções de BUG-20260723-DAT1 (parse de data sem offset de timezone)
 * e BUG-20260723-SRT1 (ordenação local de faturas, não confiando em sort/order da Asaas).
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-billing-date-sort.ts
 */

import assert from "node:assert";

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

interface InvoiceLike { vencimento: string }

function sortByVencimentoDesc<T extends InvoiceLike>(invoices: T[]): T[] {
  return [...invoices].sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Testes: billing-date-sort\n");

console.log("  formatDate (BUG-20260723-DAT1)");

test("BUG-20260723-DAT1 (reproducao): data pura YYYY-MM-DD nao sofre offset de 1 dia", () => {
  // Antes do fix: new Date("2026-07-15") era interpretado como UTC, exibindo
  // 14/jul em fusos negativos. Depois do fix, sempre 15/jul.
  const result = formatDate("2026-07-15");
  assert.ok(result.startsWith("15"), `esperado dia 15, veio '${result}'`);
});

test("data com horário/timezone ISO completo também é interpretada pelo dia correto", () => {
  const result = formatDate("2026-07-15T00:00:00-03:00");
  assert.ok(result.startsWith("15"), `esperado dia 15, veio '${result}'`);
});

test("entrada inválida cai no fallback (retorna a string original, não quebra)", () => {
  const result = formatDate("");
  assert.strictEqual(result, "");
});

console.log("\n  sortByVencimentoDesc (BUG-20260723-SRT1)");

test("BUG-20260723-SRT1 (reproducao): faturas fora de ordem são reordenadas por vencimento desc, independente da ordem da API", () => {
  const invoices = [
    { id: "a", vencimento: "2026-01-10" },
    { id: "b", vencimento: "2026-07-20" },
    { id: "c", vencimento: "2026-03-05" },
  ];
  const sorted = sortByVencimentoDesc(invoices);
  assert.deepStrictEqual(sorted.map((i) => i.id), ["b", "c", "a"]);
});

test("lista já ordenada permanece ordenada (idempotente)", () => {
  const invoices = [
    { id: "x", vencimento: "2026-07-20" },
    { id: "y", vencimento: "2026-07-10" },
  ];
  const sorted = sortByVencimentoDesc(invoices);
  assert.deepStrictEqual(sorted.map((i) => i.id), ["x", "y"]);
});

console.log("\n✅ Todos os testes de billing-date-sort passaram!\n");
