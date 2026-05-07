import { Badge, type StatusValue, type ChannelValue } from "./Badge";
import { UrgencyIndicator, type UrgencyLevel } from "./UrgencyIndicator";

interface CaseRowProps {
  protocolo: string;
  urgency: UrgencyLevel;
  channel: ChannelValue;
  category?: string;
  status: StatusValue;
  /** ISO date string for deadline */
  deadline?: string;
  diasEmAberto?: number;
  onClick?: () => void;
  className?: string;
}

function formatDeadline(iso: string): { label: string; overdue: boolean } {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  const overdue = diffDays < 0;
  const label =
    overdue
      ? `${Math.abs(diffDays)}d atrasado`
      : diffDays === 0
      ? "Hoje"
      : diffDays === 1
      ? "Amanhã"
      : `${diffDays}d`;
  return { label, overdue };
}

export function CaseRow({
  protocolo,
  urgency,
  channel,
  category,
  status,
  deadline,
  diasEmAberto,
  onClick,
  className = "",
}: CaseRowProps) {
  const deadlineInfo = deadline ? formatDeadline(deadline) : null;

  return (
    <tr
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={[
        "h-16 border-b border-[var(--color-border)] last:border-0",
        "transition-colors duration-[var(--duration-fast)]",
        onClick
          ? "hover:bg-[var(--color-card-hover)] cursor-pointer focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Urgency */}
      <td className="px-4 py-2 w-12">
        <UrgencyIndicator level={urgency} showLabel />
      </td>

      {/* Channel */}
      <td className="px-4 py-2 w-24">
        <Badge variant="channel" channel={channel} />
      </td>

      {/* Category */}
      <td className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] min-w-[120px]">
        {category ?? "—"}
      </td>

      {/* Protocol */}
      <td className="px-4 py-2 font-mono text-[12px] text-[var(--color-text-secondary)] whitespace-nowrap">
        {protocolo}
      </td>

      {/* Status */}
      <td className="px-4 py-2">
        <Badge variant="status" status={status} />
      </td>

      {/* Days open */}
      <td className="px-4 py-2 text-right w-24">
        {diasEmAberto != null ? (
          <span className="text-[13px] font-medium tabular-nums text-[var(--color-text-secondary)]">
            {diasEmAberto}d
          </span>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        )}
      </td>

      {/* Deadline */}
      <td className="px-4 py-2 text-right w-24">
        {deadlineInfo ? (
          <span
            className={[
              "text-[13px] font-semibold tabular-nums",
              deadlineInfo.overdue
                ? "text-[var(--color-danger)]"
                : (deadlineInfo.label !== "Hoje" && deadlineInfo.label !== "Amanhã")
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-warning)]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {deadlineInfo.label}
          </span>
        ) : (
          <span className="text-[12px] text-[var(--color-text-tertiary)]">—</span>
        )}
      </td>
    </tr>
  );
}
