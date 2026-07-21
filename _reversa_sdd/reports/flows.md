# Reports, Fluxos

> Diagrama de estados completo em `_reversa_sdd/state-machines.md` §2 e `_reversa_sdd/flowcharts/reports.md`.

## Fluxo 1 — Geração (agregação + IA)

Único fluxo que efetivamente lê o conteúdo de `cases` em volume (todo o período). É o fluxo mais caro computacionalmente da unit, mas roda sob demanda (não agendado — o agendado equivalente vive em `functions/scheduledReports.ts`, fora desta unit).

## Fluxo 2 — Máquina de estados de aprovação/export

O único fluxo do sistema com transições de estado **guardadas no código** (não é atualização livre de campo como `Case.status`). Cada transição:
1. Verifica role (guarda de autorização)
2. Verifica estado atual (guarda de máquina de estados — idempotência/409)
3. Aplica a mudança
4. Grava audit log com o nome da transição

Isso torna esta unit o melhor exemplo de referência no sistema para "como implementar uma máquina de estados guardada" — outras units com status livre (`Case.status`) poderiam adotar o mesmo padrão se a regra de negócio real exigir transições restritas (ver `_reversa_sdd/state-machines.md` §1, LACUNA sobre `Case.status`).

## Relação entre os dois fluxos

Fluxo 1 só pode rodar novamente (criando um **novo** documento `reports`) — não há "regenerar" um relatório existente. Uma vez em `aprovado`/`exportado`, o único caminho de volta é `DELETE /approve` (admin), que volta para `rascunho`, mas os `texto_claude`/`metricas` originais permanecem os mesmos (não há re-geração de conteúdo nessa reversão).
