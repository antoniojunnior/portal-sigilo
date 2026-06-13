---
title: Frontend Spec — /planos
version: 1.0.0
author: Uma (ux-design-expert)
date: 2026-06-11
status: Draft
epic: Epic 9 — Checkout & Planos (Fase 9)
route: /planos
file: src/app/planos/page.tsx
---

# Frontend Spec: `/planos`

## 1. Visão Geral

| Atributo | Valor |
|---|---|
| Rota | `/planos` |
| Tipo | Página pública (fora do layout `(dashboard)`) |
| Propósito | Marketing + conversão → checkout Asaas |
| Contexto visual | **Light-forced** via `data-portal` (mesma convenção do portal de denúncias) |
| Auth | Não requerida |
| Responsividade | 1 coluna mobile → 3 colunas ≥ md |

A rota é servida sem `DashboardHeader` nem `PageContainer` — esses componentes
são exclusivos do layout autenticado. O padrão a seguir é o sistema de tokens CSS
(`src/styles/tokens.css`) e o catálogo de componentes `@/components/ui/`.

---

## 2. Diagnóstico — 5 Eixos de Não-Conformidade

### 2.1 Classes hardcoded → tokens ausentes

| Classe atual | Token correto | Elemento |
|---|---|---|
| `bg-gray-50` | `bg-[var(--color-bg-secondary)]` | `<main>` background |
| `text-gray-900` | `text-[var(--color-text-primary)]` | `h1`, `h2`, preço |
| `text-gray-600` | `text-[var(--color-text-secondary)]` | subtítulo da página |
| `text-gray-500` | `text-[var(--color-text-tertiary)]` | "/mês", "ou R$...", nota de rodapé |
| `text-gray-400` | `text-[var(--color-text-disabled)]` | features indisponíveis |
| `text-gray-700` | `text-[var(--color-text-secondary)]` | features disponíveis |
| `border-gray-200` | `border-[var(--color-border)]` | card padrão |
| `bg-white` | `bg-[var(--color-card)]` | card padrão + btn enterprise |
| `border-blue-500` | `border-[var(--color-primary)]` | card destaque |
| `bg-blue-50` | `bg-[var(--color-primary-surface)]` | card destaque |
| `ring-2 ring-blue-500` | `border-2 border-[var(--color-primary)]` ¹ | card destaque |
| `bg-blue-500` | `bg-[var(--color-primary)]` | badge "Mais popular" |
| `text-green-500` | `text-[var(--color-success)]` | ícone `<Check>` |
| `text-gray-300` | `text-[var(--color-text-disabled)]` | ícone `<X>` |
| `bg-red-50` | `bg-[var(--color-danger-surface)]` | erro inline |
| `text-red-600` | `text-[var(--color-danger)]` | erro inline |

> ¹ Substituir `ring-2 ring-blue-500` por `border-2 border-[var(--color-primary)]`
> elimina dependência do utilitário `ring` (stacking context imprevisível em Safari < 16).
> O efeito visual é equivalente.

### 2.2 Botões raw sem `<Button>` DS

Botões atuais com classes inline (`rounded-lg px-4 py-2 text-sm font-medium...`)
devem usar `<Button>` de `@/components/ui/Button`.

Mapeamento de variantes:

| Plano | Estado | Variante DS |
|---|---|---|
| Gestão (destaque) | Contratar | `variant="primary" size="lg" fullWidth` |
| Entrada (padrão) | Contratar | `variant="secondary" size="lg" fullWidth` |
| Enterprise | Falar com vendas | `variant="secondary" size="lg" fullWidth` |

### 2.3 `process.env` acessado diretamente no cliente

`handleEnterprise()` usa `process.env.NEXT_PUBLIC_SALES_CONTACT` diretamente.
Convenção do projeto: variáveis client-side passam por `clientEnv` em `src/lib/env.client.ts`.

### 2.4 `PlanoCard` co-localizado inline

`PlanoCard` definido no mesmo arquivo da page dificulta testes unitários.
Deve ser extraído para `src/app/planos/PlanoCard.tsx`.

### 2.5 Dark mode não controlado

Sem `data-portal`, a página responde ao sistema operacional. Para contexto de
marketing/conversão, deve permanecer light-forced (decisão de produto: 2026-06-11).

---

## 3. Estrutura de Layout

```
src/app/planos/
├── page.tsx          ← layout shell + import PlanoCard
└── PlanoCard.tsx     ← componente extraído (NOVO)
```

### 3.1 Hierarquia do DOM

