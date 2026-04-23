// Centraliza TODAS as variáveis de ambiente com validação em runtime.
// Nunca acesse process.env diretamente fora deste arquivo.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente obrigatória ausente: ${key}\n` +
        `Verifique o arquivo .env.local e .env.example.`
    );
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

// ─── Server-only (NUNCA exportar para o bundle do browser) ───────────────────

/** Chave da API Anthropic — exclusivamente server-side (S1). */
export const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");

/** ID do projeto Firebase — usado no Admin SDK. */
export const FIREBASE_PROJECT_ID = requireEnv("FIREBASE_PROJECT_ID");

/** Chave privada do service account Firebase Admin. */
export const FIREBASE_PRIVATE_KEY = requireEnv("FIREBASE_PRIVATE_KEY").replace(
  /\\n/g,
  "\n"
);

/** Email do service account Firebase Admin. */
export const FIREBASE_CLIENT_EMAIL = requireEnv("FIREBASE_CLIENT_EMAIL");

// ─── Client-side (prefixo NEXT_PUBLIC_ — sem segredos) ───────────────────────

/** API Key pública do Firebase (sem segredo — usada no browser). */
export const NEXT_PUBLIC_FIREBASE_API_KEY = requireEnv(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
);

/** Auth domain público do Firebase. */
export const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = requireEnv(
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
);

/** Project ID público do Firebase (igual ao server-side). */
export const NEXT_PUBLIC_FIREBASE_PROJECT_ID = requireEnv(
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
);

/** Storage bucket público do Firebase. */
export const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = requireEnv(
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
);

/** Messaging sender ID público do Firebase. */
export const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = optionalEnv(
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
);

/** App ID público do Firebase. */
export const NEXT_PUBLIC_FIREBASE_APP_ID = optionalEnv(
  "NEXT_PUBLIC_FIREBASE_APP_ID"
);
