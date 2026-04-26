"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer, type ChatMessage } from "@/components/portal/ChatContainer";
import { AnonymousBadge } from "@/components/ui/AnonymousBadge";
import { PortalFooter } from "@/components/layout/PortalFooter";
import { LogoSigilo } from "@/components/portal/LogoSigilo";
import Link from "next/link";

const INITIAL_MESSAGE: ChatMessage = {
  id: "sys-0",
  autor: "sistema",
  texto:
    "Olá. Este é um espaço seguro e confidencial.\n\nPode me contar o que aconteceu com suas próprias palavras, no seu ritmo. Nenhuma informação que identifique você será solicitada ou armazenada.\n\nQuando quiser, é só começar.",
  textoJsx: (
    <>
      <p>Olá. Este é um espaço seguro e confidencial.</p>
      <p style={{ marginTop: "0.6rem" }}>
        Pode me contar o que aconteceu com suas próprias palavras, no seu ritmo.{" "}
        <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
          Nenhuma informação que identifique você será solicitada ou armazenada.
        </strong>
      </p>
      <p style={{ marginTop: "0.6rem" }}>Quando quiser, é só começar.</p>
    </>
  ),
  timestamp: new Date().toISOString(),
};

const QUICK_REPLIES = [
  "Ambiente de trabalho",
  "Relação com gestor",
  "Processo ou contrato",
  "Outro assunto",
];

export default function Tela2() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgNome, setOrgNome] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [progressStep, setProgressStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  useEffect(() => {
    setOrgId(sessionStorage.getItem("org_id"));
    setOrgNome(sessionStorage.getItem("org_nome"));
    setUnitId(sessionStorage.getItem("unit_id"));
  }, []);

  function handleReset() {
    setMessages([INITIAL_MESSAGE]);
    setProgressStep(0);
    setShowQuickReplies(true);
  }

  async function handleSendMessage(text: string, _attachments: File[]) {
    if (!text.trim()) return;

    setShowQuickReplies(false);
    setProgressStep((prev) => Math.min(prev + 1, 3));

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      autor: "denunciante",
      texto: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const prevUserCount = messages.filter((m) => m.autor === "denunciante").length;
    const messageCount = prevUserCount + 1;

    let resposta: string;
    let isFinal = false;

    if (messageCount === 1) {
      resposta = "Obrigado por compartilhar. Para eu entender melhor: quando isso aconteceu (aproximadamente) e onde foi?";
    } else if (messageCount === 2) {
      resposta = "Entendido. Há mais detalhes que você queira acrescentar? Por exemplo, se havia outras pessoas presentes ou se isso já aconteceu antes?";
    } else if (messageCount === 3) {
      resposta = "Você tem alguma evidência ou documento relacionado que queira mencionar? Se não, tudo bem — seu relato já é suficiente.";
    } else {
      resposta = "Recebi todas as informações. Vou registrar seu relato agora. Um protocolo único será gerado para você acompanhar.";
      isFinal = true;
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            autor: "sistema",
            texto: resposta,
            timestamp: new Date().toISOString(),
          },
        ]);
        resolve();
      }, 700);
    });

    if (isFinal) {
      void submitCase([...messages, userMsg], text);
    }
  }

  async function submitCase(currentMessages: ChatMessage[], lastText: string) {
    if (submitting) return;
    setSubmitting(true);

    const allMessages = [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        autor: "denunciante" as const,
        texto: lastText,
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          unit_id: unitId ?? undefined,
          canal_origem: "web",
          mensagens: allMessages
            .filter((m) => m.autor !== "sistema" || m.id === "sys-0")
            .map((m) => ({ autor: m.autor, texto: m.texto })),
        }),
      });

      const data = await res.json() as { protocolo?: string; error?: string };

      if (!res.ok || !data.protocolo) {
        throw new Error(data.error ?? "Erro ao registrar o relato.");
      }

      router.push(`/${slug}/confirmacao?protocolo=${encodeURIComponent(data.protocolo)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          autor: "sistema",
          texto: `Ocorreu um erro: ${msg} Por favor, tente novamente.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setSubmitting(false);
    }
  }

  if (!orgId) {
    return (
      <div data-portal className="min-h-dvh flex items-center justify-center p-4" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-12 h-12 rounded-full bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/20 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" aria-hidden>
              <path d="M8 1L1 13h14L8 1z" strokeLinejoin="round"/>
              <path d="M8 6v3M8 11v.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Selecione uma empresa antes de continuar.</p>
          <a
            href="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] transition-colors"
            style={{
              borderRadius: "var(--radius-md)",
              background: "#2A6070",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: "white",
              textDecoration: "none",
            }}
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div data-portal className="flex flex-col h-dvh" style={{ background: "var(--color-bg-secondary)" }}>

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
          style={{ maxWidth: 580, padding: "0 1.25rem" }}
        >
          {/* Left: back + logo + divider + org */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href={`/${slug}`}
              className="flex items-center flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
              style={{ gap: 5, fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none" }}
              aria-label="Voltar para a página do canal"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M10 3L5 8l5 5"/>
              </svg>
              Voltar
            </Link>
            <span
              className="flex-shrink-0"
              style={{ width: 0.5, height: 20, background: "var(--color-border)" }}
              aria-hidden
            />
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
                {orgNome ?? slug}
              </span>
            </span>
          </div>

          {/* Right: badge */}
          <AnonymousBadge
            className="flex-shrink-0"
            aria-label="Conversa anônima — sua identidade não é registrada"
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        <ChatContainer
          messages={messages}
          onSendMessage={handleSendMessage}
          disabled={submitting}
          progressStep={progressStep}
          quickReplies={showQuickReplies ? QUICK_REPLIES : []}
          onQuickReply={() => setShowQuickReplies(false)}
          onReset={handleReset}
        />
      </div>

      <PortalFooter />
    </div>
  );
}
