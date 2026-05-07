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
        "group flex items-start gap-4 py-4 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)]/30 transition-colors px-2 -mx-2 rounded-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)] flex items-center justify-center mt-0.5"
          aria-hidden
        >
          {icon}
        </span>
      ) : (
        <span
          className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-border-strong)] mt-2.5 group-hover:bg-[var(--color-primary)] transition-colors"
          aria-hidden
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] truncate">{action}</p>
          <time className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)] flex-shrink-0" dateTime={timestamp}>{formatted}</time>
        </div>
        {details && (
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-1 italic">{details}</p>
        )}
        <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-0.5">
          Realizado por <span className="font-semibold text-[var(--color-text-primary)]">{user}</span>
        </p>
      </div>
    </div>
  );
}

