"use client";

import type React from "react";

interface ChatBubbleProps {
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  textoJsx?: React.ReactNode;
  timestamp?: string;
}

const LABEL: Record<string, string> = {
  sistema: "Canal Sigilo",
  gestor: "Comitê",
  denunciante: "Você",
};

/* Mini logo SVG for sistema avatar */
function SistemaAvatar() {
  return (
    <div
      className="mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 28,
        height: 28,
        background: "rgba(42,96,112,0.10)",
        border: "0.5px solid rgba(42,96,112,0.20)",
      }}
    >
      <svg viewBox="0 0 40 50" width="13" height="16" fill="none" aria-hidden>
        <path d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8" stroke="#2A6070" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z" fill="#C05A4A"/>
      </svg>
    </div>
  );
}

function GestorAvatar() {
  return (
    <div
      className="mt-0.5 flex-shrink-0 rounded-full"
      style={{
        width: 28,
        height: 28,
        background: "var(--color-accent-surface)",
        border: "0.5px solid rgba(192,90,74,0.20)",
        flexShrink: 0,
      }}
    />
  );
}

export function ChatBubble({ autor, texto, textoJsx, timestamp }: ChatBubbleProps) {
  const isUser = autor === "denunciante";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        autor === "gestor" ? <GestorAvatar /> : <SistemaAvatar />
      )}

      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        <span className="px-0.5" style={{ fontSize: 11, fontWeight: 500 }}>
          <span
            style={{
              color: isUser
                ? "var(--color-text-tertiary)"
                : autor === "gestor"
                  ? "var(--color-accent-dark)"
                  : "#2A6070",
            }}
          >
            {LABEL[autor] ?? autor}
          </span>
          {timestamp && (
            <span style={{ marginLeft: 6, fontWeight: 400, color: "var(--color-text-tertiary)", fontSize: 10 }}>
              {new Date(timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </span>

        <div
          className="whitespace-pre-wrap leading-relaxed"
          style={{
            borderRadius: isUser
              ? "var(--radius-xl) var(--radius-xl) 0 var(--radius-xl)"
              : "0 var(--radius-xl) var(--radius-xl) var(--radius-xl)",
            padding: "0.875rem 1rem",
            fontSize: 13,
            lineHeight: 1.65,
            ...(isUser
              ? {
                  background: "#2A6070",
                  color: "white",
                }
              : autor === "gestor"
                ? {
                    background: "var(--color-accent-surface)",
                    color: "var(--color-text-primary)",
                    border: "0.5px solid rgba(192,90,74,0.20)",
                  }
                : {
                    background: "var(--color-card)",
                    color: "var(--color-text-secondary)",
                    border: "0.5px solid var(--color-border)",
                  }),
          }}
        >
          {textoJsx ?? texto}
        </div>
      </div>
    </div>
  );
}
