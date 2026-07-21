# Spec Impact Matrix — portal-sigilo

> Gerado pelo Architect em 2026-07-20. Mapeia qual endpoint/componente impacta qual outro — usar antes de alterar qualquer módulo listado como "impacta".
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO

## Componentes compartilhados → quem impactam

| Componente compartilhado | Impacta (endpoints/módulos) | Tipo de impacto |
|---|---|---|
| `src/lib/utils/auth.ts` (`verifySession`) | auth, assistant, billing (4 rotas), dashboard (12 rotas), reports (4 rotas) | 🟢 Mudança no shape de `SessionUser` ou na lógica de validação quebra 21 rotas simultaneamente |
| `src/lib/utils/audit.ts` (`logAudit`) | auth, chat, dashboard, billing, reports, upload-attachment | 🟢 Mudança no schema de `audit_logs` afeta trilha legal de 6 módulos |
| `src/lib/firebase-admin/admin.ts` | todos os 11 endpoints + `functions/src/*` (inicialização própria, mas mesmo padrão) | 🟢 Ponto único de configuração do Admin SDK — falha aqui derruba todo o backend |
| `src/lib/env.ts` | todos os módulos que chamam Anthropic, Asaas ou Firebase Admin | 🟢 Variável obrigatória ausente derruba o boot inteiro (`requireEnv` lança) |
| `src/lib/types/index.ts` | todos os módulos (tipos de domínio compartilhados) | 🟡 Divergências já existem entre tipo e dado real (ver `data-dictionary.md`) — mudança de tipo sem migração de dado é risco |
| `src/lib/utils/protocol.ts` (`generateProtocol`) | cases, chat | 🟢 Mudança no formato do protocolo afeta consulta pública (`cases/track`) e UX de todos os denunciantes |
| `src/lib/triagem.ts` (`runTriagem`, `validateTriagem`) | chat (único chamador direto), mas dados gerados (`triagem_ia`) consumidos por dashboard (heatmap, insights, metrics), reports (agregação), assistant (contexto do prompt) | 🟢 Mudança no schema de `TriagemIA` ou nas categorias/leis fixas impacta 4 outros módulos consumidores |
| `src/lib/asaas/*` | billing, checkout, `functions/webhookAsaas.ts` | 🟢 Mudança de contrato com a API Asaas (ou de `PLANOS_CONFIG`) impacta os 3 pontos de integração |
| `src/lib/planos.ts` (`PLANOS`) | páginas `/planos` (UI), `checkout/create` (validação de plano), `createPaymentLink` (preços) | 🟡 Fonte de verdade de preços/features — se divergir de `PLANOS_CONFIG` em `createPaymentLink.ts`, UI mostra preço diferente do cobrado |
| `firestore.rules` | todo acesso client-side direto ao Firestore (hoje: nenhum Route Handler, mas relevante para app mobile futuro, Fase 8) | 🟡 Não afeta Route Handlers (Admin SDK bypassa), mas é a única proteção real se o SDK client for usado no futuro |

## Endpoints → quem os consome (dependências de leitura)

| Dado gravado por | Consumido por | Observação |
|---|---|---|
| `chat` (cria `case` + `triagem_ia`) | `dashboard/cases*`, `dashboard/heatmap`, `dashboard/insights`, `dashboard/metrics`, `assistant`, `reports/generate` | Mudança no schema de `case`/`triagem_ia` gravado pelo `chat` propaga para 6 outros consumidores |
| `cases` (POST, formulário) | mesmos consumidores acima (mesma coleção `cases`) | Caminho alternativo de criação, mesmo schema-alvo |
| `dashboard/cases/[caseId]` PATCH (status/responsável/prazo) | `dashboard/metrics` (cálculo de resolvidos/semRespostaUrgente), `reports/generate` (agregação) | Mudança de enum `CaseStatus` sem atualizar as duas agregações quebra métricas silenciosamente |
| `webhookAsaas.provisionOrg` (cria `org`) | todo o dashboard (depende de `orgs/{orgId}` existir e ter `plano_ativo`) | Falha no provisionamento bloqueia o cliente de usar qualquer parte autenticada do sistema |
| `billing/cancel` / webhook (`plano_ativo`) | `assistant`, `reports/generate` (gate de `plano === "suspenso"/"cancelado"`), `dashboard/insights` (gate de `entrada`) | Mudança nos valores possíveis de `plano_ativo` exige atualizar todos os gates |
| `runTriagem` → `notifications` (urgência≥4) | `dashboard/notifications/count` | Único consumidor; mudança no critério de criação (`urgencia >= 4`) muda o que aparece como notificação |
| `functions/aiInsights.ts` → `orgs.ai_insights` | `dashboard/insights` (fonte primária, antes do fallback heurístico) | Mudança no formato de `items[]` quebra o parsing em `dashboard/insights` |
| `reports/generate` → `reports` (metricas, texto_claude) | `reports/[reportId]`, `reports/[reportId]/approve`, `reports/[reportId]/export` | Mudança no schema de `metricas` propaga para o PDF exportado |

## Camadas transversais → tudo

| Camada | Alcance |
|---|---|
| `src/middleware.ts` | Todo o dashboard (`/app/*`) — mudança no matcher ou na lógica de redirect afeta acesso de todos os gestores |
| Regras invioláveis do `AGENTS.md` (S1-S6 do código) | Transversal a todo o sistema — qualquer PR que viole S1 (chave Anthropic client-side), S2 (número em texto puro), S3 (org_id ausente), S4 (mencionados acessando caso), S5 (audit log editável) é uma regressão de segurança crítica, não um bug comum |

## Como usar esta matriz

Antes de alterar qualquer arquivo listado na coluna "Componente compartilhado", consulte a coluna "Impacta" e rode manualmente (não há testes automatizados, ver `architecture.md` §Riscos) os fluxos afetados. Para specs de feature nova (via `/reversa-forward`), cite esta matriz na seção de análise de impacto do `plan.md` da feature.
