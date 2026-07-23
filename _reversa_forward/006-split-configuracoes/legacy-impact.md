# Legacy Impact: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`
> Cenário: **legado** — ancorado em `_reversa_sdd/architecture.md` + `_reversa_sdd/domain.md`

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/components/layout/Sidebar.tsx` | Sidebar (componentes de layout) | regra-alterada | HIGH | Ganha suporte a submenu expansivel com estado local `expandedMenu`; item "Configuracoes" vira accordion com "Organizacao" e "Faturamento" |
| `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` | Páginas React (App Router) | regra-alterada | HIGH | Remove sidebar interna (`<aside>` 4 abas), bloco "Plano e Faturamento", estados/fetches de `billingInfo`/`billingLoading`/`fetchBillingInfo`. Layout ajustado de grid para centralizado |
| `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` | Páginas React (App Router) | regra-alterada | HIGH | Remove bloco "Assinatura Ativa" com todos os estados/fetches (`subscription`, `subLoading`, `fetchSubscription`), navegacao de volta (ArrowLeft), e `SubscriptionData`/`PLANO_LABELS`/`CICLO_LABELS`/`STATUS_BADGE`. Adiciona coluna `Pagamento` na tabela de faturas |
| `src/lib/asaas/getInvoices.ts` | `src/lib/*` (utilitarios) | regra-alterada | MEDIUM | `limit=5` → `limit=15`; adiciona `data_pagamento: string \| null` a interface `Invoice` e mapeamento do `paymentDate` da Asaas |

## Diff conceitual por componente

### `Sidebar.tsx`

Adicionado suporte a submenu via extensao da interface `NavItem` com `children?: NavItem[]` e estado `expandedMenu: Set<string>`. O item "Configuracoes" agora renderiza como botao accordion com chevron animado, expandindo para subitens "Organizacao" e "Faturamento". Deteccao de item ativo mantem o padrao `pathname.startsWith()` para o pai; filhos usam match exato ou prefixo. O filtro `adminOnly` e herdado pelo submenu.

### `configuracoes/page.tsx`

- **Removido**: `<aside>` com 4 links internos (Organizacao, Usuarios, Faturamento, Preferencias)
- **Removido**: bloco "Plano e Faturamento" (49 linhas de JSX com badge do plano, skeleton de loading e links condicionais)
- **Removido**: estados `billingInfo`, `billingLoading`, funcao `fetchBillingInfo`, chamada no `useEffect`
- **Removido**: import `CreditCard` do lucide-react (nao usado apos remocao do bloco), `Settings` (nao usado apos remocao do aside), constante `PLANO_LABELS` (usada apenas no bloco removido)
- **Ajustado**: layout de `lg:grid-cols-3` com sidebar para `max-w-4xl` centralizado
- **Preservado**: secoes Dados da Organizacao, Membros da Equipe e Zona de Perigo

### `faturamento/page.tsx`

- **Removido**: bloco "Assinatura Ativa" com card de subscription (88 linhas), estados `subscription`/`subLoading`/`subError`, funcao `fetchSubscription`, chamada no `useEffect`
- **Removido**: link de navegacao de volta (`ArrowLeft`, `Link` para `/app/configuracoes`)
- **Removido**: interface `SubscriptionData`, constantes `PLANO_LABELS`, `CICLO_LABELS`, `STATUS_BADGE`
- **Removido**: imports `Link`, `ArrowLeft`, `Info`, `ArrowLeftRight`
- **Adicionado**: coluna `Pagamento` na tabela de faturas com `inv.data_pagamento ? formatDate(...) : "—"`
- **Adicionado**: `data_pagamento: string | null` a interface `Invoice`
- **Alterado**: `handleCancel` chama `fetchInvoices()` em vez de `fetchSubscription()` apos cancelamento
- **Alterado**: bloco de cancelamento exibido incondicionalmente (removida condicao `hasAsaasSubscription && subscription?.status === "ACTIVE"`)
- **Preservado**: tabela de faturas, modal de cancelamento, protecao `role !== "admin"`

### `getInvoices.ts`

- `limit=5` → `limit=15`
- Interface `Invoice` ganha `data_pagamento: string | null`
- Interface `AsaasPayment` ganha `paymentDate?: string`
- Mapeamento adiciona `data_pagamento: p.paymentDate ?? null`

## Preservadas

| Regra | Onde | Status |
|---|---|---|
| `adminOnly` do item Configuracoes mantido — gestores nao veem o submenu | `domain.md` | 🟢 — submenu herda `adminOnly` do pai |
| Route Handlers de billing continuam exigindo `role === "admin"` | `domain.md#planos` | 🟢 — sem alteracao nos endpoints |
| Firestore schema inalterado — nenhum campo novo/removido em colecoes | `domain.md` | 🟢 |
| Auditoria (`assinatura_cancelada`) mantida no `DELETE /api/billing/cancel` | `domain.md#auditoria` | 🟢 |
| `router.replace("/app")` para gestores em `/faturamento` mantido | `faturamento/page.tsx` | 🟢 |

## Modificadas

| Regra original | Mudanca | Nova semantica |
|---|---|---|
| Navegacao de Configuracoes era feita por sidebar interna de 4 abas visuais | regra-removida | Navegacao migrada para submenu no sidebar do app |
| Bloco "Plano e Faturamento" exibia badge do plano + link condicional | regra-removida | Bloco removido; faturamento acessivel pelo submenu |
| Secao "Assinatura Ativa" mostrava dados da subscription Asaas | regra-removida | Secao removida; apenas faturas + cancelamento permanecem |
| `GET /v3/payments?limit=5` listava ultimas 5 faturas | regra-alterada | `limit=15` lista ultimas 15 faturas |
| Tabela de faturas tinha 5 colunas (Vencimento, Descricao, Valor, Status, Acao) | regra-alterada | 6 colunas — adicionada coluna "Pagamento" |
