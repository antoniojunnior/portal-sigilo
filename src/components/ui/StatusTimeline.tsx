interface TimelineStep {
  label: string;
  desc?: string;
  done?: boolean;
  active?: boolean;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function StatusTimeline({ steps, className = "" }: StatusTimelineProps) {
  return (
    <ol
      aria-label="Histórico do processo"
      className={["space-y-0", className].filter(Boolean).join(" ")}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <li key={step.label} className="flex gap-3">
            {/* Timeline track */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={[
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--text-xs)] font-semibold",
                  step.done
                    ? "bg-[var(--color-success)] text-[var(--color-on-success)]"
                    : step.active
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] ring-4 ring-[var(--color-primary-surface)]"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {step.done ? (
                  <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M2 5l2.5 2.5L8 2.5" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {!isLast && (
                <div
                  className={[
                    "w-px flex-1 mt-1 mb-1 min-h-[20px]",
                    step.done
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-border)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden
                />
              )}
            </div>

            {/* Step content */}
            <div className={["pb-4", isLast ? "pb-0" : ""].filter(Boolean).join(" ")}>
              <p
                className={[
                  "text-[var(--text-sm)] font-medium leading-snug",
                  step.done || step.active
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-tertiary)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {step.label}
              </p>
              {step.desc && (
                <p className="mt-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)] leading-relaxed">
                  {step.desc}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
