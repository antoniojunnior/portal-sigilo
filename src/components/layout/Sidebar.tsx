"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import {
  Home,
  FileText,
  Lightbulb,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  CreditCard,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app",                label: "Visão geral",   icon: Home     },
  { href: "/app/casos",          label: "Casos",         icon: FileText },
  { href: "/app/insights",       label: "Insights",       icon: Lightbulb },
  { href: "/app/relatorios",     label: "Relatórios",    icon: BarChart3 },
  {
    href: "/app/configuracoes",
    label: "Configurações",
    icon: Settings,
    adminOnly: true,
    children: [
      { href: "/app/configuracoes",              label: "Organização",  icon: Building2   },
      { href: "/app/configuracoes/faturamento",  label: "Faturamento",  icon: CreditCard  },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  // BUG-20260723-ACT1: auto-expande o submenu cujo filho corresponde à rota atual,
  // pra que acesso direto/reload já mostre o item ativo destacado.
  const [expandedMenu, setExpandedMenu] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of NAV_ITEMS) {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        initial.add(item.href);
      }
    }
    return initial;
  });

  function toggleExpanded(href: string) {
    setExpandedMenu((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }

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
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenu.has(item.href);
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (hasChildren) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => {
                      // BUG-20260723-CLP1: colapsado, os filhos nunca renderizam
                      // (ver `{!collapsed && isExpanded}` abaixo) — só alternar
                      // isExpanded não tinha efeito visível. Expande a sidebar
                      // inteira nesse caso, pra o clique navegar até o submenu.
                      if (collapsed) {
                        setCollapsed(false);
                        setExpandedMenu((prev) => new Set(prev).add(item.href));
                      } else {
                        toggleExpanded(item.href);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "w-full flex h-12 items-center gap-3 rounded-xl px-4 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/60",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]"
                        : "text-white/78 hover:bg-white/10 hover:text-white",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-4">
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
                            className={[
                              "flex h-10 items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/60",
                              childActive
                                ? "bg-white/10 text-white font-semibold"
                                : "text-white/60 hover:bg-white/10 hover:text-white/90",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <ChildIcon size={16} strokeWidth={1.6} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={[
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/60",
                  collapsed && "justify-center px-0",
                  isActive
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
