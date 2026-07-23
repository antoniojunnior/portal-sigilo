/**
 * Testa a correção de BUG-20260723-ADM1: Insights precisa ser admin-only,
 * tanto no sidebar quanto na API.
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-insights-adminonly.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: Insights admin-only (BUG-20260723-ADM1)\n");

const sidebarSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "layout", "Sidebar.tsx"),
  "utf-8"
);

test("BUG-20260723-ADM1 (reproducao/regressao): item Insights no NAV_ITEMS tem adminOnly: true", () => {
  const insightsLineMatch = sidebarSrc.match(/href:\s*"\/app\/insights"[^}]*}/);
  assert.ok(insightsLineMatch, "item /app/insights não encontrado em NAV_ITEMS");
  assert.ok(
    insightsLineMatch![0].includes("adminOnly: true") || insightsLineMatch![0].includes("adminOnly:true"),
    `item Insights não tem adminOnly: true — encontrado: ${insightsLineMatch![0]}`
  );
});

const insightsRouteSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "app", "api", "dashboard", "insights", "route.ts"),
  "utf-8"
);

test("GET /api/dashboard/insights checa session.role !== admin e responde 403", () => {
  assert.ok(
    /session\.role\s*!==\s*"admin"/.test(insightsRouteSrc),
    "route.ts não checa session.role !== 'admin'"
  );
  assert.ok(insightsRouteSrc.includes("403"), "route.ts não responde 403 em algum ponto");
});

const insightsPageSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "app", "(dashboard)", "app", "(protected)", "insights", "page.tsx"),
  "utf-8"
);

test("insights/page.tsx redireciona usuário não-admin (client-side), consistente com faturamento/page.tsx", () => {
  assert.ok(
    /user\.role\s*!==\s*"admin"/.test(insightsPageSrc) && insightsPageSrc.includes("router.replace"),
    "insights/page.tsx não redireciona não-admin"
  );
});

console.log("\n✅ Insights corretamente restrito a admin!\n");
