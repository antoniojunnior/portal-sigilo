import { adminDb } from "@/lib/firebase-admin/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ComoFuncionaModal } from "./ComoFuncionaModal";
import { AcompanharForm } from "./AcompanharForm";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getOrgBySlug(slug: string) {
  const snapshot = await adminDb
    .collection("orgs")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

export default async function Tela1({ params }: Props) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);

  if (!org) notFound();

  const boasVindas =
    (org.configuracoes?.boas_vindas as string) ||
    "Este é um espaço seguro para você ser ouvido.";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {org.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo as string}
              alt={`Logo ${org.nome as string}`}
              className="h-10 max-w-[200px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {(org.nome as string).charAt(0)}
              </div>
              <span className="font-semibold text-zinc-800">{org.nome as string}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold text-zinc-900 leading-snug">
              {boasVindas}
            </h1>
            <p className="text-zinc-500 text-sm">
              Suas informações não são coletadas. O relato é completamente anônimo.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${slug}/chat`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              Contar o que aconteceu
            </Link>
            <ComoFuncionaModal />
          </div>

          {/* Garantias */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔒", title: "Anônimo", desc: "Sem identificação pessoal" },
              { icon: "🚫", title: "Sem rastreio", desc: "Nenhum dado coletado" },
              { icon: "🏛️", title: "Gestão independente", desc: "Comitê imparcial" },
            ].map((g) => (
              <div
                key={g.title}
                className="bg-white rounded-xl border border-zinc-200 p-4 space-y-1"
              >
                <div className="text-2xl" aria-hidden>{g.icon}</div>
                <div className="text-xs font-semibold text-zinc-700">{g.title}</div>
                <div className="text-xs text-zinc-400">{g.desc}</div>
              </div>
            ))}
          </div>

          {/* Acompanhar protocolo */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
            <p className="text-sm font-medium text-zinc-700">
              Já tem um protocolo? Acompanhe seu relato:
            </p>
            <AcompanharForm slug={slug} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-100 py-4 px-4">
        <p className="text-center text-xs text-zinc-400">
          Em conformidade com{" "}
          <span className="font-medium text-zinc-500">Lei 14.457/22</span> ·{" "}
          <span className="font-medium text-zinc-500">NR-1</span> ·{" "}
          <span className="font-medium text-zinc-500">LGPD</span>
          <br />
          Canal operado pelo Portal Sigilo
        </p>
      </footer>
    </div>
  );
}
