# Investigation: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`

## 1. Pergunta de investigacao

O sidebar do app (`Sidebar.tsx`) suporta submenus? Se nao, qual o padrao mais leve para adicionar sem dependencia nova?

## 2. Achado: Sidebar atual e flat, sem suporte a submenu

`src/components/layout/Sidebar.tsx:24-29` define `NAV_ITEMS` como array plano de 4 itens. Cada item renderiza um `<Link>` direto. Nao ha conceito de item pai/filho, nem estado de expansao alem do collapse global.

O padrao mais leve: adicionar um campo `children?: NavItem[]` a interface `NavItem` e um estado `expandedMenu: Set<string>`. Itens com `children` renderizam um botao expand/colapsa + lista de subitens. O item pai ativo detecta pelo prefixo `pathname.startsWith(parentHref)`.

## 3. Alternativas avaliadas para o submenu

| Alternativa | Pros | Contras | Descartada por que |
|---|---|---|---|
| Estado local `expandedMenu` no Sidebar (escolhida, D-01) | Zero dependencias, reutiliza estrutura existente, <30 linhas de codigo novo | Estado nao persiste entre navegacoes (RF-08) | — |
| Usar `layout.tsx` com grupos aninhados no App Router | Persistencia nativa via rotas, sem estado | Exigiria reorganizar toda a estrutura de pastas do dashboard, criando `(dashboard)/app/(protected)/configuracoes/organizacao/` e `faturamento/` como layouts separados — overkill para 2 subitens | Complexidade desproporcional ao escopo |
| Biblioteca de UI (ex.: `@radix-ui/react-accordion`) | Acessibilidade pronta, animacoes | Dependencia nova para um unico accordion de 2 itens | Dependencia desnecessaria |
| Submenu via CSS puro (`:hover` / `:focus-within`) | Zero JavaScript | Nao funciona bem em mobile (sem hover), nao suporta estado ativo persistente | UX ruim em touch |

## 4. Padroes de codigo ja usados no projeto, reaproveitados aqui

- `usePathname()` no Sidebar para deteccao de rota ativa: ja existe em `Sidebar.tsx:36`, estendido para subitens
- `useState` para controle de UI (collapsed sidebar): mesmo padrao, adicionado `expandedMenu`
- `Link` do Next.js para navegacao: mantido para subitens
- `useAuth().user.role` para filtrar itens adminOnly: herdado pelo submenu
- `useCallback` / `useEffect` para fetches: mantidos nos page.tsx, apenas removendo os nao usados
- `formatDate` / `formatBRL` em `faturamento/page.tsx`: mantidos, reutilizados para `paymentDate`

## 5. Investigacao da API Asaas

Confirmado via documentacao oficial (docs.asaas.com):

- `GET /v3/payments`: parametro `limit` aceita valores de 1 a 100 (inteiro). Valor atual: 5. Novo valor: 15.
- Campo `paymentDate` na resposta: presente para cobrancas pagas (RECEIVED, CONFIRMED, RECEIVED_IN_CASH), `null` ou ausente para PENDING, OVERDUE, CANCELLED.
- O mapeamento existente em `getInvoices.ts` (linhas 48-55) ja mapeia `dueDate`, `value`, `status`, `description`, `invoiceUrl`. Adicionar `paymentDate` ao mapeamento.
- Sem necessidade de paginacao — 15 registros e um volume baixo, a chamada retorna em < 1s.

## 6. Riscos tecnicos levantados na investigacao

- `paymentDate` na doc Asaas e listado como filtro (`paymentDate[ge]`, `paymentDate[le]`) mas o schema exato do campo na resposta nao foi inspecionado diretamente — assumimos que segue o padrao ISO 8601 string, igual ao `dueDate`. Se o formato divergir, o `new Date(paymentDate)` pode retornar `Invalid Date`. Mitigacao: usar try/catch no format e fallback para "—".
