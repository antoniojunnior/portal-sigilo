"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcompanharFormProps {
  slug: string;
}

function formatProtocolo(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 3));
  if (clean.length > 3) parts.push(clean.slice(3, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 13));
  return parts.join("-");
}

export function AcompanharForm({ slug }: AcompanharFormProps) {
  const router = useRouter();
  const [protocolo, setProtocolo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = protocolo.replace(/\s/g, "");
    if (!cleaned) return;
    router.push(`/${slug}/acompanhar?protocolo=${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="protocolo-input" className="sr-only">
        Número do protocolo
      </label>
      <input
        id="protocolo-input"
        type="text"
        value={protocolo}
        onChange={(e) => setProtocolo(formatProtocolo(e.target.value))}
        placeholder="ETK-2026-XXXXXX"
        maxLength={14}
        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 min-h-[44px] text-[13px] font-mono text-slate-800 placeholder:text-slate-400 uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:bg-white transition-colors"
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-4 min-h-[44px] text-[13px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors whitespace-nowrap cursor-pointer"
      >
        Acompanhar
      </button>
    </form>
  );
}
