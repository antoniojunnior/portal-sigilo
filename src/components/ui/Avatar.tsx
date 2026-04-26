interface AvatarProps {
  src?: string | null;
  /** Used for alt text and initials fallback */
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[var(--text-2xs)]",
  sm: "w-8 h-8 text-[var(--text-xs)]",
  md: "w-10 h-10 text-[var(--text-sm)]",
  lg: "w-12 h-12 text-[var(--text-base)]",
  xl: "w-16 h-16 text-[var(--text-lg)]",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Avatar with image src or initials fallback. */
export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const base = `flex-shrink-0 rounded-full flex items-center justify-center font-medium select-none overflow-hidden ${sizeClass} ${className}`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `Avatar de ${name}` : "Avatar"}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <span
      className={`${base} bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]`}
      aria-label={name ? `Avatar de ${name}` : "Avatar"}
    >
      {getInitials(name)}
    </span>
  );
}
