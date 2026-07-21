# Matriz de Permissões (RBAC) — portal-sigilo

> Gerado pelo Detective em 2026-07-20, a partir de `firestore.rules` + checagens redundantes em `src/app/api/*`.
> Escala de confiança das afirmações em prosa: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
>
> **[Revisão]** Nota de leitura sobre a Matriz por recurso: dentro das células da tabela, 🟢/🔴 são reaproveitados como valor de acesso (sim/não permitido), não como confiança da afirmação — o próprio dado "permitido/negado" já vem 🟢 confirmado em `firestore.rules` ou no código da rota citada. Os únicos 🔴 que representam de fato uma LACUNA de conhecimento (não um "não permitido") são os marcados explicitamente como tal no texto corrido da seção "Achados de auditoria de permissões" abaixo.

## Papéis (roles)

🟢 3 roles de gestor (`src/lib/types/index.ts` → `Role`): `admin`, `gestor`, `auditor`. Denunciante **não é um role** — não tem conta, acesso é anônimo via protocolo.

## Regra transversal a todos os roles: bloqueio de mencionados (S5)

🟢 Independente do role, se `request.auth.uid` está em `case.mencionados[]`, o acesso àquele caso específico é negado — inclusive para `admin`. Esta é a única regra que **sobrepõe** hierarquia de role.

## Regra transversal: isolamento por org e por unit

🟢 Todo acesso exige `users/{uid}.org_id == documento.org_id` e `users/{uid}.ativo == true` (`isGestorDaOrg`). Gestor com `unit_id` preenchido só vê casos com o mesmo `unit_id` (`podeVerUnidade`); gestor sem `unit_id` (ou `unit_id` vazio) vê todos os casos da org — ou seja, `unit_id` ausente = escopo de org inteira, não escopo vazio.

## Matriz por recurso

| Recurso | `admin` | `gestor` | `auditor` | Denunciante (sem conta) |
|---|---|---|---|---|
| **orgs** (ler) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **orgs** (atualizar) | 🟢 sim | 🔴 não | 🔴 não | — |
| **orgs** (criar/excluir) | 🔴 nunca (só Admin SDK/webhook) | — | — | — |
| **units** (ler) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **units** (criar/atualizar) | 🟢 sim | 🔴 não | 🔴 não | — |
| **units** (excluir) | 🔴 nunca (hardcoded `false`) | — | — | — |
| **users** (ler próprio doc) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **users** (ler outros da org) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **users** (criar) | 🟢 sim (respeita limite de plano) | 🔴 não | 🔴 não | — |
| **users** (atualizar role/ativo de outro) | 🟢 sim | 🔴 não | 🔴 não | — |
| **users** (atualizar próprio nome) | 🟢 sim | 🟢 sim (só campo `nome`) | 🟢 sim (só campo `nome`) | — |
| **users** (excluir) | 🔴 nunca (hardcoded `false` — desativação via `ativo=false`) | — | — | — |
| **cases** (ler, exceto mencionado) | 🟢 sim | 🟢 sim | 🟢 sim | 🟢 só via protocolo, campos limitados (`track`) |
| **cases** (atualizar status/responsável/notas/prazo) | 🟢 sim | 🟢 sim | 🔴 **não** (`isGestorOuAdmin` exclui auditor) | — |
| **cases** (adicionar mencionado) | 🟢 sim | 🟢 sim | 🔴 não (checado em código: `role !== admin && role !== gestor` → 403) | — |
| **cases** (criar) | 🔴 nunca via client (só Admin SDK) | — | — | 🟡 indiretamente, via `/api/cases`, `/api/chat` (endpoints públicos sem auth) |
| **cases** (excluir) | 🔴 nunca | 🔴 nunca | 🔴 nunca | — |
| **messages** (ler, exceto se caso mencionado) | 🟢 sim | 🟢 sim | 🟢 sim | 🟢 via `/api/messages` (público, valida vínculo case↔org) |
| **messages** (criar como gestor) | 🟢 sim | 🟢 sim | 🟡 Rule permite (`isGestorOuAdmin` inclui só admin/gestor — **auditor não está no `isGestorOuAdmin`**, logo bloqueado) | — |
| **messages** (criar como denunciante) | — | — | — | 🟢 via `/api/messages` POST (Admin SDK, sem Rule aplicável) |
| **audit_logs** (ler) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **audit_logs** (criar) | 🟢 sim (qualquer autenticado da própria org) | 🟢 sim | 🟢 sim | — |
| **audit_logs** (atualizar/excluir) | 🔴 **NUNCA, para ninguém** (regra S6, hardcoded `false`) | 🔴 nunca | 🔴 nunca | — |
| **reports** (ler) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **reports** (gerar) | 🟢 sim | 🟢 sim | 🔴 **não** (bloqueado em código: `role === "auditor"` → 403) |
| **reports** (aprovar) | 🟢 sim | 🟢 sim (checado em código: só bloqueia `auditor`) | 🔴 não | — |
| **reports** (reverter para rascunho) | 🟢 sim (checado em código: só `admin`) | 🔴 não | 🔴 não | — |
| **reports** (exportar PDF) | 🟢 sim | 🟢 sim | 🔴 não | — |
| **billing** (info/subscription/invoices/cancelar) | 🟢 sim (todas as rotas checam `role === "admin"`) | 🔴 não | 🔴 não | — |
| **dashboard/org** (ler) | 🟢 sim | 🟢 sim | 🟢 sim | — |
| **dashboard/org** (atualizar) | 🟢 sim | 🔴 não | 🔴 não | — |
| **assistant** (usar, se plano permitir) | 🟢 sim | 🟢 sim | 🟡 **não explicitamente bloqueado no código** — Rule não se aplica (rota usa Admin SDK); só o gate de mencionado/plano é checado | — |
| **assistant** PUT (atualizar insights) | 🟢 sim (única checagem: `role === "admin"`) | 🔴 não | 🔴 não | — |
| **whatsapp_sessions** (qualquer acesso via client) | 🔴 nunca, para ninguém (hardcoded `false` — só Admin SDK) | 🔴 nunca | 🔴 nunca | — |

