interface PageContainerProps {
  children: React.ReactNode;
  /** Extra classes for padding override or max-width */
  className?: string;
  /** Full-bleed — removes default horizontal padding */
  flush?: boolean;
}

/** Consistent inner padding for dashboard page content. */
export function PageContainer({ children, className = "", flush = false }: PageContainerProps) {
  return (
    <main
      className={[
        "flex-1 overflow-y-auto",
        flush ? "" : "px-5 py-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
