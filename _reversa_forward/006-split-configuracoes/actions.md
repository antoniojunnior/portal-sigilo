# Actions: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`
> Roadmap: `_reversa_forward/006-split-configuracoes/roadmap.md`

## Resumo

| Metrica | Valor |
|---------|-------|
| Total de acoes | 6 |
| Paralelizaveis (`[//]`) | 3 |
| Maior cadeia de dependencia | T001 → T004 (2) |

## Fase 1, Preparacao

<!-- Setup, scaffolding, configuracoes iniciais. -->

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Confidencia | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Alterar `getInvoices(customerId)`: mudar `limit=5` para `limit=15`, adicionar `data_pagamento: string \| null` a interface `Invoice`, mapear `paymentDate` da resposta Asaas (`p.paymentDate ?? null`) | - | `[//]` | `src/lib/asaas/getInvoices.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Sem fase de testes — projeto nao tem suite de testes de UI. -->

## Fase 3, Nucleo

<!-- Logica central da feature. -->

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Confidencia | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T002 | Adicionar submenu expansivel ao `Sidebar.tsx`: estender `NavItem` com `children?: NavItem[]`, adicionar estado `expandedMenu: Set<string>`, renderizar "Configuracoes" como accordion com subitens "Organizacao" e "Faturamento", herdando `adminOnly` do pai. Item pai ativo quando `pathname.startsWith("/app/configuracoes")`; filhos ativos por match exato/prefixo | - | `[//]` | `src/components/layout/Sidebar.tsx` | 🟢 | `[X]` |
| T003 | Refatorar `configuracoes/page.tsx`: (a) remover `<aside>` de sidebar interna (linhas ~295-318) e ajustar layout de `lg:grid-cols-3` para `max-w-4xl` centralizado; (b) remover bloco "Plano e Faturamento" (linhas ~497-544); (c) remover estados `billingInfo`, `billingLoading` e funcoes `fetchBillingInfo` + sua chamada no `useEffect`; (d) remover import `CreditCard` se nao usado em outro lugar | - | `[//]` | `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` | 🟢 | `[X]` |
| T004 | Refatorar `faturamento/page.tsx`: (a) remover bloco "Assinatura Ativa" (card com plano/status/valor/ciclo/vencimento) e todos os estados/fetches relacionados (`subscription`, `subLoading`, `subError`, `fetchSubscription`, chamada no useEffect); (b) remover `SubscriptionData`, `CICLO_LABELS`, `STATUS_BADGE`; (c) remover link/botao de navegacao de volta (ArrowLeft); (d) adicionar coluna "Pagamento" na tabela de faturas com `data_pagamento` (formatado ou "—" se null); (e) estender interface `Invoice` local com `data_pagamento: string \| null`; (f) remover imports nao utilizados (`ArrowLeft`, `Info`, `ArrowLeftRight` se so usados nos blocos removidos) | T001 | - | `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | 🟢 | `[X]` |

## Fase 4, Integracao

<!-- Cola com outras partes do sistema, navegacao cruzada. -->

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Confidencia | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Confirmar que a navegacao entre submenu e paginas funciona: (a) `pathname.startsWith("/app/configuracoes")` ativa o item pai no sidebar; (b) `/app/configuracoes` ativa "Organizacao"; (c) `/app/configuracoes/faturamento` ativa "Faturamento"; (d) admin-only herdado corretamente (gestor nao ve o submenu); (e) redirecionamento de gestor em `/faturamento` mantido | T002, T003, T004 | - | `src/components/layout/Sidebar.tsx`, `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Revisao final, textos, responsividade. -->

| ID | Descricao | Dependencias | Paralelismo | Arquivo alvo | Confidencia | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Revisao final: (a) verificar responsividade do submenu em sidebar colapsada (mostrar so icone, tooltip no hover); (b) garantir que a pagina de organizacao sem sidebar interna ainda tem boa legibilidade em mobile; (c) verificar que `PLANO_LABELS[user.plano]` ainda funciona no badge da organizacao apos remocao do bloco de faturamento; (d) rodar lint e typecheck | T002, T003, T004 | - | `src/components/layout/Sidebar.tsx`, `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` | 🟡 | `[X]` |

## Notas de execucao

<!--
Reservado para /reversa-coding registrar avisos ou observacoes que surgiram durante a execucao.
-->

## Historico de alteracoes

| Data | Alteracao | Autor |
|------|-----------|-------|
| 2026-07-23 | Versao inicial gerada por `/reversa-to-do` | reversa |
| 2026-07-23 | All actions executed by `/reversa-coding` (YOLO mode) | reversa |
