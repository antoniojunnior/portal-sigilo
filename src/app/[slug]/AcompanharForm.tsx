"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcompanharFormProps {
  slug: string;
}

function formatProtocolo(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 3)); // ETK
  if (clean.length > 3) parts.push(clean.slice(3, 7)); // YYYY
  if (clean.length > 7) parts.push(clean.slice(7, 13)); // XXXXXX
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
        className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 uppercase"
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
      >
        Acompanhar
      </button>
    </form>
  );
}
