# BUG-20260722-TCT1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa: Leitura de `gerado_em` e escrita não eram atômicas. Chamada à Anthropic API entre elas criava janela de corrida real.

Correção (commits 22edd28/b906ca5, 2026-07-22):
- `regenerate/route.ts`: rate limit via Firestore `runTransaction`
- `rateLimit.ts`: `reserveRegenerationSlot` extraído como função testável
- `scripts/test-insights-bugs.ts`: teste de concorrência real (Promise.all)

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
