/**
 * Testa a correção de BUG-20260723-DGN1: endpoint de diagnóstico esquecido
 * (src/app/api/reports/diagnostic/route.ts) não deve mais existir em produção.
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-no-diagnostic-endpoint.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: ausência do endpoint de diagnóstico (BUG-20260723-DGN1)\n");

test("BUG-20260723-DGN1 (reproducao/regressao): src/app/api/reports/diagnostic/route.ts NAO deve existir", () => {
  const p = path.join(__dirname, "..", "src", "app", "api", "reports", "diagnostic", "route.ts");
  assert.strictEqual(fs.existsSync(p), false, `endpoint de diagnóstico ainda existe em ${p}`);
});

test("Diretório pai src/app/api/reports/diagnostic tampouco deve existir (removido por completo)", () => {
  const dir = path.join(__dirname, "..", "src", "app", "api", "reports", "diagnostic");
  assert.strictEqual(fs.existsSync(dir), false, `diretório ainda existe: ${dir}`);
});

console.log("\n✅ Endpoint de diagnóstico removido com sucesso!\n");
