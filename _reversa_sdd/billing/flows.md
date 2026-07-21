# Billing, Fluxos

Ver diagramas completos em `_reversa_sdd/flowcharts/billing.md`. Resumo textual dos 2 fluxos centrais:

## Fluxo 1 — Consulta com fallback em cascata (info / subscription / invoices)

Todas as 3 rotas de leitura seguem o mesmo padrão: tentar Asaas, cair para Firestore/vazio sem propagar erro ao usuário. A UI **nunca** vê um 5xx por causa de indisponibilidade da Asaas nessas rotas — o pior caso visível é `source: "firestore"` com dados menos ricos (sem `valor`/`ciclo` reais).

## Fluxo 2 — Cancelamento transacional (cancel)

Único fluxo de escrita da unit, com ordem estrita: **Asaas primeiro, Firestore depois**. Isso garante que o Firestore nunca diverge para "cancelado" se a Asaas realmente não cancelou — mas também significa que se a chamada `orgs.update` falhar **depois** da Asaas confirmar (ex.: falha transitória do Firestore), o sistema fica em estado inconsistente (Asaas cancelada, Firestore ainda `ativo`) sem retry ou compensação. 🔴 Não há mecanismo de reconciliação para esse caso de borda no código lido.
