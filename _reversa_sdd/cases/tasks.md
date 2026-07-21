# Cases, Tarefas de Implementação

## Pré-requisitos
- [ ] Coleções `orgs`, `cases`, `messages`, `audit_logs` disponíveis

## Tarefas

- [ ] T-01, Implementar `generateProtocol` com retry de colisão
  - Origem no legado: `src/lib/utils/protocol.ts`
  - Critério de pronto: gera `ETK-YYYY-XXXXXX` único por org, lança após 3 colisões
  - Confiança: 🟢

- [ ] T-02, Implementar `POST /api/cases` com escrita atômica
  - Origem no legado: `src/app/api/cases/route.ts`
  - Critério de pronto: case + mensagens + audit log criados em um único batch
  - Confiança: 🟢

- [ ] T-03, Implementar `GET /api/cases/track` sem vazamento de existência/conteúdo
  - Origem no legado: `src/app/api/cases/track/route.ts`
  - Critério de pronto: not-found e "mencionado indiretamente" retornam mesma forma de resposta; relato nunca incluso
  - Confiança: 🟢

- [ ] T-04, Implementar `GET /api/cases/resolve`
  - Origem no legado: `src/app/api/cases/resolve/route.ts`
  - Critério de pronto: retorna slug/org_id para protocolo válido, found:false senão
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste de criação atômica (falha parcial não deixa dado órfão)
- [ ] TT-02, Teste de colisão de protocolo (mock de 3 colisões seguidas)
- [ ] TT-03, Teste de que track nunca retorna campo de texto do relato

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. T-01 (protocolo) antes de T-02 (criação depende dele)
2. T-03/T-04 podem ser paralelas a T-02

## Lacunas Pendentes (🔴)
- Validar se `unit_id` deveria ser checado contra `units` existentes antes de aceitar no POST
