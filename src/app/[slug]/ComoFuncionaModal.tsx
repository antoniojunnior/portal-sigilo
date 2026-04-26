"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
}

const STEPS = [
  {
    n: "1",
    title: "Você conta o que aconteceu",
    desc: (
      <>
        Uma conversa simples, no seu ritmo. Nenhum dado que identifique você é
        solicitado —{" "}
        <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
          nem nome, nem matrícula
        </strong>
        .
      </>
    ),
  },
  {
    n: "2",
    title: "Um comitê independente analisa",
    desc: (
      <>
        Pessoas sem conflito de interesse avaliam o relato com imparcialidade.
        Você acompanha tudo pelo{" "}
        <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
          número de protocolo
        </strong>{" "}
        gerado.
      </>
    ),
  },
  {
    n: "3",
    title: "Você recebe uma resposta",
    desc: (
      <>
        Em até 30 dias. O resultado fica disponível pelo protocolo a qualquer
        momento — sem precisar se identificar.
      </>
    ),
  },
];

const BADGES = ["Lei 14.457/22", "NR-1", "Lei 14.611/23", "LGPD"];

export function ComoFuncionaModal({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleCta() {
    handleClose();
    router.push(`/${slug}/chat`);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-full sm:w-auto transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        style={{
          height: 44,
          padding: "0 24px",
          borderRadius: "var(--radius-md)",
          border: "0.5px solid var(--color-border-strong)",
          background: "var(--color-card)",
          fontSize: 14,
          fontWeight: 400,
          color: "var(--color-text-secondary)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card)"; }}
      >
        Como funciona?
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.38)" }}
            onClick={handleClose}
            aria-hidden
          />

          {/* Panel */}
          <div
            className="relative w-full overflow-hidden animate-scale-in"
            style={{
              maxWidth: 420,
              background: "var(--color-card)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.125rem 1.375rem",
                borderBottom: "0.5px solid var(--color-border)",
              }}
            >
              <h2
                id={titleId}
                style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}
              >
                Como funciona
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={handleClose}
                aria-label="Fechar"
                className="flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-md)",
                  border: "0.5px solid var(--color-border)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-tertiary)",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-tertiary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-bg-secondary)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            {/* ── Body — Steps ── */}
            <div style={{ padding: "1.5rem 1.375rem 0" }}>
              {STEPS.map((s, i) => {
                const isLast = i === STEPS.length - 1;
                return (
                  <div
                    key={s.n}
                    className="flex"
                    style={{
                      gap: "1rem",
                      paddingBottom: isLast ? "1.375rem" : 0,
                      position: "relative",
                    }}
                  >
                    {/* Left col: numeral + connector */}
                    <div
                      className="flex flex-col items-center flex-shrink-0"
                      style={{ position: "relative" }}
                    >
                      {/* Numeral circle */}
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 28,
                          height: 28,
                          background: "rgba(192,90,74,0.10)",
                          border: "0.5px solid rgba(192,90,74,0.25)",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#C05A4A",
                        }}
                      >
                        {s.n}
                      </div>
                      {/* Connector line (not on last) */}
                      {!isLast && (
                        <div
                          style={{
                            flex: 1,
                            width: 0.5,
                            minHeight: 20,
                            background: "var(--color-border)",
                            margin: "4px 0",
                          }}
                          aria-hidden
                        />
                      )}
                    </div>

                    {/* Right col: content */}
                    <div style={{ flex: 1, paddingTop: 4, paddingBottom: isLast ? 0 : "1.375rem" }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          marginBottom: "0.3rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {s.title}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.6,
                        }}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── CTA button ── */}
            <div style={{ padding: "0 1.375rem 1.375rem" }}>
              <button
                type="button"
                onClick={handleCta}
                className="btn-primary-petroleo flex items-center justify-center w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                style={{
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  gap: 7,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v4l2.5 2.5" />
                </svg>
                Quero falar agora
              </button>
            </div>

            {/* ── Footer ── */}
            <div
              className="flex items-center justify-between flex-wrap"
              style={{
                borderTop: "0.5px solid var(--color-border)",
                padding: "1rem 1.375rem",
                gap: "1rem",
              }}
            >
              {/* Anonymity */}
              <div className="flex items-center" style={{ gap: 6 }}>
                <span
                  className="rounded-full flex-shrink-0"
                  style={{ width: 6, height: 6, background: "#2A6070" }}
                  aria-hidden
                />
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                  Anonimato garantido em todo o processo
                </span>
              </div>

              {/* Compliance badges */}
              <div className="flex flex-wrap justify-end" style={{ gap: 4 }}>
                {BADGES.map((b) => (
                  <span
                    key={b}
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--color-text-tertiary)",
                      background: "var(--color-bg-secondary)",
                      border: "0.5px solid var(--color-border)",
                      borderRadius: 99,
                      padding: "2px 7px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
