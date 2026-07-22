# Cross-Check: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-22`
> Artefatos analisados:
> - `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
> - `_reversa_forward/002-unificar-plano-assinatura/roadmap.md`
> - `_reversa_forward/002-unificar-plano-assinatura/actions.md`
> - `_reversa_forward/002-unificar-plano-assinatura/investigation.md`, `data-delta.md`, `onboarding.md`, `interfaces/*.md` (apoio)
> - Código-fonte real: `src/`, `functions/src/`, `firestore.rules`, `scripts/` (5ª rodada — verificação fresca pós-correção dos 6 achados da 4ª rodada)
>
> Este relatório é estritamente leitor. Nenhum dos artefatos analisados foi alterado.

## Resumo

| Severidade | Contagem |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |
| **Total** | **0** |

Nenhum achado novo nesta rodada. Os 6 itens da 4ª rodada (A001–A006) foram todos corrigidos ou documentados como exceção aceitável — verificado lendo o código real, não só os artefatos.

## Confirmação dos achados da 4ª rodada

| ID (4ª rodada) | Situação | Evidência |
|---|---|---|
| A001 — preço `1164` duplicado em `renovarAssinatura.ts` | **Mitigado** (documentado, não eliminado) | Comentário `/** CANONICAL: src/lib/planos-config.ts. Mantenha sincronizado. */` adicionado sobre a constante local — a duplicação é estrutural (pacote `functions/` isolado de `src/lib/`), agora está explícita para quem for mexer no valor |
| A002 — código morto com "Enterprise" em `casos/page.tsx` | **Corrigido** | Bloco `canExportCSV ? (...) : (...)` removido por completo; botão de exportação renderiza direto, sem branch morto nem string residual |
| A003 — `interfaces/*.md` com nomes de campo desatualizados | **Corrigido** | `checkout-create.md` e `webhook-asaas.md` agora descrevem os dois endpoints reais (`/v3/paymentLinks` com `maxInstallmentCount`/`value`; `/v3/payments` com `installmentCount`/`installmentValue`), com nota "Validado em sandbox" |
| A004 — evento `PAYMENT_DELETED` não documentado | **Corrigido** | `interfaces/webhook-asaas.md` agora documenta o evento explicitamente |
| A005 — `proxima_cobranca_parcelas` hardcoded para 12, sem explicação | **Corrigido** (documentado) | `data-delta.md` ganhou nota explicando que a Asaas não retorna `installmentCount` no webhook de cobranças via `paymentLinks` — limitação real da API, não descuido |
| A006 — comentário desatualizado em `Badge.tsx` | **Corrigido** | Comentário não menciona mais "subscription plan" |

## Itens verificados que passaram

### Cobertura
- Todos os 17 RN/RF relevantes do `requirements.md` têm decisão correspondente em `roadmap.md` (D-01 a D-17) e ação correspondente em `actions.md`
- Os 7 cenários Gherkin têm cobertura em ações ou em passos de `onboarding.md`
- Nenhum identificador antigo (`"entrada"`, `"gestao"`, `"enterprise"`) sobrevive como valor de comparação ativo em `src/`, `functions/src/` ou `firestore.rules` — as duas únicas ocorrências da palavra "Enterprise" restantes são comentários de contexto histórico/de outra feature fora de escopo (`types/index.ts:47`, sobre o tipo `Unit` de multi-unidade, nunca implementado; `firestore.rules:78`, explicando a origem de um bug já corrigido), não gates ativos

### Consistência
- Nenhum identificador fantasma entre RN/RF/D/T
- `interfaces/checkout-create.md` e `interfaces/webhook-asaas.md` batem com a implementação real (`createPaymentLink.ts`, `renovarAssinatura.ts`, `webhookAsaas.ts`)
- `PLAN_USER_LIMITS` (`unico: 50`) e `STORAGE_LIMITS_BYTES` (`unico: 2GB`) têm exatamente uma chave cada, sem resíduo de tier

### Coerência com o legado
- Nenhuma regra 🟢 do `domain.md` contradita além das alterações intencionais já rastreadas
- `getPlanoLimit` retorna `0` para `suspenso`/`cancelado`, `50` caso contrário (mais estrito que o `D-06` original, correção do `BUG-20260721-R4T8`)

### Sanidade do actions
- Nenhum ciclo de dependência; todas as dependências apontam para IDs existentes
- Nenhuma tarefa `[//]` compartilha arquivo alvo com outra `[//]`
- **30 de 32 ações `[X]`** — `T014` (validação em sandbox, superada na prática pela correção dos bugs K9M2/V3F7 contra sandbox real, ainda que por um caminho diferente do planejado) e `T025` (execução do `onboarding.md`) seguem `[ ]`/`"skipped"`, conscientemente deixadas para execução humana. Não é uma inconsistência — é o único item do Critério de Pronto (`roadmap.md` §10) ainda em aberto

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Versão inicial gerada por `/reversa-audit` | reversa |
| 2026-07-21 | Segunda execução: A001 (CRITICAL, functions agendadas), A002 (HIGH, badges de UI), A003 (HIGH, idempotência), A004 (MEDIUM, métrica de cadeia), A005 (MEDIUM, título de SECURITY.md) | reversa |
| 2026-07-21 | Terceira execução: A001 (HIGH, 3 gates de UI residuais em `casos/page.tsx`, `relatorios/page.tsx`, `casos/[caseId]/page.tsx`) | reversa |
| 2026-07-22 | Quarta execução, verificação profunda do código real: A001–A006 (MEDIUM/LOW — duplicação residual de preço, código morto residual, documentação de contrato desatualizada, evento não documentado, parcelamento hardcoded sem explicação, comentário desatualizado) | reversa |
| 2026-07-22 | Quinta execução: confirmado que A001–A006 da 4ª rodada foram todos corrigidos ou documentados como exceção aceitável. **Zero achados novos.** | reversa |
