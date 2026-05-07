"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import {
  Home,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app",                label: "Visão geral",   icon: Home     },
  { href: "/app/casos",          label: "Casos",         icon: FileText },
  { href: "/app/relatorios",     label: "Relatórios",    icon: BarChart3 },
  { href: "/app/configuracoes",  label: "Configurações", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !(item.adminOnly && user?.role !== "admin")
  );

  return (
    <aside
      className={[
        "flex flex-col flex-shrink-0",
        collapsed ? "w-16" : "w-[var(--sidebar-width-expanded)]",
        "bg-[var(--color-primary-xdark)] text-white transition-[width] duration-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Navegação principal"
    >
      <div className="flex h-full flex-col p-4">
        {/* Logo + collapse toggle */}
        <div
          className={`mb-8 flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/app"
            className="outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-xl"
          >
            <LogoSigilo
              variant={collapsed ? "icon" : "full"}
              iconSize={collapsed ? 28 : 34}
            />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="rounded-lg p-1.5 text-white/70 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={[
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/60",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]"
                    : "text-white/78 hover:bg-white/10 hover:text-white",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon size={19} strokeWidth={1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
