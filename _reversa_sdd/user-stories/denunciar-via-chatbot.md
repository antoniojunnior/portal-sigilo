# User Story — Denunciar via chatbot

> Gerado pelo Writer em 2026-07-20. Fluxo de ponta a ponta cruzando as units `chat`, `cases` (indireto), `messages` (indireto).

## História

**Como** colaborador ou terceiro de uma empresa cliente,
**Quero** relatar uma irregularidade de forma anônima, conversando naturalmente,
**Para que** eu possa reportar sem medo de retaliação e sem precisar preencher um formulário formal.

## Fluxo (Gherkin)

```gherkin
Funcionalidade: Denúncia via chatbot de IA

  Cenário: Relato completo com sucesso
    Dado que estou no portal público da empresa "Acme Ltda" (slug válido)
    Quando eu converso com o chatbot descrevendo uma irregularidade
    E respondo às perguntas de contexto (quando, onde, recorrência, evidências)
    E confirmo o registro quando solicitado
    Então recebo um protocolo no formato ETK-YYYY-XXXXXX
    E o chatbot nunca me pediu nome, CPF ou qualquer dado identificável
    E a triagem automática por IA classifica o caso em segundo plano

  Cenário: Organização no plano Entrada
    Dado que a empresa está no plano "entrada"
    Quando meu relato é registrado
    Então a triagem é marcada como manual, sem chamada à IA de classificação

  Cenário: Falha ao interpretar o fim da coleta
    Dado que o modelo de IA sinaliza fim de coleta com um JSON malformado
    Quando o sistema tenta criar o caso
    Então recebo uma mensagem de erro genérica
    E nenhum caso é criado
    E preciso reiniciar a conversa
```

## Units envolvidas

| Unit | Papel neste fluxo |
|---|---|
| `chat` | Conduz a conversa, detecta fim de coleta, cria o caso, dispara a triagem |
| `cases` (via `generateProtocol`) | Fornece o gerador de protocolo compartilhado |
| Firestore `cases`/`messages`/`audit_logs`/`notifications` | Persistência do resultado |

## Pós-condições
- Um documento `cases/{id}` existe com `status: "aguardando_triagem"`
- As mensagens da conversa foram persistidas em `messages`
- Um audit log `case_criado` foi gravado
- Se urgência ≥ 4: uma notificação foi criada para os gestores da org
