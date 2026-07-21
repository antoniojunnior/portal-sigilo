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

---

# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Use o fluxo adequado no chat:

- `/reversa` — descobrir e documentar um sistema existente
- `/reversa-new` — criar PRD e specs para um projeto novo
- `/reversa-forward` — implementar ou evoluir código a partir das specs
- `/reversa-migrate` — planejar a migração de um sistema legado
- `/reversa-docs` — gerar o mini-site visual da documentação
- `/reversa-agents-help` — consultar o catálogo completo de agentes

## Comportamento ao ativar

Quando o usuário digitar `/reversa` ou a palavra `reversa` sozinha em uma mensagem:

1. Ative o skill `reversa` disponível em `.agents/skills/reversa/SKILL.md`
2. Leia o SKILL.md na íntegra e siga exatamente as instruções do Reversa

## Regra não-negociável

Nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado.
O Reversa escreve apenas em `.reversa/`, `_reversa_sdd/`, `_reversa_docs/` e `_reversa_forward/`.
