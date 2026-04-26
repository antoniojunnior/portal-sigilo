"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Root wrapper for all authenticated dashboard screens.
 * Sidebar fixed on lg+, drawer on md-.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] lg:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={[
          "fixed top-0 left-0 bottom-0 z-[var(--z-modal)] lg:hidden",
          "transition-transform duration-[var(--duration-slow)] ease-[var(--easing-out)]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Sidebar className="!flex h-full" />
      </div>

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Inject mobile menu toggle into child DashboardHeader via context — simplified: pass handler via children clone is complex, so children handle their own header */}
        {children}
      </div>
    </div>
  );
}
