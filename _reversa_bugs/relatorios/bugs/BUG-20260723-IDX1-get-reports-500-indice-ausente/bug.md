---
schema_version: 1
id: BUG-20260723-IDX1
display_number: 12
title: GET /api/reports/generate retorna 500 em produção — possível índice Firestore ausente após deploy de índices desta sessão
status: open
phase: triaging
severity: critical
priority: P0
created: 2026-07-23
updated: 2026-07-23

origin:
  type: manual-report
  external_ref: null

area: saas-core
module: route-handlers
feature: reports
labels: [production-incident, self-inflicted-suspected]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "relatado como ocorrendo em toda tentativa de acesso, desde o deploy recente"
  suspected_triggers: ["deploy de firestore.indexes.json + firebase deploy --only firestore:indexes na sessão anterior (commit 03f61f7)"]

blocking: []

relationships:
  - bug: BUG-20260723-DUP1
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-01"
  affected_code:
    - "src/app/api/reports/generate/route.ts#GET"
    - "firestore.indexes.json"
  root_cause:
    state: hypothesized
    hypothesis: "GET faz where(org_id==).orderBy(gerado_em, desc) na coleção reports, o que exige um índice composto (org_id + gerado_em). O firestore.indexes.json do repositório nunca teve entrada pra coleção reports antes desta sessão (só ganhou uma, com campos diferentes: org_id + dedup_key + gerado_em, para o dedupe do BUG-20260723-DUP1). Se o índice que o GET precisa existia no projeto Firebase só via console (nunca capturado no arquivo local), o comando 'firebase deploy --only firestore:indexes' rodado na sessão anterior pode ter REMOVIDO esse índice não rastreado — o Firebase CLI trata o arquivo local como fonte única de verdade e apaga do projeto qualquer índice ausente dele. Fator agravante: o handler GET não tem try/catch (diferente do POST, que captura e devolve JSON de erro) — uma exceção do Firestore (ex. FAILED_PRECONDITION: query requires an index) sobe sem tratamento e vira 500 genérico."
    causal_path: []
    evidence:
      - ref: "src/app/api/reports/generate/route.ts#GET"
        observation: "GET não tem try/catch ao redor da query Firestore, ao contrário do POST — qualquer exceção não tratada vira 500 cru do runtime, não um JSON de erro controlado"
      - ref: "firestore.indexes.json (estado antes desta sessão)"
        observation: "nenhuma entrada para a coleção 'reports' existia no arquivo antes do commit 03f61f7 — se um índice equivalente existisse só no console Firebase, o deploy baseado no arquivo local o teria removido por omissão"
    code_refs:
      - {file: "src/app/api/reports/generate/route.ts", symbol: "GET", commit: "03f61f7"}
      - {file: "firestore.indexes.json", symbol: null, commit: "03f61f7"}
  reproduction_tests: []
  regression_tests: []

spec_verdict: null

change_set: []

closure:
  policy: production-service
  satisfied: false
resolution_kind: null
---

# GET /api/reports/generate retorna 500 em produção

## Summary

Usuário reporta `GET https://portal-sigilo.vercel.app/api/reports/generate` retornando `500 Internal Server Error` ao tentar acessar `/app/relatorios` em produção, logo após o deploy da feature 005 + correção dos 3 bugs anteriores (commit `03f61f7`, push e deploy de índice Firestore na sessão imediatamente anterior a este relato).

## Expected Behavior

Conforme `_reversa_forward/005-relatorios-auto-geracao/requirements.md#RF-01`, ao acessar `/app/relatorios` a lista de relatórios deveria carregar normalmente (via `GET`) para decidir se reaproveita um relatório recente ou dispara geração automática. O `GET` é o contrato mais básico e estável do módulo — nunca deveria falhar.

## Actual Behavior

`GET /api/reports/generate` retorna 500, impedindo completamente o carregamento da página `/app/relatorios` — sem workaround manual, já que o botão "Gerar relatório" foi removido pela própria feature 005 (RN-02/RF-02) e o fluxo inteiro depende do `GET` funcionar no mount.

## Steps to Reproduce

1. Acessar `https://portal-sigilo.vercel.app/app/relatorios` (ou chamar `GET /api/reports/generate` diretamente) com uma sessão válida.
2. **Esperado**: lista de relatórios (ou lista vazia) retornada com 200.
3. **Observado**: 500 Internal Server Error, relatado como acontecendo sempre desde o deploy mais recente.

## Evidence

Relato do usuário (ver `_reversa_bugs/relatorios/intake/relato-20260723-1339.md`). Nenhum log de produção (Vercel/Firebase) foi consultado ainda nesta etapa de registro — fica para `/reversa-debugger-fix` confirmar a hipótese consultando os logs reais e a lista de índices do projeto Firebase no console.

## Suspected Area

`route-handlers` (`src/app/api/reports/generate/route.ts#GET`) — causa raiz suspeita em `firestore.indexes.json` (índice possivelmente removido pelo deploy da sessão anterior).

## Acceptance Criteria

- `GET /api/reports/generate` volta a retornar 200 com a lista de relatórios em produção
- Índice(s) necessário(s) pela query do `GET` confirmados presentes e "Enabled" no console Firebase
- `GET` ganha `try/catch` (como o `POST` já tem) para nunca mais vazar 500 cru por exceção não tratada — sempre um JSON de erro controlado, mesmo em falha inesperada

## Traceability

Ver bloco YAML `traceability` no front matter.

## Resolution

_Pendente — preenchida pelo `/reversa-debugger-fix`._

## Agent Notes

- Registrado a partir de relato direto do usuário em produção (`origin.type: manual-report`), não de inspeção proativa.
- Severidade `critical`/`P0`: feature inteira fora do ar, sem workaround, incidente ativo.
- Hipótese de causa raiz aponta para uma ação de infraestrutura da PRÓPRIA sessão anterior (deploy de índice Firestore) — se confirmada, é uma auto-regressão introduzida pelo próprio processo de correção dos 3 bugs anteriores (`SCP1`, `PSU1`, `DUP1`). Tratar com prioridade máxima e considerar mitigação (ex.: recriar o índice ausente manualmente no console, ou reverter o deploy de índices) ANTES de investigar a fundo, dado o dano em produção.
- Relação `related-to BUG-20260723-DUP1` é `proposed`: o índice novo dessa sessão foi adicionado justamente pro fix do DUP1 — a suspeita é de efeito colateral do MESMO deploy, não que os dois bugs sejam a mesma causa.
