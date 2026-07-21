# Messages

> Fonte: `_reversa_sdd/code-analysis.md` §8.

## Visão Geral
Mensagens do denunciante no portal público — leitura e envio de mensagens de acompanhamento associadas a um caso. Distinto de `dashboard/cases/[caseId]/messages`, que é a via do gestor. 🟢

## Responsabilidades
- Listar mensagens de um caso ordenadas cronologicamente 🟢
- Registrar nova mensagem do denunciante 🟢
- Validar vínculo `case_id`↔`org_id` antes de gravar 🟢

## Regras de Negócio
- `POST` valida que o `case_id` pertence ao `org_id` informado antes de gravar 🟢
- Endpoint público, sem `verifySession` — coerente com o fluxo do denunciante (sem conta) 🟡

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Listar mensagens de um caso por `case_id`+`org_id` | Must | Retorna ordenado por `timestamp` asc |
| RF-02 | Validar vínculo caso↔org antes de gravar mensagem | Must | `case_id` de outra org retorna 404 |
| RF-03 | Gravar mensagem sempre com `autor: "denunciante"` | Must | Nunca aceita `autor` arbitrário no payload |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Endpoint público sem autenticação — proteção é só validação de vínculo | `src/app/api/messages/route.ts:48-51` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado um case_id existente na org X
Quando POST /api/messages é chamado com org_id=Y (diferente)
Então retorna 404 "Caso não encontrado"

Dado um case_id e org_id válidos e correspondentes
Quando POST /api/messages é chamado com texto não vazio
Então a mensagem é gravada com autor="denunciante"
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Validação de vínculo case↔org | Must | Única barreira de segurança do endpoint público |
| Listagem ordenada | Must | Necessária para exibir histórico ao denunciante |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/messages/route.ts` | `GET`, `POST` | 🟢 |
