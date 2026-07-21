# Análise de Código — portal-sigilo

> Gerado pelo Archaeologist em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
> Dados estruturados completos em `.reversa/context/modules.json`.
> Organização das specs escolhida: **endpoint** (ver `.reversa/config.toml`).

## Visão consolidada

12 unidades analisadas: 11 endpoints de negócio (`src/app/api/*`) + 1 camada transversal (`cross-cutting`: `src/lib`, `src/middleware.ts`, `functions/src`).

| Módulo | Complexidade | Rotas | Dependências externas |
|---|---|---|---|
| assistant | média | 2 (POST, PUT) | Anthropic |
| auth | baixa | 3 | Firebase Auth |
| billing | média | 4 | Asaas |
| cases | média | 3 | — |
| chat | 🔴 **alta** | 1 (POST, streaming) | Anthropic |
| checkout | baixa | 1 | Asaas |
| dashboard | 🔴 **alta** | 12 | — |
| messages | baixa | 2 | — |
| orgs | baixa | 1 | — |
| reports | 🔴 **alta** | 4 | Anthropic, pdf-lib |
| upload-attachment | média | 1 | Firebase Storage, file-type |
| cross-cutting | alta | — (infra) | Firebase Admin/Client, Anthropic, Asaas |

---

## 1. assistant — `src/app/api/assistant`

🟢 Assistente de compliance para gestores dentro de um caso específico, com streaming SSE de resposta Claude.

**Fluxo de controle (`POST`):**
1. Valida cookie de sessão → `verifySession`
2. Gate por plano: `entrada` → 403 `feature_not_available`; `suspenso`/`cancelado` → 403 `plan_suspended`
3. Valida `caseId` + `messages` no corpo
4. Carrega o caso, valida `org_id` do caso == `org_id` da sessão (isolamento multi-tenant)
5. Bloqueia se `session.uid` está em `caseData.mencionados` (regra S5)
6. Monta `systemPrompt` com contexto do caso (categoria, urgência, leis, dias em aberto)
7. Se `includeFullReport`: busca todas as `messages` do caso (ordenadas por `seq`) e injeta o relato completo no prompt — gera audit log `ai_full_access_granted` **antes** de montar o prompt
8. Grava audit log `ai_assistant_session`
9. Abre `ReadableStream`, chama `anthropic.messages.stream`, repassa tokens via SSE (`event: token`), emite `done` ou `error`

**`PUT`** (endpoint interno, não exposto ao browser): restrito a `role === "admin"`, atualiza `orgs/{orgId}.ai_insights.items` (usado pela scheduled function `generateDailyInsights`).

🟡 **Nota:** o modelo hardcoded em `assistant` (`claude-sonnet-4-20250514`) difere do usado em `chat`/`triagem` (`claude-sonnet-4-6`) — possível drift de versão de modelo entre endpoints, requer validação.

---

## 2. auth — `src/app/api/auth`

🟢 Login/logout via Firebase session cookie (5 dias) + leitura de sessão atual.

- `POST /login`: troca `idToken` (client SDK) por session cookie `HttpOnly/Secure/SameSite=Strict`; loga `user_login` (falha de audit não bloqueia login)
- `POST /logout`: revoga refresh tokens do usuário e limpa cookie (mesmo em erro)
- `GET /me`: retorna `SessionUser` da sessão atual
- `verifySession` (`src/lib/utils/auth.ts`): decodifica cookie sem checar revogação de rede (`checkRevoked=false`) e usa `users/{uid}.ativo === true` como mecanismo de revogação — evita round-trip ao Firebase em toda request, mas implica que desativar um usuário (`ativo=false`) é o único jeito de invalidar sessões ativas antes da expiração dos 5 dias.

---

## 3. billing — `src/app/api/billing`

🟢 Assinatura/cobrança via Asaas, com fallback para dados locais quando a API externa falha.

- `GET /info`: dados básicos do plano direto do Firestore (`orgs.plano_ativo`, `data_renovacao`)
- `GET /subscription`: busca assinatura ativa na Asaas por `asaas_customer_id`; se não houver customer ou a chamada falhar, cai em `firestoreFallback()` com `source: "firestore"`
- `GET /invoices`: últimas 5 faturas via Asaas
- `DELETE /cancel`: cancela assinatura na Asaas, marca `plano_ativo: "cancelado"` no Firestore, loga `assinatura_cancelada`

