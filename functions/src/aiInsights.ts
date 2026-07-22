import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const generateDailyInsights = onSchedule(
  {
    schedule: "0 10 * * *", // 07:00 BRT (UTC-3)
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const orgsSnap = await db
      .collection("orgs")
      .where("plano_ativo", "==", "unico")
      .get();

    if (orgsSnap.empty) {
      logger.info("[aiInsights] Nenhuma org elegível.");
      return;
    }

    const promises = orgsSnap.docs.map(async (orgDoc) => {
      const orgId = orgDoc.id;
      const orgNome = orgDoc.data().nome as string;

      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const casesSnap = await db
          .collection("cases")
          .where("org_id", "==", orgId)
          .where("created_at", ">=", sevenDaysAgo)
          .get();

        const totalCases = casesSnap.size;
        const categories: Record<string, number> = {};
        let urgentCount = 0;

        casesSnap.docs.forEach((doc) => {
          const c = doc.data();
          const cat = (c.triagem_ia?.categoria ?? c.categoria ?? "outro") as string;
          categories[cat] = (categories[cat] ?? 0) + 1;
          if ((c.triagem_ia?.urgencia ?? c.urgencia ?? 0) >= 4) urgentCount++;
        });

        if (totalCases === 0) {
          await db.collection("orgs").doc(orgId).update({
            ai_insights: {
              items: ["Nenhum novo relato nos últimos 7 dias.", "Canal ativo e disponível para colaboradores.", "Mantenha a divulgação interna do canal."],
              gerado_em: admin.firestore.FieldValue.serverTimestamp(),
            },
          });
          return;
        }

        const topCats = Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, n]) => `${cat} (${n})`)
          .join(", ");

        const prompt = `Você é um assistente de compliance. Analise brevemente os dados da org "${orgNome}" da última semana e gere exatamente 3 insights curtos (máx 150 caracteres cada) para o gestor de compliance. Formato JSON: {"insights":["insight1","insight2","insight3"]}. Dados: ${totalCases} relatos, categorias: ${topCats}, casos urgentes: ${urgentCount}. Não invente dados.`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const jsonMatch = /\{[\s\S]*\}/.exec(text);

        let items: string[] = [];
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { insights?: string[] };
            items = (parsed.insights ?? []).slice(0, 3);
          } catch {
            items = [text.slice(0, 150)];
          }
        }

        if (items.length === 0) {
          items = [`${totalCases} relatos registrados na última semana.`];
        }

        await db.collection("orgs").doc(orgId).update({
          ai_insights: {
            items,
            gerado_em: admin.firestore.FieldValue.serverTimestamp(),
          },
        });

        logger.info(`[aiInsights] Insights gerados para org ${orgId}: ${items.length} itens`);
      } catch (err) {
        logger.error(`[aiInsights] Falha para org ${orgId}:`, err);
      }
    });

    await Promise.allSettled(promises);
    logger.info("[aiInsights] Ciclo diário concluído.");
  }
);
