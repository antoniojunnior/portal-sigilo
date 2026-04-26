interface AnonymousBadgeProps {
  className?: string;
  showLabel?: boolean;
  "aria-label"?: string;
}

export function AnonymousBadge({
  className = "",
  showLabel = true,
  "aria-label": ariaLabel = "Sua identidade está protegida",
}: AnonymousBadgeProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={["inline-flex items-center gap-1.5 rounded-full", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        padding: "4px 10px",
        background: "var(--color-anon-bg)",
        border: "0.5px solid var(--color-anon-border)",
      }}
    >
      <span
        className="animate-pulse-slow flex-shrink-0 rounded-full"
        style={{ width: 5, height: 5, background: "var(--color-anon-dot)" }}
        aria-hidden
      />
      {showLabel && (
        <span
          className="whitespace-nowrap"
          style={{ fontSize: 11, fontWeight: 500, color: "var(--color-anon-text)" }}
        >
          Anônimo
        </span>
      )}
    </span>
  );
}
