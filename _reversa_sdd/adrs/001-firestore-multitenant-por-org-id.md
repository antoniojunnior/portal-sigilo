# ADR-001 — Multi-tenant via `org_id` em documento único no Firestore (não tenant-per-database)

**Status:** 🟢 Confirmado (retroativo — inferido do código, não de discussão documentada)
**Data aproximada:** Fase 1 (commit `ba90b9a` — "Fase 1: fundação completa (env, Firebase, tipos, Firestore Rules)")

## Contexto

O produto é um SaaS multi-tenant: cada organização cliente precisa de isolamento total de dados de outras organizações, incluindo casos, mensagens e auditoria.

## Decisão

Usar um único banco Firestore compartilhado entre todos os tenants, com campo `org_id` obrigatório em praticamente todo documento (regra inviolável #3 do `AGENTS.md`), e isolamento garantido em duas camadas redundantes:
1. Toda query em Route Handlers filtra explicitamente por `org_id`
2. Firestore Rules negam leitura/escrita quando `org_id` do documento não bate com o `org_id` do usuário autenticado

## Alternativas consideradas

🔴 Não documentadas explicitamente. Alternativas plausíveis para um sistema deste tipo:
- Banco de dados por tenant (isolamento físico mais forte, custo operacional maior)
- Coleções por tenant (`orgs/{orgId}/cases`) em vez de campo `org_id` em coleção plana

## Consequências

- 🟢 Simplicidade operacional: um único banco para gerenciar, escalar e fazer backup
- 🟢 Índices compostos (`org_id` + outros campos) resolvem a maioria das queries — mas alguns filtros (urgência, protocolo) são aplicados em memória para **evitar exigir índice composto adicional** (ver `dashboard/cases/route.ts`), trocando custo de leitura por simplicidade de configuração
- 🟡 Risco estrutural: como o Admin SDK usado nos Route Handlers **ignora** Firestore Rules, o isolamento real depende inteiramente da disciplina de sempre incluir `.where("org_id", "==", ...)` em toda query — não há uma segunda camada de proteção em runtime além da revisão de código. Uma query esquecida vazaria dados entre tenants.
