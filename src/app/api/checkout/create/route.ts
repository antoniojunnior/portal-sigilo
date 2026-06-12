import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPaymentLink } from "@/lib/asaas/createPaymentLink";
import type { BillingCycle } from "@/lib/types";

type PlanoId = "entrada" | "gestao";

function isPlanoValido(plano: unknown): plano is PlanoId {
  return plano === "entrada" || plano === "gestao";
}

function isCicloValido(ciclo: unknown): ciclo is BillingCycle {
  return ciclo === "mensal" || ciclo === "anual";
}

export async function POST(request: NextRequest) {
  let body: { plano?: unknown; ciclo?: unknown };
  try {
    body = (await request.json()) as { plano?: unknown; ciclo?: unknown };
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { plano, ciclo } = body;

  if (!isPlanoValido(plano)) {
    return NextResponse.json(
      { error: "Plano inválido. Valores aceitos: entrada, gestao" },
      { status: 400 }
    );
  }

  if (ciclo !== undefined && !isCicloValido(ciclo)) {
    return NextResponse.json(
      { error: "Ciclo inválido. Valores aceitos: mensal, anual" },
      { status: 400 }
    );
  }

  const cicloFinal: BillingCycle = isCicloValido(ciclo) ? ciclo : "mensal";

  try {
    const { url } = await createPaymentLink(plano, cicloFinal);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "ASAAS_API_KEY não configurada") {
      console.error("[checkout/create] ASAAS_API_KEY não configurada");
      return NextResponse.json(
        { error: "Serviço de pagamento não configurado." },
        { status: 503 }
      );
    }

    if (
      message === "Falha ao criar link de pagamento" ||
      message === "Falha ao obter link de pagamento"
    ) {
      return NextResponse.json(
        { error: "Falha ao criar link de pagamento. Tente novamente." },
        { status: 502 }
      );
    }

    console.error("[checkout/create] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