```tsx
// page.tsx
<main data-portal className="min-h-screen bg-[var(--color-bg-secondary)] px-4 py-16">
  <div className="mx-auto max-w-6xl">

    {/* ── Header ── */}
    <div className="mb-12 text-center">
      <h1 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
        Planos Portal Sigilo
      </h1>
      <p className="mt-4 text-[var(--text-md)] text-[var(--color-text-secondary)]">
        Canal de denúncias corporativo com IA. Simples, seguro e eficaz.
      </p>
    </div>

    {/* ── Grid de planos ── */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANOS.map((plano) => (
        <PlanoCard key={plano.id} plano={plano} />
      ))}
    </div>

    {/* ── Nota de rodapé ── */}
    <p className="mt-10 text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
      Todos os planos incluem conformidade com LGPD, criptografia de dados e
      suporte por e-mail.
    </p>

  </div>
</main>
```

---

## 4. Spec do Componente `PlanoCard`

**Arquivo:** `src/app/planos/PlanoCard.tsx`

### 4.1 Interface

```tsx
import type { PlanoConfig } from "@/lib/types";

interface PlanoCardProps {
  plano: PlanoConfig;
}
```

### 4.2 Estado interno

```tsx
const [loading, setLoading] = useState(false);
const [erro, setErro] = useState<string | null>(null);
```

### 4.3 Handlers

```tsx
// Checkout Asaas — mantém lógica existente
async function handleContratar(): Promise<void> { ... }

// Enterprise CTA — usa clientEnv
function handleEnterprise(): void {
  window.location.href = clientEnv.salesContact;
}
```

### 4.4 Estrutura visual do card

```tsx
// Card wrapper
<div className={cn(
  "relative flex flex-col rounded-2xl border p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
  plano.destaque
    ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
    : "border border-[var(--color-border)] bg-[var(--color-card)]"
)}>

  {/* Badge "Mais popular" */}
  {plano.destaque && (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full
      bg-[var(--color-primary)] px-3 py-1 text-[var(--text-xs)] font-semibold
      text-[var(--color-on-primary)]">
      Mais popular
    </span>
  )}

  {/* Nome + preço */}
  <div className="mb-4">
    <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
      {plano.nome}
    </h2>
    {/* ... preço ... */}
  </div>

  {/* Lista de features */}
  <ul className="mb-6 flex-1 space-y-2">
    {plano.features.map((f) => (
      <li key={f.descricao} className={cn(
        "flex items-center gap-2 text-[var(--text-sm)]",
        f.disponivel ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-disabled)]"
      )}>
        {f.disponivel
          ? <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
          : <X className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)]" />
        }
        <span className={f.disponivel ? "" : "line-through opacity-50"}>
          {f.descricao}
        </span>
      </li>
    ))}
  </ul>

  {/* Erro inline */}
  {erro && (
    <div className="mb-3 rounded-xl border border-[var(--color-danger)]/20
      bg-[var(--color-danger-surface)] px-3 py-2 text-[var(--text-xs)]
      text-[var(--color-danger)]">
      {erro}
    </div>
  )}

  {/* CTA */}
  <div className="mt-auto">
    {isEnterprise ? (
      <Button variant="secondary" size="lg" fullWidth onClick={handleEnterprise}>
        Falar com vendas
      </Button>
    ) : (
      <Button
        variant={plano.destaque ? "primary" : "secondary"}
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleContratar}
      >
        Contratar
      </Button>
    )}
  </div>

</div>
```

---

## 5. Tokens Aplicados — Referência Rápida

| Token | Valor light | Uso nesta página |
|---|---|---|
| `--color-bg-secondary` | `#F7FAFB` | Background `<main>` |
| `--color-card` | `#FFFFFF` | Background card padrão |
| `--color-primary-surface` | `#E8F2F5` | Background card destaque |
| `--color-primary` | `#2A6070` | Border destaque, badge, btn primary |
| `--color-on-primary` | `#FFFFFF` | Texto sobre fundo primary |
| `--color-border` | `#D3E3E8` | Border card padrão |
| `--color-text-primary` | `#0F2030` | Headings, preço |
| `--color-text-secondary` | `#3D5A6A` | Features disponíveis, subtítulo |
| `--color-text-tertiary` | `#6A8898` | Preço anual, rodapé |
| `--color-text-disabled` | `#A8C0C8` | Features indisponíveis |
| `--color-success` | `#1A7A5A` | Ícone check |
| `--color-danger` | `#B03030` | Texto de erro |
| `--color-danger-surface` | `#FDE9E9` | Background de erro |
| `--shadow-sm` | ver tokens.css | Card default |
| `--shadow-md` | ver tokens.css | Card hover |
| `--text-3xl` | `36px` | H1 da página |
| `--text-xl` | `22px` | Nome do plano |
| `--text-md` | `16px` | Subtítulo da página |
| `--text-sm` | `13px` | Features, rodapé |
| `--text-xs` | `12px` | Badge, erro |

