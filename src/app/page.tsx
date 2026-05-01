"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import { CompanySearchResult } from "@/components/ui/CompanySearchResult";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface OrgResult {
  id: string;
  nome: string;
  slug: string;
  logo?: string | null;
}

function formatProtocolo(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 3));
  if (clean.length > 3) parts.push(clean.slice(3, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 13));
  return parts.join("-");
}

export default function Tela0() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  // true from the start because autoFocus fires before React hydration and onFocus never runs
  const [focused, setFocused] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [protocolo, setProtocolo] = useState("");
  const [protocoloResolving, setProtocoloResolving] = useState(false);
  const [protocoloError, setProtocoloError] = useState<string | null>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
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

  async function handleProtocoloSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = protocolo.replace(/\s/g, "");
    if (!cleaned) return;
    setProtocoloError(null);
    setProtocoloResolving(true);
    try {
      const res = await fetch(`/api/cases/resolve?protocolo=${encodeURIComponent(cleaned)}`);
      const data = await res.json() as { found: boolean; slug?: string; org_id?: string };
      if (!data.found || !data.slug || !data.org_id) {
        setProtocoloError("Protocolo não encontrado. Verifique o número e tente novamente.");
        return;
      }
      sessionStorage.setItem("org_id", data.org_id);
      router.push(`/${data.slug}/acompanhar?protocolo=${encodeURIComponent(cleaned)}`);
    } catch {
      setProtocoloError("Erro ao buscar protocolo. Tente novamente.");
    } finally {
      setProtocoloResolving(false);
    }
  }

  const showDropdown = focused && query.trim().length >= 3;

  return (
    <div
      data-portal
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--color-bg-secondary)" }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <LogoSigilo iconSize={48} />
        </div>

        {/* Trust strip */}
        <div
          className="flex items-center justify-center mb-7"
          style={{ gap: "1.25rem" }}
          role="list"
          aria-label="Garantias do canal"
        >
          {([
            {
              label: "Anônimo",
              icon: (
                /* eye-off */
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M1 1l12 12M5.5 5.6A2 2 0 0 0 8.4 8.5M3 3.3C1.7 4.3 1 6 1 6s2 4 6 4c1.1 0 2-.3 2.8-.7M6 2.1C6.3 2 6.7 2 7 2c4 0 6 4 6 4s-.5 1-1.4 2" />
                </svg>
              ),
            },
            {
              label: "Sigiloso",
              icon: (
                /* lock */
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="6" width="10" height="7" rx="1.5" />
                  <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" />
                </svg>
              ),
            },
            {
              label: "Sem rastreamento",
              icon: (
                /* shield-off / no-track */
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 1L2 3v4c0 3 2.3 5 5 6 1-.3 2-.8 2.8-1.5M12 8.1V3L9 2" />
                  <path d="M1 1l12 12" />
                </svg>
              ),
            },
          ] as const).map((item, i) => (
            <span key={item.label} className="flex items-center" style={{ gap: "0.375rem" }} role="listitem">
              {i > 0 && (
                <span
                  className="flex-shrink-0"
                  style={{ width: 1, height: 14, background: "var(--color-border-strong)" }}
                  aria-hidden
                />
              )}
              {item.icon}
              <span className="text-xs font-medium" style={{ color: "#2A6070" }}>
                {item.label}
              </span>
            </span>
          ))}
        </div>

        {/* Main card */}
        <div
          className="w-full mb-5"
          style={{
            background: "var(--color-card)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-center font-medium mb-3"
            style={{
              fontSize: 11,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#C05A4A",
            }}
          >
            Canal de escuta segura
          </p>

          {/* Headline */}
          <h1
            className="text-center mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
            }}
          >
            Você está protegido aqui.
          </h1>

          {/* Subtext */}
          <p
            className="text-center mb-6"
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Encontre o canal da sua empresa e fale com segurança,
            <strong> sem se identificar</strong>.
          </p>

          {/* Search field + dropdown — container handles focus tracking together */}
          <div
            ref={searchContainerRef}
            className="mb-1.5"
            onBlur={(e) => {
              if (!searchContainerRef.current?.contains(e.relatedTarget as Node)) {
                setFocused(false);
              }
            }}
            onFocus={() => setFocused(true)}
          >
            <div className="relative">
              <div
                className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {loading ? (
                  <Spinner size="xs" className="text-[var(--color-primary)]" />
                ) : (
                  <svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <circle cx="6.5" cy="6.5" r="4.5" />
                    <path d="M10 10l3.5 3.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <label className="sr-only" htmlFor="empresa-search">Nome da sua empresa</label>
              <input
                id="empresa-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #2A6070";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.12)";
                  e.currentTarget.style.background = "var(--color-card)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "var(--color-bg-secondary)";
                }}
                placeholder="Nome da sua empresa..."
                autoComplete="off"
                autoFocus
                className="w-full transition-colors focus:outline-none"
                style={{
                  height: 44,
                  paddingLeft: 40,
                  paddingRight: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-secondary)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* Dropdown — inside same container for focus tracking */}
            {showDropdown && (
              <div
                className="mt-1 overflow-hidden"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-card)",
                }}
              >
                {results.length === 0 && !loading ? (
                  <EmptyState
                    illustration="search"
                    title="Nenhuma empresa encontrada"
                    description="Verifique o nome e tente novamente."
                    className="py-5"
                  />
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {results.map((org) => (
                      <CompanySearchResult
                        key={org.id}
                        org={org}
                        onSelect={() => selectOrg(org)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Helper text */}
          <p
            className="text-center"
            style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}
          >
            Digite ao menos 3 letras para buscar
          </p>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-5" aria-hidden>
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              já tem protocolo?
            </span>
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>

          {/* Protocol field */}
          <form
            onSubmit={handleProtocoloSubmit}
            className="flex gap-2"
            aria-label="Acompanhar relato por protocolo"
          >
            <label htmlFor="protocolo-input" className="sr-only">
              Número do protocolo
            </label>
            <input
              id="protocolo-input"
              type="text"
              value={protocolo}
              onChange={(e) => setProtocolo(formatProtocolo(e.target.value))}
              placeholder="ETK-2026-XXXXXX"
              maxLength={15}
              autoComplete="off"
              className="flex-1 font-mono uppercase focus:outline-none transition-colors"
              style={{
                height: 38,
                padding: "0 12px",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-secondary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid #2A6070";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={protocoloResolving}
              className="flex-shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              style={{
                height: 38,
                padding: "0 14px",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border-strong)",
                borderRadius: "var(--radius-md)",
                whiteSpace: "nowrap",
                opacity: protocoloResolving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!protocoloResolving) e.currentTarget.style.background = "var(--color-bg-tertiary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-bg-secondary)"; }}
            >
              {protocoloResolving ? "Buscando…" : "Ver relato"}
            </button>
          </form>

          {protocoloError && (
            <p
              role="alert"
              style={{ fontSize: 12, color: "#b83c3b", marginTop: "0.5rem" }}
            >
              {protocoloError}
            </p>
          )}

          {/* Anonymity banner */}
          <div
            className="flex items-center gap-2.5 mt-5"
            style={{
              background: "rgba(42,96,112,0.06)",
              border: "1px solid rgba(42,96,112,0.2)",
              borderRadius: "var(--radius-md)",
              padding: "0.625rem 0.875rem",
            }}
            role="note"
            aria-label="Garantia de anonimato"
          >
            <span
              className="animate-pulse-slow flex-shrink-0 rounded-full"
              style={{ width: 8, height: 8, background: "#2A6070", display: "block" }}
              aria-hidden
            />
            <p style={{ fontSize: 12, color: "#2A6070", lineHeight: 1.4, margin: 0 }}>
              <strong>Sua identidade não é registrada</strong> em nenhuma etapa deste canal.
            </p>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center flex-wrap gap-2">
            {["Lei 14.457/22", "NR-1", "Lei 14.611/23", "LGPD"].map((l) => (
              <span
                key={l}
                className="font-medium"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  background: "var(--color-bg-secondary)",
                  border: "0.5px solid var(--color-border)",
                  borderRadius: 99,
                  padding: "2px 10px",
                }}
              >
                {l}
              </span>
            ))}
          </div>
          <p
            className="text-center"
            style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
          >
            Canal operado pelo Portal Sigilo · Direitos Reservados
          </p>
        </div>

      </div>
    </div>
  );
}
