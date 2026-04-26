"use client";

import { useState } from "react";

interface ProtocolDisplayProps {
  protocolo: string;
  showCopyButton?: boolean;
  className?: string;
}

export function ProtocolDisplay({ protocolo, showCopyButton = true, className = "" }: ProtocolDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(protocolo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  }

  return (
    <div
      className={["overflow-hidden animate-scale-in", className].filter(Boolean).join(" ")}
      style={{
        background: "var(--color-card)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "0.75rem 1.125rem", borderBottom: "0.5px solid var(--color-border)" }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
          }}
        >
          Número de protocolo
        </span>

        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copiado!" : "Copiar número do protocolo"}
            className="flex items-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            style={{
              height: 28,
              padding: "0 10px",
              gap: 5,
              border: "0.5px solid var(--color-border-strong)",
              borderRadius: "var(--radius-md)",
              background: copied ? "var(--color-success-surface)" : "var(--color-bg-secondary)",
              fontSize: 11,
              fontWeight: 500,
              color: copied ? "var(--color-success)" : "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = "var(--color-bg-tertiary)"; }}
            onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = "var(--color-bg-secondary)"; }}
          >
            {copied ? (
              <>
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M2 7l4 4 6-6" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="4" y="4" width="8" height="8" rx="1.5" />
                  <path d="M2 10V2h8" strokeLinecap="round" />
                </svg>
                Copiar
              </>
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1.125rem 1.125rem 0.875rem" }}>
        <p
          className="font-mono"
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#2A6070",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            marginBottom: "0.875rem",
          }}
          aria-label={`Protocolo: ${protocolo}`}
          role="text"
        >
          {protocolo}
        </p>

        <div style={{ height: 0.5, background: "var(--color-border)", marginBottom: "0.875rem" }} aria-hidden />

        <div className="flex items-start" style={{ gap: 8 }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "rgba(192,90,74,0.10)",
              marginTop: 1,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#C05A4A" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7v3.5" />
              <path d="M8 5v.5" strokeWidth="2.5" />
            </svg>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Guarde este número.</strong>{" "}
            É a única forma de acompanhar seu relato. Nenhum dado seu está vinculado a ele.
          </p>
        </div>
      </div>
    </div>
  );
}
