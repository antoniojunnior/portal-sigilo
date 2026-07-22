# Pente-fino: unificacao-plano-assinatura (feature 002) — 2ª varredura

> Data: 2026-07-22
> Varredura: `varredura-02-pos-fechamento`
> Gatilho: feature 002 fechada 32/32 ações, todos os 8 bugs da 1ª varredura `DONE`; usuário pediu nova inspeção pra conferir o estado atual pós-fechamento
> Método: leitura estática + chamadas reais ao sandbox Asaas (mesmo customer de teste das rodadas anteriores, já com 6 pagamentos reais confirmados). Sem emulador nesta rodada (Firestore Rules já revalidado no fechamento de T025).

## Mapa da feature

Specs, código, testes e dados: iguais à 1ª varredura (`inspections/varredura-01-pos-coding/report.md`), com o delta desde então: 8 bugs corrigidos e `DONE`, mais 4 correções externas (function não exportada, fallback duplicado em `getSubscription`, contradição no PRD §8.2, modelo Claude hardcoded) registradas no adendo mas não como bugs formais (ver nota abaixo). `T014`/`T025` fechados nesta sessão com validação real (sandbox, emulador, chamada real à Anthropic API).

**Bugs existentes:** 8 em `_reversa_bugs/unificacao-plano-assinatura/bugs/`, todos `DONE`. Esta varredura não redescobre nenhum deles.

## Achados por lente

### Contratos e integrações / Fluxo de dados

- **F-01** (confiança alta, confirmado com evidência real): `getInvoices.ts`/`getSubscription.ts` mapeiam `status` de pagamento Asaas de forma incompleta. `Invoice["status"]` declara só 4 valores; a Asaas real retorna `"CONFIRMED"` para todo pagamento bem-sucedido (confirmado: 6/6 pagamentos reais desta sessão vieram com esse status, nenhum com `"RECEIVED"`). O `switch` em `getSubscription.ts` não trata `"CONFIRMED"` explicitamente — cai no `default: "ACTIVE"`, resultado certo por acidente. O mesmo default também captura status de problema real (`REFUNDED`, `CHARGEBACK_REQUESTED`, `CHARGEBACK_DISPUTE`), que ficariam mostrados como "ACTIVE" na tela de faturamento do admin. `promoted_to: BUG-20260722-T6R2`

### Cobertura de testes

- **F-02** (confiança alta, mesma causa de F-01): `scripts/test-billing-route-fixes.ts` (regressão de `BUG-20260721-H3X6`) nunca verifica o campo `status` da resposta de `getSubscription` — só `parcelas` e `subscription_id`. Dobrado como evidência em `BUG-20260722-T6R2`, não registrado como bug separado (é a causa de detecção tardia de F-01, não um defeito em si).

### Concorrência e consistência

- **F-03** (confiança baixa, carregado da 1ª varredura, ainda não exercitado): idempotência de `renovarAssinatura.ts` (`ultima_cobranca_ciclo`) segue sem teste sob concorrência real — a checagem acontece no início da execução, sem transação Firestore, então duas invocações verdadeiramente simultâneas ainda teriam uma janela teórica de corrida. Mesma observação já registrada na 1ª varredura, não promovida (falta prova de caminho causal sob concorrência real, não só leitura de código). `promoted_to: null`

### Conformidade com spec, Estados de erro/edge cases

Nenhum achado novo confirmado. Os pontos já cobertos pelos 8 bugs anteriores seguem corrigidos e consistentes com a spec (`interfaces/*.md`, `roadmap.md`).

## Clusters

**Cluster único — status de pagamento (F-01, F-02):** mesma causa raiz, mesmo arquivo (`getSubscription.ts`) e vizinho direto (`getInvoices.ts`). Recomendação: ao corrigir `BUG-20260722-T6R2`, adicionar um teste que verifique `status` para pelo menos um caso `CONFIRMED` real (fechando F-02 junto).

## O que não foi coberto

- **Segurança/autorização, desempenho, configuração, observabilidade**: nenhum sinal novo que justificasse ativar essas lentes condicionais nesta rodada.
- **Concorrência real**: não simulada (exigiria disparar `renovarAssinatura` duas vezes de propósito contra o emulador — não feito nesta varredura, ver F-03).
- **UI visual (badges, página `/planos`)**: mesma lacuna já registrada em `actions.md`/`onboarding.md` (T025, itens 🟡) — não reavaliada aqui, fora do escopo de uma inspeção de código/API.
- **As 4 correções externas não registradas como bugs** (função não exportada, fallback duplicado, PRD §8.2, modelo Claude): já mencionadas como `A002` no `/reversa-audit` da 4ª rodada — não redescobertas aqui como achados novos, só citadas para contexto.

## Resumo de achados

| Lente | Achados | Confiança | Promovido |
|---|---|---|---|
| Contratos e integrações / Fluxo de dados | F-01 | alta | → bug |
| Cobertura de testes | F-02 | alta | evidência em T6R2 |
| Concorrência | F-03 | baixa | observação (carregada da 1ª varredura) |

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | 2ª varredura, pós-fechamento da feature 002. 1 bug novo registrado (BUG-20260722-T6R2) | reversa |
