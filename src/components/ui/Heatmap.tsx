"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";

interface HeatmapRow {
  dept: string;
  values: number[];
}

interface HeatmapData {
  departments: string[];
  categories: string[];
  rows: HeatmapRow[];
}

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
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/heatmap")
      .then((r) => r.ok ? r.json() as Promise<HeatmapData> : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
            Concentração por departamento
          </h3>
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-0.5">
            Casos abertos × categoria — últimos 90 dias
          </p>
        </div>
        {!loading && data && (
          <div className="flex items-center gap-1.5 text-[var(--text-2xs)] text-[var(--color-text-tertiary)] flex-shrink-0">
            <span>menos</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <span
                key={v}
                style={{ background: cellBg(v), width: 12, height: 12, borderRadius: 3, border: "1px solid var(--color-border)", display: "inline-block" }}
              />
            ))}
            <span>mais</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="28px" rounded="sm" />
          ))}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          Nenhum dado disponível ainda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `min(130px, 38%) repeat(${data.categories.length}, 1fr)`,
              gap: 4,
              minWidth: 320,
            }}
          >
            {/* Header row */}
            <div />
            {data.categories.map((c) => (
              <div
                key={c}
                className="text-[var(--text-2xs)] font-medium text-[var(--color-text-tertiary)] text-center py-1 truncate px-0.5"
                title={c}
              >
                {c.length > 8 ? c.slice(0, 7) + "…" : c}
              </div>
            ))}

            {/* Data rows */}
            {data.rows.map((row) => (
              <>
                <div
                  key={`label-${row.dept}`}
                  className="text-[var(--text-xs)] text-[var(--color-text-secondary)] flex items-center py-1 px-1 truncate"
                  title={row.dept}
                >
                  {row.dept}
                </div>
                {row.values.map((v, ci) => (
                  <div
                    key={`${row.dept}-${ci}`}
                    title={`${row.dept} · ${data.categories[ci]}: ${v} caso${v !== 1 ? "s" : ""}`}
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
                      cursor: v > 0 ? "default" : "default",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {v > 0 ? v : ""}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
