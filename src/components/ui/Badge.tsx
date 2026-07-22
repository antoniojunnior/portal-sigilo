/** Urgency level 1–5 */
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

/** Case status values */
export type StatusValue =
  | "aguardando_triagem"
  | "em_apuracao"
  | "pendente_informacao"
  | "encerrado_sem_infracao"
  | "encerrado_com_acao";

/** Channel origin */
export type ChannelValue = "web" | "whatsapp" | "app" | "0800";

type Variant = "urgency" | "status" | "channel" | "default";

interface BadgeProps {
  variant?: Variant;
  /** For urgency: 1–5 */
  urgency?: UrgencyLevel;
  /** For status badges */
  status?: StatusValue;
  /** For channel badges */
  channel?: ChannelValue;
  className?: string;
  children?: React.ReactNode;
}

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  1: "bg-[var(--color-urgency-1-surface)] text-[var(--color-urgency-1)] border-[var(--color-urgency-1)]/20",
  2: "bg-[var(--color-urgency-2-surface)] text-[var(--color-urgency-2)] border-[var(--color-urgency-2)]/20",
  3: "bg-[var(--color-urgency-3-surface)] text-[var(--color-urgency-3)] border-[var(--color-urgency-3)]/20",
  4: "bg-[var(--color-urgency-4-surface)] text-[var(--color-urgency-4)] border-[var(--color-urgency-4)]/20",
  5: "bg-[var(--color-urgency-5-surface)] text-[var(--color-urgency-5)] border-[var(--color-urgency-5)]/20",
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  1: "Urgência 1",
  2: "Urgência 2",
  3: "Urgência 3",
  4: "Urgência 4 — Alta",
  5: "Urgência 5 — Crítica",
};

const STATUS_STYLES: Record<StatusValue, string> = {
  aguardando_triagem: "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
  em_apuracao: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
  pendente_informacao: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
  encerrado_sem_infracao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  encerrado_com_acao: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
};

const STATUS_LABELS: Record<StatusValue, string> = {
  aguardando_triagem: "Aguardando triagem",
  em_apuracao: "Em apuração",
  pendente_informacao: "Pendente de informação",
  encerrado_sem_infracao: "Encerrado — sem infração",
  encerrado_com_acao: "Encerrado com ação",
};

const CHANNEL_STYLES: Record<ChannelValue, string> = {
  web: "bg-sky-50 text-sky-700",
  whatsapp: "bg-green-50 text-green-700",
  app: "bg-violet-50 text-violet-700",
  "0800": "bg-amber-50 text-amber-700",
};

const CHANNEL_LABELS: Record<ChannelValue, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  app: "App",
  "0800": "0800",
};

const BASE =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] border text-[var(--text-xs)] font-medium leading-none whitespace-nowrap";

const LABEL_BASE =
  "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap leading-none";

/**
 * Semantic badge for urgency levels (1–5), case status, subscription plan, and channel origin.
 */
export function Badge({
  variant = "default",
  urgency,
  status,
  plan,
  channel,
  className = "",
  children,
}: BadgeProps) {
  if (variant === "urgency" && urgency) {
    const critical = urgency >= 5;
    return (
      <span
        className={[
          BASE,
          URGENCY_STYLES[urgency],
          critical ? "animate-urgency-critical" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={URGENCY_LABELS[urgency]}
        title={URGENCY_LABELS[urgency]}
      >
        <span
          className="block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: `var(--color-urgency-${urgency})` }}
          aria-hidden
        />
        {urgency}/5
      </span>
    );
  }

  if (variant === "status" && status) {
    return (
      <span className={[LABEL_BASE, STATUS_STYLES[status], className].filter(Boolean).join(" ")}>
        {STATUS_LABELS[status]}
      </span>
    );
  }

  if (variant === "channel" && channel) {
    return (
      <span className={[LABEL_BASE, CHANNEL_STYLES[channel], className].filter(Boolean).join(" ")}>
        {CHANNEL_LABELS[channel]}
      </span>
    );
  }

  return (
    <span
      className={[
        BASE,
        "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
