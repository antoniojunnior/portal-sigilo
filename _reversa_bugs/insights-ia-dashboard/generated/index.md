<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 2 bugs (1 resolved por decisão explícita do usuário, 1 YAML inválido) -->

# Índice de Bugs — insights-ia-dashboard

## ✅ Promovido a `resolved` nesta rodada

| ID | # | Título | Delivery (código / trava) |
|---|---|---|---|
| BUG-20260722-TCT1 | 11 | TOCTOU no rate limit de regeneração | `22edd28` / `b906ca5` |

Usuário instruiu explicitamente promover, tratando entrega já confirmada em `origin/main` como suficiente. Janela de `post_fix_observation` waived.

## ⚠️ Inconsistência ainda não resolvida

`BUG-20260722-SRC1` continua com front matter YAML inválido (`title:` com aspas não fechadas) — não pôde ser tocado. Ação humana: corrigir manualmente as aspas do campo `title` antes de qualquer outra operação neste bug.

## Resumo por status

| Status | Contagem |
|---|---|
| resolved | 1 (TCT1) |
| inválido (YAML) | 1 (SRC1) |

## Travados (`DONE.md`) — reconciliados

TCT1, agora `status: resolved`.
