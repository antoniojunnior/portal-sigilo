"use client";

import { Tooltip } from "./Tooltip";

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

interface UrgencyIndicatorProps {
  level: UrgencyLevel;
  showLabel?: boolean;
  className?: string;
}

const LABELS: Record<UrgencyLevel, string> = {
  1: "Urgência 1 — Baixa",
  2: "Urgência 2 — Moderada",
  3: "Urgência 3 — Média",
  4: "Urgência 4 — Alta",
  5: "Urgência 5 — Crítica",
};

export function UrgencyIndicator({ level, showLabel = false, className = "" }: UrgencyIndicatorProps) {
  const dot = (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        level >= 5 ? "animate-urgency-critical" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={LABELS[level]}
    >
      <span
        className="block w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: `var(--color-urgency-${level})` }}
        aria-hidden
      />
      {showLabel && (
        <span
          className="text-[var(--text-xs)] font-medium tabular-nums"
          style={{ color: `var(--color-urgency-${level})` }}
        >
          {level}/5
        </span>
      )}
    </span>
  );

  return (
    <Tooltip content={LABELS[level]} side="top">
      {dot}
    </Tooltip>
  );
}
