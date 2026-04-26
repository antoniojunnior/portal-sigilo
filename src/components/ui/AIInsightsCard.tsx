"use client";

import { useState } from "react";

const INSIGHTS = [
  {
    tag: "PADRÃO",
    tagColor: "var(--color-accent)",
    title: "3 casos similares em Manufatura · turno noturno",
    desc: "Possível causa estrutural — sugiro abrir investigação ampliada.",
  },
  {
    tag: "RISCO",
    tagColor: "var(--color-warning)",
    title: "ETK-2024-0042 ultrapassou prazo de triagem",
    desc: "Recomendo escalar para o comitê externo nas próximas 24h.",
  },
  {
    tag: "TENDÊNCIA",
    tagColor: "var(--color-primary)",
    title: "+38% de relatos via WhatsApp neste trimestre",
    desc: "Considere ampliar a equipe de triagem do canal.",
  },
];

const QUICK_PROMPTS = ["Onde estão os pontos de risco?", "Resumir últimos 30 dias", "Comparar com Q1"];

export function AIInsightsCard() {
  const [input, setInput] = useState("");

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)" }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden>
            <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">Insights de IA</p>
          <p className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">
            Atualizado há 12 min · análise sobre dados anonimizados
          </p>
        </div>
        <span
          className="text-[var(--text-2xs)] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: "var(--color-accent-surface)", color: "var(--color-accent-dark)", letterSpacing: "0.04em" }}
        >
          PLUS
        </span>
      </div>

      {/* Insight cards */}
      <div className="flex-1 overflow-auto p-3.5 flex flex-col gap-2.5">
        {INSIGHTS.map((it) => (
          <div
            key={it.tag}
            className="rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[var(--text-2xs)] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: it.tagColor, color: "#fff", letterSpacing: "0.06em" }}
              >
                {it.tag}
              </span>
              <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-primary)] leading-snug">
                {it.title}
              </span>
            </div>
            <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-relaxed pl-0.5">
              {it.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Chat input */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setInput(q)}
              className="text-[var(--text-2xs)] px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" aria-hidden>
            <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte à IA sobre seus dados…"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-xs)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
          <button
            type="button"
            disabled={!input.trim()}
            aria-label="Enviar"
            className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center hover:bg-[var(--color-primary-dark)] disabled:opacity-40 transition-colors"
          >
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M2 7l10-5-5 10V8L2 7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
