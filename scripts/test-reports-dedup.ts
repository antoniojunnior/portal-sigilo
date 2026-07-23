/**
 * Testa a correção de BUG-20260723-DUP1 (contexto relatorios): TOCTOU no dedupe
 * de geração de relatórios — acesso concorrente não pode criar 2 documentos.
 * Execute com: npm run test:reports-dedup
 */

import { adminDb } from "../src/lib/firebase-admin/admin";
import { buildReportDedupKey, findRecentDuplicateReport, reserveReportSlot } from "../src/lib/reports/dedup";

const ORG_DUP1_TESTE = "test-reports-bug-dup1";

type TestResult = { name: string; passed: boolean; error?: string };
const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    results.push({ name, passed: true });
    console.log("✓ PASSOU");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: msg });
    console.log("✗ FALHOU");
    console.log(`    ${msg}`);
  }
}

async function runTests(): Promise<void> {
  console.log("\n== BUG-20260723-DUP1: TOCTOU na geração de relatórios ==\n");

  await test(
    "buildReportDedupKey: mesma org/tipo/periodo com departamentos em ordem diferente gera a MESMA chave",
    async () => {
      const k1 = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-07-01", "2026-07-31", ["TI", "RH"], []);
      const k2 = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-07-01", "2026-07-31", ["RH", "TI"], []);
      if (k1 !== k2) throw new Error(`esperado chaves iguais, veio '${k1}' vs '${k2}'`);
    }
  );

  await test(
    "buildReportDedupKey: departamentos diferentes geram chaves DIFERENTES",
    async () => {
      const k1 = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-07-01", "2026-07-31", ["TI"], []);
      const k2 = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-07-01", "2026-07-31", ["RH"], []);
      if (k1 === k2) throw new Error("esperado chaves diferentes para departamentos diferentes");
    }
  );

  await test(
    "findRecentDuplicateReport: retorna null quando não há relatório para a chave (reprodução do estado inicial)",
    async () => {
      const key = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-07-01", "2026-07-31", [], []);
      const found = await findRecentDuplicateReport(ORG_DUP1_TESTE, key, 60_000);
      if (found !== null) throw new Error(`esperado null, veio ${JSON.stringify(found)}`);
    }
  );

  // ── Regressão: 2 chamadas verdadeiramente concorrentes, só 1 deve criar o documento ──
  await test(
    "reserveReportSlot: 2 chamadas concorrentes contra Firestore real (mesmo dedup_key), exatamente 1 cria documento novo (BUG-20260723-DUP1)",
    async () => {
      const key = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-08-01", "2026-08-31", [], []);
      const reportsCollection = adminDb.collection("reports");
      const ref1 = reportsCollection.doc();
      const ref2 = reportsCollection.doc();

      const [r1, r2] = await Promise.all([
        reserveReportSlot(ORG_DUP1_TESTE, key, 60_000, ref1, {
          id: ref1.id, org_id: ORG_DUP1_TESTE, dedup_key: key, gerado_em: new Date(), status: "rascunho",
        }),
        reserveReportSlot(ORG_DUP1_TESTE, key, 60_000, ref2, {
          id: ref2.id, org_id: ORG_DUP1_TESTE, dedup_key: key, gerado_em: new Date(), status: "rascunho",
        }),
      ]);

      const createdCount = [r1, r2].filter((r) => !r.deduplicated).length;
      if (createdCount !== 1) {
        throw new Error(
          `esperado exatamente 1 documento criado entre as 2 chamadas concorrentes, veio ${createdCount} ` +
          `(r1=${JSON.stringify(r1)}, r2=${JSON.stringify(r2)})`
        );
      }

      // as duas chamadas devem concordar sobre qual reportId "venceu"
      if (r1.reportId !== r2.reportId) {
        throw new Error(`esperado ambas as chamadas apontarem pro mesmo reportId vencedor, veio '${r1.reportId}' vs '${r2.reportId}'`);
      }

      const snap = await reportsCollection.where("org_id", "==", ORG_DUP1_TESTE).where("dedup_key", "==", key).get();
      if (snap.size !== 1) {
        throw new Error(`esperado exatamente 1 documento no Firestore para essa chave, veio ${snap.size}`);
      }
    }
  );

  await test(
    "reserveReportSlot: chamada subsequente (fora de concorrência) também reaproveita o slot já reservado",
    async () => {
      const key = buildReportDedupKey(ORG_DUP1_TESTE, "padrao", "2026-08-01", "2026-08-31", [], []);
      const reportsCollection = adminDb.collection("reports");
      const ref3 = reportsCollection.doc();

      const r3 = await reserveReportSlot(ORG_DUP1_TESTE, key, 60_000, ref3, {
        id: ref3.id, org_id: ORG_DUP1_TESTE, dedup_key: key, gerado_em: new Date(), status: "rascunho",
      });

      if (!r3.deduplicated) {
        throw new Error("terceira chamada deveria reaproveitar o relatório já criado pelas 2 chamadas concorrentes anteriores");
      }
    }
  );
}

async function cleanup(): Promise<void> {
  const snap = await adminDb.collection("reports").where("org_id", "==", ORG_DUP1_TESTE).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete().catch(() => {})));
}

async function main(): Promise<void> {
  console.log("Testando fix de BUG-20260723-DUP1 (Firestore real)...");
  try {
    await runTests();
  } finally {
    await cleanup();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n${passed} passou(aram), ${failed} falhou(aram) de ${results.length} teste(s)`);
  if (failed > 0) process.exit(1);
}

main();
