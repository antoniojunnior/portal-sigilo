# BUG-20260723-ERR1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: getInvoices() engolia erro de rede/API, indistinguível de "org sem faturas". Corrigido (commit 0e70981): propaga erro, rota responde 502.

Correção retroativa nesta rodada: regression_tests estava vazio — preenchido com scripts/test-configuracoes-residual.ts (verde).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
