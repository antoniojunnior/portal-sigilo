<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 4 bugs (0 resolved, 4 active/delivering fixed) -->

# Índice de Bugs — limpeza-frontend

## Resumo por status

| Status | Contagem |
|---|---|
| open | 0 |
| active | 4 |
| resolved | 0 |

## Resumo por phase

| Phase | Contagem |
|---|---|
| delivering | 4 |

## Bugs abertos/ativos

| ID | # | Título | Severidade | Prioridade | Phase | Resolution kind |
|---|---|---|---|---|---|---|
| BUG-20260723-EBD1 | 21 | ErrorBoundary não cobre Sidebar/SuspensoBanner/BottomNav | high | P1 | delivering | fixed |
| BUG-20260723-ADM1 | 22 | Insights sem adminOnly no sidebar | medium | P2 | delivering | fixed |
| BUG-20260723-DOC1 | 23 | actions.md diverge do código real (ChatInput/ChatAttachment) | medium | P2 | delivering | fixed |
| BUG-20260723-DTN1 | 24 | Date.now() durante render em insights/page.tsx | low | P3 | delivering | fixed |

Todos nasceram da mesma varredura (`/reversa-depth-inspection`, `varredura-01-feature-007`), logo após o coding da feature `007-limpeza-frontend`. Corrigidos em sequência via `/reversa-debugger-fix` (modo YOLO): `EBD1` → `ADM1` → `DTN1` → `DOC1`.

**Nota**: `BUG-20260723-DOC1` não foi um defeito de código — era uma divergência entre `actions.md` (registro do ciclo forward) e a execução real. O código sempre esteve correto; a correção foi um adendo textual (`_reversa_sdd/addenda/bug-BUG-20260723-DOC1-v001.md`), sem tocar `actions.md`/`requirements.md` originais.

## Resolvidos por resolution_kind

Nenhum com `status: resolved` ainda — todos em `active/delivering`. `closure_policy: production-service` exige `delivery` + `post_fix_observation` antes de fechar. Contagem por `resolution_kind` (independente de status): `fixed` — 4.

## Travados (`DONE.md`)

Nenhum ainda — aguardando janela de observação pós-entrega.
