import "server-only";
import { adminDb } from "@/lib/firebase-admin/admin";
import { getInvoices, type Invoice } from "@/lib/asaas/getInvoices";

export interface SubscriptionData {
  source: "firestore";
  plano_ativo: string;
  valor: number | null;
  ciclo: "YEARLY" | null;
  proximo_vencimento: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
  subscription_id: null;
  parcelas: number | null;
  renovacao_cancelada: boolean;
}

export async function getSubscription(customerId: string): Promise<SubscriptionData | null> {
  const orgSnap = await adminDb
    .collection("orgs")
    .where("asaas_customer_id", "==", customerId)
    .limit(1)
    .get();

  if (orgSnap.empty) return null;

  const orgData = orgSnap.docs[0].data();
  const planoAtivo = orgData.plano_ativo as string | undefined;
  const dataRenovacao = orgData.data_renovacao as { toDate?: () => Date } | undefined;
  const proximaCobrancaParcelas = (orgData.proxima_cobranca_parcelas as number | undefined) ?? 12;
  const renovacaoCancelada = (orgData.renovacao_cancelada as boolean) ?? false;

  let valor: number | null = null;
  let status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null = null;

  const invoices = await getInvoices(customerId);
  if (invoices.length > 0) {
    const lastInvoice: Invoice = invoices[0];
    valor = lastInvoice.valor;
    switch (lastInvoice.status) {
      case "RECEIVED":
        status = "ACTIVE";
        break;
      case "OVERDUE":
        status = "SUSPENDED";
        break;
      case "CANCELLED":
        status = "INACTIVE";
        break;
      default:
        status = "ACTIVE";
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
