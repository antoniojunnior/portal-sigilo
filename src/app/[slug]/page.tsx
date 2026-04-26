import { adminDb } from "@/lib/firebase-admin/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ComoFuncionaModal } from "./ComoFuncionaModal";
import { AcompanharForm } from "./AcompanharForm";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import { SessionOrgId } from "./SessionOrgId";
import { AnonymousBadge } from "@/components/ui/AnonymousBadge";
import { PortalFooter } from "@/components/layout/PortalFooter";

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
    title: "Anonimato garantido",
    desc: "Nenhum dado que identifique você é coletado ou armazenado.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10 2L3 5v5c0 4.4 3 8.3 7 9.4 4-1.1 7-5 7-9.4V5L10 2z" />
        <path d="M7 10l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Resposta em até 30 dias",
    desc: "Acompanhe o andamento pelo número de protocolo gerado.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l2.5 2.5" />
      </svg>
    ),
  },
  {
    title: "Gestão independente",
    desc: "Casos analisados por comitê sem conflito de interesse.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
        <path d="M11 6h4a2 2 0 012 2v3" />
        <path d="M9 14H5a2 2 0 01-2-2v-3" />
      </svg>
    ),
  },
];

export default async function Tela1({ params }: Props) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const orgNome = org.nome as string;

  return (
    <div data-portal className="min-h-dvh flex flex-col" style={{ background: "var(--color-bg-secondary)" }}>
      <SessionOrgId orgId={org.id as string} orgNome={orgNome} />

      {/* Topbar */}
      <header
        className="bg-[var(--color-card)] flex-shrink-0 sticky top-0 z-[var(--z-sticky)]"
        style={{
          minHeight: 52,
          borderBottom: "0.5px solid var(--color-border)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between h-full min-h-[52px] gap-3"
          style={{ maxWidth: 580, padding: "0 2rem" }}
        >
          {/* Left: logo + divider + org context */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex sm:hidden flex-shrink-0">
              <LogoSigilo variant="icon" iconSize={22} />
            </span>
            <span className="hidden sm:flex items-center flex-shrink-0">
              <LogoSigilo iconSize={22} />
            </span>
            <span
              className="flex-shrink-0"
              style={{ width: 0.5, height: 20, background: "var(--color-border)" }}
              aria-hidden
            />
            <span
              className="truncate min-w-0"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}
            >
              canal de{" "}
              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {orgNome}
              </span>
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href={`/${slug}/acompanhar`}
              className="hidden sm:inline transition-colors whitespace-nowrap"
              style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-tertiary)" }}
            >
              Já falou antes?
            </Link>
            <AnonymousBadge />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto" style={{ maxWidth: 580 }}>

          {/* Hero */}
          <div
            className="text-center"
            style={{ padding: "3.5rem 1.5rem 2.5rem" }}
          >
            {/* Eyebrow pill */}
            <div
              className="inline-flex items-center gap-2 mb-5"
              style={{
                background: "var(--color-card)",
                border: "0.5px solid var(--color-border)",
                borderRadius: 99,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 7, height: 7, background: "#C05A4A" }}
                aria-hidden
              />
              Canal ativo · {orgNome}
            </div>

            {/* Headline */}
            <h1
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--weight-medium)",
                lineHeight: "var(--leading-normal)",
                letterSpacing: "var(--tracking-tight)",
                color: "var(--color-text-primary)",
              }}
            >
              Este é o seu{" "}<span style={{ color: "var(--color-primary)" }}>espaço</span>.
              <br />
              Fale com{" "}
              <span style={{ color: "var(--color-accent)" }}>segurança</span>.
            </h1>

            {/* Subtext */}
            <p
              className="mx-auto mb-8"
              style={{
                fontSize: 15,
                color: "var(--color-text-secondary)",
                lineHeight: 1.65,
                maxWidth: 440,
              }}
            >
              Conte o que aconteceu sem se identificar. Nenhum dado seu
              é registrado, <strong>apenas o que você escolher compartilhar</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href={`/${slug}/chat`}
                className="btn-primary-petroleo inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] w-full sm:w-auto"
                style={{
                  height: 44,
                  padding: "0 24px",
                  color: "white",
                  borderRadius: "var(--radius-md)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
                aria-label="Quero falar agora — iniciar relato"
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v4l2.5 2.5" />
                </svg>
                Quero falar agora
              </Link>
              <ComoFuncionaModal slug={slug} />
            </div>
          </div>

          {/* Divider line */}
          <div
            className="mx-auto"
            style={{
              maxWidth: 580,
              borderTop: "0.5px solid var(--color-border)",
            }}
            aria-hidden
          />

          {/* Guarantee cards — 1 col mobile, 3 col sm+ */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3"
            style={{
              background: "var(--color-card)",
              borderLeft: "0.5px solid var(--color-border)",
              borderBottom: "0.5px solid var(--color-border)",
            }}
          >
            {GUARANTEES.map((g, i) => (
              <div
                key={g.title}
                className="text-center"
                style={{
                  padding: "1.75rem 1.5rem",
                  borderRight: "0.5px solid var(--color-border)",
                  ...(i < 2
                    ? { borderBottom: "0.5px solid var(--color-border)" }
                    : {}),
                }}
              >
                {/* Icon container */}
                <div
                  className="mx-auto flex items-center justify-center rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(42,96,112,0.08)",
                    marginBottom: "0.875rem",
                  }}
                >
                  {g.icon}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    marginBottom: "0.4rem",
                    lineHeight: 1.3,
                  }}
                >
                  {g.title}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {g.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Protocol bar */}
          <div
            className="flex items-center gap-4"
            style={{
              background: "var(--color-card)",
              borderLeft: "0.5px solid var(--color-border)",
              borderRight: "0.5px solid var(--color-border)",
              borderBottom: "0.5px solid var(--color-border)",
              padding: "1rem 1.5rem",
            }}
          >
            <label
              htmlFor="protocolo-slug-input"
              className="hidden sm:block whitespace-nowrap flex-shrink-0"
              style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
            >
              Já falou antes?
            </label>
            <AcompanharForm slug={slug} inputId="protocolo-slug-input" />
          </div>

        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
