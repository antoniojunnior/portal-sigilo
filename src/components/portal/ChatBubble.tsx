"use client";

interface ChatBubbleProps {
  autor: "sistema" | "denunciante" | "gestor";
  texto: string;
  timestamp?: string;
}

const LABEL: Record<string, string> = {
  sistema: "Canal Sigilo",
  gestor: "Comitê",
  denunciante: "Você",
};

export function ChatBubble({ autor, texto, timestamp }: ChatBubbleProps) {
  const isUser = autor === "denunciante";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-light flex items-center justify-center">
          <span className="block w-2 h-2 rounded-full bg-brand" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        <span className="text-[11px] text-slate-400 px-0.5">
          {LABEL[autor] ?? autor}
          {timestamp && (
            <span className="ml-1.5">
              {new Date(timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </span>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-brand text-white rounded-tr-sm"
              : "bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/80"
          }`}
        >
          {texto}
        </div>
      </div>
    </div>
  );
}
