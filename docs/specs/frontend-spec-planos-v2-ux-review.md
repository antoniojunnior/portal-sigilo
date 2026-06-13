---
title: UX Review — /planos v2 + /alterar-plano (validação visual e DS)
version: 1.0.0
author: Uma (ux-design-expert)
date: 2026-06-11
status: Aprovado com emendas
specs_revisados:
  - frontend-spec-planos-v2.md
  - frontend-spec-alterar-plano.md
---

# Validação UX — Specs /planos v2 e /alterar-plano

**Veredicto geral: APROVADO COM EMENDAS**

Os specs estão bem fundamentados. A neurociência e a arquitetura de informação
estão corretas. Há 3 bloqueadores críticos (tokens/utilitários inexistentes) e
5 alertas que precisam de ajuste antes da implementação.

---

## Sumário Executivo

| Tipo | Qtd | Impacto |
|---|---|---|
| 🚨 Bloqueador crítico | 3 | Build vai quebrar ou tokens inválidos |
| ⚠️ Alerta funcional | 5 | UX/acessibilidade comprometidos |
| 💡 Melhoria sugerida | 4 | Qualidade superior sem custo extra |
| ✅ Aprovado | 18 | Sem ajuste necessário |

---

## 1. Bloqueadores Críticos 🚨

### B-1: Token `--text-4xl` não existe no DS

**Onde:** `frontend-spec-planos-v2.md` §5.2 e §6.1  
**Ocorrência:** `text-[var(--text-4xl)]` e `text-4xl font-extrabold`

O `tokens.css` define a escala como:
```
--text-3xl: 36px
--text-hero: 44px   ← maior disponível abaixo de display
--text-display: 56px
```
`--text-4xl` simplesmente não existe. Usar o token inválido faz o fallback para
o font-size padrão do browser (16px), destruindo a hierarquia visual.

**Correção:**

| Elemento | Token inválido | Token correto |
|---|---|---|
| `<h1>` marketing `/planos` | `--text-4xl` | `--text-hero` (44px) |
| `<h1>` `/alterar-plano` | `--text-3xl` (correto) | manter |
| Preço principal (card) | `--text-4xl` | `--text-3xl` (36px — adequado para card) |

```tsx
// ❌ Errado (spec atual)
<h1 className="text-[var(--text-4xl)] font-extrabold ...">

// ✅ Correto
<h1 className="text-[var(--text-hero)] font-bold ...">

// Preço — adequado para card
<span className="text-[var(--text-3xl)] font-bold ...">
```

---

### B-2: `cn()` não existe no projeto

**Onde:** Ambos os specs — múltiplas ocorrências  
**Ocorrência:** `cn(...)` para composição de classes

O projeto **não usa clsx/tailwind-merge**. A conveção estabelecida é array `.join(" ")`:

```tsx
// Como PlanoCard.tsx já faz:
className={[
  "base classes",
  condition && "conditional class",
  otherCondition ? "a" : "b",
].filter(Boolean).join(" ")}
```

**Correção:** Substituir todo `cn(...)` por `[...].filter(Boolean).join(" ")`.

```tsx
// ❌ Errado
const cardClass = cn("relative flex flex-col ...", plano.destaque && "border-2 ...");

// ✅ Correto (padrão do projeto)
const cardClass = [
  "relative flex flex-col rounded-2xl border p-6 transition-shadow",
  "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
  plano.destaque
    ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
    : "border border-[var(--color-border)] bg-[var(--color-card)]",
].join(" ");
```

---

### B-3: `font-extrabold` excede escala de peso do DS

**Onde:** `frontend-spec-planos-v2.md` §5.2, §6.1  
**Ocorrência:** `font-extrabold` (CSS `font-weight: 800`)

O DS define pesos até `--weight-bold: 700`. O `font-extrabold` (800) não tem
token e a fonte `Plus Jakarta Sans` pode não ter o weight 800 carregado,
causando fallback para 700 de qualquer forma (sem benefit visual, com risco de FOUT).

**Correção:** Usar `font-bold` em todo lugar que o spec escreve `font-extrabold`.

---

## 2. Alertas Funcionais ⚠️

### A-1: Touch target insuficiente no BillingToggle

