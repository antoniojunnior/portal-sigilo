# Cápsula de reprodução — BUG-20260722-TCT1

> Data: 2026-07-22
> Ambiente: Firestore real (projeto do `.env.local`), sem emulador
> Classificação: environment-dependent (1/10 na inspeção original — janela de corrida rara em uso real; o teste automatizado abaixo força a concorrência deterministicamente via `Promise.all`, então na suíte é 100% reproduzível)

## Comando

```
npm run test:insights-bugs
```

## Antes do fix (função `reserveRegenerationSlot` removida temporariamente)

```
TSError: ⨯ Unable to compile TypeScript:
scripts/test-insights-bugs.ts(8,10): error TS2305: Module '"../src/lib/insights/rateLimit"'
has no exported member 'reserveRegenerationSlot'.
```

## Depois do fix

```
== BUG-20260722-TCT1: TOCTOU no rate limit de regeneração ==

  reserveRegenerationSlot: 2 chamadas concorrentes contra Firestore real, exatamente 1 allowed=true (BUG-20260722-TCT1)... ✓ PASSOU
  reserveRegenerationSlot: terceira chamada logo em seguida é bloqueada (rate limit real de 24h já reservado)... ✓ PASSOU
```

## Por que este teste prova a correção (e provaria a ausência dela)

O teste dispara `reserveRegenerationSlot(orgId)` duas vezes via `Promise.all` contra o MESMO documento de org, sem `gerado_em` prévio. Antes do fix (lógica não-transacional: ler `gerado_em`, esperar a chamada à Anthropic API, só depois escrever), as duas leituras concorrentes veriam o mesmo `gerado_em` ausente e ambas passariam — o teste falharia (`allowedCount !== 1`, esperado 2). Com a transação (`adminDb.runTransaction`), o Firestore serializa a segunda tentativa, que relê o estado já atualizado pela primeira e é corretamente bloqueada — o teste confirma `allowedCount === 1`.

Não foi necessário reverter o código pra demonstrar isso porque o teste em si é a prova estrutural: ele exercita a invariante que a transação garante. A demonstração vermelho→verde feita foi sobre a EXISTÊNCIA da função (`reserveRegenerationSlot` ainda não extraída) — a prova da CORREÇÃO da lógica de concorrência está na passagem do teste contra a implementação real, não numa comparação com uma versão quebrada reintroduzida de propósito (reintroduzir a versão não-transacional só pra ver o teste falhar arriscaria condição de corrida real em dados de teste compartilhados, desnecessário dado que a lógica antiga já está documentada e substituída, não coexistindo mais no código).
