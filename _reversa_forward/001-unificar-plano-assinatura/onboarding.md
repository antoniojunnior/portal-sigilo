# Onboarding: Testar a unificação de plano único

> Identificador: `001-unificar-plano-assinatura`
> Para quem vai validar manualmente esta feature pela primeira vez.

## Pré-requisitos

- Ambiente local rodando (`npm run dev` + Firebase emulators, ver `firebase.json`)
- Uma org de teste em `plano_ativo="entrada"` (para validar a migração) e outra em `plano_ativo="gestao"` (para validar que nada quebrou)
- `ASAAS_SANDBOX=true` configurado (checkout real não deve ser testado em produção)

## Passo a passo

### 1. Validar que os gates de feature foram removidos

1. Autentique como admin da org de teste que estava em `plano_ativo="entrada"`
2. Acesse o assistente de IA dentro de um caso → deve funcionar (antes: `403 feature_not_available`)
3. Acesse o dashboard e veja os insights → deve mostrar insight real ou fallback heurístico, não a mensagem fixa de upgrade
4. Gere um relatório do tipo `"personalizado"` → deve funcionar (antes: `403`)
5. Registre um novo caso via chatbot público (`/[slug]/chat`) para essa org → verifique no Firestore que `triagem_ia` foi preenchida por IA, não `triagem_manual: true`

### 2. Validar checkout com o novo identificador

1. Acesse `/planos` → deve exibir uma única oferta (mais Enterprise "sob consulta" à parte, se RN-09 mantida)
2. Complete um checkout de teste → confira que `POST /api/checkout/create` foi chamado com o novo identificador de plano, não `"entrada"`/`"gestao"`
3. Tente chamar `POST /api/checkout/create` manualmente com `{"plano": "entrada"}` (ex.: via `curl`/Postman) → deve retornar 400

### 3. Validar limites unificados

1. Na org antes em `entrada` (limite era 1 usuário): tente criar um 2º, 3º usuário gestor → deve permitir até o novo limite único (10), não bloquear no 2º
2. Confirme que o mesmo limite se aplica na org que já estava em `gestao` (sem regressão)
3. Faça upload de um anexo — confirme que o limite de storage checado é o valor único (20GB), não mais 2GB para a org que era `entrada`

### 4. Validar a migração de dado

1. Antes de rodar o script: confirme no Firestore que a org de teste ainda tem `plano_ativo="entrada"`
2. Rode o script de migração (`scripts/migrate-plano-unico.ts`, a ser criado nesta feature)
3. Confirme que `plano_ativo` da org mudou para o novo identificador
4. Confirme que um documento novo em `audit_logs` foi criado com `acao: "plano_migrado"` para essa org
5. Rode o script de novo → confirme que não gera mais nenhuma mudança (idempotência)

### 5. Validar que Enterprise e estados operacionais não foram afetados

1. Se houver org de teste em `plano_ativo="enterprise"`: confirme que o limite de usuários continua ilimitado
2. Suspenda uma org de teste (`plano_ativo="suspenso"`, via fluxo existente de `PAYMENT_OVERDUE` ou edição manual) → confirme que assistente de IA e geração de relatório continuam bloqueados com `403 plan_suspended`

## Onde olhar se algo der errado

- Erros de gate ainda aparecendo → revisar `_reversa_sdd/traceability/spec-impact-matrix.md` e a lista de 11 pontos em `investigation.md` — provavelmente um `if (plano === "entrada")` foi esquecido
- Checkout aceitando plano antigo → `src/app/api/checkout/create/route.ts` (`isPlanoValido`) não foi atualizado
- Limite errado → conferir os dois lugares que checam limite (`dashboard/users/route.ts` **e** `firestore.rules`) — são duplicados por design (ADR-005), os dois precisam mudar juntos
