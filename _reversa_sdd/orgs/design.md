# Orgs, Design Técnico

> Fonte: `src/app/api/orgs/search/route.ts`, `_reversa_sdd/flowcharts/orgs.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| GET | `/api/orgs/search?q=` | query `q` | `{orgs: [{id,nome,slug,logo,plano_ativo}]}` | 200 |

## Fluxo Principal
1. `q.length < 3` → retorna `{orgs: []}` imediatamente, sem query (`:5-9`)
2. Query `orgs` orderBy `nome_lower` limit 100 (`:16-20`)
3. Map + filtro em memória: `nome_lower.includes(q.toLowerCase())` (`:22-34`)
4. `slice(0, 10)`, remove campo `nome_lower` da resposta (`:35-36`)

## Fluxos Alternativos
Nenhum — sem tratamento de erro explícito no código lido (ausência de try/catch nesta rota, diferente das demais).

## Dependências
- `adminDb`

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Busca full-text simulada com prefix-order + filtro em memória, em vez de um serviço de busca dedicado (Algolia/Typesense/Elasticsearch) | `route.ts:13-20` | 🟢 |

## Estado Interno
Nenhum.

## Observabilidade
🔴 Sem `console.error`/try-catch — diferente do padrão das demais rotas do sistema. Erro do Firestore aqui provavelmente resulta em 500 não tratado (comportamento default do Next.js), não em uma resposta JSON de erro consistente com o resto da API.

## Riscos e Lacunas
- 🟡 Não escala além de ~100 orgs (a query já limita a 100, então orgs além desse limite nunca aparecem na busca, independente do filtro)
- 🔴 Ausência de tratamento de erro explícito, inconsistente com as demais rotas do sistema
