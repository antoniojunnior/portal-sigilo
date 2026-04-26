"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcompanharFormProps {
  slug: string;
  inputId?: string;
  variant?: "default" | "primary";
}

function formatProtocolo(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 3));
  if (clean.length > 3) parts.push(clean.slice(3, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 13));
  return parts.join("-");
}

export function AcompanharForm({ slug, inputId = "protocolo-input", variant = "default" }: AcompanharFormProps) {
  const router = useRouter();
  const [protocolo, setProtocolo] = useState("");

  const isPrimary = variant === "primary";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = protocolo.replace(/\s/g, "");
    if (!cleaned) return;
    router.push(`/${slug}/acompanhar?protocolo=${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
      <label htmlFor={inputId} className="sr-only">
        Número do protocolo
      </label>
      <input
        id={inputId}
        type="text"
        value={protocolo}
        onChange={(e) => setProtocolo(formatProtocolo(e.target.value))}
        placeholder="ETK-2026-XXXXXX"
        maxLength={15}
        autoComplete="off"
        className="flex-1 font-mono uppercase focus:outline-none transition-colors"
        style={{
          height: isPrimary ? 40 : 36,
          padding: "0 12px",
          fontSize: 13,
          letterSpacing: "0.03em",
          color: "var(--color-text-primary)",
          border: "0.5px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-secondary)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#2A6070";
          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        type="submit"
        className="flex-shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        style={{
          height: isPrimary ? 40 : 36,
          padding: "0 16px",
          fontSize: isPrimary ? 13 : 12,
          fontWeight: 500,
          color: isPrimary ? "white" : "var(--color-text-secondary)",
          background: isPrimary ? "#2A6070" : "var(--color-bg-secondary)",
          border: isPrimary ? "none" : "0.5px solid var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isPrimary ? "#235260" : "var(--color-bg-tertiary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isPrimary ? "#2A6070" : "var(--color-bg-secondary)";
        }}
      >
        Ver relato
      </button>
    </form>
  );
}