Todas exigem `role === "admin"`. 🟡 Mapeamento `VALUE_TO_PLANO` (valor cobrado → id do plano) é hardcoded e frágil a mudanças de preço — se o preço mudar sem atualizar essa tabela, `getSubscription` classifica o plano errado (fallback para `"gestao"` quando valor não bate).

---

## 4. cases — `src/app/api/cases`

🟢 Criação de caso via formulário estruturado (canal alternativo ao chatbot) + consulta pública de status.

- `POST /cases`: cria caso + mensagens iniciais + audit log em uma única transação (`batch`)
- `GET /resolve`: busca org pelo protocolo (usado para redirecionar cross-org)
- `GET /track`: consulta pública de status por protocolo — **nunca revela existência** em not-found, **nunca retorna o texto do relato**, apenas `status` e `historico`
- `generateProtocol` (`src/lib/utils/protocol.ts`): formato `ETK-YYYY-XXXXXX`, alfabeto sem caracteres ambíguos (`I/O/0/1`), até 3 tentativas verificando colisão via query Firestore

---

## 5. chat — `src/app/api/chat` 🔴 complexidade alta

🟢 Núcleo do produto: chatbot Claude de escuta ativa que conduz a coleta do relato, decide quando está completo, cria o caso e dispara a triagem automática.

**Fluxo de controle:**
1. Valida `org_id` + `messages`; carrega nome da org (e unidade, se houver)
2. Monta `systemPrompt` com regras de conduta rígidas: nunca pedir dados identificáveis, vocabulário controlado ("contar"/"falar", nunca "denunciar"), estilo de escrita específico, limite de 6 trocas
3. Abre stream Claude; acumula tokens em buffer (`accumulated`) e só emite ao cliente enquanto **não** detecta `<CASE_COMPLETE>` no buffer
4. Ao detectar a tag completa, faz parse do JSON interno (`CasePayload`), cria o caso (`createCase`) e dispara `runTriagem` — a triagem roda **depois** do `case_created` ser emitido ao cliente, mas antes do stream fechar
5. Emite `error` se o parse do payload falhar, sem interromper o registro do caso já tentado

**`runTriagem` (`src/lib/triagem.ts`) — algoritmo de triagem por IA:**
- Plano `entrada`: pula IA, marca `triagem_manual: true`
- Chama Claude (até 2 tentativas) pedindo JSON estrito de classificação (categoria legal, urgência 1-5, leis aplicáveis, área de risco, recomendação)
- `validateTriagem`: whitelist rígida de `categoria_legal` e `lei_aplicavel`, valida `urgencia` como inteiro 1-5, trunca `recomendacao` a 200 caracteres — parse ou validação falha ⇒ `triagem` é `null`
- Falha após 2 tentativas: marca `needs_manual_review: true`
- Sucesso com `urgencia >= 4`: cria documento em `notifications`
- Todo caminho grava audit log específico (`triagem_manual_indicada` / `triagem_ia_falhou` / `triagem_ia_concluida`)

🟡 **Ponto de atenção:** o parse de `<CASE_COMPLETE>` via regex sobre o buffer acumulado assume que a tag e o JSON chegam de forma bem formada num único ciclo de deltas; um JSON malformado pelo modelo é capturado pelo try/catch mas o caso **não é criado** e o denunciante recebe apenas uma mensagem de erro genérica — não há retry automático de criação de caso.

---

## 6. checkout — `src/app/api/checkout`

🟢 Criação de link de pagamento Asaas para plano `entrada`/`gestao`, ciclo `mensal`/`anual` (default mensal). Preços fixos em `PLANOS_CONFIG` (`src/lib/asaas/createPaymentLink.ts`), tratamento de erro diferenciado por causa (API key ausente → 503, falha Asaas → 502, inesperado → 500).

---

## 7. dashboard — `src/app/api/dashboard` 🔴 complexidade alta (12 rotas)

