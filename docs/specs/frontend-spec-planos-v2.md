---
title: Frontend Spec — /planos v2 (anual toggle + copy neuroscience)
version: 2.0.0
author: Atlas (analyst)
date: 2026-06-11
status: Draft
epic: Epic 9 — Checkout & Planos (Revisão)
route: /planos
files:
  - src/app/planos/page.tsx
  - src/app/planos/PlanoCard.tsx
  - src/app/planos/BillingToggle.tsx  (NOVO)
  - src/lib/planos.ts
  - src/app/api/checkout/create/route.ts
depends_on: frontend-spec-planos.md (v1.0)
---

# Frontend Spec: `/planos` — v2

## 1. Contexto e Motivação

A v1 da rota `/planos` atendia corretamente usuários não-logados com visual
conformado ao Design System. Esta v2 acrescenta duas camadas:

1. **Toggle mensal/anual** — destaque visual ao preço anual (menor e mais rentável).
2. **Copy orientado por neurociência** — headline, subtítulo, badges e CTAs reescritos
   para maximizar conversão usando anchoring, loss aversion e social proof.

A lógica de checkout existente (Asaas) será estendida para suportar `ciclo: "mensal" | "anual"`.

---

## 2. Análise de Melhorias — Diagnóstico Copy Atual

| Elemento | Texto atual | Problema | Texto v2 |
|---|---|---|---|
| `<h1>` | "Planos Portal Sigilo" | Genérico, sem benefício | "Proteção real. Conformidade garantida." |
| Subtítulo | "Canal de denúncias corporativo com IA. Simples, seguro e eficaz." | Lista features, não benefícios | "Implante um canal de denúncias LGPD-compliant em minutos — sem jurídico, sem infraestrutura." |
| Preço anual | "ou R$ 97/mês no plano anual" | Fonte terciária, invisível | Badge proeminente + comparador visual |
| CTA Entrada | "Contratar" | Sem ancoragem de contexto | "Começar agora" (mensal) / "Garantir desconto anual" (anual) |
| CTA Gestão | "Contratar" | Igual ao menor plano | "Escolher o mais popular" (mensal) / "Garantir desconto anual" (anual) |
| Rodapé | "Todos os planos incluem…" | Posicionado após decisão | Mover para antes dos cards como trust signal |

---

## 3. Princípios de Neurociência Aplicados

### 3.1 Anchoring
- O toggle padrão é **"Anual"** — apresenta o preço menor primeiro.
  O usuário vê R$97 e R$197 antes de ver R$117 e R$227.
- Ordem dos cards: Entrada → Gestão (destaque) → Enterprise.
  O Gestão funciona como âncora descendente: faz o Entrada parecer acessível
  e o Enterprise justificado.

### 3.2 Loss Aversion (Prospect Theory)
- Badge anual: **"Economize R$240/ano"** (não "10% de desconto").
  Perda concreta em reais é mais motivante que percentual abstrato.
- Tooltip no toggle: "Ao escolher anual, você evita pagar R$240 a mais por ano".

### 3.3 Social Proof + Authority
- Badge "Mais popular" permanece no Gestão (já implementado).
- Rodapé reposicionado como trust signal pré-decisão: "LGPD, ISO 27001, criptografia
  ponta a ponta — incluso em todos os planos."

### 3.4 Decoy Effect
- Três opções (Entrada / Gestão / Enterprise) criam o efeito decoy naturalmente:
  Gestão é a opção "racional" entre o básico e o premium sem preço.

### 3.5 Cognitive Load Reduction
- Toggle binário (não slider, não radio group) reduz fricção decisória.
- Features indisponíveis com `opacity-50 line-through` — manter (já implementado).
  Isso usa contraste para focar atenção no que está disponível.

---

## 4. Estrutura de Dados — Extensões

### 4.1 Novo campo em `PlanoConfig` (src/lib/planos.ts)

```ts
export interface PlanoConfig {
  // ... campos existentes ...
  economiaAnual?: number;  // (precoMensal - precoAnual) * 12
  tagline?: string;        // frase curta de posicionamento do plano
}
```

