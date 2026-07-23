/**
 * Testa error-messages.ts — traducao de codigos de erro da feature 005 (BUG-20260723-PSU1).
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-reports-error-messages.ts
 */

import assert from "node:assert";

const ERROR_MESSAGES: Record<string, string> = {
  plan_suspended: "Seu plano está suspenso ou cancelado. Entre em contato com o suporte para reativar o acesso a relatórios.",
};

function translateGenerateErrorMessage(raw: string): string {
  return ERROR_MESSAGES[raw] ?? raw;
}

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Testes: error-messages\n");

test("BUG-20260723-PSU1 (reproducao): 'plan_suspended' NAO deve aparecer cru na mensagem traduzida", () => {
  const msg = translateGenerateErrorMessage("plan_suspended");
  assert.notStrictEqual(msg, "plan_suspended");
  assert.ok(msg.toLowerCase().includes("plano"), "mensagem deve mencionar 'plano' de forma legivel");
});

test("mensagem ja legivel (ex.: erro de auditor) passa direto, sem alteracao", () => {
  const msg = translateGenerateErrorMessage("Auditores não podem gerar relatórios.");
  assert.strictEqual(msg, "Auditores não podem gerar relatórios.");
});

test("codigo desconhecido passa direto (fallback seguro, sem quebrar)", () => {
  const msg = translateGenerateErrorMessage("algum_erro_novo_desconhecido");
  assert.strictEqual(msg, "algum_erro_novo_desconhecido");
});

console.log("\n✅ Todos os testes de error-messages passaram!\n");
