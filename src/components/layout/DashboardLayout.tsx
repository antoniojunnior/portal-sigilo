"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { SuspensoBanner } from "@/components/ui/SuspensoBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Desktop sidebar only */}
      <Sidebar className="hidden lg:flex h-full" />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative pb-[72px] lg:pb-0">
        <SuspensoBanner />
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
