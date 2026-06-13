---
title: Frontend Spec — /alterar-plano (upgrade/downgrade para usuário logado)
version: 1.0.0
author: Atlas (analyst)
date: 2026-06-11
status: Draft
epic: Epic 9 — Checkout & Planos (Revisão)
route: /alterar-plano
files:
  - src/app/alterar-plano/page.tsx           (NOVO)
  - src/app/alterar-plano/PlanoCardAuth.tsx  (NOVO)
  - src/app/api/checkout/change-plan/route.ts (NOVO)
depends_on:
  - frontend-spec-planos-v2.md
  - src/app/api/billing/info/route.ts
  - src/lib/utils/auth.ts
---

# Frontend Spec: `/alterar-plano`

## 1. Visão Geral

| Atributo | Valor |
|---|---|
| Rota | `/alterar-plano` |
| Tipo | Página semi-pública com auth guard server-side |
| Propósito | Upgrade / downgrade de plano para usuário admin logado |
| Contexto visual | **Light-forced** via `data-portal` (igual a `/planos`) |
| Auth | Obrigatória — admin apenas. Non-admin → redirect `/app`. Não autenticado → redirect `/app/login` |
| Responsividade | 1 coluna mobile → 3 colunas ≥ md |

A rota vive **fora** do layout `(dashboard)` para manter o visual de marketing
da página `/planos`. Usa `data-portal` para forçar light mode.

---

## 2. Fluxo de Acesso

```
Usuário clica "Alterar plano" em /app/configuracoes/faturamento
        │
        ▼
GET /alterar-plano
        │
        ├── Sem cookie __session ──────────────► redirect /app/login
        │
        ├── role !== "admin" ──────────────────► redirect /app
        │
        └── Admin autenticado ─────────────────► Renderiza /alterar-plano
                                                  com plano_ativo da org
```

---

## 3. Detecção do Plano Atual

### 3.1 Server Component (recomendado)

O `plano_ativo` é obtido via `verifySession()` no Server Component.
Não requer fetch adicional ao `/api/billing/info` se apenas o nome do plano for necessário.

```tsx
// src/app/alterar-plano/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/utils/auth";

export default async function AlterarPlanoPage() {
  const sessionCookie = (await cookies()).get("__session")?.value;
  if (!sessionCookie) redirect("/app/login");

  const session = await verifySession(sessionCookie);
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const planoAtual = session.plano as Plano;

  return <AlterarPlanoView planoAtual={planoAtual} orgName={session.orgName} />;
}
```

### 3.2 Client Component `AlterarPlanoView`

Recebe `planoAtual` e `orgName` como props server→client.
Gerencia estado do toggle mensal/anual.

```tsx
"use client";

interface AlterarPlanoViewProps {
  planoAtual: Plano;
  orgName: string;
}
```

---

## 4. Layout da Página

### 4.1 Estrutura DOM

```tsx
<main data-portal className="min-h-screen bg-[var(--color-bg-secondary)] px-4 py-16">
  <div className="mx-auto max-w-6xl">

    {/* Navegação de retorno */}
    <div className="mb-8">
      <a href="/app/configuracoes/faturamento"
        className="inline-flex items-center gap-1.5 text-[var(--text-sm)]
          text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]
          transition-colors">
        <ArrowLeft size={16} />
        Voltar para Faturamento
      </a>
    </div>

    {/* Contexto da org + plano atual */}
    <div className="mb-8 text-center">
      <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-tertiary)]">
        {orgName}
      </p>
      <h1 className="mt-1 text-[var(--text-3xl)] font-extrabold
        tracking-tight text-[var(--color-text-primary)]">
        Escolha seu próximo plano
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--text-md)]
        text-[var(--color-text-secondary)]">
        Você está no plano <strong>{PLANO_LABELS[planoAtual]}</strong>.
        Faça upgrade para desbloquear mais recursos ou ajuste conforme sua necessidade.
      </p>
    </div>

    {/* Toggle mensal/anual */}
    <div className="mb-10 flex justify-center">
      <BillingToggle value={ciclo} onChange={setCiclo} />
    </div>

    {/* Grid de planos */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANOS.map((plano) => (
        <PlanoCardAuth
          key={plano.id}
          plano={plano}
          ciclo={ciclo}
          planoAtual={planoAtual}
        />
      ))}
    </div>

    {/* Trust signals */}
    <p className="mt-10 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
      Mudanças entram em vigor imediatamente após o processamento do pagamento.
      Em caso de dúvidas, acesse o{" "}
      <a href="/app/configuracoes/faturamento"
        className="underline hover:text-[var(--color-text-primary)]">
        portal de faturamento
      </a>.
    </p>

  </div>
</main>
```

