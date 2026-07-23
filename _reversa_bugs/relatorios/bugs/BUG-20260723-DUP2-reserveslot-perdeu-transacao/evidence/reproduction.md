# Cápsula de reprodução — BUG-20260723-DUP2

- Commit base: 79425a8
- Branch: main
- Ambiente: Firestore emulator local (FIRESTORE_EMULATOR_HOST=127.0.0.1:8181), Node via ts-node
- Comando: `npm run test:reports-dedup`
- Resultado: teste "reserveReportSlot: 2 chamadas concorrentes... exatamente 1 cria documento novo" FALHOU — 2 documentos criados (deduplicated: false nas duas chamadas)
- Classificação: determinístico
- Taxa: 1/1 execução, falha reproduzida

## Investigação da causa da remoção da transação (commit 4239b75)

Mensagem do commit alega "incompatibilidade com @google-cloud/firestore no ambiente serverless do Vercel" para `tx.get(query)`. Não há incompatibilidade documentada conhecida entre Firestore Admin SDK transactions e Vercel serverless — é um padrão suportado em qualquer runtime Node.js.

Cronologia dos commits da sessão de incidente sugere causa alternativa mais provável:
1. `73241bb`: índice `reports(org_id, gerado_em)` + try/catch no GET
2. `0267da1`: try/catch externo no POST
3. `4239b75`: remove transação de `reserveReportSlot` (aqui avaliado)
4. `2937e14`: endpoint de diagnóstico criado — indica que o problema AINDA não estava resolvido após (3)
5. `82f130b`: índice `cases(org_id, created_at ASC)` — a query de agregação de casos do POST precisa desse índice; este é o commit que provavelmente resolveu o 500 residual do POST

Os índices que a transação de `reserveReportSlot` usa (`reports` org_id+dedup_key+gerado_em) já estavam corretos desde o commit original (03f61f7) — nunca foram removidos pelo deploy problemático. Não há evidência de que a transação em si tenha causado o 500; a explicação alternativa (índice de `cases` ausente, corrigido depois) é mais consistente com a cronologia.
