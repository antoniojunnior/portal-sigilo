# Roadmap: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`
> Requirements: `_reversa_forward/006-split-configuracoes/requirements.md`
> Confidencia: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Mudanca 100% client-side com um ajuste pontual no server (`getInvoices.ts`). Nenhum endpoint novo, nenhum schema Firestore alterado. O Sidebar ganha suporte a submenu expansivel via estado local; o item "Configuracoes" se torna um accordion com dois filhos: Organizacao e Faturamento. A pagina `/app/configuracoes` perde a sidebar interna, o bloco "Plano e Faturamento" e toda a logica de `billingInfo`. A pagina `/app/configuracoes/faturamento` remove a secao "Assinatura Ativa" e o link de navegacao de volta, mantendo faturas + cancelamento. No server, `getInvoices(customerId)` muda `limit=5` → `limit=15` e adiciona mapeamento do campo `paymentDate` da Asaas.

## 2. Principios aplicados

n/a — projeto nao tem `.reversa/principles.md` configurado.

## 3. Decisoes tecnicas

| ID | Decisao | Justificativa | Alternativas descartadas | Confidencia |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Submenu no Sidebar implementado como estado local `expandedMenu` (Set de strings), expandindo/colapsando o item "Configuracoes" em dois subitens | Simples, sem dependencia nova; o Sidebar ja usa `useState` para collapsed; adicionar `expandedMenu` e um novo array `SUB_ITEMS` e minimo | Usar `next/navigation` com layout groups aninhados; criar um `NavAccordion` component separado — complexidade desnecessaria para 2 subitens | 🟢 |
| D-02 | Deteccao de item ativo no submenu: o pai "Configuracoes" fica ativo quando `pathname.startsWith("/app/configuracoes")`; o filho "Organizacao" ativo quando `pathname === "/app/configuracoes"`; "Faturamento" ativo quando `pathname.startsWith("/app/configuracoes/faturamento")` | Ja e o padrao atual do Sidebar (`pathname.startsWith(item.href)`) | Regex no pathname; usar `useSelectedLayoutSegment` — nao disponivel no Sidebar que e client component simples | 🟢 |
| D-03 | Remocao da sidebar interna do `page.tsx` e limpeza total do bloco "Plano e Faturamento" (linhas 295-318 e 497-544) + remocao de `billingInfo`, `billingLoading`, `fetchBillingInfo` e do `useEffect` que chama `fetchBillingInfo` | Remove codigo morto, simplifica o componente em ~100 linhas | Esconder condicionalmente em vez de remover — manteria codigo inalcancavel | 🟢 |
| D-04 | Remocao da secao "Assinatura Ativa" do `faturamento/page.tsx` + remocao de `subscription`, `subLoading`, `subError`, `fetchSubscription` e do `useEffect` relacionado. Remove tambem o botao/link de voltar (ArrowLeft) | Simplifica a pagina para exibir apenas faturas + cancelamento; a subscription nao e mais relevante com o submenu dedicado | Manter subscription como "informacao adicional" — usuario explicitamente pediu remocao | 🟢 |
| D-05 | `getInvoices(customerId)`: mudar `limit=5` → `limit=15`, adicionar `paymentDate` ao mapeamento da resposta Asaas, campo opcional (`string \| null`) | 15 cobre 1 ano parcelado + 3 meses anteriores; `paymentDate` e nulo para faturas nao pagas conforme doc Asaas | Paginacao com `offset` — desnecessaria para 15 registros | 🟢 |
| D-06 | Layout do `faturamento/page.tsx` mantem cancelamento abaixo das faturas, com mesma logica (modal + confirmacao "CANCELAR"). A protecao `user.role !== "admin"` redirecionando para `/app` permanece inalterada | Comportamento preservado conforme RN-07 | Mover cancelamento para pagina separada — nao pedido | 🟢 |
| D-07 | Layout da pagina `/app/configuracoes` muda de `lg:grid-cols-3` com sidebar interna para `max-w-4xl` centralizado, ocupando largura total apos remocao do `<aside>` | A sidebar interna ocupava 1/3 do grid; sem ela o conteudo pode usar todo o espaco com leitura mais confortavel | Manter grid so com 2 colunas — nao faz sentido sem sidebar | 🟡 |

## 4. Premissas

Nenhuma — todas as `[DUVIDA]` foram resolvidas no `/reversa-clarify` (2026-07-23).

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudanca | Resumo |
|------------|------------------------------|-----------------|--------|
| Sidebar | `src/components/layout/Sidebar.tsx` | regra-alterada | Ganha submenu expansivel: "Configuracoes" vira accordion com "Organizacao" e "Faturamento" |
| Pagina Configuracoes | `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` | regra-alterada | Remove sidebar interna, bloco "Plano e Faturamento", e estados/fetches de billing; ajusta layout |
| Pagina Faturamento | `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | regra-alterada | Remove secao "Assinatura Ativa" e navegacao de volta; mantem faturas + cancelamento; adiciona coluna data de pagamento |
| getInvoices | `src/lib/asaas/getInvoices.ts` | regra-alterada | `limit=5` → `limit=15`; adiciona campo `paymentDate` ao mapeamento |

## 6. Delta no modelo de dados

- Resumo das mudancas: nenhum campo novo no Firestore. A interface `Invoice` em `getInvoices.ts` ganha o campo `data_pagamento: string \| null` (mapeado do `paymentDate` da Asaas). O `Invoice` type em `faturamento/page.tsx` tambem ganha o campo correspondente. Nenhuma migracao.
- Detalhe completo em: `_reversa_forward/006-split-configuracoes/data-delta.md`

## 7. Delta de contratos externos

Nenhum contrato HTTP/fila novo ou alterado — a chamada `GET /v3/payments?customer=...&limit=5` apenas muda o valor do parametro `limit` para 15 e o mapeamento da resposta inclui `paymentDate`. A API Asaas ja suporta ambos (doc confirmada). Pasta `interfaces/` omitida.

## 8. Plano de migracao

n/a — mudanca puramente de UI + um parametro de query. Sem dado em repouso a migrar, sem downtime.

## 9. Riscos e mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
|-------|---------|---------------|-----------|
| Sidebar expandido/colapsado nao persiste entre navegacoes — usuario precisa re-expandir "Configuracoes" a cada clique | baixo — inconveniencia menor | baixo | RF-08 e Should (nao Must); se necessario, persistir em `localStorage` em iteracao futura |
| `limit=15` pode nao retornar faturas antigas suficientes para orgs com historico longo (>15 parcelas) | baixo — cobre 1 ano + 3 meses | baixo | Se necessario, aumentar para 30 ou adicionar paginacao; risco aceitavel conforme decisao do usuario |
| Remocao do bloco "Assinatura Ativa" pode esconder informacao util de status do plano — admin perde visibilidade rapida | medio — admin precisa ir para outra tela | baixo | O plano ja e visivel no badge da pagina de organizacao (`PLANO_LABELS[user.plano]`); alem disso, a suspensao/cancelamento dispara banners no app |
| `paymentDate` pode vir em formato diferente do esperado (ex.: com timezone offset) dependendo da configuracao da conta Asaas | baixo | baixo | Usar `new Date(paymentDate).toLocaleDateString("pt-BR")` para formatacao consistente, igual ao `dueDate` atual |

## 10. Criterio de pronto

- [ ] Todas as acoes do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extracao reversa executada e sem regressao vermelha (recomendado, nao obrigatorio)

## 11. Historico de alteracoes

| Data | Alteracao | Autor |
|------|-----------|-------|
| 2026-07-23 | Versao inicial gerada por `/reversa-plan` | reversa |
