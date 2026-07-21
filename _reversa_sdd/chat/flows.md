# Chat, Fluxos

Ver diagramas completos em `_reversa_sdd/flowcharts/chat.md`. Dois fluxos distintos coexistem nesta unit:

## Fluxo 1 — Conversa/coleta (síncrono ao stream HTTP)

Do primeiro token até a detecção (ou não) de `<CASE_COMPLETE>`. É o fluxo visível ao denunciante, limitado a 6 trocas por design de prompt (não por enforcement de código — o limite é uma instrução ao modelo, não uma trava técnica 🟡).

## Fluxo 2 — Triagem (assíncrono ao ponto de vista do denunciante, síncrono ao stream do servidor)

Inicia **depois** que `case_created` já foi emitido ao cliente. O denunciante já tem o protocolo em mãos quando a triagem roda — do ponto de vista da UI, a triagem é "invisível" e não bloqueia a experiência de registro. Tecnicamente, porém, o servidor mantém a conexão SSE aberta até `runTriagem` terminar antes de emitir `done`, então há uma janela onde o cliente já tem o protocolo mas o stream HTTP ainda está tecnicamente ativo. 🟡 Isso significa que uma implementação de reconstrução deve decidir se replica esse acoplamento (triagem síncrona ao stream) ou desacopla via fila/job assíncrono — o comportamento observado é o primeiro, mas não há evidência de que seja um requisito deliberado vs. uma simplificação de implementação.
