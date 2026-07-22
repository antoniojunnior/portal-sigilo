/**
 * Testa as correções de BUG-20260721-P2W5, BUG-20260721-N7Q1 e BUG-20260721-H3X6.
 * Execute com: npm run test:billing-fixes
 *
 * Escreve dados de teste no Firestore real apontado por FIREBASE_PROJECT_ID em
 * .env.local (confirmado seguro pelo usuário em 2026-07-22, sem projeto dev/test
 * separado configurado). Limpa os documentos de teste ao final.
 */

import { adminDb } from "../src/lib/firebase-admin/admin";
import { cancelarAssinatura } from "../src/app/api/billing/cancel/route";
import { isPlanoValido, isParcelasValido } from "../src/app/api/checkout/create/route";
import { getSubscription, mapInvoiceStatusToSubscriptionStatus } from "../src/lib/asaas/getSubscription";

const ORG_CANCEL_TESTE = "test-billing-fix-cancel";
const ORG_SUBSCRIPTION_TESTE = "test-billing-fix-subscription";
const ASAAS_CUSTOMER_TESTE = "cus_000008453055"; // criado durante o fix de BUG-20260721-K9M2

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
  // ── BUG-20260721-P2W5: cancelarAssinatura funciona sem asaas_customer_id ──
  await test(
    "cancelarAssinatura cancela org sem asaas_customer_id (BUG-20260721-P2W5)",
    async () => {
      await adminDb.collection("orgs").doc(ORG_CANCEL_TESTE).set({
        id: ORG_CANCEL_TESTE,
        nome: "Org Teste Cancelamento",
        plano_ativo: "unico",
        renovacao_cancelada: false,
        // propositalmente SEM asaas_customer_id
      });

      await cancelarAssinatura(ORG_CANCEL_TESTE, "test-user-admin");

      const orgSnap = await adminDb.collection("orgs").doc(ORG_CANCEL_TESTE).get();
      const orgData = orgSnap.data();
      if (orgData?.plano_ativo !== "cancelado") throw new Error(`plano_ativo esperado 'cancelado', veio '${orgData?.plano_ativo}'`);
      if (orgData?.renovacao_cancelada !== true) throw new Error("renovacao_cancelada deveria ser true");

      const auditSnap = await adminDb
        .collection("audit_logs")
        .where("org_id", "==", ORG_CANCEL_TESTE)
        .where("acao", "==", "assinatura_cancelada")
        .limit(1)
        .get();
      if (auditSnap.empty) throw new Error("audit log 'assinatura_cancelada' não encontrado");
    }
  );

  // ── BUG-20260721-N7Q1: isParcelasValido rejeita undefined ────────────────
  await test(
    "isParcelasValido(undefined) é false — parcelas ausente não vira default silencioso (BUG-20260721-N7Q1)",
    async () => {
      if (isParcelasValido(undefined) !== false) {
        throw new Error("isParcelasValido(undefined) deveria ser false");
      }
      if (isParcelasValido(12) !== true) {
        throw new Error("isParcelasValido(12) deveria ser true");
      }
      if (isPlanoValido("entrada") !== false) {
        throw new Error("isPlanoValido('entrada') deveria ser false (identificador antigo)");
      }
      if (isPlanoValido("unico") !== true) {
        throw new Error("isPlanoValido('unico') deveria ser true");
      }
    }
  );

  // ── BUG-20260721-H3X6: getSubscription usa 'parcelas' e subscription_id ──
  await test(
    "getSubscription retorna 'parcelas' (não 'total_parcelas') e subscription_id: null (BUG-20260721-H3X6)",
    async () => {
      await adminDb.collection("orgs").doc(ORG_SUBSCRIPTION_TESTE).set({
        id: ORG_SUBSCRIPTION_TESTE,
        nome: "Org Teste Subscription",
        plano_ativo: "unico",
        asaas_customer_id: ASAAS_CUSTOMER_TESTE,
        proxima_cobranca_parcelas: 3,
        renovacao_cancelada: false,
      });

      const sub = await getSubscription(ORG_SUBSCRIPTION_TESTE);
      if (!sub) throw new Error("getSubscription retornou null");
      if (sub.subscription_id !== null) throw new Error("subscription_id deveria ser null");
      if (sub.parcelas !== 3) throw new Error(`parcelas esperado 3, veio ${sub.parcelas}`);
      if ("total_parcelas" in sub) throw new Error("campo total_parcelas não deveria mais existir");
    }
  );

  // ── BUG-20260722-T6R2: mapeamento de status de pagamento completo ────────
  await test(
    "mapInvoiceStatusToSubscriptionStatus mapeia os 3 buckets explicitamente (BUG-20260722-T6R2)",
    async () => {
      const ativos: Array<Parameters<typeof mapInvoiceStatusToSubscriptionStatus>[0]> = [
        "CONFIRMED",
        "RECEIVED",
        "RECEIVED_IN_CASH",
      ];
      for (const s of ativos) {
        const r = mapInvoiceStatusToSubscriptionStatus(s);
        if (r !== "ACTIVE") throw new Error(`status Asaas '${s}' deveria mapear para ACTIVE, veio '${r}'`);
      }

      const disputados: Array<Parameters<typeof mapInvoiceStatusToSubscriptionStatus>[0]> = [
        "REFUNDED",
        "CHARGEBACK_REQUESTED",
        "CHARGEBACK_DISPUTE",
      ];
      for (const s of disputados) {
        const r = mapInvoiceStatusToSubscriptionStatus(s);
        if (r !== "DISPUTED") throw new Error(`status Asaas '${s}' deveria mapear para DISPUTED (não ACTIVE), veio '${r}'`);
      }

      if (mapInvoiceStatusToSubscriptionStatus("OVERDUE") !== "SUSPENDED") {
        throw new Error("status Asaas 'OVERDUE' deveria mapear para SUSPENDED");
      }
      if (mapInvoiceStatusToSubscriptionStatus("CANCELLED") !== "INACTIVE") {
        throw new Error("status Asaas 'CANCELLED' deveria mapear para INACTIVE");
      }
    }
  );

  // ── BUG-20260722-T6R2: getSubscription contra sandbox real (6/6 pagamentos CONFIRMED) ──
  await test(
    "getSubscription retorna status ACTIVE para customer real com pagamentos CONFIRMED (BUG-20260722-T6R2)",
    async () => {
      const sub = await getSubscription(ORG_SUBSCRIPTION_TESTE);
      if (!sub) throw new Error("getSubscription retornou null");
      if (sub.status !== "ACTIVE") {
        throw new Error(`status esperado 'ACTIVE' (payment real é CONFIRMED), veio '${sub.status}'`);
      }
    }
  );
}

async function cleanup(): Promise<void> {
  await adminDb.collection("orgs").doc(ORG_CANCEL_TESTE).delete().catch(() => {});
  await adminDb.collection("orgs").doc(ORG_SUBSCRIPTION_TESTE).delete().catch(() => {});
  const auditSnap = await adminDb
    .collection("audit_logs")
    .where("org_id", "==", ORG_CANCEL_TESTE)
    .get();
  await Promise.all(auditSnap.docs.map((d) => d.ref.delete()));
}

async function main(): Promise<void> {
  console.log("Testando fixes de billing (Firestore real + sandbox Asaas)...\n");
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