🟢 Núcleo do painel do gestor.

**Casos:**
- `GET /cases`: lista paginada (máx 50/página) com filtros (status, urgência, canal, protocolo, datas), ordenação (created_at/urgencia/prazo) — filtro de urgência aplicado **em memória** (evita índice composto), exclusão de `mencionados` também em memória
- `GET/PATCH /cases/[caseId]`: detalhe (com audit log `case_viewed`) e atualização parcial (status, responsável, notas, prazo) — cada mudança de campo relevante gera item em `historico` (arrayUnion) e audit log próprio
- `POST /cases/[caseId]/mencionados`: adiciona mencionado, exige `admin`/`gestor`, valida usuário da mesma org
- `GET/POST /cases/[caseId]/messages`: histórico de mensagens do caso e envio de mensagem do gestor (`autor: "gestor"`)
- `GET /cases/[caseId]/audit`: últimos 20 audit logs do caso

**Métricas e insights:**
- `GET /metrics`: `computeStats` calcula total, em apuração, resolvidos, prazo médio, distribuição por urgência/canal, e `semRespostaUrgente` (urgência≥4, aberto, sem atualização há 48h); compara período atual vs anterior (trend up/down/stable)
- `GET /heatmap`: matriz departamento × categoria a partir de `triagem_ia.area_risco`/`categoria`, cruzada com departamentos configurados na org
- `GET /insights`: gate por plano (`entrada` → mensagem fixa de upgrade); senão usa `ai_insights` pré-gerado por scheduled function, ou fallback heurístico local (identifica departamento/categoria dominante e monta texto condicional)

**Administração:**
- `GET/PATCH /org`: dados da org e configurações (merge por chave), restrito a `admin` no PATCH
- `GET/POST /users`: lista usuários da org; criação valida limite de usuários por plano (`PLAN_USER_LIMITS`: entrada=1, gestão=10, enterprise=∞) — checado no servidor porque o Admin SDK **ignora** Firestore Rules
- `PATCH /users/[userId]`: altera role/ativo; ajusta `users_count` via `FieldValue.increment` só quando o valor de `ativo` realmente muda
- `GET /notifications/count`: contagem de notificações não lidas

Todas as rotas aplicam a regra S5 (exclusão de `mencionados`) e S3/S4 (filtro por `org_id`) de forma consistente, mas **repetida individualmente em cada rota** (sem middleware/helper único de "case access check" — exceto em `cases/[caseId]/messages/route.ts`, que tem `checkCaseAccess` local).

---

## 8. messages — `src/app/api/messages`

🟢 Mensagens do denunciante no portal público (distinto de `dashboard/cases/[caseId]/messages`, que é a via do gestor). `POST` valida vínculo `case_id`↔`org_id` antes de gravar. 🟡 Endpoint não chama `verifySession` — coerente com ser parte do fluxo público do denunciante, não do dashboard autenticado.

---

## 9. orgs — `src/app/api/orgs`

🟢 Busca de organizações por nome, sem autenticação (usado no fluxo de onboarding/seleção). 🟡 Implementação **não escala**: busca até 100 orgs ordenadas por `nome_lower` e filtra em memória por `includes()` — funcional para poucos tenants, mas não é uma solução de busca real (Firestore não tem full-text nativo).

---

## 10. reports — `src/app/api/reports` 🔴 complexidade alta

🟢 Relatório executivo gerado por Claude a partir de dados agregados (nunca conteúdo individual de relato), com fluxo de estado `rascunho → aprovado → exportado`.

- `POST /generate`: agrega métricas do período (categorias, leis, resolvidos/pendentes, prazo médio, top-5), monta prompt textual e pede a Claude um relatório em 4 partes (sumário, tendências, alertas legais, recomendações) — bloqueado para `auditor` e planos suspenso/cancelado; tipo `personalizado` exige plano ≥ gestão
- `GET /generate`: lista relatórios da org (últimos 50)
- `GET /[reportId]`: detalhe, valida `org_id`
- `POST/DELETE /[reportId]/approve`: aprova (bloqueia auditor, idempotência via 409 se já aprovado/exportado) / reverte para rascunho (somente `admin`)
- `GET /[reportId]/export`: só permite export se `status === "aprovado"`; gera PDF via `pdf-lib` (layout A4 com paginação manual, header/footer fixos, quebra de linha por largura de fonte) e transiciona `status → "exportado"`

