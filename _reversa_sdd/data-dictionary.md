# Dicionário de Dados — portal-sigilo

> Gerado pelo Archaeologist em 2026-07-20, a partir de `src/lib/types/index.ts` e uso real nos Route Handlers.
> Banco: Firestore (NoSQL, sem schema enforçado — este dicionário é a fonte de verdade extraída do código).
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

## `orgs`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | ID do documento (= orgId) |
| nome | string | 🟢 sim | Nome da organização |
| slug | string | 🟢 sim | Slug único, usado no portal público (`/[slug]`) |
| plano_ativo | `"entrada"\|"gestao"\|"enterprise"\|"suspenso"\|"cancelado"` | 🟢 sim | 🟡 O tipo `Plano` em `types/index.ts` só modela 3 valores; `"suspenso"`/`"cancelado"` são usados em runtime (billing, webhook) mas não estão no union type — inconsistência tipo↔uso |
| url_canal | string | 🔴 opcional | Não usado em nenhuma rota lida |
| logo | string \| null | 🟢 não | URL do logo |
| dominios_white_label | string[] | 🔴 opcional | Presente no tipo, sem uso observado nas rotas analisadas (feature Enterprise futura) |
| criado_em / data_inicio | Timestamp | 🟢 sim | Data de provisionamento (via webhook) |
| data_renovacao | Timestamp | 🟢 sim | Próximo vencimento (fallback quando Asaas indisponível) |
| configuracoes | `OrgConfiguracoes` | 🟢 sim | Ver abaixo |
| configuracoes.departamentos | string[] | 🟡 opcional | Usado no heatmap para ordem canônica de departamentos; não presente no tipo `OrgConfiguracoes` declarado (LACUNA de tipo) |
| users_count | number | 🟢 sim | Contador incremental, mantido manualmente via `FieldValue.increment` |
| asaas_customer_id | string | 🟢 não | Vínculo com cliente Asaas |
| asaas_subscription_id | string \| null | 🟢 não | Vínculo com assinatura Asaas |
| ai_insights | `{items: string[], gerado_em: Timestamp}` | 🟢 não | Gerado por `generateDailyInsights` ou por `PUT /api/assistant` |

### `OrgConfiguracoes` (subobjeto)

| Campo | Tipo | Obrigatório |
|---|---|---|
| categorias | string[] | 🟢 sim |
| boas_vindas | string | 🟢 sim |
| prazo_padrao_dias | number | 🟢 sim |

---

## `units` (Enterprise — multi-site)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | ID do documento |
| org_id | string | 🟢 sim | Isolamento multi-tenant |
| nome | string | 🟢 sim | Nome da unidade |
| responsavel_id | string | 🔴 opcional | Sem uso observado em rotas analisadas |
| criado_em | Timestamp | 🟢 sim | — |

🟡 Único uso confirmado em rota: leitura de `units/{unit_id}.nome` em `POST /api/chat` para personalizar o prompt.

---

