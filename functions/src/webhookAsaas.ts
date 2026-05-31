import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AsaasWebhookPayload {
  event:
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_OVERDUE"
    | "SUBSCRIPTION_CANCELED"
    | "SUBSCRIPTION_INACTIVATED";
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    billingType: string;
    description?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
    cycle: "MONTHLY" | "YEARLY";
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gerarSenhaTemporaria(): string {
  return crypto.randomBytes(16).toString("hex");
}

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  companyName?: string;
}

async function buscarDadosCliente(
  customerId: string
): Promise<{ email: string; nome: string } | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl =
    process.env.ASAAS_SANDBOX === "true"
      ? "https://sandbox.asaas.com/api"
      : "https://api.asaas.com/api";

  if (!apiKey) {
    logger.warn("[webhookAsaas] ASAAS_API_KEY não configurada — usando dados placeholder.");
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/v3/customers/${customerId}`, {
      headers: { access_token: apiKey },
    });
    if (!response.ok) {
      logger.warn("[webhookAsaas] Falha ao buscar cliente Asaas:", response.status);
      return null;
    }
    const customer = (await response.json()) as AsaasCustomer;
    return {
      email: customer.email,
      nome: customer.companyName ?? customer.name,
    };
  } catch (err) {
    logger.error("[webhookAsaas] Erro ao buscar dados do cliente:", err);
    return null;
  }
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function determinarPlano(payload: AsaasWebhookPayload): "entrada" | "gestao" {
  const valor = payload.payment?.value ?? 0;
  const ciclo = payload.subscription?.cycle;
  if (valor >= 197 || (ciclo === "YEARLY" && valor >= 97)) return "gestao";
  return "entrada";
}

async function logAuditFunction(
  orgId: string,
  acao: string,
  detalhes?: Record<string, unknown>
): Promise<void> {
  try {
    const ref = db.collection("audit_logs").doc();
    await ref.set({
      id: ref.id,
      org_id: orgId,
      user_id: "system",
      acao,
      ...(detalhes ? { detalhes } : {}),
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error("[webhookAsaas] Falha ao gravar audit log:", err);
  }
}

// ─── Provisionamento de org ───────────────────────────────────────────────────

async function provisionOrg(payload: AsaasWebhookPayload): Promise<void> {
  const customerId = payload.payment?.customer ?? payload.subscription?.customer;
  if (!customerId) {
    logger.warn("[webhookAsaas] Payload sem customer id — ignorado.");
    return;
  }

  // Idempotência: verificar se org já existe
  const existing = await db
    .collection("orgs")
    .where("asaas_customer_id", "==", customerId)
    .limit(1)
    .get();

  if (!existing.empty) {
    logger.info("[webhookAsaas] Org já provisionada para customer:", customerId);
    return;
  }

  const planoAtivo = determinarPlano(payload);
  const orgId = crypto.randomUUID();

  // WH-002: buscar email e nome reais do cliente via API Asaas
  const dadosCliente = await buscarDadosCliente(customerId);
  const adminEmail =
    dadosCliente?.email ?? `admin-${orgId.slice(0, 8)}@portalsigilo-pending.com`;
  const nomeOrg = dadosCliente?.nome ?? `Org ${customerId.slice(-6)}`;

  // WH-003: sempre adicionar sufixo aleatório — elimina TOCTOU race condition
  const slug = `${gerarSlug(nomeOrg)}-${crypto.randomBytes(3).toString("hex")}`;

  const agora = FieldValue.serverTimestamp();
  const dataRenovacao = new Date();
  dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);

  // Criar org
  await db.collection("orgs").doc(orgId).set({
    id: orgId,
    nome: nomeOrg,
    slug,
    plano_ativo: planoAtivo,
    asaas_customer_id: customerId,
    asaas_subscription_id: payload.payment?.subscription ?? payload.subscription?.id ?? null,
    data_inicio: agora,
    data_renovacao: admin.firestore.Timestamp.fromDate(dataRenovacao),
    criado_em: agora,
    configuracoes: {
      categorias: ["fraude", "assédio", "corrupção", "segurança", "outros"],
      boas_vindas: "Canal de denúncias ativo. Relate com segurança e anonimato.",
      prazo_padrao_dias: 30,
    },
  });

  // Criar usuário admin
  const senhaTemporaria = gerarSenhaTemporaria();
  let adminUid: string;
  try {
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: senhaTemporaria,
    });
    adminUid = userRecord.uid;
    await admin.auth().setCustomUserClaims(adminUid, { org_id: orgId, role: "admin" });
  } catch (err) {
    logger.error("[webhookAsaas] Falha ao criar usuário admin:", err);
    throw err;
  }

  // Criar documento do usuário
  await db.collection("users").doc(adminUid).set({
    id: adminUid,
    org_id: orgId,
    email: adminEmail,
    role: "admin",
    ativo: true,
    criado_em: agora,
  });

  // Audit log
  await logAuditFunction(orgId, "org_created", {
    plano: planoAtivo,
    asaas_customer_id: customerId,
  });

  // E-mail de boas-vindas (falha não bloqueia provisionamento)
  try {
    await db.collection("mail").add({
      to: adminEmail,
      message: {
        subject: "Bem-vindo ao Portal Sigilo — Acesse seu dashboard",
        html: `
          <h1>Bem-vindo ao Portal Sigilo!</h1>
          <p>Sua organização foi provisionada com sucesso.</p>
          <ul>
            <li><strong>Plano:</strong> ${planoAtivo}</li>
            <li><strong>E-mail de acesso:</strong> ${adminEmail}</li>
            <li><strong>Senha temporária:</strong> ${senhaTemporaria}</li>
          </ul>
          <p>Acesse o dashboard em <a href="https://app.portalsigilo.com.br">app.portalsigilo.com.br</a>.</p>
          <p>Altere sua senha no primeiro acesso.</p>
        `,
      },
    });
  } catch (emailErr) {
    logger.error("[webhookAsaas] Falha ao enviar e-mail de boas-vindas (não crítico):", emailErr);
  }

  logger.info("[webhookAsaas] Org provisionada:", { orgId, planoAtivo, customerId });
}

// ─── Suspensão / Cancelamento ─────────────────────────────────────────────────

async function atualizarPlanoOrg(
  customerId: string,
  novoStatus: "suspenso" | "cancelado",
  acao: string
): Promise<void> {
  const snap = await db
    .collection("orgs")
    .where("asaas_customer_id", "==", customerId)
    .limit(1)
    .get();

  if (snap.empty) {
    logger.warn("[webhookAsaas] Org não encontrada para customer:", customerId);
    return;
  }

  const orgDoc = snap.docs[0];
  await orgDoc.ref.update({ plano_ativo: novoStatus });
  await logAuditFunction(orgDoc.id, acao, { asaas_customer_id: customerId });
}

// ─── Endpoint principal ───────────────────────────────────────────────────────

export const webhookAsaas = onRequest(async (req, res) => {
  // Validação de token — deve ser a primeira operação
  const token = req.headers["asaas-access-token"];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  let tokenValido = false;
  if (token && expectedToken) {
    try {
      tokenValido = crypto.timingSafeEqual(
        Buffer.from(String(token)),
        Buffer.from(expectedToken)
      );
    } catch {
      tokenValido = false;
    }
  }
  if (!tokenValido) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = req.body as AsaasWebhookPayload;

  if (!payload?.event) {
    res.status(400).json({ error: "Payload inválido" });
    return;
  }

  try {
    const customerId =
      payload.payment?.customer ?? payload.subscription?.customer ?? "";

    switch (payload.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        await provisionOrg(payload);
        break;

      case "PAYMENT_OVERDUE":
        if (customerId) {
          await atualizarPlanoOrg(customerId, "suspenso", "plan_suspended");
        }
        break;

      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_INACTIVATED":
        if (customerId) {
          await atualizarPlanoOrg(customerId, "cancelado", "plan_canceled");
        }
        break;

      default:
        // Evento não tratado — retornar 200 para conformidade com retry policy Asaas
        logger.info("[webhookAsaas] Evento ignorado:", payload.event);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error("[webhookAsaas] Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});