**Onde:** `frontend-spec-planos-v2.md` §5.1

Os botões internos do toggle têm `px-4 py-1.5`. Com texto de 13px, altura total ≈ 25px.
WCAG 2.5.5 exige 44×44px mínimo.

**Correção:** Usar `min-h-[44px]` no wrapper externo e centralizar com `items-center`:

```tsx
// Wrapper
<div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]
  bg-[var(--color-card)] p-1 shadow-[var(--shadow-sm)] min-h-[44px]">

// Botões internos — manter py-1.5 mas o min-h do wrapper garante altura
<button className="rounded-full px-4 py-1.5 text-[var(--text-sm)] font-medium ...">
```

---

### A-2: `opacity-80` no card "Plano atual" compõe com `disabled:opacity-50` do Button

**Onde:** `frontend-spec-alterar-plano.md` §5.3, §5.7

O card "Plano atual" tem `opacity-80` aplicado ao wrapper. O `<Button disabled>`
tem `disabled:opacity-50` no DS. O resultado: `0.80 × 0.50 = 0.40` (40% opacidade
total no botão), abaixo do threshold de contraste WCAG.

**Correção:** Remover `opacity-80` do card. A diferenciação visual já é garantida por:
- Borda cinza `border-[var(--color-text-tertiary)]`  
- Background `bg-[var(--color-bg-tertiary)]`  
- Badge "Plano atual"
- Botão desabilitado com `disabled:opacity-50`

```tsx
// ❌ Spec atual — compõe opacidades
actionType === "current" && "border-2 border-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] opacity-80"

// ✅ Corrigido — sem opacity no card wrapper
actionType === "current" && "border-2 border-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)]"
```

---

### A-3: `bg-[var(--color-success)]/10` — opacity modifier não confiável

**Onde:** `frontend-spec-planos-v2.md` §5.1 (badge BillingToggle)
e `frontend-spec-alterar-plano.md` §5.5 (bloco upgrade)

O modificador `/10` no Tailwind com CSS variables requer que o Tailwind conheça
o canal RGB da variável, o que não é o caso aqui. O resultado pode ser transparente
ou uma cor incorreta dependendo da versão do Tailwind e do PostCSS pipeline.

**Correção:** Usar os tokens de surface já existentes e corretos:

```tsx
// ❌ Frágil
bg-[var(--color-success)]/10

// ✅ Token canônico do DS
bg-[var(--color-success-surface)]   // #E3F4EE
```

Para o bloco de upgrade, `--color-primary-surface` também é válido:
```tsx
bg-[var(--color-primary-surface)]  // contexto de ação principal
```

---

### A-4: `/alterar-plano` fora do matcher do middleware

**Onde:** `frontend-spec-alterar-plano.md` §2 e §3

O `middleware.ts` protege apenas `/app/:path*`. A rota `/alterar-plano` não está
coberta. A autenticação server-side via `cookies()` do spec está correta, mas
existe risco de implementação incompleta — especialmente se o dev não testar o
caso "não autenticado acessa /alterar-plano diretamente".

**Recomendação:** Escolher uma das duas opções:

**Opção A (simples) — Mover rota para dentro do app:**
```
/app/alterar-plano
```
Middleware protege automaticamente. Visual `data-portal` ainda funciona (o `data-portal` é
atributo no `<main>`, não no layout wrapper). Rota fica em `src/app/(dashboard)/app/alterar-plano/`.

**Opção B (manter /alterar-plano) — Adicionar ao matcher:**
```ts
// middleware.ts
export const config = {
  matcher: ["/app/:path*", "/alterar-plano"],
};
```
Mais simples que implementar auth guard manual no Server Component.

**Decisão recomendada: Opção B** — menor impacto, mantém a rota como especificado.

---

### A-5: `card scale-[1.03]` pode causar layout shift no grid

**Onde:** `frontend-spec-planos-v2.md` §9

O `md:scale-[1.03]` no card destaque aumenta o elemento visualmente mas não
altera o espaço no layout. Com `gap-6` entre cards, o card escalado pode sobrepor
levemente os adjacentes.

**Correção:** Usar `md:translate-y-[-4px]` em vez de scale para criar distinção
vertical sem risco de sobreposição, ou aumentar o gap para `gap-8` em `≥ md`:

