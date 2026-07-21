# Upload Attachment, Tarefas de Implementação

## Pré-requisitos
- [ ] Firebase Storage configurado com bucket acessível via Admin SDK
- [ ] Dependência `file-type` instalada

## Tarefas

- [ ] T-01, Implementar validação de tamanho máximo (50MB)
  - Origem no legado: `src/app/api/upload-attachment/route.ts:51,68-70`
  - Critério de pronto: arquivo acima do limite retorna 400 antes de tentar salvar
  - Confiança: 🟢

- [ ] T-02, Implementar `getOrgStorageUsed`/`checkStorageLimit` com degradação graciosa
  - Origem no legado: `src/app/api/upload-attachment/route.ts:6-37`
  - Critério de pronto: limite por plano respeitado; falha de cálculo não bloqueia upload
  - Confiança: 🟢

- [ ] T-03, Implementar detecção de mime real e whitelist
  - Origem no legado: `src/app/api/upload-attachment/route.ts:39-49,83-107`
  - Critério de pronto: arquivo com Content-Type falso é classificado pelo conteúdo real; fora da whitelist é rejeitado
  - Confiança: 🟢

- [ ] T-04, Implementar persistência com nome gerado (uuid) e path temp
  - Origem no legado: `src/app/api/upload-attachment/route.ts:109-118`
  - Critério de pronto: nome original do arquivo nunca aparece no path salvo
  - Confiança: 🟢

- [ ] T-05, Implementar audit log fire-and-forget (aceito/rejeitado)
  - Origem no legado: `src/app/api/upload-attachment/route.ts:88-101,121-134`
  - Critério de pronto: ambos os caminhos gravam log sem bloquear a resposta HTTP
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Teste de rejeição por tamanho
- [ ] TT-02, Teste de rejeição por mime real diferente da extensão declarada
- [ ] TT-03, Teste de limite de storage por plano (entrada/gestão/enterprise)
- [ ] TT-04, Teste de degradação graciosa quando `getOrgStorageUsed` lança exceção

## Tarefas de Migração de Dados
Nenhuma.

## Ordem Sugerida
1. T-03 (validação de tipo) e T-01 (tamanho) primeiro — guardas independentes
2. T-02 (storage) pode ser paralelo
3. T-04 → T-05 por último, dependem das guardas anteriores

## Lacunas Pendentes (🔴)
- **Crítica:** investigar e documentar o passo de "promoção" do anexo de `cases/temp/{uuid}/` para o array `anexos[]` de um `case`/`message` real — não encontrado no código do backend analisado
