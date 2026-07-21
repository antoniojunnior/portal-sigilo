# C4 — Nível 2: Containers — portal-sigilo

> Gerado pelo Architect em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

```mermaid
C4Container
    title Portal Sigilo — Diagrama de Containers

    Person(denunciante, "Denunciante")
    Person(gestor, "Gestor de Compliance")

    System_Boundary(sigilo, "Portal Sigilo") {
        Container(webapp, "Next.js App (App Router)", "Next.js 16, React 19, TypeScript", "Portal público (denunciante), dashboard (gestor), páginas de planos/checkout. SSR + Route Handlers no mesmo processo.")
        Container(routeHandlers, "Route Handlers (API)", "Next.js Route Handlers, TypeScript", "24 endpoints server-side sob /api/*: auth, cases, chat, assistant, billing, checkout, dashboard, messages, orgs, reports, upload-attachment")
        Container(middleware, "Middleware", "Next.js Middleware (Edge)", "Protege /app/:path* exigindo cookie __session presente")
        Container(functions, "Firebase Functions", "Node 22, TypeScript, firebase-functions v2", "3 functions: generateDailyInsights (scheduled), generateMonthlyReports (scheduled), webhookAsaas (HTTP)")
    }

    ContainerDb(firestore, "Cloud Firestore", "NoSQL, region southamerica-east1", "orgs, units, users, cases, messages, audit_logs, reports, notifications, mail, whatsapp_sessions (não usado ainda)")
    ContainerDb(storage, "Firebase Storage", "Object storage", "Anexos de casos, path orgs/{orgId}/cases/temp/{uuid}/")

    System_Ext(anthropic, "Anthropic API")
    System_Ext(asaas, "Asaas API")
    System_Ext(firebaseAuth, "Firebase Authentication")

    Rel(denunciante, webapp, "Acessa portal público", "HTTPS")
    Rel(gestor, webapp, "Acessa dashboard", "HTTPS")
    Rel(webapp, middleware, "Toda navegação sob /app", "intercepta request")
    Rel(webapp, routeHandlers, "fetch/SWR client-side", "HTTPS/JSON, fetch() nativo")

    Rel(routeHandlers, firestore, "Admin SDK — bypassa Firestore Rules, checagem manual de org_id/role", "firebase-admin")
    Rel(routeHandlers, storage, "Admin SDK — upload/leitura de anexos", "firebase-admin")
    Rel(routeHandlers, firebaseAuth, "verifySession, createSessionCookie, createUser", "firebase-admin")
    Rel(routeHandlers, anthropic, "chat, assistant, triagem, reports/generate", "@anthropic-ai/sdk, streaming")
    Rel(routeHandlers, asaas, "checkout/create, billing/*", "fetch HTTP direto")

    Rel(asaas, functions, "webhook de eventos de pagamento", "HTTPS POST + token")
    Rel(functions, firestore, "provisiona org, grava insights/reports", "firebase-admin")
    Rel(functions, anthropic, "generateDailyInsights, generateMonthlyReports", "@anthropic-ai/sdk")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Containers identificados

| Container | Tecnologia | Responsabilidade | Confiança |
|---|---|---|---|
| Next.js App (App Router) | Next.js 16, React 19 | Renderização de páginas (portal público, dashboard, planos), roteamento por convenção de pastas | 🟢 |
| Route Handlers | Next.js Route Handlers | 24 endpoints server-side, toda a lógica de negócio e integrações externas | 🟢 |
| Middleware | Next.js Middleware | Gate de presença de cookie de sessão para `/app/*` | 🟢 |
| Firebase Functions | Node 22 + firebase-functions v2 | Jobs agendados (insights diários, relatórios mensais) e webhook de pagamento — processo **separado** do Next.js, deploy independente via `firebase deploy --only functions` | 🟢 |
| Cloud Firestore | NoSQL gerenciado | Único banco de dados do sistema, multi-tenant | 🟢 |
| Firebase Storage | Object storage gerenciado | Anexos de casos | 🟢 |

🟡 **Nota de deployment:** não há Dockerfile/docker-compose no repositório — o Next.js app é hospedado presumivelmente em uma plataforma que builda `next build`/`next start` diretamente (Vercel ou similar), e as Functions são deployadas separadamente via Firebase CLI (`firebase.json` define `predeploy: [lint, build]`). Sem workflow de CI/CD (`.github/workflows/`) encontrado — deploy parece ser manual em ambos os containers. 🔴 Confirmação da plataforma de hosting do Next.js é uma LACUNA (não há `vercel.json` nem outro indicador explícito no repositório).

## Comunicação entre containers

- **webapp → routeHandlers**: mesmo processo/deploy (Next.js unifica ambos), comunicação via `fetch`/SWR client-side, não há chamada de rede externa real entre eles
- **routeHandlers → Firestore/Storage/Auth**: sempre via Firebase Admin SDK, nunca client SDK — implica bypass total das Firestore Rules (ver ADR-005)
- **asaas → functions**: único ponto de entrada HTTP externo que não passa pelo Next.js — a function `webhookAsaas` é uma Cloud Function HTTP independente, com autenticação própria via header `asaas-access-token`
- **functions → Firestore/Anthropic**: mesmo padrão de Admin SDK das Route Handlers, mas em processo/deploy separado (`functions/` tem seu próprio `package.json`, dependências e versões — ver drift documentado em `_reversa_sdd/dependencies.md`)
