"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface OrgResult {
  id: string;
  nome: string;
  slug: string;
  logo: string | null;
  plano_ativo: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Tela0() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [codigoAcesso, setCodigoAcesso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const searchOrgs = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { orgs: OrgResult[] };
      setResults(data.orgs ?? []);
    } catch {
      setError("Erro ao buscar empresas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void searchOrgs(debouncedQuery);
  }, [debouncedQuery, searchOrgs]);

  function selectOrg(org: OrgResult) {
    // Armazenar em sessionStorage — nunca cookie, nunca localStorage
    sessionStorage.setItem("org_id", org.id);
    sessionStorage.setItem("org_nome", org.nome);
    sessionStorage.removeItem("unit_id");
    router.push(`/${org.slug}`);
  }

  function handleCodigoAcesso(e: React.FormEvent) {
    e.preventDefault();
    const slug = codigoAcesso.trim().toLowerCase();
    if (!slug) return;
    router.push(`/${slug}`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / header institucional */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-2">
            S
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">Portal Sigilo</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Canal seguro e sigiloso de relatos corporativos.
            <br />
            Encontre a empresa para continuar.
          </p>
        </div>

        {/* Busca por nome */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="busca-empresa" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Buscar empresa
            </label>
            <input
              id="busca-empresa"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome da empresa…"
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Buscar empresa pelo nome"
              aria-describedby="busca-hint"
            />
            <p id="busca-hint" className="mt-1 text-xs text-zinc-400">
              Mínimo 3 caracteres para iniciar a busca.
            </p>
          </div>

          {loading && (
            <p className="text-sm text-zinc-400 text-center" role="status">
              Buscando…
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {results.length > 0 && (
            <ul
              className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden"
              role="listbox"
              aria-label="Empresas encontradas"
            >
              {results.map((org) => (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => selectOrg(org)}
                    role="option"
                    aria-selected={false}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left transition-colors"
                  >
                    {org.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt={`Logo ${org.nome}`}
                        className="h-8 w-8 rounded object-contain flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="h-8 w-8 rounded bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-bold flex-shrink-0"
                        aria-hidden
                      >
                        {org.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-800">{org.nome}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {debouncedQuery.length >= 3 && !loading && results.length === 0 && !error && (
            <p className="text-sm text-zinc-500 text-center" role="status">
              Não encontramos essa empresa. Verifique o código fornecido ou use o QR Code do seu local de trabalho.
            </p>
          )}
        </div>

        {/* Acesso por código */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <form onSubmit={handleCodigoAcesso} className="space-y-3">
            <label htmlFor="codigo-acesso" className="block text-sm font-medium text-zinc-700">
              Ou entre com o código de acesso
            </label>
            <div className="flex gap-2">
              <input
                id="codigo-acesso"
                type="text"
                value={codigoAcesso}
                onChange={(e) => setCodigoAcesso(e.target.value)}
                placeholder="ex: minha-empresa"
                autoComplete="off"
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
              >
                Acessar
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Nenhum dado seu é registrado nesta tela.
        </p>
      </div>
    </main>
  );
}
