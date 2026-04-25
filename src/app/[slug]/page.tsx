import { adminDb } from "@/lib/firebase-admin/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ComoFuncionaModal } from "./ComoFuncionaModal";
import { AcompanharForm } from "./AcompanharForm";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import { SessionOrgId } from "./SessionOrgId";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getOrgBySlug(slug: string) {
  const snap = await adminDb.collection("orgs").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

const GUARANTEES = [
  {
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#0F6E56" strokeWidth="2" aria-hidden>
        <path d="M8 2L4 5v4c0 2.5 1.8 4.7 4 5 2.2-.3 4-2.5 4-5V5L8 2z"/>
      </svg>
    ),
    title: "Anonimato garantido",
    desc: "Nenhum dado que identifique você é coletado ou armazenado.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#0F6E56" strokeWidth="2" aria-hidden>
        <circle cx="8" cy="8" r="5"/><path d="M8 5v3l2 2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Resposta em até 30 dias",
    desc: "Acompanhe o andamento do seu relato pelo número de protocolo.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#0F6E56" strokeWidth="2" aria-hidden>
        <rect x="3" y="6" width="10" height="8" rx="1"/><path d="M5 6V4a3 3 0 016 0v2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Gestão independente",
    desc: "Casos analisados por comitê externo sem conflito de interesse.",
  },
];

export default async function Tela1({ params }: Props) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const boasVindas =
    (org.configuracoes?.boas_vindas as string) ||
    "Este é um espaço seguro para você ser ouvido.";

  return (
    <div className="min-h-dvh bg-[#F8FAFC] flex flex-col">
      <SessionOrgId orgId={org.id as string} />

      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {org.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo as string}
              alt={`Logo ${org.nome as string}`}
              width={180}
              height={32}
              className="h-8 max-w-[180px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" aria-hidden />
              <span className="text-[14px] font-medium text-slate-800">
                {org.nome as string}
              </span>
            </div>
          )}
          <Link
            href={`/${slug}/acompanhar`}
            className="text-[12px] text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded transition-colors inline-flex items-center min-h-[44px]"
          >
            Já tem protocolo? Acompanhe
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-0">

          {/* Hero */}
          <div className="py-14 text-center border-b border-slate-200 bg-white px-10">
            <div className="inline-flex items-center gap-1.5 bg-brand-light text-brand-darkest text-[11px] font-medium px-3 py-1 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" aria-hidden />
              Canal de denúncias seguro e confidencial
            </div>
            <h1 className="text-[26px] font-medium text-slate-900 leading-snug max-w-md mx-auto mb-3">
              {boasVindas}
            </h1>
            <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mx-auto mb-8">
              Relate situações de assédio, fraude ou qualquer irregularidade.
              Sua identidade é protegida durante todo o processo.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <Link
                href={`/${slug}/chat`}
                className="inline-flex items-center justify-center rounded-lg bg-brand px-7 min-h-[44px] text-[14px] font-medium text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
              >
                Fazer uma denúncia
              </Link>
              <ComoFuncionaModal />
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
            {GUARANTEES.map((g, i) => (
              <div
                key={g.title}
                className={`py-5 px-5 text-center ${i < 2 ? "border-r border-slate-200" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-2.5">
                  {g.icon}
                </div>
                <p className="text-[12px] font-medium text-slate-700 mb-1">{g.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>

          {/* Protocol row */}
          <div className="flex items-center gap-3 bg-[#F8FAFC] border-b border-slate-200 px-6 py-4">
            <span className="text-[12px] text-slate-500 whitespace-nowrap">Já tem protocolo?</span>
            <AcompanharForm slug={slug} />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 px-6 py-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between min-h-[44px]">
          <p className="text-[11px] text-slate-400">
            Canal operado pelo{" "}
            <LogoSigilo variant="icon" iconSize={13} className="inline-flex align-middle mx-0.5" />
            <span className="font-medium" style={{ color: "#00B5AD" }}>Portal Sigilo</span>
            {" "}· LGPD compliant
          </p>
          <div className="flex gap-1.5">
            {["Lei 14.457/22", "NR-1", "LGPD"].map((l) => (
              <span key={l} className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full border border-slate-200">
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
