"use client";

import { useState } from "react";

export function ComoFuncionaModal() {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      n: "1",
      title: "Você relata",
      desc: "Conte o que aconteceu com suas próprias palavras. Nenhum dado que identifique você é solicitado ou armazenado.",
    },
    {
      n: "2",
      title: "Comitê apura",
      desc: "Um comitê independente analisa o relato com imparcialidade. Você acompanha o andamento pelo protocolo.",
    },
    {
      n: "3",
      title: "Conclusão",
      desc: "Você recebe uma resposta em até 30 dias. O resultado pode ser consultado a qualquer momento pelo protocolo.",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
      >
        Como funciona?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Como funciona o portal"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Como funciona</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-4 px-6 py-5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-[12px] font-semibold text-brand-darkest">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800 mb-1">{s.title}</p>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center">
                Anonimato garantido · Em conformidade com Lei 14.457/22, NR-1 e LGPD
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
