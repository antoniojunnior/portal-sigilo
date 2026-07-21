# Chat

> Fonte: `_reversa_sdd/code-analysis.md` §5 (complexidade alta), `_reversa_sdd/domain.md`.

## Visão Geral
Núcleo do produto: chatbot Claude de escuta ativa que conduz a coleta anônima do relato do denunciante, decide quando o relato está completo, cria o caso e dispara a triagem automática por IA. 🟢

## Responsabilidades
- Conduzir conversa de coleta com regras de conduta e anonimato rígidas 🟢
- Detectar sinalização de fim de coleta (`<CASE_COMPLETE>`) dentro do próprio stream de texto 🟢
- Criar caso + mensagens + audit log atomicamente ao final da coleta 🟢
- Disparar triagem automática por IA (`runTriagem`) 🟢

## Regras de Negócio
- Nunca solicitar dados identificáveis (nome, CPF, matrícula) — regra embutida no prompt 🟢
- Vocabulário controlado: "contar"/"falar", nunca "denunciar" 🟢
- Coleta limitada a até 6 trocas de mensagens 🟢
- Fim de coleta sinalizado por tag de controle `<CASE_COMPLETE>{JSON}</CASE_COMPLETE>` — nunca repassada ao usuário final 🟢
- Plano `entrada`: triagem sempre manual, sem chamada à IA 🟢
- `callClaude` da triagem tenta no máximo 2 vezes; falha total marca `needs_manual_review: true` 🟢
- Urgência ≥ 4 gera notificação além do audit log 🟢
- Categorias legais e leis aplicáveis são listas fechadas (whitelist), validadas rigorosamente antes de gravar 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Conduzir coleta via streaming Claude sem vazar dados identificáveis | Must | Prompt de sistema proíbe explicitamente solicitar identificação |
| RF-02 | Não repassar ao cliente o bloco `<CASE_COMPLETE>` | Must | Buffer intercepta a tag antes de emitir tokens ao stream público |
| RF-03 | Criar caso + mensagens + audit log atomicamente ao detectar fim de coleta | Must | Batch único; falha de parse não cria caso parcial |
| RF-04 | Disparar triagem (IA ou manual conforme plano) após criação do caso | Must | `runTriagem` é chamado com os dados coletados |
| RF-05 | Validar rigorosamente o JSON de triagem retornado pela IA | Must | Categoria/lei fora da whitelist é descartada, não gravada |
| RF-06 | Notificar quando urgência ≥ 4 | Should | Documento em `notifications` criado |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Confiabilidade | Retry de até 2 tentativas na chamada de triagem à IA | `src/lib/triagem.ts:113-135` | 🟢 |
| Privacidade | Nenhum dado identificável solicitado por design de prompt | `src/app/api/chat/route.ts:41` | 🟢 |
| Disponibilidade | Erro no stream Claude emite evento de erro sem quebrar a conexão | `src/app/api/chat/route.ts:239-244` | 🟢 |
| Confiabilidade | Falha de `runTriagem` após criação do caso é isolada (não desfaz o caso já criado) | `src/app/api/chat/route.ts:226-228` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um denunciante conversando com o chatbot
Quando o Claude emite o bloco <CASE_COMPLETE> com JSON válido
Então um caso é criado, um evento case_created é emitido ao cliente, e a triagem é disparada

Dado o Claude emite um bloco <CASE_COMPLETE> com JSON malformado
Quando o parse falha
Então nenhum caso é criado e um evento de erro genérico é emitido ao cliente

Dado a org está no plano entrada
Quando um caso é criado via chat
Então a triagem é marcada como manual, sem chamar a API da Anthropic
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Coleta com regras de anonimato | Must | Requisito fundacional do produto (S2) |
| Criação atômica de caso | Must | Sem fallback aceitável para dado parcial |
| Triagem automática | Must | Diferencial de produto para planos pagos |
| Notificação de urgência | Should | Importante para SLA, mas não bloqueia o registro do caso |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/chat/route.ts` | `POST`, `buildSystemPrompt`, `createCase` | 🟢 |
| `src/lib/triagem.ts` | `runTriagem`, `callClaude`, `validateTriagem` | 🟢 |
| `src/lib/utils/protocol.ts` | `generateProtocol` | 🟢 |
