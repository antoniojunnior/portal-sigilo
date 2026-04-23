import "server-only";

// Centraliza variáveis de ambiente server-side com validação em runtime.
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

// ─── Client-side (prefixo NEXT_PUBLIC_) — exportados aqui somente para uso
// em Route Handlers e Server Components. Para Client Components, use env.client.ts.
