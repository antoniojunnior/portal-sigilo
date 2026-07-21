# Messages, Design Técnico

> Fonte: `src/app/api/messages/route.ts`, `_reversa_sdd/flowcharts/messages.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| GET | `/api/messages?case_id=&org_id=` | query | `{messages: Message[]}` | 200, 400 |
| POST | `/api/messages` | `{case_id, org_id, texto}` | `{id: string}` | 200, 400, 404, 500 |

## Fluxo Principal (GET)
1. Valida `case_id`/`org_id` presentes (`:5-10`)
2. Query `messages` por `case_id`+`org_id`, orderBy `timestamp` asc (`:12-17`)
3. Serializa e retorna (`:19-30`)

## Fluxo Principal (POST)
1. Valida `case_id`/`org_id`/`texto` presentes e não-vazios (`:41-45`)
2. Carrega `cases/{case_id}`; valida existência e `org_id` correspondente — 404 senão (`:48-51`)
3. Grava mensagem com `autor: "denunciante"` fixo (`:53-62`)

## Fluxos Alternativos
Nenhum além do caminho feliz e das validações — unit simples, sem ramificação de negócio.

## Dependências
- `adminDb`

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| `autor` nunca vem do payload do cliente — sempre fixado como `"denunciante"` no servidor | `route.ts:58` | 🟢 |

## Estado Interno
Nenhum.

## Observabilidade
`console.error("[POST /api/messages]", err)`.

## Riscos e Lacunas
- 🟡 Sem autenticação real — a segurança depende inteiramente de `case_id` ser difícil de adivinhar (é um ID de documento Firestore, não sequencial) combinado com a validação de `org_id`
