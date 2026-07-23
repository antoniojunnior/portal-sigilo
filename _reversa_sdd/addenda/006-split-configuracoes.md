# Adendo: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`
> Cenário: **legado** — ancorado em `_reversa_sdd/architecture.md` + `_reversa_sdd/domain.md`

## Vigência

Vigente desde 2026-07-23.

## Resumo da entrega

Feature que reestrutura a rota `/app/configuracoes`: remove a sidebar interna de 4 abas (visual apenas), remove o bloco "Plano e Faturamento" da pagina principal, e migra a navegacao para um submenu expansivel no sidebar do app com "Configuracoes > [Organizacao, Faturamento]". A pagina de faturamento foi simplificada — bloco "Assinatura Ativa" removido, apenas faturas (ate 15, com coluna de data de pagamento) e cancelamento permanecem. `getInvoices.ts` teve `limit` aumentado de 5 para 15 e ganhou mapeamento do campo `paymentDate` da Asaas. **6 ações concluídas** (100%).

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `architecture.md` | Sidebar (`src/components/layout/Sidebar.tsx`) | regra-alterada | Item "Configuracoes" agora e um accordion expansivel com subitens "Organizacao" (`/app/configuracoes`) e "Faturamento" (`/app/configuracoes/faturamento`). `adminOnly` herdado pelo submenu. Deteccao de ativo por `pathname.startsWith()` e match exato. Ver `legacy-impact.md` da feature 006 |
| `architecture.md` | Páginas React, Configuracoes (`src/app/(dashboard)/app/(protected)/configuracoes/page.tsx`) | regra-alterada | Sidebar interna (`<aside>` com 4 abas) removida. Bloco "Plano e Faturamento" (49 linhas) removido. Estados/fetches de `billingInfo` removidos. Layout de grid para centralizado. Ver `legacy-impact.md` da feature 006 |
| `architecture.md` | Páginas React, Faturamento (`src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx`) | regra-alterada | Bloco "Assinatura Ativa" (88 linhas, card de subscription) removido. Navegacao de volta (ArrowLeft) removida. Interface `SubscriptionData`, constantes `PLANO_LABELS`/`CICLO_LABELS`/`STATUS_BADGE` removidas. Adicionada coluna "Pagamento" com `data_pagamento: string \| null`. Bloco de cancelamento exibido incondicionalmente. Ver `legacy-impact.md` da feature 006 |
| `architecture.md` | `src/lib/asaas/getInvoices.ts` | regra-alterada | `limit=5` alterado para `limit=15` na chamada a `GET /v3/payments`. Interface `Invoice` estendida com `data_pagamento: string \| null`, mapeado de `paymentDate` da Asaas. Ver `legacy-impact.md` da feature 006 |
| `domain.md` | Bloco "Plano e Faturamento" como secao da pagina de configuracoes | regra-removida | Bloco nao existe mais; navegacao para faturamento e feita pelo submenu do sidebar |
| `domain.md` | Secao "Assinatura Ativa" na pagina de faturamento | regra-removida | Secao removida; pagina de faturamento agora contem apenas faturas + cancelamento |
| `domain.md` | Listagem de faturas limitada a 5 registros | regra-alterada | Listagem agora retorna ate 15 faturas (equivalente a 1 ano + 3 meses) |
| `domain.md` | Tabela de faturas sem coluna de data de pagamento | regra-alterada | Tabela agora tem 6 colunas: Vencimento, Descricao, Valor, Pagamento (novo), Status, Acao |

## Regras sob vigilância

Watch items criados nesta entrega (detalhes em `_reversa_forward/006-split-configuracoes/regression-watch.md`):

- **W001** — Submenu visivel apenas para admin
- **W002** — Deteccao correta de item ativo no submenu
- **W003** — Bloco "Plano e Faturamento" ausente da pagina de organizacao
- **W004** — Sidebar interna de 4 abas ausente
- **W005** — Card "Assinatura Ativa" ausente da pagina de faturamento
- **W006** — Link de navegacao de volta ausente
- **W007** — `limit=15` efetivo na chamada a Asaas
- **W008** — Coluna "Pagamento" funcional (data ou "—")

## Fontes

- `_reversa_forward/006-split-configuracoes/legacy-impact.md`
- `_reversa_forward/006-split-configuracoes/regression-watch.md`
- `_reversa_forward/006-split-configuracoes/requirements.md`
- `_reversa_forward/006-split-configuracoes/progress.jsonl`
