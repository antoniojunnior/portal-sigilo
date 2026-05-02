import { adminDb } from "@/lib/firebase-admin/admin";
import { verifySession } from "@/lib/utils/auth";
import type { NextRequest } from "next/server";

// Returns case counts grouped by area_risco × categoria from triagem_ia.
// Rows use the org's configured departamentos (with zeros for empty depts).
// Cases with area_risco not in the configured list appear as extra rows.
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const session = await verifySession(sessionCookie);
    if (!session) return Response.json({ error: "Sessão inválida" }, { status: 401 });

    const { orgId, uid } = session;

    const [snapshot, orgDoc] = await Promise.all([
      adminDb.collection("cases").where("org_id", "==", orgId).get(),
      adminDb.collection("orgs").doc(orgId).get(),
    ]);

    const orgDepts: string[] =
      (orgDoc.data()?.configuracoes?.departamentos as string[] | undefined) ?? [];

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

    // Canonical department order: configured list first, then any extra from cases
    const extraDepts = [...deptSet].filter((d) => !orgDepts.includes(d)).sort();
    const departments = orgDepts.length > 0 ? [...orgDepts, ...extraDepts] : [...deptSet].sort();
    const categories = [...catSet].sort();

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
