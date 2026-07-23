<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs -->

# Grafo de Bugs — configuracoes

```mermaid
graph LR
    MOB1["#15 MOB1<br/>sem nav mobile<br/>high · delivering · fixed"]
    CLP1["#16 CLP1<br/>submenu colapsado<br/>medium · delivering · fixed"]
    ACT1["#19 ACT1<br/>item ativo em reload<br/>low · delivering · fixed"]
    ERR1["#17 ERR1<br/>erro Asaas vira lista vazia<br/>medium · delivering · fixed"]
    SRT1["#18 SRT1<br/>sort/order não doc.<br/>high · delivering · fixed"]
    DAT1["#20 DAT1<br/>offset de 1 dia<br/>medium · delivering · fixed"]
    CLP1 -.->|related-to| MOB1
    ACT1 -.->|related-to| CLP1
```

## Clusters

Todos os 6 bugs foram corrigidos na mesma sessão de `/reversa-debugger-fix` (YOLO mode). `MOB1`/`CLP1`/`ACT1` (navegação do submenu) e `ERR1`/`SRT1`/`DAT1` (incerteza sobre a API da Asaas) permanecem como os dois clusters já identificados na varredura — as correções foram feitas por bug, sem refatoração ampla.

## Impact score

Todos os 6 bugs têm impact score 0 (arestas `proposed`).
