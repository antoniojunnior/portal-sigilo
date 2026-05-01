/**
 * Testa as Firestore Security Rules da Fase 1.
 * Execute com: npm run test:rules
 *
 * O emulador deve estar rodando: firebase emulators:start
 * Não depende do seed — cria seus próprios dados via Admin SDK.
 */

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// ─── Constantes de teste ─────────────────────────────────────────────────────

const PROJECT_ID = "portal-sigilo";

const ORG_A = "test-org-a";
const ORG_B = "test-org-b";
const USER_ORG_A = "test-user-org-a";
const USER_ORG_B = "test-user-org-b";
const USER_MENCIONADO = "test-user-mencionado";
const CASE_NORMAL_ID = "test-case-normal";
const CASE_MENCIONADO_ID = "test-case-mencionado";
const AUDIT_LOG_ID = "test-audit-log";

// ─── Setup ───────────────────────────────────────────────────────────────────

async function setupTestData(testEnv: RulesTestEnvironment): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // Usuário da Org A
    await db.doc(`users/${USER_ORG_A}`).set({
      id: USER_ORG_A,
      org_id: ORG_A,
      role: "gestor",
      ativo: true,
    });

    // Usuário da Org B
    await db.doc(`users/${USER_ORG_B}`).set({
      id: USER_ORG_B,
      org_id: ORG_B,
      role: "gestor",
      ativo: true,
    });

    // Usuário que será mencionado em um case
    await db.doc(`users/${USER_MENCIONADO}`).set({
      id: USER_MENCIONADO,
      org_id: ORG_A,
      role: "gestor",
      ativo: true,
    });

    // Case da Org A (sem mencionados)
    await db.doc(`cases/${CASE_NORMAL_ID}`).set({
      id: CASE_NORMAL_ID,
      org_id: ORG_A,
      protocolo: "ETK-2026-TST001",
      status: "aguardando_triagem",
      canal_origem: "web",
      mencionados: [],
      historico: [],
      anexos: [],
      created_at: new Date(),
      ttl: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
    });

    // Case da Org A com USER_MENCIONADO em mencionados[]
    await db.doc(`cases/${CASE_MENCIONADO_ID}`).set({
      id: CASE_MENCIONADO_ID,
      org_id: ORG_A,
      protocolo: "ETK-2026-TST002",
      status: "aguardando_triagem",
      canal_origem: "web",
      mencionados: [USER_MENCIONADO],
      historico: [],
      anexos: [],
      created_at: new Date(),
      ttl: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
    });

    // Audit log da Org A
    await db.doc(`audit_logs/${AUDIT_LOG_ID}`).set({
      id: AUDIT_LOG_ID,
      org_id: ORG_A,
      user_id: USER_ORG_A,
      acao: "case_criado",
      timestamp: new Date(),
    });
  });
}

// ─── Testes ──────────────────────────────────────────────────────────────────

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

