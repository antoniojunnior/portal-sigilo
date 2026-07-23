/**
 * Testa as correções de BUG-20260722-SRC1 e BUG-20260722-TCT1 (contexto insights-ia-dashboard).
 * Execute com: npm run test:insights-bugs
 */

import { adminDb } from "../src/lib/firebase-admin/admin";
import { resolveInsightSource } from "../src/lib/insights/mapItems";
import { reserveRegenerationSlot } from "../src/lib/insights/rateLimit";

const ORG_SRC1_TESTE = "test-insights-bug-src1";
const ORG_TCT1_TESTE = "test-insights-bug-tct1";

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
  console.log("\n== BUG-20260722-SRC1: source não persistido ==\n");

  // ── Reprodução: dado legado sem `source` (formato pré-fix) ──
  await test(
    "resolveInsightSource(undefined) infere 'ai_generated' para dado legado sem o campo (reprodução do porquê o bug existia)",
    async () => {
      const r = resolveInsightSource(undefined);
      if (r !== "ai_generated") throw new Error(`esperado 'ai_generated' (fallback legado), veio '${r}'`);
    }
  );

  // ── Regressão: dado pós-fix com `source: "fallback"` persistido ──
  await test(
    "resolveInsightSource('fallback') preserva a fonte real gravada, não cai no fallback legado (BUG-20260722-SRC1)",
    async () => {
      const r = resolveInsightSource("fallback");
      if (r !== "fallback") throw new Error(`esperado 'fallback' (fonte real persistida), veio '${r}'`);
    }
  );

  await test(
    "resolveInsightSource('ai_generated') passa direto quando já é o valor real",
    async () => {
      const r = resolveInsightSource("ai_generated");
      if (r !== "ai_generated") throw new Error(`esperado 'ai_generated', veio '${r}'`);
    }
  );

  // ── Round-trip real no Firestore: o campo `source` sobrevive escrita/leitura ──
  await test(
    "Firestore real: orgs.ai_insights.source grava e lê de volta sem perda (BUG-20260722-SRC1)",
    async () => {
      await adminDb.collection("orgs").doc(ORG_SRC1_TESTE).set({
        id: ORG_SRC1_TESTE,
        nome: "Org Teste SRC1",
        ai_insights: {
          items: ["Nenhum novo relato nos últimos 7 dias.", "Canal ativo e disponível.", "Mantenha a divulgação."],
          source: "fallback",
          gerado_em: new Date(),
        },
      });

      const orgSnap = await adminDb.collection("orgs").doc(ORG_SRC1_TESTE).get();
      const aiInsights = orgSnap.data()?.ai_insights as { source?: string } | undefined;
      if (aiInsights?.source !== "fallback") {
        throw new Error(`esperado source='fallback' persistido no Firestore, veio '${aiInsights?.source}'`);
      }
      if (resolveInsightSource(aiInsights?.source) !== "fallback") {
        throw new Error("resolveInsightSource não preservou o valor lido do Firestore");
      }
    }
  );

  console.log("\n== BUG-20260722-TCT1: TOCTOU no rate limit de regeneração ==\n");

  // ── Regressão: 2 chamadas verdadeiramente concorrentes, só 1 deve passar ──
  await test(
    "reserveRegenerationSlot: 2 chamadas concorrentes contra Firestore real, exatamente 1 allowed=true (BUG-20260722-TCT1)",
    async () => {
      await adminDb.collection("orgs").doc(ORG_TCT1_TESTE).set({
        id: ORG_TCT1_TESTE,
        nome: "Org Teste TCT1",
        // propositalmente SEM ai_insights.gerado_em — primeira regeneração, rate limit não bloqueia por si só
      });

      const [r1, r2] = await Promise.all([
        reserveRegenerationSlot(ORG_TCT1_TESTE),
        reserveRegenerationSlot(ORG_TCT1_TESTE),
      ]);

      const allowedCount = [r1, r2].filter((r) => r.allowed).length;
      if (allowedCount !== 1) {
        throw new Error(
          `esperado exatamente 1 reserva concedida entre as 2 chamadas concorrentes, veio ${allowedCount} ` +
          `(r1=${JSON.stringify(r1)}, r2=${JSON.stringify(r2)})`
        );
      }
    }
  );

  // ── Regressão: chamada subsequente dentro da janela é bloqueada ──
  await test(
    "reserveRegenerationSlot: terceira chamada logo em seguida é bloqueada (rate limit real de 24h já reservado)",
    async () => {
      const r3 = await reserveRegenerationSlot(ORG_TCT1_TESTE);
      if (r3.allowed) {
        throw new Error("terceira chamada deveria ser bloqueada — slot já reservado pelas 2 chamadas anteriores");
      }
    }
  );
}

async function cleanup(): Promise<void> {
  await adminDb.collection("orgs").doc(ORG_SRC1_TESTE).delete().catch(() => {});
  await adminDb.collection("orgs").doc(ORG_TCT1_TESTE).delete().catch(() => {});
}

async function main(): Promise<void> {
  console.log("Testando fixes de insights-ia-dashboard (Firestore real)...");
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
