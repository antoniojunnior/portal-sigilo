"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { SuspensoBanner } from "@/components/ui/SuspensoBanner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* BUG-20260723-EBD1: Sidebar/SuspensoBanner/BottomNav (chrome renderizado em
          toda página) ganham ErrorBoundary próprio, com fallback null — uma exceção
          neles some silenciosamente em vez de derrubar o dashboard inteiro. */}
      <ErrorBoundary fallback={null}>
        <Sidebar className="hidden lg:flex h-full" />
      </ErrorBoundary>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative pb-[72px] lg:pb-0">
        <ErrorBoundary fallback={null}>
          <SuspensoBanner />
        </ErrorBoundary>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallback={null}>
        <BottomNav />
      </ErrorBoundary>
    </div>
  );
}
