/**
 * Testes de regressão pra 4 bugs da feature 006 (configuracoes) que ficaram sem
 * regression_tests por falta de infra de teste de componente React no projeto:
 *
 * - BUG-20260723-MOB1: BottomNav sem navegação mobile até Faturamento
 * - BUG-20260723-CLP1: clique no item colapsado do sidebar sem efeito visível
 * - BUG-20260723-ACT1: submenu não destaca item ativo em acesso direto/reload
 * - BUG-20260723-ERR1: getInvoices() engolia erro de rede/API
 *
 * Estrutural (leitura de source como texto), mesmo padrão já usado em EBD1/ADM1/DTN1
 * nesta sessão, na ausência de jest/testing-library no projeto.
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-configuracoes-residual.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Testes: pendências residuais configuracoes (MOB1/CLP1/ACT1/ERR1)\n");

const bottomNavSrc = fs.readFileSync(path.join(__dirname, "..", "src", "components", "layout", "BottomNav.tsx"), "utf-8");
const sidebarSrc = fs.readFileSync(path.join(__dirname, "..", "src", "components", "layout", "Sidebar.tsx"), "utf-8");
const invoicesRouteSrc = fs.readFileSync(path.join(__dirname, "..", "src", "app", "api", "billing", "invoices", "route.ts"), "utf-8");

test("BUG-20260723-MOB1 (regressao): BottomNav tem item com submenu Organização + Faturamento, filtrado por adminOnly", () => {
  assert.ok(bottomNavSrc.includes('"Organização"') || bottomNavSrc.includes("Organização"), "item Organização ausente do BottomNav");
  assert.ok(bottomNavSrc.includes("Faturamento"), "item Faturamento ausente do BottomNav");
  assert.ok(/adminOnly/.test(bottomNavSrc), "filtro adminOnly ausente do BottomNav");
});

test("BUG-20260723-CLP1 (regressao): clique no item com children, sidebar colapsada, expande a sidebar (setCollapsed(false))", () => {
  const match = sidebarSrc.match(/onClick=\{\(\) => \{([\s\S]*?)\}\}/);
  assert.ok(match, "handler onClick do item com children não encontrado");
  assert.ok(/if \(collapsed\)/.test(match![1]), "handler não checa o estado collapsed");
  assert.ok(/setCollapsed\(false\)/.test(match![1]), "handler não expande a sidebar (setCollapsed(false) ausente)");
});

test("BUG-20260723-ACT1 (regressao): expandedMenu inicializa via useState com função lazy baseada no pathname", () => {
  const match = sidebarSrc.match(/useState<Set<string>>\(\(\) => \{([\s\S]*?)\n  \}\)/);
  assert.ok(match, "useState<Set<string>> com inicializador lazy não encontrado");
  assert.ok(/pathname\.startsWith/.test(match![1]), "inicializador não checa pathname.startsWith — não auto-expande pelo path atual");
});

test("BUG-20260723-ERR1 (regressao): GET /api/billing/invoices envolve getInvoices em try/catch e responde 502 em falha", () => {
  assert.ok(/try\s*\{[\s\S]*getInvoices\(/.test(invoicesRouteSrc), "getInvoices não está dentro de um try");
  assert.ok(/catch\s*\(err\)/.test(invoicesRouteSrc), "catch ausente");
  assert.ok(/status:\s*502/.test(invoicesRouteSrc), "resposta 502 em falha ausente");
});

console.log("\n✅ Pendências residuais de configuracoes cobertas por teste estrutural!\n");
