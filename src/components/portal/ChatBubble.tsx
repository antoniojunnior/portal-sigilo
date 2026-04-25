"use client";

interface ChatBubbleProps {
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  timestamp?: string;
}

const LABEL: Record<string, string> = {
  sistema: "Canal",
  gestor: "Comitê",
  denunciante: "Você",
};

export function ChatBubble({ autor, texto, timestamp }: ChatBubbleProps) {
  const isUser = autor === "denunciante";

  return (
    <div
      className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "ml-auto items-end" : "items-start"}`}
    >
      <span className="text-xs text-zinc-400 px-1">
        {LABEL[autor] ?? autor}
        {timestamp && (
          <span className="ml-2">
            {new Date(timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </span>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}