### 4.2 Valores calculados

| Plano | precoMensal | precoAnual | economiaAnual |
|---|---|---|---|
| Entrada | 117 | 97 | 240 |
| Gestão | 227 | 197 | 360 |
| Enterprise | null | null | null |

### 4.3 Taglines sugeridas

| Plano | Tagline |
|---|---|
| Entrada | "Para empresas que estão começando" |
| Gestão | "Para quem precisa de controle total" |
| Enterprise | "Para grupos e organizações complexas" |

### 4.4 Novo tipo `BillingCycle`

```ts
// src/lib/types/index.ts — adicionar
export type BillingCycle = "mensal" | "anual";
```

---

## 5. Novos Componentes

### 5.1 `BillingToggle` — `src/app/planos/BillingToggle.tsx`

Componente client-side controlado pelo estado da page.

#### Interface

```tsx
interface BillingToggleProps {
  value: BillingCycle;
  onChange: (ciclo: BillingCycle) => void;
}
```

#### Visual

```
┌─────────────────────────────────────────┐
│  Mensal     ●───── Anual  🏷 2 meses grátis  │
└─────────────────────────────────────────┘
```

- Toggle pill com dois estados (não checkbox).
- Estado **Anual** ativo por padrão.
- Badge inline ao lado: `🏷 2 meses grátis` — visível apenas quando Anual ativo.
  Texto alternativo aceitável: `Economize até R$360/ano`.
- Token de cor do badge: `bg-[var(--color-success)]/10 text-[var(--color-success)]`
  com border `border border-[var(--color-success)]/30`.

#### Markup skeleton

```tsx
<div className="flex items-center gap-3 rounded-full border border-[var(--color-border)]
  bg-[var(--color-card)] px-4 py-2 shadow-[var(--shadow-sm)]">

  <button
    onClick={() => onChange("mensal")}
    className={cn(
      "rounded-full px-4 py-1.5 text-[var(--text-sm)] font-medium transition-colors",
      value === "mensal"
        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
    )}
  >
    Mensal
  </button>

  <button
    onClick={() => onChange("anual")}
    className={cn(
      "rounded-full px-4 py-1.5 text-[var(--text-sm)] font-medium transition-colors",
      value === "anual"
        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
    )}
  >
    Anual
  </button>

  {value === "anual" && (
    <span className="rounded-full border border-[var(--color-success)]/30
      bg-[var(--color-success)]/10 px-2.5 py-0.5
      text-[var(--text-xs)] font-semibold text-[var(--color-success)]">
      2 meses grátis
    </span>
  )}
</div>
```

---

### 5.2 `PlanoCard` v2 — extensão da interface

```tsx
export interface PlanoCardProps {
  plano: PlanoConfig;
  ciclo: BillingCycle;           // NOVO
  isCurrentPlan?: boolean;       // para reutilização em /alterar-plano
  onAction?: () => void;         // override do handler (para /alterar-plano)
}
```

#### Lógica de preço conforme ciclo

```tsx
const preco = ciclo === "anual" ? plano.precoAnual : plano.precoMensal;
const precoComparativo = ciclo === "anual" ? plano.precoMensal : null;
```

#### Bloco de precificação revisado

```tsx
{/* Bloco de preço */}
{isEnterprise ? (
  <p className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
    Sob consulta
  </p>
) : (
  <div className="space-y-1">
    {/* Preço principal */}
    <div className="flex items-end gap-1">
      <span className="text-[var(--text-4xl)] font-extrabold tracking-tight text-[var(--color-text-primary)]">
        R$ {preco}
      </span>
      <span className="mb-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        /mês
      </span>
    </div>

    {/* Cobrança anual + economia */}
    {ciclo === "anual" && (
      <div className="space-y-0.5">
        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
          Cobrado R$ {(plano.precoAnual! * 12).toLocaleString("pt-BR")} por ano
        </p>
        {plano.economiaAnual && (
          <span className="inline-flex items-center gap-1 rounded-full
            border border-[var(--color-success)]/30 bg-[var(--color-success)]/10
            px-2 py-0.5 text-[var(--text-xs)] font-semibold text-[var(--color-success)]">
            🏷 Economize R$ {plano.economiaAnual.toLocaleString("pt-BR")}/ano
          </span>
        )}
      </div>
    )}

    {/* Preço mensal como referência quando anual */}
    {ciclo === "anual" && precoComparativo && (
      <p className="text-[var(--text-xs)] text-[var(--color-text-disabled)] line-through">
        R$ {precoComparativo}/mês no plano mensal
      </p>
    )}

    {/* Cobrança mensal */}
    {ciclo === "mensal" && (
      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
        ou R$ {plano.precoAnual}/mês no plano anual
      </p>
    )}
  </div>
)}
```

