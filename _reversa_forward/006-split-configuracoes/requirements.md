# Requirements: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`
> Pasta da extracao reversa: `_reversa_sdd/`
> Confidencia: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DUVIDA

## 1. Resumo executivo

Hoje `/app/configuracoes` e uma pagina unica de 791 linhas com sidebar interna (4 abas visuais) e secoes inline: Dados da Organizacao, Plano e Faturamento, Membros da Equipe, Zona de Perigo. A pagina `/app/configuracoes/faturamento` (507 linhas) e acessivel por link interno e mostra Assinatura Ativa + Faturas Recentes (ultimas 5) + Cancelamento. Esta feature: (1) remove a sidebar interna e o bloco "Plano e Faturamento" da pagina principal, (2) adiciona submenu "Configuracoes > Organizacao | Faturamento" no sidebar do app, (3) simplifica a pagina de faturamento removendo "Assinatura Ativa" e exibindo ate **15 faturas** do Asaas com data de vencimento e pagamento.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidencia |
|-------|------------------|-------------|
| `_reversa_sdd/code-analysis.md#3. billing` | `GET /invoices`: ultimas 5 faturas via Asaas; `GET /subscription`: busca assinatura ativa | 🟢 |
| `_reversa_sdd/code-analysis.md#7. dashboard` | `GET/PATCH /org`: dados e configs da org, admin-only | 🟢 |
| `src/components/layout/Sidebar.tsx:24-29` | `NAV_ITEMS` flat: Visao geral, Casos, Relatorios, Configuracoes (adminOnly) — sem suporte a submenu | 🟢 |
| `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx:295-318` | Sidebar interna com 4 links (Organizacao, Usuarios, Faturamento, Preferencias) — puramente visual, sem roteamento real (todos apontam para `/app/configuracoes` exceto Faturamento) | 🟢 |
| `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx:497-544` | Bloco "Plano e Faturamento" com badge do plano + link para `/app/configuracoes/faturamento` ou `/app/planos` | 🟢 |
| `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:130-507` | Pagina de faturamento: Assinatura Ativa (dados da subscription) + Faturas Recentes (tabela com 5 invoices) + Cancelamento | 🟢 |
| `src/lib/asaas/getInvoices.ts:42` | `limit=5` hardcoded na chamada a Asaas `GET /v3/payments` | 🟢 |
| `src/lib/asaas/getInvoices.ts:15-22` | Interface `Invoice`: `vencimento`, `status`, `valor`, `descricao`, `invoice_url` — sem campo `data_pagamento` | 🟢 |

## 3. Personas e cenarios de uso

| Persona | Objetivo | Cenario-chave |
|---------|----------|---------------|
| Admin (gestor de compliance) | Acessar dados da organizacao rapidamente | Clica em "Configuracoes > Organizacao" no sidebar e edita nome/slug/departamentos |
| Admin (gestor de compliance) | Verificar historico completo de faturas | Clica em "Configuracoes > Faturamento" e ve todas as faturas pagas e em aberto com datas |
| Admin (gestor de compliance) | Gerenciar membros da equipe | Acessa Organizacao e rola ate a secao "Membros da Equipe" para convidar/desativar usuarios |
| Gestor (nao-admin) | — | Nao ve "Configuracoes" no sidebar (mantido `adminOnly`) |

## 4. Regras de negocio novas ou alteradas

1. **RN-01:** O item "Configuracoes" no sidebar do app passa a ser um submenu expansivel com duas opcoes: "Organizacao" (`/app/configuracoes`) e "Faturamento" (`/app/configuracoes/faturamento`). O comportamento de `adminOnly` e herdado pelo submenu — gestores nao-admin nao veem nenhum dos dois itens. 🟢 — Nova.
2. **RN-02:** A sidebar interna da pagina `/app/configuracoes` (4 abas: Organizacao, Usuarios, Faturamento, Preferencias) e removida. O conteudo que antes era acessado por essas abas permanece inline na pagina: Dados da Organizacao, Membros da Equipe e Zona de Perigo. A aba "Preferencias" (que nunca teve conteudo proprio) e removida junto. 🟢 — Removida.
3. **RN-03:** O bloco "Plano e Faturamento" (linhas 497-544 do `page.tsx`) e removido da pagina `/app/configuracoes`. O link para faturamento agora existe apenas no submenu do sidebar. O link para `/app/planos` (upgrade) e mantido apenas na pagina de checkout, nao nas configuracoes. 🟢 — Removida.
4. **RN-04:** A pagina `/app/configuracoes/faturamento` remove o bloco "Assinatura Ativa" (dados da subscription: plano, status, valor, ciclo, vencimento) e o link/botao de voltar para configuracoes. Mantem apenas a secao de faturas e o bloco de cancelamento (se aplicavel). 🟢 — Alterada.
5. **RN-05:** A listagem de faturas exibe as ultimas **15 faturas** registradas no Asaas (equivalente a 1 ano parcelado em 12x + 3 meses do periodo anterior), em vez das atuais 5. A chamada a API Asaas `GET /v3/payments` passa a usar `limit=15` (o maximo suportado pela API e 100). Sem paginacao — 15 cobre o cenario pratico. 🟢 — Alterada.
6. **RN-06:** Cada fatura exibe duas datas: **data de vencimento** (`dueDate`) e **data de pagamento** (`paymentDate`). Para faturas nao pagas (PENDING, OVERDUE, CANCELLED), o campo `paymentDate` vem `null` na resposta da Asaas — a UI exibe "—". A interface `Invoice` em `getInvoices.ts` e a UI em `faturamento/page.tsx` sao estendidas com o campo `data_pagamento: string | null`. 🟢 — Nova.
   - Origem no legado: `src/lib/asaas/getInvoices.ts#15-22` (interface `Invoice` existente)
   - Confirmado via doc Asaas: `paymentDate` e campo da resposta de `GET /v3/payments`; ausente/null para faturas nao liquidadas
