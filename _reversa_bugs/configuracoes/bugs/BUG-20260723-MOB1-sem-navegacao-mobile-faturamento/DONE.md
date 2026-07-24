# BUG-20260723-MOB1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: BottomNav sem caminho de navegação até /app/configuracoes/faturamento em mobile. Corrigido (commit 0e70981): submenu Organização/Faturamento via popover, filtrado por adminOnly.

Correção retroativa nesta rodada: regression_tests estava vazio — preenchido com scripts/test-configuracoes-residual.ts (verde).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
