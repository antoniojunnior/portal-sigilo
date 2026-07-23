# Data Delta: Refinamento dos Insights de IA no Dashboard Administrativo

> Identificador: `003-insights-ia-dashboard-admin`
> Data: 2026-07-22

## Resumo

Nenhum campo novo em Firestore. Esta feature não migra dado nenhum — é refinamento de leitura/exposição sobre um dado que já existe.

## Estrutura atual (sem mudança)

`orgs/{orgId}`:

```
ai_insights: {
  items: string[]        // até 3 strings curtas, geradas por generateDailyInsights (scheduled) ou pelo novo endpoint manual (D-01)
  gerado_em: Timestamp   // usado como fonte de verdade pro rate limit da regeneração manual (D-02)
}
```

## O que NÃO muda

- Formato de `items` (array de até 3 strings) — mesmo formato, escrito pelos dois caminhos (agendado e manual)
- `gerado_em` continua sendo atualizado por qualquer geração bem-sucedida, sem importar o gatilho
- Nenhum campo novo é adicionado a `orgs/{orgId}` para controlar a regeneração manual (D-02 rejeitou essa alternativa)

## O que muda (fora do Firestore)

- `GET /api/dashboard/insights` passa a retornar `source: "ai_generated"` em vez de `"ai_scheduled"` quando `ai_insights.items` existe — mudança de contrato de resposta, não de dado persistido (ver `interfaces/dashboard-insights-get.md`)
- O mapeamento de `items[1]` deixa de aparecer duplicado em `description` e `recommendations[0]` — também mudança de leitura, não de escrita

## Migração

n/a — nenhuma migração necessária. Orgs que já têm `ai_insights` gravado continuam funcionando sem qualquer backfill.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
