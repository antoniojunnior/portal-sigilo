# Assistant, Design Técnico

> Fonte: `src/app/api/assistant/route.ts`, `_reversa_sdd/flowcharts/assistant.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/assistant` | `{caseId: string, messages: {role, content}[], includeFullReport?: boolean}` (cookie `__session`) | `text/event-stream` (SSE: `{type:"token",content}` \| `{type:"done"}` \| `{type:"error",message}`) | 200 (stream), 400, 401, 403, 404 |
| PUT | `/api/assistant` | `{items: string[]}` (cookie `__session`, role admin) | `{ok: true}` | 200, 400, 401, 403 |

## Fluxo Principal (POST)
1. Extrai cookie `__session`, chama `verifySession` — 401 se ausente/inválida (`src/app/api/assistant/route.ts:49-57`)
2. Gate de plano: `entrada` → 403 `feature_not_available`; `suspenso`/`cancelado` → 403 `plan_suspended` (`:59-65`)
3. Valida `caseId`/`messages` no corpo — 400 se ausentes (`:74-78`)
4. Carrega `cases/{caseId}`, valida `org_id` e ausência de `session.uid` em `mencionados` (`:80-94`)
5. Extrai `categoria`/`urgencia`/`leis`/`diasEmAberto` do caso com defaults (`:96-105`)
6. Se `includeFullReport`: `logAudit(ai_full_access_granted)` → busca `messages` ordenadas por `seq` → monta relato concatenado (`:107-131`)
7. `buildSystemPrompt` monta o prompt final (`:23-46`)
8. `logAudit(ai_assistant_session)` (`:135-141`)
9. Abre `ReadableStream`, consome `anthropic.messages.stream` (modelo `claude-sonnet-4-20250514`, max_tokens 1500), reemite cada `content_block_delta` como SSE `token`, e `done` ao final (`:143-184`)

## Fluxos Alternativos
- **Erro no stream Claude:** captura exceção, emite `{type:"error", message:"Serviço temporariamente indisponível..."}`, fecha o controller (`:169-174`)
- **`includeFullReport=false`/omitido:** prompt não inclui o campo `relato`, `buildSystemPrompt` usa apenas o bloco base (`:38-46`)

## Fluxo Principal (PUT)
1. Autentica e exige `role === "admin"` (401/403) (`:190-196`)
2. Valida `items` como array de string (`:198-201`)
3. Atualiza `orgs/{orgId}.ai_insights = {items: items.slice(0,3), gerado_em: serverTimestamp()}` (`:203-208`)

## Dependências
- `verifySession` (`src/lib/utils/auth.ts`) — autenticação
- `logAudit` (`src/lib/utils/audit.ts`) — trilha de auditoria
- `adminDb` (`src/lib/firebase-admin/admin.ts`) — leitura/escrita Firestore
- `@anthropic-ai/sdk` — geração de resposta

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Streaming SSE manual via `ReadableStream`, sem AI SDK de terceiros | `src/app/api/assistant/route.ts:145-176`; ver ADR-004 | 🟢 |
| Acesso ao relato completo é opt-in explícito e auditado separadamente da sessão de uso comum | `:107-116` | 🟢 |

## Estado Interno
Não mantém estado próprio — cada request é independente; o "contexto" da conversa (`messages`) é enviado pelo cliente a cada chamada.

## Observabilidade
- `console.error("[/api/assistant] Claude stream error:", err)` em falha de stream
- Audit logs: `ai_full_access_granted`, `ai_assistant_session`

## Riscos e Lacunas
- 🔴 `POST` não bloqueia explicitamente `role === "auditor"`, diferente de `reports/generate` e outras rotas de IA/escrita — validar se é intencional
- 🟡 Modelo hardcoded (`claude-sonnet-4-20250514`) diverge do usado em `chat`/`triagem` (`claude-sonnet-4-6`) — sem constante central de modelo
