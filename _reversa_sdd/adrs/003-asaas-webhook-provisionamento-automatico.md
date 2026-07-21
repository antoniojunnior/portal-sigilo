# ADR-003 — Provisionamento de org via webhook Asaas, não via fluxo de onboarding manual

**Status:** 🟢 Confirmado (retroativo — commit `985fece` "implementa Epic 9 (stories 9.1 e 9.2) — checkout Asaas e webhook de provisionamento")
**Local:** `functions/src/webhookAsaas.ts`, `src/app/api/checkout/create`

## Contexto

Novo cliente precisa contratar um plano e ter sua organização (tenant) criada automaticamente, sem intervenção manual da equipe do Portal Sigilo.

## Decisão

1. `POST /api/checkout/create` apenas gera um link de pagamento Asaas (`createPaymentLink`) — não cria nada no Firestore
2. A criação real da org (`provisionOrg`) só acontece quando a Asaas confirma o pagamento via webhook (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`), executado como Firebase Function (`webhookAsaas`, `onRequest`)
3. O provisionamento cria: documento `orgs`, usuário admin no Firebase Auth com senha temporária, documento `users`, e envia e-mail de boas-vindas com a senha (via collection `mail` / Firebase Trigger Email extension)

## Alternativas consideradas

🔴 Não documentadas. Alternativa plausível: criar a org no momento do checkout (otimista) e reverter/suspender se o pagamento falhar — rejeitada implicitamente, pois o código só cria a org após confirmação.

## Consequências

- 🟢 Nunca existe uma org sem pagamento confirmado (evita contas fantasmas ou fraude por abandono de checkout)
- 🟢 Idempotência: `provisionOrg` verifica `asaas_customer_id` existente antes de criar, protegendo contra webhooks duplicados/retry da Asaas
- 🟡 **Risco de segurança mitigado explicitamente**: o slug da org usa sufixo hexadecimal aleatório (`WH-003` no comentário do código) "para eliminar TOCTOU race condition" — evidência de que uma versão anterior gerava slug determinístico e colisões foram identificadas como risco real, não hipotético
- 🟡 Senha temporária é gerada em texto e enviada por e-mail em HTML — depende inteiramente da segurança do provedor de e-mail (Firebase Trigger Email extension) e da orientação ao usuário para trocar a senha no primeiro acesso; não há enforcement técnico de troca obrigatória de senha observado no código
- 🔴 **Lacuna**: não há rota de upgrade/downgrade de plano nem de reativação pós-suspensão observada no código (ver `_reversa_sdd/state-machines.md` §3) — o webhook cobre criação, suspensão e cancelamento, mas não o ciclo de vida completo de mudança de plano dentro do produto.
