"use client";

import { Home, FileText, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Visão geral", href: "/app", icon: Home },
  { label: "Casos", href: "/app/casos", icon: FileText },
  { label: "Relatórios", href: "/app/relatorios", icon: BarChart3 },
  { label: "Config.", href: "/app/configuracoes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 pb-safe-bottom pt-2 shadow-[var(--shadow-lg)] backdrop-blur lg:hidden"
      aria-label="Navegação inferior"
    >
      <div className="mb-1 grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(item.href));
          const Icon = item.icon;
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
