import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "@/lib/env";

const PLANOS_CONFIG = {
  entrada: {
    nome: "Portal Sigilo — Plano Entrada",
    value: 117.0,
  },
  gestao: {
    nome: "Portal Sigilo — Plano Gestão",
    value: 227.0,
  },
} as const;

type PlanoId = keyof typeof PLANOS_CONFIG;

function isPlanoValido(plano: unknown): plano is PlanoId {
  return typeof plano === "string" && plano in PLANOS_CONFIG;
}

export async function POST(request: NextRequest) {
  let body: { plano?: unknown };
  try {
    body = (await request.json()) as { plano?: unknown };
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { plano } = body;

  if (!isPlanoValido(plano)) {
    return NextResponse.json(
      { error: "Plano inválido. Valores aceitos: entrada, gestao" },
      { status: 400 }
    );
  }

  if (!ASAAS_API_KEY) {
    console.error("[checkout/create] ASAAS_API_KEY não configurada");
    return NextResponse.json(
      { error: "Serviço de pagamento não configurado." },
      { status: 503 }
    );
  }

  const config = PLANOS_CONFIG[plano];

  try {
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/v3/paymentLinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: config.nome,
        billingType: "CREDIT_CARD",
        chargeType: "RECURRENT",
        cycle: "MONTHLY",
        value: config.value,
        description: `Assinatura ${config.nome}`,
      }),
    });

    if (!asaasRes.ok) {
      const err = await asaasRes.text();
      console.error("[checkout/create] Asaas error:", err);
      return NextResponse.json(
        { error: "Falha ao criar link de pagamento. Tente novamente." },
        { status: 502 }
      );
    }

    const data = (await asaasRes.json()) as { url?: string };

    if (!data.url) {
      console.error("[checkout/create] Asaas não retornou URL:", data);
      return NextResponse.json(
        { error: "Falha ao obter link de pagamento." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error("[checkout/create] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
