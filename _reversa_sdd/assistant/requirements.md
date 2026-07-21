# Assistant

> Especificação gerada pelo Writer em 2026-07-20. Fonte: `_reversa_sdd/code-analysis.md` §1, `.reversa/context/modules.json`.

## Visão Geral
Assistente de IA (Claude) que orienta gestores de compliance dentro de um caso específico, com acesso opcional e auditado ao relato completo. Também expõe um endpoint interno para atualização de insights gerados por job agendado. 🟢

## Responsabilidades
- Responder perguntas de compliance contextualizadas ao caso (categoria, urgência, leis aplicáveis, prazo) 🟢
- Streamar a resposta do Claude em tempo real (SSE) 🟢
- Conceder e auditar acesso ao relato completo somente quando explicitamente solicitado 🟢
- Atualizar `orgs.ai_insights` a partir de chamada interna autenticada (role admin) 🟢

## Regras de Negócio
- Plano `entrada` não tem acesso ao assistente (`403 feature_not_available`) 🟢
- Plano `suspenso`/`cancelado` bloqueia o assistente (`403 plan_suspended`) 🟢
- Gestor mencionado no caso (`case.mencionados[]`) não pode usar o assistente sobre ele, mesmo sendo admin 🟢
- Acesso ao relato completo é opt-in (`includeFullReport`) e gera audit log próprio (`ai_full_access_granted`) antes de montar o prompt 🟢
- `PUT` (atualização de insights) exige `role === "admin"` — não há bloqueio explícito de `role === "auditor"` no `POST` (usar o assistente), diferente de outras rotas de IA do sistema (`reports/generate`) 🔴 comportamento pode ser lacuna de segurança, requer validação humana (ver `_reversa_sdd/permissions.md`)

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Autenticar via cookie de sessão antes de qualquer processamento | Must | Requisição sem cookie válido retorna 401 |
| RF-02 | Bloquear uso por plano incompatível | Must | Plano `entrada`/`suspenso`/`cancelado` retorna 403 com código de erro específico |
| RF-03 | Validar que o caso pertence à org da sessão | Must | `case.org_id !== session.orgId` retorna 403 |
| RF-04 | Bloquear gestor mencionado no caso | Must | `session.uid` em `case.mencionados[]` retorna 403 |
| RF-05 | Montar contexto do caso (categoria, urgência, leis, dias em aberto) para o prompt | Must | Prompt inclui todos os campos, com defaults quando ausentes |
| RF-06 | Conceder acesso ao relato completo apenas quando `includeFullReport===true`, com audit log prévio | Must | Log `ai_full_access_granted` gravado antes da chamada ao Claude |
| RF-07 | Streamar resposta via SSE token a token | Must | Cliente recebe eventos `token`/`done`/`error` |
| RF-08 | Atualizar `ai_insights` da org via PUT restrito a admin | Should | Role diferente de admin retorna 403 |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Chave Anthropic nunca client-side (`server-only`) | `src/app/api/assistant/route.ts:1` | 🟢 |
| Segurança | Autenticação obrigatória via cookie de sessão | `src/app/api/assistant/route.ts:49-57` | 🟢 |
| Disponibilidade | Erro no stream Claude emite evento `error` sem derrubar a conexão HTTP | `src/app/api/assistant/route.ts:169-174` | 🟢 |
| Auditabilidade | Toda sessão de uso do assistente gera audit log (`ai_assistant_session`) | `src/app/api/assistant/route.ts:135-141` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um gestor autenticado com plano gestao e não mencionado no caso
Quando ele envia POST /api/assistant com caseId e messages válidos
Então recebe um stream SSE com tokens da resposta do Claude, seguido de "done"

Dado um gestor com plano entrada
Quando ele envia POST /api/assistant
Então recebe 403 com error "feature_not_available"

Dado um gestor mencionado no caso (case.mencionados contém seu uid)
Quando ele envia POST /api/assistant para esse caseId
Então recebe 403 "Você foi identificado como parte neste caso."
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Autenticação e gate de plano | Must | Caminho crítico, protege receita e segurança |
| Bloqueio de mencionado | Must | Regra de negócio sem fallback (S5) |
| Streaming SSE | Must | Única forma de entrega da resposta implementada |
| PUT de insights | Should | Uso interno, baixa frequência, não afeta o usuário final diretamente |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/assistant/route.ts` | `POST`, `PUT`, `buildSystemPrompt` | 🟢 |
| `src/lib/utils/auth.ts` | `verifySession` | 🟢 |
| `src/lib/utils/audit.ts` | `logAudit` | 🟢 |
