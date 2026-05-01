/**
 * Popula o Firestore Emulator com dados de teste.
 * Execute com: npm run seed
 *
 * O emulador deve estar rodando: firebase emulators:start
 */

// Conecta ao emulador ANTES de qualquer import do firebase-admin.
// Respeita variáveis de ambiente já definidas (ex: FIRESTORE_EMULATOR_HOST=localhost:XXXX npm run seed).
// Fallback: valores definidos em firebase.json.
if (!process.env["FIRESTORE_EMULATOR_HOST"])        process.env["FIRESTORE_EMULATOR_HOST"]        = "127.0.0.1:8181";
if (!process.env["FIREBASE_AUTH_EMULATOR_HOST"])    process.env["FIREBASE_AUTH_EMULATOR_HOST"]    = "127.0.0.1:9099";
if (!process.env["FIREBASE_STORAGE_EMULATOR_HOST"]) process.env["FIREBASE_STORAGE_EMULATOR_HOST"] = "127.0.0.1:9199";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp({ projectId: "portal-sigilo" });
const db = getFirestore();
const auth = getAuth();

// ─── IDs fixos para referência cruzada ───────────────────────────────────────

const ORG_GESTAO_ID = "org-acme-gestao";
const ORG_ENTRADA_ID = "org-startup-entrada";

const USER_ADMIN_GESTAO_ID = "user-admin-gestao";
const USER_GESTOR_ID = "user-gestor-gestao";
const USER_ADMIN_ENTRADA_ID = "user-admin-entrada";

const CASE_1_ID = "case-assedio-moral";
const CASE_2_ID = "case-fraude-financeira";
const CASE_3_ID = "case-discriminacao-salarial";
const CASE_4_ID = "case-risco-psicossocial";
const CASE_5_ID = "case-violacao-lgpd";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(days: number): FirebaseFirestore.Timestamp {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): FirebaseFirestore.Timestamp {
  return Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
}

function protocolo(suffix: string): string {
  return `ETK-${new Date().getFullYear()}-${suffix}`;
}

// ─── 1. Orgs ─────────────────────────────────────────────────────────────────

async function seedOrgs(): Promise<void> {
  console.log("→ Criando orgs...");

  await db.collection("orgs").doc(ORG_GESTAO_ID).set({
    id: ORG_GESTAO_ID,
    nome: "Acme Corporação",
    nome_lower: "acme corporação",
    slug: "acme",
    plano_ativo: "gestao",
    url_canal: "http://localhost:3000/acme",
    logo: null,
    dominios_white_label: [],
    criado_em: daysAgo(90),
    configuracoes: {
      categorias: [
        "assedio_moral",
        "assedio_sexual",
        "discriminacao_salarial",
        "fraude",
        "risco_psicossocial",
        "violacao_lgpd",
        "outro",
      ],
      boas_vindas: "Este é um espaço seguro para você ser ouvido.",
      prazo_padrao_dias: 30,
    },
  });

  await db.collection("orgs").doc(ORG_ENTRADA_ID).set({
    id: ORG_ENTRADA_ID,
    nome: "Startup Veloz",
    nome_lower: "startup veloz",
    slug: "startup-veloz",
    plano_ativo: "entrada",
    url_canal: "http://localhost:3000/startup-veloz",
    logo: null,
    dominios_white_label: [],
    criado_em: daysAgo(30),
    configuracoes: {
      categorias: ["assedio_moral", "fraude", "outro"],
      boas_vindas: "Fale com segurança. Somos todos ouvidos.",
      prazo_padrao_dias: 30,
    },
  });

  console.log("  ✓ 2 orgs");
}

// ─── 2. Auth Users ────────────────────────────────────────────────────────────

const AUTH_USERS = [
  { uid: USER_ADMIN_GESTAO_ID,  email: "ana.souza@acme.com",       password: "Acme@2026" },
  { uid: USER_GESTOR_ID,        email: "carlos.lima@acme.com",     password: "Acme@2026" },
  { uid: USER_ADMIN_ENTRADA_ID, email: "marina@startupveloz.com",  password: "Startup@2026" },
] as const;