## Achados de auditoria de permissões (divergências e riscos)

🟡 **`auditor` tem escopo predominantemente somente-leitura**, mas isso é resultado de checagens **pontuais em cada Route Handler**, não de uma regra central — a Firestore Rule `isGestorDaOrg` (usada para `read`) inclui todos os 3 roles igualmente; é o código de cada rota que decide se `auditor` pode escrever. Rotas que **esqueceram** de bloquear auditor explicitamente teriam, por padrão, o mesmo acesso de escrita que `gestor` (já que a Firestore Rule para `create`/`update` costuma usar `isGestorOuAdmin`, que também **não exclui** só por não ser `admin` — ela inclui `gestor` E checa role in `['admin','gestor']`, então tecnicamente `auditor` já é excluído nesse nível pela Rule). 🔴 **Risco identificado**: no endpoint `POST /api/assistant`, não há checagem explícita de `role !== "auditor"` no código do Route Handler — diferente de `reports/generate`, `reports/approve` e `cases/[caseId]/mencionados`, que bloqueiam auditor de forma explícita e redundante à Rule. Como o Route Handler usa Admin SDK (bypassa Rules), **um usuário `auditor` pode conseguir usar o assistente de IA**, o que pode não ser a intenção de produto (auditor tende a ser leitura-apenas no restante do sistema). Requer validação humana.

🟢 **Mencionado sempre vence hierarquia** — mesmo `admin` perde acesso a um caso onde está listado em `mencionados[]`. Esta é a única regra com precedência sobre role.

🟡 **`unit_id` como filtro opcional-mas-restritivo**: a lógica em `podeVerUnidade` significa que só faz sentido usar `unit_id` em Enterprise; em `entrada`/`gestao` (sem unidades), todo gestor tem `unit_id` vazio/nulo e portanto enxerga toda a org — coerente com o PRD (multi-unidade é feature Enterprise-only).
