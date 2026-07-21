# Inventário — portal-sigilo

> Gerado pelo Scout em 2026-07-20.
> Escala de confiança: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

## 1. Visão geral

🟢 SaaS multi-tenant de canal de denúncias corporativo com IA (conforme `AGENTS.md`). Stack: Next.js 16 (App Router) + TypeScript + Firebase (Firestore/Auth/Storage/Functions) + Anthropic API (Claude) + Tailwind v4 + componentes shadcn/ui-like em `src/components/ui`.

## 2. Estrutura de pastas (raiz relevante ao produto)

```
portal-sigilo/
├── src/
│   ├── app/
│   │   ├── (dashboard)/app/(protected)/     # área logada do gestor
│   │   ├── (dashboard)/app/login/
│   │   ├── [slug]/                          # portal público do denunciante (por org)
│   │   │   ├── acompanhar/
│   │   │   ├── chat/
│   │   │   └── confirmacao/
│   │   ├── planos/                          # página de planos/checkout
│   │   ├── portal/app/
│   │   └── api/                             # Route Handlers (server-side)
│   │       ├── assistant/
│   │       ├── auth/{login,logout,me}/
│   │       ├── billing/{cancel,info,invoices,subscription}/
│   │       ├── cases/{resolve,track}/
│   │       ├── chat/
│   │       ├── checkout/create/
│   │       ├── dashboard/{cases,heatmap,insights,metrics,notifications,org,users}/
│   │       ├── messages/
│   │       ├── orgs/search/
│   │       ├── reports/{[reportId],generate}/
│   │       └── upload-attachment/
│   │   └── middleware.ts
│   ├── components/{dashboard,layout,portal,ui}/
│   ├── contexts/ (AuthContext, MobileMenuContext)
│   ├── hooks/ (useAuth)
│   ├── lib/
│   │   ├── asaas/ (cancelSubscription, createPaymentLink, getInvoices, getSubscription)
│   │   ├── config/ux.ts
│   │   ├── env.ts, env.client.ts
│   │   ├── firebase/client.ts
│   │   ├── firebase-admin/admin.ts
│   │   ├── planos.ts, triagem.ts
│   │   ├── types/index.ts
│   │   └── utils/{audit,auth,protocol}.ts
│   └── styles/
├── functions/src/
│   ├── index.ts
│   ├── aiInsights.ts
│   ├── scheduledReports.ts
│   └── webhookAsaas.ts
├── scripts/ (seed-emulator.ts, seed-remote.ts, seed-asaas-customer.mjs, test-rules.ts)
├── docs/ (PRD, specs, stories/epics, qa/gates, auditorias)
├── firestore.rules, storage.rules, firestore.indexes.json, firebase.json
└── public/
```

Pastas de framework/tooling excluídas do escopo de produto: `.aiox-core/`, `.claude/`, `.agents/`, `.codex/`, `.cursor/`, `.gemini/`, `.kimi/`, `.antigravity/`, `.github/agents/` (definições de agentes AIOX, não código do produto).

## 3. Tecnologias e frameworks

🟢 Extraído de `package.json` (raiz) e `functions/package.json`:

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework web | Next.js (App Router) | 16.2.4 |
| UI | React / React DOM | 19.2.4 |
| Linguagem | TypeScript | ^5 |
| Estilo | Tailwind CSS | ^4 (via `@tailwindcss/postcss`) |
| Ícones | lucide-react | ^1.14.0 |
| Backend as a Service | firebase (client SDK) | ^12.12.1 |
| Backend as a Service | firebase-admin | ^13.8.0 |
| IA | @anthropic-ai/sdk | ^0.90.0 (raiz) / ^0.100.1 (functions) |
| Pagamentos | Asaas (via `src/lib/asaas/*`, sem SDK oficial — integração HTTP direta) | — |
| PDF | pdf-lib | ^1.17.1 |
| Data fetching client | swr | ^2.4.1 |
| Detecção de mime | file-type | ^22.0.1 |
| Funções serverless | firebase-functions | ^6.0.1 (em `functions/`) |
| Node runtime | Node 20 (`.nvmrc`) / Node 22 (`functions.engines`) | — |

Gerenciador de pacotes: 🟡 npm (presença de `package-lock.json`; sem `yarn.lock`/`pnpm-lock.yaml`).

## 4. Pontos de entrada

- 🟢 App Router Next.js: `src/app/` (sem `pages/`, projeto 100% App Router)
- 🟢 Middleware global: `src/middleware.ts`
- 🟢 Route Handlers (API server-side): 24 diretórios sob `src/app/api/*`
- 🟢 Firebase Functions: `functions/src/index.ts` (entry point), mais `aiInsights.ts`, `scheduledReports.ts`, `webhookAsaas.ts`
- 🟢 Scripts operacionais: `scripts/seed-emulator.ts`, `scripts/seed-remote.ts`, `scripts/seed-asaas-customer.mjs`, `scripts/test-rules.ts`
- 🟢 Configuração de ambiente: `.env`, `.env.local`, `.env.example` (raiz) e `functions/.env`, `functions/.env.example`
- 🔴 CI/CD: **nenhum workflow encontrado** em `.github/workflows/` (só existem definições de agentes AIOX em `.github/agents/`). Deploy presumivelmente manual via Firebase CLI.
- 🔴 Docker: nenhum `Dockerfile` ou `docker-compose.yml` no repositório.
- 🟢 `firebase.json`: define Firestore, Functions (com predeploy lint+build), Storage e emulators (auth, functions, firestore, storage, ui)

## 5. Banco de dados (superficial)

🟢 Firestore (NoSQL) como banco principal. Artefatos de regras/índices na raiz:
- `firestore.rules` (regras de segurança — RBAC por org, isolamento por `org_id`, bloqueio de `mencionados`, imutabilidade de `audit_logs`)
- `firestore.indexes.json`
- `storage.rules` (regras de Storage)

Sem migrations/DDL tradicionais (NoSQL). Análise completa de coleções, campos e relações fica a cargo do `reversa-data-master`.

## 6. Cobertura de testes

🟡 Nenhum arquivo `*.test.*` ou `*.spec.*` encontrado em `src/`, `functions/src/` ou `scripts/`. Cobertura de testes automatizados: **aparentemente inexistente** para lógica de aplicação.

🟢 Existe `scripts/test-rules.ts`, que usa `@firebase/rules-unit-testing` (devDependency da raiz) — testes dedicados às Firestore Rules, não aos Route Handlers/componentes.

## 7. Documentação existente no projeto

🟢 `docs/` já contém: PRD (`PRD_PortalSigilo_v2.md`), specs de frontend (`docs/specs/frontend-spec-*.md`), auditorias (`AUDITORIA_DASHBOARD.md`, `AUDITORIA_UI_FASE5.md`), guia de implementação, `SECURITY.md`, e stories/epics numerados (Epic 6, Epic 9/9b/9c com stories 9.1 a 9.11 — condizente com `AGENTS.md` indicando Fase 9 — Checkout concluída).

## 8. Contagem de arquivos por extensão (produto, excluindo tooling/framework)

| Extensão | Contagem |
|---|---|
| .tsx | 67 |
| .ts | 59 |
| .md | 31 |
| .yml | 11 |
| .json | 10 |
| .html | 6 |
| .svg | 5 |
| .mjs | 3 |
| .jsx | 3 |
| .rules | 2 |
