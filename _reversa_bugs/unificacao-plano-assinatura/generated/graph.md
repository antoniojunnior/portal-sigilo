<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-22T03:00:00Z a partir de 8 bugs -->

# Grafo de Bugs — unificacao-plano-assinatura

```mermaid
graph LR
    K9M2["#1 K9M2<br/>Checkout payload errado<br/>critical · active/patching"]
    R4T8["#2 R4T8<br/>Limite org suspensa<br/>critical · active/patching"]
    P2W5["#3 P2W5<br/>cancel 400 residual<br/>high · active/patching"]
    N7Q1["#4 N7Q1<br/>parcelas opcional<br/>medium · active/patching"]
    H3X6["#5 H3X6<br/>subscription contrato<br/>medium · active/patching"]
    D8L4["#6 D8L4<br/>PRD Enterprise §2.2<br/>low · active/patching"]
    V3F7["#7 V3F7<br/>renovação payload errado<br/>critical · active/patching"]
    Q5J9["#8 Q5J9<br/>PRD gating generalizado<br/>low · active/awaiting-human"]

    K9M2 ==related-to==> V3F7
    K9M2 -.related-to.-> N7Q1
    P2W5 -.related-to.-> H3X6
    D8L4 ==related-to==> Q5J9
```

## Clusters

1. **Billing/Asaas, causa confirmada (K9M2 ↔ V3F7)**: mesma investigação, `T014` do roadmap pulada, corrigidos e testados contra sandbox Asaas real.
2. **Contratos `interfaces/*.md` na Fase 4 (P2W5 ↔ H3X6)**: mesmo padrão, código mais permissivo que o contrato documentado.
3. **PRD residual (D8L4 ↔ Q5J9)**: D8L4 corrigiu 3 linhas de §2.2; ao corrigir, achou 23 ocorrências adicionais no resto do documento — 9 corrigidas (subconjunto seguro, features já unificadas), 17 deixadas para decisão humana (features nunca implementadas, roadmap Enterprise futuro incerto).

## Impact score

| Bug | Relacionados (confirmed, máx 3) | Score |
|---|---|---|
| BUG-20260721-K9M2 | 1 (V3F7) | 1 |
| BUG-20260721-V3F7 | 1 (K9M2) | 1 |
| BUG-20260721-D8L4 | 1 (Q5J9) | 1 |
| BUG-20260722-Q5J9 | 1 (D8L4) | 1 |
| BUG-20260721-R4T8 | 0 | 0 |
| BUG-20260721-P2W5 | 0* | 0 |
| BUG-20260721-N7Q1 | 0* | 0 |
| BUG-20260721-H3X6 | 0* | 0 |

\* Arestas `proposed` não contam. Todos os 8 bugs têm trabalho aplicado nesta sessão — 7 com fix completo e testado, 1 (`Q5J9`) parcial aguardando decisão humana de escopo. Nenhum `resolved`: falta `delivery` (commit/deploy) + janela de observação em todos, sob a closure policy `production-service`.
