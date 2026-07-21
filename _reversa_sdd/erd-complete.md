# ERD Completo — portal-sigilo

> Gerado pelo Architect em 2026-07-20. Banco Firestore (NoSQL) — cardinalidades inferidas do uso de `org_id`/`case_id` como chave de referência, não de FKs reais (Firestore não impõe integridade referencial).
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

```mermaid
erDiagram
    ORG ||--o{ UNIT : "possui (Enterprise)"
    ORG ||--o{ USER : "emprega"
    ORG ||--o{ CASE : "recebe"
    ORG ||--o{ MESSAGE : "contém (via case)"
    ORG ||--o{ AUDIT_LOG : "gera"
    ORG ||--o{ REPORT : "gera"
    ORG ||--o{ NOTIFICATION : "recebe"
    ORG ||--o{ WHATSAPP_SESSION : "possui (não implementado)"

    UNIT ||--o{ CASE : "escopo opcional"
    UNIT ||--o{ USER : "escopo opcional"

    CASE ||--o{ MESSAGE : "possui"
    CASE ||--o{ AUDIT_LOG : "referenciado por"
    CASE ||--o{ NOTIFICATION : "gera (urgência>=4)"
    CASE }o--o{ USER : "mencionados[] (bloqueio de acesso)"
    CASE }o--o| USER : "responsavel_id (atribuição)"

    USER ||--o{ AUDIT_LOG : "autor de"
    USER ||--o{ MESSAGE : "autor (role=gestor)"
    USER ||--o{ REPORT : "aprovado_por"

    ORG {
        string id PK
        string nome
        string slug UK
        string plano_ativo "entrada|gestao|enterprise|suspenso|cancelado (runtime; tipo declarado só tem 3 valores)"
        string logo
        string[] dominios_white_label "declarado, sem uso observado"
        timestamp criado_em
        timestamp data_renovacao
        object configuracoes "categorias[], boas_vindas, prazo_padrao_dias, departamentos[] (usado, não tipado)"
        number users_count "denormalizado, mantido via increment"
        string asaas_customer_id FK "vínculo com Asaas"
        string asaas_subscription_id
        object ai_insights "items[], gerado_em"
    }

    UNIT {
        string id PK
        string org_id FK
        string nome
        string responsavel_id "declarado, sem uso observado"
        timestamp criado_em
    }

    USER {
        string id PK "= Firebase Auth uid"
        string org_id FK
        string unit_id FK "opcional"
        string nome
        string email
        string role "admin|gestor|auditor"
        boolean ativo "flag de revogação de sessão"
        timestamp criado_em
    }

    CASE {
        string id PK
        string org_id FK
        string unit_id FK "opcional"
        string protocolo UK "ETK-YYYY-XXXXXX, único por org"
        string canal_origem "web|whatsapp|app|0800 (só web implementado)"
        string categoria "bruta, via formulário"
        number urgencia "1-5, bruta"
        string status "aguardando_triagem|em_apuracao|pendente_informacao|encerrado_sem_infracao|encerrado_com_acao"
        timestamp created_at
        timestamp updated_at "usado em runtime, ausente do tipo declarado"
        timestamp ttl "created_at + 5 anos"
        object triagem_ia "categoria_legal, subcategoria, urgencia, lei_aplicavel[], area_risco, recomendacao, gerado_em"
        object coleta_ia "usado, ausente do tipo declarado"
        boolean triagem_manual "usado, ausente do tipo declarado"
        array historico "acao, user_id, timestamp, detalhes"
        array mencionados "uids bloqueados de acesso"
        array anexos "nome, tipo, tamanho, storage_path"
        timestamp prazo "opcional"
        string responsavel_id FK "opcional"
        string notas_internas "opcional"
    }

    MESSAGE {
        string id PK
        string case_id FK
        string org_id FK
        string autor "sistema|denunciante|gestor"
        string texto
        number seq "opcional, ordem sequencial"
        timestamp timestamp
        array anexos "nome, tipo, storage_path"
    }

    AUDIT_LOG {
        string id PK
        string org_id FK
        string user_id FK "ou 'sistema'"
        string acao "catálogo de ~25 ações, ver data-dictionary.md"
        string case_id FK "opcional"
        object detalhes "livre por ação"
        timestamp timestamp "SEM ttl — imutável, retenção via export externo (não encontrado)"
    }

    REPORT {
        string id PK
        string org_id FK
        string unit_id FK "declarado, sem uso observado"
        object periodo "inicio, fim (Timestamp)"
        timestamp gerado_em
        string texto_claude
        boolean aprovado
        boolean exportado
        string tipo "padrao|personalizado|esg (esg sem rota observada)"
        string status "rascunho|aprovado|exportado"
        string aprovado_por FK "opcional"
        timestamp aprovado_em "opcional"
        object filtros "opcional"
        object metricas "total, resolvidos, pendentes, prazoMedio, topCategorias"
    }

    NOTIFICATION {
        string id PK
        string org_id FK
        string case_id FK
        string protocolo
        string tipo "alerta_urgencia (único valor observado)"
        number urgencia
        string categoria
        boolean lida "sem rota para marcar como lida — LACUNA"
        timestamp created_at
    }

    WHATSAPP_SESSION {
        string id PK
        string conversation_id UK "SHA-256 do número — nunca texto puro"
        string org_id FK
        string unit_id FK "opcional"
        string case_id FK "opcional"
        string status "iniciada|coletando|aguardando_confirmacao|encerrada"
        array historico_ia "role, content, timestamp"
        timestamp created_at
    }
```

## Notas sobre cardinalidade e integridade referencial

🟡 Firestore **não impõe** nenhuma das relações acima em nível de banco — todas as "chaves estrangeiras" (`org_id`, `case_id`, `unit_id`, `responsavel_id`, `aprovado_por`) são strings livres, validadas (quando validadas) apenas na camada de aplicação:
- `org_id` em `cases`/`messages`: validado em toda escrita relevante (ex.: `POST /api/messages` confere `caseDoc.data().org_id === org_id`)
- `unit_id` em `cases`: aceito sem validar que a unidade existe (`POST /api/cases`, `POST /api/chat` não verificam `units/{unit_id}` antes de gravar — só `chat` lê a unidade para personalizar o prompt, mas não bloqueia se não existir)
- `mencionados[]`/`responsavel_id` em `cases`: `mencionados` é validado contra `users` da mesma org só em `POST mencionados`; `responsavel_id` não parece ser validado contra `users` existentes no PATCH de caso (🔴 LACUNA — pode-se atribuir um `responsavel_id` inexistente)
- `whatsapp_sessions` não tem nenhuma rota de escrita observada — a entidade existe só como tipo TypeScript, não há dado real (🔴 confirmado como não implementado)

## Relação N:M explícita

`CASE.mencionados[]` é a única relação N:M do domínio: um caso pode mencionar vários usuários, e um usuário pode estar mencionado em vários casos. É modelada como array de IDs dentro do documento `case` (padrão comum em NoSQL), não como coleção de junção.
