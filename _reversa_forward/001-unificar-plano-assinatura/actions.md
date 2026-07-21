# Actions: Unificação para plano único de assinatura

> Identificador: `001-unificar-plano-assinatura`
> Data: `2026-07-21`
> Roadmap: `_reversa_forward/001-unificar-plano-assinatura/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 20 |
| Paralelizáveis (`[//]`) | 14 |
| Maior cadeia de dependência | 4 (T001 → T002 → T014 → T020) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Definir o identificador do plano único (sugestão `"padrao"`, D-01) e atualizar a união de tipos `Plano` em `src/lib/types/index.ts` para incluir o novo valor + `enterprise`/`suspenso`/`cancelado` | - | `[//]` | `src/lib/types/index.ts` | 🟡 | `[ ]` |
| T002 | Consolidar `PLANOS_CONFIG` (`src/lib/asaas/createPaymentLink.ts`) e `PLANOS` (`src/lib/planos.ts`) numa única fonte de preço/config do plano único (RF-06, D-04) | T001 | - | `src/lib/planos.ts` | 🟢 | `[ ]` |
| T003 | Criar o script de migração one-shot `scripts/migrate-plano-unico.ts` (esqueleto: query `orgs` com `plano_ativo in ["entrada","gestao"]`, sem lógica de update ainda) | T001 | `[//]` | `scripts/migrate-plano-unico.ts` | 🟡 | `[ ]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Atualizar `scripts/test-rules.ts` com cenário cobrindo `getPlanoLimit` retornando o limite único para o novo identificador de plano | T001 | `[//]` | `scripts/test-rules.ts` | 🟡 | `[ ]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Remover o gate `session.plano === "entrada"` em `POST /api/assistant` | T001 | `[//]` | `src/app/api/assistant/route.ts` | 🟢 | `[ ]` |
| T006 | Remover o ramo `plano === "entrada"` (mensagem fixa de upgrade) em `GET /api/dashboard/insights` | T001 | `[//]` | `src/app/api/dashboard/insights/route.ts` | 🟢 | `[ ]` |
| T007 | Remover o early-return `planoAtivo === "entrada"` (triagem manual forçada) em `runTriagem` | T001 | `[//]` | `src/lib/triagem.ts` | 🟢 | `[ ]` |
| T008 | Remover a checagem `tipo === "personalizado" && plano === "entrada"` em `POST /api/reports/generate` | T001 | `[//]` | `src/app/api/reports/generate/route.ts` | 🟢 | `[ ]` |
| T009 | Colapsar `PLAN_USER_LIMITS` para valor único (10) em `dashboard/users` (GET/POST) | T001 | `[//]` | `src/app/api/dashboard/users/route.ts` | 🟡 | `[ ]` |
| T010 | Colapsar `STORAGE_LIMITS_BYTES` para valor único (20GB) em `upload-attachment` | T001 | `[//]` | `src/app/api/upload-attachment/route.ts` | 🟡 | `[ ]` |
| T011 | Atualizar `getPlanoLimit` em `firestore.rules` para retornar 10 para qualquer `plano_ativo` diferente de `enterprise` (D-06) | T001 | `[//]` | `firestore.rules` | 🟡 | `[ ]` |
| T012 | Remover `VALUE_TO_PLANO` em `getSubscription.ts` — assinatura confirmada sempre resolve para o identificador único | T001 | `[//]` | `src/lib/asaas/getSubscription.ts` | 🟢 | `[ ]` |
| T013 | Remover `determinarPlano` em `webhookAsaas.ts` — `provisionOrg` sempre usa o identificador único | T001 | `[//]` | `functions/src/webhookAsaas.ts` | 🟢 | `[ ]` |
| T014 | Atualizar `isPlanoValido` em `POST /api/checkout/create` para aceitar apenas o novo identificador (rejeitar `"entrada"`/`"gestao"` com 400) | T002 | - | `src/app/api/checkout/create/route.ts` | 🟢 | `[ ]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T015 | Implementar a lógica de migração no script (`update plano_ativo` + `audit_logs.add` com `acao: "plano_migrado"`) | T001, T003 | - | `scripts/migrate-plano-unico.ts` | 🟡 | `[ ]` |
| T016 | Atualizar a página pública `/planos` (e componente `PlanoCard`) para exibir a oferta única, com Enterprise listado à parte conforme RN-09 | T002 | - | `src/app/planos/` | 🟡 | `[ ]` |
| T017 | Verificar que o valor cobrado (T012/T013, via Asaas) bate com o valor exibido (T002) após a consolidação — ajustar se houver divergência residual | T002, T012, T013 | - | `src/lib/asaas/*.ts` | 🟡 | `[ ]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T018 | Atualizar `docs/PRD_PortalSigilo_v2.md` §3 (tabela "Planos e limites por tenant") para refletir o plano único | T002 | `[//]` | `docs/PRD_PortalSigilo_v2.md` | 🟢 | `[ ]` |
| T019 | Revisar `docs/SECURITY.md` em busca de menção explícita a `entrada`/`gestao` e atualizar se necessário | - | `[//]` | `docs/SECURITY.md` | 🟡 | `[ ]` |
| T020 | Executar `onboarding.md` passo a passo em ambiente local (incluindo rodar T015 duas vezes para confirmar idempotência) e registrar o resultado em "Notas de execução" abaixo | T005, T006, T007, T008, T009, T010, T011, T014, T015, T016, T017 | - | n/a (validação manual) | 🟢 | `[ ]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-to-do` | reversa |
