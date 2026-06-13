# Auditoria UI/UX — Dashboard Fase 5
**Data:** 2026-05-02 · **Revisado por:** Claude Code  
**Escopo:** Área logada pós-refatoração (`src/app/(dashboard)/app/` + `src/components/`)  
**Referências:** PRD v2 § 5.x, DESIGN_SKILL.md, GUIA_IMPLEMENTACAO.md Fase 5

---

## Sumário executivo

A estrutura geral está correta: layout sidebar+main, BottomNav mobile, rotas protegidas, tokens de design bem definidos, dark mode estruturado. Os problemas encontrados se concentram em **4 grupos**: bugs funcionais (props ignorados), inconsistências com o DESIGN_SKILL, ausência de componentes previstos no PRD, e refinamentos de responsividade/UX.

**Criticidade:**
- 🔴 Bug que quebra funcionalidade ou viola regra de segurança/acesso
- 🟠 Inconsistência significativa com PRD/DESIGN_SKILL
- 🟡 Refinamento UX/visual
- 🔵 Observação / dívida técnica

---

## 1. Bugs funcionais 🔴

### 1.1 Props ignoradas em `Heatmap` e `AIInsightsCard`

**Arquivos:** `src/app/(dashboard)/app/(protected)/page.tsx:359–362`, `src/components/ui/Heatmap.tsx:21`, `src/components/ui/AIInsightsCard.tsx:15`

```tsx
// page.tsx — passa props que não existem nos componentes
<Heatmap data={metrics?.byChannel} loading={loadingMetrics} />
<AIInsightsCard metrics={metrics || undefined} loading={loadingMetrics} />
```

Ambos os componentes ignoram estas props silenciosamente — eles fazem seu próprio `fetch` interno. O Heatmap busca `/api/dashboard/heatmap` e o AIInsightsCard busca `/api/dashboard/insights`. As props `data` e `loading` passadas pela página nunca são lidas.

**Consequência:** Heatmap e AIInsightsCard têm estados de loading independentes dos MetricCards. A página carrega com 3 estados de loading paralelos e independentes. Não há coordenação de estados.

**Solução necessária:** Decidir estratégia — ou os componentes aceitam props (data/loading passados de fora) ou continuam fazendo fetch próprio (mas então não recebem props). Atualmente, ambas as abordagens coexistem incoerentemente.

---

### 1.2 Plano sem gate no Assistente de IA (CaseDetail)

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx:644–654`

O botão "Assistente de IA" é exibido e funcional para todos os planos, incluindo "entrada". PRD § 5.2 e PRD § 3 especificam que o assistente IA é exclusivo de Gestão e Enterprise.

```tsx
// Não há verificação de plano aqui
<Button onClick={() => setAiOpen(true)}>
  Assistente de IA
</Button>
```

**Solução:** Adicionar `user?.plano === "entrada"` → mostrar banner de upgrade em vez do botão funcional.

---

### 1.3 `window.location.assign` em vez de `router.push`

**Arquivo:** `src/app/(dashboard)/app/(protected)/page.tsx:299`

```tsx
onRowClick={(item) => window.location.assign(`/app/casos/${item.id}`)}
```

Causa full page reload ao clicar em linha da tabela. Next.js App Router perde estado de SWR e contexto de auth ao fazer reload completo.

**Solução:** Usar `useRouter()` e `router.push(...)`.

---

### 1.4 Dark mode não ativa sem `data-theme`

**Arquivo:** `src/styles/tokens.css:206–241`

```css
@media (prefers-color-scheme: dark) {
  :root[data-theme="auto"],
  :root[data-theme="dark"] { ... }
}
```

O seletor exige que o atributo `data-theme` esteja presente no `:root`. Nenhum componente ou layout define esse atributo. O dark mode nunca ativa na prática mesmo com sistema configurado para dark.

**Solução (duas opções):**
- Opção A: Adicionar `<html data-theme="auto">` no `layout.tsx` raiz.
- Opção B: Remover o seletor de atributo — usar só `:root` dentro da media query (aplica sempre em dark system).

---

### 1.5 `filtro=urgente` ignorado na página de Casos

**Arquivos:** `page.tsx (overview):137–139`, `src/app/(dashboard)/app/(protected)/casos/page.tsx:87–165`

O alerta crítico linka para `/app/casos?filtro=urgente`:
```tsx
<Link href="/app/casos?filtro=urgente">Ver casos</Link>
```

Mas `CasosPage` não lê o query param `filtro` da URL — ele só lê `status`, `urgency`, `channel`, `sortBy`. O link funciona mas não aplica nenhum filtro.

**Solução:** Ler `searchParams.get("filtro")` e mapear `"urgente"` → `urgencyFilter = "4"` (pré-selecionando urgência ≥ 4).

---

### 1.6 Prazo salva automaticamente no `onBlur`

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx:682–685`

