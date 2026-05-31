"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PLANOS } from "@/lib/planos";
import type { PlanoConfig } from "@/lib/types";

function PlanoCard({ plano }: { plano: PlanoConfig }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleContratar() {
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: plano.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErro(data.error ?? "Erro ao iniciar checkout. Tente novamente.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleEnterprise() {
    const contact = process.env.NEXT_PUBLIC_SALES_CONTACT ?? "mailto:vendas@portalsigilo.com.br";
    window.location.href = contact;
  }

  const isEnterprise = plano.id === "enterprise";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
        plano.destaque
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
          : "border-gray-200 bg-white"
      }`}
    >
      {plano.destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
          Mais popular
        </span>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">{plano.nome}</h2>
        <div className="mt-2">
          {isEnterprise ? (
            <p className="text-2xl font-bold text-gray-900">Sob consulta</p>
          ) : (
            <>
              <span className="text-3xl font-bold text-gray-900">
                R$ {plano.precoMensal}
              </span>
              <span className="text-sm text-gray-500">/mês</span>
              <p className="mt-1 text-sm text-gray-500">
                ou R$ {plano.precoAnual}/mês no plano anual
              </p>
            </>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plano.features.map((f) => (
          <li
            key={f.descricao}
            className={`flex items-center gap-2 text-sm ${
              f.disponivel ? "text-gray-700" : "text-gray-400"
            }`}
          >
            {f.disponivel ? (
              <Check className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-gray-300" />
            )}
            <span className={f.disponivel ? "" : "line-through opacity-50"}>
              {f.descricao}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2">
        {erro && (
          <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </p>
        )}
        {isEnterprise ? (
          <button
            onClick={handleEnterprise}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Falar com vendas
          </button>
        ) : (
          <button
            onClick={handleContratar}
            disabled={loading}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              plano.destaque
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {loading ? "Aguarde..." : "Contratar"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Planos Portal Sigilo
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Canal de denúncias corporativo com IA. Simples, seguro e eficaz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANOS.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Todos os planos incluem conformidade com LGPD, criptografia de dados e
          suporte por e-mail.
        </p>
      </div>
    </main>
  );
}