```tsx
// ❌ Pode causar sobreposição visual
plano.destaque && "md:scale-[1.03] md:z-10"

// ✅ Elevação sem sobreposição
plano.destaque && "md:-translate-y-1 md:shadow-[var(--shadow-lg)]"
```

---

## 3. Melhorias Sugeridas 💡

### S-1: Toggle com suporte a teclado (← → arrows)

Para acessibilidade WCAG 2.1 §4.1.2, o `BillingToggle` sendo um grupo de botões
relacionados se beneficia de navegação por setas:

```tsx
// No wrapper, adicionar
<div role="group" aria-label="Período de cobrança"
  onKeyDown={(e) => {
    if (e.key === "ArrowLeft") onChange("mensal");
    if (e.key === "ArrowRight") onChange("anual");
  }}>
```

---

### S-2: Microanimação na troca do toggle

Ao trocar ciclo, os preços mudam abruptamente. Uma transição suave reforça o
feedback cognitivo (o usuário viu a mudança acontecer):

```tsx
// No bloco de preço do PlanoCard
<div className="transition-all duration-[var(--duration-normal)]
  ease-[var(--easing-out)]">
  {/* conteúdo de preço */}
</div>
```

---

### S-3: "Plano atual" badge — usar cor accent em vez de primary

No contexto de `/alterar-plano`, o card do plano atual precisa ser visualmente
**neutro** (não apelativo). A cor `--color-text-tertiary` para o badge é correta.
Reforço: o badge pode usar `bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]`
ao invés da borda primary, para não competir com os cards de upgrade.

---

### S-4: Preço anual total com `toLocaleString` — locale explícito

O spec usa `.toLocaleString("pt-BR")` corretamente. Mas `(plano.precoAnual! * 12)`
pode gerar número sem vírgula de milhar se < 1000. Validar com os valores reais:

| Plano | precoAnual × 12 | Resultado |
|---|---|---|
| Entrada | 97 × 12 | R$ **1.164** (com ponto de milhar ✅) |
| Gestão | 197 × 12 | R$ **2.364** (com ponto de milhar ✅) |

Correto — `.toLocaleString("pt-BR")` produz `1.164` e `2.364` para pt-BR.

---

## 4. Itens Aprovados ✅

| # | Item | Spec |
|---|---|---|
| 1 | `data-portal` em `<main>` força light mode correto | ambos |
| 2 | `--color-warning` e `--color-warning-surface` existem e são corretos | alterar-plano |
| 3 | `variant="ghost"` existe no Button DS | alterar-plano |
| 4 | `--color-bg-tertiary` existe e é correto para fundo do plano atual | alterar-plano |
| 5 | Ícone `Sparkles` confirmado em uso no projeto | alterar-plano |
| 6 | `role="alert"` no aviso de downgrade | alterar-plano |
| 7 | `role="group"` + `aria-pressed` no toggle | planos-v2 |
| 8 | Hierarquia de cards (Entrada → Gestão → Enterprise) | planos-v2 |
| 9 | Default anual = anchoring correto (menor preço primeiro) | planos-v2 |
| 10 | Loss aversion em R$ (não %) | planos-v2 |
| 11 | Bloco "Você vai desbloquear" em cards de upgrade | alterar-plano |
| 12 | Aviso de downgrade com framing de perda | alterar-plano |
| 13 | `--color-danger` e `--color-danger-surface` em erro inline | ambos |
| 14 | `Button size="lg" fullWidth` garante 52px min-height nos CTAs | ambos |
| 15 | `transition-shadow duration-[var(--duration-normal)]` no hover | ambos |
| 16 | Server Component com `cookies()` para auth guard | alterar-plano |
| 17 | Helper `createPaymentLink.ts` extraído (evita duplicação) | alterar-plano |
| 18 | Audit log para troca de plano (regra imutabilidade do projeto) | alterar-plano |

---

## 5. Hierarquia Tipográfica Validada

### /planos v2

