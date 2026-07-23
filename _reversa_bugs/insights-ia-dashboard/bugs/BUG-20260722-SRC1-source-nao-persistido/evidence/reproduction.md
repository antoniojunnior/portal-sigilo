# Cápsula de reprodução — BUG-20260722-SRC1

> Data: 2026-07-22
> Ambiente: Firestore real (projeto do `.env.local`), sem emulador
> Classificação: deterministic (10/10, confirmado na inspeção original que registrou o bug)

## Comando

```
npm run test:insights-bugs
```

## Antes do fix (função `resolveInsightSource` removida temporariamente)

```
TSError: ⨯ Unable to compile TypeScript:
scripts/test-insights-bugs.ts(7,10): error TS2305: Module '"../src/lib/insights/mapItems"'
has no exported member 'resolveInsightSource'.
```

## Depois do fix

```
Testando fixes de insights-ia-dashboard (Firestore real)...

== BUG-20260722-SRC1: source não persistido ==

  resolveInsightSource(undefined) infere 'ai_generated' para dado legado sem o campo (reprodução do porquê o bug existia)... ✓ PASSOU
  resolveInsightSource('fallback') preserva a fonte real gravada, não cai no fallback legado (BUG-20260722-SRC1)... ✓ PASSOU
  resolveInsightSource('ai_generated') passa direto quando já é o valor real... ✓ PASSOU
  Firestore real: orgs.ai_insights.source grava e lê de volta sem perda (BUG-20260722-SRC1)... ✓ PASSOU

4 passou(aram), 0 falhou(aram) de 4 teste(s)
```

## Nota sobre o CHG-001/CHG-002 (persistência em `regenerate/route.ts`, leitura em `insights/route.ts`)

Esses dois itens do change set já estavam aplicados no código antes desta sessão de `/reversa-debugger-fix` (marcador `FIX BUG-10` em `regenerate/route.ts:142`). A evidência de que `source` é gravado é a leitura direta do código (linha 145: `source,` dentro do objeto passado a `.update()`), confirmada nesta sessão. O teste de round-trip Firestore (último teste acima) confirma que o campo, uma vez gravado, sobrevive à leitura sem perda — fechando a ponta que a suíte automatizada consegue verificar sem invocar o Route Handler HTTP completo (que exigiria sessão/cookie assinados).
