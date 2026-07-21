# Cases

> Fonte: `_reversa_sdd/code-analysis.md` §4, `_reversa_sdd/domain.md`.

## Visão Geral
Criação de caso via formulário estruturado (canal alternativo ao chatbot) e consulta pública de status por protocolo, sem exposição de conteúdo do relato. 🟢

## Responsabilidades
- Criar caso + mensagens iniciais + audit log de forma atômica 🟢
- Gerar protocolo público único, sem colisão 🟢
- Permitir consulta pública de status sem revelar identidade nem conteúdo do relato 🟢
- Resolver a org/slug a partir de um protocolo (redirecionamento cross-org) 🟢

## Regras de Negócio
- Protocolo no formato `ETK-YYYY-XXXXXX`, alfabeto sem caracteres ambíguos (sem `I/O/0/1`) 🟢
- `ttl` do caso é `created_at + 5 anos` 🟢
- Consulta pública (`track`) nunca revela se um protocolo existe quando não encontrado (mensagem genérica `found:false`) 🟢
- Consulta pública nunca retorna o texto do relato — apenas `status` e `historico` 🟢
- `resolve` é usado para localizar a org/slug a partir do protocolo, sem checar identidade do solicitante 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Criar caso com protocolo único e mensagens iniciais em transação atômica | Must | Batch falha por completo ou nenhum documento é criado parcialmente |
| RF-02 | Gerar protocolo sem colisão, com até 3 tentativas | Must | Lança erro explícito após 3 tentativas |
| RF-03 | Consultar status por protocolo sem autenticação | Must | Retorna apenas status/histórico, nunca o relato |
| RF-04 | Não revelar existência de protocolo inexistente | Must | Resposta idêntica em formato para "não encontrado" |
| RF-05 | Resolver org/slug a partir do protocolo | Should | Usado para redirecionamento cross-org na UI pública |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Nenhuma autenticação em rotas públicas (por design, canal do denunciante) | `src/app/api/cases/{track,resolve}/route.ts` | 🟢 |
| Confiabilidade | Escrita atômica via Firestore batch | `src/app/api/cases/route.ts:54-83` | 🟢 |
| Privacidade | Resposta pública nunca inclui texto de mensagens | `src/app/api/cases/track/route.ts:28-43` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um org_id válido
Quando POST /api/cases é chamado com mensagens opcionais
Então um caso, suas mensagens e um audit log são criados atomicamente e um protocolo é retornado

Dado um protocolo inexistente
Quando GET /api/cases/track?protocolo=X é chamado
Então a resposta é {"found": false}, idêntica à de um protocolo que existe mas pertence a outra org sem org_id informado
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Criação atômica de caso | Must | Canal alternativo de entrada de denúncia |
| Consulta pública sem vazar dado | Must | Regra de anonimato (S2) sem exceção |
| Resolve (redirecionamento) | Could | Conveniência de navegação cross-org |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/cases/route.ts` | `POST` | 🟢 |
| `src/app/api/cases/track/route.ts` | `GET` | 🟢 |
| `src/app/api/cases/resolve/route.ts` | `GET` | 🟢 |
| `src/lib/utils/protocol.ts` | `generateProtocol` | 🟢 |
