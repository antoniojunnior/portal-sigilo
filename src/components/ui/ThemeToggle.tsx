"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

const ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={18} />,
  dark: <Moon size={18} />,
};

const LABELS: Record<Theme, string> = {
  light: "Modo claro",
  dark: "Modo escuro",
};

const CYCLE: Theme[] = ["light", "dark"];

function next(t: Theme): Theme {
  return CYCLE[(CYCLE.indexOf(t) + 1) % CYCLE.length];
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && (saved === "light" || saved === "dark")) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function toggle() {
    const t = next(theme);
    setTheme(t);
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }

  return (
    <button
      type="button"
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      onClick={toggle}
      className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]"
    >
      {ICONS[theme]}
    </button>
  );
}
