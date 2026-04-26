"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";

interface MetricCardProps {
  label: string;
  value: string | number;
  /** Percentage or count comparison, e.g. "+12%" */
  trendValue?: string;
  trend?: "up" | "down" | "neutral";
  compareLabel?: string;
  loading?: boolean;
  /** Icon displayed in the card corner */
  icon?: React.ReactNode;
  className?: string;
}

const TREND_CLASSES: Record<NonNullable<MetricCardProps["trend"]>, string> = {
  up: "text-[var(--color-success)]",
  down: "text-[var(--color-danger)]",
  neutral: "text-[var(--color-text-tertiary)]",
};

export function MetricCard({
  label,
  value,
  trendValue,
  trend = "neutral",
  compareLabel,
  loading = false,
  icon,
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
      <div className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-3 ${className}`}>
        <Skeleton height="12px" width="60%" />
        <Skeleton height="28px" width="40%" />
        <Skeleton height="10px" width="50%" />
      </div>
    );
  }

  return (
    <div
      className={[
        "bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5",
        "transition-shadow duration-[var(--duration-normal)] hover:shadow-[var(--shadow-sm)]",
        visible ? "animate-fade-in" : "opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-wide)]">
          {label}
        </p>
        {icon && (
          <span className="text-[var(--color-text-tertiary)] opacity-60" aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <p className="text-[28px] font-bold text-[var(--color-text-primary)] leading-none mb-2 tabular-nums">
        {value}
      </p>

      {(trendValue || compareLabel) && (
        <div className="flex items-center gap-1.5">
          {trendValue && (
            <span className={`text-[var(--text-xs)] font-semibold ${TREND_CLASSES[trend]}`}>
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendValue}
            </span>
          )}
          {compareLabel && (
            <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
              {compareLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
