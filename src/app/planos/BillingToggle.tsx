"use client";

export interface ParcelamentoToggleProps {
  value: number;
  onChange: (parcelas: number) => void;
}

const PARCELAS_OPTIONS = [
  { value: 1, label: "À vista" },
  { value: 3, label: "3x" },
  { value: 6, label: "6x" },
  { value: 9, label: "9x" },
  { value: 12, label: "12x" },
];

export function BillingToggle({ value, onChange }: ParcelamentoToggleProps) {
  return (
    <div
      role="group"
      aria-label="Forma de pagamento"
      className="inline-flex flex-wrap items-center justify-center min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-1 gap-1"
    >
      {PARCELAS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            "rounded-full px-4 py-2 text-[var(--text-sm)] font-medium transition-colors",
            value === opt.value
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          ].filter(Boolean).join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
