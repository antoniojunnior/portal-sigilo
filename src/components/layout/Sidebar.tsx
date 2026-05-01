"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/app",
    label: "Visão geral",
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1"/>
        <rect x="9" y="2" width="5" height="5" rx="1"/>
        <rect x="2" y="9" width="5" height="5" rx="1"/>
        <rect x="9" y="9" width="5" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/app/casos",
    label: "Casos",
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4 2h8c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1z"/>
        <path d="M5 6h6M5 9h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/app/relatorios",
    label: "Relatórios",
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M2 12V9l3-3 3 2 3-4v8H2z"/>
        <path d="M2 14h12" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/app/configuracoes",
    label: "Configurações",
    adminOnly: true,
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="8" cy="8" r="2.5"/>
        <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1" strokeLinecap="round"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className = "", onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const orgInitial = user?.orgName?.charAt(0)?.toUpperCase() ?? "O";

  return (
    <nav
      aria-label="Navegação principal"
      className={[
        "flex flex-col bg-[var(--color-card)] border-r border-[var(--color-border)]",
        "transition-[width] duration-200 ease-[var(--easing-default)] flex-shrink-0",
        collapsed
          ? "w-[var(--sidebar-width-collapsed)]"
          : "w-[var(--sidebar-width-expanded)]",
        "hidden lg:flex", // drawer on mobile — handled by DashboardLayout
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Logo area */}
      <div
        className="flex items-center px-4 border-b border-[var(--color-border)] flex-shrink-0 overflow-hidden"
        style={{ minHeight: "var(--dashboard-header-height)" }}
      >
        <div className="flex-1 overflow-hidden">
          {collapsed ? (
            <LogoSigilo variant="icon" iconSize={24} />
          ) : (
            <LogoSigilo iconSize={28} />
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <p className="text-[9px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 px-1">
            Workspace
          </p>
          <div
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-left"
          >
            <div
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 text-[var(--text-xs)] font-semibold text-[var(--color-on-primary)]"
              style={{ background: "var(--color-primary)" }}
            >
              {orgInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
                {user?.orgName ?? "Carregando..."}
              </p>
              {user?.plano && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] font-semibold px-1 py-0.5 rounded leading-none uppercase"
                    style={{ background: "var(--color-accent-surface)", color: "var(--color-accent-dark)" }}
                  >
                    {user.plano}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-label={collapsed ? item.label : undefined}
              className={[
                "flex items-center gap-3 mx-2 mb-0.5 rounded-[var(--radius-md)] transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
                collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                active
                  ? "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={active ? "text-[var(--color-primary)]" : ""} aria-hidden={!collapsed}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-[var(--text-sm)] font-medium whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto text-[var(--text-xs)] bg-[var(--color-accent-surface)] text-[var(--color-accent)] rounded-full px-1.5 py-0.5 font-medium leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer: logout + collapse */}
      <div className="border-t border-[var(--color-border)] p-2 space-y-0.5">
        <button
          type="button"
          onClick={signOut}
          aria-label="Sair"
          className={[
            "w-full flex items-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)]",
            "hover:bg-[var(--color-danger-surface)] hover:text-[var(--color-danger)] transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
            collapsed ? "justify-center py-2.5" : "gap-2 px-3 py-2.5",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
            <path d="M10 11l3-3-3-3M13 8H6" />
          </svg>
          {!collapsed && (
            <span className="text-[var(--text-xs)] whitespace-nowrap">Sair</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          className={[
            "w-full flex items-center rounded-[var(--radius-md)] text-[var(--color-text-tertiary)]",
            "hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-secondary)] transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
            collapsed ? "justify-center py-2.5" : "gap-2 px-3 py-2.5",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <svg
            viewBox="0 0 16 16"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M10 4L6 8l4 4" />
          </svg>
          {!collapsed && (
            <span className="text-[var(--text-xs)] whitespace-nowrap">Colapsar</span>
          )}
        </button>
      </div>
    </nav>
  );
}
