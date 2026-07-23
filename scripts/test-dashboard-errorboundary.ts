/**
 * Testa a correção de BUG-20260723-EBD1: Sidebar/SuspensoBanner/BottomNav
 * precisam estar dentro de algum ErrorBoundary no DashboardLayout, e o
 * ErrorBoundary precisa aceitar fallback={null} como valor válido (distinto
 * de "nenhum fallback informado").
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-dashboard-errorboundary.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: ErrorBoundary cobrindo o chrome do dashboard (BUG-20260723-EBD1)\n");

const dashboardLayoutSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "layout", "DashboardLayout.tsx"),
  "utf-8"
);

test("BUG-20260723-EBD1 (reproducao/regressao): <Sidebar tem um <ErrorBoundary antes dela no source", () => {
  const idx = dashboardLayoutSrc.indexOf("<Sidebar");
  const boundaryIdx = dashboardLayoutSrc.lastIndexOf("<ErrorBoundary", idx);
  assert.ok(idx > -1, "Sidebar não encontrada no DashboardLayout");
  assert.ok(boundaryIdx > -1 && boundaryIdx < idx, "Sidebar não está precedida por um <ErrorBoundary");
});

test("SuspensoBanner tem um <ErrorBoundary antes dela no source", () => {
  const idx = dashboardLayoutSrc.indexOf("<SuspensoBanner");
  const boundaryIdx = dashboardLayoutSrc.lastIndexOf("<ErrorBoundary", idx);
  assert.ok(idx > -1, "SuspensoBanner não encontrada no DashboardLayout");
  assert.ok(boundaryIdx > -1 && boundaryIdx < idx, "SuspensoBanner não está precedida por um <ErrorBoundary");
});

test("BottomNav tem um <ErrorBoundary antes dela no source", () => {
  const idx = dashboardLayoutSrc.indexOf("<BottomNav");
  const boundaryIdx = dashboardLayoutSrc.lastIndexOf("<ErrorBoundary", idx);
  assert.ok(idx > -1, "BottomNav não encontrada no DashboardLayout");
  assert.ok(boundaryIdx > -1 && boundaryIdx < idx, "BottomNav não está precedida por um <ErrorBoundary");
});

const errorBoundarySrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "ui", "ErrorBoundary.tsx"),
  "utf-8"
);

test("ErrorBoundary usa 'fallback !== undefined' (não truthiness) para aceitar fallback={null}", () => {
  assert.ok(
    errorBoundarySrc.includes("this.props.fallback !== undefined"),
    "ErrorBoundary ainda usa checagem de truthiness (fallback={null} cairia no card padrão)"
  );
});

console.log("\n✅ ErrorBoundary cobre o chrome do dashboard corretamente!\n");