7. **RN-07:** O bloco "Cancelamento" da pagina de faturamento permanece funcional, abaixo da listagem de faturas, com o mesmo comportamento atual (modal de confirmacao que exige digitar "CANCELAR"). 🟢 — Preservada.

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Criterio de aceite | Confidencia |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Adicionar submenu expansivel "Configuracoes" no `Sidebar.tsx` com itens "Organizacao" (`/app/configuracoes`) e "Faturamento" (`/app/configuracoes/faturamento`), herdando `adminOnly` | Must | Sidebar mostra "Configuracoes" como item expansivel para admin; ao expandir, mostra Organizacao e Faturamento; ao clicar, navega para a rota correspondente; gestor nao-admin nao ve o item | 🟢 |
| RF-02 | Remover a sidebar interna (`<aside>`) da pagina `/app/configuracoes` (linhas 295-318) | Must | Pagina `/app/configuracoes` renderiza sem o `<aside>` de navegacao lateral; o restante do conteudo (Dados da Organizacao, Membros, Zona de Perigo) permanece | 🟢 |
| RF-03 | Remover o bloco "Plano e Faturamento" (linhas 497-544) da pagina `/app/configuracoes` e todo o codigo associado (`billingInfo`, `billingLoading`, `fetchBillingInfo`) | Must | Pagina `/app/configuracoes` nao exibe o card de plano, nao faz GET `/api/billing/info`, nem renderiza o link "Gerenciar Assinatura" / "Fazer Upgrade" | 🟢 |
| RF-04 | Remover o bloco "Assinatura Ativa" e o botao/link de voltar da pagina `/app/configuracoes/faturamento` | Must | Pagina de faturamento nao exibe o card de assinatura com status/valor/ciclo, nem o link de navegacao de retorno para `/app/configuracoes`; mantem a secao de faturas e o bloco de cancelamento | 🟢 |
| RF-05 | Alterar `getInvoices(customerId)` para buscar ate 15 faturas (via `limit=15`) em vez do `limit=5` atual, sem paginacao | Must | A chamada `GET /v3/payments?customer=...&limit=15` retorna as ultimas 15 faturas disponiveis na Asaas | 🟢 |
| RF-06 | Adicionar campo `data_pagamento` (opcional) a interface `Invoice` e exibi-lo na tabela de faturas | Must | Cada linha da tabela de faturas mostra "Vencimento" (`dueDate`) e "Pagamento" (`paymentDate`, ou "—" se ausente) | 🟢 |
| RF-07 | Submenu do sidebar indica visualmente qual item esta ativo com base no `pathname` | Should | Ao acessar `/app/configuracoes`, "Organizacao" fica destacado; ao acessar `/app/configuracoes/faturamento`, "Faturamento" fica destacado; o item pai "Configuracoes" tambem indica atividade quando qualquer filho esta ativo | 🟡 |
| RF-08 | O submenu mantem o estado expandido/recolhido entre navegacoes | Should | Ao expandir "Configuracoes" e navegar para um filho, o submenu permanece expandido na proxima renderizacao | 🟡 |

## 6. Requisitos Nao Funcionais

| Tipo | Requisito | Evidencia ou justificativa | Confidencia |
|------|-----------|----------------------------|-------------|
| Desempenho | `limit=15` na Asaas tem impacto desprezivel no tempo de resposta — a chamada unica retorna em < 1s | Asaas API e externa; `limit=15` e um volume baixo, sem necessidade de paginacao | 🟢 |
| Seguranca | `adminOnly` do submenu mantem a mesma protecao atual: Route Handlers de billing ja exigem `role === "admin"`, nao depende de UI | `_reversa_sdd/code-analysis.md#3. billing`: "Todas exigem role === admin" | 🟢 |
| Seguranca | Remocao do bloco "Plano e Faturamento" nao remove a protecao de acesso a `/app/configuracoes/faturamento` para nao-admins — o `router.replace("/app")` no `useEffect` do `faturamento/page.tsx` permanece | `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:183-188` | 🟢 |
| UX | A sidebar interna removida (4 abas) libera espaco horizontal; o layout da pagina `/app/configuracoes` passa de `lg:grid-cols-3` para centralizado (`max-w-4xl` unico) ou mantem grid com conteudo ocupando todo o espaco | Mudanca benefica: menos clutter visual, navegacao realocada ao sidebar do app | 🟡 |

