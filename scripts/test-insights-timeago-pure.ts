/**
 * Testa a correção de BUG-20260723-DTN1: Date.now() não pode ser chamado
 * direto no corpo do componente em insights/page.tsx.
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-insights-timeago-pure.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: Date.now() fora do corpo do render (BUG-20260723-DTN1)\n");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "app", "(dashboard)", "app", "(protected)", "insights", "page.tsx"),
  "utf-8"
);

test("BUG-20260723-DTN1 (reproducao/regressao): Date.now() só aparece dentro de um useEffect, não no corpo do componente", () => {
  const lines = src.split("\n");
  const dateNowLineIdx = lines.findIndex((l) => l.includes("Date.now()"));
  assert.ok(dateNowLineIdx > -1, "Date.now() não encontrado no arquivo (esperado dentro do useEffect)");

  // Procura o useEffect mais próximo ANTES da linha de Date.now()
  let sawUseEffectBefore = false;
  for (let i = dateNowLineIdx; i >= 0; i--) {
    if (lines[i].includes("useEffect(")) { sawUseEffectBefore = true; break; }
    if (lines[i].includes("const timeAgo") || lines[i].includes("export default function")) break;
  }
  assert.ok(sawUseEffectBefore, "Date.now() não está dentro de um useEffect próximo");
});

console.log("\n✅ Date.now() isolado corretamente dentro de efeito!\n");
