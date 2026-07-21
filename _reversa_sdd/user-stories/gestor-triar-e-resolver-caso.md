# User Story — Gestor triar e resolver um caso

> Cruza as units `dashboard`, `assistant`.

## História

**Como** gestor de compliance,
**Quero** visualizar os casos recebidos, entender o contexto sugerido pela IA e conduzir a apuração até o encerramento,
**Para que** eu cumpra os prazos legais e mantenha uma trilha de auditoria completa.

## Fluxo (Gherkin)

```gherkin
Funcionalidade: Triagem e resolução de caso pelo gestor

  Cenário: Listar e abrir um caso urgente
    Dado que estou autenticado como gestor da org "Acme Ltda"
    Quando eu acesso a lista de casos filtrando por urgência 4 e 5
    Então vejo apenas casos onde não estou listado como mencionado
    E posso abrir o detalhe de um caso para ver a triagem por IA

  Cenário: Usar o assistente de IA dentro do caso
    Dado que estou vendo o detalhe de um caso, plano "gestao"
    Quando eu pergunto ao assistente sobre os próximos passos legais
    E não estou mencionado neste caso
    Então recebo uma resposta contextualizada em tempo real (streaming)

  Cenário: Encerrar o caso
    Dado que concluí a apuração
    Quando eu altero o status do caso para "encerrado_com_acao" e preencho notas internas
    Então uma entrada é adicionada ao histórico do caso
    E um audit log case_status_changed é gravado

  Cenário: Gestor mencionado no caso
    Dado que fui listado em case.mencionados[] deste caso
    Quando eu tento acessar o detalhe ou usar o assistente sobre ele
    Então recebo acesso negado, mesmo sendo admin
```

## Units envolvidas

| Unit | Papel neste fluxo |
|---|---|
| `dashboard` | Listagem, detalhe, atualização de status, histórico, audit trail |
| `assistant` | Orientação de compliance contextualizada |

## Pós-condições
- `cases/{id}.status` atualizado, `historico` com novo item, audit log gravado
- Se `includeFullReport` foi usado no assistente: audit log adicional `ai_full_access_granted`