async function seedAuthUsers(): Promise<void> {
  console.log("→ Criando contas Firebase Auth...");

  for (const u of AUTH_USERS) {
    try {
      await auth.createUser({ uid: u.uid, email: u.email, password: u.password, emailVerified: true });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "auth/uid-already-exists") {
        await auth.updateUser(u.uid, { password: u.password });
      } else {
        throw err;
      }
    }
  }

  console.log("  ✓ 3 contas Auth criadas/atualizadas");
}

// ─── 3. Users (Firestore) ─────────────────────────────────────────────────────

async function seedUsers(): Promise<void> {
  console.log("→ Criando documentos users...");

  await db.collection("users").doc(USER_ADMIN_GESTAO_ID).set({
    id: USER_ADMIN_GESTAO_ID,
    org_id: ORG_GESTAO_ID,
    nome: "Ana Souza",
    email: "ana.souza@acme.com",
    role: "admin",
    ativo: true,
    criado_em: daysAgo(90),
  });

  await db.collection("users").doc(USER_GESTOR_ID).set({
    id: USER_GESTOR_ID,
    org_id: ORG_GESTAO_ID,
    nome: "Carlos Lima",
    email: "carlos.lima@acme.com",
    role: "gestor",
    ativo: true,
    criado_em: daysAgo(60),
  });

  await db.collection("users").doc(USER_ADMIN_ENTRADA_ID).set({
    id: USER_ADMIN_ENTRADA_ID,
    org_id: ORG_ENTRADA_ID,
    nome: "Marina Faria",
    email: "marina@startupveloz.com",
    role: "admin",
    ativo: true,
    criado_em: daysAgo(30),
  });

  console.log("  ✓ 3 documentos users");
}

// ─── 3. Cases ─────────────────────────────────────────────────────────────────

