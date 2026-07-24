# BUG-20260723-IDX1 — Encerrado

Data: 2026-07-23
resolution_kind: fixed

Causa (confirmada via diff de commits): firestore.indexes.json não tinha o índice composto reports(org_id, gerado_em) que o GET exige; firebase deploy --only firestore:indexes removeu um índice não rastreado. GET sem try/catch deixou a exceção do Firestore vazar como 500 cru.

Correção (já entregue antes deste ciclo, commit 73241bb, mesmo dia do incidente):
- firestore.indexes.json: índice reports(org_id ASC, gerado_em DESC) adicionado
- route.ts GET: try/catch adicionado, retorna JSON de erro em vez de 500 cru

Este ciclo (/reversa-debugger-fix): confirmou causa raiz, escreveu scripts/test-reports-get-resilient.ts (reprodução via fixture + regressão contra arquivos reais), veredito spec-correta, fechou closure production-service (~8h30 de observação real sem recorrência).

Este bug está encerrado. Nenhum agente deve modificar esta pasta. Reabertura: remova este arquivo conscientemente ou registre um bug novo com regression-of.
