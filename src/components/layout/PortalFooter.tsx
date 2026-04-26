import { LogoSigilo } from "@/components/portal/LogoSigilo";

const COMPLIANCE_BADGES = ["Lei 14.457/22", "NR-1", "Lei 14.611/23", "LGPD"];

export function PortalFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={["flex-shrink-0", className].filter(Boolean).join(" ")}
      style={{
        background: "var(--color-card)",
        borderTop: "0.5px solid var(--color-border)",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between flex-wrap gap-3"
        style={{ maxWidth: 580, padding: "1.25rem 1.5rem" }}
      >
        <p
          className="flex items-center gap-1.5 flex-wrap"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}
        >
          Canal operado por
          <span className="inline-flex items-center gap-1 ml-0.5" style={{ opacity: 0.4 }}>
            <LogoSigilo variant="icon" iconSize={14} className="inline-flex align-middle" />
            <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>portalsigilo</span>
          </span>
        </p>
        <div className="flex items-center flex-wrap gap-1.5" aria-label="Conformidade legal">
          {COMPLIANCE_BADGES.map((b) => (
            <span
              key={b}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                background: "var(--color-bg-secondary)",
                border: "0.5px solid var(--color-border)",
                borderRadius: 99,
                padding: "2px 8px",
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
