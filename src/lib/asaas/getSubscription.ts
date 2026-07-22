import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { getInvoices, type Invoice } from "@/lib/asaas/getInvoices";

export interface SubscriptionData {
  source: "firestore";
  plano_ativo: string;
  valor: number | null;
  ciclo: "YEARLY" | null;
  proximo_vencimento: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DISPUTED" | null;
  subscription_id: null;
  parcelas: number | null;
  renovacao_cancelada: boolean;
}

/**
 * BUG-20260722-T6R2: mapeamento explícito por status real da Asaas (não via default).
 * REFUNDED/CHARGEBACK_* → DISPUTED (decisão de produto: não reaproveitar SUSPENDED,
 * admin precisa distinguir estorno/disputa de simples atraso).
 */
export function mapInvoiceStatusToSubscriptionStatus(
  status: Invoice["status"]
): SubscriptionData["status"] {
  switch (status) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "ACTIVE";
    case "OVERDUE":
      return "SUSPENDED";
    case "CANCELLED":
      return "INACTIVE";
    case "REFUNDED":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
      return "DISPUTED";
    default:
      return "ACTIVE";
  }
}

export async function getSubscription(orgId: string): Promise<SubscriptionData | null> {
  const orgDoc = await adminDb.collection("orgs").doc(orgId).get();

  if (!orgDoc.exists) return null;

  const orgData = orgDoc.data()!;
  const planoAtivo = orgData.plano_ativo as string | undefined;
  const dataRenovacao = orgData.data_renovacao as { toDate?: () => Date } | undefined;
  const proximaCobrancaParcelas = (orgData.proxima_cobranca_parcelas as number | undefined) ?? 12;
  const renovacaoCancelada = (orgData.renovacao_cancelada as boolean) ?? false;
  const customerId = orgData.asaas_customer_id as string | undefined;

  let valor: number | null = null;
  let status: SubscriptionData["status"] = null;

  if (customerId) {
    const invoices = await getInvoices(customerId);
    if (invoices.length > 0) {
      const lastInvoice: Invoice = invoices[0];
      valor = lastInvoice.valor;
      status = mapInvoiceStatusToSubscriptionStatus(lastInvoice.status);
    }
  }

  return {
    source: "firestore",
    plano_ativo: planoAtivo ?? "unico",
    valor,
    ciclo: "YEARLY",
    proximo_vencimento: dataRenovacao?.toDate?.()?.toISOString?.() ?? null,
    status,
    subscription_id: null,
    parcelas: proximaCobrancaParcelas,
    renovacao_cancelada: renovacaoCancelada,
  };
}
