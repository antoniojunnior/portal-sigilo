import { Timestamp } from "firebase/firestore";

// ─── Org (tenant) ────────────────────────────────────────────────────────────

export type Plano = "entrada" | "gestao" | "enterprise";

export interface OrgConfiguracoes {
  categorias: string[];
  boas_vindas: string;
  prazo_padrao_dias: number;
}

export interface Org {
  id: string;
  nome: string;
  slug: string;
  plano_ativo: Plano;
  url_canal?: string;
  logo?: string;
  dominios_white_label: string[];
  criado_em: Timestamp;
  configuracoes: OrgConfiguracoes;
}

// ─── Unit (unidade — somente Enterprise) ─────────────────────────────────────

export interface Unit {
  id: string;
  org_id: string;
  nome: string;
  responsavel_id?: string;
  criado_em: Timestamp;
}

// ─── User (gestores) ──────────────────────────────────────────────────────────

export type Role = "admin" | "gestor" | "auditor";

export interface User {
  id: string;
  org_id: string;
  unit_id?: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  criado_em: Timestamp;
}

// ─── Case (denúncias) ─────────────────────────────────────────────────────────

export type CanalOrigem = "web" | "whatsapp" | "app" | "0800";

export type CaseStatus =
  | "aguardando_triagem"
  | "em_apuracao"
  | "pendente_informacao"
  | "encerrado_sem_infracao"
  | "encerrado_com_acao";

export type UrgenciaNivel = 1 | 2 | 3 | 4 | 5;

export interface TriagemIA {
  categoria: string;
  subcategoria?: string;
  urgencia: UrgenciaNivel;
  lei_aplicavel?: string;
  area_risco?: string;
  recomendacao?: string;
  gerado_em: Timestamp;
}

export interface CaseHistoricoItem {
  acao: string;
  user_id?: string;
  timestamp: Timestamp;
  detalhes?: string;
}

export interface CaseAnexo {
  nome: string;
  tipo: string;
  tamanho: number;
  storage_path: string;
}

export interface Case {
  id: string;
  org_id: string;
  unit_id?: string;
  protocolo: string;
  canal_origem: CanalOrigem;
  categoria?: string;
  urgencia?: UrgenciaNivel;
  status: CaseStatus;
  created_at: Timestamp;
  triagem_ia?: TriagemIA;
  historico: CaseHistoricoItem[];
  mencionados: string[];
  anexos: CaseAnexo[];
  prazo?: Timestamp;
  responsavel_id?: string;
  notas_internas?: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export type MessageAutor = "sistema" | "denunciante" | "gestor";

export interface MessageAnexo {
  nome: string;
  tipo: string;
  storage_path: string;
}

export interface Message {
  id: string;
  case_id: string;
  org_id: string;
  autor: MessageAutor;
  texto: string;
  timestamp: Timestamp;
  anexos: MessageAnexo[];
}

// ─── AuditLog (imutável — regra S6) ──────────────────────────────────────────

export interface AuditLog {
  id: string;
  org_id: string;
  user_id: string;
  acao: string;
  case_id?: string;
  detalhes?: Record<string, unknown>;
  timestamp: Timestamp;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportTipo = "padrao" | "personalizado" | "esg";

export interface Report {
  id: string;
  org_id: string;
  unit_id?: string;
  periodo: {
    inicio: Timestamp;
    fim: Timestamp;
  };
  gerado_em: Timestamp;
  texto_claude?: string;
  aprovado: boolean;
  exportado: boolean;
  tipo: ReportTipo;
}

// ─── WhatsappSession ──────────────────────────────────────────────────────────

export type WhatsappSessionStatus =
  | "iniciada"
  | "coletando"
  | "aguardando_confirmacao"
  | "encerrada";

export interface WhatsappSession {
  id: string;
  // SHA-256 do número — nunca o número em texto puro (regra S2).
  conversation_id: string;
  org_id: string;
  unit_id?: string;
  case_id?: string;
  status: WhatsappSessionStatus;
  historico_ia: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Timestamp;
  }>;
  created_at: Timestamp;
}
