# Data Delta: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Modelo de origem: `_reversa_sdd/data-dictionary.md`, `_reversa_sdd/erd-complete.md`

## 1. `orgs.plano_ativo`

| Aspecto | Antes | Depois |
|---|---|---|
| Valores válidos | `"entrada" \| "gestao" \| "enterprise" \| "suspenso" \| "cancelado"` (união real, divergente do tipo declarado) | `"unico" \| "suspenso" \| "cancelado"` |
| Tipo declarado (`src/lib/types/index.ts`) | `export type Plano = "entrada" \| "gestao" \| "enterprise";` (já divergente — não incluía `suspenso`/`cancelado`) | `export type Plano = "unico" \| "suspenso" \| "cancelado";` — resolve a divergência #4 já registrada em `_reversa_sdd/data-dictionary.md` |
| Migração de valor | n/a (RN-11: sem migração, base de teste é resetada) | n/a |

## 2. `orgs` — campos novos (Opção A de billing, `roadmap.md` D-04, confirmada pelo dono do negócio em 2026-07-21)

| Campo | Tipo | Obrigatório | Motivo |
|---|---|---|---|
| `asaas_credit_card_token` | `string \| null` | Sim | Token de cartão retornado pelo Asaas na primeira cobrança, reutilizado pela Cloud Function agendada a cada renovação anual, evitando pedir o cartão de novo (RF-02) |
| `proxima_cobranca_parcelas` | `number` (1 a 12) | Sim | Preferência de parcelamento escolhida pelo cliente, usada pela function agendada ao gerar a cobrança da próxima renovação |
| `renovacao_cancelada` | `boolean` | Sim (default `false`) | D-10 (correção de A001 da 1ª rodada de `/reversa-audit`): quando `true`, a function agendada de renovação (D-04) não dispara a próxima cobrança para essa org. Setado pelo endpoint `DELETE /api/billing/cancel`, que não chama mais nenhum endpoint de assinatura da Asaas |
| `ultima_cobranca_ciclo` | `number` (ano, ex. `2027`) | Sim (default: ano da adesão) | D-15 (correção de A003 da 2ª rodada de `/reversa-audit`): guarda o ano da última cobrança de renovação bem-sucedida. A function agendada de renovação (T018) checa esse campo no início da execução — se já for o ano corrente, pula a org, evitando cobrança duplicada caso a function seja invocada mais de uma vez no mesmo dia (comportamento conhecido de retry em `onSchedule`/Cloud Scheduler) |

Sem esses quatro campos, a Opção A não tem como funcionar (a function agendada precisa saber qual token cobrar, em quantas parcelas, se deve pular a org por cancelamento, e se já cobrou o ciclo corrente). Falta apenas validação técnica em sandbox Asaas (não decisão de negócio) antes de virar ação em `actions.md`.

**Nota sobre cancelamento e parcelas já geradas:** `renovacao_cancelada = true` só impede a **próxima renovação anual** de ser disparada. Não cancela parcelas já geradas da venda parcelada do ciclo vigente (a Asaas gera todas as N parcelas de uma cobrança `INSTALLMENT` de uma vez, no momento da venda — ver `investigation.md`). Se o negócio quiser interromper também as parcelas restantes do ciclo corrente ao cancelar, isso exige uma chamada adicional à Asaas para estornar cada parcela pendente — não confirmado até aqui, registrado como premissa em `roadmap.md` §4.

## 3. `PLANOS` (`src/lib/planos.ts`) — array de configuração de UI

- Antes: 3 entradas (`entrada`, `gestao`, `enterprise`), cada uma com `precoMensal`, `precoAnual`, `usuarios`, `armazenamento`, `sla`, `features[]`
- Depois: 1 entrada única —
  - `id: "unico"`
  - `precoAnual: 1164` (sem `precoMensal` — não há mais ciclo mensal)
  - `usuarios: 50`
  - `armazenamento: "2 GB"`
  - `features[]`: todas com `disponivel: true` (herda o conjunto do antigo "Gestão"; nenhuma feature do antigo Enterprise — WhatsApp, multi-site, white-label — é incluída, pois nunca foram implementadas)
  - Campo novo sugerido: `parcelamento: { maximoParcelas: 12, semJuros: true }`, usado pela UI de checkout para oferecer a escolha de parcelas

## 4. `PLANOS_CONFIG` (`src/lib/asaas/createPaymentLink.ts`)

- Antes: 2 chaves (`entrada`, `gestao`) × 2 ciclos (`mensal`, `anual`) = 4 combinações, todas `chargeType: "RECURRENT"`
- Depois (Opção A confirmada, D-04 do `roadmap.md`): `PLANOS_CONFIG` deixa de existir neste formato — substituído por uma função que cria uma cobrança avulsa (`chargeType: "INSTALLMENT"`, `installmentCount` de 1 a 12, `totalValue: 1164`) e retorna o `creditCardToken` para persistir em `orgs.asaas_credit_card_token`

## 5. `PLAN_USER_LIMITS` (`src/app/api/dashboard/users/route.ts`) e `getPlanoLimit` (`firestore.rules`)

- Antes: `{ entrada: 1, gestao: 10, enterprise: null }`
- Depois: valor único fixo `50` para qualquer `plano_ativo` que não seja `suspenso`/`cancelado` (nesses dois estados, a criação de usuário já é bloqueada por outra checagem, fora do escopo desta feature)

## 6. `STORAGE_LIMITS_BYTES` (`src/app/api/upload-attachment/route.ts`)