async function runTests(testEnv: RulesTestEnvironment): Promise<void> {
  // ── Teste 1: Criar case SEM org_id → deve ser rejeitado ──────────────────
  await test(
    "Criar case sem org_id deve ser rejeitado (create: if false para clients)",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      // allow create: if false — clients nunca criam cases diretamente
      await assertFails(
        setDoc(doc(db, "cases", "test-novo-sem-orgid"), {
          protocolo: "ETK-2026-NOID",
          status: "aguardando_triagem",
          // sem org_id
        })
      );
    }
  );

  // ── Teste 2: Criar case COM org_id → também deve ser rejeitado ────────────
  // (criação de cases é exclusiva do Admin SDK — firebase Function)
  await test(
    "Criar case com org_id também deve ser rejeitado (create: if false)",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertFails(
        setDoc(doc(db, "cases", "test-novo-com-orgid"), {
          org_id: ORG_A,
          protocolo: "ETK-2026-WITHID",
          status: "aguardando_triagem",
          mencionados: [],
          historico: [],
          anexos: [],
        })
      );
    }
  );

  // ── Teste 3: Ler case de org diferente → deve ser rejeitado ──────────────
  await test(
    "Ler case de org diferente deve ser rejeitado",
    async () => {
      // USER_ORG_B tenta ler case da ORG_A
      const userB = testEnv.authenticatedContext(USER_ORG_B);
      const db = userB.firestore();
      await assertFails(getDoc(doc(db, "cases", CASE_NORMAL_ID)));
    }
  );

  // ── Teste 4: Ler case da própria org → deve ser permitido (sanidade) ──────
  await test(
    "[Sanidade] Ler case da própria org deve ser permitido",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertSucceeds(getDoc(doc(db, "cases", CASE_NORMAL_ID)));
    }
  );

  // ── Teste 5: Update em audit_log → deve ser rejeitado ────────────────────
  await test(
    "Update em audit_log deve ser rejeitado (update: if false)",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertFails(
        updateDoc(doc(db, "audit_logs", AUDIT_LOG_ID), {
          acao: "ADULTERADO",
        })
      );
    }
  );

  // ── Teste 6: Delete em audit_log → deve ser rejeitado ────────────────────
  await test(
    "Delete em audit_log deve ser rejeitado (delete: if false)",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertFails(deleteDoc(doc(db, "audit_logs", AUDIT_LOG_ID)));
    }
  );

  // ── Teste 7: Ler case onde userId está em mencionados[] → deve falhar ─────
  await test(
    "Ler case onde userId está em mencionados[] deve ser rejeitado",
    async () => {
      // USER_MENCIONADO está em mencionados[] do CASE_MENCIONADO_ID
      const mencionado = testEnv.authenticatedContext(USER_MENCIONADO);
      const db = mencionado.firestore();
      await assertFails(getDoc(doc(db, "cases", CASE_MENCIONADO_ID)));
    }
  );

  // ── Teste 8: Gestor não mencionado lê mesmo case → deve ser permitido ─────
  await test(
    "[Sanidade] Gestor não mencionado lê case com mencionados[] deve ser permitido",
    async () => {
      // USER_ORG_A não está em mencionados[], então pode ler
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertSucceeds(getDoc(doc(db, "cases", CASE_MENCIONADO_ID)));
    }
  );

  // ── Teste 9: Usuário não autenticado lê qualquer doc → deve falhar ────────
  await test(
    "Usuário não autenticado lendo case deve ser rejeitado",
    async () => {
      const unauth = testEnv.unauthenticatedContext();
      const db = unauth.firestore();
      await assertFails(getDoc(doc(db, "cases", CASE_NORMAL_ID)));
    }
  );

  // ── Teste 10: whatsapp_sessions inacessível no client → deve falhar ───────
  await test(
    "whatsapp_sessions inacessível para qualquer client (read/write: if false)",
    async () => {
      const userA = testEnv.authenticatedContext(USER_ORG_A);
      const db = userA.firestore();
      await assertFails(
        setDoc(doc(db, "whatsapp_sessions", "test-session"), {
          org_id: ORG_A,
          conversation_id: "hash-teste",
          status: "iniciada",
        })
      );
    }
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🔐 Teste das Firestore Security Rules — Fase 1");
  console.log("───────────────────────────────────────────────\n");

  const rulesPath = path.resolve(__dirname, "../firestore.rules");

  if (!fs.existsSync(rulesPath)) {
    console.error("❌ firestore.rules não encontrado em:", rulesPath);
    process.exit(1);
  }

  let testEnv: RulesTestEnvironment | null = null;

  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(rulesPath, "utf8"),
        host: (process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8181").split(":")[0],
        port: parseInt((process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8181").split(":")[1] ?? "8181", 10),
      },
    });

    console.log("Preparando dados de teste...");
    await testEnv.clearFirestore();
    await setupTestData(testEnv);
    console.log("Dados prontos.\n");

    console.log("Executando testes:\n");
    await runTests(testEnv);

  } catch (err) {
    console.error("\n❌ Erro ao inicializar ambiente de teste:", err);
    console.error("Verifique: firebase emulators:start");
    process.exit(1);
  } finally {
    if (testEnv) await testEnv.cleanup();
  }

  // ── Relatório final ────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n───────────────────────────────────────────────");
  console.log(`Resultado: ${passed} passou · ${failed} falhou`);

  if (failed > 0) {
    console.log("\nFalhas:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  ✗ ${r.name}`));
    console.log();
    process.exit(1);
  } else {
    console.log("\n✅ Todas as regras de segurança da Fase 1 validadas!\n");
  }
}

main();
