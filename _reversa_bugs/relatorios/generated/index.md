<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (5 na view pública, 1 restricted; todos resolved) -->

# Índice de Bugs — relatorios

## ✅ Todos os 6 bugs resolvidos

| ID | # | Título | Severidade | Prioridade | Delivery (código / trava) |
|---|---|---|---|---|---|
| BUG-20260723-SCP1 | 1 | Reaproveitamento de relatório ignora departamento/categoria | high | P1 | `03f61f7` / `79425a8` |
| BUG-20260723-PSU1 | 2 | "plan_suspended" cru na tela | medium | P2 | `03f61f7` / `79425a8` |
| BUG-20260723-DUP1 | 3 | TOCTOU original de geração duplicada | medium | P2 | `03f61f7` / `79425a8` |
| BUG-20260723-IDX1 | 12 | GET 500 em produção — índice Firestore ausente | critical | P0 | `73241bb` / `73241bb` |
| BUG-20260723-DUP2 | 13 | reserveReportSlot sem transação (reabertura do DUP1) | medium | P2 | `0e70981` / `d7ae0c0` |
| BUG-20260723-DGN1 (restricted) | 14 | endpoint de diagnóstico esquecido | high | P1 | `0e70981` / `d7ae0c0` |

IDX1 é o único fechado com ciclo completo do `/reversa-debugger-fix` de fato executado nesta sessão (reprodução via fixture, causa raiz confirmada via diff de commits, teste `scripts/test-reports-get-resilient.ts`, veredito `spec-correta`, ~8h30 de observação real sem recorrência). Os outros 5 foram promovidos a `resolved` por decisão explícita do usuário (delivery já confirmado, janela de observação waived) — ver histórico abaixo.

## Resumo por status

| Status | Contagem |
|---|---|
| resolved | 6 |

## Travados (`DONE.md`)

Todos os 6, todos consistentes com `status: resolved`.

## Bugs de visibilidade restrita

1 bug (`DGN1`, `security_suspected: true`), resolvido. Nenhum detalhe adicional exposto aqui.

## Histórico

- SCP1/PSU1/DUP1: código entregue em `03f61f7` (feature 005 + 3 bugs pós-inspeção)
- DUP2/DGN1: código entregue em `0e70981` (fix pós-inspeção de 8 bugs)
- IDX1: incidente de produção (índice Firestore removido por deploy da sessão anterior), corrigido em `73241bb` no mesmo dia; ciclo de fix completo executado em 2026-07-23 via `/reversa-debugger-fix IDX1`
- `DONE.md` de SCP1/PSU1/DUP1/DUP2/DGN1 foi criado prematuramente por commits de feature coding (`79425a8`, `d7ae0c0`), sem passar pelo ciclo de fix — achado e reconciliado via `/reversa-debugger-graph`. `DONE.md` de IDX1 teve o mesmo problema, mas foi removido conscientemente (autorização do usuário) e recriado legitimamente ao fim do ciclo completo.
