/**
 * Testa a correção de BUG-20260721-D8L4 e BUG-20260722-Q5J9: docs/PRD_PortalSigilo_v2.md
 * não deveria mais descrever features já unificadas (triagem IA, assistente IA, mapa de
 * risco, exportação, relatório personalizado, isolamento multi-unidade) como exclusivas
 * de um plano "Enterprise" que não existe mais (RN-01: plano único).
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-prd-enterprise-residual.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: PRD sem gating residual por Enterprise (BUG-20260721-D8L4 / BUG-20260722-Q5J9)\n");

const prd = fs.readFileSync(path.join(__dirname, "..", "docs", "PRD_PortalSigilo_v2.md"), "utf-8");

test("BUG-20260721-D8L4 (regressao): §2.2 sem as 3 frases antigas de gating por Enterprise", () => {
  assert.ok(!prd.includes("somente Enterprise"), "'somente Enterprise' voltou a aparecer");
  assert.ok(!prd.includes("dashboard Enterprise"), "'dashboard Enterprise' voltou a aparecer");
  assert.ok(!/multi-unidade no Enterprise/i.test(prd), "'multi-unidade no Enterprise' voltou a aparecer");
});

test("BUG-20260722-Q5J9 (regressao): sem frases de gating 'Apenas/Disponivel apenas Gestao e Enterprise'", () => {
  assert.ok(!/apenas gestao e enterprise/i.test(prd), "frase de gating por tier voltou a aparecer");
  assert.ok(!/dispon[íi]vel apenas nos planos gestao e enterprise/i.test(prd), "frase de gating por tier voltou a aparecer");
});

test("BUG-20260722-Q5J9 (regressao): só 1 ocorrência de 'Enterprise' no PRD inteiro (referência deliberada e explicada ao roadmap futuro, não gating)", () => {
  const count = (prd.match(/enterprise/gi) || []).length;
  assert.strictEqual(count, 1, `esperado exatamente 1 ocorrência de 'Enterprise' (referência deliberada ao roadmap futuro/decisão pendente), encontrado ${count}`);
});

console.log("\n✅ PRD sem gating residual por Enterprise nas features já unificadas!\n");
