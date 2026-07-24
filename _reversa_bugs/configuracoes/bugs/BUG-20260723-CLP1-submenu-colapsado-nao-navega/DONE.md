# BUG-20260723-CLP1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: clique no item com submenu, sidebar colapsada, não tinha efeito visível. Corrigido (commit 0e70981): clique expande a sidebar e abre o submenu.

Correção retroativa nesta rodada: regression_tests estava vazio — preenchido com scripts/test-configuracoes-residual.ts (verde).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
