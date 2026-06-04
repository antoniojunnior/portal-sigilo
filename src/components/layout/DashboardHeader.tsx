"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import useSWR from "swr";

const PLANO_BADGE: Record<string, { label: string; className: string }> = {
  entrada: { label: "Entrada", className: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]" },
  gestao: { label: "Gestão", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  enterprise: { label: "Enterprise", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  suspenso: { label: "Suspenso", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
  cancelado: { label: "Cancelado", className: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gestor: "Gestor",
  auditor: "Auditor",
};

interface DashboardHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  periodLabel?: string;
  notifications?: number;
  user?: { name: string; avatarUrl?: string };
  /** Kept for API compatibility; no-op in current layout */
  onMenuToggle?: () => void;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DashboardHeader({
  breadcrumbs = [],
  periodLabel,
  notifications: initialNotifications = 0,
  user: userProp,
  className = "",
}: DashboardHeaderProps) {
  const { user: authUser, signOut } = useAuth();
  const displayUser = userProp ?? (authUser ? { name: authUser.nome } : undefined);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: notificationData } = useSWR<{ unreadCount: number }>(
    authUser ? "/api/dashboard/notifications/count" : null,
    fetcher,
    { refreshInterval: 30000, fallbackData: { unreadCount: initialNotifications } }
  );

  const unreadCount = notificationData?.unreadCount ?? initialNotifications;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [profileOpen]);

  return (
    <header
      className={`sticky top-0 z-30 flex h-[var(--dashboard-header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/92 px-4 backdrop-blur-md md:px-6 ${className}`}
    >
      {/* Left — logo (mobile) | org + breadcrumbs (desktop) */}
      <div className="flex items-center gap-3">
        <Link
          href="/app"
          className="lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-surface)] rounded-xl"
        >
          <LogoSigilo variant="full" iconSize={28} />
        </Link>

        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {authUser?.orgName || "Portal Sigilo"}
          </p>
          {breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-2">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]"
              >
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="opacity-40">›</span>}
                    {b.href ? (
                      <Link
                        href={b.href}
                        className="transition-colors hover:text-[var(--color-text-primary)]"
                      >
                        {b.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {b.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
              {periodLabel && (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-tertiary)]">
                  {periodLabel}
                </span>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
              Ambiente de produção
            </p>
          )}
        </div>
      </div>

      {/* Right — theme + notifications + profile */}
      <div className="flex items-center gap-3">
        {authUser?.plano && (() => {
          const badge = PLANO_BADGE[authUser.plano];
          if (!badge) return null;
          const content = (
            <span
              className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
            >
              {badge.label}
            </span>
          );
          return authUser.role === "admin" ? (
            <Link href="/app/configuracoes/faturamento" className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-surface)] rounded-full">
              {content}
            </Link>
          ) : content;
        })()}

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notificações"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--color-card)]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)] duration-200">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Notificações
                  </h3>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-card-hover)]"
                    aria-label="Fechar"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="px-5 py-6 text-center">
                  {unreadCount > 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Você tem{" "}
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {unreadCount}
                      </span>{" "}
                      notificação{unreadCount !== 1 ? "ões" : ""} não lida
                      {unreadCount !== 1 ? "s" : ""}.
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      Nenhuma notificação nova.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile dropdown */}
        <div
          ref={profileRef}
          className="relative flex items-center gap-3 border-l border-[var(--color-border)] pl-3"
        >
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-label="Menu do usuário"
            aria-expanded={profileOpen}
            className="flex items-center gap-3 rounded-xl p-1 outline-none transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]"
          >
            {displayUser && (
              <>
                <Avatar
                  src={displayUser.avatarUrl}
                  name={displayUser.name}
                  size="sm"
                  className="ring-2 ring-[var(--color-primary-surface)]"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-none text-[var(--color-text-primary)]">
                    {displayUser.name.split(" ")[0]}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    {ROLE_LABELS[authUser?.role ?? ""] ?? "Usuário"}
                  </p>
                </div>
              </>
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)] duration-200">
              {displayUser && (
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {displayUser.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {ROLE_LABELS[authUser?.role ?? ""] ?? "Usuário"}
                  </p>
                  {authUser?.orgName && (
                    <p className="mt-1.5 truncate text-[10px] font-semibold text-[var(--color-primary)]">
                      {authUser.orgName}
                    </p>
                  )}
                </div>
              )}
              <div className="p-2">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--color-danger)] outline-none transition hover:bg-[var(--color-danger-surface)] focus-visible:shadow-[var(--shadow-focus)]"
                >
                  <LogOut size={15} strokeWidth={2} />
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
