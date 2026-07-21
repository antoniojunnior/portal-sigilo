# Upload Attachment

> Fonte: `_reversa_sdd/code-analysis.md` §11, regra inviolável S7 (`AGENTS.md`).

## Visão Geral
Upload de anexos (imagem/vídeo/áudio/PDF) para Firebase Storage com validação server-side rígida de tipo real e limite de armazenamento por plano. 🟢

## Responsabilidades
- Validar tamanho máximo por arquivo 🟢
- Validar limite de armazenamento acumulado por plano 🟢
- Detectar o tipo mime real por assinatura binária, nunca confiar no `Content-Type` do client 🟢
- Persistir no Storage com nome gerado (nunca o nome original do usuário) 🟢
- Auditar uploads aceitos e rejeitados 🟢

## Regras de Negócio
- Tamanho máximo por arquivo: 50 MB 🟢
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`, `audio/mpeg`, `audio/ogg`, `audio/webm`, `application/pdf` 🟢
- Limite de storage por plano: entrada 2GB, gestão 20GB, enterprise ilimitado 🟢
- Falha ao calcular uso de storage é *graceful degradation* — permite o upload em vez de bloquear por indisponibilidade do cálculo 🟢
- Mime type é detectado pelos bytes reais do arquivo (`file-type`), nunca pelo `Content-Type` declarado (regra inviolável S7) 🟢
- Path de storage: `orgs/{org_id}/cases/temp/{uuid}/{uuid}.{ext}` — sempre gerado, nunca o nome original 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Rejeitar arquivo acima de 50MB antes de processar | Must | Retorna 400 sem ler o buffer completo desnecessariamente* |
| RF-02 | Rejeitar upload que excede limite de storage do plano | Must | Retorna 403 `storage_limit_exceeded` com `used`/`limit` |
| RF-03 | Detectar mime type real e rejeitar fora da whitelist | Must | Arquivo com extensão falsa é rejeitado pelo conteúdo real |
| RF-04 | Gravar audit log em upload aceito e rejeitado | Must | Ambos os caminhos geram entrada em `audit_logs` |
| RF-05 | Nunca usar o nome de arquivo original no path de armazenamento | Must | Path sempre contém apenas UUID gerado no servidor |

> *🟡 nota: o código atual chama `request.formData()` antes da checagem de `file.size`, então o corpo já foi parseado — a rejeição por tamanho evita o *upload ao Storage*, não a leitura do corpo da requisição em si.

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Validação de tipo por assinatura binária, não por metadado do client | `src/app/api/upload-attachment/route.ts:83-87` | 🟢 |
| Disponibilidade | Falha ao calcular storage não bloqueia o upload (degradação graciosa) | `:33-36` | 🟢 |
| Auditabilidade | Uploads aceitos e rejeitados sempre auditados | `:88-101,121-134` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um arquivo .jpg de 60MB
Quando POST /api/upload-attachment é chamado
Então retorna 400 "Arquivo muito grande. Tamanho máximo: 50 MB."

Dado um arquivo renomeado para .pdf mas cujo conteúdo real é um executável
Quando POST /api/upload-attachment é chamado
Então é rejeitado com 400, e um audit log upload_rejeitado é gravado com o tipo detectado real

Dado uma org no plano entrada já usando 1.9GB dos 2GB disponíveis
Quando um upload de 200MB é tentado
Então retorna 403 storage_limit_exceeded
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Validação de mime real | Must | Regra inviolável S7, sem exceção |
| Limite de tamanho e storage | Must | Proteção de custo e abuso |
| Auditoria de upload | Should | Importante para investigação, não bloqueia o upload em si |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/upload-attachment/route.ts` | `POST`, `checkStorageLimit`, `getOrgStorageUsed` | 🟢 |
