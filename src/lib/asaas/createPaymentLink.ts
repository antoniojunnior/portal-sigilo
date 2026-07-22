import "server-only";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";
import { PLANO_PRECO_ANUAL } from "@/lib/planos-config";

export async function createPaymentLink(
  plano: string,
  parcelas: number
): Promise<{ url: string }> {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  const res = await fetch(`${ASAAS_BASE_URL}/v3/paymentLinks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify({
      name: "Portal Sigilo — Plano Único (Anual)",
      billingType: "CREDIT_CARD",
      chargeType: "INSTALLMENT",
      maxInstallmentCount: parcelas,
      value: PLANO_PRECO_ANUAL,
      description: "Assinatura anual do Portal Sigilo — Plano Único",
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
