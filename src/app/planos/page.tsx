"use client";

import { useState } from "react";
import { PLANOS } from "@/lib/planos";
import { BillingToggle } from "./BillingToggle";
import { PlanoCard } from "./PlanoCard";

export default function PlanosPage() {
  const [parcelas, setParcelas] = useState(12);

  return (
    <main data-portal className="min-h-screen bg-[var(--color-bg-secondary)] px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-center">
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
            LGPD · ISO 27001 · Criptografia ponta a ponta · Suporte incluso
          </p>
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)]">
            Proteção real. Conformidade garantida.
          </h1>
          <p className="mt-4 text-[var(--text-md)] text-[var(--color-text-secondary)]">
            Implante um canal de denúncias LGPD-compliant em minutos — sem jurídico, sem infraestrutura.
          </p>
          <div className="mt-8 flex justify-center">
            <BillingToggle value={parcelas} onChange={setParcelas} />
          </div>
        </div>

        <div>
          {PLANOS.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} parcelas={parcelas} />
          ))}
        </div>

        <p className="mt-10 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          Assinatura anual. Cancele quando quiser.
        </p>
      </div>
    </main>
  );
}
