# Portal Sigilo — Instruções específicas para o Antigravity

## Comportamento do agente

- Modo de execução de terminal: SEMPRE usar "Request review" —
  nunca executar comandos sem aprovação explícita.
- Antes de escrever qualquer código, leia o AGENTS.md e o docs/SECURITY.md.
- Se uma tarefa envolver credenciais, chaves ou .env, pare e avise.
- Nunca faça push para o Git sem aprovação explícita do usuário.
- Gere um plano antes de executar qualquer fase do PRD.

## Verificação de segurança obrigatória

Antes de finalizar qualquer código que envolva:
- Chamadas à API Anthropic → verificar que está em Functions/server
- Upload de arquivo → verificar validação de mime type no server
- Query ao Firestore → verificar que org_id está presente como filtro
- WhatsApp → verificar que o número não está em texto puro

## Referências do projeto
- PRD completo: docs/PRD_PortalSigilo_v2.md
- Guia de implementação: docs/GUIA_IMPLEMENTACAO.md
- Regras de segurança detalhadas: docs/SECURITY.md