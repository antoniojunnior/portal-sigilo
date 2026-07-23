# Regression Watch: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`

## Watch principal

| ID | Origem | Regra esperada apos mudanca | Tipo de verificacao | Sinal de violacao |
|---|---|---|---|---|
| W001 | `Sidebar.tsx`, submenu | Item "Configuracoes" so aparece para `role === "admin"`; subitens "Organizacao" e "Faturamento" herdam essa restricao | presenca | Gestor nao-admin ve "Configuracoes" ou qualquer subitem no sidebar |
| W002 | `Sidebar.tsx`, deteccao de ativo | Item pai "Configuracoes" fica ativo quando `pathname.startsWith("/app/configuracoes")`; "Organizacao" ativo em `/app/configuracoes` exato; "Faturamento" ativo em `/app/configuracoes/faturamento` | presenca | Item ativo destacado incorretamente (ex.: Faturamento ativo quando em Organizacao) |
| W003 | `configuracoes/page.tsx`, bloco removido | Bloco "Plano e Faturamento" NAO e renderizado na pagina `/app/configuracoes` | ausencia | Card de plano visivel na pagina de organizacao |
| W004 | `configuracoes/page.tsx`, sidebar removida | `<aside>` com 4 abas internas NAO e renderizado | ausencia | Sidebar interna de navegacao visivel na pagina de organizacao |
| W005 | `faturamento/page.tsx`, Assinatura removida | Card "Assinatura Ativa" NAO e renderizado | ausencia | Card de subscription (plano, status, valor, ciclo) visivel na pagina de faturamento |
| W006 | `faturamento/page.tsx`, navegacao removida | Link/botao de voltar (ArrowLeft para `/app/configuracoes`) NAO e renderizado | ausencia | Link de navegacao "Configuracoes" visivel na pagina de faturamento |
| W007 | `getInvoices.ts`, limit | `GET /v3/payments?customer=...&limit=15` retorna ate 15 faturas | presenca | Menos de 15 faturas retornadas quando existem >= 15 na Asaas; ou `limit` ainda e 5 |
| W008 | `getInvoices.ts` + `faturamento/page.tsx`, paymentDate | Coluna "Pagamento" na tabela de faturas mostra data ou "—"; `data_pagamento` mapeado de `paymentDate` da Asaas | presenca | Coluna "Pagamento" ausente; ou mostra data invalida; ou "—" para fatura paga |

## Historico de re-extracoes

*(vazio — sera preenchido pelo agente reverso quando rodar `/reversa` novamente)*

## Arquivadas

*(vazio)*

## Observacoes

Itens sem peso de regressao (RF Should, nao eram 🟢 no `_reversa_sdd/domain.md`):

- RF-07 (indicacao visual de item ativo): Should priority, verificado via W002 com peso medio. Se futura extracao confirmar como 🟢, mova para o watch principal.
- RF-08 (persistencia de estado expandido entre navegacoes): Should priority, nao implementado. O estado `expandedMenu` vive apenas no estado local do React e nao persiste entre navegacoes SPA.
