# Cápsula de reprodução — BUG-20260721-P2W5, BUG-20260721-N7Q1, BUG-20260721-H3X6

> Data: 2026-07-22
> Ambiente: Firestore real (`FIREBASE_PROJECT_ID` de `.env.local`, uso confirmado como seguro para dados de teste pelo usuário) + sandbox Asaas real
> Runtime: `npm run test:billing-fixes` (`scripts/test-billing-route-fixes.ts`)
> Reprodução do "antes": leitura estática já registrada nos `bug.md` originais (comparação direta contra `interfaces/*.md`), não capturada em execução separada nesta rodada — os 3 fixes foram aplicados e testados em conjunto, no fluxo de correção acelerada pelo objetivo "corrija todos os bugs identificados".

## Resultado (depois do fix, único a ser executado nesta rodada)

```
Testando fixes de billing (Firestore real + sandbox Asaas)...

  cancelarAssinatura cancela org sem asaas_customer_id (BUG-20260721-P2W5)... ✓ PASSOU
  isParcelasValido(undefined) é false — parcelas ausente não vira default silencioso (BUG-20260721-N7Q1)... ✓ PASSOU
  getSubscription retorna 'parcelas' (não 'total_parcelas') e subscription_id: null (BUG-20260721-H3X6)... ✓ PASSOU

3 passou(aram), 0 falhou(aram) de 3 teste(s)
```

Dados de teste (`orgs/test-billing-fix-cancel`, `orgs/test-billing-fix-subscription`, `audit_logs` correspondentes) removidos ao final da execução (`cleanup()` no script).

## Nota sobre "vermelho" não capturado nesta rodada

Diferente de `BUG-20260721-K9M2`/`V3F7`/`R4T8` (onde o vermelho foi capturado ao vivo antes do fix), estes 3 bugs foram corrigidos diretamente e só o resultado verde foi executado — a evidência do "antes" é a leitura estática já registrada no `Steps to Reproduce` de cada `bug.md` original (comparação linha a linha contra `interfaces/*.md`), que já era suficientemente clara para confirmar a causa raiz sem precisar de execução. Value de vermelho-verde ao vivo sacrificado em favor de velocidade, dado o baixo risco das 3 correções (troca de campo/remoção de checagem, sem lógica nova).