---

## 5. Componente `PlanoCardAuth`

### 5.1 Interface

```tsx
// src/app/alterar-plano/PlanoCardAuth.tsx
export interface PlanoCardAuthProps {
  plano: PlanoConfig;
  ciclo: BillingCycle;
  planoAtual: Plano;
}
```

### 5.2 Derivação do Tipo de Ação

```tsx
type ActionType = "current" | "upgrade" | "downgrade" | "enterprise";

function getActionType(planoId: PlanoId, planoAtual: Plano): ActionType {
  if (planoId === "enterprise") return "enterprise";
  if (planoId === planoAtual) return "current";
  const ordem: Record<Plano, number> = { entrada: 0, gestao: 1, enterprise: 2 };
  return ordem[planoId] > ordem[planoAtual] ? "upgrade" : "downgrade";
}
```

### 5.3 Variantes Visuais por Tipo de Ação

| Tipo | Borda | Background | Badge topo | CTA | Estilo CTA |
|---|---|---|---|---|---|
| `current` | 2px `--color-text-tertiary` | `--color-bg-tertiary` | "Plano atual" (cinza) | Desabilitado | `variant="ghost" disabled` |
| `upgrade` | 2px `--color-primary` (se destaque) ou 1px `--color-border` | `--color-primary-surface` (se destaque) ou `--color-card` | "Mais popular" (se destaque) | "Fazer upgrade" | `variant="primary"` |
| `downgrade` | 1px `--color-border` | `--color-card` com `opacity-90` | — | "Fazer downgrade" | `variant="secondary"` |
| `enterprise` | 1px `--color-border` | `--color-card` | — | "Falar com vendas" | `variant="secondary"` |

### 5.4 Copy dos CTAs por Tipo e Ciclo

| Tipo | Ciclo | CTA |
|---|---|---|
| `current` | — | "Plano atual" (disabled) |
| `upgrade` | mensal | "Fazer upgrade" |
| `upgrade` | anual | "Fazer upgrade — Anual" |
| `downgrade` | mensal | "Fazer downgrade" |
| `downgrade` | anual | "Fazer downgrade — Anual" |
| `enterprise` | — | "Falar com vendas" |

### 5.5 Copy de Benefícios Diferenciais (upgrade)

Para `actionType === "upgrade"`, exibir abaixo do nome do plano
a lista de features que o usuário **ainda não tem** no plano atual.

```tsx
{actionType === "upgrade" && (
  <div className="mb-3 rounded-xl bg-[var(--color-primary)]/5
    border border-[var(--color-primary)]/15 px-3 py-2">
    <p className="text-[var(--text-xs)] font-semibold
      text-[var(--color-primary)] mb-1">
      Você vai desbloquear:
    </p>
    <ul className="space-y-0.5">
      {featuresNovas.map(f => (
        <li key={f} className="flex items-center gap-1.5
          text-[var(--text-xs)] text-[var(--color-text-secondary)]">
          <Sparkles size={11} className="text-[var(--color-primary)] shrink-0" />
          {f}
        </li>
      ))}
    </ul>
  </div>
)}
```

**Cálculo de `featuresNovas`:**
```tsx
const featuresNovas = plano.features
  .filter(f => f.disponivel)
  .filter(f => {
    const planoAtualConfig = PLANOS.find(p => p.id === planoAtual);
    const fNoPlanoAtual = planoAtualConfig?.features.find(fa => fa.descricao === f.descricao);
    return !fNoPlanoAtual?.disponivel;
  })
  .map(f => f.descricao)
  .slice(0, 4); // máximo 4 itens no bloco
```

