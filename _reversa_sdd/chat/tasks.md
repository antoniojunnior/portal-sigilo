# Chat, Tarefas de Implementação

## Pré-requisitos
- [ ] `ANTHROPIC_API_KEY` configurada
- [ ] `generateProtocol` (unit `cases`) disponível
- [ ] Coleções `cases`, `messages`, `audit_logs`, `notifications`, `orgs`, `units` disponíveis

## Tarefas

- [ ] T-01, Implementar `buildSystemPrompt` com regras de anonimato e estilo
  - Origem no legado: `src/app/api/chat/route.ts:36-68`
  - Critério de pronto: prompt nunca solicita dados identificáveis; vocabulário controlado
  - Confiança: 🟢

- [ ] T-02, Implementar streaming com interceptação de `<CASE_COMPLETE>`
  - Origem no legado: `src/app/api/chat/route.ts:174-234`
  - Critério de pronto: bloco de controle nunca chega ao cliente; tokens normais são emitidos em tempo real
  - Confiança: 🟢

- [ ] T-03, Implementar `createCase` (batch atômico)
  - Origem no legado: `src/app/api/chat/route.ts:70-137`
  - Critério de pronto: caso + mensagens + audit log criados em um único commit
  - Confiança: 🟢

- [ ] T-04, Implementar `validateTriagem` (whitelist estrita)
  - Origem no legado: `src/lib/triagem.ts:75-111`
  - Critério de pronto: categoria/lei fora da whitelist é descartada; urgência não-inteira ou fora de 1-5 invalida o resultado
  - Confiança: 🟢

- [ ] T-05, Implementar `callClaude` com retry de 2 tentativas
  - Origem no legado: `src/lib/triagem.ts:113-136`
  - Critério de pronto: 2 falhas consecutivas retornam `null`, sem lançar exceção ao chamador
  - Confiança: 🟢

- [ ] T-06, Implementar `runTriagem` (gate de plano + notificação + audit)
  - Origem no legado: `src/lib/triagem.ts:138-219`
  - Critério de pronto: plano entrada nunca chama IA; urgência>=4 cria notificação; todo caminho grava audit log
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste do happy path completo: coleta → CASE_COMPLETE → caso criado → triagem concluída
- [ ] TT-02, Teste de JSON malformado em CASE_COMPLETE (caso não criado, erro emitido)
- [ ] TT-03, Teste de plano entrada (triagem sempre manual)
- [ ] TT-04, Teste de 2 falhas consecutivas de callClaude (needs_manual_review)
- [ ] TT-05, Teste de notificação criada para urgência >= 4

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. T-04/T-05 (validação e chamada IA) antes de T-06 (runTriagem os orquestra)
2. T-01/T-03 (prompt e criação de caso) antes de T-02 (streaming os invoca)
3. T-06 por último, integra tudo

## Lacunas Pendentes (🔴)
- Definir comportamento de retry/recuperação quando `createCase` falha após `<CASE_COMPLETE>` ser detectado
