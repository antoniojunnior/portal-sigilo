import Link from "next/link";
import { DownloadComprovante } from "./DownloadComprovante";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ protocolo?: string }>;
}

const STATUS_STEPS = [
  { key: "recebido", label: "Recebido", icon: "✓" },
  { key: "em_apuracao", label: "Em apuração", icon: "○" },
  { key: "conclusao", label: "Conclusão", icon: "○" },
];

export default async function Tela3({ params, searchParams }: Props) {
  const { slug } = await params;
  const { protocolo } = await searchParams;

  if (!protocolo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <p className="text-zinc-600 text-sm">Protocolo não encontrado.</p>
      </div>
    );
  }

  const dataRelato = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Ícone de sucesso */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl mb-3">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Relato registrado</h1>
          <p className="text-sm text-zinc-500 mt-1">Guarde o número abaixo.</p>
        </div>

        {/* Protocolo em destaque */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 text-center space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Número do protocolo
          </p>
          <p className="font-mono text-2xl font-bold text-zinc-900 tracking-widest">
            {protocolo}
          </p>
          <div className="space-y-1 pt-1">
            <p className="text-sm text-zinc-600">
              Guarde este número. <strong>Nenhum dado seu está vinculado a ele.</strong>
            </p>
            <p className="text-sm text-zinc-600">
              Sem ele, não é possível acompanhar este relato.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <ol className="flex items-center justify-between" aria-label="Status do relato">
            {STATUS_STEPS.map((step, i) => (
              <li key={step.key} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    i === 0
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white border-zinc-300 text-zinc-400"
                  }`}
                  aria-current={i === 0 ? "step" : undefined}
                >
                  {step.icon}
                </div>
                <span className={`text-xs text-center ${i === 0 ? "font-semibold text-green-600" : "text-zinc-400"}`}>
                  {step.label}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className="absolute" />
                )}
              </li>
            ))}
          </ol>
          <p className="text-center text-xs text-zinc-500 mt-4">
            Você receberá um retorno em até 30 dias.
          </p>
        </div>

        {/* Data */}
        <p className="text-center text-xs text-zinc-400">
          Registrado em {dataRelato}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/${slug}/acompanhar?protocolo=${encodeURIComponent(protocolo)}`}
            className="flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            Acompanhar pelo protocolo
          </Link>

          <DownloadComprovante protocolo={protocolo} data={dataRelato} />

          <Link
            href={`/${slug}`}
            className="flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
