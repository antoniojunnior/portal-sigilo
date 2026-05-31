# Epic 09 — Checkout e Gestão de Planos

## Status

**Planejado** — Aguarda execução pelo @sm (criação de stories)

## Objetivo do Epic

Implementar o fluxo completo de contratação via Asaas: página de planos, checkout, webhook de pagamento com criação automática de org e usuário admin, e controle de limites por plano no Firestore e no dashboard.

## Contexto do Sistema Existente

- **Stack atual:** Next.js 14 + TypeScript + Firebase (Firestore, Auth, Functions, Storage) + Tailwind + shadcn/ui
- **Fases concluídas (1–6):** Portal do denunciante, chatbot Claude, triagem automática, dashboard de gestão, assistente IA e relatórios
- **Campo de controle de plano:** `orgs/{org_id}.plano_ativo` já existe e é verificado em todas as features das fases anteriores
- **Processador de pagamentos:** Asaas — checkout e assinaturas recorrentes
- **Planos:** Entrada (R$97/mês anual), Gestão (R$197/mês anual), Enterprise (sob consulta)

## Referências PRD

- Seção 3 — Planos e limites por tenant
- Seção 8 — Checkout e gestão de planos (8.1 e 8.2)
- Seção 9 — Fase 9 entregáveis

---

## Stories do Epic

### Story 9.1 — Página de Planos e Integração Checkout Asaas

**Objetivo:** Criar a landing page de seleção de planos em `portalsigilo.com.br/planos` com redirect para checkout Asaas.

**Executor Assignment:**
```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - TypeScript (npx tsc --noEmit)
  - ESLint (npm run lint)
  - Security scan: nenhum dado de pagamento no client
```

**Escopo:**
- Página `/planos` com tabela comparativa dos 3 planos (Entrada, Gestão, Enterprise)
- Botão "Contratar" gera link de checkout Asaas via Route Handler server-side (`/api/checkout/create`)
- Route Handler cria o link de cobrança na API Asaas e retorna a URL
- Redirect para checkout Asaas com dados da org preenchidos
- Plano Enterprise: botão "Falar com vendas" (link WhatsApp ou formulário)
- Nenhum dado de pagamento processado no client — apenas redirect para URL Asaas

**Quality Gates:**
- Pre-Commit: `npm run lint && npx tsc --noEmit` + grep `ASAAS_API_KEY` fora de `/api/`
- Pre-PR: validação de que nenhum dado de cartão passa pelo Next.js

**Complexity:** Medium

---

### Story 9.2 — Webhook Asaas: Criação Automática de Org e Onboarding

**Objetivo:** Firebase Function que processa webhook do Asaas e provisiona a org automaticamente após pagamento confirmado.

**Executor Assignment:**
```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - TypeScript (npx tsc --noEmit)
  - ESLint (npm run lint)
  - Security: validação de assinatura HMAC do webhook Asaas
  - Audit logs: verificar gravação em audit_logs
```

**Escopo:**
- Firebase Function `functions/src/webhookAsaas.ts` exposta em `/webhook/asaas`
- Valida assinatura HMAC do payload Asaas (campo `asaasToken` no header)
- Em `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`:
  - Cria documento em `orgs` com `plano_ativo`, `slug`, `data_inicio`, `data_renovacao`, `criado_em`
  - Cria usuário admin inicial em `users` com `role: admin`
  - Cria usuário Firebase Auth para o admin
  - Envia e-mail de boas-vindas via coleção `mail` (Firebase Trigger Email)
- Em `PAYMENT_OVERDUE` / `SUBSCRIPTION_CANCELED`:
  - Atualiza `plano_ativo` → `suspenso` ou downgrade conforme regra
- Audit log `org_created` / `plan_changed` em `audit_logs`
- Idempotência: verificar se org já existe antes de criar

**Security:**
- `ASAAS_WEBHOOK_TOKEN` apenas em variável de ambiente server-side
- Validação do token antes de processar qualquer payload
- Nenhum dado de pagamento armazenado no Firestore (apenas `plano_ativo`, datas)

**Quality Gates:**
- Pre-Commit: tsc + lint + verificar validação HMAC presente
- Pre-PR: teste com payload de exemplo Asaas (manual via Emulator)
- Pre-Deployment: security scan — nenhum dado de cartão persistido

