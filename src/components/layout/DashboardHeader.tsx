"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  /** ISO date range label, e.g. "Últimos 30 dias" */
  periodLabel?: string;
  /** Unread notification count */
  notifications?: number;
  /** Current user (overrides auth context if provided) */
  user?: { name: string; avatarUrl?: string };
  onMenuToggle?: () => void;
  className?: string;
}

export function DashboardHeader({
  breadcrumbs = [],
  periodLabel,
  notifications,
  user: userProp,
  onMenuToggle,
  className = "",
}: DashboardHeaderProps) {
  const { user: authUser, signOut } = useAuth();
  const displayUser = userProp ?? (authUser ? { name: authUser.nome } : undefined);

  return (
    <header
      className={[
        "sticky top-0 z-[var(--z-sticky)]",
        "bg-[var(--color-card)] border-b border-[var(--color-border)]",
        "px-5 flex-shrink-0 flex items-center gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ minHeight: "var(--dashboard-header-height)" }}
    >
      {/* Mobile menu toggle */}
      {onMenuToggle && (
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Navegação por trilha" className="flex-1 min-w-0">
          <ol className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-[var(--color-text-tertiary)] text-[var(--text-xs)]" aria-hidden>
                    /
                  </span>
                )}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <a
                    href={crumb.href}
                    className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors truncate max-w-[120px]"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    aria-current="page"
                    className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] truncate max-w-[160px]"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {/* Period label */}
        {periodLabel && (
          <span className="hidden sm:inline text-[var(--text-xs)] text-[var(--color-text-tertiary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2.5 py-1">
            {periodLabel}
          </span>
        )}

        {/* Notifications */}
        {notifications !== undefined && (
          <button
            type="button"
            aria-label={`${notifications} notificações não lidas`}
            className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M8 2a5 5 0 0 0-5 5v2l-1 2h12l-1-2V7a5 5 0 0 0-5-5zM6 13a2 2 0 0 0 4 0" strokeLinecap="round"/>
            </svg>
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" aria-hidden />
            )}
          </button>
        )}

        {/* User name + logout */}
        {displayUser && (
          <div className="flex items-center gap-2">
            <Avatar
              src={displayUser.avatarUrl}
              name={displayUser.name}
              size="sm"
            />
            {authUser && (
              <button
                type="button"
                onClick={signOut}
                aria-label="Sair"
                title="Sair"
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-danger)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              >
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
                  <path d="M10 11l3-3-3-3M13 8H6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