#### CTA revisado por ciclo

| Plano | Ciclo | CTA |
|---|---|---|
| Entrada | Mensal | "Começar agora" |
| Entrada | Anual | "Garantir desconto anual" |
| Gestão (destaque) | Mensal | "Escolher o mais popular" |
| Gestão (destaque) | Anual | "Garantir desconto anual" |
| Enterprise | — | "Falar com vendas" (sem mudança) |

---

## 6. Layout da Page — v2

### 6.1 Hierarquia DOM revisada

```tsx
<main data-portal className="min-h-screen bg-[var(--color-bg-secondary)] px-4 py-16">
  <div className="mx-auto max-w-6xl">

    {/* Trust signal pré-decisão */}
    <p className="mb-6 text-center text-[var(--text-xs)] font-medium
      uppercase tracking-widest text-[var(--color-text-tertiary)]">
      LGPD · ISO 27001 · Criptografia ponta a ponta · Suporte incluso
    </p>

    {/* Headline e subtítulo */}
    <div className="mb-8 text-center">
      <h1 className="text-[var(--text-4xl)] font-extrabold leading-tight
        tracking-tight text-[var(--color-text-primary)]">
        Proteção real.<br className="hidden sm:block" />
        <span className="text-[var(--color-primary)]"> Conformidade garantida.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[var(--text-md)]
        text-[var(--color-text-secondary)]">
        Implante um canal de denúncias LGPD-compliant em minutos —
        sem jurídico, sem infraestrutura.
      </p>
    </div>

    {/* Toggle billing */}
    <div className="mb-10 flex justify-center">
      <BillingToggle value={ciclo} onChange={setCiclo} />
    </div>

    {/* Grid de planos */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANOS.map((plano) => (
        <PlanoCard key={plano.id} plano={plano} ciclo={ciclo} />
      ))}
    </div>

    {/* Nota de rodapé */}
    <p className="mt-10 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
      Sem fidelidade no plano mensal. Cancele quando quiser.
    </p>

  </div>
</main>
```

### 6.2 Estado da page (client component)

A page precisa ser `"use client"` para gerenciar o estado do toggle.

```tsx
"use client";

import { useState } from "react";
import type { BillingCycle } from "@/lib/types";

export default function PlanosPage() {
  const [ciclo, setCiclo] = useState<BillingCycle>("anual"); // default: anual
  // ...
}
```

---

## 7. Extensão da API de Checkout

### 7.1 Rota: `POST /api/checkout/create`

O endpoint deve aceitar `ciclo` como parâmetro:

```ts
// Body esperado
{ plano: "entrada" | "gestao", ciclo: "mensal" | "anual" }
```

```ts
// Preços por ciclo
const PLANOS_CONFIG = {
  entrada: {
    mensal: { nome: "Portal Sigilo — Entrada (Mensal)", value: 117.00, cycle: "MONTHLY" },
    anual:  { nome: "Portal Sigilo — Entrada (Anual)",  value: 97.00,  cycle: "YEARLY" },
  },
  gestao: {
    mensal: { nome: "Portal Sigilo — Gestão (Mensal)", value: 227.00, cycle: "MONTHLY" },
    anual:  { nome: "Portal Sigilo — Gestão (Anual)",  value: 197.00, cycle: "YEARLY" },
  },
} as const;
```

