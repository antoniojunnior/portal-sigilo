# Fluxograma — cross-cutting (infra transversal)

## Middleware de proteção de rotas

```mermaid
flowchart TD
    A["Request /app/*"] --> B{pathname == /app/login?}
    B -- sim --> C[NextResponse.next]
    B -- não --> D{cookie __session presente?}
    D -- não --> E["redirect → /app/login"]
    D -- sim --> C
```

🟡 Nota: o middleware só checa **presença** do cookie, não validade — a validação real (`verifySession`) acontece em cada Route Handler.

## webhookAsaas — roteamento de eventos

```mermaid
flowchart TD
    A[POST webhookAsaas] --> B["valida asaas-access-token via timingSafeEqual"]
    B -- inválido --> B1[401]
    B -- válido --> C{method == POST?}
    C -- não --> C1[405]
    C -- sim --> D{payload.event?}
    D -- ausente --> D1[400]
    D -- PAYMENT_CONFIRMED/PAYMENT_RECEIVED --> E[provisionOrg]
    D -- PAYMENT_OVERDUE --> F["atualizarPlanoOrg → suspenso"]
    D -- SUBSCRIPTION_CANCELED/INACTIVATED --> G["atualizarPlanoOrg → cancelado"]
    D -- outro --> H["log ignorado, 200 (conformidade retry policy)"]
    E --> I[200 received:true]
    F --> I
    G --> I
    H --> I
```

## provisionOrg (idempotente)

```mermaid
flowchart TD
    A[provisionOrg payload] --> B{customerId presente?}
    B -- não --> B1[return, log warn]
    B -- sim --> C["query orgs where asaas_customer_id == customerId"]
    C -- já existe --> C1[return — idempotência]
    C -- não existe --> D["determinarPlano(payload) por valor/ciclo"]
    D --> E["buscarDadosCliente na Asaas → email/nome reais"]
    E --> F["slug = slugify(nome) + sufixo hex aleatório"]
    F --> G["orgs.set: plano, asaas_customer_id, configuracoes padrão"]
    G --> H["adminAuth.createUser + setCustomUserClaims org_id/role=admin"]
    H --> I["users.set doc do admin"]
    I --> J["orgs.update users_count += 1"]
    J --> K["logAudit org_created"]
    K --> L["mail.add e-mail de boas-vindas (falha não bloqueia)"]
```

## Scheduled functions

```mermaid
flowchart TD
    subgraph DAILY["generateDailyInsights — 07h BRT diário"]
        A1["orgs where plano_ativo in [gestao,enterprise]"] --> A2[para cada org: cases últimos 7 dias]
        A2 --> A3{totalCases == 0?}
        A3 -- sim --> A4[grava insight padrão sem IA]
        A3 -- não --> A5[agrega categorias/urgentCount, monta prompt, Claude gera 3 insights JSON]
        A5 --> A6["orgs.update ai_insights"]
    end

    subgraph MONTHLY["generateMonthlyReports — dia 1, 06h BRT"]
        B1["orgs where plano_ativo in [gestao,enterprise]"] --> B2["para cada org: cases do mês anterior"]
        B2 --> B3["agrega métricas iguais a /api/reports/generate"]
        B3 --> B4[Claude gera relatório executivo]
        B4 --> B5["reports.set status=rascunho"]
        B5 --> B6["busca 1º admin ativo da org"]
        B6 --> B7["mail.add notificação de relatório pendente"]
    end
```
