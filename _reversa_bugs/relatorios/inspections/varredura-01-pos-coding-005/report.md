# Pente-fino: feature 005-relatorios-auto-geracao (pós-coding)

> Contexto: `relatorios`
> Varredura: `varredura-01-pos-coding-005`
> Data: 2026-07-23
> Gatilho: usuário pediu verificação de bugs logo após `/reversa-coding` da feature 005 (auto-geração de relatório ao acessar `/app/relatorios`)

## 1. Mapa da feature

### Specs
- `_reversa_forward/005-relatorios-auto-geracao/requirements.md` (RN-01 a RN-06, RF-01 a RF-08, 12 cenários Gherkin)
- `_reversa_forward/005-relatorios-auto-geracao/roadmap.md` (D-01 a D-09)
- `_reversa_forward/005-relatorios-auto-geracao/actions.md` (T001 a T013, todas `[X]`)
- `_reversa_sdd/addenda/004-relatorios-analiticos-pdf-nr1.md` (adendo vigente, spec da feature anterior sobre o mesmo módulo)
- `_reversa_sdd/domain.md` (regra 🟢 sobre bloqueio de plano suspenso/cancelado)

### Código
- `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` — componente principal, todo o T003-T013
- `src/lib/reports/report-filters.ts` — `getDefaultFilters`, `filtersEqual`, `isReportWithinHours` (T001)
- `src/app/api/reports/generate/route.ts` — `POST` (gera) e `GET` (lista) — não tocado pela feature 005, mas é a fonte de dados que a feature consome
- `functions/src/scheduledReports.ts` — geração mensal agendada (fora do escopo da feature 005, não tocado, citado no `investigation.md` original como precedente de "relatório sem clique")

### Testes
- `scripts/test-reports-auto-generate.ts` — 13 testes unitários de `report-filters.ts` (todos passando, confirmado no `actions.md`)
- Nenhum teste automatizado cobre a lógica React do componente (`useEffect`s de auto-geração, `GenerateError`, condição do botão "Tentar novamente") — projeto não tem framework de teste de componente (`jest`/`vitest`/`testing-library`), consistente com o 🔴 já registrado em `_reversa_sdd/architecture.md` ("Sem testes automatizados de aplicação")

### Dados
- Coleção Firestore `reports` (campos relevantes: `org_id`, `periodo`, `tipo`, `gerado_em`, `status`, `filtros`)
- `GET /api/reports/generate` — contrato de leitura consumido pelo `useSWR` da página
- `POST /api/reports/generate` — contrato de escrita, chamado agora automaticamente (mount) e manualmente (botões "Aplicar filtros"/"Tentar novamente")

### Bugs existentes da feature/módulo
Nenhum bug registrado ainda para `reports`/`relatorios` antes desta varredura (contexto criado agora).

## 2. Achados por lente

