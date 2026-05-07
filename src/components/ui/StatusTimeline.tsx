import { Check } from "lucide-react";

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
          <li key={step.label} className="flex gap-4">
            {/* Timeline track */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-semibold transition-all duration-200",
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
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {!isLast && (
                <div
                  className={[
                    "w-0.5 flex-1 mt-1 mb-1 min-h-[24px] transition-all duration-300",
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
            <div className={["pb-6", isLast ? "pb-0" : ""].filter(Boolean).join(" ")}>
              <p
                className={[
                  "text-[13px] font-semibold leading-tight",
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
                <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
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

