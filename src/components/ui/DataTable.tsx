"use client";

import React from "react";
import { Skeleton } from "./Skeleton";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado.",
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                {columns.map((col, i) => (
                  <th key={i} className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ${col.headerClassName}`}>
                    <Skeleton height="12px" width="60px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                  {columns.map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <Skeleton height="16px" width="80%" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ${col.headerClassName}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`group transition-colors hover:bg-[var(--color-card-hover)] ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={`px-5 py-4 text-sm text-[var(--color-text-primary)] ${col.className}`}>
                      {typeof col.accessor === "function" ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/10 px-5 py-3">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Página <span className="font-bold text-[var(--color-text-primary)]">{pagination.currentPage}</span> de <span className="font-bold text-[var(--color-text-primary)]">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-card-hover)] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-card-hover)] disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
