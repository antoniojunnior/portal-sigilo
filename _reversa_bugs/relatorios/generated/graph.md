<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (1 restricted omitido do grafo público) -->

# Grafo de Bugs — relatorios

```mermaid
graph LR
    IDX1["#12 IDX1<br/>GET 500 em produção<br/>critical · triaging (DONE.md, front matter inconsistente)"]
    DUP2["#13 DUP2<br/>TOCTOU reaberto<br/>medium · delivering · fixed"]
    SCP1["#1 SCP1<br/>reaproveitamento ignora escopo<br/>high · delivering · fixed"]
    PSU1["#2 PSU1<br/>plan_suspended cru<br/>medium · delivering · fixed"]
    DUP1["#3 DUP1<br/>TOCTOU duplicação<br/>medium · delivering · fixed"]
    DUP1 -.->|related-to, proposed| IDX1
    DUP2 -->|regression-of, confirmed| DUP1
```

## Clusters

**Cluster do incidente de produção**: `IDX1`, `DUP2` e o bug restrito (removido) nasceram da mesma resposta ao vivo ao incidente `IDX1`. `DUP2` foi corrigido nesta sessão — investigação concluiu que a remoção original da transação (motivada por suposta "incompatibilidade Vercel") não tinha sustentação real; a transação foi restaurada e validada (5/5 testes, incluindo concorrência real).

`SCP1` e `PSU1` seguem fechados e intactos.

## Impact score

`DUP2` mantém impact score elevado por conexão `confirmed` (`regression-of`) com `DUP1`. Demais em 0 (arestas `proposed`).
