/**
 * Popula o Firestore Emulator com dados de teste.
 * Execute com: npx ts-node scripts/seed-emulator.ts
 *
 * O emulador deve estar rodando: firebase emulators:start
 */

import * as admin from "firebase-admin";

// Conecta ao emulador — NUNCA ao Firebase real.
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";

admin.initializeApp({ projectId: "portal-sigilo" });

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

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

function now() {
  return Timestamp.now();
}

function daysFromNow(days: number) {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
}

function fiveYearsFromNow() {
  return daysFromNow(5 * 365);
}

function protocolo(prefix: string) {
  return `ETK-${new Date().getFullYear()}-${prefix}`;
}

// ─── 1. Orgs ─────────────────────────────────────────────────────────────────

async function seedOrgs() {
  console.log("→ Criando orgs...");

  await db.collection("orgs").doc(ORG_GESTAO_ID).set({
    id: ORG_GESTAO_ID,
    nome: "Acme Corporação",
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

  console.log("  ✓ 2 orgs criadas");
}

// ─── 2. Users ─────────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log("→ Criando usuários...");

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

  console.log("  ✓ 3 usuários criados");
}

// ─── 3. Cases ─────────────────────────────────────────────────────────────────

async function seedCases() {
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
    ttl: fiveYearsFromNow(),
    triagem_ia: {
      categoria: "assedio_moral",
      subcategoria: "humilhacao_publica",
      urgencia: 4,
      lei_aplicavel: "nr1",
      area_risco: "Operações",
      recomendacao:
        "Afastar o gestor imediato do caso. Iniciar apuração formal em 48h.",
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
    notas_internas: "Confirmado padrão recorrente com 2 relatos anteriores.",
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
    ttl: fiveYearsFromNow(),
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
    notas_internas: null,
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
    ttl: fiveYearsFromNow(),
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
    notas_internas: null,
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
    ttl: fiveYearsFromNow(),
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
    ttl: fiveYearsFromNow(),
    triagem_ia: {
      categoria: "violacao_lgpd",
      urgencia: 3,
      lei_aplicavel: "lgpd",
      area_risco: "TI",
      recomendacao:
        "Envolver DPO imediatamente. Verificar logs de acesso ao sistema indicado.",
      gerado_em: daysAgo(6),
    },
    historico: [
      {
        acao: "case_criado",
        timestamp: daysAgo(7),
        detalhes: "Relato recebido via portal web.",
      },
    ],
    mencionados: [USER_GESTOR_ID], // gestor mencionado — testa bloqueio das rules
    anexos: [],
    prazo: daysFromNow(23),
    responsavel_id: USER_ADMIN_GESTAO_ID,
    notas_internas: null,
  });

  console.log("  ✓ 5 cases criados (1 com mencionado para testar bloqueio)");
}

// ─── 4. Messages ──────────────────────────────────────────────────────────────

async function seedMessages() {
  console.log("→ Criando messages para case-assedio-moral...");

  const msgs = [
    { autor: "sistema", texto: "Olá! Este é um espaço seguro e sigiloso. Como posso te ajudar?", daysAgoN: 15 },
    { autor: "denunciante", texto: "Quero relatar uma situação de assédio do meu gestor.", daysAgoN: 15 },
    { autor: "sistema", texto: "Entendo. Pode me contar mais sobre o que aconteceu, quando e onde?", daysAgoN: 15 },
    { autor: "denunciante", texto: "Foi na semana passada, durante uma reunião de equipe. Ele me humilhou na frente de todos.", daysAgoN: 14 },
    { autor: "sistema", texto: "Isso é sério e foi correto você trazer isso aqui. Esse tipo de situação aconteceu outras vezes?", daysAgoN: 14 },
    { autor: "denunciante", texto: "Sim, é recorrente há uns 3 meses. Outros colegas também presenciaram.", daysAgoN: 14 },
    { autor: "sistema", texto: "Obrigado por compartilhar. Seu relato foi registrado. Protocolo gerado.", daysAgoN: 14 },
    { autor: "gestor", texto: "Recebemos seu relato. Iniciamos a apuração. Em breve retornaremos.", daysAgoN: 13 },
    { autor: "denunciante", texto: "Ok, obrigado. Preciso de mais informações?", daysAgoN: 12 },
    { autor: "gestor", texto: "Por ora não. Podemos contatar por aqui se precisarmos. Prazo: 30 dias.", daysAgoN: 12 },
  ] as const;

  const batch = db.batch();

  msgs.forEach((msg, i) => {
    const ref = db.collection("messages").doc(`msg-case1-${i + 1}`);
    batch.set(ref, {
      id: `msg-case1-${i + 1}`,
      case_id: CASE_1_ID,
      org_id: ORG_GESTAO_ID,
      autor: msg.autor,
      texto: msg.texto,
      timestamp: Timestamp.fromMillis(daysAgo(msg.daysAgoN).toMillis() + i * 60000),
      anexos: [],
    });
  });

  await batch.commit();
  console.log("  ✓ 10 messages criadas");
}

// ─── 5. Audit logs ────────────────────────────────────────────────────────────

async function seedAuditLogs() {
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

  console.log("  ✓ 5 audit_logs criados");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seed do Firestore Emulator — Portal Sigilo");
  console.log("─────────────────────────────────────────────");
  console.log("Emulador: localhost:8080\n");

  try {
    await seedOrgs();
    await seedUsers();
    await seedCases();
    await seedMessages();
    await seedAuditLogs();

    console.log("\n✅ Seed completo!\n");
    console.log("Dados criados:");
    console.log("  Orgs    : 2 (acme / startup-veloz)");
    console.log("  Users   : 3 (admin-gestao, gestor, admin-entrada)");
    console.log("  Cases   : 5 (acme) — 1 com mencionado para testar bloqueio");
    console.log("  Messages: 10 (para case-assedio-moral)");
    console.log("  Logs    : 5");
    console.log("\nUI do emulador: http://localhost:4000/firestore");
  } catch (err) {
    console.error("\n❌ Erro durante o seed:", err);
    console.error(
      "Verifique se o emulador está rodando: firebase emulators:start"
    );
    process.exit(1);
  }
}

main();
