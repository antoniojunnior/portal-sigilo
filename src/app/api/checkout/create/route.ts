import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPaymentLink } from "@/lib/asaas/createPaymentLink";

const PLANO_VALIDO = "unico" as const;

export function isPlanoValido(plano: unknown): plano is typeof PLANO_VALIDO {
  return plano === PLANO_VALIDO;
}

export function isParcelasValido(parcelas: unknown): parcelas is number {
  return typeof parcelas === "number" && Number.isInteger(parcelas) && parcelas >= 1 && parcelas <= 12;
}

export async function POST(request: NextRequest) {
  let body: { plano?: unknown; parcelas?: unknown };
  try {
    body = (await request.json()) as { plano?: unknown; parcelas?: unknown };
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { plano, parcelas } = body;

  if (!isPlanoValido(plano)) {
    return NextResponse.json(
      { error: "Plano inválido. Único valor aceito: unico" },
      { status: 400 }
    );
  }

  if (!isParcelasValido(parcelas)) {
    return NextResponse.json(
      { error: "Parcelamento inválido. Valores aceitos: inteiro de 1 a 12" },
      { status: 400 }
    );
  }

  try {
    const { url } = await createPaymentLink(plano, parcelas);
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
