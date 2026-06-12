import "server-only";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";
import type { BillingCycle } from "@/lib/types";

export type PlanoId = "entrada" | "gestao";

const PLANOS_CONFIG = {
  entrada: {
    mensal: { nome: "Portal Sigilo — Entrada (Mensal)", value: 117.0, cycle: "MONTHLY" },
    anual:  { nome: "Portal Sigilo — Entrada (Anual)",  value: 97.0,  cycle: "YEARLY" },
  },
  gestao: {
    mensal: { nome: "Portal Sigilo — Gestão (Mensal)", value: 227.0, cycle: "MONTHLY" },
    anual:  { nome: "Portal Sigilo — Gestão (Anual)",  value: 197.0, cycle: "YEARLY" },
  },
} as const;

export async function createPaymentLink(
  plano: PlanoId,
  ciclo: BillingCycle
): Promise<{ url: string }> {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  const config = PLANOS_CONFIG[plano][ciclo];

  const res = await fetch(`${ASAAS_BASE_URL}/v3/paymentLinks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify({
      name: config.nome,
      billingType: "CREDIT_CARD",
      chargeType: "RECURRENT",
      cycle: config.cycle,
      value: config.value,
      description: `Assinatura ${config.nome}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[createPaymentLink] Asaas error:", err);
    throw new Error("Falha ao criar link de pagamento");
  }

  const data = (await res.json()) as { url?: string };

  if (!data.url) {
    console.error("[createPaymentLink] Asaas não retornou URL:", data);
    throw new Error("Falha ao obter link de pagamento");
  }

  return { url: data.url };
}
