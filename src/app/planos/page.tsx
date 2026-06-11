import { PLANOS } from "@/lib/planos";
import { PlanoCard } from "./PlanoCard";

export default function PlanosPage() {
  return (
    <main data-portal className="min-h-screen bg-[var(--color-bg-secondary)] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
            Planos Portal Sigilo
          </h1>
          <p className="mt-4 text-[var(--text-md)] text-[var(--color-text-secondary)]">
            Canal de denúncias corporativo com IA. Simples, seguro e eficaz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANOS.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>

        <p className="mt-10 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          Todos os planos incluem conformidade com LGPD, criptografia de dados e
          suporte por e-mail.
        </p>
      </div>
    </main>
  );
}