## 7. Criterios de Aceitacao

```gherkin
Cenario: Admin ve submenu Configuracoes no sidebar
  Dado que o usuario logado tem role "admin"
  Quando o sidebar renderiza
  Entao o item "Configuracoes" aparece com um indicador de expansao (chevron)
  E ao clicar, exibe os subitens "Organizacao" e "Faturamento"

Cenario: Gestor nao-admin nao ve Configuracoes
  Dado que o usuario logado tem role "gestor"
  Quando o sidebar renderiza
  Entao o item "Configuracoes" nao aparece

Cenario: Sidebar interna removida da pagina de organizacao
  Dado que o admin acessa /app/configuracoes
  Quando a pagina renderiza
  Entao o <aside> com as 4 abas (Organizacao, Usuarios, Faturamento, Preferencias) NAO esta presente
  E as secoes Dados da Organizacao, Membros da Equipe e Zona de Perigo sao exibidas inline

Cenario: Bloco Plano e Faturamento removido
  Dado que o admin acessa /app/configuracoes
  Quando a pagina renderiza
  Entao o card "Plano e Faturamento" com badge do plano e link para faturamento NAO esta presente

Cenario: Bloco Assinatura Ativa removido da pagina de faturamento
  Dado que o admin acessa /app/configuracoes/faturamento
  Quando a pagina renderiza
  Entao o card de assinatura (plano, status, valor, ciclo, vencimento) NAO esta presente
  E o link/botao de voltar para /app/configuracoes NAO esta presente

Cenario: Ate 15 faturas sao exibidas com data de vencimento e pagamento
  Dado que a org tem faturas registradas no Asaas
  Quando o admin acessa /app/configuracoes/faturamento
  Entao a tabela de faturas exibe ate 15 registros (via limit=15)
  E cada linha mostra "Vencimento" (data formatada) e "Pagamento" (data ou "—")

Cenario: Fatura sem pagamento exibe traco na coluna de pagamento
  Dado que existe uma fatura com status PENDING ou OVERDUE no Asaas
  Quando a tabela de faturas renderiza essa fatura
  Entao a coluna "Pagamento" exibe "—"

Cenario: Bloco de cancelamento permanece funcional
  Dado que o admin acessa /app/configuracoes/faturamento e a assinatura esta ACTIVE
  Quando o admin clica em "Cancelar Assinatura", confirma digitando "CANCELAR"
  Entao a assinatura e cancelada (DELETE /api/billing/cancel) e o estado reflete o cancelamento

Cenario: Org sem faturas exibe estado vazio
  Dado que a org tem `asaas_customer_id` mas nenhuma fatura registrada no Asaas (ou a API retorna array vazio)
  Quando o admin acessa /app/configuracoes/faturamento
  Entao a tabela de faturas exibe uma mensagem de estado vazio (ex.: "Nenhuma fatura encontrada")

Cenario: Submenu indica item ativo
  Dado que o admin esta na pagina /app/configuracoes/faturamento
  Quando o sidebar renderiza
  Entao "Configuracoes" esta destacado como ativo e "Faturamento" esta destacado como subitem ativo
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01 | Must | E o pedido central da feature — substitui a sidebar interna por submenu no app |
| RF-02 | Must | Consequencia direta de RF-01: sidebar interna perde a funcao |
| RF-03 | Must | Remove duplicacao: faturamento ja tem rota dedicada |
| RF-04 | Must | Simplifica a pagina de faturamento para exibir apenas faturas |
| RF-05 | Must | "Todas as faturas" e o pedido explicito do usuario |
| RF-06 | Must | Datas de vencimento e pagamento sao explicitamente solicitadas |
| RF-07 | Should | Melhoria de UX (destaque de item ativo), nao bloqueia o fluxo principal |
| RF-08 | Should | Conveniencia de navegacao, nao bloqueia o fluxo principal |

## 9. Esclarecimentos

### Sessao 2026-07-23

- **Q:** A API Asaas `GET /v3/payments` — qual o limite maximo de registros por pagina e o comportamento para paginacao?
  **R:** `limit=15`, sem paginacao. Equivalente a 1 ano parcelado (12x) + 3 meses do periodo anterior. O maximo suportado pela API e 100. (RN-05, RF-05)

- **Q:** O campo `paymentDate` na resposta de pagamentos da Asaas — como se comporta para faturas ainda nao pagas (PENDING/OVERDUE)?
  **R:** Confirmado na documentacao Asaas: `paymentDate` e um campo da resposta de `GET /v3/payments`. Para faturas PENDING/OVERDUE, o campo vem `null` ou ausente — a UI exibe "—". (RN-06, RF-06)

## 10. Lacunas

Nenhuma lacuna pendente. Todas as duvidas foram resolvidas na sessao de esclarecimentos de 2026-07-23.

## 11. Historico de alteracoes

| Data | Alteracao | Autor |
|------|-----------|-------|
| 2026-07-23 | Versao inicial gerada por `/reversa-requirements` | reversa |
