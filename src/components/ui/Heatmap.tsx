"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  UserX,
  ShieldOff,
  Ban,
  Scale,
  BookOpen,
  DollarSign,
  AlertTriangle,
  MoreHorizontal,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "./Skeleton";

interface HeatmapRow {
  department: string;
  values: number[];
}

export interface HeatmapApiData {
  rows: { dept: string; values: number[] }[];
  categories: string[];
}

interface HeatmapProps {
  externalData?: HeatmapApiData;
  showFilter?: boolean;
  stickyFirstCol?: boolean;
  title?: string;
  subtitle?: string;
}

// ── Category → icon mapping (keyword-based, categories are dynamic AI output) ──
const ICON_MAP: { keywords: string[]; Icon: LucideIcon }[] = [
  { keywords: ["assédio", "assedio", "moral", "sexual", "harassment", "intimidaç"],  Icon: UserX       },
  { keywords: ["fraude", "fraud", "desvio", "irregular"],                             Icon: ShieldOff   },
  { keywords: ["discrimin", "preconceito", "racismo", "xenofobia"],                   Icon: Ban         },
  { keywords: ["conflito", "interesse", "conflict", "nepotismo", "favor"],            Icon: Scale       },
  { keywords: ["ética", "etica", "conduta", "conduct", "integridade", "compliance"],  Icon: BookOpen    },
  { keywords: ["corrupç", "corrup", "bribe", "suborno", "propina"],                   Icon: DollarSign  },
  { keywords: ["segurança", "seguranca", "acidente", "saúde", "saude", "epi", "nrs"], Icon: AlertTriangle},
  { keywords: ["outros", "other", "geral", "miscel", "não classif", "nao classif"],   Icon: MoreHorizontal},
];

function getCategoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const { keywords, Icon } of ICON_MAP) {
    if (keywords.some((k) => lower.includes(k))) return Icon;
  }
  return Tag;
}

function getRiskStyle(value: number, maxValue: number): React.CSSProperties {
  if (value === 0) return { backgroundColor: "var(--color-bg-secondary)" };
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio <= 0.33) {
    const pct = Math.round(20 + (ratio / 0.33) * 70);
    return { backgroundColor: `color-mix(in srgb, #1A7A5A ${pct}%, var(--color-card))` };
  }
  if (ratio <= 0.66) {
    const pct = Math.round(20 + ((ratio - 0.33) / 0.33) * 70);
    return { backgroundColor: `color-mix(in srgb, #B07020 ${pct}%, var(--color-card))` };
  }
  const pct = Math.round(20 + ((ratio - 0.66) / 0.34) * 70);
  return { backgroundColor: `color-mix(in srgb, #B03030 ${pct}%, var(--color-card))` };
}

function getCellTextColor(value: number, maxValue: number): string {
  if (value === 0) return "transparent";
  return (maxValue > 0 ? value / maxValue : 0) >= 0.45 ? "#ffffff" : "var(--color-primary-dark)";
}

