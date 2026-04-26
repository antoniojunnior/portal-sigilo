"use client";

import { Tooltip } from "./Tooltip";

interface RiskCellProps {
  /** Risk score 0–100 */
  score: number;
  label?: string;
  className?: string;
}

/** Heatmap cell: blue (low) → red (critical), with numerical overlay. */
export function RiskCell({ score, label, className = "" }: RiskCellProps) {
  const clamped = Math.max(0, Math.min(100, score));

  // cool-to-hot gradient matching research recommendation
  const bg = getHeatColor(clamped);
  const textColor = clamped > 50 ? "rgba(255,255,255,0.95)" : "rgba(10,30,50,0.75)";

  const cell = (
    <span
      className={[
        "inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)]",
        "text-[var(--text-xs)] font-semibold tabular-nums transition-opacity",
        "animate-fade-in",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ background: bg, color: textColor }}
      aria-label={label ? `${label}: ${clamped}` : `Risco: ${clamped}`}
    >
      {clamped}
    </span>
  );

  return label ? <Tooltip content={`${label}: ${clamped}/100`}>{cell}</Tooltip> : cell;
}

function getHeatColor(score: number): string {
  // 0–20: cool blue; 20–40: teal; 40–60: amber; 60–80: orange; 80–100: red
  if (score <= 20) return `hsl(${200 - score * 2}, 55%, ${75 - score}%)`;
  if (score <= 40) return `hsl(${160 - (score - 20) * 4}, 55%, ${65 - score * 0.3}%)`;
  if (score <= 60) return `hsl(${40 + (60 - score) * 2}, 90%, 55%)`;
  if (score <= 80) return `hsl(${20 + (80 - score)}, 90%, 50%)`;
  return `hsl(${(100 - score) * 0.5}, 85%, 45%)`;
}
