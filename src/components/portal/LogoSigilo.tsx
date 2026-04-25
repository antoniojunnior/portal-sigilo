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
      <path
        d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8"
        stroke="#1B3D7B"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z"
        fill="#00B5AD"
      />
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="white" fillOpacity="0.85" />
      <rect x="8" y="33" width="20" height="2.5" rx="1.25" fill="white" fillOpacity="0.85" />
      <rect x="8" y="38" width="15" height="2.5" rx="1.25" fill="white" fillOpacity="0.85" />
    </svg>
  );

  if (variant === "icon") return <span className={className}>{icon}</span>;

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {icon}
      <span className="font-bold leading-none tracking-tight" style={{ fontSize: iconSize * 0.56 }}>
        <span style={{ color: "#1B3D7B" }}>portal</span>
        <span style={{ color: "#00B5AD" }}>sigilo</span>
      </span>
    </span>
  );
}
