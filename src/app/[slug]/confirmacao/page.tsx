import Link from "next/link";
import { DownloadComprovante } from "./DownloadComprovante";
import { LogoSigilo } from "@/components/portal/LogoSigilo";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ protocolo?: string }>;
}

const STEPS = [
  { n: "1", label: "Recebido", desc: "Relato registrado e em análise inicial." },
  { n: "2", label: "Em apuração", desc: "Comitê conduz a investigação com imparcialidade." },
  { n: "3", label: "Conclusão", desc: "Resultado consultável pelo protocolo." },
];

export default async function Tela3({ params, searchParams }: Props) {
  const { slug } = await params;
  const { protocolo } = await searchParams;

  if (!protocolo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <p className="text-[13px] text-slate-500">Protocolo não encontrado.</p>
      </div>
    );
  }

  const dataRelato = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-dvh bg-[#F8FAFC] flex flex-col">

      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-2xl mx-auto">
          <LogoSigilo iconSize={28} />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-0">

        {/* Confirmation hero */}
        <div className="py-10 text-center border-b border-slate-200 bg-white -mx-6 px-6">
          <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#0F6E56" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M5 14l6 6L23 8"/>
            </svg>
          </div>
          <h1 className="text-[18px] font-semibold text-slate-900 mb-2">Relato recebido com sucesso.</h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-sm mx-auto">
            Seu relato foi registrado de forma segura e anônima. O comitê responsável será notificado e a apuração terá início em até 5 dias úteis.
          </p>
        </div>

        {/* Protocol card */}
        <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-6">
          <div className="max-w-xs mx-auto text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Número de protocolo
            </p>
            <p className="font-mono text-[24px] font-bold text-slate-900 tracking-widest mb-4">
              {protocolo}
            </p>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-lg px-4 py-3 text-left">
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Guarde este número. Ele é a <strong>única forma de acompanhar</strong> o andamento do seu relato. Nenhum dado seu está vinculado a ele.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 bg-white border-b border-slate-200 -mx-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`py-5 px-4 text-center ${i < 2 ? "border-r border-slate-200" : ""}`}>
              <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-2 text-[11px] font-semibold text-brand-darkest">
                {s.n}
              </div>
              <p className="text-[11px] font-semibold text-slate-700 mb-1">{s.label}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Date */}
        <div className="py-3 text-center bg-white border-b border-slate-200 -mx-6 px-6">
          <p className="text-[11px] text-slate-400">Registrado em {dataRelato}</p>
        </div>

        {/* CTAs */}
        <div className="bg-white -mx-6 px-6 py-5 flex flex-col gap-2.5">
          <Link
            href={`/${slug}/acompanhar?protocolo=${encodeURIComponent(protocolo)}`}
            className="flex items-center justify-center rounded-lg bg-brand px-6 min-h-[44px] text-[13px] font-semibold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
          >
            Acompanhar pelo protocolo
          </Link>

          <DownloadComprovante protocolo={protocolo} data={dataRelato} />

          <Link
            href={`/${slug}`}
            className="flex items-center justify-center rounded-lg border border-slate-200 px-6 min-h-[44px] text-[13px] font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
          >
            Voltar ao início
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 px-6 py-3.5 mt-auto">
        <p className="text-[11px] text-slate-400 text-center">
          Este canal é operado pelo Portal Sigilo · Em conformidade com a Lei 14.457/22, NR-1 e LGPD
        </p>
      </footer>

    </div>
  );
}