**Complexity:** High

---

### Story 9.3 — Controle de Limites por Plano e Painel de Faturamento

**Objetivo:** Enforce dos limites de plano no Firestore Rules e Functions + tela de faturamento no dashboard.

**Executor Assignment:**
```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - TypeScript (npx tsc --noEmit)
  - ESLint (npm run lint)
  - Firestore Rules: teste de limites com Firebase Emulator
```

**Escopo:**

**Enforcement de limites (server-side):**
- Firestore Rule: bloqueia criação de `users` se `count >= limite_plano` (1 para Entrada, 10 para Gestão)
- Firebase Function: verifica storage utilizado antes de aceitar upload — retorna 403 se excedido
- Verificação de `plano_ativo` já existe nas features anteriores — validar que funciona com `suspenso`

**Painel de faturamento no dashboard (`/app/configuracoes/faturamento`):**
- Exibe: plano atual, data de renovação, status da assinatura
- Botão "Gerenciar assinatura" → link para portal do cliente Asaas (URL via Route Handler server-side)
- Badge de plano no header do dashboard (Entrada / Gestão / Enterprise)
- Para orgs com `plano_ativo: suspenso`: banner de aviso com link para regularizar

**Quality Gates:**
- Pre-Commit: tsc + lint
- Pre-PR: teste manual com Firestore Emulator para validar Rules de limite de usuários

**Complexity:** Medium

---

## Sequência de Execução

```
Story 9.1 (Página planos) → Story 9.2 (Webhook) → Story 9.3 (Limites + Faturamento)
```

> 9.1 e 9.2 podem ser desenvolvidas em paralelo. 9.3 depende de 9.2 (campo `plano_ativo` populado).

## Variáveis de Ambiente Necessárias

```bash
ASAAS_API_KEY=           # Chave da API Asaas — APENAS server-side
ASAAS_WEBHOOK_TOKEN=     # Token de validação HMAC dos webhooks Asaas
ASAAS_SANDBOX=true       # Modo sandbox para desenvolvimento
```

## Compatibilidade

- `plano_ativo` já verificado nas Fases 4, 5 e 6 — sem breaking changes
- Orgs de teste/desenvolvimento existentes não são afetadas
- Firestore Rules novas são aditivas

## Risk Assessment

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Webhook Asaas receber payload inválido | Média | Alto | Validação HMAC obrigatória + try/catch |
| Org criada em duplicata | Baixa | Alto | Check de idempotência antes de criar |
| Limite de usuários mal aplicado | Média | Médio | Teste com Emulator antes do deploy |
| Dado de pagamento exposto no client | Baixa | Crítico | Security scan no Pre-PR + grep obrigatório |

**Rollback:** Webhook pode ser desativado no console Firebase sem impacto nas orgs existentes.

## Definition of Done

- [ ] Página de planos funcional com redirect correto para Asaas
- [ ] Webhook processa `PAYMENT_CONFIRMED` e cria org + admin + e-mail
- [ ] Webhook processa `PAYMENT_OVERDUE` e atualiza status
- [ ] Limites de usuários enforced via Firestore Rules
- [ ] Painel de faturamento exibe plano e data de renovação
- [ ] `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` apenas server-side — grep confirmado
- [ ] Audit logs gravados para `org_created` e `plan_changed`
- [ ] tsc + lint: zero erros

## Handoff para @sm

"River, criar 3 stories para o Epic 09 — Checkout e Gestão de Planos:

- Story 9.1: Página de planos + checkout redirect Asaas
- Story 9.2: Webhook Asaas + criação automática de org/admin/e-mail + eventos de cancelamento
- Story 9.3: Controle de limites por plano (Firestore Rules + Function) + painel de faturamento no dashboard

Stack: Next.js 14 + Firebase Functions v2 + Firestore. Seguir padrões das stories 6.1 (executor assignment, quality gates, security rules do AGENTS.md). Executores sugeridos no epic acima. Story 9.2 é HIGH complexity e exige Pre-Deployment gate."

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-05-30 | 1.0 | Epic criado — Fase 9 Checkout e Gestão de Planos | Morgan (@pm) |
