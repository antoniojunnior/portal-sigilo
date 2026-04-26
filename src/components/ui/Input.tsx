"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label — always required for a11y */
  label: string;
  /** Hide label visually but keep it for screen readers */
  srOnly?: boolean;
  helper?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      srOnly = false,
      helper,
      error,
      iconLeft,
      iconRight,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={inputId}
          className={[
            "text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]",
            srOnly ? "sr-only" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </label>

        <div className="relative flex items-center">
          {iconLeft && (
            <span
              className="absolute left-3 flex items-center text-[var(--color-text-tertiary)] pointer-events-none"
              aria-hidden
            >
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            className={[
              "w-full min-h-[44px] rounded-[var(--radius-md)] border px-3.5 py-2",
              "bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)]",
              "placeholder:text-[var(--color-text-tertiary)]",
              "transition-colors duration-[var(--duration-fast)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-[var(--color-border-error)] focus-visible:ring-[var(--color-border-error)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
              iconLeft ? "pl-10" : "",
              iconRight ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {iconRight && (
            <span
              className="absolute right-3 flex items-center text-[var(--color-text-tertiary)] pointer-events-none"
              aria-hidden
            >
              {iconRight}
            </span>
          )}
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

Input.displayName = "Input";
