"use client";

import { Sidebar } from "./Sidebar";
import { MobileMenuProvider, useMobileMenu } from "@/contexts/MobileMenuContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const { open, close } = useMobileMenu();

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] lg:hidden"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={[
          "fixed top-0 left-0 bottom-0 z-[var(--z-modal)] lg:hidden",
          "transition-transform duration-[var(--duration-slow)] ease-[var(--easing-out)]",
          open ? "translate-x-0" : "-translate-x-full",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Sidebar className="!flex h-full" onClose={close} />
      </div>

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MobileMenuProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </MobileMenuProvider>
  );
}