## `users`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | = UID do Firebase Auth |
| org_id | string | 🟢 sim | Isolamento multi-tenant (regra inviolável #3) |
| unit_id | string | 🔴 opcional | Presente no tipo; usado em Firestore Rules (`podeVerUnidade`) mas não manipulado nas rotas de API analisadas |
| nome | string | 🟢 sim | — |
| email | string | 🟢 sim | — |
| role | `"admin"\|"gestor"\|"auditor"` | 🟢 sim | RBAC — ver matriz de permissões no Detective |
| ativo | boolean | 🟢 sim | Flag de revogação de sessão (ver `verifySession`) |
| criado_em | Timestamp | 🟢 sim | — |

---

## `cases`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | ID do documento |
| org_id | string | 🟢 sim | Isolamento multi-tenant |
| unit_id | string | 🟢 opcional | Só presente quando informado na criação |
| protocolo | string | 🟢 sim | Formato `ETK-YYYY-XXXXXX`, único por org |
| canal_origem | `"web"\|"whatsapp"\|"app"\|"0800"` | 🟢 sim | WhatsApp/app/0800 modelados no tipo, sem endpoint de criação implementado ainda (Fases 7/8 pendentes) |
| categoria | string | 🟢 opcional | Categoria bruta (via formulário) — distinta de `triagem_ia.categoria` (via IA) |
| urgencia | 1-5 | 🟢 opcional | Urgência bruta (via formulário/chat) |
| status | `CaseStatus` (ver enum abaixo) | 🟢 sim | — |
| created_at | Timestamp | 🟢 sim | — |
| updated_at | Timestamp | 🟡 opcional | Usado em `dashboard/metrics` (`semRespostaUrgente`) mas ausente do tipo `Case` declarado — LACUNA de tipo |
| ttl | Timestamp | 🟢 sim | `created_at + 5 anos`, retenção automática |
| triagem_ia | `TriagemIA` | 🟢 opcional | Preenchido por `runTriagem` |
| coleta_ia | `{subcategoria, areas_mencionadas, ha_evidencias, recorrente, descricao_resumida}` | 🟡 opcional | Gravado só no fluxo `chat`, ausente do tipo `Case` declarado |
| triagem_manual | boolean | 🟡 opcional | Gravado quando plano é `entrada` (sem IA), ausente do tipo declarado |
| historico | `CaseHistoricoItem[]` | 🟢 sim | Log de eventos do caso (append-only via `arrayUnion` nas atualizações) |
| mencionados | string[] | 🟢 sim | UIDs bloqueados de acessar o caso (regra inviolável #4) |
| anexos | `CaseAnexo[]` | 🟢 sim | Sempre inicializado vazio na criação — anexo real é vinculado via `upload-attachment` (fluxo de associação não observado nas rotas lidas) |
| prazo | Timestamp | 🟢 opcional | Prazo de resolução, editável via PATCH |
| responsavel_id | string | 🟢 opcional | Gestor responsável |
| notas_internas | string | 🟢 opcional | Notas privadas do gestor |

### `CaseStatus` (enum)
`aguardando_triagem` | `em_apuracao` | `pendente_informacao` | `encerrado_sem_infracao` | `encerrado_com_acao`

### `TriagemIA` (subobjeto)

| Campo | Tipo | Obrigatório |
|---|---|---|
| categoria_legal | enum (11 valores, ver `code-analysis.md` §5) | 🟢 sim |
| subcategoria | string \| null | 🟢 sim |
| urgencia | 1-5 | 🟢 sim |
| lei_aplicavel | string[] | 🟢 sim |
| area_risco | string \| null | 🟢 sim |
| recomendacao | string (máx 200 chars) | 🟢 sim |
| gerado_em | Date/Timestamp | 🟢 sim |

🟡 Nota: o tipo declarado em `types/index.ts` usa `categoria`/`lei_aplicavel?: string\|string[]`, mas o valor real gravado por `runTriagem` usa `categoria_legal` — **divergência de nome de campo entre o tipo TS e o dado real gravado no Firestore**. Requer validação/harmonização.

### `CaseHistoricoItem` (subobjeto, array)

| Campo | Tipo | Obrigatório |
|---|---|---|
| acao | string | 🟢 sim |
| user_id | string | 🟢 opcional |
| timestamp | Timestamp/Date | 🟢 sim |
| detalhes | string | 🟢 opcional |

### `CaseAnexo` (subobjeto, array)

| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | string | 🟢 sim |
| tipo | string | 🟢 sim |
| tamanho | number | 🟢 sim |
| storage_path | string | 🟢 sim |

---

## `messages`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | — |
| case_id | string | 🟢 sim | FK para `cases` |
| org_id | string | 🟢 sim | Isolamento multi-tenant + validação de vínculo |
| autor | `"sistema"\|"denunciante"\|"gestor"` | 🟢 sim | — |
| texto | string | 🟢 sim | — |
| seq | number | 🟢 opcional | Ordem sequencial (usado em `assistant` para reconstituir relato); só gravado no fluxo `chat`/`cases` |
| timestamp | Timestamp | 🟢 sim | — |
| anexos | `MessageAnexo[]` | 🟢 sim | Sempre `[]` nas rotas observadas |

### `MessageAnexo` (subobjeto, array)

| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | string | 🟢 sim |
| tipo | string | 🟢 sim |
| storage_path | string | 🟢 sim |

---

## `audit_logs` (imutável — regra inviolável #5)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | — |
| org_id | string | 🟢 sim | — |
| user_id | string | 🟢 sim | UID do ator, ou `"sistema"` para eventos automáticos |
| acao | string | 🟢 sim | Catálogo de ações observadas: `user_login`, `user_logout`, `case_criado`, `case_viewed`, `case_status_changed`, `case_responsavel_changed`, `mencionado_adicionado`, `message_sent`, `ai_assistant_session`, `ai_full_access_granted`, `triagem_manual_indicada`, `triagem_ia_falhou`, `triagem_ia_concluida`, `report_generated`, `report_approved`, `report_reverted`, `report_exported`, `assinatura_cancelada`, `org_atualizada`, `user_criado`, `user_atualizado`, `upload_aceito`, `upload_rejeitado`, `org_created` (webhook), `plan_suspended`/`plan_canceled` (webhook), `report_scheduled_generated` (scheduled function) |
| case_id | string | 🟢 opcional | — |
| detalhes | `Record<string, unknown>` | 🟢 opcional | Payload livre por ação |
| timestamp | Timestamp | 🟢 sim | Sem campo `ttl` propositalmente (ver `code-analysis.md` §12) |

---

## `reports`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | — |
| org_id | string | 🟢 sim | — |
| unit_id | string | 🔴 opcional | Presente no tipo, sem uso observado |
| periodo.inicio / periodo.fim | Timestamp | 🟢 sim | — |
| gerado_em | Timestamp | 🟢 sim | — |
| texto_claude | string | 🟢 opcional | Corpo do relatório gerado por IA |
| aprovado | boolean | 🟢 sim | — |
| exportado | boolean | 🟢 sim | — |
| tipo | `"padrao"\|"personalizado"\|"esg"` | 🟢 sim | 🟡 `"esg"` presente no tipo, sem rota que o produza nas fontes lidas |
| status | `"rascunho"\|"aprovado"\|"exportado"` | 🟢 sim | Máquina de estados unidirecional |
| aprovado_por | string | 🟢 opcional | UID de quem aprovou |
| aprovado_em | Timestamp | 🟢 opcional | — |
| filtros | `Record<string, unknown>` | 🟢 opcional | Só gravado se enviado na geração |
| metricas | `{total, resolvidos, pendentes, prazoMedio, topCategorias}` | 🟢 opcional | Agregado no momento da geração, não recalculado depois |

---

## `notifications`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | — |
| org_id | string | 🟢 sim | — |
| case_id | string | 🟢 sim | — |
| protocolo | string | 🟢 sim | — |
| tipo | string (`"alerta_urgencia"` observado) | 🟢 sim | — |
| urgencia | 1-5 | 🟢 sim | — |
| categoria | string | 🟢 sim | — |
| lida | boolean | 🟢 sim | Usado em `dashboard/notifications/count` |
| created_at | Timestamp | 🟢 sim | — |

🔴 **LACUNA:** nenhuma rota de API para marcar notificação como lida foi encontrada nas fontes analisadas — só há criação (via `runTriagem`) e contagem de não lidas.

---

## `mail` (Firebase Trigger Email extension — coleção de fila, não domínio próprio)

| Campo | Tipo | Descrição |
|---|---|---|
| to | string | E-mail destinatário |
| message.subject | string | — |
| message.text / message.html | string | Corpo do e-mail |

🟡 Escrita direta na collection `mail` por `scheduledReports.ts` e `webhookAsaas.ts` — depende de extensão externa do Firebase (não confirmada nos arquivos de config lidos; **LACUNA**: `firebase.json` não lista extensions instaladas).

---

## `whatsapp_sessions` (modelado, não implementado)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | 🟢 sim | — |
| conversation_id | string | 🟢 sim | **SHA-256 do número de telefone** — regra inviolável #2. Nunca o número em texto puro |
| org_id | string | 🟢 sim | — |
| unit_id | string | 🟢 opcional | — |
| case_id | string | 🟢 opcional | — |
| status | `"iniciada"\|"coletando"\|"aguardando_confirmacao"\|"encerrada"` | 🟢 sim | — |
| historico_ia | array de `{role, content, timestamp}` | 🟢 sim | — |
| created_at | Timestamp | 🟢 sim | — |

🔴 **LACUNA confirmada:** tipo totalmente modelado em `src/lib/types/index.ts`, porém **nenhum endpoint, Function ou arquivo de integração WhatsApp foi encontrado** no código-fonte. Condizente com `AGENTS.md` (“Fase 7 — WhatsApp: pendente”).

---

## Divergências tipo↔dado observadas (requerem validação humana)

| # | Divergência | Local |
|---|---|---|
| 1 | `TriagemIA.categoria` (tipo) vs `categoria_legal` (dado real gravado) | `src/lib/types/index.ts:82` vs `src/lib/triagem.ts:184-186` |
| 2 | `Case.updated_at` usado em runtime, ausente do tipo | `src/app/api/dashboard/metrics/route.ts:77` vs `src/lib/types/index.ts:105-124` |
| 3 | `Case.coleta_ia` e `Case.triagem_manual` gravados, ausentes do tipo | `src/app/api/chat/route.ts:100-106`, `src/lib/triagem.ts:151` |
| 4 | `Org.plano_ativo` inclui `"suspenso"`/`"cancelado"` em runtime, tipo `Plano` só tem 3 valores | `src/lib/types/index.ts:9` vs uso em `billing/cancel`, `webhookAsaas.ts` |
| 5 | `OrgConfiguracoes.departamentos` usado (`dashboard/heatmap`), ausente do tipo `OrgConfiguracoes` | `src/lib/types/index.ts:25-29` vs `src/app/api/dashboard/heatmap/route.ts:24` |
