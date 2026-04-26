import { AnonymousBadge } from "@/components/ui/AnonymousBadge";

interface PortalHeaderProps {
  /** Company logo URL */
  logoSrc?: string | null;
  /** Company name — used as alt text and fallback */
  companyName?: string;
  /** Optional right-side action (e.g., "Acompanhar protocolo" link) */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Sticky portal header. AnonymousBadge always visible.
 * Company brand shown if available; Portal Sigilo brand otherwise.
 */
export function PortalHeader({ logoSrc, companyName, action, className = "" }: PortalHeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-[var(--z-sticky)]",
        "bg-[var(--color-card)] border-b border-[var(--color-border)]",
        "px-5 flex-shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="flex items-center justify-between"
        style={{ minHeight: "var(--portal-header-height)" }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={companyName ? `Logo ${companyName}` : "Logo da empresa"}
              width={120}
              height={28}
              className="h-7 max-w-[120px] object-contain flex-shrink-0"
            />
          ) : companyName ? (
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0"
                aria-hidden
              />
              <span className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] truncate">
                {companyName}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
          <AnonymousBadge />
        </div>
      </div>
    </header>
  );
}
