# Pente-fino: feature 006 (split-configuracoes)

> Contexto: `configuracoes`
> Varredura: `varredura-01-feature-006`
> Data: 2026-07-23
> Executado por subagente dedicado (general-purpose), em paralelo à inspeção de `relatorios`

## 1. Mapa da feature

### Specs
- `_reversa_forward/006-split-configuracoes/requirements.md` (RN-01..RN-07, RF-01..RF-08)
- `_reversa_forward/006-split-configuracoes/roadmap.md` (D-01..D-07, riscos R-*)
- `_reversa_forward/006-split-configuracoes/actions.md` — 6 ações (T001-T006), todas `[X]` (coding concluído em YOLO mode)

### Código
- `src/lib/asaas/getInvoices.ts` — `limit=15`, campo `data_pagamento`
- `src/components/layout/Sidebar.tsx` — submenu accordion "Configurações > Organização | Faturamento"
- `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx` — sidebar interna e bloco billing removidos
- `src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx` — bloco "Assinatura Ativa" removido, coluna "Pagamento" adicionada
- `src/app/api/billing/{invoices,cancel,info,subscription}/route.ts`

### Testes
`scripts/test-asaas-billing-payloads.ts` e `scripts/test-billing-route-fixes.ts` existem para billing, mas nenhum cobre `getInvoices.ts` (limit/`data_pagamento`) nem a lógica de submenu do `Sidebar.tsx`. Projeto não tem infraestrutura de teste de componente React (sem jest/testing-library).

### Bugs existentes na área
`BUG-20260722-T6R2` (mapeamento de status de pagamento Asaas, `resolved`) — correção preservada no código atual, não redescoberta.

## 2. Achados por lente

```yaml
- finding_id: F-CONFORMIDADE-01
  lens: "Conformidade com spec"
  summary: "Nenhum caminho de navegação até /app/configuracoes/faturamento em viewport mobile (<640px)"
  confidence: alta
  evidence:
    - "src/components/layout/DashboardLayout.tsx:15 (Sidebar hidden lg:flex)"
    - "src/components/layout/BottomNav.tsx:7-12 (sem item de Faturamento)"
    - "src/components/layout/DashboardHeader.tsx:130-131 (badge hidden sm:inline-flex)"
  suspected_severity: high
  signals: [operational-risk]
  promoted_to: BUG-20260723-MOB1

- finding_id: F-CONFORMIDADE-02
  lens: "Conformidade com spec"
  summary: "Com a sidebar colapsada, o item Configurações só alterna estado interno e nunca navega; os filhos nunca renderizam colapsado, tornando o clique sem efeito visível"
  confidence: alta
  evidence:
    - "src/components/layout/Sidebar.tsx:118-145 (sempre <button onClick={toggleExpanded}>)"
    - "src/components/layout/Sidebar.tsx:146 (children só sob {!collapsed && isExpanded})"
  suspected_severity: medium
  signals: [operational-risk]
  promoted_to: BUG-20260723-CLP1

- finding_id: F-CONFORMIDADE-03
  lens: "Conformidade com spec"
  summary: "RF-07 (submenu indica item ativo) falha em navegação direta/reload — expandedMenu não inicializa pelo pathname"
  confidence: alta
  evidence:
    - "src/components/layout/Sidebar.tsx:52 (useState sem inicializador por pathname)"
  suspected_severity: low
  signals: []
  promoted_to: BUG-20260723-ACT1

- finding_id: F-FLUXODEDADOS-01
  lens: "Fluxo de dados"
  summary: "formatDate() pode gerar offset de 1 dia em vencimento/pagamento se a Asaas retornar data pura (sem hora), por parse implícito como UTC renderizado em UTC-3"
  confidence: média
  evidence:
    - "src/app/(dashboard)/app/(protected)/configuracoes/faturamento/page.tsx:51-53,186"
    - "roadmap.md da 006, risco documentado com a mesma prescrição de código como 'mitigação'"
  suspected_severity: medium
  signals: [data-corruption]
  promoted_to: BUG-20260723-DAT1

- finding_id: F-CONTRATOS-01
  lens: "Contratos e integrações"
  summary: "getInvoices envia sort/order não documentados pela API pública da Asaas — risco de limit=15 não trazer as faturas mais recentes"
  confidence: média
  evidence:
    - "src/lib/asaas/getInvoices.ts:44"
    - "WebFetch docs.asaas.com/reference/list-payments (2026-07-23): sort/order ausentes dos 25 params documentados"
  suspected_severity: high
  signals: [data-corruption]
  promoted_to: BUG-20260723-SRT1

- finding_id: F-CONTRATOS-02
  lens: "Contratos e integrações"
  summary: "nada encontrado — limit=15 está dentro do máximo real da API (100), confirmado via documentação"
  confidence: alta
  evidence: ["WebFetch docs.asaas.com/reference/list-payments"]
  suspected_severity: low
  signals: []
  promoted_to: null

- finding_id: F-ERROS-01
  lens: "Estados de erro e edge cases"
  summary: "getInvoices() engole erro de rede/API da Asaas e retorna [] — indistinguível de 'org sem faturas', apesar da spec da 006 exigir a distinção"
  confidence: alta
  evidence:
    - "src/lib/asaas/getInvoices.ts:47,59-61"
    - "src/app/api/billing/invoices/route.ts:24-25"
  suspected_severity: medium
  signals: [operational-risk]
  promoted_to: BUG-20260723-ERR1

- finding_id: F-SEGURANCA-01
  lens: "Segurança/autorização (condicional)"
  summary: "nada encontrado — adminOnly do submenu não é só visual; rotas de billing checam role server-side independente da UI"
  confidence: alta
  evidence:
    - "src/app/api/billing/invoices/route.ts:14-16"
    - "src/app/api/billing/cancel/route.ts:33-35"
    - "faturamento/page.tsx:92-94 (redirect não-admin)"
  suspected_severity: low
  signals: [security]
  promoted_to: null

- finding_id: F-TESTES-01
  lens: "Cobertura de testes"
  summary: "Dívida técnica (não é bug): nenhum teste cobre getInvoices.ts (limit=15, data_pagamento) nem a lógica de submenu; sem infra de teste de componente React"
  confidence: alta
  evidence:
    - "scripts/test-asaas-billing-payloads.ts e test-billing-route-fixes.ts não referenciam getInvoices/limit=15/data_pagamento"
    - "package.json sem jest/vitest/testing-library"
  suspected_severity: low
  signals: []
  promoted_to: null
```

