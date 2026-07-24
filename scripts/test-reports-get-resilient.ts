/**
 * Testa a correção de BUG-20260723-IDX1: GET /api/reports/generate voltava
 * 500 cru porque (a) firestore.indexes.json não tinha o índice composto que
 * a query reports(org_id, gerado_em) exige, e (b) o handler GET não tinha
 * try/catch pra transformar a exceção do Firestore num JSON de erro controlado.
 *
 * A "reprodução" roda contra uma fixture deliberadamente quebrada (simulando
 * o estado do repositório ANTES do commit 73241bb) — não é possível reproduzir
 * ao vivo, pois o estado de índice ausente em produção já não existe mais
 * (ver evidence/reproduction.md do bug). A "regressão" roda contra os
 * arquivos reais atuais do projeto.
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-reports-get-resilient.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

function hasReportsIndex(indexesJson: string): boolean {
  const data = JSON.parse(indexesJson) as { indexes: Array<{ collectionGroup: string; fields: Array<{ fieldPath: string; order: string }> }> };
  // A query GET faz where(org_id==).orderBy(gerado_em) — exige um índice cujo PREFIXO
  // seja exatamente [org_id, gerado_em] (índices com campo extra no meio, como o do
  // dedupe [org_id, dedup_key, gerado_em], não servem essa query).
  return data.indexes.some(
    (idx) =>
      idx.collectionGroup === "reports" &&
      idx.fields[0]?.fieldPath === "org_id" &&
      idx.fields[1]?.fieldPath === "gerado_em"
  );
}

function getHandlerHasTryCatch(routeSource: string): boolean {
  const match = routeSource.match(/export async function GET\([^)]*\)\s*\{([\s\S]*?)\n\}/);
  if (!match) return false;
  return /try\s*\{/.test(match[1]) && /catch\s*\(/.test(match[1]);
}

console.log("\n🧪 Teste: GET /api/reports/generate resiliente a índice ausente (BUG-20260723-IDX1)\n");

// --- Fixtures simulando o estado ANTES da correção (commit 03f61f7, pré-73241bb) ---
const BROKEN_INDEXES_JSON = JSON.stringify({
  indexes: [
    { collectionGroup: "reports", queryScope: "COLLECTION", fields: [{ fieldPath: "org_id", order: "ASCENDING" }, { fieldPath: "dedup_key", order: "ASCENDING" }, { fieldPath: "gerado_em", order: "ASCENDING" }] },
  ],
  fieldOverrides: [],
});

const BROKEN_ROUTE_SOURCE = `
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const snap = await adminDb.collection("reports").where("org_id", "==", "x").orderBy("gerado_em", "desc").get();
  return Response.json({ reports: snap.docs });
}
`;

test("BUG-20260723-IDX1 (reprodução, fixture pré-fix): índice reports(org_id,gerado_em) NÃO existia — check detecta ausência", () => {
  assert.strictEqual(hasReportsIndex(BROKEN_INDEXES_JSON), false, "esperado false na fixture quebrada");
});

test("BUG-20260723-IDX1 (reprodução, fixture pré-fix): GET sem try/catch — check detecta ausência", () => {
  assert.strictEqual(getHandlerHasTryCatch(BROKEN_ROUTE_SOURCE), false, "esperado false na fixture quebrada");
});

// --- Regressão: arquivos reais do projeto, estado atual (pós-fix, commit 73241bb+) ---
const realIndexesJson = fs.readFileSync(path.join(__dirname, "..", "firestore.indexes.json"), "utf-8");
const realRouteSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "app", "api", "reports", "generate", "route.ts"),
  "utf-8"
);

test("BUG-20260723-IDX1 (regressão): firestore.indexes.json real tem o índice reports(org_id, gerado_em)", () => {
  assert.strictEqual(hasReportsIndex(realIndexesJson), true, "índice reports(org_id,gerado_em) ausente do arquivo rastreado — risco de repetir o incidente no próximo firebase deploy --only firestore:indexes");
});

test("BUG-20260723-IDX1 (regressão): route.ts#GET real envolve a query em try/catch", () => {
  assert.strictEqual(getHandlerHasTryCatch(realRouteSource), true, "GET sem try/catch — exceção do Firestore voltaria a vazar como 500 cru");
});

console.log("\n✅ GET resiliente: índice rastreado presente e try/catch confirmado!\n");