Este é o único fluxo com **máquina de estados explícita** e transições auditadas em cada passo (`report_generated`, `report_approved`, `report_reverted`, `report_exported`).

---

## 11. upload-attachment — `src/app/api/upload-attachment`

🟢 Upload de anexos com validação server-side rígida (regra inviolável S7): tipo mime real detectado por assinatura binária (`file-type`), nunca pelo `Content-Type` do client. Whitelist de 9 mime types, limite de 50 MB por arquivo, limite de armazenamento por plano (2GB/20GB/ilimitado) checado antes do upload — falha ao calcular uso vira *graceful degradation* (permite o upload). Nome de arquivo sempre gerado (`uuid.ext`), nunca o nome original. Uploads aceitos e rejeitados geram audit log.

---

## 12. cross-cutting — `src/lib`, `src/middleware.ts`, `functions/src`

🟢 Camadas usadas por todos os endpoints:

- **`env.ts`**: `requireEnv` lança erro em boot se variável obrigatória ausente; centraliza `ANTHROPIC_API_KEY`, credenciais Firebase Admin, `ASAAS_API_KEY`/`ASAAS_BASE_URL` (regra inviolável S1 — chave Anthropic nunca client-side)
- **`firebase-admin/admin.ts`** / **`firebase/client.ts`**: inicialização idempotente (`admin.apps.length > 0` / `getApps().length > 0`) do SDK admin e client
- **`utils/audit.ts`**: `logAudit` nunca lança para o chamador — falha vira apenas `console.error`, garantindo que auditoria nunca derruba o fluxo principal
- **`middleware.ts`**: protege `/app/:path*` exigindo cookie `__session`, exceto `/app/login` — é um gate de presença de cookie, não de validade (a validade é checada em cada Route Handler via `verifySession`)
- **`types/index.ts`**: modelo de domínio completo (`Org`, `Unit`, `User`, `Case`, `Message`, `AuditLog`, `Report`, `WhatsappSession`) — `WhatsappSession` já modelado com `conversation_id` como SHA-256 (regra S2), mas o módulo de WhatsApp em si (Fase 7) ainda não tem endpoints implementados
- **`functions/src/index.ts`**: registra 3 Cloud Functions: `generateDailyInsights`, `generateMonthlyReports`, `webhookAsaas`, todas na região `southamerica-east1`
- **`aiInsights.ts`** (scheduled, 07h BRT diário): gera até 3 insights por IA para orgs `gestao`/`enterprise` com casos dos últimos 7 dias, grava em `orgs.ai_insights`
- **`scheduledReports.ts`** (scheduled, dia 1 06h BRT mensal): gera relatório completo do mês anterior por org elegível, grava em `reports`, envia e-mail ao admin via collection `mail` (Firebase Trigger Email extension)
- **`webhookAsaas.ts`**: valida token do webhook com `crypto.timingSafeEqual` (proteção contra timing attack); `provisionOrg` é idempotente (checa `asaas_customer_id` existente) e usa sufixo hex aleatório no slug para evitar colisão/TOCTOU; trata `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` (provisiona), `PAYMENT_OVERDUE` (suspende), `SUBSCRIPTION_CANCELED`/`SUBSCRIPTION_INACTIVATED` (cancela)

🟡 **Drift de dependências entre app e functions** (ver `_reversa_sdd/dependencies.md`): `firebase-admin` e `@anthropic-ai/sdk` estão em versões diferentes entre a raiz e `functions/`, e o modelo Claude hardcoded varia entre chamadas (`claude-sonnet-4-20250514` vs `claude-sonnet-4-6`) — não há uma constante central de modelo.

---

## Dicionário de dados

Ver `_reversa_sdd/data-dictionary.md` para o dicionário completo de entidades e campos (doc_level completo).

## Fluxogramas

Ver `_reversa_sdd/flowcharts/*.md` — um por módulo, em Mermaid (doc_level completo).
