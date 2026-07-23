# Pente-fino: feature 007 (limpeza-frontend)

> Contexto: `limpeza-frontend`
> Varredura: `varredura-01-feature-007`
> Data: 2026-07-23

## 1. Mapa da feature

### Specs
- `_reversa_forward/007-limpeza-frontend/requirements.md` (RF-01 a RF-06)
- `_reversa_forward/007-limpeza-frontend/actions.md` (T001-T006, todas `[X]`)
- Sem `roadmap.md` (feature simples, spec + actions direto)

### Código (verificado após commit `d7ae0c0`)
- Removidos: `ProgressSteps.tsx`, `RiskCell.tsx`, `PortalLayout.tsx`, `PortalHeader.tsx`, `api/billing/info/`, `api/billing/subscription/`, `api/reports/diagnostic/` (este último redundante com o fix já aplicado em `BUG-20260723-DGN1` na sessão anterior)
- `relatorios/[reportId]/page.tsx`: `useRouter` removido, confirmado
- `ui/index.ts`: barrel export limpo, sem `ProgressSteps`/`RiskCell`
- `DashboardLayout.tsx`: `ErrorBoundary` adicionado, envolvendo só `{children}`
- `Sidebar.tsx`: item "Insights" adicionado ao `NAV_ITEMS`, sem `adminOnly`
- **Não removidos** (apesar de listados em `actions.md#T001`): `ChatInput.tsx`, `ChatAttachment.tsx` — têm consumidor real

### Testes
Nenhum teste automatizado específico da feature 007 (é limpeza estrutural — typecheck/lint são os critérios de aceite explícitos das specs).

### Bugs existentes
Nenhum bug já registrado tocando `ErrorBoundary`, `adminOnly` de Insights, ou a divergência de `actions.md`. `BUG-20260723-DGN1` (contexto `relatorios`, já corrigido) tocou o mesmo endpoint de diagnóstico que `T004` desta feature também visava remover — redundante, não conflitante.

## 2. Achados por lente

```yaml
- finding_id: F-CONFORMIDADE-01
  lens: "Conformidade com spec"
  summary: "ErrorBoundary do DashboardLayout só envolve {children}; Sidebar/SuspensoBanner/BottomNav ficam fora, sem nenhum boundary superior — RF-05 parcialmente atendido"
  confidence: alta
  evidence:
    - "src/components/layout/DashboardLayout.tsx"
    - "src/app/(dashboard)/layout.tsx (sem ErrorBoundary)"
    - "grep -rn ErrorBoundary src/app/ (único uso fora é em widgets específicos da home)"
  suspected_severity: high
  signals: [operational-risk]
  promoted_to: BUG-20260723-EBD1

- finding_id: F-CONFORMIDADE-02
  lens: "Conformidade com spec"
  summary: "Sidebar 'Insights' (RF-06) sem adminOnly, inconsistente com o padrão do item irmão 'Configurações' e com o enquadramento admin-only da spec original (feature 003)"
  confidence: alta
  evidence:
    - "src/components/layout/Sidebar.tsx (NAV_ITEMS)"
    - "_reversa_forward/003-insights-ia-dashboard-admin/requirements.md#RF-02 (regeneração restrita a admin)"
    - "src/app/api/dashboard/insights/route.ts (GET sem checagem de role)"
  suspected_severity: medium
  signals: [operational-risk]
  promoted_to: BUG-20260723-ADM1

- finding_id: F-PROCESSO-01
  lens: "Conformidade com spec (aplicada à documentação/rastreabilidade, não ao código)"
  summary: "actions.md#T001 (marcado [X]) descreve deletar ChatInput.tsx/ChatAttachment.tsx, mas a execução real (corretamente) preservou os arquivos, que têm consumidor via ChatContainer.tsx — a premissa '0 imports' do requirements.md estava errada pra esses 2"
  confidence: alta
  evidence:
    - "_reversa_forward/007-limpeza-frontend/actions.md#T001"
    - "grep de consumidores: ChatContainer.tsx importa ambos, e é usado em /[slug]/chat/page.tsx"
    - "git show d7ae0c0 --stat confirma que só 4 dos 6 arquivos listados foram de fato deletados"
  suspected_severity: medium
  signals: []
  promoted_to: BUG-20260723-DOC1

- finding_id: F-FLUXODEDADOS-01
  lens: "Fluxo de dados"
  summary: "Date.now() chamado durante render em insights/page.tsx viola regra de pureza do React (eslint react-hooks/purity) — pré-existente à feature 003, mas com exposição aumentada pela nova navegação (RF-06)"
  confidence: alta
  evidence:
    - "npx eslint insights/page.tsx: 'Cannot call impure function during render... Date.now'"
  suspected_severity: low
  signals: []
  promoted_to: BUG-20260723-DTN1

- finding_id: F-TESTES-01
  lens: "Cobertura de testes"
  summary: "Dívida técnica (não é bug): nenhum teste cobre o ErrorBoundary novo nem a navegação nova; sem infra de teste de componente React (já registrado como dívida em varreduras anteriores)"
  confidence: alta
  evidence: ["ausência de qualquer scripts/test-*.ts relacionado a DashboardLayout/Sidebar/ErrorBoundary"]
  suspected_severity: low
  signals: []
  promoted_to: null

- finding_id: F-CONTRATOS-01
  lens: "Contratos e integrações"
  summary: "nada encontrado — remoção dos endpoints /api/billing/info, /api/billing/subscription e /api/reports/diagnostic confirmada sem quebrar nenhum consumidor (tsc limpo, nenhuma referência remanescente)"
  confidence: alta
  evidence: ["npx tsc --noEmit limpo pós-remoção"]
  suspected_severity: low
  signals: []
  promoted_to: null

- finding_id: F-SEGURANCA-01
  lens: "Segurança/autorização (condicional, ativada pelo achado de adminOnly)"
  summary: "GET /api/dashboard/insights não checa role nenhuma — mesma raiz do F-CONFORMIDADE-02, não um achado adicional separado"
  confidence: alta
  evidence: ["src/app/api/dashboard/insights/route.ts"]
  suspected_severity: medium
  signals: [security]
  promoted_to: BUG-20260723-ADM1
  note: "Merge com F-CONFORMIDADE-02 — mesmo bug, duas lentes convergindo"
```

