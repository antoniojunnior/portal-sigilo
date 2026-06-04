"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SUSPENDED_PLANS = new Set(["suspenso", "cancelado"]);

export function SuspensoBanner() {
  const { user } = useAuth();

  if (!user || !SUSPENDED_PLANS.has(user.plano)) return null;

  const isCancelado = user.plano === "cancelado";

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-[var(--color-danger)] px-4 py-2.5 text-white"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          {isCancelado
            ? "Assinatura cancelada — canal de denúncias e relatórios desativados."
            : "Pagamento em atraso — funcionalidades avançadas suspensas."}
        </span>
      </div>
      {user.role === "admin" && (
        <Link
          href="/app/configuracoes/faturamento"
          className="shrink-0 rounded-lg border border-white/30 px-3 py-1 text-xs font-semibold transition hover:bg-white/10"
        >
          Regularizar
        </Link>
      )}
    </div>
  );
}
