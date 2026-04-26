interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: "search" | "empty" | "error" | "success" | "messages";
  className?: string;
}

const ILLUSTRATIONS: Record<NonNullable<EmptyStateProps["illustration"]>, React.ReactNode> = {
  search: (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <circle cx="21" cy="21" r="12" stroke="currentColor" strokeWidth="2.5" opacity="0.3"/>
      <path d="M30 30l9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M17 21h8M21 17v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" opacity="0.3"/>
      <path d="M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" opacity="0.3"/>
      <path d="M24 16v10M24 30v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  success: (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" opacity="0.3"/>
      <path d="M14 24l8 8 12-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <path d="M36 8H12C9.8 8 8 9.8 8 12v18c0 2.2 1.8 4 4 4h4l4 6 4-6h12c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="2.5" opacity="0.3"/>
      <path d="M16 22h16M16 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
};

export function EmptyState({
  title,
  description,
  action,
  illustration = "empty",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="text-[var(--color-text-tertiary)] mb-4">
        {ILLUSTRATIONS[illustration]}
      </div>

      <p className="text-[var(--text-md)] font-medium text-[var(--color-text-secondary)] mb-1.5">
        {title}
      </p>

      {description && (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] leading-relaxed max-w-xs">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
