<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-22 a partir de 9 bugs (9 resolved) -->

# Grafo de Bugs — unificacao-plano-assinatura

```mermaid
graph LR
    K9M2["#1 K9M2<br/>Checkout payload errado<br/>critical · resolved"]
    R4T8["#2 R4T8<br/>Limite org suspensa<br/>critical · resolved"]
    P2W5["#3 P2W5<br/>cancel 400 residual<br/>high · resolved"]
    N7Q1["#4 N7Q1<br/>parcelas opcional<br/>medium · resolved"]
    H3X6["#5 H3X6<br/>subscription contrato<br/>medium · resolved"]
    D8L4["#6 D8L4<br/>PRD Enterprise §2.2<br/>low · resolved"]
    V3F7["#7 V3F7<br/>renovação payload errado<br/>critical · resolved"]
    Q5J9["#8 Q5J9<br/>PRD gating generalizado<br/>low · resolved"]
    T6R2["#9 T6R2<br/>status pagamento incompleto<br/>high · resolved"]

    K9M2 ==related-to==> V3F7
    K9M2 -.related-to.-> N7Q1
    P2W5 -.related-to.-> H3X6
    D8L4 ==related-to==> Q5J9
    T6R2 ==related-to==> H3X6
```

## Clusters

1. **Billing/Asaas, causa confirmada (K9M2 ↔ V3F7)**: mesma investigação, corrigidos e testados contra sandbox Asaas real.
2. **Contratos `interfaces/*.md` na Fase 4 (P2W5 ↔ H3X6 ↔ T6R2)**: mesmo padrão, código mais permissivo/incompleto que o contrato documentado. T6R2 reabriu o mesmo arquivo de H3X6 (`getSubscription.ts`) por um ângulo diferente — mapeamento de status de pagamento, não formato de resposta. Ambos resolved.
3. **PRD residual (D8L4 ↔ Q5J9)**: D8L4 corrigiu §2.2; Q5J9 removeu as 26 ocorrências restantes de "Enterprise" no PRD.

## Todos os 9 bugs resolved

Nenhum bug aberto/ativo neste contexto no momento.
