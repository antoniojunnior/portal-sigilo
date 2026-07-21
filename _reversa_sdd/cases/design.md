# Cases, Design Técnico

> Fonte: `src/app/api/cases/{route,track/route,resolve/route}.ts`, `src/lib/utils/protocol.ts`, `_reversa_sdd/flowcharts/cases.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/cases` | `{org_id, unit_id?, canal_origem?, mensagens?}` | `{protocolo, case_id}` | 200, 400, 404, 500 |
| GET | `/api/cases/resolve?protocolo=` | query `protocolo` | `{found, slug?, org_id?}` | 200, 400 |
| GET | `/api/cases/track?protocolo=&org_id=` | query `protocolo`, `org_id?` | `{found, case?}` | 200, 400 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `generateProtocol` | `(orgId: string)` | `Promise<string>` | Até 3 tentativas, lança em colisão persistente |

## Fluxo Principal (POST /cases)
1. Valida `org_id`; verifica existência da org (`route.ts:15-25`)
2. `generateProtocol(org_id)` (`:27`)
3. Monta `caseData` com `ttl = now + 5 anos`, `historico` inicial (`:33-52`)
4. `batch`: `set case`, `set message` por item de `mensagens`, `set audit_log` — commit único (`:54-83`)
5. Retorna `{protocolo, case_id}` (`:85`)

## Fluxo Principal (GET /track)
1. Valida `protocolo` presente (`:5-9`)
2. Query `cases` por `protocolo` (+`org_id` se informado, evita índice composto quando ausente) (`:11-18`)
3. Vazio → `{found: false}` (`:20-23`)
4. Encontrado → retorna apenas `id`, `protocolo`, `status`, `created_at`, `historico` — nunca o relato (`:25-44`)

## Fluxos Alternativos
- **`resolve` sem org encontrada:** `{found: false}` (`resolve/route.ts:25-27`)
- **`track` com `org_id` informado:** usa índice composto `org_id + protocolo`; sem `org_id`, cai para query só por `protocolo` (uso: acesso direto por URL após Tela 0)

## Dependências
- `adminDb` — leitura/escrita Firestore
- `generateProtocol` (`src/lib/utils/protocol.ts`)

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Resposta de "não encontrado" idêntica independente do motivo real (evita enumeração de protocolos) | `track/route.ts:20-23` | 🟢 |
| Escrita atômica via `batch` para garantir consistência caso+mensagens+audit | `route.ts:54-83` | 🟢 |

## Estado Interno
Nenhum — cada request é independente.

## Observabilidade
`console.error("[POST /api/cases]", err)` em falha de criação.

## Riscos e Lacunas
- 🔴 `unit_id` não é validado contra `units/{unit_id}` existente antes de gravar no caso
- 🟡 `generateProtocol` faz até 3 tentativas de query sequenciais — sob alta concorrência de criação simultânea na mesma org, pode aumentar latência de POST /cases