### 5.6 Aviso de Downgrade

Para `actionType === "downgrade"`, exibir aviso antes do CTA:

```tsx
{actionType === "downgrade" && (
  <div role="alert" className="mb-3 rounded-xl border border-[var(--color-warning)]/20
    bg-[var(--color-warning-surface)] px-3 py-2">
    <p className="text-[var(--text-xs)] text-[var(--color-warning)]">
      Você perderá acesso a alguns recursos do plano {PLANO_LABELS[planoAtual]}.
    </p>
  </div>
)}
```

> **Nota de tokens:** `--color-warning` e `--color-warning-surface` devem existir em
> `src/styles/tokens.css`. Se ausentes, usar `amber-600` como fallback temporário e
> criar ticket para adicionar os tokens ao DS.

### 5.7 Estado do plano atual

Para `actionType === "current"`, o card recebe visual distinto de "selecionado":

```tsx
const cardClass = cn(
  "relative flex flex-col rounded-2xl border p-6 transition-shadow",
  "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
  actionType === "current"
    && "border-2 border-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] opacity-80",
  actionType === "upgrade" && plano.destaque
    && "border-2 border-[var(--color-primary)] bg-[var(--color-primary-surface)]",
  (actionType === "upgrade" && !plano.destaque) || actionType === "downgrade" || actionType === "enterprise"
    && "border border-[var(--color-border)] bg-[var(--color-card)]"
);
```

---

## 6. API — `POST /api/checkout/change-plan`

### 6.1 Responsabilidade

Endpoint server-only para trocar de plano. Requer sessão de admin válida.

### 6.2 Body esperado

```ts
{ plano: "entrada" | "gestao", ciclo: "mensal" | "anual" }
```

### 6.3 Lógica

```
1. Verificar sessão (cookie __session) → 401 se ausente
2. Verificar role === "admin" → 403 se não
3. Validar plano e ciclo
4. Se plano === plano_ativo da org → 400 "Plano já ativo"
5. Criar payment link Asaas com valor e ciclo corretos
6. Retornar { url: string }
```

### 6.4 Reutilização do código existente

Extrair a lógica de criação do payment link de `/api/checkout/create/route.ts`
para um helper em `src/lib/asaas/createPaymentLink.ts` e importar em ambas as rotas.

```ts
// src/lib/asaas/createPaymentLink.ts
export async function createPaymentLink(
  plano: PlanoId,
  ciclo: BillingCycle
): Promise<{ url: string }> { ... }
```

### 6.5 Diferença comportamental vs `/api/checkout/create`

| | `/api/checkout/create` | `/api/checkout/change-plan` |
|---|---|---|
| Auth | Não requerida | Obrigatória (admin) |
| Validação | Plano válido | Plano válido + ≠ plano atual |
| Log | Não | Sim — registrar troca no audit_log |

> **Segurança:** Aplicar a regra de audit_logs do projeto: evento imutável registrado
> em `audit_logs/{orgId}/events` com campos `tipo`, `plano_anterior`, `plano_novo`,
> `ciclo`, `uid`, `criado_em`.

---

## 7. Estados e Interatividade

| Estado | Gatilho | Comportamento |
|---|---|---|
| Loading inicial | Montagem do componente | Sem loading (dados chegam do Server Component) |
| CTA clicado | Click em Fazer upgrade/downgrade | Spinner no botão clicado; demais desabilitados |
| Checkout criado | Resposta OK da API | `window.location.href` → URL Asaas |
| Erro 400 "Plano já ativo" | Backend retorna 400 | Toast/inline: "Este já é seu plano ativo." |
| Erro de rede | fetch falha | Inline no card: "Erro de conexão. Tente novamente." |
| Toggle muda ciclo | Click no BillingToggle | Preços e CTAs atualizam instantaneamente |

---

## 8. Integração com `/app/configuracoes/faturamento`

Adicionar botão "Alterar plano" na página de faturamento existente:

```tsx
// Em src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx
// Na seção de "Plano atual", após o badge:

<Link href="/alterar-plano">
  <Button variant="secondary" size="sm" className="gap-2">
    <ArrowUpDown size={14} />
    Alterar plano
  </Button>
</Link>
```

