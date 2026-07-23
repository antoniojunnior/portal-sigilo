import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const generateMonthlyReports = onSchedule(
  {
    schedule: "0 9 1 * *", // 06:00 BRT (UTC-3), dia 1 de cada mês
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const now = new Date();
    const fim = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, -1);
    const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
    const mes = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const orgsSnap = await db
      .collection("orgs")
      .where("plano_ativo", "==", "unico")
      .get();

    if (orgsSnap.empty) {
      logger.info("[scheduledReports] Nenhuma org elegível.");
      return;
    }

    const promises = orgsSnap.docs.map(async (orgDoc) => {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      try {
        const casesSnap = await db
          .collection("cases")
          .where("org_id", "==", orgId)
          .where("created_at", ">=", inicio)
          .where("created_at", "<=", fim)
          .get();

        const cases = casesSnap.docs.map((d) => d.data());
        const totalCases = cases.length;
        const categories: Record<string, number> = {};
        const leis: Record<string, number> = {};
        let resolvidos = 0;
        let totalDias = 0;
        let casosComPrazo = 0;

        cases.forEach((c) => {
          const cat = (c.triagem_ia?.categoria_legal ?? c.categoria ?? "outro") as string;
          categories[cat] = (categories[cat] ?? 0) + 1;

          const leisArr: string[] = Array.isArray(c.triagem_ia?.lei_aplicavel)
            ? c.triagem_ia.lei_aplicavel
            : c.triagem_ia?.lei_aplicavel ? [c.triagem_ia.lei_aplicavel] : [];
          leisArr.forEach((l) => { leis[l] = (leis[l] ?? 0) + 1; });

          if (["encerrado_sem_infracao", "encerrado_com_acao"].includes(c.status as string)) resolvidos++;

          const createdAt = (c.created_at as { toDate?: () => Date } | undefined)?.toDate?.();
          if (createdAt) {
            const dias = Math.floor((fim.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            totalDias += dias;
            casosComPrazo++;
          }
        });

        const prazoMedio = casosComPrazo > 0 ? Math.round(totalDias / casosComPrazo) : 0;
        const pendentes = totalCases - resolvidos;
        const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topLeis = Object.keys(leis).slice(0, 5);

        const prompt = `Dados de ${mes}: ${totalCases} relatos, categorias: ${topCats.map(([c, n]) => `${c} (${n})`).join(", ")}, resolvidos: ${resolvidos}, pendentes: ${pendentes}, tempo medio: ${prazoMedio}d, categorias_legais_acionadas: ${topLeis.join(", ") || "nenhuma"}.

Gere relatório executivo em português formal:
(1) sumário em 3 parágrafos,
(2) análise de tendências,
(3) alertas de risco com referência legal,
(4) recomendações priorizadas.

Não inclua conteúdo individual de relatos. Não invente dados.`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        });

        const textoClaude = response.content[0].type === "text" ? response.content[0].text : "";

        const reportRef = db.collection("reports").doc();
        await reportRef.set({
          id: reportRef.id,
          org_id: orgId,
          periodo: {
            inicio: admin.firestore.Timestamp.fromDate(inicio),
            fim: admin.firestore.Timestamp.fromDate(fim),
          },
          gerado_em: admin.firestore.FieldValue.serverTimestamp(),
          texto_claude: textoClaude,
          aprovado: false,
          exportado: false,
          tipo: "padrao",
          status: "rascunho",
          metricas: { total: totalCases, resolvidos, pendentes, prazoMedio, topCategorias: topCats.slice(0, 3).map(([c]) => c) },
        });

        const auditRef = db.collection("audit_logs").doc();
        await auditRef.set({
          id: auditRef.id,
          org_id: orgId,
          user_id: "sistema",
          acao: "report_scheduled_generated",
          detalhes: { reportId: reportRef.id, mes },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Enviar e-mail para admin — buscar primeiro admin ativo
        const adminSnap = await db
          .collection("users")
          .where("org_id", "==", orgId)
          .where("role", "==", "admin")
          .where("ativo", "==", true)
          .limit(1)
          .get();

        if (!adminSnap.empty) {
          const adminEmail = adminSnap.docs[0].data().email as string;
          // Gravar na coleção de e-mails para Firebase Trigger Email extension
          await db.collection("mail").add({
            to: adminEmail,
            message: {
              subject: `[Portal Sigilo] Relatório de ${mes} disponível para revisão`,
              text: `Olá,\n\nO relatório executivo de ${mes} da organização "${orgData.nome as string}" foi gerado automaticamente e está aguardando sua aprovação.\n\nAcesse o dashboard para revisar e aprovar:\n${process.env.APP_URL ?? "https://app.portalsigilo.com.br"}/app/relatorios/${reportRef.id}\n\nPortal Sigilo`,
            },
          });
        }

        logger.info(`[scheduledReports] Relatório gerado para org ${orgId}: ${reportRef.id}`);
      } catch (err) {
        logger.error(`[scheduledReports] Falha para org ${orgId}:`, err);
      }
    });

    await Promise.allSettled(promises);
    logger.info("[scheduledReports] Ciclo mensal concluído.");
  }
);
