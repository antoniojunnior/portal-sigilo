"use client";

import { useState } from "react";

export function ComoFuncionaModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
      >
        Como funciona?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 id="modal-title" className="text-lg font-semibold text-zinc-900">
              Como funciona o Portal Sigilo?
            </h2>

            <ul className="space-y-3 text-sm text-zinc-600">
              {[
                ["🔒", "Seu relato é 100% anônimo. Não coletamos nome, e-mail, IP ou qualquer dado identificador."],
                ["📋", "Você recebe um protocolo único para acompanhar o andamento do relato."],
                ["👥", "Um comitê independente analisa e apura cada caso com imparcialidade."],
                ["⏱️", "O prazo padrão de resposta é de 30 dias."],
                ["📎", "Você pode enviar arquivos (imagens, vídeos, áudios, PDFs) como evidências."],
                ["💬", "Você pode responder perguntas do comitê mantendo o anonimato."],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0" aria-hidden>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-zinc-900 text-white py-2.5 text-sm font-medium hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