```yaml
- finding_id: F-spec-01
  lens: "Conformidade com spec"
  summary: "isReportWithinHours não verifica departamento/categoria porque o GET nunca expõe esse dado, permitindo reaproveitar relatório filtrado como se fosse o padrão da org"
  confidence: alta
  evidence:
    - "src/lib/reports/report-filters.ts:46-72"
    - "src/app/api/reports/generate/route.ts:279-292"
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RN-01"
  suspected_severity: high
  signals: [data-corruption?]
  promoted_to: BUG-20260723-SCP1

- finding_id: F-dados-01
  lens: "Fluxo de dados"
  summary: "Campo filtros gravado no Firestore (departamentos/categorias) nunca é devolvido pelo GET, tornando-o inacessível para qualquer lógica client-side que precise saber o escopo real de um relatório"
  confidence: alta
  evidence: ["src/app/api/reports/generate/route.ts:227-233 (grava filtros)", "route.ts:279-292 (GET não devolve filtros)"]
  suspected_severity: high
  signals: [data-corruption?]
  promoted_to: BUG-20260723-SCP1
  note: "Mesma causa raiz de F-spec-01 — merge, um bug só (SCP1)"

- finding_id: F-erro-01
  lens: "Estados de erro e edge cases"
  summary: "Bloqueio de plano suspenso/cancelado retorna código de máquina 'plan_suspended' sem tradução, exibido cru na tela — pré-existente, mas agora dispara sozinho a cada acesso (sem clique)"
  confidence: alta
  evidence:
    - "src/app/api/reports/generate/route.ts:90-92"
    - "src/app/(dashboard)/app/(protected)/relatorios/page.tsx:163-164,392-397"
    - "src/app/api/assistant/route.ts:61 (mesmo padrão, fora do escopo desta feature)"
  suspected_severity: medium
  signals: [operational-risk?]
  promoted_to: BUG-20260723-PSU1

- finding_id: F-concorrencia-01
  lens: "Concorrência e consistência"
  summary: "Reaproveitamento calculado 100% no client (D-02) sem dedupe no servidor — acessos concorrentes (multi-aba/multi-usuário) podem gerar 2 relatórios pro mesmo período (TOCTOU)"
  confidence: alta
  evidence:
    - "_reversa_forward/005-relatorios-auto-geracao/roadmap.md#D-02"
    - "src/app/api/reports/generate/route.ts:110-240 (POST sem checagem de duplicidade)"
    - "_reversa_bugs/insights-ia-dashboard/bugs/BUG-20260722-TCT1-toctou-rate-limit (precedente da mesma classe no projeto)"
  suspected_severity: medium
  signals: [operational-risk?, intermittency?]
  promoted_to: BUG-20260723-DUP1

- finding_id: F-testes-01
  lens: "Cobertura de testes"
  summary: "Nenhum teste (automatizado ou script manual) exercita isReportWithinHours com departamento/categoria divergente, nem a lógica React (useEffects, GenerateError, showRetry) tem cobertura alguma"
  confidence: alta
  evidence: ["scripts/test-reports-auto-generate.ts (13 testes, nenhum varia depts/cats)"]
  suspected_severity: low
  signals: []
  promoted_to: null
  note: "Dívida técnica correlata a F-spec-01/SCP1, não é um defeito observável isolado — registrado aqui só como contexto pra quem for corrigir SCP1: o teste que prova o fix também precisa cobrir esse caso"

- finding_id: F-contrato-01
  lens: "Contratos e integrações"
  summary: "Nenhum contrato novo quebrado — POST/GET mantidos, conforme roadmap.md#7. Único ponto de atenção é o mesmo já capturado em F-dados-01 (GET não expõe filtros)"
  confidence: alta
  evidence: ["_reversa_forward/005-relatorios-auto-geracao/roadmap.md#7"]
  suspected_severity: low
  signals: []
  promoted_to: null
  note: "Sem achado novo — dedupe com F-dados-01"
```

## 3. Clusters

Nenhum cluster por arquivo/causa raiz comum entre os 3 bugs promovidos — cada um tem causa raiz independente (ausência de dado no contrato GET; falta de tradução de código de erro; ausência de dedupe server-side). A convergência é só de origem: os 3 nasceram da mesma varredura, na mesma feature, logo após o mesmo `/reversa-coding`.

Um cluster informal vale registrar: **SCP1 e DUP1 compartilham a mesma decisão de design como pano de fundo** — `D-02` ("reaproveitamento calculado 100% no client") — SCP1 é sobre o client não ter dado suficiente pra decidir corretamente, DUP1 é sobre múltiplos clients decidindo em paralelo sem coordenação. Quem for revisar `D-02` no roadmap deveria considerar os dois achados juntos, mesmo sendo bugs formalmente distintos.

## 4. O que NÃO foi coberto

- **Lentes condicionais não ativadas**: segurança/autorização (nenhum sinal de dado sensível novo ou auth alterada — RN-04/D-05 já mantêm o padrão existente), desempenho (nenhum loop N+1 novo identificado), configuração/migrations/flags (nenhuma migração nesta feature), observabilidade (logAudit já confirmado por T011, sem gap adicional encontrado)
- **Execução dinâmica**: todos os 3 bugs foram confirmados por **prova estática com caminho causal completo**, não por reprodução ao vivo (nenhum ambiente de teste com Firestore real foi usado nesta varredura). `/reversa-debugger-fix` deve gravar a reprodução real na `evidence/reproduction.md` de cada um
- **`functions/src/scheduledReports.ts`**: mencionado no mapa como precedente relevante, mas não inspecionado a fundo (fora do escopo direto da feature 005, que não o tocou)
- **Achado de baixa prioridade não aprofundado**: `route.ts:217` grava `tipo: tipo === "analitico" ? "personalizado" : tipo` — ou seja, um relatório pedido como `"analitico"` é armazenado com `tipo: "personalizado"`. Verificado que isso NÃO afeta `isReportWithinHours` (que só compara contra `defaultFilters.tipo === "padrao"`), mas não foi investigado se afeta outras partes do sistema (ex.: filtros/relatórios da feature 004). Pré-existente à feature 005, fora do escopo desta varredura — sinalizado aqui para uma inspeção futura do módulo `reports` como um todo, não promovido a bug por falta de investigação completa

## Bugs registrados

| ID | Severidade | Título |
|---|---|---|
| BUG-20260723-SCP1 | high | Reaproveitamento de relatório ignora departamento/categoria |
| BUG-20260723-PSU1 | medium | "plan_suspended" cru na tela para plano suspenso/cancelado |
| BUG-20260723-DUP1 | medium | TOCTOU — geração duplicada em acesso concorrente |