export function Heatmap({
  externalData,
  showFilter = true,
  title = "Concentração por departamento",
  subtitle = "Mapa de calor por categoria registrada",
}: HeatmapProps) {
  const [internalRows, setInternalRows] = useState<HeatmapRow[]>([]);
  const [internalCategories, setInternalCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [loading, setLoading] = useState(!externalData);

  useEffect(() => {
    if (externalData) { setLoading(false); return; }
    setLoading(true);
    fetch("/api/dashboard/heatmap")
      .then((r) => r.ok ? r.json() as Promise<HeatmapApiData> : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => {
        if (d?.rows) {
          setInternalCategories(d.categories || []);
          setInternalRows(d.rows.map((r) => ({ department: r.dept, values: r.values })));
        }
      })
      .catch((err) => console.error("[Heatmap]", err))
      .finally(() => setLoading(false));
  }, [externalData]);

  const rows       = externalData ? externalData.rows.map((r) => ({ department: r.dept, values: r.values })) : internalRows;
  const categories = externalData ? externalData.categories : internalCategories;

  const filteredCategories = useMemo(() => {
    if (!showFilter || selectedCategory === "Todas") return categories;
    return [selectedCategory];
  }, [categories, selectedCategory, showFilter]);

  const filteredRows = useMemo(() => {
    if (!showFilter || selectedCategory === "Todas") return rows;
    const idx = categories.indexOf(selectedCategory);
    if (idx === -1) return rows;
    return rows.map((row) => ({ ...row, values: [row.values[idx]] }));
  }, [rows, categories, selectedCategory, showFilter]);

  const maxValue = useMemo(
    () => Math.max(...filteredRows.flatMap((r) => r.values), 0),
    [filteredRows]
  );

  // ── Derived icon list for visible categories ──
  const catIcons = useMemo(
    () => filteredCategories.map((c) => getCategoryIcon(c)),
    [filteredCategories]
  );

  // ── Legend: risk + category icons ──
  const FullLegend = () => (
    <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
      {/* Risk swatches */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Risco:</span>
        {[
          { color: "#1A7A5A", label: "Baixo" },
          { color: "#B07020", label: "Médio" },
          { color: "#B03030", label: "Alto"  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
            <span className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Category icon index — only when showing all categories */}
      {filteredCategories.length > 1 && (
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-[var(--color-text-secondary)]">Categorias:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {filteredCategories.map((cat, i) => {
              const Icon = catIcons[i];
              return (
                <div key={cat} className="flex items-center gap-1.5 min-w-0">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary-surface)]">
                    <Icon size={12} strokeWidth={1.8} className="text-[var(--color-primary-dark)]" />
                  </div>
                  <span className="truncate text-[11px] text-[var(--color-text-secondary)]">{cat}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="36px" rounded="sm" />)}
        </div>
      </section>
    );
  }

  if (filteredRows.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Nenhum dado disponível ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] overflow-hidden">
      {/* ── Header ── */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        {showFilter && (
          <select
            aria-label="Filtrar categoria"
            className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus-visible:shadow-[var(--shadow-focus)] transition-all hover:bg-[var(--color-card-hover)] cursor-pointer sm:w-auto"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="Todas">Categoria: Todas</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE  (< md)
          [dept fixo 110px] | [células scroll] | [total fixo 40px]
         ══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <div className="flex min-w-0">

          {/* Dept column — fixed */}
          <div className="w-[110px] shrink-0">
            <div className="h-9" />{/* spacer for icon header row */}
            {filteredRows.map((row) => (
              <div key={row.department} className="flex h-10 items-center border-b border-[var(--color-border)] last:border-0 pr-2">
                <p className="text-[11px] font-semibold leading-tight text-[var(--color-primary-dark)] truncate">
                  {row.department}
                </p>
              </div>
            ))}
          </div>

          {/* Cells — horizontal scroll only here */}
          <div className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain">
            {/* Icon headers */}
            <div className="flex h-9 items-center gap-1 pb-1">
              {filteredCategories.map((cat, i) => {
                const Icon = catIcons[i];
                return (
                  <div
                    key={cat}
                    className="flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary-surface)]"
                    title={cat}
                  >
                    <Icon size={13} strokeWidth={1.8} className="text-[var(--color-primary-dark)]" />
                  </div>
                );
              })}
              <div className="w-1 shrink-0" />
            </div>

            {/* Cell rows */}
            {filteredRows.map((row) => (
              <div key={row.department} className="flex h-10 items-center gap-1 border-b border-[var(--color-border)] last:border-0">
                {row.values.map((val, i) => (
                  <div
                    key={`${row.department}-${i}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300"
                    style={getRiskStyle(val, maxValue)}
                    title={`${row.department} / ${filteredCategories[i]}: ${val}`}
                  >
                    {val > 0 && (
                      <span
                        className="text-[9px] font-bold leading-none select-none"
                        style={{ color: getCellTextColor(val, maxValue) }}
                      >
                        {val}
                      </span>
                    )}
                  </div>
                ))}
                <div className="w-1 shrink-0" />
              </div>
            ))}
          </div>

          {/* Total column — fixed */}
          <div className="w-10 shrink-0">
            <div className="flex h-9 items-center justify-center">
              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">Tot</span>
            </div>
            {filteredRows.map((row) => {
              const total = row.values.reduce((s, v) => s + v, 0);
              return (
                <div key={row.department} className="flex h-10 items-center justify-center border-b border-[var(--color-border)] last:border-0">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    {total > 0 ? total : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {filteredCategories.length > 5 && (
          <p className="mt-2 text-center text-[10px] text-[var(--color-text-tertiary)]">
            ← Deslize para ver todas as categorias →
          </p>
        )}

        <FullLegend />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP  (≥ md) — full table with icon headers
         ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="h-10 text-left">
                <th className="sticky left-0 z-10 w-36 bg-[var(--color-card)] pr-4 text-xs font-semibold text-[var(--color-text-secondary)]">
                  Departamento
                </th>
                {filteredCategories.map((cat, i) => {
                  const Icon = catIcons[i];
                  return (
                    <th key={cat} className="px-1 text-center" title={cat}>
                      <div className="mx-auto flex h-7 w-8 items-center justify-center rounded-md bg-[var(--color-primary-surface)]">
                        <Icon size={14} strokeWidth={1.8} className="text-[var(--color-primary-dark)]" />
                      </div>
                    </th>
                  );
                })}
                <th className="px-2 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="animate-in fade-in duration-500">
              {filteredRows.map((row) => {
                const total = row.values.reduce((s, v) => s + v, 0);
                return (
                  <tr
                    key={row.department}
                    className="h-9 border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-card-hover)]"
                  >
                    <td className="sticky left-0 z-10 bg-[var(--color-card)] pr-4 text-xs font-semibold text-[var(--color-primary-dark)] group-hover:bg-[var(--color-card-hover)]">
                      {row.department}
                    </td>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.department}-${index}`}
                        className="border border-[var(--color-card)] px-1 text-center text-sm font-bold transition-all duration-300"
                        style={{
                          ...getRiskStyle(value, maxValue),
                          color: getCellTextColor(value, maxValue),
                        }}
                        title={`${row.department} / ${filteredCategories[index]}: ${value}`}
                      >
                        {value > 0 ? value : ""}
                      </td>
                    ))}
                    <td className="px-2 text-center text-sm font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]/40">
                      {total > 0 ? total : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <FullLegend />
      </div>
    </section>
  );
}
