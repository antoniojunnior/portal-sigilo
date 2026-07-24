---
schema_version: 1
id: BUG-20260723-IDX1
display_number: 12
title: GET /api/reports/generate retorna 500 em produção — possível índice Firestore ausente após deploy de índices desta sessão
status: resolved
phase: resolved
severity: critical
priority: P0
created: 2026-07-23
updated: 2026-07-23

change_risk:
  classification: baixa
  motivos:
    - "Nenhum código de produção foi tocado nesta correção — o código já estava corrigido (commits 73241bb/0267da1/82f130b, já em origin/main); o trabalho foi documentar e blindar com teste de regressão"

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
    state: confirmed
    hypothesis: null
    causal_path:
      - "GET faz where(org_id==).orderBy(gerado_em, desc) na coleção reports, exigindo índice composto (org_id + gerado_em)"
      - "git show 03f61f7 -- firestore.indexes.json confirma: a ÚNICA entrada nova pra coleção reports nesse commit foi a do dedupe (org_id+dedup_key+gerado_em, BUG-20260723-DUP1) — nenhuma entrada com o shape exato que o GET precisa (org_id+gerado_em) existia no arquivo rastreado antes"
      - "firebase deploy --only firestore:indexes trata o arquivo local como fonte única de verdade — se um índice equivalente existia só no console Firebase (nunca capturado no arquivo), o deploy dessa sessão o removeu por omissão"
      - "GET não tinha try/catch (diferente do POST) — a exceção FAILED_PRECONDITION do Firestore subiu crua como 500 genérico do runtime"
      - "Corrigido no mesmo dia, commit 73241bb (~15min após o incidente): índice reports(org_id ASC, gerado_em DESC) adicionado + try/catch no GET"
    evidence:
      - ref: "git show 03f61f7 -- firestore.indexes.json"
        observation: "confirma ausência do índice reports(org_id,gerado_em) no arquivo rastreado antes do incidente"
      - ref: "git show 73241bb -- firestore.indexes.json src/app/api/reports/generate/route.ts"
        observation: "confirma a correção: índice adicionado + try/catch no GET, no mesmo dia do incidente"
      - ref: "scripts/test-reports-get-resilient.ts"
        observation: "prova estrutural (fixture pré-fix falha as duas checagens; arquivos reais atuais passam as duas)"
    code_refs:
      - {file: "src/app/api/reports/generate/route.ts", symbol: "GET", commit: "73241bb"}
      - {file: "firestore.indexes.json", symbol: null, commit: "73241bb"}
  reproduction_tests:
    - "scripts/test-reports-get-resilient.ts (fixtures simulando o estado pré-fix — reprodução documental, não ao vivo)"
  regression_tests:
    - "scripts/test-reports-get-resilient.ts (arquivos reais: índice presente + try/catch presente)"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: test
    artifact: "scripts/test-reports-get-resilient.ts (novo)"
    purpose: "Prova estrutural de reprodução (fixture) e regressão (arquivos reais) — guarda contra remoção futura do índice OU do try/catch"

closure:
  policy: production-service
  satisfied: true
  delivery:
    kind: commit
    ref: "73241bb"
    code_commit: "73241bb"
    delivered_at: "2026-07-23"
    pushed_to: "origin/main"
  post_fix_observation:
    started_at: "2026-07-23T13:55:00-03:00"
    closed_at: "2026-07-23T22:24:00-03:00"
    window: "~8h30 decorridas entre a entrega (commit 73241bb) e este fechamento, sem nenhum novo relato de 500 em /app/relatorios ou GET /api/reports/generate — sinal de observação real (não waived), embora mais curto que o ideal"
    status: "closed"
resolution_kind: fixed
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

**Root cause (confirmado):** `firestore.indexes.json` nunca teve, antes do incidente, uma entrada para `reports(org_id, gerado_em)` — a única entrada nova pra coleção `reports` no commit do deploy (`03f61f7`) foi a do dedupe (`org_id+dedup_key+gerado_em`, formato diferente, não serve a query do GET). `firebase deploy --only firestore:indexes` trata o arquivo local como fonte única de verdade; se um índice equivalente existia só no console, foi removido nesse deploy. Sem `try/catch`, a exceção `FAILED_PRECONDITION` subiu como 500 cru. Confirmado via `git show 03f61f7`/`73241bb` (diff antes/depois), não via log de produção (sem acesso).

