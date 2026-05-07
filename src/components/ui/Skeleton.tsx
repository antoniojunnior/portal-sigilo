interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

const ROUNDED: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  xs:  "rounded-[var(--radius-xs)]",
  sm:  "rounded-[var(--radius-sm)]",
  md:  "rounded-[var(--radius-md)]",
  lg:  "rounded-[var(--radius-lg)]",
  xl:  "rounded-[var(--radius-xl)]",
  "2xl": "rounded-[var(--radius-2xl)]",
  full: "rounded-full",
};

export function Skeleton({ width, height, rounded = "sm", className = "" }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label="Carregando…"
      className={`skeleton block ${ROUNDED[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Carregando…">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}
