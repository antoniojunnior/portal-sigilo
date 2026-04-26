"use client";

import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  srOnly?: boolean;
  helper?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      srOnly = false,
      helper,
      error,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const helperId = helper ? `${textareaId}-helper` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={textareaId}
          className={[
            "text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]",
            srOnly ? "sr-only" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={[
            "w-full min-h-[88px] rounded-[var(--radius-md)] border px-3.5 py-2.5 resize-y",
            "bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)]",
            "placeholder:text-[var(--color-text-tertiary)]",
            "transition-colors duration-[var(--duration-fast)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-[var(--color-border-error)] focus-visible:ring-[var(--color-border-error)]"
              : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />

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

Textarea.displayName = "Textarea";
