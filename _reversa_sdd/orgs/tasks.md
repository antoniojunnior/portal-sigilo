# Orgs, Tarefas de Implementação

## Pré-requisitos
- [ ] Coleção `orgs` com campo `nome_lower` mantido em sincronia com `nome` em toda escrita

## Tarefas

- [ ] T-01, Implementar `GET /api/orgs/search` com limite de 3 caracteres mínimos
  - Origem no legado: `src/app/api/orgs/search/route.ts`
  - Critério de pronto: busca com <3 chars não consulta o banco; resultado limitado a 10, sem campo interno exposto
  - Confiança: 🟢

- [ ] T-02, Adicionar tratamento de erro explícito (lacuna do legado)
  - Origem no legado: N/A — ausente no legado, adicionar por consistência com as demais rotas
  - Critério de pronto: erro do Firestore retorna JSON `{"error": "..."}` com status 500, não uma página de erro genérica
  - Confiança: 🔴 (melhoria proposta, não presente no legado)

## Tarefas de Teste

- [ ] TT-01, Teste de busca com menos de 3 caracteres
- [ ] TT-02, Teste de busca case-insensitive por substring
- [ ] TT-03, Teste de limite de 10 resultados

## Tarefas de Migração de Dados
- [ ] TM-01, Backfill de `nome_lower` para orgs existentes que não tenham o campo

## Ordem Sugerida
T-01 primeiro (fidelidade ao legado); T-02 é melhoria opcional, marcar como débito se fora de escopo da reimplementação 1:1.

## Lacunas Pendentes (🔴)
- Decidir se a reimplementação deve replicar a ausência de tratamento de erro do legado (fidelidade) ou corrigi-la (robustez)
- Avaliar solução de busca real (ex.: Algolia) se o número de tenants crescer além de ~100
