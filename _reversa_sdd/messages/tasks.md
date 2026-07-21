# Messages, Tarefas de Implementação

## Pré-requisitos
- [ ] Coleções `cases`, `messages` disponíveis

## Tarefas

- [ ] T-01, Implementar `GET /api/messages`
  - Origem no legado: `src/app/api/messages/route.ts:4-31`
  - Critério de pronto: retorna mensagens ordenadas por timestamp asc
  - Confiança: 🟢

- [ ] T-02, Implementar `POST /api/messages` com validação de vínculo
  - Origem no legado: `src/app/api/messages/route.ts:33-69`
  - Critério de pronto: `case_id` de outra org retorna 404; `autor` sempre "denunciante"
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste de vínculo inválido (case de outra org) → 404
- [ ] TT-02, Teste de texto vazio → 400

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
T-01 e T-02 são independentes, podem ser feitas em paralelo.

## Lacunas Pendentes (🔴)
Nenhuma identificada para esta unit.
