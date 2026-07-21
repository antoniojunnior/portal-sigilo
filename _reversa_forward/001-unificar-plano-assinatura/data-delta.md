# Data Delta: Unificação para plano único de assinatura

> Identificador: `001-unificar-plano-assinatura`
> Data: `2026-07-21`
> Modelo de origem: `_reversa_sdd/data-dictionary.md#orgs`, `_reversa_sdd/data-dictionary.md` (divergências tipo↔dado)

## Campo alterado: `orgs.plano_ativo`

| Aspecto | Antes | Depois |
|---|---|---|
| Valores possíveis (self-service) | `"entrada"` \| `"gestao"` | `"<identificador-do-plano-unico>"` (sugestão: `"padrao"`, a confirmar com o dono do negócio) |
| Valores possíveis (fora do self-service, inalterados) | `"enterprise"`, `"suspenso"`, `"cancelado"` | mesmos, sem alteração |
| Tipo TypeScript declarado (`Plano`, `src/lib/types/index.ts:9`) | `"entrada" \| "gestao" \| "enterprise"` (já divergente do runtime — não incluía `suspenso`/`cancelado`) | `"<identificador-do-plano-unico>" \| "enterprise" \| "suspenso" \| "cancelado"` — esta feature também resolve a divergência #4 já registrada em `_reversa_sdd/data-dictionary.md` |

Nenhum campo novo é adicionado a `Org`. Nenhum campo é removido. `configuracoes`, `users_count`, `asaas_customer_id`, `ai_insights` etc. permanecem exatamente como documentados em `_reversa_sdd/data-dictionary.md#orgs`.

## Migração de dado necessária

**Escopo:** toda org com `plano_ativo in ["entrada", "gestao"]` no momento do deploy.

**Não-escopo:** orgs com `plano_ativo in ["enterprise", "suspenso", "cancelado"]` não são tocadas pela migração.

### Passo a passo conceitual

1. Query `orgs` filtrando `plano_ativo` em `["entrada", "gestao"]`
2. Para cada org encontrada:
   1. `update({ plano_ativo: "<identificador-do-plano-unico>" })`
   2. `audit_logs.add({ org_id, user_id: "sistema", acao: "plano_migrado", detalhes: { de: <valor antigo>, para: "<identificador-do-plano-unico>" }, timestamp })`
3. Idempotência: reexecutar a migração depois que já rodou não encontra mais orgs no filtro (todas já estão no novo valor), portanto é seguro rodar mais de uma vez

### Novo catálogo de ações de audit log

`_reversa_sdd/data-dictionary.md#audit_logs` lista o catálogo de ações conhecidas. Esta feature adiciona:

| Ação | Gerada por | Quando |
|---|---|---|
| `plano_migrado` | script de migração (novo) | uma vez por org, durante a migração de dado desta feature |

## Impacto em `firestore.rules`

`getPlanoLimit(orgId)` (linhas 78-81) lê `orgs/{orgId}.plano_ativo` e retorna o limite de usuários. A função precisa ser atualizada para reconhecer o novo identificador — ver D-06 do `roadmap.md` (retorna 10 para qualquer valor que não seja `enterprise`, em vez de comparar string por string).

## Sem impacto em

- `cases`, `messages`, `audit_logs` (exceto a nova ação `plano_migrado`), `reports`, `notifications` — nenhum desses schemas referencia `plano_ativo` diretamente como campo próprio, apenas o leem via join lógico com `orgs` no momento da request (já coberto no delta arquitetural do `roadmap.md §5`)
- `whatsapp_sessions` — não implementado, fora de escopo
