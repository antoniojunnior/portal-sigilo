import "server-only";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

  const res = await fetch(
    `${ASAAS_BASE_URL}/v3/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "DELETE",
      headers: { access_token: ASAAS_API_KEY },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[cancelSubscription] Asaas error:", err);
    throw new Error("Falha ao cancelar assinatura no Asaas");
  }
}
