# Dependências — portal-sigilo

> Gerado pelo Scout em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

## Raiz (`package.json`) — app Next.js

### Dependencies

| Pacote | Versão | Papel |
|---|---|---|
| next | 16.2.4 | Framework (App Router, Route Handlers, middleware) |
| react / react-dom | 19.2.4 | UI |
| @anthropic-ai/sdk | ^0.90.0 | Chamadas à API Claude — sempre server-side (regra inviolável #1) |
| firebase | ^12.12.1 | SDK client (Auth, Firestore, Storage no browser) |
| firebase-admin | ^13.8.0 | SDK server-side (Route Handlers, bypass de Rules) |
| lucide-react | ^1.14.0 | Ícones |
| pdf-lib | ^1.17.1 | Geração/manipulação de PDF (provável: relatórios) |
| file-type | ^22.0.1 | Detecção de mime type real de anexos (regra inviolável #6 — validação server-side) |
| swr | ^2.4.1 | Data fetching/cache client-side |
| server-only | ^0.0.1 | Marca módulos como server-only em build time |

### DevDependencies

| Pacote | Versão | Papel |
|---|---|---|
| typescript | ^5 | Linguagem, `strict: true` |
| tailwindcss | ^4 | Estilo utilitário |
| @tailwindcss/postcss | ^4 | Integração PostCSS |
| eslint / eslint-config-next | ^9 / 16.2.4 | Lint |
| @firebase/rules-unit-testing | ^5.0.0 | Testes de Firestore/Storage Rules |
| dotenv | ^17.4.2 | Carregar `.env` em scripts |
| @types/node, @types/react, @types/react-dom | — | Tipagem |

## `functions/package.json` — Firebase Functions

| Pacote | Versão | Papel |
|---|---|---|
| @anthropic-ai/sdk | ^0.100.1 | IA server-side dentro das Functions (versão diferente da raiz — 🟡 possível drift a monitorar) |
| firebase-admin | ^12.6.0 | SDK server-side (🟡 versão major menor que a da raiz — ^13.8.0 vs ^12.6.0) |
| firebase-functions | ^6.0.1 | Runtime das Cloud Functions |

DevDependencies: `@typescript-eslint/*` (^5.12.0), `eslint` (^8.9.0, versão major menor que a raiz), `eslint-config-google`, `eslint-plugin-import`, `firebase-functions-test`, `typescript` (^5.7.3).

Node runtime: `engines.node = "22"` (🟡 diverge do `.nvmrc` da raiz, que fixa `20`).

## Integrações externas identificadas

| Integração | Onde | Uso |
|---|---|---|
| Anthropic API (Claude) | `src/app/api/assistant`, `src/app/api/chat`, `functions/src/aiInsights.ts` | Chatbot de triagem, assistente IA de relatórios |
| Firebase (Auth/Firestore/Storage/Functions) | `src/lib/firebase*`, `functions/src` | Persistência, autenticação, storage de anexos |
| Asaas (gateway de pagamento BR) | `src/lib/asaas/*`, `functions/src/webhookAsaas.ts`, `src/app/api/checkout`, `src/app/api/billing/*` | Checkout, assinaturas, cobrança, webhooks |

## Riscos de versão observados (🟡 INFERIDO — requer validação)

- `firebase-admin`: ^13.8.0 (raiz) vs ^12.6.0 (functions) — drift de major version entre os dois runtimes.
- `@anthropic-ai/sdk`: ^0.90.0 (raiz) vs ^0.100.1 (functions) — drift de versão pode implicar diferenças de API entre os dois pontos de chamada à IA.
- `eslint`: ^9 (raiz) vs ^8.9.0 (functions) — configs de lint divergentes (flat config vs legado), coerente com `eslint.config.mjs` na raiz.
- Node runtime: `.nvmrc` = 20 na raiz, `functions.engines.node` = 22 — ambientes de execução diferentes.

## Gerenciador de pacotes

🟢 npm — `package-lock.json` presente na raiz; ausência de `yarn.lock`/`pnpm-lock.yaml`/`bun.lockb`.
