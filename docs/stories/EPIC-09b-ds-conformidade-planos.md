# Epic 09b — Conformidade Design System: Frontend `/planos`

## Status

**Draft** — Story 9.4 aguarda validação @po

## Objetivo do Epic

Corrigir as 5 não-conformidades identificadas por Uma (ux-design-expert) na página `/planos`, alinhando o frontend ao Design System do projeto (tokens CSS, componente `<Button>`, extração de `PlanoCard`, controle de dark mode e convenção de env vars client-side).

## Spec de Origem

**Documento:** `docs/specs/frontend-spec-planos.md`
**Autora:** Uma (ux-design-expert) — 2026-06-11
**Status da spec:** Draft

## Contexto do Sistema Existente

- **Stack:** Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Arquivo principal:** `src/app/planos/page.tsx` (implementado na Story 9.1)
- **Design System:** tokens em `src/styles/tokens.css`, componentes em `src/components/ui/`
- **Convenção de env:** variáveis client-side via `clientEnv` em `src/lib/env.client.ts`

## Não-Conformidades Identificadas (5 eixos)

| # | Eixo | Impacto |
|---|------|---------|
| 2.1 | 16 classes Tailwind hardcoded (`gray-*`, `blue-*`, `red-*`, `green-*`) → tokens ausentes | Visual inconsistente ao mudar tema |
| 2.2 | Botões `<button>` raw em vez de `<Button>` do DS | Sem loading spinner, sem variantes DS |
| 2.3 | `process.env.NEXT_PUBLIC_SALES_CONTACT` acessado diretamente no componente | Viola convenção `clientEnv` do projeto |
| 2.4 | `PlanoCard` co-localizado inline em `page.tsx` | Impossibilita testes unitários isolados |
| 2.5 | Sem `data-portal` no `<main>` | Página responde ao dark mode do OS (não-intencional) |

## Enhancement Details

- **O que muda:** refactoring de conformidade — zero novas features, zero mudanças de comportamento de negócio
- **Como integra:** substitui classes hardcoded por tokens CSS já definidos, extrai componente inline, usa `<Button>` já existente em `@/components/ui/Button`
- **Success criteria:** checklist da spec `docs/specs/frontend-spec-planos.md` seção 10 — 100% dos itens ✅

## Stories

### Story 9.4 — DS Conformance: Página `/planos`

- **Descrição:** Aplicar todos os 5 eixos de conformidade ao frontend de `/planos` conforme spec de Uma
- **Executor Assignment:** `executor: @dev`, `quality_gate: @ux-design-expert`
- **Quality Gate Tools:** `[token_audit, ds_component_check, env_convention_check, lint, tsc]`
- **Quality Gates:**
  - Pre-Commit: `npm run lint && npx tsc --noEmit` + audit de classes hardcoded
  - Pre-PR: conformidade visual com spec seção 4 + checklist seção 10
- **Complexity:** Low

## Compatibility Requirements

- [ ] Comportamento do checkout Asaas permanece idêntico (lógica de `handleContratar` não muda)
- [ ] Interface `PlanoConfig` inalterada (somente extração de arquivo)
- [ ] Nenhuma nova variável de ambiente obrigatória (`NEXT_PUBLIC_SALES_CONTACT` já tem fallback)
- [ ] Nenhuma alteração em Firestore, Firebase Functions ou Route Handlers

## Risk Assessment

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Token CSS ausente no `tokens.css` | Baixa | Visual quebrado | Verificar existência de cada var() antes do commit |
| `<Button>` sem prop `fullWidth` | Baixa | Layout quebrado | Inspecionar interface do Button.tsx antes de usar |
| `clientEnv` sem build-time check | Baixa | Runtime error | Usar `?? fallback` conforme spec (sem `!`) |

**Rollback:** git revert da story — zero impacto em dados ou servidor.

## Definition of Done

- [ ] Checklist de conformidade da spec (seção 10) — 100% ✅
- [ ] `PlanoCard` extraído para `src/app/planos/PlanoCard.tsx`
- [ ] Zero classes `gray-*`, `blue-*`, `red-*`, `green-*` em `src/app/planos/`
- [ ] `clientEnv.salesContact` em `src/lib/env.client.ts`
- [ ] `data-portal` no `<main>` de `page.tsx`
- [ ] `npm run lint && npx tsc --noEmit` → EXIT:0
- [ ] Visual idêntico ao spec seção 3 e 4

## Handoff para @sm

"River, criar Story 9.4 para o Epic 09b — Conformidade DS na página `/planos`.

Spec completa em `docs/specs/frontend-spec-planos.md` (Uma, ux-design-expert).
4 arquivos: CRIAR `PlanoCard.tsx`, MODIFICAR `page.tsx`, MODIFICAR `env.client.ts`, VERIFICAR `.env.example`.
Executor: @dev. Quality gate: @ux-design-expert (conformidade visual) + @architect (env convention).
Complexity: Low. Zero mudança de comportamento de negócio."

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-06-11 | 1.0 | Epic criado — Fase 9 DS Conformance `/planos` | Morgan (@pm) |