---

## 9. Acessibilidade

| Requisito | Implementação |
|---|---|
| Card desabilitado | Botão "Plano atual" com `disabled` + `aria-label="Plano atual ativo"` |
| Card upgrade semântico | `aria-label="Fazer upgrade para Gestão"` no botão |
| Aviso de downgrade | `role="alert"` no container de aviso |
| Retorno ao dashboard | Link de back com texto descritivo, não apenas ícone |
| Heading hierarchy | `h1` na page, features-novas sem heading extra |

---

## 10. Arquivos a Criar/Modificar

| Operação | Arquivo | Descrição |
|---|---|---|
| CRIAR | `src/app/alterar-plano/page.tsx` | Server Component com auth guard + passa planoAtual |
| CRIAR | `src/app/alterar-plano/AlterarPlanoView.tsx` | Client Component com estado ciclo |
| CRIAR | `src/app/alterar-plano/PlanoCardAuth.tsx` | Card adaptado para contexto logado |
| CRIAR | `src/app/api/checkout/change-plan/route.ts` | Endpoint de troca de plano |
| CRIAR | `src/lib/asaas/createPaymentLink.ts` | Helper extraído (compartilhado com create) |
| MODIFICAR | `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | Adicionar botão "Alterar plano" |
| REUTILIZAR | `src/app/planos/BillingToggle.tsx` | Importar em AlterarPlanoView |
| VERIFICAR | `src/styles/tokens.css` | Confirmar `--color-warning` e `--color-warning-surface` |

---

## 11. Checklist de Conformidade

```
Auth & Segurança
[ ] Server Component verifica cookie e role antes de renderizar
[ ] Non-admin → redirect /app (sem expor a página)
[ ] Não autenticado → redirect /app/login
[ ] /api/checkout/change-plan rejeita plano === plano_ativo
[ ] Troca de plano registrada em audit_log (imutável)

Visual
[ ] data-portal no <main> (light-forced)
[ ] Card "Plano atual" visualmente diferenciado (borda cinza, opacity)
[ ] Badge "Plano atual" no topo do card correto
[ ] Bloco "Você vai desbloquear" visível em cards de upgrade
[ ] Aviso de downgrade com role="alert"
[ ] Botão "Plano atual" disabled com aria-label

Copy & Neurociência
[ ] Headline contextual: "Escolha seu próximo plano"
[ ] Subtítulo menciona plano atual do usuário por nome
[ ] CTA upgrade diferenciado por ciclo ("Fazer upgrade — Anual")
[ ] Features novas listadas como benefícios concretos no upgrade
[ ] Aviso de downgrade enquadra perda (loss aversion)

API
[ ] POST /api/checkout/change-plan implementado
[ ] Helper createPaymentLink.ts extraído e compartilhado
[ ] Validação de plano + ciclo server-side
[ ] audit_log registrado a cada troca

Navegação
[ ] Link "Voltar para Faturamento" acessível
[ ] Botão "Alterar plano" adicionado em /faturamento
[ ] Após checkout, usuário redirecionado ao Asaas (comportamento igual a /planos)
```

---

## 12. Diagrama de Fluxo Resumido

```
/app/configuracoes/faturamento
  └── [Alterar plano] ──────────────► /alterar-plano
                                           │
                               Detecta plano_ativo da org
                                           │
                               ┌──────────┴───────────┐
                            Plano atual           Outros planos
                           (disabled)         (upgrade/downgrade)
                                                       │
                                         [CTA] → POST /api/checkout/change-plan
                                                       │
                                             Cria payment link Asaas
                                                       │
                                           window.location → Asaas checkout
                                                       │
                                    Webhook Asaas → atualiza plano_ativo na org
```

---

*Spec gerada por Atlas (analyst) — 2026-06-11*
*Próximos passos:*
*1. @ux-design-expert valida visualmente os dois specs (PlanoCardAuth vs PlanoCard).*
*2. @architect confirma extração do helper Asaas e audit_log schema.*
*3. @sm cria stories a partir desta spec.*
