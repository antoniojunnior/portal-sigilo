interface ProgressStepsProps {
  steps: string[];
  /** 0-indexed current step */
  current: number;
  className?: string;
}

/** Discrete step indicators — not a percentage bar. */
export function ProgressSteps({ steps, current, className = "" }: ProgressStepsProps) {
  return (
    <nav
      aria-label="Etapas do processo"
      className={["flex items-center gap-0", className].filter(Boolean).join(" ")}
    >
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <div key={step} className="flex items-center">
            <div
              className={[
                "flex items-center gap-2",
                i < steps.length - 1 ? "pr-2" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                aria-current={active ? "step" : undefined}
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                  "text-[var(--text-xs)] font-semibold",
                  done
                    ? "bg-[var(--color-success)] text-[var(--color-on-success)]"
                    : active
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              <span
                className={[
                  "text-[var(--text-xs)] font-medium whitespace-nowrap",
                  done || active
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-tertiary)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {step}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={[
                  "h-px w-6 mx-1 transition-colors",
                  done
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-border)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
