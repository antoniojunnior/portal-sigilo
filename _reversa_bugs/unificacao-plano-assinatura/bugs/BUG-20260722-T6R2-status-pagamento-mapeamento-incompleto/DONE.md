# BUG-20260722-T6R2 — Encerrado

Data: 2026-07-22 (fechamento original), reconciliado 2026-07-23
resolution_kind: fixed

Causa: Invoice.status incompleto (4 valores) + getSubscription sem case pra CONFIRMED/REFUNDED/CHARGEBACK_*, todos caindo em default ACTIVE. Corrigido (commit 5a16080), testado contra sandbox Asaas real (6/6 pagamentos CONFIRMED).

Correção retroativa nesta rodada: closure.satisfied estava false no front matter contradizendo a prosa da Resolution (que já dizia "true", waiver aprovado em 2026-07-22) — reconciliado para true.

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
