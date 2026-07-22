/**
 * Reset + Reseed da base de teste sob o plano único ("unico").
 *
 * ATENÇÃO: este script apaga TODAS as orgs, users e cases da base de teste.
 * Só execute contra um projeto Firebase de TESTES.
 *
 * Salvaguarda: exige a variável de ambiente CONFIRM_RESET_TESTE="sim"
 * ou a flag --force antes de apagar qualquer dado.
 *
 * Uso:
 *   CONFIRM_RESET_TESTE=sim npx ts-node scripts/reset-and-seed-unico.ts
 *
 * Dados gerados:
 *   1 org (plano_ativo="unico", 5 departamentos)
 *   2 usuários (1 admin, 1 gestor)
 *   5 a 15 casos distribuídos entre 11 categorias legais e 5 estágios de status
 */

const CONFIRMACAO = process.env["CONFIRM_RESET_TESTE"] === "sim" || process.argv.includes("--force");

if (!CONFIRMACAO) {
  console.error("🛑 Salvaguarda: este script RESETA a base de teste.");
  console.error("   Para prosseguir, defina CONFIRM_RESET_TESTE=sim ou passe --force.");
  process.exit(1);
}

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env["FIREBASE_PROJECT_ID"];
const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");

const isEmulator = !!process.env["FIRESTORE_EMULATOR_HOST"];

