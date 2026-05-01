"use client";

import React, { createContext, useContext, useState } from "react";

interface MobileMenuContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileMenuContext.Provider
      value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}
    >
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): MobileMenuContextValue {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) throw new Error("useMobileMenu must be used within MobileMenuProvider");
  return ctx;
}
