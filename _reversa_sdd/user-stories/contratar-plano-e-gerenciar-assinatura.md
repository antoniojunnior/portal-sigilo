# User Story — Contratar plano e gerenciar assinatura

> Cruza as units `checkout`, `billing`, e o webhook Asaas (`functions/src/webhookAsaas.ts`, fora do escopo de units do Writer).

## História

**Como** responsável de compliance de uma empresa interessada,
**Quero** contratar um plano pagando com cartão de crédito recorrente e depois gerenciar minha assinatura,
**Para que** eu tenha acesso ao Portal Sigilo sem intervenção manual de suporte.

## Fluxo (Gherkin)

```gherkin
Funcionalidade: Contratação e gestão de assinatura

  Cenário: Contratação bem-sucedida
    Dado que escolhi o plano "gestao" no ciclo "anual"
    Quando eu confirmo o checkout
    Então sou redirecionado a um link de pagamento Asaas com valor R$197/mês
    E, após confirmar o pagamento, minha organização é provisionada automaticamente
    E recebo um e-mail com credenciais de acesso temporárias

  Cenário: Consultar dados de cobrança
    Dado que sou admin da organização já provisionada
    Quando eu acesso a página de faturamento
    Então vejo o plano ativo, próximo vencimento e últimas faturas
    E, se a Asaas estiver indisponível, ainda vejo dados básicos vindos do Firestore

  Cenário: Cancelar assinatura
    Dado que sou admin e tenho uma assinatura ativa
    Quando eu solicito o cancelamento
    Então a assinatura é cancelada primeiro na Asaas
    E só depois o plano da organização muda para "cancelado" no sistema
    E um audit log é gravado
```

## Units envolvidas

| Unit | Papel neste fluxo |
|---|---|
| `checkout` | Geração do link de pagamento |
| `billing` | Consulta e cancelamento pós-contratação |
| `functions/webhookAsaas` (fora das units do Writer, ver `_reversa_sdd/adrs/003-*.md`) | Provisionamento automático da org |

## Pós-condições
- Contratação: `orgs/{id}` criada com `plano_ativo`, `asaas_customer_id`; `users/{adminUid}` criado
- Cancelamento: `orgs/{id}.plano_ativo === "cancelado"`, audit log `assinatura_cancelada`

## Lacuna conhecida (🔴)
Não há, nas units cobertas pelo Writer, um fluxo de **upgrade/downgrade** de plano para uma org já ativa — apenas contratação inicial e cancelamento. Ver `_reversa_sdd/state-machines.md` §3 e `_reversa_sdd/billing/tasks.md`.