async function seedCases(): Promise<void> {
  console.log("→ Criando cases...");

  await db.collection("cases").doc(CASE_1_ID).set({
    id: CASE_1_ID,
    org_id: ORG_GESTAO_ID,
    protocolo: protocolo("AM7X3K"),
    canal_origem: "web",
    categoria: "assedio_moral",
    urgencia: 4,
    status: "em_apuracao",
    created_at: daysAgo(15),
    ttl: daysFromNow(5 * 365),
    triagem_ia: {
      categoria: "assedio_moral",
      subcategoria: "humilhacao_publica",
      urgencia: 4,
      lei_aplicavel: "nr1",
      area_risco: "Operações",
      recomendacao:
        "Afastar o gestor imediato. Iniciar apuração formal em 48h.",
      gerado_em: daysAgo(14),
    },
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(15),
        detalhes: "Relato recebido via portal web.",
      },
      {
        acao: "status_alterado",
        user_id: USER_ADMIN_GESTAO_ID,
        timestamp: daysAgo(14),
        detalhes: "aguardando_triagem → em_apuracao",
      },
    ],
    mencionados: [],
    anexos: [],
    prazo: daysFromNow(15),
    responsavel_id: USER_GESTOR_ID,
    notas_internas: "Padrão recorrente — 2 relatos anteriores similares.",
  });

  await db.collection("cases").doc(CASE_2_ID).set({
    id: CASE_2_ID,
    org_id: ORG_GESTAO_ID,
    protocolo: protocolo("FR2L9P"),
    canal_origem: "whatsapp",
    categoria: "fraude",
    urgencia: 5,
    status: "aguardando_triagem",
    created_at: daysAgo(2),
    ttl: daysFromNow(5 * 365),
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(2),
        detalhes: "Relato recebido via WhatsApp.",
      },
    ],
    mencionados: [],
    anexos: [],
    prazo: daysFromNow(28),
  });

  await db.collection("cases").doc(CASE_3_ID).set({
    id: CASE_3_ID,
    org_id: ORG_GESTAO_ID,
    protocolo: protocolo("DS4M1Q"),
    canal_origem: "web",
    categoria: "discriminacao_salarial",
    urgencia: 3,
    status: "pendente_informacao",
    created_at: daysAgo(20),
    ttl: daysFromNow(5 * 365),
    triagem_ia: {
      categoria: "discriminacao_salarial",
      urgencia: 3,
      lei_aplicavel: "lei_14611",
      area_risco: "RH",
      recomendacao: "Solicitar relatório salarial do departamento indicado.",
      gerado_em: daysAgo(19),
    },
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(20),
        detalhes: "Relato recebido via portal web.",
      },
      {
        acao: "status_alterado",
        user_id: USER_GESTOR_ID,
        timestamp: daysAgo(19),
        detalhes: "aguardando_triagem → pendente_informacao",
      },
    ],
    mencionados: [],
    anexos: [],
    prazo: daysFromNow(10),
    responsavel_id: USER_GESTOR_ID,
  });

  await db.collection("cases").doc(CASE_4_ID).set({
    id: CASE_4_ID,
    org_id: ORG_GESTAO_ID,
    protocolo: protocolo("RP8K2W"),
    canal_origem: "web",
    categoria: "risco_psicossocial",
    urgencia: 2,
    status: "encerrado_sem_infracao",
    created_at: daysAgo(45),
    ttl: daysFromNow(5 * 365),
    triagem_ia: {
      categoria: "risco_psicossocial",
      urgencia: 2,
      lei_aplicavel: "nr1",
      area_risco: "Atendimento",
      recomendacao: "Avaliar carga de trabalho e metas do setor.",
      gerado_em: daysAgo(44),
    },
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(45),
        detalhes: "Relato recebido via portal web.",
      },
      {
        acao: "status_alterado",
        user_id: USER_GESTOR_ID,
        timestamp: daysAgo(30),
        detalhes: "em_apuracao → encerrado_sem_infracao",
      },
    ],
    mencionados: [],
    anexos: [],
    prazo: daysAgo(15),
    responsavel_id: USER_GESTOR_ID,
    notas_internas: "Situação normalizada após revisão de processos internos.",
  });

  await db.collection("cases").doc(CASE_5_ID).set({
    id: CASE_5_ID,
    org_id: ORG_GESTAO_ID,
    protocolo: protocolo("VL6N5T"),
    canal_origem: "web",
    categoria: "violacao_lgpd",
    urgencia: 3,
    status: "em_apuracao",
    created_at: daysAgo(7),
    ttl: daysFromNow(5 * 365),
    triagem_ia: {
      categoria: "violacao_lgpd",
      urgencia: 3,
      lei_aplicavel: "lgpd",
      area_risco: "TI",
      recomendacao:
        "Envolver DPO imediatamente. Verificar logs de acesso ao sistema.",
      gerado_em: daysAgo(6),
    },
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(7),
        detalhes: "Relato recebido via portal web.",
      },
    ],
    // USER_GESTOR_ID mencionado → testa bloqueio das Firestore Rules
    mencionados: [USER_GESTOR_ID],
    anexos: [],
    prazo: daysFromNow(23),
    responsavel_id: USER_ADMIN_GESTAO_ID,
  });

  console.log("  ✓ 5 cases (CASE_5 tem mencionado para testar bloqueio)");
}

// ─── 4. Messages ──────────────────────────────────────────────────────────────

async function seedMessages(): Promise<void> {
  console.log("→ Criando messages...");

  const msgs: Array<{
    autor: "sistema" | "denunciante" | "gestor";
    texto: string;
    offsetMin: number;
  }> = [
    { autor: "sistema", texto: "Olá! Este é um espaço seguro e sigiloso. Como posso te ajudar?", offsetMin: 0 },
    { autor: "denunciante", texto: "Quero relatar uma situação de assédio do meu gestor.", offsetMin: 3 },
    { autor: "sistema", texto: "Entendo. Pode me contar mais sobre o que aconteceu, quando e onde?", offsetMin: 4 },
    { autor: "denunciante", texto: "Foi na semana passada, em uma reunião de equipe. Ele me humilhou na frente de todos.", offsetMin: 8 },
    { autor: "sistema", texto: "Isso é sério e foi correto você trazer aqui. Isso aconteceu outras vezes?", offsetMin: 9 },
    { autor: "denunciante", texto: "Sim, é recorrente há 3 meses. Outros colegas presenciaram.", offsetMin: 12 },
    { autor: "sistema", texto: "Obrigado por compartilhar. Vou registrar seu relato agora.", offsetMin: 13 },
    { autor: "sistema", texto: "Relato registrado. Seu protocolo foi gerado. Guarde-o.", offsetMin: 14 },
    { autor: "gestor", texto: "Recebemos seu relato. Iniciamos a apuração. Retornaremos em breve.", offsetMin: 1440 },
    { autor: "denunciante", texto: "Ok, obrigado. Preciso fornecer mais alguma informação?", offsetMin: 2880 },
  ];

  const baseMs = daysAgo(15).toMillis();
  const batch = db.batch();

  msgs.forEach((msg, i) => {
    const ref = db.collection("messages").doc(`msg-case1-${i + 1}`);
    batch.set(ref, {
      id: `msg-case1-${i + 1}`,
      case_id: CASE_1_ID,
      org_id: ORG_GESTAO_ID,
      autor: msg.autor,
      texto: msg.texto,
      seq: i,
      timestamp: Timestamp.fromMillis(baseMs + msg.offsetMin * 60 * 1000),
      anexos: [],
    });
  });

  await batch.commit();
  console.log("  ✓ 10 messages");
}

