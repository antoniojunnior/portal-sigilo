"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer, type ChatMessage } from "@/components/portal/ChatContainer";
import Link from "next/link";

const INITIAL_MESSAGE: ChatMessage = {
  id: "sys-0",
  autor: "sistema",
  texto:
    "Olá. Este é um espaço seguro e confidencial.\n\nVocê pode me contar o que aconteceu com suas próprias palavras, no seu ritmo. Nenhuma informação que identifique você será solicitada ou armazenada.\n\nQuando estiver pronto, pode começar.",
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
  const [unitId, setUnitId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [progressStep, setProgressStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  useEffect(() => {
    setOrgId(sessionStorage.getItem("org_id"));
    setUnitId(sessionStorage.getItem("unit_id"));
  }, []);

  async function handleSendMessage(text: string, _attachments: File[]) {
    if (!text.trim()) return;
    setShowQuickReplies(false);
    setProgressStep((prev) => Math.min(prev + 1, 3));

    const messageCount = messages.filter((m) => m.autor === "denunciante").length + 1;

    let resposta = "";
    if (messageCount === 1) {
      resposta = "Obrigado por compartilhar. Para eu entender melhor: quando isso aconteceu (aproximadamente) e onde foi?";
    } else if (messageCount === 2) {
      resposta = "Entendido. Há mais detalhes que você queira acrescentar? Por exemplo, se havia outras pessoas presentes ou se isso já aconteceu antes?";
    } else if (messageCount === 3) {
      resposta = "Você tem alguma evidência ou documento relacionado que queira mencionar? Se não, tudo bem — seu relato já é suficiente.";
    } else {
      resposta = "Recebi todas as informações. Vou registrar seu relato agora. Um protocolo único será gerado para você acompanhar.";
      setTimeout(() => void submitCase(messages, text), 500);
      return;
    }

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
    }, 700);
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
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="#92400E" strokeWidth="1.5" aria-hidden>
              <path d="M8 1L1 13h14L8 1z" strokeLinejoin="round"/>
              <path d="M8 6v3M8 11v.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[13px] text-slate-600">Selecione uma empresa antes de continuar.</p>
          <a
            href="/"
            className="inline-block rounded-lg bg-brand px-5 py-2.5 text-[13px] font-medium text-white hover:bg-brand-dark transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[#F8FAFC]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-5 flex-shrink-0 flex items-center">
        <Link
          href={`/${slug}`}
          className="text-[12px] text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded transition-colors inline-flex items-center min-h-[44px] pr-4"
        >
          ← Voltar
        </Link>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        <ChatContainer
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          disabled={submitting}
          progressStep={progressStep}
        />

        {/* Quick replies — match mockup pill style */}
        {showQuickReplies && (
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap gap-2 flex-shrink-0">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => {
                  setShowQuickReplies(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      autor: "denunciante",
                      texto: reply,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                  void handleSendMessage(reply, []);
                }}
                className="rounded-full border border-slate-200 bg-white px-3.5 min-h-[44px] text-[12px] text-slate-600 hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors inline-flex items-center cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
