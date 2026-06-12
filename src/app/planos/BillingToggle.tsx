"use client";

import type { BillingCycle } from "@/lib/types";

export interface BillingToggleProps {
  value: BillingCycle;
  onChange: (ciclo: BillingCycle) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") onChange("mensal");
    if (e.key === "ArrowRight") onChange("anual");
  }

  return (
    <div
      role="group"
      aria-label="Período de cobrança"
      className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-1 gap-1"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-pressed={value === "mensal"}
        onClick={() => onChange("mensal")}
        className={[
          "rounded-full px-5 py-2 text-[var(--text-sm)] font-medium transition-colors",
          value === "mensal"
            ? "bg-[var(--color-primary)] text-white shadow-sm"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
        ].filter(Boolean).join(" ")}
      >
        Mensal
      </button>
      <button
        type="button"
        aria-pressed={value === "anual"}
        onClick={() => onChange("anual")}
        className={[
          "flex items-center gap-2 rounded-full px-5 py-2 text-[var(--text-sm)] font-medium transition-colors",
          value === "anual"
            ? "bg-[var(--color-primary)] text-white shadow-sm"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
        ].filter(Boolean).join(" ")}
      >
        Anual
        {value === "anual" && (
          <span className="rounded-full bg-[var(--color-success-surface)] border border-[var(--color-success)]/30 text-[var(--color-success)] px-2 py-0.5 text-[var(--text-xs)] font-semibold">
            2 meses grátis
          </span>
        )}
      </button>
    </div>
  );
}
