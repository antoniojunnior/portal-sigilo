interface AuditEntryProps {
  icon?: React.ReactNode;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
  className?: string;
}

export function AuditEntry({ icon, action, user, timestamp, details, className = "" }: AuditEntryProps) {
  const date = new Date(timestamp);
  const formatted = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={[
        "flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)] flex items-center justify-center mt-0.5"
          aria-hidden
        >
          {icon}
        </span>
      ) : (
        <span
          className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-border-strong)] mt-2"
          aria-hidden
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-sm)] text-[var(--color-text-primary)]">{action}</p>
        {details && (
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-0.5">{details}</p>
        )}
        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-0.5">
          {user} · <time dateTime={timestamp}>{formatted}</time>
        </p>
      </div>
    </div>
  );
}
