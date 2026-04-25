"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer, type ChatMessage } from "@/components/portal/ChatContainer";

const INITIAL_MESSAGE: ChatMessage = {
  id: "sys-0",
  autor: "sistema",
  texto:
    "Olá! Este é um canal seguro e sigiloso.\n\nVocê pode contar o que aconteceu com suas próprias palavras. Não precisamos saber seu nome ou qualquer dado pessoal.\n\nQuando estiver pronto, pode começar. Estamos aqui para ouvir.",
  timestamp: new Date().toISOString(),
};

const QUICK_REPLIES = [
  "Quero relatar uma situação de assédio",
  "Há uma irregularidade financeira",
  "Testemunhei algo preocupante",
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

    // Atualizar progresso conforme a conversa avança
    setProgressStep((prev) => Math.min(prev + 1, 3));

    const messageCount = messages.filter((m) => m.autor === "denunciante").length + 1;

    // Fase 2: respostas estáticas. Na Fase 3, isso vai para Claude via SSE.
    let resposta = "";
    if (messageCount === 1) {
      resposta =
        "Obrigado por contar. Para eu entender melhor: quando isso aconteceu (aproximadamente) e onde foi?";
    } else if (messageCount === 2) {
      resposta =
        "Entendido. Há mais detalhes que você queira acrescentar? Por exemplo, se havia outras pessoas presentes ou se isso já aconteceu antes?";
    } else if (messageCount === 3) {
      resposta =
        "Você tem alguma evidência ou documento relacionado que queira enviar? Se não, tudo bem — seu relato já é suficiente.";
    } else {
      resposta =
        "Recebi todas as informações. Vou registrar seu relato agora. Um protocolo único será gerado para você acompanhar.";

      // Após a 4ª mensagem, criar o caso
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
    }, 600);
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
          texto: `⚠️ ${msg} Por favor, tente novamente.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setSubmitting(false);
    }
  }

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="text-center space-y-3">
          <p className="text-zinc-600 text-sm">
            Selecione uma empresa antes de continuar.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-blue-600 text-white px-4 py-2 text-sm"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-200 px-4 py-2">
        <a
          href={`/${slug}`}
          className="text-xs text-zinc-400 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          ← Voltar
        </a>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        <ChatContainer
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          disabled={submitting}
          progressStep={progressStep}
        />

        {/* Quick replies */}
        {showQuickReplies && (
          <div className="px-4 py-3 bg-white border-t border-zinc-200 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => {
                  setShowQuickReplies(false);
                  void handleSendMessage(reply, []);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      autor: "denunciante",
                      texto: reply,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
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