## 3. Clusters

`F-CONFORMIDADE-01`, `F-CONFORMIDADE-02` e `F-CONFORMIDADE-03` convergem no mesmo componente (`Sidebar.tsx`) e na mesma causa estrutural: o submenu novo foi desenhado/testado só para o caso "desktop, não-colapsado, navegação por clique dentro do app" — os três outros estados (mobile, colapsado, acesso direto) ficaram descobertos. `actions.md#T006` marca a checagem de responsividade como concluída, mas na prática só cobriu um dos quatro estados possíveis.

`F-FLUXODEDADOS-01` e `F-CONTRATOS-01` compartilham a mesma raiz de incerteza: ambos dependem do formato exato de resposta da API da Asaas (datas e ordenação), que não pôde ser confirmado empiricamente nesta sessão por falta de acesso a ambiente sandbox/produção real.

## 4. O que NÃO foi coberto

- Não foi possível confirmar empiricamente (sem acesso a customer real/sandbox da Asaas): o formato de wire exato de `dueDate`/`paymentDate` (`F-FLUXODEDADOS-01`), e se `sort`/`order` são de fato respeitados pela API (`F-CONTRATOS-01`)
- Nenhum teste em browser real (Playwright/Chrome) foi executado para os 3 achados de UI — toda evidência é leitura de código, não captura de tela
- Lente de concorrência: não aplicável de forma relevante (área é majoritariamente leitura de faturas, sem escrita concorrente)

## Bugs registrados

| ID | Severidade | Título |
|---|---|---|
| BUG-20260723-MOB1 | high | Sem navegação mobile até Faturamento |
| BUG-20260723-CLP1 | medium | Submenu colapsado não navega |
| BUG-20260723-ERR1 | medium | Erro de API da Asaas vira lista vazia |
| BUG-20260723-SRT1 | high | sort/order não documentados na Asaas |
| BUG-20260723-ACT1 | low | Item ativo não destaca em reload |
| BUG-20260723-DAT1 | medium | Possível offset de 1 dia nas datas |
