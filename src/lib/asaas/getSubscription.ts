import "server-only";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";

export interface SubscriptionData {
  source: "asaas" | "firestore";
  plano_ativo: string;
  valor: number | null;
  ciclo: "MONTHLY" | "YEARLY" | null;
  proximo_vencimento: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
  subscription_id: string | null;
}

interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
  cycle: string;
  nextDueDate: string;
}

interface AsaasListResponse {
  data?: AsaasSubscription[];
}

const VALUE_TO_PLANO: Record<number, string> = {
  117: "entrada",
  97: "entrada",
  227: "gestao",
  197: "gestao",
};

export async function getSubscription(customerId: string): Promise<SubscriptionData | null> {
  if (!ASAAS_API_KEY) return null;

  try {
    const res = await fetch(
      `${ASAAS_BASE_URL}/v3/subscriptions?customer=${encodeURIComponent(customerId)}&status=ACTIVE&limit=1`,
      { headers: { access_token: ASAAS_API_KEY } }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as AsaasListResponse;
    const sub = data.data?.[0];
    if (!sub) return null;

    return {
      source: "asaas",
      plano_ativo: VALUE_TO_PLANO[sub.value] ?? "gestao",
      valor: sub.value ?? null,
      ciclo: (sub.cycle as "MONTHLY" | "YEARLY") ?? null,
      proximo_vencimento: sub.nextDueDate ?? null,
      status: (sub.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") ?? null,
      subscription_id: sub.id ?? null,
    };
  } catch {
    return null;
  }
}
