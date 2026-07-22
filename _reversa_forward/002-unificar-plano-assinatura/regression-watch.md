# Regression Watch: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Legacy Impact: `_reversa_forward/002-unificar-plano-assinatura/legacy-impact.md`

## Watch items

| ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------|----------------------------|---------------------|-------------------|
| W001 | `legacy-impact.md` § "Plano e tipos de domínio" | `Plano = "unico" \| "suspenso" \| "cancelado"` em `src/lib/types/index.ts` | `presença` | Tipo `Plano` contendo `"entrada"`, `"gestao"` ou `"enterprise"` |
| W002 | `legacy-impact.md` § "Gates de feature" | Nenhuma rota de API (assistant, insights, triagem, reports/generate) contém gate por `plano !== "entrada"` | `ausência` | `plano === "entrada"` ou `planoAtivo === "entrada"` em qualquer Route Handler |
| W003 | `legacy-impact.md` § "Cobrança" | `createPaymentLink` usa `chargeType: "INSTALLMENT"`, não `"RECURRENT"` | `presença` | `chargeType: "RECURRENT"` em `src/lib/asaas/createPaymentLink.ts` |
| W004 | `legacy-impact.md` § "Cobrança" | `cancelSubscription.ts` não existe | `ausência` | Arquivo `src/lib/asaas/cancelSubscription.ts` presente no projeto |
| W005 | `legacy-impact.md` § "Cobrança" | `getSubscription` não consulta `/v3/subscriptions` | `ausência` | String `/v3/subscriptions` em `src/lib/asaas/getSubscription.ts` |
| W006 | `legacy-impact.md` § "Limites" | `getPlanoLimit` retorna 50 para qualquer `plano_ativo` não suspenso/cancelado | `presença` | `getPlanoLimit` contendo `'entrada'`, `'gestao'` ou `'enterprise'` |
| W007 | `legacy-impact.md` § "Limites" | `PLAN_USER_LIMITS` contém apenas chave `"unico": 50` | `presença` | `PLAN_USER_LIMITS` com chaves `entrada`, `gestao` ou `enterprise` |
| W008 | `legacy-impact.md` § "Limites" | `STORAGE_LIMITS_BYTES` contém apenas chave `"unico": 2GB` | `presença` | `STORAGE_LIMITS_BYTES` com chaves `entrada`, `gestao` ou `enterprise` |
| W009 | `legacy-impact.md` § "Functions agendadas" | Filtro `plano_ativo == "unico"` em `aiInsights.ts` e `scheduledReports.ts` | `presença` | `plano_ativo in ["gestao","enterprise"]` nos dois arquivos |
| W010 | `legacy-impact.md` § "Cobrança" | Webhook Asaas não contém função `determinarPlano` | `ausência` | Função `determinarPlano` em `functions/src/webhookAsaas.ts` |
| W011 | `legacy-impact.md` § "Cobrança" | `provisionOrg` atribui `plano_ativo: "unico"` para toda org nova | `presença` | `determinarPlano(payload)` em `provisionOrg` |
| W012 | `legacy-impact.md` § "UI" | `Badge.tsx` não contém `PlanValue`, `PLAN_STYLES`, `PLAN_LABELS` ou `variant === "plan"` | `ausência` | Qualquer um desses símbolos em `src/components/ui/Badge.tsx` |
| W013 | `legacy-impact.md` § "UI" | `PLANO_BADGE` em DashboardHeader mapeia apenas `unico`/`suspenso`/`cancelado` | `presença` | Chaves `entrada`, `gestao` ou `enterprise` em `PLANO_BADGE` |
| W014 | `legacy-impact.md` § "Documentação" | Tabela de planos em PRD não lista Entrada/Gestão/Enterprise | `presença` | Colunas "Entrada", "Gestão" ou "Enterprise" na tabela `# 3. Planos` |
| W015 | `legacy-impact.md` § "Documentação" | Título S4 em SECURITY.md não contém "(Enterprise)" | `ausência` | `(Enterprise)` no título da seção S4 |
| W016 | `legacy-impact.md` § "Cobrança" | `DELETE /api/billing/cancel` não importa `getSubscription` nem `cancelSubscription` | `ausência` | Import de `getSubscription` ou `cancelSubscription` em `billing/cancel/route.ts` |
| W017 | `legacy-impact.md` § "Cobrança" | `renovarAssinatura.ts` existe e é uma `onSchedule` function | `presença` | Arquivo ausente ou não exportando `renovarAssinatura` como agendada |
| W018 | `legacy-impact.md` § "Gates de feature" | Nenhum componente de UI contém gate `user.plano === "entrada"` para assistente, relatórios ou CSV | `ausência` | `user?.plano === "entrada"` ou `user.plano === "entrada"` em qualquer arquivo `src/app/` |

## Histórico de re-extrações

<!-- Preenchido pelo agente reverso ao rodar /reversa novamente -->

| Data | Re-extração | Watch items violados | Ação tomada |
|------|-------------|---------------------|-------------|
| - | - | - | - |

## Arquivadas

<!-- Watch items que foram removidos por re-extração confirmando conformidade -->

| ID | Data de arquivamento | Motivo |
|----|---------------------|--------|
| - | - | - |

## Observações

Regras que originalmente eram 🟡 ou 🔴 no `domain.md`, sem peso de regressão:

- 🟡 `_reversa_sdd/checkout/design.md`: divergência entre `PLANOS_CONFIG` e `src/lib/planos.ts` — resolvida por D-12 (`planos-config.ts` como fonte única)
- 🟡 `_reversa_sdd/adrs/003-*.md`: resolução de plano por faixa de valor — removida (não há mais diferenciação)
- 🟡 `_reversa_sdd/dashboard/design.md`: gate `plano === "gestao"` para mapa de risco — removido junto com todos os gates de feature
- 🔴 `_reversa_sdd/architecture.md` risco #5: "Ciclo de vida de plano incompleto" — pendência de upgrade/downgrade/reativação não faz mais sentido com plano único

RFs implementados (confirmados via inspeção de código nesta execução):

- RF-01 a RF-12: todos os Must e Should implementados conforme actions.md
- T014 (validação sandbox Asaas) e T025 (onboarding manual) permanecem pendentes como validação manual
