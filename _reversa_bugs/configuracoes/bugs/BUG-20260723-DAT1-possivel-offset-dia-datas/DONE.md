# BUG-20260723-DAT1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: formatDate() sofria offset de 1 dia com datas puras sob timezone America/Sao_Paulo, confirmado ao vivo. Corrigido (commit 0e70981): parse manual de ano/mes/dia local.

Correção retroativa nesta rodada: root_cause.state estava hypothesized apesar da prosa já dizer "confirmado ao vivo" — reconciliado para confirmed, causal_path preenchido.

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
