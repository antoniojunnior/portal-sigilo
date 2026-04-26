import { adminDb } from "@/lib/firebase-admin/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DownloadComprovante } from "./DownloadComprovante";
import { ProtocolDisplay } from "@/components/ui/ProtocolDisplay";
import { AnonymousBadge } from "@/components/ui/AnonymousBadge";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import { PortalFooter } from "@/components/layout/PortalFooter";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ protocolo?: string }>;
}

async function getOrgBySlug(slug: string) {
  const snap = await adminDb.collection("orgs").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

const TIMELINE_STEPS = [
  { label: "Recebido", desc: "Seu relato foi registrado e está em análise inicial.", done: true },
  { label: "Em apuração", desc: "O comitê conduz a investigação com imparcialidade.", done: false },
  { label: "Conclusão", desc: "Você poderá consultar o resultado pelo protocolo.", done: false },
];

export default async function Tela3({ params, searchParams }: Props) {
  const { slug } = await params;
  const { protocolo } = await searchParams;

  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const orgNome = org.nome as string;

  if (!protocolo) {
    return (
      <div data-portal className="min-h-dvh flex items-center justify-center p-4" style={{ background: "var(--color-bg-secondary)" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>Protocolo não encontrado.</p>
      </div>
    );
  }

  const dataRelato = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div data-portal className="flex flex-col min-h-dvh" style={{ background: "var(--color-bg-tertiary)" }}>

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

          {/* Right: badge */}
          <AnonymousBadge className="flex-shrink-0" />
        </div>
      </header>

      {/* Main content */}
      <main
        className="flex-1 w-full mx-auto flex flex-col"
        style={{ maxWidth: 560, padding: "2.5rem 1.25rem 2rem", gap: "1.75rem" }}
      >

        {/* Hero */}
        <div className="text-center animate-fade-in">
          <div
            className="flex items-center justify-center mx-auto"
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(42,96,112,0.10)",
              border: "0.5px solid rgba(42,96,112,0.20)",
              marginBottom: "1.25rem",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 2L3 5v5c0 4.4 3 8.3 7 9.4 4-1.1 7-5 7-9.4V5L10 2z" />
              <path d="M7 10l2 2 4-4" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--leading-normal)",
              letterSpacing: "var(--tracking-tight)",
              marginBottom: "0.625rem",
            }}
          >
            Seu relato foi recebido.
          </h1>
          <p
            className="mx-auto"
            style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, maxWidth: 400 }}
          >
            Registro realizado de forma segura e anônima. O comitê será notificado e a apuração terá início em até 5 dias úteis.
          </p>
        </div>

        {/* Protocol card */}
        <ProtocolDisplay protocolo={protocolo} />

        {/* Timeline */}
        <div
          className="overflow-hidden"
          style={{
            background: "var(--color-card)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div style={{ padding: "0.75rem 1.125rem", borderBottom: "0.5px solid var(--color-border)" }}>
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
                letterSpacing: "var(--tracking-wide)",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Andamento do relato
            </span>
          </div>

          <div style={{ padding: "1rem 1.125rem" }}>
            {TIMELINE_STEPS.map((step, i) => {
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <div
                  key={step.label}
                  className="flex items-start relative"
                  style={{ gap: "0.875rem", paddingBottom: isLast ? 0 : "1rem" }}
                >
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      style={{
                        position: "absolute",
                        left: "var(--space-3)",
                        top: "var(--space-6)",
                        width: "var(--border-thin)",
                        bottom: "var(--space-0)",
                        background: "var(--color-border)",
                      }}
                      aria-hidden
                    />
                  )}

                  {/* Step icon */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: "var(--space-6)",
                      height: "var(--space-6)",
                      background: step.done ? "var(--color-primary)" : "var(--color-bg-secondary)",
                      border: step.done ? "none" : "var(--border-thin) solid var(--color-border-error)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {step.done ? (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                        <path d="M3 8l3.5 3.5L13 4" />
                      </svg>
                    ) : i === 1 ? (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M8 5v3l2 2" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M5.5 8l2 2 3-3" />
                      </svg>
                    )}
                  </div>

                  {/* Step content */}
                  <div style={{ paddingTop: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: step.done ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                      {step.label}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5, marginTop: 2 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {/* Level 1 — Primary */}
          <Link
            href={`/${slug}/acompanhar?protocolo=${encodeURIComponent(protocolo)}`}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius-md)] bg-[#2A6070] hover:bg-[#235260] text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            style={{ fontSize: 14, fontWeight: 500, textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 5v3l2 2" />
            </svg>
            Acompanhar pelo protocolo
          </Link>

          {/* Level 2 — Secondary (client component) */}
          <DownloadComprovante protocolo={protocolo} data={dataRelato} />

          {/* Level 3 — Tertiary */}
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center w-full h-9 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            style={{ background: "transparent", fontSize: 12, textDecoration: "none" }}
          >
            Voltar ao início
          </Link>
        </div>

      </main>

      <PortalFooter className="mt-auto" />

    </div>
  );
}
