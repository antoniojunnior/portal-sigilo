"use client";

import { useState } from "react";
import { Home, FileText, BarChart3, Settings, Building2, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const items: BottomNavItem[] = [
  { label: "Visão geral", href: "/app", icon: Home },
  { label: "Casos", href: "/app/casos", icon: FileText },
  { label: "Relatórios", href: "/app/relatorios", icon: BarChart3 },
  {
    label: "Config.",
    href: "/app/configuracoes",
    icon: Settings,
    adminOnly: true,
    children: [
      { label: "Organização", href: "/app/configuracoes", icon: Building2 },
      { label: "Faturamento", href: "/app/configuracoes/faturamento", icon: CreditCard },
    ],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  // BUG-20260723-MOB1: sem isso, não havia nenhum caminho mobile até /app/configuracoes/faturamento.
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const visibleItems = items.filter((item) => !(item.adminOnly && user?.role !== "admin"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 pb-safe-bottom pt-2 shadow-[var(--shadow-lg)] backdrop-blur lg:hidden"
      aria-label="Navegação inferior"
    >
      <div className="mb-1 grid grid-cols-4 gap-1">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openMenu === item.href;

          if (hasChildren) {
            return (
              <div key={item.label} className="relative">
                {isOpen && (
                  <div className="absolute bottom-full left-1/2 mb-2 w-40 -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-lg)]">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive =
                        child.href === "/app/configuracoes"
                          ? pathname === child.href
                          : pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpenMenu(null)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs outline-none transition ${
                            childActive
                              ? "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)] font-semibold"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                          }`}
                        >
                          <ChildIcon size={16} strokeWidth={1.8} />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpenMenu((prev) => (prev === item.href ? null : item.href))}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] outline-none transition focus-visible:shadow-[var(--shadow-focus)] ${
                    active || isOpen
                      ? "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] outline-none transition focus-visible:shadow-[var(--shadow-focus)] ${
                active
                  ? "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
