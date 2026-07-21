# ADR-004 — Streaming de IA via `ReadableStream` nativo + SSE manual, sem AI SDK

**Status:** 🟢 Confirmado (retroativo)
**Local:** `src/app/api/chat/route.ts`, `src/app/api/assistant/route.ts`

## Contexto

Chat com o denunciante e assistente de IA para gestores precisam exibir a resposta do Claude token a token (experiência de "digitação" em tempo real), sobre Next.js Route Handlers.

## Decisão

Implementar manualmente um `ReadableStream` que consome `anthropic.messages.stream(...)` e reemite cada `content_block_delta` como evento SSE (`data: {...}\n\n`) via `TextEncoder`, sem usar um SDK de streaming de UI de terceiros (ex.: Vercel AI SDK).

No fluxo `chat`, essa decisão se combina com uma necessidade adicional: interceptar quando o modelo emite a tag de controle `<CASE_COMPLETE>` **dentro** do próprio stream de texto, sem repassar esse bloco de controle ao usuário final — o que exige acumular o buffer (`accumulated`) e decidir token a token se ele faz parte de conteúdo visível ou de um bloco de controle interno.

## Alternativas consideradas

🔴 Não documentadas. Um AI SDK de mercado tipicamente abstrairia o parsing de stream, mas não teria suporte nativo para a lógica de "tag de controle embutida no texto visível" que este produto precisa (`CASE_COMPLETE`) — plausivelmente a razão real, ainda que não registrada, para a implementação manual.

## Consequências

- 🟢 Controle total sobre quando emitir ao cliente vs. quando processar internamente (necessário para o padrão `CASE_COMPLETE`)
- 🟡 Duplicação de lógica de streaming entre `chat/route.ts` e `assistant/route.ts` (mesma estrutura de `ReadableStream`/`encoder`/`emit`, sem abstração compartilhada) — candidato a extração de helper comum, não feita até o momento desta análise
- 🟡 Tratamento de erro é local a cada rota (`try/catch` dentro do `start()` do stream, emitindo `{type: "error"}` e fechando o controller) — consistente entre as duas rotas, mas replicado manualmente
- 🟢 Nenhuma dependência adicional de UI/streaming além do `@anthropic-ai/sdk` já necessário
