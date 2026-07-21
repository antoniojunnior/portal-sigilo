# Upload Attachment, Design Técnico

> Fonte: `src/app/api/upload-attachment/route.ts`, `_reversa_sdd/flowcharts/upload-attachment.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/upload-attachment` | `multipart/form-data`: `file`, `org_id` | `{storage_path, filename, mime_type, size}` | 200, 400, 403 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `getOrgStorageUsed` | `(orgId: string)` | `Promise<number>` | Soma de bytes de todos os arquivos sob `orgs/{orgId}/` |
| `checkStorageLimit` | `(orgId: string, fileSize: number)` | `Promise<{ok, used?, limit?}>` | `ok:true` também em caso de erro interno (degradação graciosa) |

## Fluxo Principal
1. Parse `formData`; extrai `file`/`org_id` — 400 se ausentes (`:53-66`)
2. `file.size > 50MB` → 400 (`:68-70`)
3. `checkStorageLimit(org_id, file.size)` — 403 `storage_limit_exceeded` se excedido (`:72-78`)
4. Lê bytes → `Buffer`; `fileTypeFromBuffer(buffer)` detecta mime real (`:80-85`)
5. Mime fora da whitelist → audit `upload_rejeitado` (fire-and-forget) + 400 (`:87-107`)
6. Gera `uuid`, monta `storage_path`, salva no bucket com `contentType` detectado (`:109-118`)
7. Audit `upload_aceito` (fire-and-forget) (`:121-134`)
8. Retorna metadados do arquivo salvo (`:136-141`)

## Fluxos Alternativos
- **Falha ao calcular `getOrgStorageUsed`:** `checkStorageLimit` captura e retorna `{ok: true}` — upload prossegue mesmo sem confirmar o limite (`:33-36`)
- **`fileTypeFromBuffer` não detecta tipo (arquivo vazio/corrompido):** `mimeType = null`, cai automaticamente na rejeição por não estar na whitelist (`:85-87`)

## Dependências
- `adminDb`, `adminStorage` — persistência e auditoria
- `file-type` — detecção de mime por assinatura binária

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Audit logs de upload são fire-and-forget (`void adminDb...set(...)`, sem `await`) — não bloqueiam nem podem falhar a resposta ao usuário | `:88-101,121-134` | 🟢 |
| Path de storage sempre em `.../temp/...` — sugere que existe (ou deveria existir) um passo posterior de "promoção" do anexo de temp para definitivo, vinculando-o a um `case`/`message`, não encontrado nesta unit | `:112` | 🔴 |

## Estado Interno
Nenhum — cada upload é isolado.

## Observabilidade
`console.warn("[upload-attachment] Falha ao verificar storage — graceful degradation:", err)`.

## Riscos e Lacunas
- 🔴 **Lacuna funcional relevante**: o path gerado é sempre `.../cases/temp/{uuid}/...`, mas nenhuma rota encontrada no restante do sistema (`cases`, `chat`, `dashboard`) lê ou "promove" esse arquivo temporário para o array `anexos[]` de um `case`/`message`. O vínculo entre o anexo enviado e o caso/mensagem real não foi localizado no código analisado — requer validação humana sobre se esse passo existe em outro lugar não coberto pela extração (ex.: client-side apenas) ou se é uma lacuna real de implementação.
- 🟡 `getOrgStorageUsed` lista **todos** os arquivos sob o prefixo da org a cada upload — custo cresce com o volume total de arquivos já armazenados
