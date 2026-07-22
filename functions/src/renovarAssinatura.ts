import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
}

function getEndOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/** CANONICAL: src/lib/planos-config.ts. Mantenha sincronizado. */
const PLANO_PRECO_ANUAL = 1164;

function getAsaasBaseUrl(): string {
  return process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api"
    : "https://api.asaas.com/api";
}

/**
 * Cria a cobrança de renovação anual reutilizando o creditCardToken salvo.
 * A Asaas exige `installmentValue` (valor de CADA parcela) quando `installmentCount`
 * é enviado — não `value` (valor total), que a API rejeita com invalid_installmentValue.
 */
export async function criarCobrancaRenovacao(
  customerId: string,
  creditCardToken: string,
  parcelas: number
): Promise<Response> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada");
  }
  const installmentValue = Math.round((PLANO_PRECO_ANUAL / parcelas) * 100) / 100;
  return fetch(`${getAsaasBaseUrl()}/v3/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: "CREDIT_CARD",
      installmentCount: parcelas,
      installmentValue,
      creditCardToken,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Portal Sigilo — Renovação anual (${parcelas}x)`,
    }),
  });
}

async function atualizarPlanoOrg(
  customerId: string,
  novoStatus: "suspenso",
  acao: string
): Promise<string | null> {
  const snap = await db
    .collection("orgs")
    .where("asaas_customer_id", "==", customerId)
    .limit(1)
    .get();

  if (snap.empty) {
    logger.warn("[renovarAssinatura] Org não encontrada para customer:", customerId);
    return null;
  }

  const orgDoc = snap.docs[0];
  await orgDoc.ref.update({ plano_ativo: novoStatus });

  const auditRef = db.collection("audit_logs").doc();
  await auditRef.set({
    id: auditRef.id,
    org_id: orgDoc.id,
    user_id: "system",
    acao,
    detalhes: { asaas_customer_id: customerId },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return orgDoc.id;
}

export const renovarAssinatura = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey) {
      logger.error("[renovarAssinatura] ASAAS_API_KEY não configurada — abortando.");
      return;
    }

    const anoAtual = new Date().getFullYear();
    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    const orgsSnap = await db
      .collection("orgs")
      .where("data_renovacao", ">=", admin.firestore.Timestamp.fromDate(startOfToday))
      .where("data_renovacao", "<=", admin.firestore.Timestamp.fromDate(endOfToday))
      .get();

    if (orgsSnap.empty) {
      logger.info("[renovarAssinatura] Nenhuma org com renovação hoje.");
      return;
    }

    const promises = orgsSnap.docs.map(async (orgDoc) => {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      const customerId = orgData.asaas_customer_id as string | undefined;
      const token = orgData.asaas_credit_card_token as string | null | undefined;
      const parcelas = (orgData.proxima_cobranca_parcelas as number | undefined) ?? 12;
      const cancelada = (orgData.renovacao_cancelada as boolean) ?? false;
      const ultimoCiclo = orgData.ultima_cobranca_ciclo as number | undefined;

      if (cancelada) {
        logger.info(`[renovarAssinatura] Org ${orgId}: renovacao_cancelada — pulando.`);
        return;
      }

      if (ultimoCiclo === anoAtual) {
        logger.info(`[renovarAssinatura] Org ${orgId}: ciclo ${anoAtual} já cobrado (idempotência) — pulando.`);
        return;
      }

      if (!customerId || !token) {
        logger.warn(`[renovarAssinatura] Org ${orgId}: sem customer_id ou credit_card_token — suspendendo.`);
        await atualizarPlanoOrg(customerId ?? "desconhecido", "suspenso", "plan_suspended");
        return;
      }

      try {
        const res = await criarCobrancaRenovacao(customerId, token, parcelas);

        if (!res.ok) {
          const errText = await res.text();
          logger.error(`[renovarAssinatura] Falha ao criar cobrança para org ${orgId}:`, errText);
          await atualizarPlanoOrg(customerId, "suspenso", "plan_suspended");
          return;
        }

        const dataRenovacao = new Date();
        dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);

        await orgDoc.ref.update({
          data_renovacao: admin.firestore.Timestamp.fromDate(dataRenovacao),
          ultima_cobranca_ciclo: anoAtual,
        });

        const auditRef = db.collection("audit_logs").doc();
        await auditRef.set({
          id: auditRef.id,
          org_id: orgId,
          user_id: "system",
          acao: "renovacao_anual_cobrada",
          detalhes: { parcelas, ciclo: anoAtual },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`[renovarAssinatura] Renovação cobrada para org ${orgId}: ${parcelas}x, ciclo ${anoAtual}`);
      } catch (err) {
        logger.error(`[renovarAssinatura] Erro na renovação para org ${orgId}:`, err);
        await atualizarPlanoOrg(customerId, "suspenso", "plan_suspended");
      }
    });

    await Promise.allSettled(promises);
    logger.info("[renovarAssinatura] Ciclo diário de renovação concluído.");
  }
);
