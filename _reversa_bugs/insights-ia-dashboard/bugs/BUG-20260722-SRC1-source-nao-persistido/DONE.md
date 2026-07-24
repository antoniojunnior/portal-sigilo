# BUG-20260722-SRC1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: POST /regenerate calculava source mas nunca persistia em orgs.ai_insights; GET sempre inferia "ai_generated". Corrigido (commit 22edd28), testado (scripts/test-insights-bugs.ts, 4/4 verde).

Correção retroativa nesta rodada: title do front matter tinha aspas mal-escapadas quebrando o parser YAML — corrigido. status/closure.satisfied reconciliados com a entrega já confirmada.

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
