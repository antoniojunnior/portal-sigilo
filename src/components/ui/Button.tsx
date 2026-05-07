"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style */
  variant?: Variant;
  /** Size preset */
  size?: Size;
  /** Show spinner and disable during loading */
  loading?: boolean;
  /** Stretch to full container width */
  fullWidth?: boolean;
  /** Left-side icon */
  iconLeft?: React.ReactNode;
  /** Right-side icon */
  iconRight?: React.ReactNode;
  /** Accepted for API compatibility but not forwarded to <button> */
  asChild?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] border transition-all focus:outline-none focus-visible:outline-[var(--border-thick)] focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white border-transparent hover:bg-[var(--color-primary-dark)] active:scale-[0.98] [box-shadow:0_2px_8px_rgba(42,96,112,0.30)] hover:[box-shadow:0_4px_14px_rgba(42,96,112,0.40)]",
  secondary:
    "bg-transparent text-[var(--color-text-primary)] border-[var(--color-border-strong)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-bg-secondary)] active:scale-[0.98]",
  danger:
    "bg-[var(--color-danger)] text-white border-transparent hover:bg-[var(--color-danger-light)] active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  xs: "px-2 min-h-[28px] text-[var(--text-2xs)]",
  sm: "px-3 min-h-[32px] text-[var(--text-xs)]",
  md: "px-5 min-h-[44px] text-[var(--text-sm)] font-semibold",
  lg: "px-7 min-h-[52px] text-[var(--text-base)] font-semibold",
};

function Spinner() {
  return (
    <svg
      className="animate-spin"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Primary interactive element. Use `variant` to convey hierarchy.
 * Always passes 44px min-height for touch accessibility (md/lg sizes).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      children,
      className = "",
      asChild: _asChild,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[
          BASE,
          VARIANTS[variant],
          SIZES[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? <Spinner /> : iconLeft}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";
