# Chat, Design Técnico

> Fonte: `src/app/api/chat/route.ts`, `src/lib/triagem.ts`, `_reversa_sdd/flowcharts/chat.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/chat` | `{messages: {role,content}[], org_id: string, unit_id?: string}` | `text/event-stream` (`token`\|`case_created`\|`done`\|`error`) | 200 (stream), 400, 404 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `createCase` | `(payload, messages, org_id, unit_id?)` | `Promise<{protocolo, caseId}>` | Batch atômico case+messages+audit |
| `runTriagem` | `(caseId, orgId, planoAtivo, coleta, protocolo)` | `Promise<void>` | Nunca lança — todo erro é capturado internamente |
| `callClaude` | `(coleta: ColetaIA)` | `Promise<TriagemResult \| null>` | Até 2 tentativas |
| `validateTriagem` | `(raw: unknown)` | `TriagemResult \| null` | Whitelist estrita |

## Fluxo Principal
1. Valida `org_id`/`messages`; carrega org (404 se ausente) (`route.ts:149-163`)
2. Se `unit_id`: busca `units/{unit_id}.nome` (`:166-169`)
3. `buildSystemPrompt(orgNome, unitNome)` — regras de conduta (`:36-68`)
4. Abre `ReadableStream`; para cada delta de texto, acumula em `accumulated` (`:177-198`)
5. Enquanto `accumulated` não contém `<CASE_COMPLETE>`: emite token normalmente (`:200-201`)
6. Ao detectar a tag no buffer, tenta casar regex completa; se casar: parse do JSON interno, `createCase`, emite `case_created`, chama `runTriagem` (`:202-233`)
7. Parse falho: emite `error`, **não cria caso** (`:229-232`)
8. `emit({type:"done"})` ao fim do stream Claude (`:238`)

## Fluxo Principal — runTriagem
1. `planoAtivo === "entrada"` → marca `triagem_manual: true`, audit `triagem_manual_indicada`, retorna (`triagem.ts:150-163`)
2. Senão: `callClaude(coleta)` — até 2 tentativas, cada uma parseando e validando via `validateTriagem` (`:113-135`)
3. Falha total → `triagem_ia.needs_manual_review: true`, audit `triagem_ia_falhou` (`:167-182`)
4. Sucesso → grava `triagem_ia`, cria `notifications` se `urgencia >= 4`, audit `triagem_ia_concluida` (`:184-218`)

## Fluxos Alternativos
- **Erro genérico no stream Claude:** emite `{type:"error", message:"Serviço temporariamente indisponível..."}` (`route.ts:239-244`)
- **`runTriagem` lança internamente:** capturado no chamador (`route.ts:226-228`), não afeta o `case_created` já emitido

## Dependências
- `generateProtocol` — geração de protocolo
- `runTriagem` — triagem por IA
- `adminDb` — persistência
- `@anthropic-ai/sdk` — geração de conversa e triagem

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Buffer acumulado (`accumulated`) para interceptar tag de controle embutida no texto do modelo | `route.ts:174-201`; ver ADR-004 | 🟢 |
| Triagem roda **depois** de `case_created` ser emitido, mantendo o stream aberto até `runTriagem` terminar | `route.ts:208-228` | 🟢 |
| Validação de triagem por whitelist rígida em vez de confiar no schema declarado no prompt | `triagem.ts:75-111` | 🟢 |

## Estado Interno
Nenhum persistente — `accumulated` e `caseCreated` são variáveis locais ao ciclo de vida do stream de uma única request.

## Observabilidade
`console.error` em `[/api/chat] Claude stream error`, `[/api/chat] createCase failed`, `[/api/chat] runTriagem failed`, `[triagem] attempt N failed`.

## Riscos e Lacunas
- 🟡 Parse de `<CASE_COMPLETE>` assume que a tag completa chega dentro do buffer acumulado sem interrupção — não há timeout/limite de tamanho de buffer observado
- 🔴 Se `createCase` falhar após o Claude já ter sinalizado conclusão, o denunciante recebe apenas erro genérico, sem retry automático de criação de caso
- 🟡 `unit_id` não é validado contra `units` existente — só é usado para personalizar o prompt, sem bloquear se inválido
