# Requirements: Limpeza de Frontend — Codigo morto, endpoints orfaos e correcoes

> Identificador: `007-limpeza-frontend`
> Data: `2026-07-23`
> Pasta da extracao reversa: `_reversa_sdd/`
> Confidencia: 🟢 CONFIRMADO

## 1. Resumo executivo

Varredura do frontend identificou codigo morto acumulado ao longo de 6 features: 5 componentes nunca importados, 2 endpoints API sem consumidores, 1 import nao utilizado, ausencia de ErrorBoundary no DashboardLayout, pagina `/app/insights` sem link no sidebar. Esta feature remove o que nao e usado e adiciona protecoes faltantes.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidencia |
|-------|------------------|-------------|
| Varredura frontend 2026-07-23 | 7 componentes com 0 imports (ProgressSteps, RiskCell, ChatInput, ChatAttachment, PortalLayout, PortalHeader, diagnostic endpoint) | 🟢 |
| Varredura frontend 2026-07-23 | 2 endpoints API sem consumidores apos feature 006 (`/api/billing/info`, `/api/billing/subscription`) | 🟢 |
| `src/components/ui/index.ts:17,28` | Barrel export de ProgressSteps, RiskCell — componentes removidos | 🟢 |
| `src/components/layout/DashboardLayout.tsx` | Sem ErrorBoundary — qualquer excecao derruba o dashboard | 🟢 |
| `src/components/layout/Sidebar.tsx:24-29` | NAV_ITEMS sem entrada para `/app/insights` | 🟢 |
| `src/app/(dashboard)/app/(protected)/relatorios/[reportId]/page.tsx:6,37` | `useRouter` importado mas nunca usado (`router.` = 0 ocorrencias) | 🟢 |

## 3. Requisitos Funcionais

| ID | Requisito | Prioridade | Criterio de aceite | Confidencia |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Remover componentes nao utilizados: `ProgressSteps.tsx`, `RiskCell.tsx`, `PortalLayout.tsx`, `PortalHeader.tsx` e seus exports no barrel `index.ts` | Must | Arquivos deletados; barrel export limpo; tsc compila sem erros | 🟢 |
| RF-02 | Remover endpoints API orfaos: `GET /api/billing/info` e `GET /api/billing/subscription` (sem consumidores apos feature 006) | Must | Diretorios `src/app/api/billing/info/` e `src/app/api/billing/subscription/` removidos | 🟢 |
| RF-03 | Remover endpoint de diagnostico `/api/reports/diagnostic` criado durante investigacao do BUG-20260723-IDX1 | Must | Diretorio `src/app/api/reports/diagnostic/` removido | 🟢 |
| RF-04 | Remover `useRouter` nao utilizado em `relatorios/[reportId]/page.tsx` | Must | Import e declaracao `const router = useRouter()` removidos | 🟢 |
| RF-05 | Adicionar `ErrorBoundary` wrapper no `DashboardLayout.tsx` protegendo todas as paginas do dashboard | Must | `DashboardLayout` renderiza `children` dentro de `<ErrorBoundary>` | 🟢 |
| RF-06 | Adicionar `/app/insights` ao `NAV_ITEMS` do `Sidebar.tsx` | Should | Item "Insights" visivel no sidebar entre "Casos" e "Relatorios" | 🟢 |

## 4. Criterios de Aceitacao

```gherkin
Cenario: Componentes removidos nao quebram compilacao
  Dado que os arquivos ProgressSteps, RiskCell, PortalLayout, PortalHeader foram deletados
  E o barrel export de ui/index.ts foi atualizado
  Quando o projeto compila com npx tsc --noEmit
  Entao zero erros de compilacao

Cenario: Endpoints orfaos removidos
  Dado que /api/billing/info e /api/billing/subscription nao tem consumidores
  Quando os diretorios sao deletados
  Entao tsc compila sem erros e nenhuma pagina quebra

Cenario: Dashboard protegido por ErrorBoundary
  Dado que uma pagina protegida lanca excecao nao tratada
  Quando o ErrorBoundary captura o erro
  Entao o dashboard exibe fallback em vez de tela branca/crash

Cenario: Insights acessivel pelo sidebar
  Dado que o usuario logado acessa o dashboard
  Quando o sidebar renderiza
  Entao o item "Insights" aparece e navega para /app/insights
```

## 5. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 | Must | Remove 642 linhas de codigo morto |
| RF-02 | Must | Remove endpoints sem consumidor — security surface reduction |
| RF-03 | Must | Remove endpoint de debug que vazava dados internos |
| RF-04 | Must | Limpeza de import nao usado |
| RF-05 | Must | Protege dashboard contra crashes nao tratados |
| RF-06 | Should | Melhora discoverability da pagina de insights |

## 6. Lacunas

Nenhuma — todas as acoes sao deterministicas, baseadas em varredura estatica.

## 7. Historico de alteracoes

| Data | Alteracao | Autor |
|------|-----------|-------|
| 2026-07-23 | Versao inicial gerada por `/reversa-requirements` | reversa |
