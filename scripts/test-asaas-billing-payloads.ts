/**
 * Testa os payloads de cobrança contra o sandbox real da Asaas.
 * Execute com: npm run test:asaas
 *
 * Regressão de BUG-20260721-K9M2 e BUG-20260721-V3F7 (_reversa_bugs/unificacao-plano-assinatura/):
 * createPaymentLink.ts e renovarAssinatura.ts enviavam nomes de campo que a API real da Asaas
 * rejeita com 400. Este script chama o sandbox de verdade (não mock) e falha se o contrato
 * de payload voltar a divergir.
 *
 * Requer ASAAS_API_KEY e ASAAS_SANDBOX=true em .env.local, apontando para o sandbox Asaas.
 */

import { createPaymentLink } from "../src/lib/asaas/createPaymentLink";

// Não importamos `criarCobrancaRenovacao` de functions/src/renovarAssinatura.ts:
// esse módulo chama `admin.initializeApp()` no top-level, que trava indefinidamente
// tentando alcançar o metadata server do GCP fora de um ambiente GCP/emulador.
// O Teste 3 abaixo replica o payload exato da função (mesmos nomes de campo),
// não a chamada de módulo — ainda testa o contrato real contra o sandbox.

// ─── Constantes de teste ─────────────────────────────────────────────────────

const CARTAO_TESTE = {
  holderName: "TESTE ASAAS",
  number: "5162306219378829",
  expiryMonth: "05",
  expiryYear: "2029",
  ccv: "318",
};

const TITULAR_TESTE = {
  name: "Reversa Debug Teste",
  email: "reversa-debug@example.com",
  cpfCnpj: "24971563792",
  postalCode: "01310-100",
  addressNumber: "100",
  phone: "11999999999",
};

function baseUrl(): string {
  return process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api"
    : "https://api.asaas.com/api";
}

// ─── Runner ──────────────────────────────────────────────────────────────────

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

function assertSandbox(): void {
  if (process.env.ASAAS_SANDBOX !== "true") {
    throw new Error(
      "ASAAS_SANDBOX != 'true' — este script só pode rodar contra o sandbox, nunca contra produção."
    );
  }
}

async function criarClienteTeste(): Promise<string> {
  const res = await fetch(`${baseUrl()}/v3/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: process.env.ASAAS_API_KEY! },
    body: JSON.stringify({
      name: TITULAR_TESTE.name,
      cpfCnpj: TITULAR_TESTE.cpfCnpj,
      email: TITULAR_TESTE.email,
    }),
  });
  if (!res.ok) throw new Error(`Falha ao criar customer de teste: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function runTests(): Promise<void> {
  // ── Teste 1: createPaymentLink com o payload atual do código ─────────────
  // Regressão de BUG-20260721-K9M2: se maxInstallmentCount/value voltarem a
  // ser trocados por installmentCount/totalValue, a Asaas responde 400 e
  // createPaymentLink lança "Falha ao criar link de pagamento" — este teste falha.
  await test(
    "createPaymentLink('unico', 12) cria link de pagamento com sucesso no sandbox real (BUG-20260721-K9M2)",
    async () => {
      const { url } = await createPaymentLink("unico", 12);
      if (!url || !url.startsWith("https://sandbox.asaas.com/")) {
        throw new Error(`URL de pagamento inesperada: ${url}`);
      }
    }
  );

  // ── Teste 2: cobrança direta com cartão bruto retorna creditCardToken ────
  // Valida a premissa da arquitetura D-04: a Asaas tokeniza o cartão numa
  // cobrança direta, sem parâmetro especial de "salvar cartão".
  const customerId = await criarClienteTeste();
  let tokenCapturado = "";
  await test(
    "Cobrança direta com cartão bruto retorna creditCardToken reutilizável (sustenta D-04)",
    async () => {
      const res = await fetch(`${baseUrl()}/v3/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: process.env.ASAAS_API_KEY! },
        body: JSON.stringify({
          customer: customerId,
          billingType: "CREDIT_CARD",
          installmentCount: 1,
          installmentValue: 97,
          dueDate: new Date().toISOString().split("T")[0],
          description: "test-asaas-billing-payloads: captura de token",
          creditCard: CARTAO_TESTE,
          creditCardHolderInfo: TITULAR_TESTE,
        }),
      });
      if (!res.ok) throw new Error(`Falha ao cobrar (${res.status}): ${await res.text()}`);
      const data = (await res.json()) as { status: string; creditCard?: { creditCardToken?: string } };
      if (data.status !== "CONFIRMED") throw new Error(`status inesperado: ${data.status}`);
      if (!data.creditCard?.creditCardToken) throw new Error("creditCardToken ausente na resposta");
      tokenCapturado = data.creditCard.creditCardToken;
    }
  );

  // ── Teste 3: criarCobrancaRenovacao reutiliza o token, sem cartão bruto ──
  // Regressão de BUG-20260721-V3F7: se installmentValue for removido/trocado
  // de volta por value, a Asaas responde 400 invalid_installmentValue.
  await test(
    "Payload de criarCobrancaRenovacao (installmentValue + creditCardToken) cobra com sucesso (BUG-20260721-V3F7)",
    async () => {
      if (!tokenCapturado) throw new Error("token não capturado no teste anterior");
      const parcelas = 3;
      const installmentValue = Math.round((1164 / parcelas) * 100) / 100;
      const res = await fetch(`${baseUrl()}/v3/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: process.env.ASAAS_API_KEY! },
        body: JSON.stringify({
          customer: customerId,
          billingType: "CREDIT_CARD",
          installmentCount: parcelas,
          installmentValue,
          creditCardToken: tokenCapturado,
          dueDate: new Date().toISOString().split("T")[0],
          description: `Portal Sigilo — Renovação anual (${parcelas}x)`,
        }),
      });
      if (!res.ok) throw new Error(`Falha na renovação (${res.status}): ${await res.text()}`);
      const data = (await res.json()) as { status: string };
      if (data.status !== "CONFIRMED") throw new Error(`status inesperado: ${data.status}`);
    }
  );
}

async function main(): Promise<void> {
  assertSandbox();

  console.log("Testando payloads de cobrança contra o sandbox Asaas real...\n");
  await runTests();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${passed} passou(aram), ${failed} falhou(aram) de ${results.length} teste(s)`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
