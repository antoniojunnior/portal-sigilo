# BUG-20260723-SRT1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: getInvoices envia sort/order nao documentados pela Asaas; risco real nao confirmavel sem acesso a sandbox. Correcao defensiva aplicada (commit 0e70981): ordena localmente por vencimento, independente do comportamento real da API.

NOTA DE INTEGRIDADE: root_cause.state promovido de hypothesized para supported (evidencia parcial via documentacao oficial), NAO para confirmed — confirmar exigiria acesso a sandbox Asaas real que nao existe nesta sessao. Excecao conhecida e documentada a regra "fixed exige root_cause confirmed".

Este bug esta encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
