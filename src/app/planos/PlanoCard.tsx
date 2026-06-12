"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clientEnv } from "@/lib/env.client";
import type { PlanoConfig, BillingCycle } from "@/lib/types";

export interface PlanoCardProps {
  plano: PlanoConfig;
  ciclo: BillingCycle;
  isCurrentPlan?: boolean;
  onAction?: () => void;
}

function getCTA(planoId: string, destaque: boolean | undefined, ciclo: BillingCycle): string {
  if (planoId === "entrada") {
    return ciclo === "anual" ? "Garantir desconto anual" : "Começar agora";
  }
  if (destaque) {
    return ciclo === "anual" ? "Garantir desconto anual" : "Escolher o mais popular";
  }
  return ciclo === "anual" ? "Garantir desconto anual" : "Contratar";
}

export function PlanoCard({ plano, ciclo, onAction }: PlanoCardProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleContratar() {
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: plano.id, ciclo }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErro(data.error ?? "Erro ao iniciar checkout. Tente novamente.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleEnterprise() {
    window.location.href = clientEnv.salesContact;
  }

  const isEnterprise = plano.id === "enterprise";
  const preco = ciclo === "anual" ? plano.precoAnual : plano.precoMensal;

  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border p-6 transition-shadow",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        plano.destaque
          ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary-surface)] md:-translate-y-1 md:shadow-[var(--shadow-lg)]"
          : "border border-[var(--color-border)] bg-[var(--color-card)]",
      ].filter(Boolean).join(" ")}
    >
      {plano.destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[var(--text-xs)] font-semibold text-white">
          Mais popular
        </span>
      )}

      <div className="mb-4">
        <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
          {plano.nome}
        </h2>
        {plano.tagline && (
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {plano.tagline}
          </p>
        )}
        <div className="mt-3">
          {isEnterprise ? (
            <p className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
              Sob consulta
            </p>
          ) : ciclo === "anual" ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                  R$ {preco}
                </span>
                <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">/mês</span>
              </div>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                R$ {(preco! * 12).toLocaleString("pt-BR")} cobrados anualmente
              </p>
              {plano.economiaAnual && (
                <span className="mt-2 inline-block rounded-full bg-[var(--color-success-surface)] px-3 py-1 text-[var(--text-xs)] font-semibold text-[var(--color-success)]">
                  Economia de R$ {plano.economiaAnual}/ano
                </span>
              )}
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)] line-through">
                R$ {plano.precoMensal}/mês
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                  R$ {preco}
                </span>
                <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">/mês</span>
              </div>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                ou R$ {plano.precoAnual}/mês no plano anual
              </p>
            </>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plano.features.map((f) => (
          <li
            key={f.descricao}
            className={[
              "flex items-center gap-2 text-[var(--text-sm)]",
              f.disponivel
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-disabled)]",
            ].filter(Boolean).join(" ")}
          >
            {f.disponivel ? (
              <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)]" />
            )}
            <span className={f.disponivel ? "" : "line-through opacity-50"}>
              {f.descricao}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2">
        {erro && (
          <p
            role="alert"
            className="rounded bg-[var(--color-danger-surface)] px-3 py-2 text-[var(--text-xs)] text-[var(--color-danger)]"
          >
            {erro}
          </p>
        )}
        {isEnterprise ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onAction ?? handleEnterprise}
          >
            Falar com vendas
          </Button>
        ) : (
          <Button
            variant={plano.destaque ? "primary" : "secondary"}
            size="lg"
            fullWidth
            loading={loading}
            onClick={onAction ?? handleContratar}
          >
            {getCTA(plano.id, plano.destaque, ciclo)}
          </Button>
        )}
      </div>
    </div>
  );
}