- Antes: `{ entrada: 2GB, gestao: 20GB, enterprise: null }`
- Depois: valor único fixo `2 * 1024 * 1024 * 1024` (2GB) para qualquer org ativa

## 7. Dados mockados do reseed (RF-10 do `requirements.md`)

Substitui o conteúdo atual de `scripts/seed-emulator.ts`/`seed-remote.ts` (que hoje cria 2 orgs, `org-acme-gestao` e `org-startup-entrada`) por exatamente:

| Entidade | Quantidade | Detalhe |
|---|---|---|
| `orgs` | 1 | `plano_ativo: "unico"`, `configuracoes.departamentos` com exatamente 5 nomes |
| `users` | 2 | 1 com `role: "admin"`, 1 com `role: "gestor"` (ou outro papel não-admin existente no domínio — ver `_reversa_sdd/permissions.md` para os papéis válidos) |
| `cases` | entre 5 e 15 (1 a 3 por departamento × 5 departamentos) | Distribuídos entre as 11 categorias de `categoria_legal` e os 5 estágios de `Case.status`; cada caso tem `triagem_ia.area_risco` igual a um dos 5 nomes de departamento da org (ver achado em `investigation.md` — departamento não é campo direto do `Case`) |

Nenhum audit log histórico de `entrada`/`gestao`/`enterprise` sobrevive ao reset, já que o reset apaga a base de teste por completo (RNF "Compatibilidade retroativa" do `requirements.md` — a regra S6 de imutabilidade de audit log não se aplica a dado de teste descartado).

## 8. `firestore.rules` — comentário e branch de `enterprise`

- Antes: `// Retorna o limite de usuários do plano: 1 (entrada), 10 (gestao), null (enterprise/sem limite).` + branch ternário com 3 casos
- Depois: comentário atualizado para refletir valor único; branch simplificado — `getPlanoLimit` retorna `50` para qualquer org que não seja `suspenso`/`cancelado` (D-06 do `roadmap.md`, reduz acoplamento ao nome exato do plano)

## 9. `SubscriptionData` (`src/lib/asaas/getSubscription.ts`) — mudança de fonte, não só de conteúdo (D-11, corrige A002)

- Antes: campos `valor`, `ciclo`, `status`, `subscription_id` vêm de `/v3/subscriptions?customer=...` na Asaas (`source: "asaas"`), com fallback para Firestore só quando a consulta falha
- Depois: a Asaas não tem mais objeto `subscription` para orgs sob a Opção A — a interface `SubscriptionData` continua com a mesma forma (compatibilidade com `billing/subscription/route.ts` e o frontend que a consome), mas os valores passam a ser montados a partir de:
  - `plano_ativo`, `proximo_vencimento` → direto de `orgs.plano_ativo`/`orgs.data_renovacao` (Firestore)
  - `valor`, `status` → da cobrança mais recente retornada por `getInvoices.ts` (já consulta por `customer`, não por `subscription` — não muda)
  - `subscription_id` → passa a ser sempre `null` (não existe mais esse conceito); se o frontend usa esse campo para alguma decisão de UI, isso precisa ser revisto durante `/reversa-coding` (verificar consumidores do campo antes de remover de vez)
  - `source` → passa a ser sempre `"firestore"` (o valor `"asaas"` deixa de fazer sentido nesse fluxo)

## 10. `src/lib/planos-config.ts` — módulo novo (D-12, corrige A003 da 1ª rodada)

- Exporta a constante única de preço/parcelamento do plano `"unico"`: valor anual (`1164`), parcela mensal equivalente (`97`), parcelamento máximo (`12`), sem juros
- Consumido por `src/lib/planos.ts` (para exibir preço na UI) e por `src/lib/asaas/createPaymentLink.ts` (para o `totalValue` da cobrança avulsa) — elimina a duplicação do valor `1164` entre os dois arquivos

## 11. Elegibilidade de `generateDailyInsights`/`generateMonthlyReports` (D-13, corrige A001 da 2ª rodada)

- Antes: `.where("plano_ativo", "in", ["gestao", "enterprise"])` em `functions/src/aiInsights.ts:23` e `functions/src/scheduledReports.ts:28`
- Depois: `.where("plano_ativo", "==", "unico")` nos dois arquivos — sem essa troca, a cláusula antiga nunca mais casa com nenhuma org após a unificação, e as duas functions agendadas rodam vazias para sempre, sem erro

## 12. Badges de plano fora de `/planos` (D-14, corrige A002 da 2ª rodada)

- `src/components/layout/DashboardHeader.tsx` (`PLANO_BADGE`): antes mapeava `entrada`/`gestao`/`enterprise`/`suspenso`/`cancelado`; depois mapeia só `unico` (label "Ativo") / `suspenso` / `cancelado`
- `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` (`PLANO_LABELS` + parágrafo descritivo ternário por `user.plano`): antes 3 entradas com descrições diferentes por tier; depois 1 entrada única (`unico` → "Plano Único"), descrição deixa de ser condicional — sempre o texto do antigo tier "Gestão" (acesso pleno a IA), já que RN-01 unifica todas as features
- `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` (`PLANO_LABELS`): antes `entrada`/`gestao`/`enterprise`/`cancelado`; depois `unico`/`suspenso`/`cancelado`
- `src/components/ui/Badge.tsx`: `PlanValue` (`"entrada" | "gestao" | "enterprise"`), `PLAN_STYLES`, `PLAN_LABELS` e o branch `variant === "plan"` são removidos por completo — confirmado, por busca no projeto, que não há nenhum uso de `<Badge variant="plan" .../>` hoje (dead code já antes desta feature)
