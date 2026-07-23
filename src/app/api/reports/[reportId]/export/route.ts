import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import { logAudit } from "@/lib/utils/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

const PORTAL_COLOR = rgb(0.13, 0.35, 0.83); // #2159D4 aproximado
const TEXT_COLOR = rgb(0.12, 0.12, 0.18);
const GRAY_COLOR = rgb(0.45, 0.45, 0.55);

function splitTextLines(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const session = await verifySession(sessionCookie);
  if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  if (session.role === "auditor") {
    return Response.json({ error: "Auditores não podem exportar relatórios." }, { status: 403 });
  }

  const { reportId } = await context.params;

  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (!reportDoc.exists) return Response.json({ error: "Relatório não encontrado" }, { status: 404 });

  const reportData = reportDoc.data()!;
  if (reportData.org_id !== session.orgId) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (reportData.status !== "aprovado") {
    return Response.json({ error: "Apenas relatórios aprovados podem ser exportados." }, { status: 409 });
  }

  try {
  const textoClaude: string = (reportData.texto_claude as string) ?? "";
  const orgNome = session.orgName;
  const geradoEm = (reportData.gerado_em as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date();
  const periodoInicio = (reportData.periodo?.inicio as { toDate?: () => Date } | undefined)?.toDate?.();
  const periodoFim = (reportData.periodo?.fim as { toDate?: () => Date } | undefined)?.toDate?.();

  const periodoStr = periodoInicio && periodoFim
    ? `${periodoInicio.toLocaleDateString("pt-BR")} – ${periodoFim.toLocaleDateString("pt-BR")}`
    : "Período não informado";

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;

  function addPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 50;
  }

  function checkSpace(needed: number) {
    if (y - needed < 60) addPage();
  }

  // Header bar
  page.drawRectangle({ x: 0, y: pageHeight - 70, width: pageWidth, height: 70, color: PORTAL_COLOR });
  page.drawText("Portal Sigilo", { x: marginX, y: pageHeight - 40, size: 20, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Relatório de Compliance Confidencial", { x: marginX, y: pageHeight - 58, size: 9, font: fontRegular, color: rgb(0.9, 0.9, 0.95) });

  y = pageHeight - 90;

  // Org name
  page.drawText(orgNome, { x: marginX, y, size: 16, font: fontBold, color: TEXT_COLOR });
  y -= 22;

  page.drawText(periodoStr, { x: marginX, y, size: 11, font: fontRegular, color: GRAY_COLOR });
  y -= 18;

  page.drawText(`Gerado em ${geradoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, { x: marginX, y, size: 9, font: fontRegular, color: GRAY_COLOR });
  y -= 30;

  // Divider
  page.drawLine({ start: { x: marginX, y }, end: { x: pageWidth - marginX, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
  y -= 20;

  // Metricas
  const metricas = reportData.metricas as { total?: number; resolvidos?: number; pendentes?: number; prazoMedio?: number; topCategorias?: string[] } | undefined;
  const tabelaAnalitica = reportData.tabela_analitica as { departamento: string; categoria_legal: string; mes: string; total: number }[] | undefined;
  const riscoPsicossocial = reportData.risco_psicossocial as { total: number; por_subcategoria: Record<string, number> } | undefined;
  if (metricas) {
    page.drawText("MÉTRICAS DO PERÍODO", { x: marginX, y, size: 8, font: fontBold, color: PORTAL_COLOR });
    y -= 16;

    const metItems = [
      `Total de relatos: ${metricas.total ?? 0}`,
      `Resolvidos: ${metricas.resolvidos ?? 0}`,
      `Pendentes: ${metricas.pendentes ?? 0}`,
      `Tempo médio de resolução: ${metricas.prazoMedio ?? 0} dias`,
    ];
    for (const item of metItems) {
      checkSpace(16);
      page.drawText(`• ${item}`, { x: marginX + 10, y, size: 10, font: fontRegular, color: TEXT_COLOR });
      y -= 14;
    }
    y -= 10;
    page.drawLine({ start: { x: marginX, y }, end: { x: pageWidth - marginX, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
    y -= 20;
  }

  // Tabela Analítica (quando presente — D-04)
  if (tabelaAnalitica && tabelaAnalitica.length > 0) {
    checkSpace(30);
    page.drawText("TABELA ANALÍTICA (Departamento × Categoria × Mês)", { x: marginX, y, size: 8, font: fontBold, color: PORTAL_COLOR });
    y -= 18;

    for (const linha of tabelaAnalitica) {
      checkSpace(16);
      const text = `${linha.departamento}  |  ${linha.categoria_legal}  |  ${linha.mes}  |  ${linha.total} caso${linha.total !== 1 ? "s" : ""}`;
      page.drawText(text, { x: marginX + 8, y, size: 9, font: fontRegular, color: TEXT_COLOR });
      y -= 14;
    }
    y -= 10;
    page.drawLine({ start: { x: marginX, y }, end: { x: pageWidth - marginX, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
    y -= 20;
  }

  // Seção NR-1 (sempre presente — D-06)
  checkSpace(30);
  page.drawText("RISCOS PSICOSSOCIAIS (NR-1)", { x: marginX, y, size: 8, font: fontBold, color: PORTAL_COLOR });
  y -= 18;

  if (riscoPsicossocial && riscoPsicossocial.total > 0) {
    page.drawText(`Total de ocorrências no período: ${riscoPsicossocial.total}`, { x: marginX + 8, y, size: 10, font: fontRegular, color: TEXT_COLOR });
    y -= 15;

    const subs = Object.entries(riscoPsicossocial.por_subcategoria)
      .sort(([, a], [, b]) => b - a);
    for (const [sub, count] of subs) {
      checkSpace(14);
      page.drawText(`• ${sub}: ${count}`, { x: marginX + 16, y, size: 9, font: fontRegular, color: TEXT_COLOR });
      y -= 13;
    }
  } else {
    page.drawText("Nenhum caso classificado como risco psicossocial neste período.", { x: marginX + 8, y, size: 10, font: fontRegular, color: GRAY_COLOR });
    y -= 15;
  }
  y -= 10;
  page.drawLine({ start: { x: marginX, y }, end: { x: pageWidth - marginX, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
  y -= 20;

  // Claude text (só quando houver — modo consolidado)
  if (textoClaude) {
  page.drawText("ANÁLISE EXECUTIVA", { x: marginX, y, size: 8, font: fontBold, color: PORTAL_COLOR });
  y -= 18;

  const paragraphs = textoClaude.split(/\n\n+/).filter(Boolean);
  for (const para of paragraphs) {
    const cleanPara = para.replace(/[*#]+/g, "").trim();
    const lines = splitTextLines(cleanPara, fontRegular, 10, contentWidth);
    for (const line of lines) {
      checkSpace(14);
      page.drawText(line, { x: marginX, y, size: 10, font: fontRegular, color: TEXT_COLOR });
      y -= 14;
    }
    y -= 8;
  }
  }

  // Footer on last page
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i];
    pg.drawLine({ start: { x: marginX, y: 45 }, end: { x: pageWidth - marginX, y: 45 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
    pg.drawText("Portal Sigilo — Documento Confidencial de Compliance. Não compartilhe externamente.", { x: marginX, y: 30, size: 7, font: fontRegular, color: GRAY_COLOR });
    pg.drawText(`Página ${i + 1} de ${pages.length}`, { x: pageWidth - marginX - 60, y: 30, size: 7, font: fontRegular, color: GRAY_COLOR });
  }

  const pdfBytes = Buffer.from(await pdfDoc.save());

  await adminDb.collection("reports").doc(reportId).update({
    status: "exportado",
    exportado: true,
    exportado_em: FieldValue.serverTimestamp(),
  });

  await logAudit({
    orgId: session.orgId,
    userId: session.uid,
    acao: "report_exported",
    detalhes: { reportId },
  });

  const filename = `relatorio-${periodoStr.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
  } catch (err) {
    console.error("[GET /api/reports/[reportId]/export]", err);
    return Response.json({ error: "Erro ao gerar PDF. Tente novamente." }, { status: 500 });
  }
}
