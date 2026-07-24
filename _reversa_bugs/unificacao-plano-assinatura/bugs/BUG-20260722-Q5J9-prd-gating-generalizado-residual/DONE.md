# BUG-20260722-Q5J9 — Encerrado

Data: 2026-07-22 (fechamento original), reconciliado 2026-07-23
resolution_kind: fixed

Causa: PRD documentava gating por "Gestao e Enterprise" em 26 pontos, muito além do escopo original de D8L4. Corrigido em múltiplas sessões — hoje resta 1 única ocorrência (referência deliberada a este bug sobre decisão de roadmap pendente).

Correção retroativa nesta rodada: regression_tests estava vazio — preenchido com scripts/test-prd-enterprise-residual.ts (verde).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