if (isEmulator) {
  initializeApp({ projectId: "portal-sigilo" });
} else {
  if (!projectId || !clientEmail || !privateKey) {
    console.error("\n❌ Variáveis de ambiente ausentes: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    console.error("   Verifique o arquivo .env.local.\n");
    process.exit(1);
  }
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

const ORG_ID = "org-teste-unico";

const USER_ADMIN_ID = "user-admin-unico";
const USER_GESTOR_ID = "user-gestor-unico";

const DEPARTAMENTOS = ["Operações", "RH", "TI", "Financeiro", "Jurídico"];

const CATEGORIAS_LEGAIS = [
  "assedio_moral",
  "assedio_sexual",
  "discriminacao_salarial",
  "discriminacao",
  "fraude",
  "desvio_etico",
  "violacao_lgpd",
  "seguranca_trabalho",
  "risco_psicossocial",
  "conflito_interesses",
  "outro",
];

const STATUS_CASE = [
  "aguardando_triagem",
  "em_apuracao",
  "pendente_informacao",
  "encerrado_sem_infracao",
  "encerrado_com_acao",
];

function daysAgo(days: number): Timestamp {
  return Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

function protocolo(suffix: string): string {
  return `ETK-${new Date().getFullYear()}-${suffix}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function resetData(): Promise<void> {
  console.log("→ Apagando dados existentes...");

  const collections = ["orgs", "users", "cases", "audit_logs", "reports", "notifications", "mail"];
  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    const batchSize = 500;
    for (let i = 0; i < snap.size; i += batchSize) {
      const batch = db.batch();
      snap.docs.slice(i, i + batchSize).forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log(`  ✓ ${colName}: ${snap.size} documentos removidos`);
  }
}

async function seedOrg(): Promise<void> {
  console.log("→ Criando org...");

  const dataRenovacao = new Date();
  dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);

  await db.collection("orgs").doc(ORG_ID).set({
    id: ORG_ID,
    nome: "Acme Corporação",
    slug: "acme-corporacao",
    plano_ativo: "unico",
    asaas_credit_card_token: null,
    proxima_cobranca_parcelas: 12,
    renovacao_cancelada: false,
    ultima_cobranca_ciclo: new Date().getFullYear(),
    url_canal: "http://localhost:3000/acme",
    logo: null,
    dominios_white_label: [],
    criado_em: daysAgo(90),
    data_inicio: daysAgo(90),
    data_renovacao: Timestamp.fromDate(dataRenovacao),
    users_count: 0,
    configuracoes: {
      categorias: CATEGORIAS_LEGAIS.slice(0, 7),
      departamentos: DEPARTAMENTOS,
      boas_vindas: "Este é um espaço seguro para você ser ouvido.",
      prazo_padrao_dias: 30,
    },
  });

  console.log("  ✓ 1 org");
}

async function upsertAuthUser(uid: string, email: string, password: string): Promise<void> {
  try {
    await auth.createUser({ uid, email, password, emailVerified: true });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/uid-already-exists") {
      await auth.updateUser(uid, { email, password });
    } else if (code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      await auth.deleteUser(existing.uid);
      await auth.createUser({ uid, email, password, emailVerified: true });
    } else {
      throw err;
    }
  }
}

async function seedAuthUsers(): Promise<void> {
  console.log("→ Criando contas Firebase Auth...");
  await upsertAuthUser(USER_ADMIN_ID, "admin@acme.com", "Acme@2026");
  await upsertAuthUser(USER_GESTOR_ID, "gestor@acme.com", "Acme@2026");
  console.log("  ✓ 2 contas Auth");
}

async function seedUsers(): Promise<void> {
  console.log("→ Criando documentos users...");

  await db.collection("users").doc(USER_ADMIN_ID).set({
    id: USER_ADMIN_ID,
    org_id: ORG_ID,
    nome: "Ana Souza",
    email: "admin@acme.com",
    role: "admin",
    ativo: true,
    criado_em: daysAgo(90),
  });

  await db.collection("users").doc(USER_GESTOR_ID).set({
    id: USER_GESTOR_ID,
    org_id: ORG_ID,
    nome: "Carlos Lima",
    email: "gestor@acme.com",
    role: "gestor",
    ativo: true,
    criado_em: daysAgo(60),
  });

  await db.collection("orgs").doc(ORG_ID).update({ users_count: 2 });

  console.log("  ✓ 2 documentos users");
}

async function seedCases(): Promise<void> {
  console.log("→ Criando cases...");

  const casesPorDepto = DEPARTAMENTOS.map(() => 1 + Math.floor(Math.random() * 3));
  const totalCases = casesPorDepto.reduce((a, b) => a + b, 0);

  const categoriasShuffled = shuffle(CATEGORIAS_LEGAIS);
  const statusesShuffled = shuffle(STATUS_CASE);

  let caseIndex = 0;

  for (let d = 0; d < DEPARTAMENTOS.length; d++) {
    const depto = DEPARTAMENTOS[d];
    const count = casesPorDepto[d];

    for (let c = 0; c < count; c++) {
      const caseId = `case-teste-${String(caseIndex).padStart(2, "0")}`;
      const categoria = categoriasShuffled[caseIndex % categoriasShuffled.length];
      const status = statusesShuffled[caseIndex % statusesShuffled.length];
      const urgencia = (1 + (caseIndex % 5)) as 1 | 2 | 3 | 4 | 5;

      const diasAtras = 10 + caseIndex * 5;

      await db.collection("cases").doc(caseId).set({
        id: caseId,
        org_id: ORG_ID,
        protocolo: protocolo(`TS${String(caseIndex).padStart(3, "0")}`),
        canal_origem: "web",
        categoria,
        urgencia,
        status,
        created_at: daysAgo(diasAtras),
        ttl: daysFromNow(5 * 365 - diasAtras),
        triagem_ia: {
          categoria_legal: categoria,
          subcategoria: null,
          urgencia,
          lei_aplicavel: ["lei_14457", "nr1"],
          area_risco: depto,
          recomendacao: `Recomendação para ${depto}: acompanhar caso de ${categoria.replace(/_/g, " ")} com urgência ${urgencia}/5.`,
          gerado_em: daysAgo(diasAtras - 1),
        },
        mencionados: [],
        historico: [
          {
            acao: "case_criado",
            user_id: "sistema",
            timestamp: daysAgo(diasAtras),
            detalhes: "Caso criado via canal web",
          },
        ],
        anexos: [],
        prazo: daysFromNow(30 - diasAtras),
      });

      caseIndex++;
    }
  }

  console.log(`  ✓ ${totalCases} cases (${casesPorDepto.join(", ")} por departamento)`);
}

async function main(): Promise<void> {
  console.log("\n🔄 Reset + Reseed — Plano Único");
  console.log("─────────────────────────────────\n");

  await resetData();
  await seedOrg();
  await seedAuthUsers();
  await seedUsers();
  await seedCases();

  console.log("\n✅ Base de teste resetada e repovoada com sucesso!");
  console.log(`   Org: ${ORG_ID}`);
  console.log("   Plano: unico");
  console.log("   Departamentos:", DEPARTAMENTOS.join(", "));
  console.log(`   Usuários: admin@acme.com / gestor@acme.com\n`);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