> **Nota arquitetural:** O Asaas usa `cycle: "YEARLY"` para cobranças anuais.
> Verificar se o endpoint de `paymentLinks` suporta YEARLY antes da implementação.
> Alternativa: ciclo anual cobra `value * 12` com `cycle: "MONTHLY"` e período de 12 meses.

### 7.2 Validação de ciclo

```ts
type Ciclo = "mensal" | "anual";

function isCicloValido(ciclo: unknown): ciclo is Ciclo {
  return ciclo === "mensal" || ciclo === "anual";
}
```

---

## 8. Estado de Loading e Feedback

| Cenário | Comportamento |
|---|---|
| Toggle troca ciclo | Preços atualizam instantaneamente (estado local, sem rede) |
| CTA clicado | Spinner no botão, demais botões não afetados |
| Checkout criado | `window.location.href` → URL Asaas |
| Erro de rede | Mensagem inline no card afetado |

---

## 9. Responsividade

| Breakpoint | Layout |
|---|---|
| < md (< 768px) | 1 coluna; toggle centralizado; cards empilhados |
| ≥ md (≥ 768px) | 3 colunas; card destaque pode ter `scale-105` sutil |

Card destaque em ≥ md:
```tsx
plano.destaque && "md:scale-[1.03] md:z-10"
```

---

## 10. Acessibilidade

| Requisito | Implementação |
|---|---|
| Toggle acessível | `role="group"` + `aria-label="Período de cobrança"` no wrapper |
| Toggle botões | `aria-pressed={value === "mensal"}` / `aria-pressed={value === "anual"}` |
| Badge economia | Texto explícito (não só emoji): `🏷 Economize R$ 240/ano` |
| Preço riscado | `aria-label="Preço mensal sem desconto: R$ 117"` para leitores de tela |

---

## 11. Arquivos a Criar/Modificar

| Operação | Arquivo | Mudança |
|---|---|---|
| CRIAR | `src/app/planos/BillingToggle.tsx` | Novo componente toggle |
| MODIFICAR | `src/app/planos/PlanoCard.tsx` | Aceitar `ciclo`, novo bloco de preço, CTAs revisados |
| MODIFICAR | `src/app/planos/page.tsx` | `"use client"`, estado ciclo, novo copy, BillingToggle |
| MODIFICAR | `src/lib/planos.ts` | Adicionar `economiaAnual` e `tagline` em cada plano |
| MODIFICAR | `src/lib/types/index.ts` | Adicionar `BillingCycle`, `economiaAnual?`, `tagline?` em `PlanoConfig` |
| MODIFICAR | `src/app/api/checkout/create/route.ts` | Suporte a `ciclo`, tabela de preços expandida |

---

## 12. Checklist de Conformidade v2

```
Copy & Neurociência
[ ] H1 orientado a benefício ("Proteção real. Conformidade garantida.")
[ ] Subtítulo menciona LGPD-compliant e "sem jurídico, sem infra"
[ ] Trust signal acima do fold (LGPD · ISO · Criptografia)
[ ] CTAs diferenciados por ciclo (mensal vs anual)
[ ] Badge de economia em reais (não %)

Toggle Anual
[ ] BillingToggle renderiza com default "anual"
[ ] Badge "2 meses grátis" visível quando anual ativo
[ ] Preço anual exibe R$/mês + total anual cobrado + badge economia
[ ] Preço mensal riscado como comparador quando ciclo = anual
[ ] Toggle acessível (aria-pressed, role=group)

Cards
[ ] PlanoCard aceita prop ciclo
[ ] Card destaque tem scale sutil em ≥ md
[ ] economiaAnual calculado corretamente: (precoMensal - precoAnual) * 12
[ ] tagline exibida abaixo do nome do plano

API
[ ] checkout/create aceita e valida campo ciclo
[ ] Tabela PLANOS_CONFIG expandida com preços por ciclo
[ ] Enterprise não gera chamada ao endpoint (CTA = vendas)
```

---

*Spec gerada por Atlas (analyst) — 2026-06-11*
*Próximo passo: @ux-design-expert valida visualmente o toggle; @dev implementa.*
