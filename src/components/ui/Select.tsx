"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  srOnly?: boolean;
  options: SelectOption[];
  placeholder?: string;
  helper?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      srOnly = false,
      options,
      placeholder,
      helper,
      error,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const helperId = helper ? `${selectId}-helper` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={selectId}
          className={[
            "text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]",
            srOnly ? "sr-only" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            className={[
              "w-full min-h-[44px] rounded-2xl border px-3.5 py-2 pr-10 appearance-none",
              "bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)]",
              "transition-colors duration-[var(--duration-fast)] cursor-pointer",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-[var(--color-border-error)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]"
            aria-hidden
          >
            <ChevronDown size={16} strokeWidth={1.5} />
          </span>
        </div>

        {helper && !error && (
          <p id={helperId} className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
            {helper}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-[var(--text-xs)] text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
