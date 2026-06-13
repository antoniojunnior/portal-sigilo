/**
 * One-shot script: cria customer no Asaas sandbox e salva asaas_customer_id na org.
 * Uso: node scripts/seed-asaas-customer.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Carrega .env.local manualmente (evita dep. do dotenv/config com ESM) ──
const envPath = resolve(ROOT, ".env.local");
const envLines = readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

// ── Config ─────────────────────────────────────────────────────────────────
const ORG_ID = "org-acme-gestao";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL =
  process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api"
    : "https://api.asaas.com/api";

// Dados fictícios para sandbox
const CUSTOMER_PAYLOAD = {
  name: "Acme Gestão (Teste)",
  cpfCnpj: "00000000000191", // CNPJ fictício válido no sandbox
  email: "faturamento@acme-gestao.sandbox",
  phone: "11999990000",
  notificationDisabled: true,
};

// ── Força conexão com Firestore real (ignora emulator se configurado) ───────
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// ── Firebase Admin ──────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}
const db = admin.firestore();

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!ASAAS_API_KEY) {
    console.error("❌  ASAAS_API_KEY não encontrada no .env.local");
    process.exit(1);
  }

  console.log(`🔗  Asaas URL: ${ASAAS_BASE_URL}`);
  console.log(`📦  Criando customer para org: ${ORG_ID}`);

  // 1. Cria customer no Asaas
  const res = await fetch(`${ASAAS_BASE_URL}/v3/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(CUSTOMER_PAYLOAD),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌  Asaas error:", res.status, err);
    process.exit(1);
  }

  const customer = await res.json();
  const customerId = customer.id;

  if (!customerId) {
    console.error("❌  Asaas não retornou ID:", customer);
    process.exit(1);
  }

  console.log(`✅  Customer criado: ${customerId}`);

  // 2. Salva no Firestore
  const orgRef = db.collection("orgs").doc(ORG_ID);
  const orgSnap = await orgRef.get();

  if (!orgSnap.exists) {
    console.error(`❌  Org "${ORG_ID}" não encontrada no Firestore`);
    process.exit(1);
  }

  await orgRef.update({ asaas_customer_id: customerId });
  console.log(`✅  Firestore atualizado: orgs/${ORG_ID}.asaas_customer_id = ${customerId}`);
  console.log("🎉  Pronto. Acesse /configuracoes/faturamento para verificar.");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Erro inesperado:", err);
  process.exit(1);
});
