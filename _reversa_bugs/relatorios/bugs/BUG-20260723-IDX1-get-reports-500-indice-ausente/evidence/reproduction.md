# Cápsula de reprodução — BUG-20260723-IDX1

## Contexto

Commit base no momento do relato: `03f61f7` (deploy de índices + fix de 3 bugs, sessão anterior).
Commit atual (no momento desta investigação): `8bc2198` (HEAD, `origin/main`).
Ambiente: produção (`portal-sigilo.vercel.app`), Firestore real.

## Por que não há reprodução ao vivo nesta etapa

O defeito original dependia de um estado transitório de infraestrutura (índice composto ausente no Firestore, criado por `firebase deploy --only firestore:indexes` removendo um índice não rastreado no arquivo local). Esse estado **não existe mais**: o índice foi recriado no commit `73241bb`, poucas horas após o incidente. Reproduzir o 500 original exigiria recriar deliberadamente o estado de índice ausente em produção — operação destrutiva, fora de escopo sem autorização explícita e sem benefício adicional (a causa já está confirmada por evidência de código, ver abaixo).

Não há acesso de agente a logs da Vercel nem ao console Firebase nesta sessão — a confirmação por essa via (mencionada nos Acceptance Criteria do bug) requer verificação humana.

## Evidência usada em vez de reprodução ao vivo (comando + resultado)

```
$ git show 03f61f7 -- firestore.indexes.json
```
Resultado: o diff mostra a ÚNICA entrada nova para `collectionGroup: "reports"` sendo `{org_id ASC, dedup_key ASC, gerado_em ASC}` (índice do dedupe, BUG-20260723-DUP1). **Nenhuma entrada preexistente** para `reports` com campos `{org_id, gerado_em}` (a query do GET) existia no arquivo antes desse commit — confirma que o índice que o GET precisa nunca esteve rastreado localmente.

```
$ git show 73241bb -- firestore.indexes.json src/app/api/reports/generate/route.ts
```
Resultado: adiciona a entrada `{collectionGroup: "reports", fields: [{org_id, ASCENDING}, {gerado_em, DESCENDING}]}` — exatamente o índice que a query `where("org_id","==",...).orderBy("gerado_em","desc")` do GET exige. Mesmo commit envolve o corpo do GET em `try/catch`, retornando `Response.json({error}, {status:500})` em vez de deixar a exceção subir crua.

```
$ estado atual do arquivo (2026-07-23, HEAD 8bc2198)
```
Resultado: `firestore.indexes.json` contém a entrada `reports(org_id ASC, gerado_em DESC)` — presente. `route.ts#GET` tem `try { ... } catch (err) { console.error(...); return Response.json({error:"Erro ao listar relatórios."}, {status:500}) }` — presente.

## Classificação

`reproduction.classification: deterministic` (o defeito era determinístico: toda query sem o índice necessário falha com `FAILED_PRECONDITION`) — mas **não é mais reproduzível no estado atual do sistema**, porque a causa raiz (índice ausente) foi eliminada. Reprodução "documental" via diff de commits, não execução ao vivo.

## Prova de não-recorrência (sinal de observação já obtido)

Desde o commit `73241bb` (2026-07-23 13:55) até agora (2026-07-23 22:24), aproximadamente 8h30 de intervalo sem nenhum novo relato do usuário de 500 em `/app/relatorios` ou em `GET /api/reports/generate` — janela de observação real (não waived), embora menor que o ideal para uma "janela recomendada" formal.
