# Dashboard

> Fonte: `_reversa_sdd/code-analysis.md` §7 (complexidade alta, 12 rotas), `_reversa_sdd/permissions.md`.

## Visão Geral
Núcleo do painel de gestão: listagem/detalhe/atualização de casos, mensagens do gestor, mencionados, audit trail por caso, métricas, heatmap, insights de IA, notificações e administração de usuários/org. 🟢

## Responsabilidades
- Listar e filtrar casos da org com paginação 🟢
- Exibir e atualizar detalhe de um caso (status, responsável, notas, prazo) 🟢
- Gerenciar mencionados (conflito de interesse) 🟢
- Calcular métricas e tendências por período 🟢
- Gerar heatmap departamento × categoria 🟢
- Exibir insights de IA (pré-gerado ou fallback heurístico) 🟢
- Administrar org (config) e usuários (CRUD limitado por plano) 🟢
- Contar notificações não lidas 🟢

## Regras de Negócio
- Toda rota filtra por `org_id` da sessão (S3) e exclui casos onde o gestor está em `mencionados[]` (S5) 🟢
- Filtro de urgência aplicado em memória para evitar índice composto adicional 🟢
- Paginação: máximo 50 itens por página 🟢
- `semRespostaUrgente`: urgência≥4, não encerrado, sem atualização há mais de 48h 🟢
- Insights de IA: gate por plano (`entrada` → mensagem fixa), senão usa `ai_insights` pré-gerado ou fallback heurístico local 🟢
- PATCH em caso registra item em `historico` e audit log por campo alterado 🟢
- Adicionar mencionado exige role `admin`/`gestor`, valida usuário da mesma org 🟢
- Limite de usuários por plano (`entrada`=1, `gestao`=10, `enterprise`=∞), checado no servidor porque Admin SDK ignora Firestore Rules 🟢
- `users_count` incrementado/decrementado apenas quando o valor de `ativo` realmente muda 🟢
- Somente `admin` edita org e gerencia usuários 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Listar casos paginados com filtros (status, urgência, canal, protocolo, datas) | Must | Resposta inclui `total`/`page`/`totalPages` corretos |
| RF-02 | Excluir casos mencionados de toda listagem/detalhe/métrica | Must | Nenhuma resposta de dashboard inclui caso onde uid está em `mencionados` |
| RF-03 | Atualizar status/responsável/notas/prazo com trilha de histórico e auditoria | Must | Cada campo alterado gera item em `historico` e audit log |
| RF-04 | Calcular métricas com comparação de tendência vs. período anterior | Must | Cada métrica retorna `{value, direction, label}` de trend |
| RF-05 | Gerar heatmap dept×categoria respeitando departamentos configurados na org | Should | Departamentos sem casos aparecem com zero |
| RF-06 | Servir insights de IA com fallback em cascata (gate plano → pré-gerado → heurística) | Should | Nunca retorna erro — sempre alguma forma de insight |
| RF-07 | Aplicar limite de usuários por plano na criação | Must | Limite atingido retorna 403 `user_limit_reached` |
| RF-08 | Restringir edição de org/usuários a `admin` | Must | Não-admin recebe 403 |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | Filtros aplicados em memória para evitar índices compostos adicionais | `src/app/api/dashboard/cases/route.ts:40-41` | 🟢 |
| Segurança | Checagem redundante de limite de plano no servidor (Admin SDK bypassa Rules) | `src/app/api/dashboard/users/route.ts:79-90` | 🟢 |
| Auditabilidade | Toda mutação relevante gera audit log | várias rotas, ver `code-analysis.md` §7 | 🟢 |
| Escalabilidade | Heatmap carrega **todos** os casos da org sem paginação | `src/app/api/dashboard/heatmap/route.ts:19` | 🟡 pode degradar em orgs com grande volume histórico |

## Critérios de Aceitação

```gherkin
Dado um gestor mencionado em 3 dos 10 casos da org
Quando GET /api/dashboard/cases é chamado
Então a resposta contém no máximo 7 casos, e total reflete apenas os visíveis

Dado uma org no plano gestao com limite de 10 usuários e 10 usuários ativos
Quando POST /api/dashboard/users é chamado
Então retorna 403 user_limit_reached sem criar o usuário
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Listagem/detalhe/atualização de casos | Must | Núcleo do produto para o gestor |
| Bloqueio de mencionados | Must | Regra de negócio sem fallback (S5) |
| Métricas e heatmap | Should | Valor analítico, não bloqueia operação do caso |
| Insights de IA | Should | Tem fallback heurístico completo, nunca é bloqueante |
| Administração de usuários/org | Must | Necessário para operação multi-usuário |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/dashboard/cases/route.ts` | `GET` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/route.ts` | `GET`, `PATCH` | 🟢 |
| `src/app/api/dashboard/cases/[caseId]/{audit,mencionados,messages}/route.ts` | — | 🟢 |
| `src/app/api/dashboard/{heatmap,insights,metrics}/route.ts` | — | 🟢 |
| `src/app/api/dashboard/notifications/count/route.ts` | `GET` | 🟢 |
| `src/app/api/dashboard/org/route.ts` | `GET`, `PATCH` | 🟢 |
| `src/app/api/dashboard/users/route.ts`, `users/[userId]/route.ts` | — | 🟢 |
