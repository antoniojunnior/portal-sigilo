import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase-admin/admin";
import type { Role } from "@/lib/types";

export interface SessionUser {
  uid: string;
  email: string;
  orgId: string;
  orgName: string;
  role: Role;
  unitId?: string;
  nome: string;
  plano: string;
}

export async function verifySession(sessionCookie: string): Promise<SessionUser | null> {
  try {
    // checkRevoked=false: JWT validated cryptographically; revocation handled by
    // the ativo===true Firestore check below, avoiding a Firebase network round-trip.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data()!;
    if (userData.ativo !== true) return null;

    const orgId: string = userData.org_id;
    const orgDoc = await adminDb.collection("orgs").doc(orgId).get();
    if (!orgDoc.exists) return null;

    const orgData = orgDoc.data()!;

    return {
      uid,
      email: userData.email as string,
      orgId,
      orgName: orgData.nome as string,
      role: userData.role as Role,
      unitId: userData.unit_id as string | undefined,
      nome: userData.nome as string,
      plano: orgData.plano_ativo as string,
    };
  } catch {
    return null;
  }
}