## 3. Clusters

**Cluster de chrome desprotegido**: `EBD1` é isolado — nenhum outro achado compartilha a mesma causa raiz, mas é o de maior severidade (high) porque afeta TODA página do dashboard, não uma feature específica.

**Cluster de exposição de Insights**: `ADM1` (adminOnly ausente) e `DTN1` (Date.now impuro) convergem na mesma página (`insights/page.tsx`) recém-exposta pela navegação nova (RF-06) — `ADM1` é sobre QUEM pode acessar, `DTN1` é sobre um defeito de qualidade já existente que se torna mais visível com mais tráfego. Causas raiz independentes, mesmo alvo.

**`DOC1`** é um cluster à parte: não é um defeito de produto, é uma divergência entre o registro do ciclo forward (`actions.md`) e a execução real — o código está correto (não deletou o que não devia), só a documentação não foi atualizada pra refletir isso.

## 4. O que NÃO foi coberto

- Lentes de concorrência e configuração/migração: sem sinal relevante nesta feature (é limpeza estrutural, sem estado concorrente ou infra nova)
- Não foi feita verificação em browser real (Playwright/Chrome) do fallback visual do `ErrorBoundary` nem da navegação — evidência é 100% leitura de código + eslint + tsc
- Varredura ampla de `eslint src/` (fora do escopo de arquivos tocados pela feature 007) revelou 27 erros adicionais pré-existentes em arquivos não relacionados (`ThemeToggle.tsx`, `Tooltip.tsx`, `Heatmap.tsx`, etc.) — mencionados como contexto, não investigados a fundo nem registrados como bugs individuais nesta sessão (fora do escopo "feature 007")

## Bugs registrados

| ID | Severidade | Título |
|---|---|---|
| BUG-20260723-EBD1 | high | ErrorBoundary não cobre Sidebar/SuspensoBanner/BottomNav |
| BUG-20260723-ADM1 | medium | Insights sem adminOnly no sidebar |
| BUG-20260723-DOC1 | medium | actions.md diverge do código real (ChatInput/ChatAttachment) |
| BUG-20260723-DTN1 | low | Date.now() durante render em insights/page.tsx |
