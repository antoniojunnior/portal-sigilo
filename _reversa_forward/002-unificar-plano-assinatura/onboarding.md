# Onboarding: Unificação para plano único de assinatura

> Identificador: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Pré-requisito: `actions.md` (gerado por `/reversa-to-do`) com as ações Must concluídas

Passo a passo para um humano validar a feature manualmente pela primeira vez, em ambiente de **teste** (nunca produção — RNF "Ambiente" do `requirements.md`).

## 1. Confirmar ambiente

1. Verifique que `FIRESTORE_EMULATOR_HOST`/projeto Firebase apontado é o de testes, nunca produção
2. Confirme que a variável/flag de salvaguarda do script de reset (ver RNF "Ambiente" do `requirements.md`) está setada para permitir a execução

## 2. Rodar o reset + reseed

1. Execute o script de reset+reseed (substitui `scripts/seed-emulator.ts`/`seed-remote.ts` atual)
2. Verifique no console de saída que exatamente:
   - 1 org foi criada, com `plano_ativo: "unico"`
   - 2 usuários foram criados (1 `admin`, 1 `gestor`)
   - 5 departamentos aparecem em `configuracoes.departamentos`
   - Entre 5 e 15 casos foram criados (1 a 3 por departamento)
3. Rode o script uma segunda vez e confirme que é idempotente (reseta e repovoa sem duplicar nem falhar)

## 3. Validar limites unificados

1. Logue como o usuário `admin` da org mockada
2. Em "Configurações → Usuários", confirme que o limite exibido/aplicado é 50 (tente simular ou inspecionar a resposta de `GET/POST /api/dashboard/users`)
3. Faça upload de um anexo em um caso e confirme que o limite de armazenamento aplicado é 2GB (`POST /api/upload-attachment`)

## 4. Validar acesso pleno às features de IA

1. Acesse o assistente de IA (`POST /api/assistant`) — confirme que não há bloqueio de "feature não disponível"
2. Acesse os insights de IA do dashboard (`GET /api/dashboard/insights`) — confirme que não aparece mais a mensagem fixa de upgrade
3. Gere um relatório do tipo "personalizado" (`POST /api/reports/generate`) — confirme que não é bloqueado
4. Envie uma nova denúncia pelo portal público e confirme que ela passa por triagem automática de IA (não cai no fluxo de "triagem manual", já que `runTriagem` não deve mais ter o early-return de `entrada`)

## 5. Validar página pública `/planos`

1. Acesse `/planos` sem autenticação
2. Confirme que aparece **uma única oferta**, sem comparação de tiers e **sem qualquer menção a Enterprise**
3. Confirme que o preço exibido é R$ 1.164/ano, com opção de parcelamento em até 12x visível na UI de checkout

## 6. Validar checkout e cobrança (Opção A confirmada, D-04 do `roadmap.md`)

1. Simule um checkout de teste (sandbox Asaas) escolhendo pagamento parcelado
2. Confirme que o cartão é solicitado uma única vez
3. Confirme que a org é provisionada com `plano_ativo: "unico"` após confirmação de pagamento
4. Confirme manualmente (sem esperar 1 ano) que a Cloud Function agendada de renovação existe e pode ser disparada manualmente em ambiente de teste para simular a cobrança do próximo ciclo, usando o token salvo em `orgs.asaas_credit_card_token`
5. Simule uma falha na cobrança de renovação (ex.: token inválido) e confirme que a org é suspensa (`plano_ativo: "suspenso"`) imediatamente, sem retentativa (D-09 do `roadmap.md`)

## 7. Validar identificadores antigos rejeitados

1. Chame `POST /api/checkout/create` com `plano: "entrada"`, depois `plano: "gestao"`, depois `plano: "enterprise"`
2. Confirme que todas as três chamadas retornam 400

## 8. Validar que suspensão/cancelamento continuam funcionando

1. Simule (via webhook de teste) um evento `PAYMENT_OVERDUE` para a org mockada
2. Confirme que `plano_ativo` vira `"suspenso"` e que o acesso às features de IA passa a ser bloqueado com 403 `plan_suspended`
3. Reverta manualmente para `"unico"` e confirme que o acesso volta ao normal
4. Chame `DELETE /api/billing/cancel` como admin da org mockada (D-10, corrige A001 do `/reversa-audit`) — confirme que retorna 200 **sem** fazer nenhuma chamada de rede à Asaas, que `plano_ativo` vira `"cancelado"` e que `renovacao_cancelada` vira `true`
5. Confirme em `GET /api/billing/subscription` (D-11, corrige A002) que a resposta reflete os dados da org via Firestore/`getInvoices.ts`, com `source: "firestore"` e `subscription_id: null`, sem erro

## 9. Checklist de documentação

1. Confirme que `docs/PRD_PortalSigilo_v2.md` §3 não lista mais `entrada`/`gestao`/`enterprise`
2. Busque `"enterprise"` em todo o código-fonte (`grep -rn "enterprise" src/ functions/ firestore.rules`) e confirme que não há mais ocorrência ativa (fora de comentários históricos ou `audit_logs` de teste, se preservados)

## 10. Notas de execução

<!-- Reservado para /reversa-coding registrar observações que surgirem durante a execução real. -->
