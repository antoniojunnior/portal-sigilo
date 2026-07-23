import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { reserveRegenerationSlot } from "@/lib/insights/rateLimit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    if (session.role !== "admin") {
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
    }

    const orgId = session.orgId;
    const orgDoc = await adminDb.collection("orgs").doc(orgId).get();
    if (!orgDoc.exists) return Response.json({ error: "Organização não encontrada" }, { status: 404 });

    const orgNome = orgDoc.data()?.nome as string | undefined;

    // FIX BUG-11: reserveRegenerationSlot faz leitura+escrita de gerado_em
    // atomicamente (Firestore transaction), fechando a janela TOCTOU entre
    // duas requisições concorrentes. Extraída para src/lib/insights/rateLimit.ts
    // pra ser testável contra Firestore real sem precisar do Route Handler HTTP.
    const reservation = await reserveRegenerationSlot(orgId);
    if (!reservation.allowed) {
      const nextAllowed = new Date(reservation.nextAllowedAt);
      const hours = Math.ceil((nextAllowed.getTime() - Date.now()) / (1000 * 60 * 60));
      const timeStr = nextAllowed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return Response.json(
        {
          error: "rate_limited",
          message: `Regeneração disponível novamente às ${timeStr} (em ${hours}h).`,
          nextAllowedAt: reservation.nextAllowedAt,
        },
        { status: 429 }
      );
    }

    // Duplicação deliberada da lógica de prompt/parsing de functions/src/aiInsights.ts (D-01).
    // Se esta lógica mudar, atualizar ambos os arquivos.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const casesSnap = await adminDb
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

    let items: string[];
    let source: string;

    if (totalCases === 0) {
      items = ["Nenhum novo relato nos últimos 7 dias.", "Canal ativo e disponível para colaboradores.", "Mantenha a divulgação interna do canal."];
      source = "fallback";
    } else {
      source = "ai_generated";

      const topCats = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, n]) => `${cat} (${n})`)
        .join(", ");

      const prompt = `Você é um assistente de compliance. Analise brevemente os dados da org "${orgNome ?? "Empresa"}" da última semana e gere exatamente 3 insights curtos (máx 150 caracteres cada) para o gestor de compliance. Formato JSON: {"insights":["insight1","insight2","insight3"]}. Dados: ${totalCases} relatos, categorias: ${topCats}, casos urgentes: ${urgentCount}. Não invente dados.`;

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const jsonMatch = /\{[\s\S]*\}/.exec(text);

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { insights?: string[] };
            items = (parsed.insights ?? []).slice(0, 3);
          } catch {
            items = [text.slice(0, 150)];
          }
        } else {
          items = [text.slice(0, 150)];
        }
      } catch (claudeErr) {
        console.error("[POST /api/dashboard/insights/regenerate] Claude error:", claudeErr);
        items = [`${totalCases} relatos registrados na última semana.`];
        source = "fallback";
      }

      if (items.length === 0) {
        items = [`${totalCases} relatos registrados na última semana.`];
      }
    }

    // FIX BUG-10: persistir source junto com items e gerado_em
    await adminDb.collection("orgs").doc(orgId).update({
      ai_insights: {
        items,
        source,
        gerado_em: FieldValue.serverTimestamp(),
        pending: FieldValue.delete(),
      },
    });

    console.log(`[POST /api/dashboard/insights/regenerate] orgId=${orgId} source=${source} items=${items.length}`);

    return Response.json({
      ok: true,
      source,
      itemsCount: items.length,
    });
  } catch (err) {
    console.error("[POST /api/dashboard/insights/regenerate]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
