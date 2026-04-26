interface Props {
  variant?: "icon" | "full";
  className?: string;
  iconSize?: number;
}

export function LogoSigilo({ variant = "full", className = "", iconSize = 32 }: Props) {
  const h = Math.round(iconSize * 1.25);

  const icon = (
    <svg
      width={iconSize}
      height={h}
      viewBox="0 0 40 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Shackle (lock arch) — petróleo: segurança */}
      <path
        d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8"
        stroke="#2A6070"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Bubble body — coral: conversa humana */}
      <path
        d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z"
        fill="#C05A4A"
      />
      {/* Text lines */}
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="white" fillOpacity="0.95" />
      <rect x="8" y="33" width="20" height="2.5" rx="1.25" fill="white" fillOpacity="0.80" />
      <rect x="8" y="38" width="15" height="2.5" rx="1.25" fill="white" fillOpacity="0.65" />
    </svg>
  );

  if (variant === "icon") return <span className={className}>{icon}</span>;

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {icon}
      <span className="font-bold leading-none tracking-tight" style={{ fontSize: Math.max(13, Math.round(iconSize * 0.58)) }}>
        <span style={{ color: "#2A6070" }}>portal</span>
        <span style={{ color: "#C05A4A" }}>sigilo</span>
      </span>
    </span>
  );
}
