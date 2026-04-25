"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogoSigilo } from "@/components/portal/LogoSigilo";

interface OrgResult {
  id: string;
  nome: string;
  slug: string;
  logo?: string | null;
}

export default function Tela0() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { orgs: OrgResult[] };
      setResults(data.orgs ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function selectOrg(org: OrgResult) {
    sessionStorage.setItem("org_id", org.id);
    router.push(`/${org.slug}`);
  }

  const showDropdown = focused && query.trim().length >= 2;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <LogoSigilo iconSize={48} />
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="6" cy="7" r="3"/><path d="M6 4V2M4 4.5L2.5 3M8 4.5L9.5 3"/>
              </svg>
              inteligente
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M10 2H2C1.45 2 1 2.45 1 3v5c0 .55.45 1 1 1h1l1 2 1-2h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z"/>
              </svg>
              conecta
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 1L2 3v3c0 2.5 1.8 4.5 4 5 2.2-.5 4-2.5 4-5V3L6 1z"/>
              </svg>
              protege
            </span>
          </div>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-[15px] font-semibold text-slate-800 mb-1">Acesse seu canal</h1>
            <p className="text-[12px] text-slate-500 mb-4">Digite o nome da empresa para encontrar o portal de denúncias.</p>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {loading ? (
                  <svg className="animate-spin" viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
                    <circle cx="8" cy="8" r="6" stroke="#CBD5E1" strokeWidth="2"/>
                    <path d="M14 8a6 6 0 0 0-6-6" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="1.5" aria-hidden>
                    <circle cx="6.5" cy="6.5" r="4.5"/>
                    <path d="M10 10l3.5 3.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Buscar empresa…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:bg-white transition-colors"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          {showDropdown && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {results.length === 0 && !loading ? (
                <div className="px-6 py-4 text-[12px] text-slate-400 text-center">
                  Nenhuma empresa encontrada.
                </div>
              ) : (
                results.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => selectOrg(org)}
                    className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 text-left transition-colors focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {org.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logo} alt="" className="w-8 h-8 rounded object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-brand-dark">
                        {org.nome.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800">{org.nome}</p>
                      <p className="text-[11px] text-slate-400">{org.slug}</p>
                    </div>
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="#CBD5E1" strokeWidth="1.5" aria-hidden>
                      <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="px-6 py-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 text-center">
              Digite ao menos 2 caracteres para buscar
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            {["Lei 14.457/22", "NR-1", "LGPD"].map((l) => (
              <span key={l} className="text-[10px] text-slate-400 px-2 py-0.5 rounded border border-slate-200">{l}</span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Canal operado pelo Portal Sigilo · portalsigilo.com.br</p>
        </div>

      </div>
    </div>
  );
}
