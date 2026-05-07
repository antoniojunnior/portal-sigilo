"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";
import { LucideIcon } from "lucide-react";

function useCountUp(target: number, active: boolean, duration = 800): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setCount(active ? 0 : 0); return; }
    let rafId: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) { setCount(target); return; }
      setCount(Math.round((elapsed / duration) * target));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, active, duration]);
  return count;
}

interface TrendInfo {
  value: number;
  direction: "up" | "down" | "stable";
  label: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string | TrendInfo;
  loading?: boolean;
  icon: LucideIcon;
  tone?: "primary" | "danger" | "success";
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  loading = false,
  icon: Icon,
  tone = "primary",
  className = "",
}: MetricCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [loading]);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] ${className}`}>
        <Skeleton height="44px" width="44px" className="mb-4 rounded-xl" />
        <Skeleton height="12px" width="60%" className="mb-3" />
        <Skeleton height="28px" width="40%" className="mb-3" />
        <Skeleton height="12px" width="50%" />
      </div>
    );
  }

  const numericValue = typeof value === "number" ? value : null;
  const countedValue = useCountUp(numericValue ?? 0, visible);
  const displayValue = numericValue !== null ? countedValue : value;

  const toneClasses = {
    primary: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
    danger: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
    success: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  };

  const renderTrend = () => {
    if (!trend) return null;

    if (typeof trend === "string") {
      return (
        <p className={`mt-3 text-xs font-bold ${tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
          {trend}
        </p>
      );
    }

    const isUp = trend.direction === "up";
    const isDown = trend.direction === "down";
    
    // In metrics, UP can be bad (more cases) or good (more resolutions)
    // We'll use the 'tone' prop to determine the primary intent of the card
    const trendColorClass = 
      trend.direction === "stable" ? "text-[var(--color-text-tertiary)]" :
      tone === "danger" 
        ? (isUp ? "text-[var(--color-danger)]" : "text-[var(--color-success)]")
        : tone === "success"
          ? (isUp ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")
          : "text-[var(--color-primary)]";

    return (
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${trendColorClass}`}>
        {isUp && <span className="text-[10px]">▲</span>}
        {isDown && <span className="text-[10px]">▼</span>}
        <span>{trend.value}%</span>
        <span className="text-[10px] opacity-60 font-medium ml-0.5">{trend.label}</span>
      </div>
    );
  };

  return (
    <section
      className={[
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        visible ? "animate-fade-in" : "opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-3 sm:mb-4">
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">{displayValue}</p>
      {renderTrend()}
    </section>
  );
}
