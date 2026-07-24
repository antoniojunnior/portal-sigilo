# BUG-20260723-ACT1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: submenu não destacava item ativo em acesso direto/reload. Corrigido (commit 0e70981): expandedMenu inicializa via função lazy checando pathname.

Correção retroativa nesta rodada: regression_tests estava vazio — preenchido com scripts/test-configuracoes-residual.ts (verde).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
