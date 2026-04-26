/** Wraps all portal screens. Forces light mode, constrains to 480px, handles iOS safe area. */
export function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-portal
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="flex flex-col flex-1 w-full max-w-[var(--portal-max-width)] mx-auto">
        {children}
      </div>
    </div>
  );
}