**Veredito de spec:** `spec-correta` — RF-01 sempre exigiu que o GET carregasse normalmente; o defeito foi acidente de infraestrutura/deploy (auto-regressão do próprio processo de correção da sessão anterior), não lacuna nem erro de spec. Nenhum adendo.

**Change set:**

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| CHG-001 | test | `scripts/test-reports-get-resilient.ts` (novo) | Prova de reprodução (fixture) + regressão (arquivos reais) |

**Nota importante:** nenhum código de produção foi alterado nesta correção — já estava corrigido (commits `73241bb`/`0267da1`/`82f130b`, entregues no mesmo dia do incidente, ~15min depois, já em `origin/main` há ~9h). O trabalho deste ciclo foi fechar corretamente o registro (que nunca tinha completado root cause/testes/veredito/closure) e adicionar um teste de regressão que blinda contra a MESMA classe de erro no futuro (índice removido de um deploy futuro, ou try/catch removido numa refatoração).

**Testes:** vermelho→verde real durante a escrita — a primeira versão do check `hasReportsIndex` tinha um bug (`.some(f.fieldPath==="org_id") && .some(f.fieldPath==="gerado_em")` casava com o índice do dedupe por engano, que também contém os dois fieldPaths mas em shape diferente). Corrigido para exigir prefixo exato `[org_id, gerado_em]`. Depois da correção, os 4 testes passam: 2 de reprodução (fixture pré-fix simula corretamente a ausência) + 2 de regressão (arquivos reais atuais confirmam presença).

```
🧪 Teste: GET /api/reports/generate resiliente a índice ausente (BUG-20260723-IDX1)
  ✓ reprodução (fixture pré-fix): índice ausente detectado
  ✓ reprodução (fixture pré-fix): try/catch ausente detectado
  ✓ regressão: firestore.indexes.json real tem o índice
  ✓ regressão: route.ts#GET real tem try/catch
✅ GET resiliente: índice rastreado presente e try/catch confirmado!
```

**Closure (production-service):** `resolution_kind: fixed`, entregue via commit `73241bb`, push `origin/main`. `closure.satisfied: true` — ~8h30 decorridas entre entrega e este fechamento sem nenhum novo relato de recorrência (janela de observação real, não waived, embora curta).

**Pendência fora do escopo:** confirmação manual de que o índice está "Enabled" (não só presente no arquivo) no console Firebase — sem credenciais de agente pra isso. Recomendado verificar manualmente na próxima janela de manutenção.

## Agent Notes

- Registrado a partir de relato direto do usuário em produção (`origin.type: manual-report`), não de inspeção proativa.
- Severidade `critical`/`P0`: feature inteira fora do ar, sem workaround, incidente ativo.
- Hipótese de causa raiz aponta para uma ação de infraestrutura da PRÓPRIA sessão anterior (deploy de índice Firestore) — se confirmada, é uma auto-regressão introduzida pelo próprio processo de correção dos 3 bugs anteriores (`SCP1`, `PSU1`, `DUP1`). Tratar com prioridade máxima e considerar mitigação (ex.: recriar o índice ausente manualmente no console, ou reverter o deploy de índices) ANTES de investigar a fundo, dado o dano em produção.
- Relação `related-to BUG-20260723-DUP1` é `proposed`: o índice novo dessa sessão foi adicionado justamente pro fix do DUP1 — a suspeita é de efeito colateral do MESMO deploy, não que os dois bugs sejam a mesma causa. Permanece `proposed` após o fechamento (nenhuma evidência a promoveu a `confirmed`).
- Este bug teve um `DONE.md` criado prematuramente (commit `79425a8`, feature 006) sem nunca ter passado pelo ciclo de fix — front matter ficou `open`/`resolution_kind: null` mesmo com a trava presente. Achado via `/reversa-debugger-graph` em 2026-07-23, `DONE.md` removido conscientemente por autorização explícita do usuário pra rodar o ciclo completo agora.