```tsx
<input type="date" onBlur={handleSavePrazo} ... />
```

Qualquer clique fora do campo de data aciona o `PATCH` para o servidor, mesmo que o usuário não tenha intenção de salvar. Em mobile, um toque acidental resulta em salvamento indesejado.

**Solução:** Adicionar botão "Salvar" explícito, ou comparar com o valor original antes de salvar.

---

## 2. Inconsistências com PRD / DESIGN_SKILL 🟠

### 2.1 Uso do termo "denúncias" na interface

**Arquivos:** `page.tsx (overview):247` e `relatorios/page.tsx:189`

```tsx
// overview
<p>Últimas denúncias recebidas via canais oficiais</p>

// relatorios  
<p>Análise profunda do canal nos últimos 90 dias.</p>  // OK
```

PRD § 4.1 Tela 2 e DESIGN_SKILL: o verbo "denunciar" e o substantivo "denúncia" **nunca** devem aparecer na interface — usar "relato", "contar", "informar". Na overview o título do card viola essa regra.

**Solução:** Substituir por "Relatos Recentes" (já usado no `<h2>`) e "Últimos relatos recebidos".

---

### 2.2 Fonte `Inter` como body font

**Arquivo:** `src/styles/tokens.css:88`

```css
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

`DESIGN_SKILL.md` lista Inter explicitamente como fonte a **evitar**: "Inter, Roboto, Arial, system-ui, -apple-system — evite completamente". Alternativas sugeridas: Plus Jakarta Sans, Instrument Sans, Sora, DM Sans.

**Nota:** A fonte display `Calistoga` é uma escolha acertada e com caráter editorial. O body precisa de par complementar adequado.

**Sugestão:** Substituir Inter por Plus Jakarta Sans ou Instrument Sans — ambas têm boa legibilidade em tamanhos pequenos e disponíveis no Google Fonts.

---

### 2.3 Gráfico de categorias ausente

**Arquivo:** `page.tsx (overview)` — ausente

PRD § 5.2 "Visão Geral": "Gráfico de categorias (barras horizontais — últimos 6 meses)". Este componente não existe. O dashboard overview tem: MetricCards, CriticalAlert, RecentCases, Heatmap, AIInsightsCard — mas **nenhum gráfico de categorias**.

**Sugestão:** Adicionar barras horizontais (sem biblioteca externa — CSS puro funciona bem) mostrando distribuição de categorias. Pode usar `metrics.byCategory` se o endpoint retornar, ou criar chamada específica.

---

### 2.4 Mapa de calor usa uma única cor em vez de verde/amarelo/vermelho

**Arquivos:** `Heatmap.tsx:11–17`, `relatorios/page.tsx:85–90`

PRD § 5.2: "Grid de células coloridas (verde/amarelo/vermelho) por departamento." Ambas as implementações usam apenas a cor `--color-accent` (coral) em diferentes opacidades. O resultado é uma escala monocromática em coral — sem a semântica de risco verde→vermelho esperada.

**Sugestão de algoritmo de cores:**
```
0       → transparente (sem dados)
1–33%   → verde   (#1A7A5A) — baixo risco
34–66%  → amarelo (#B07020) — risco moderado
67–100% → vermelho/coral (#B03030 / #C05A4A) — alto risco
```

Isso alinha com as variáveis de urgência já definidas nos tokens.

---

### 2.5 Sidebar sem estado colapsado

**Arquivo:** `src/components/layout/Sidebar.tsx`

DESIGN_SKILL.md: "Sidebar: largura de 240px colapsada para 64px (ícones)". A sidebar atual tem largura fixa de 240px sem toggle de colapso no desktop. Não há ícone-only mode.

**Impacto:** Em telas de 1024px–1280px, a sidebar ocupa 240px deixando apenas 784px para o conteúdo, comprometendo tabelas e cards de métricas.

---

### 2.6 Paginação da tabela de casos não é windowed

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/page.tsx:355–369`

```tsx
{Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
  const p = i + 1; // Sempre mostra páginas 1, 2, 3, 4, 5
```

Se há 20 páginas e o usuário está na 15, os botões mostram páginas 1–5. Não há como navegar para a página 15 pelos botões numerados (só com Anterior/Próximo em sequência).

**Solução:** Implementar paginação tipo ellipsis: `[1] ... [13] [14] [15] [16] [17] ... [20]`.

---

### 2.7 Dois componentes de Heatmap com implementações diferentes

**Arquivos:** `src/components/ui/Heatmap.tsx`, `src/app/(dashboard)/app/(protected)/relatorios/page.tsx:71–153`

Há duas implementações do heatmap: um componente reutilizável (`Heatmap.tsx`) e outro inline em `relatorios/page.tsx` (`HeatmapTable`). São diferentes:

| Aspecto | `Heatmap.tsx` | `HeatmapTable` (relatorios) |
|---|---|---|
| Busca dados | Fetch próprio via `/api/dashboard/heatmap` | Recebe `data` como prop |
| Coluna sticky | Não | Sim (`sticky left-0`) |
| Altura das células | Linha de tabela `h-10` | Div `h-11` com `rounded-lg` |
| Tooltip | Não | Sim (via `title`) |
| Legenda | Gradient CSS (pode não funcionar) | 5 swatches discretos |
| Filtro de categoria | Sim (select) | Não |

O `HeatmapTable` de relatorios tem melhor UX. O `Heatmap.tsx` tem o filtro de categoria.

**Sugestão:** Unificar em um componente com props para `data`, `loading`, e `showFilter`.

---

### 2.8 Role exibida incorretamente no DashboardHeader

**Arquivo:** `src/components/layout/DashboardHeader.tsx:95`

```tsx
{authUser?.role === "admin" ? "Gestor" : "Usuário"}
```

Admin aparece como "Gestor" e qualquer outro role aparece como "Usuário" (inclusive gestor e auditor). Admin deveria mostrar "Admin", gestor deveria mostrar "Gestor", auditor deveria mostrar "Auditor".

---

## 3. Ausências em relação ao checklist Fase 5 🟠

### 3.1 Visualização e download de anexos ausente

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx`

PRD § 5.2 "Detalhe do Caso": "Visualização de anexos: thumbnail imagens, player áudio/vídeo inline, download autenticado para todos os tipos." A página de detalhe não tem seção de anexos. O `CaseData` nem inclui o campo `anexos` na interface.

**Itens faltantes:**
- Campo `anexos[]` na interface `CaseData`
- Componente de listagem de anexos
- Lógica de signed URL para download autenticado
- Thumbnails para imagens, player para áudio/vídeo

---

### 3.2 Breadcrumbs visíveis ausentes no DashboardHeader

**Arquivo:** `src/components/layout/DashboardHeader.tsx`

O componente aceita `breadcrumbs[]` como prop mas **não renderiza breadcrumbs** em lugar algum. Todas as páginas passam breadcrumbs, mas eles são ignorados visualmente.

```tsx
// DashboardHeader — breadcrumbs aceito como prop mas nunca renderizado
interface DashboardHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  // ...
}
// Nenhum JSX renderiza `breadcrumbs`
```

PRD § 5.2: layout base inclui "Breadcrumb em todas as páginas".

---

### 3.3 Busca global (⌘K) não funcional

**Arquivo:** `src/components/layout/DashboardHeader.tsx:65–73`

O campo de busca com `⌘ K` não tem handler e não abre nenhum command palette ou modal de busca. Para o usuário é um elemento não-interativo. Deve ser removido ou implementado.

---

### 3.4 Notificações sem painel

**Arquivo:** `src/components/layout/DashboardHeader.tsx:78–87`

O ícone de Bell exibe contador de notificações não lidas (via SWR em `/api/dashboard/notifications/count`) mas não tem handler de clique. Clicar no sino não faz nada.

---

## 4. Refinamentos UI/UX 🟡

### 4.1 Sparkline no MetricCard é estático/decorativo

**Arquivo:** `src/components/ui/MetricCard.tsx:107–115`

```tsx
// Pontos hardcoded — não refletem dados reais
<polyline points="0,22 14,17 28,11 42,18 56,12 70,16 84,9" />
```

DESIGN_SKILL.md menciona "números dos cards: count-up animado". A sparkline decorativa pode confundir usuários por parecer dado real. Duas opções: remover (mais honesto) ou alimentar com dados históricos reais (mais útil).

---

### 4.2 Animação count-up não implementada

**Arquivo:** `src/components/ui/MetricCard.tsx`

`globals.css` define `@keyframes countUp` e `DESIGN_SKILL.md` especifica "count-up animado na entrada da página". O MetricCard só faz `animate-fade-in` — o número aparece diretamente sem animação de contagem.

**Sugestão:** Hook `useCountUp(targetValue, duration)` que interpola de 0 até o valor final em ~800ms na primeira montagem.

---

### 4.3 Legenda do Heatmap pode não renderizar corretamente

**Arquivo:** `src/components/ui/Heatmap.tsx:133`

```tsx
className="... bg-gradient-to-r from-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-card))] to-[var(--color-accent)]"
```

O `color-mix()` dentro de colchetes arbitrários do Tailwind contém espaços internos (`_` é substituído por espaço em JIT). Isso pode gerar uma classe CSS inválida ou não compilar corretamente em Tailwind v4.

**Solução:** Usar `style` inline para o gradiente ou definir uma CSS custom property para o valor de `from`.

---

### 4.4 Tabela de Casos sem móbile cards

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/page.tsx:306–335`

A overview page (`page.tsx`) tem dupla implementação: tabela para `md:` e cards para mobile. A página de casos só tem tabela com `overflow-x-auto`. Em mobile, o usuário tem que fazer scroll horizontal numa tabela com 7 colunas. Uma experiência de card list (similar ao que existe na overview) melhoraria significativamente a usabilidade mobile.

---

### 4.5 Barras de canal com percentual relativo ao máximo (não ao total)

**Arquivo:** `src/app/(dashboard)/app/(protected)/relatorios/page.tsx:291–298`

```tsx
const max = Math.max(...Object.values(metrics.byChannel), 1);
const percentage = Math.round((count / max) * 100);
```

O canal com mais relatos sempre mostra 100%. Isso distorce a percepção — se Web tem 8 relatos e WhatsApp tem 7, ambas as barras ficam quase cheias mesmo que cada uma seja ~11% do total. Usar percentual do total é mais informativo.

---

### 4.6 Cards de urgência na overview sem semântica visual clara

**Arquivo:** `src/app/(dashboard)/app/(protected)/page.tsx:262`

```tsx
<span className={`h-2 w-2 rounded-full ${urgencia >= 4 ? "bg-danger" : urgencia === 3 ? "bg-warning" : "bg-success"}`} />
```

O indicador de urgência na tabela da overview é um círculo de 2x2 — muito pequeno para transmitir urgência crítica. Inconsistência com a página de casos que usa o componente `UrgencyIndicator` (mais expressivo).

---

### 4.7 `custom-scrollbar` undefined

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx:507`

```tsx
className="... max-h-[450px] overflow-y-auto pr-2 custom-scrollbar"
```

`custom-scrollbar` não está definido em nenhum arquivo CSS. A classe não tem efeito. Os estilos de scrollbar globais (`::-webkit-scrollbar`) em `globals.css` já se aplicam, mas se havia intenção de customizar o scroll da área de chat especificamente, a classe está ausente.

---

### 4.8 `AIInsightsCard` placeholder na overview é muito grande

**Arquivo:** `src/components/ui/AIInsightsCard.tsx`

O componente tem duas seções no estado `data`: um bloco de texto com quote decorativo e um painel de recomendações. O layout `lg:grid-cols-[1.1fr_0.9fr]` expande o card horizontalmente. Na coluna direita da overview (380px), isso força o card para um layout de coluna única `lg:` que não existe — ficando estreito e com o `"` gigante tornando-se dominante visualmente.

**Sugestão:** Revisar o layout interno para funcionar bem em container estreito (< 420px). O grid de 2 colunas só deve ativar acima de `xl:` ou quando o container é suficientemente largo.

---

### 4.9 Prazo médio em horas na overview, dias no relatorio

**Arquivos:** `page.tsx:226`, `relatorios/page.tsx:239`

```tsx
// overview — exibe em horas
value={metrics?.prazoMedio != null ? `${metrics.prazoMedio}h` : "—"}

// relatorios — exibe em dias
value={metrics.prazoMedio !== null ? `${metrics.prazoMedio}d` : "—"}
```

A mesma métrica é exibida em unidades diferentes nas duas páginas. O endpoint `/api/dashboard/metrics` retorna um único valor — se é horas, o relatorios está errado; se é dias, a overview está errada.

---

### 4.10 SLA fallback de 15 dias incorreto (PRD define 30 dias)

**Arquivo:** `src/app/(dashboard)/app/(protected)/page.tsx:109–110`

```tsx
// Fallback de 15 dias
deadlineMs = createdDate.getTime() + (15 * 24 * 60 * 60 * 1000);
```

PRD § 4.1 Tela 3: "Você receberá retorno em até 30 dias." O fallback do SLA deveria ser 30 dias, não 15.

---

## 5. Dívidas técnicas 🔵

### 5.1 `text-[var(--text-sm)]` vs tokens Tailwind

**Arquivos:** `StatusTimeline.tsx`, `CaseRow.tsx`, `[caseId]/page.tsx`

Alguns componentes usam `text-[var(--text-sm)]` (referência a token CSS dentro de classe arbitrária Tailwind). O `@theme inline` em `globals.css` não mapeia `--text-*` como escalas de tipo Tailwind. Isso funciona mas não é a forma canônica — melhor usar `text-sm` do Tailwind direto, ou definir as escalas no `@theme inline`.

---

### 5.2 Plano fallback "ENTERPRISE" na Sidebar

**Arquivo:** `src/components/layout/Sidebar.tsx:114`

```tsx
<p>Plano {user?.plano?.toUpperCase() || "ENTERPRISE"}</p>
```

Usuário sem `plano` definido vê "Plano ENTERPRISE" — informação incorreta. Fallback deveria ser "—" ou "ENTRADA" (plano mais restritivo como default seguro).

---

### 5.3 Breadcrumbs `periodLabel` aceito mas não renderizado

**Arquivo:** `src/components/layout/DashboardHeader.tsx`

A prop `periodLabel` é aceita na interface mas não há JSX que a use. Limpeza de interface ou implementação.

---

### 5.4 Triagem IA: `lei_aplicavel` como string, PRD define como array

**Arquivo:** `src/app/(dashboard)/app/(protected)/casos/[caseId]/page.tsx:473`

```tsx
<dd>{caseData.triagem_ia.lei_aplicavel}</dd> // string
```

PRD § 2.2: `lei_aplicavel[]` é um **array** de enums. O componente renderiza como string simples, o que pode quebrar se o array tiver múltiplos valores (ex: `["lei_14457", "nr1"]` renderizaria `lei_14457,nr1`).

---

## 6. Resumo de prioridades sugeridas

### Grupo 1 — Fazer antes de continuar (bloqueantes ou bugs)
1. 🔴 1.1 — Resolver a inconsistência de props em Heatmap e AIInsightsCard (escolher uma estratégia)
2. 🔴 1.4 — Adicionar `data-theme="auto"` no root layout para dark mode funcionar
3. 🔴 1.2 — Adicionar gate de plano no botão Assistente de IA (CaseDetail)
4. 🔴 1.3 — Substituir `window.location.assign` por `router.push`
5. 🔴 1.5 — Implementar leitura de `filtro=urgente` na URL da página de casos

### Grupo 2 — Refinamentos de alto impacto (UX percebida)
6. 🟠 2.4 — Heatmap: implementar escala verde/amarelo/vermelho em vez de coral monocromático
7. 🟠 2.7 — Unificar os dois HeatmapTable em um único componente reutilizável
8. 🟠 3.2 — Renderizar breadcrumbs no DashboardHeader
9. 🟠 3.1 — Adicionar seção de anexos no detalhe do caso
10. 🟡 4.4 — Mobile cards na página de casos (em vez de só tabela com scroll)

### Grupo 3 — Qualidade visual (antes de demo/clientes)
11. 🟡 4.2 — Implementar count-up nos MetricCards
12. 🟡 4.1 — Decidir sobre sparkline (remover ou tornar real)
13. 🟠 2.3 — Adicionar gráfico de categorias na overview
14. 🟠 2.2 — Substituir Inter por fonte body com personalidade (Plus Jakarta Sans ou similar)
15. 🟡 4.3 — Corrigir gradiente da legenda do Heatmap (usar style inline)

### Grupo 4 — Polimento / dívidas técnicas
16. 🟠 2.1 — Substituir "denúncias" por "relatos" na interface
17. 🟠 2.8 — Corrigir exibição de role no header
18. 🟡 4.9 — Unificar unidade do prazo médio (h ou d) entre overview e relatórios
19. 🟡 4.10 — Corrigir fallback SLA de 15 para 30 dias
20. 🔵 5.2 — Corrigir fallback de plano na Sidebar ("—" em vez de "ENTERPRISE")

---

## 7. O que está bem — manter sem alteração

- **Tokens de design** (`tokens.css`): completo, sistemático, dark mode estruturado corretamente (só falta o `data-theme`).
- **Layout responsivo** (`DashboardLayout.tsx`): drawer mobile + sidebar desktop funcionais.
- **BottomNav mobile**: limpo, correto, com estado ativo.
- **CaseRow**: bem construído com estados de urgência, deadline e dias em aberto.
- **Sistema de audit logs no detalhe**: polling, imutabilidade, labels legíveis.
- **Bloqueio de mencionados**: implementado corretamente — filtro no dropdown de responsável e no de mencionados.
- **Estados vazios**: todos os componentes têm empty state desenhado.
- **Loading states**: Skeleton em todos os estados assíncronos.
- **Acessibilidade básica**: `aria-label` nos elementos principais, `focus-visible` global, sem `outline: none` nu.
- **MetricCard**: lógica de tonalidade (danger=up é ruim, success=up é bom) está correta.
- **Proteção de rotas**: middleware verificando auth em `/app/*`.
- **Seletor de status no CaseDetail**: audit log gerado ao mudar status (via PATCH).

---

*Documento gerado em 2026-05-02. Validar cada item com o usuário antes de implementar.*

---

## 8. Controle de implementação

**Última atualização:** 2026-05-02 · **Implementado por:** Claude Code

### ✅ Grupo 1 — Bloqueantes (todos concluídos)

| # | Item | Arquivo(s) | Status |
|---|------|-----------|--------|
| 1 | 1.1 Props ignoradas em Heatmap e AIInsightsCard | `page.tsx (overview)` | ✅ Props inválidas removidas; componentes self-fetch mantidos |
| 2 | 1.4 Dark mode sem `data-theme` | `src/app/layout.tsx` | ✅ `data-theme="auto"` adicionado no `<html>` |
| 3 | 1.2 Gate de plano no Assistente de IA | `casos/[caseId]/page.tsx` | ✅ Banner de upgrade para plano `entrada` |
| 4 | 1.3 `window.location.assign` → `router.push` | `page.tsx (overview):~302` | ✅ `useRouter` importado; `router.push` aplicado |
| 5 | 1.5 `filtro=urgente` ignorado na URL | `casos/page.tsx` | ✅ `useSearchParams` adicionado; `filtro=urgente` mapeia para `urgencyFilter="4"` |

### ✅ Grupo 2 — Refinamentos de alto impacto (todos concluídos)

| # | Item | Arquivo(s) | Status |
|---|------|-----------|--------|
| 6 | 2.4 Heatmap escala verde/amarelo/vermelho | `Heatmap.tsx` | ✅ `getRiskStyle()` com escala semântica de risco |
| 7 | 2.7 Unificar dois HeatmapTable | `Heatmap.tsx`, `relatorios/page.tsx` | ✅ Props `externalData`, `showFilter`, `stickyFirstCol`, `title`, `subtitle` adicionadas; `HeatmapTable` inline removida |
| 8 | 3.2 Breadcrumbs visíveis no DashboardHeader | `DashboardHeader.tsx` | ✅ Renderizados abaixo do nome da org; substituem "Ambiente de produção" quando presentes |
| 9 | 3.1 Seção de anexos no detalhe do caso | `casos/[caseId]/page.tsx` | ✅ Campo `anexos[]` em `CaseData`; seção com lista + download |
| 10 | 4.4 Mobile cards na página de casos | `casos/page.tsx` | ✅ Cards mobile (urgência, categoria, protocolo, status); tabela oculta em `md:` |

### ✅ Grupo 3 — Qualidade visual (todos concluídos)

| # | Item | Arquivo(s) | Status |
|---|------|-----------|--------|
| 11 | 4.2 Count-up nos MetricCards | `MetricCard.tsx` | ✅ Hook `useCountUp` com `requestAnimationFrame`; ativa ao `visible` |
| 12 | 4.1 Sparkline decorativa removida | `MetricCard.tsx` | ✅ SVG polyline removido |
| 13 | 2.3 Gráfico de categorias na overview | `page.tsx (overview)` | ✅ Seção de barras horizontais; visível quando `metrics.byCategory` retorna dados |
| 14 | 2.2 Substituir Inter por Plus Jakarta Sans | `layout.tsx`, `tokens.css` | ✅ `Plus_Jakarta_Sans` como fonte body; `--font-jakarta` variável |
| 15 | 4.3 Gradiente da legenda Heatmap (class inválida) | `Heatmap.tsx` | ✅ Legenda substituída por 3 swatches inline (verde/amarelo/vermelho) |

### ✅ Grupo 4 — Polimento / dívidas técnicas (todos concluídos)

| # | Item | Arquivo(s) | Status |
|---|------|-----------|--------|
| 16 | 2.1 "denúncias" → "relatos" | `page.tsx (overview)`, `relatorios/page.tsx` | ✅ Corrigido em ambos os arquivos |
| 17 | 2.8 Role exibida incorretamente no DashboardHeader | `DashboardHeader.tsx` | ✅ Map `admin→Admin`, `gestor→Gestor`, `auditor→Auditor` |
| 18 | 4.9 Prazo médio em unidades diferentes | `relatorios/page.tsx` | ✅ `d` → `h`; ambas as páginas exibem horas |
| 19 | 4.10 SLA fallback de 15 dias (PRD define 30) | `page.tsx (overview)` | ✅ Fallback corrigido para 30 dias |
| 20 | 5.2 Fallback de plano "ENTERPRISE" na Sidebar | `Sidebar.tsx` | ✅ Fallback corrigido para `"—"` |

### ✅ Complementares (concluídos em etapa posterior)

| # | Item | Arquivo(s) | Status |
|---|------|-----------|--------|
| — | 1.6 Prazo salva no `onBlur` | `casos/[caseId]/page.tsx` | ✅ `onBlur` removido; botão "Salvar prazo" aparece só quando valor difere do original |
| — | 2.5 Sidebar sem estado colapsado | `Sidebar.tsx` | ✅ Toggle colapse → 64px icon-only; `LogoSigilo variant="icon"` em modo colapsado |
| — | 2.6 Paginação não-windowed | `casos/page.tsx` | ✅ `getPaginationItems()` com ellipsis: `[1] … [13][14][15] … [20]` |
| — | 3.3 Busca global não funcional | `DashboardHeader.tsx`, `casos/page.tsx` | ✅ Enter navega para `/app/casos?protocol=…`; casos/page lê `protocol` da URL na inicialização |
| — | 3.4 Notificações sem painel | `DashboardHeader.tsx` | ✅ Dropdown com contagem de não lidas ao clicar no sino; fecha ao clicar fora |
| — | 4.5 Barras canal % relativo ao máximo | `relatorios/page.tsx` | ✅ Percentual agora relativo ao total (não ao maior valor) |
| — | 4.6 Indicador urgência pequeno na overview | `page.tsx (overview)` | ✅ `UrgencyIndicator` com `showLabel` substituiu dot `h-2 w-2` |
| — | 4.7 `custom-scrollbar` indefinida | `globals.css` | ✅ Classe definida com scrollbar de 4px para containers específicos |
| — | 4.8 AIInsightsCard layout estreito | `AIInsightsCard.tsx` | ✅ `lg:` → `xl:` no grid de 2 colunas; card funciona em containers menores |
| — | 5.1 `text-[var(--text-sm)]` não-canônico | `CaseRow.tsx`, `StatusTimeline.tsx` | ✅ Substituído por `text-[13px]` / `text-[12px]` |
| — | 5.3 `periodLabel` não renderizado | `DashboardHeader.tsx` | ✅ Renderizado como badge após breadcrumbs |
| — | 5.4 `lei_aplicavel` string vs array | `tipos/index.ts`, `casos/[caseId]/page.tsx` | ✅ Tipo atualizado para `string \| string[]`; render via `.join(", ")` quando array |
