import { PLANO_ID, PLANO_PRECO_ANUAL, PLANO_USUARIOS, PLANO_ARMAZENAMENTO_GB } from "@/lib/planos-config";
import type { PlanoConfig } from "@/lib/types";

export const PLANOS: PlanoConfig[] = [
  {
    id: PLANO_ID,
    nome: "Plano Único",
    precoMensal: null,
    precoAnual: PLANO_PRECO_ANUAL,
    tagline: "Tudo o que sua empresa precisa para um canal de denúncias completo",
    usuarios: PLANO_USUARIOS,
    armazenamento: `${PLANO_ARMAZENAMENTO_GB} GB`,
    sla: "4h úteis",
    destaque: true,
    features: [
      { descricao: "Canal de denúncias web", disponivel: true },
      { descricao: "Triagem automática por IA", disponivel: true },
      { descricao: "Dashboard de gestão", disponivel: true },
      { descricao: "Relatórios mensais", disponivel: true },
      { descricao: "Assistente IA para gestores", disponivel: true },
      { descricao: "Múltiplos gestores (até 50)", disponivel: true },
      { descricao: "SLA prioritário 4h", disponivel: true },
      { descricao: "Exportação de relatórios", disponivel: true },
      { descricao: "Anonimato garantido", disponivel: true },
      { descricao: "Conformidade LGPD", disponivel: true },
    ],
  },
];