---

## 6. Variáveis de Ambiente

### 6.1 Alteração em `src/lib/env.client.ts`

Adicionar `salesContact` ao objeto `clientEnv`:

```ts
export const clientEnv = {
  firebase: { ... },
  salesContact: process.env.NEXT_PUBLIC_SALES_CONTACT ?? "mailto:vendas@portalsigilo.com.br",
} as const;
```

### 6.2 Uso em `PlanoCard.tsx`

```ts
import { clientEnv } from "@/lib/env.client";

function handleEnterprise(): void {
  window.location.href = clientEnv.salesContact;
}
```

### 6.3 Variáveis necessárias

| Variável | Obrigatória | Default |
|---|---|---|
| `NEXT_PUBLIC_SALES_CONTACT` | Não | `mailto:vendas@portalsigilo.com.br` |

Verificar presença em `.env.example`.

---

## 7. Estados e Interatividade

### 7.1 Estado de loading do checkout

- `loading={true}` → `<Button>` renderiza spinner interno automaticamente + `disabled`
- Texto do botão não muda (spinner substitui `iconLeft`)
- Não adicionar texto "Aguarde..." — o spinner do DS é suficiente

### 7.2 Estado de erro

- Erro exibido no card individual, acima do CTA
- Estilo: `rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)]`
- Limpar erro ao iniciar nova tentativa (`setErro(null)` no início de `handleContratar`)

### 7.3 Hover no card

```
shadow-[var(--shadow-sm)] → shadow-[var(--shadow-md)]
transition-shadow duration-[var(--duration-normal)]
```

---

## 8. Acessibilidade (WCAG AA)

| Requisito | Implementação |
|---|---|
| Contraste texto/fundo | Todos os pares de token atingem ≥ 4.5:1 em light mode |
| Touch target mínimo 44px | `<Button size="lg">` min-height 52px ✓ |
| Botão desabilitado | `disabled` attr nativo via prop `loading` do `<Button>` |
| Lista de features semântica | `<ul><li>` mantido |
| Landmark da página | `<main>` com `data-portal` ✓ |
| Ícones decorativos | `Check`/`X` com `aria-hidden` implícito (Lucide default) |
| Erro programático | Adicionar `role="alert"` no container de erro para leitores de tela |

```tsx
{erro && (
  <div role="alert" className="...">
    {erro}
  </div>
)}
```

---

## 9. Arquivos a Criar/Modificar

| Operação | Arquivo | Descrição |
|---|---|---|
| CRIAR | `src/app/planos/PlanoCard.tsx` | Extração do componente inline |
| MODIFICAR | `src/app/planos/page.tsx` | Remover PlanoCard inline, aplicar tokens, `data-portal` |
| MODIFICAR | `src/lib/env.client.ts` | Adicionar `salesContact` |
| VERIFICAR | `.env.example` | Confirmar `NEXT_PUBLIC_SALES_CONTACT` documentado |

---

## 10. Checklist de Conformidade

```
Tokens & Cores
[ ] Nenhuma classe Tailwind de cor hardcoded (gray-*, blue-*, red-*, green-*)
[ ] Todas as cores via var(--color-*) ou var(--text-*)
[ ] data-portal no <main> (light-forced)

Componentes DS
[ ] Todos os botões usam <Button> de @/components/ui/Button
[ ] variant="primary" apenas no plano destaque
[ ] variant="secondary" nos demais planos e Enterprise
[ ] size="lg" fullWidth em todos os CTAs de plano
[ ] role="alert" no container de erro inline

Estrutura
[ ] PlanoCard extraído para src/app/planos/PlanoCard.tsx
[ ] page.tsx importa PlanoCard do arquivo co-localizado
[ ] Nenhuma lógica de negócio no page.tsx (apenas iteração de PLANOS[])

Env
[ ] clientEnv.salesContact com fallback em env.client.ts
[ ] process.env.NEXT_PUBLIC_SALES_CONTACT removido do componente

Hover / Shadow
[ ] Card default: shadow-[var(--shadow-sm)]
[ ] Card hover: shadow-[var(--shadow-md)] com transition-shadow
[ ] Card destaque: border-2 border-[var(--color-primary)] (sem ring-*)

Tipografia
[ ] H1 usa text-[var(--text-3xl)]
[ ] Subtítulo usa text-[var(--text-md)]
[ ] Features/rodapé usam text-[var(--text-sm)]
[ ] Badge "Mais popular" usa text-[var(--text-xs)]
```

---

*Spec gerada por Uma (ux-design-expert) — 2026-06-11*
*Próximo passo: @dev implementa via story da Fase 9 ou task avulsa de conformidade DS.*