// ─── 5. Audit logs ────────────────────────────────────────────────────────────

async function seedAuditLogs(): Promise<void> {
  console.log("→ Criando audit_logs...");

  const logs = [
    {
      id: "log-1",
      org_id: ORG_GESTAO_ID,
      user_id: USER_ADMIN_GESTAO_ID,
      acao: "case_criado",
      case_id: CASE_1_ID,
      detalhes: { canal: "web", protocolo: protocolo("AM7X3K") },
      timestamp: daysAgo(15),
    },
    {
      id: "log-2",
      org_id: ORG_GESTAO_ID,
      user_id: USER_ADMIN_GESTAO_ID,
      acao: "status_alterado",
      case_id: CASE_1_ID,
      detalhes: { de: "aguardando_triagem", para: "em_apuracao" },
      timestamp: daysAgo(14),
    },
    {
      id: "log-3",
      org_id: ORG_GESTAO_ID,
      user_id: USER_GESTOR_ID,
      acao: "case_visualizado",
      case_id: CASE_1_ID,
      detalhes: {},
      timestamp: daysAgo(13),
    },
    {
      id: "log-4",
      org_id: ORG_GESTAO_ID,
      user_id: USER_GESTOR_ID,
      acao: "mensagem_enviada",
      case_id: CASE_1_ID,
      detalhes: { para: "denunciante" },
      timestamp: daysAgo(13),
    },
    {
      id: "log-5",
      org_id: ORG_GESTAO_ID,
      user_id: USER_ADMIN_GESTAO_ID,
      acao: "triagem_ia_concluida",
      case_id: CASE_3_ID,
      detalhes: { categoria: "discriminacao_salarial", urgencia: 3 },
      timestamp: daysAgo(19),
    },
  ];

  const batch = db.batch();
  logs.forEach((log) => {
    batch.set(db.collection("audit_logs").doc(log.id), log);
  });
  await batch.commit();

  console.log("  ✓ 5 audit_logs");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🌱 Seed — Firestore Emulator — Portal Sigilo");
  console.log("─────────────────────────────────────────────");
  console.log(`Host: ${process.env["FIRESTORE_EMULATOR_HOST"]}\n`);

  try {
    await seedAuthUsers();
    await seedOrgs();
    await seedUsers();
    await seedCases();
    await seedMessages();
    await seedAuditLogs();

    console.log("\n✅ Seed completo!");
    console.log("\nDados:");
    console.log("  Auth    : 3  contas criadas");
    console.log("  Orgs    : 2  (acme/gestao · startup-veloz/entrada)");
    console.log("  Users   : 3  (admin-gestao · gestor · admin-entrada)");
    console.log("  Cases   : 5  (acme) — case-5 tem mencionado para testar rules");
    console.log("  Messages: 10 (em case-assedio-moral)");
    console.log("  Logs    : 5");
    console.log("\nCredenciais:");
    console.log("  ana.souza@acme.com       /  Acme@2026    (admin  · acme)");
    console.log("  carlos.lima@acme.com     /  Acme@2026    (gestor · acme)");
    console.log("  marina@startupveloz.com  /  Startup@2026 (admin  · startup-veloz)");
    console.log("\nUI: http://localhost:4000/firestore\n");
  } catch (err) {
    console.error("\n❌ Erro durante o seed:", err);
    console.error("Verifique: firebase emulators:start");
    process.exit(1);
  }
}

main();
