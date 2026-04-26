import type { ChannelValue } from "./Badge";

interface ChannelBadgeProps {
  channel: ChannelValue;
  className?: string;
}

const CHANNEL_CONFIG: Record<ChannelValue, { label: string; icon: React.ReactNode; classes: string }> = {
  web: {
    label: "Web",
    icon: (
      <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="6" cy="6" r="5"/>
        <path d="M1 6h10M6 1c-1.5 2-1.5 8 0 10M6 1c1.5 2 1.5 8 0 10" strokeLinecap="round"/>
      </svg>
    ),
    classes: "bg-sky-50 text-sky-700 border-sky-200",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden>
        <path d="M6 0C2.686 0 0 2.686 0 6c0 1.06.279 2.05.764 2.909L0 12l3.18-.75A5.97 5.97 0 0 0 6 12c3.314 0 6-2.686 6-6S9.314 0 6 0zm3.04 8.54c-.128.36-.75.69-1.04.73-.27.04-.61.06-.99-.06-.23-.07-.52-.17-.89-.33C4.86 8.42 3.7 7.08 3.6 6.95c-.1-.13-.78-1.04-.78-1.99 0-.94.5-1.41.67-1.6.17-.19.38-.24.5-.24l.36.007c.12.005.27-.046.43.33l.53 1.36c.06.15.1.32.01.51-.09.19-.14.31-.27.47-.14.17-.29.37-.1.6.18.22.81 1 1.74 1.37.56.22.87.17.97.08l.34-.39c.1-.12.3-.2.5-.1l1.04.49c.12.06.24.13.31.19.07.07.04.3-.09.66z"/>
      </svg>
    ),
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  app: {
    label: "App",
    icon: (
      <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="2" y="1" width="8" height="10" rx="2"/>
        <path d="M5 9h2" strokeLinecap="round"/>
      </svg>
    ),
    classes: "bg-violet-50 text-violet-700 border-violet-200",
  },
  "0800": {
    label: "0800",
    icon: (
      <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M2 2.5C2 1.67 2.67 1 3.5 1S5 1.67 5 2.5c0 .5-.5 1.5-1.5 2-.17.09-.33.17-.5.25l1 3.75c.17-.08.33-.16.5-.25C6.5 7.5 7.5 7 7.5 7.5c0 .83-.67 1.5-1.5 1.5S4.5 7.83 4.5 7c0-.5.5-1.5 1.5-2" strokeLinecap="round"/>
      </svg>
    ),
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function ChannelBadge({ channel, className = "" }: ChannelBadgeProps) {
  const config = CHANNEL_CONFIG[channel];
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] border",
        "text-[var(--text-xs)] font-medium whitespace-nowrap",
        config.classes,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
