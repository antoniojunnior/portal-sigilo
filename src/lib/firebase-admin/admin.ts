// ATENÇÃO: Este arquivo é exclusivamente server-side.
// NUNCA importe este módulo em componentes client-side ou arquivos
// que possam ser incluídos no bundle do browser.
// Verificação: grep -r "firebase-admin/admin" src/app --include="*.tsx" → zero resultados esperados.

import * as admin from "firebase-admin";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
} from "@/lib/env";

function initAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY,
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const adminApp = initAdminApp();
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
export const adminStorage = admin.storage(adminApp);
