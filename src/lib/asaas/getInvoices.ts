import "server-only";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";

export type PaymentStatus =
  | "RECEIVED"
  | "PENDING"
  | "OVERDUE"
  | "CANCELLED"
  | "CONFIRMED"
  | "RECEIVED_IN_CASH"
  | "REFUNDED"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE";

export interface Invoice {
  id: string;
  valor: number;
  vencimento: string;
  status: PaymentStatus;
  descricao: string | null;
  invoice_url: string | null;
  data_pagamento: string | null;
}

interface AsaasPayment {
  id: string;
  value: number;
  dueDate: string;
  status: string;
  description?: string;
  invoiceUrl?: string;
  paymentDate?: string;
}

interface AsaasListResponse {
  data?: AsaasPayment[];
}

export async function getInvoices(customerId: string): Promise<Invoice[]> {
  if (!ASAAS_API_KEY) return [];

  // BUG-20260723-ERR1: erro de rede/API não é mais engolido — propaga pro
  // caller (route.ts), que devolve status não-200 pro client distinguir de
  // "org sem faturas" (array vazio legítimo).
  const res = await fetch(
    `${ASAAS_BASE_URL}/v3/payments?customer=${encodeURIComponent(customerId)}&limit=15&sort=dateCreated&order=desc`,
    { headers: { access_token: ASAAS_API_KEY } }
  );
  if (!res.ok) {
    throw new Error(`Asaas GET /v3/payments retornou ${res.status}`);
  }

  const data = (await res.json()) as AsaasListResponse;
  const invoices = (data.data ?? []).map((p) => ({
    id: p.id,
    valor: p.value,
    vencimento: p.dueDate,
    status: (p.status as Invoice["status"]) ?? "PENDING",
    descricao: p.description ?? null,
    invoice_url: p.invoiceUrl ?? null,
    data_pagamento: p.paymentDate ?? null,
  }));

  // BUG-20260723-SRT1: sort/order enviados à Asaas não são documentados
  // publicamente — não confia que a API de fato ordena; ordena localmente
  // por vencimento (mais recente primeiro) pra garantir "as 15 mais recentes".
  return invoices.sort(
    (a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()
  );
}
