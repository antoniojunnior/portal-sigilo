"use client";

const DEPARTMENTS = ["Operações", "Comercial", "Logística", "RH", "Financeiro", "TI", "Manufatura"];
const CATEGORIES = ["Assédio", "Fraude", "Conflito", "Segurança", "Discrim.", "Outros"];

const DATA: number[][] = [
  [3, 1, 0, 2, 1, 0],
  [1, 2, 3, 0, 1, 1],
  [0, 0, 1, 4, 0, 1],
  [2, 0, 1, 0, 2, 1],
  [0, 3, 2, 0, 0, 0],
  [1, 1, 0, 1, 0, 2],
  [0, 0, 0, 4, 0, 1],
];

function cellBg(v: number): string {
  if (v === 0) return "var(--color-bg-secondary)";
  if (v === 1) return "#E8F2F5";
  if (v === 2) return "#C9DDE3";
  if (v === 3) return "#D4806E";
  return "#9A2020";
}

function cellFg(v: number): string {
  return v >= 3 ? "#fff" : v === 0 ? "var(--color-text-disabled)" : "var(--color-text-secondary)";
}

export function Heatmap() {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
            Concentração por departamento
          </h3>
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-0.5">
            Casos abertos × categoria — últimos 90 dias
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">
          <span>menos</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <span
              key={v}
              style={{ background: cellBg(v), width: 12, height: 12, borderRadius: 3, border: "1px solid var(--color-border)", display: "inline-block" }}
            />
          ))}
          <span>mais</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `118px repeat(${CATEGORIES.length}, 1fr)`,
          gap: 4,
        }}
      >
        {/* Header row */}
        <div />
        {CATEGORIES.map((c) => (
          <div
            key={c}
            className="text-[var(--text-2xs)] font-medium text-[var(--color-text-tertiary)] text-center py-1"
          >
            {c}
          </div>
        ))}

        {/* Data rows */}
        {DEPARTMENTS.map((dept, r) => (
          <>
            <div key={`label-${dept}`} className="text-[var(--text-xs)] text-[var(--color-text-secondary)] flex items-center py-1 px-2">
              {dept}
            </div>
            {DATA[r].map((v, c) => (
              <div
                key={`${r}-${c}`}
                title={`${dept} · ${CATEGORIES[c]}: ${v} caso${v !== 1 ? "s" : ""}`}
                style={{
                  background: cellBg(v),
                  color: cellFg(v),
                  aspectRatio: "1.4 / 1",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v > 0 ? v : ""}
              </div>
            ))}
          </>
        ))}
      </div>

      <p className="mt-4 pt-3 border-t border-dashed border-[var(--color-border)] text-[var(--text-xs)] text-[var(--color-text-secondary)]">
        ↗ <strong className="text-[var(--color-danger)]">RH</strong> e{" "}
        <strong className="text-[var(--color-danger)]">Manufatura</strong> concentram 53% das ocorrências em{" "}
        <em>Segurança</em>.
      </p>
    </div>
  );
}