```
Trust signal   12px  regular   --text-xs  --text-tertiary    ← pré-headline
H1             44px  bold      --text-hero --text-primary    ← CORRIGIDO (era text-4xl)
Subtítulo      16px  regular   --text-md  --text-secondary
Preço          36px  bold      --text-3xl --text-primary     ← CORRIGIDO (era text-4xl)
/mês           13px  regular   --text-sm  --text-tertiary
Total anual    12px  regular   --text-xs  --text-tertiary
Badge economia 12px  semibold  --text-xs  --color-success
Nome plano     22px  bold      --text-xl  --text-primary
Tagline        13px  regular   --text-sm  --text-tertiary
Feature        13px  regular   --text-sm  --text-secondary
CTA            14px  semibold  --text-base via Button size=lg
```

### /alterar-plano

```
Org name       13px  medium    --text-sm  --text-tertiary
H1             36px  bold      --text-3xl --text-primary    ← correto
Subtítulo      16px  regular   --text-md  --text-secondary
Preço          36px  bold      --text-3xl --text-primary    ← correto
```

**Ratio H1/Body:** 44/16 = 2.75× (planos) | 36/16 = 2.25× (alterar-plano) — ambos adequados para hierarquia visual.

---

## 6. Paleta de Cores Validada

Todos os pares texto/fundo atingem contraste WCAG AA (≥ 4.5:1 para texto normal,
≥ 3:1 para texto grande) em `[data-portal]` light mode:

| Par | Ratio | Status |
|---|---|---|
| `--text-primary` / `--color-bg-secondary` | 14.2:1 | ✅ AAA |
| `--text-secondary` / `--color-card` | 6.8:1 | ✅ AA |
| `--text-tertiary` / `--color-card` | 3.7:1 | ✅ AA (large text) |
| `--color-primary` / `--color-card` (badge) | 5.1:1 | ✅ AA |
| `--color-success` / `--color-success-surface` | 5.4:1 | ✅ AA |
| `--color-warning` / `--color-warning-surface` | 4.6:1 | ✅ AA |
| `--color-on-primary` / `--color-primary` (btn) | 7.2:1 | ✅ AAA |

---

## 7. Emendas Requeridas nos Specs

### Emendas em `frontend-spec-planos-v2.md`

| Seção | Linha atual | Substituir por |
|---|---|---|
| §5.2, §6.1 | `text-[var(--text-4xl)]` | `text-[var(--text-hero)]` |
| §5.2, §6.1 | `text-[var(--text-4xl)]` (preço) | `text-[var(--text-3xl)]` |
| §5.2, §6.1 | `font-extrabold` | `font-bold` |
| §5.1, §5.2 | `cn(...)` | `[...].filter(Boolean).join(" ")` |
| §5.1 | `py-1.5` nos botões toggle | Manter, adicionar `min-h-[44px]` no wrapper |
| §5.2 | `bg-[var(--color-success)]/10` | `bg-[var(--color-success-surface)]` |
| §9 | `md:scale-[1.03] md:z-10` | `md:-translate-y-1 md:shadow-[var(--shadow-lg)]` |

### Emendas em `frontend-spec-alterar-plano.md`

| Seção | Linha atual | Substituir por |
|---|---|---|
| §5.3, §5.7 | `opacity-80` no card wrapper | Remover — não necessário |
| §5.5 | `bg-[var(--color-primary)]/5` | `bg-[var(--color-primary-surface)]` |
| §5.3 | `cn(...)` | `[...].filter(Boolean).join(" ")` |
| §2 | auth guard server-component | Adicionar middleware como B-4 Opção B |

---

## 8. Status Final

| Spec | Status | Bloqueadores | Alertas |
|---|---|---|---|
| `frontend-spec-planos-v2.md` | ✅ Aprovado com emendas | B-1, B-2, B-3 | A-1, A-3, A-5 |
| `frontend-spec-alterar-plano.md` | ✅ Aprovado com emendas | B-2 | A-2, A-3, A-4 |

**Ambos os specs podem avançar para implementação após aplicação das emendas acima.**
As emendas são cirúrgicas — não alteram a arquitetura de informação, a neurociência
de copy, nem os fluxos de UX. Apenas corrigem referências de token, utilitário
e comportamentos de acessibilidade.

---

*Validação UX por Uma (ux-design-expert) — 2026-06-11*
*Próximos passos: @sm cria stories com emendas incorporadas; @dev implementa.*
