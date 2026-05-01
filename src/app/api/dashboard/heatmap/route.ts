import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

// Returns case counts grouped by area_risco × categoria_legal from triagem_ia.
// Used by the Heatmap component on the dashboard home.
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    const snapshot = await adminDb
      .collection("cases")
      .where("org_id", "==", orgId)
      .get();

    // dept → category → count
    const matrix: Record<string, Record<string, number>> = {};
    const deptSet = new Set<string>();
    const catSet = new Set<string>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const mencionados: string[] = data.mencionados ?? [];
      if (mencionados.includes(uid)) continue;

      const triagem = data.triagem_ia as Record<string, unknown> | undefined;
      const dept: string = (triagem?.area_risco as string | undefined) ?? "Outros";
      const cat: string = (triagem?.categoria as string | undefined) ?? data.categoria ?? "Outros";

      deptSet.add(dept);
      catSet.add(cat);

      if (!matrix[dept]) matrix[dept] = {};
      matrix[dept][cat] = (matrix[dept][cat] ?? 0) + 1;
    }

    const departments = [...deptSet].sort();
    const categories = [...catSet].sort();

    // Build 2D array: rows = departments, cols = categories
    const rows = departments.map((dept) => ({
      dept,
      values: categories.map((cat) => matrix[dept]?.[cat] ?? 0),
    }));

    return Response.json({ departments, categories, rows });
  } catch (err) {
    console.error("[GET /api/dashboard/heatmap]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
