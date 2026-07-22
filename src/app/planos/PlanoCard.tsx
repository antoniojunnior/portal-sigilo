"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PlanoConfig } from "@/lib/types";

export interface PlanoCardProps {
  plano: PlanoConfig;
  parcelas: number;
}

export function PlanoCard({ plano, parcelas }: PlanoCardProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleContratar() {
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: plano.id, parcelas }),
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

  const precoAnual = plano.precoAnual ?? 0;
  const valorParcela = parcelas > 1 ? Math.ceil(precoAnual / parcelas) : precoAnual;

  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border p-8 transition-shadow",
        "shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
        "border-2 border-[var(--color-primary)] bg-[var(--color-primary-surface)]",
      ].filter(Boolean).join(" ")}
    >
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-4 py-1 text-[var(--text-xs)] font-semibold text-white">
        Plano único
      </span>

      <div className="mb-6">
        <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
          {plano.nome}
        </h2>
        {plano.tagline && (
          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {plano.tagline}
          </p>
        )}
        <div className="mt-4">
          {parcelas === 1 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                  R$ {precoAnual.toLocaleString("pt-BR")}
                </span>
                <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">/ano</span>
              </div>
              <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                Pagamento único anual
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                  {parcelas}x R$ {valorParcela.toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                R$ {precoAnual.toLocaleString("pt-BR")} no total, em {parcelas}x sem juros
              </p>
            </>
          )}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plano.features.map((f) => (
          <li
            key={f.descricao}
            className="flex items-center gap-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]"
          >
            <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
            <span>{f.descricao}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3">
        {erro && (
          <p
            role="alert"
            className="rounded bg-[var(--color-danger-surface)] px-3 py-2 text-[var(--text-xs)] text-[var(--color-danger)]"
          >
            {erro}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleContratar}
        >
          Contratar agora
        </Button>
        <p className="text-center text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
          Cartão tokenizado. Cobrado automaticamente a cada ano.
        </p>
      </div>
    </div>
  );
}
