# Cápsula de reprodução — BUG-20260721-K9M2

> Data: 2026-07-21
> Ambiente: sandbox Asaas real (`https://sandbox.asaas.com/api`), chave `ASAAS_API_KEY` de `.env.local` (atualizada pelo usuário nesta sessão após a chave anterior retornar 401 em qualquer chamada)
> Runtime: curl direto, fora da aplicação (branch/commit não relevante — teste isolado contra a API real, não contra o código do projeto rodando)
> Classificação: **deterministic** (reproduzido, mesmo resultado nas repetições)
> Taxa: 4/4 chamadas relevantes com o comportamento documentado abaixo

## Achado 1 (confirma e piora o diagnóstico original) — payload atual de `createPaymentLink.ts` falha com 400, sempre

Requisição EXATAMENTE igual ao body montado por `src/lib/asaas/createPaymentLink.ts` (`chargeType: INSTALLMENT`, `installmentCount`, `totalValue`):

```
POST https://sandbox.asaas.com/api/v3/paymentLinks
{"name":"Portal Sigilo — Plano Único (Anual)","billingType":"CREDIT_CARD","chargeType":"INSTALLMENT","installmentCount":3,"totalValue":1164,"description":"Assinatura anual do Portal Sigilo — Plano Único"}
```

Resposta real (ver `01-paymentlink-payload-atual-400.json`):

```json
{"errors":[{"code":"invalid_object","description":"Informe o número máximo de parcelas."}]}
```

**HTTP 400, sempre.** Isso não é uma questão de "o token pode não ser capturado" (hipótese original do bug) — é mais grave: **o checkout está 100% quebrado hoje**. Nenhum cliente consegue nem gerar o link de pagamento, porque a Asaas rejeita o payload de cara. `POST /api/checkout/create` (a rota Next.js) trata esse erro genericamente como 502 "Falha ao criar link de pagamento", sem detalhar a causa.

## Achado 2 — payload correto para `/v3/paymentLinks` usa `maxInstallmentCount` e `value`, não `installmentCount`/`totalValue`

```
POST https://sandbox.asaas.com/api/v3/paymentLinks
{"name":"Portal Sigilo — Plano Único (Anual)","billingType":"CREDIT_CARD","chargeType":"INSTALLMENT","maxInstallmentCount":12,"value":1164,"description":"Assinatura anual do Portal Sigilo — Plano Único"}
```

Resposta real (ver `02-paymentlink-payload-correto-200.json`): `HTTP 200`, link criado com sucesso (`id`, `url`, `maxInstallmentCount: 12`). Confirma que o recurso `/v3/paymentLinks` em si funciona para este caso de uso — o problema é só o nome dos campos usados no código atual.

Nota sobre a arquitetura em si (não testável só com curl, exige checkout real via navegador): o objeto do link criado não tem `customer` nem qualquer dado de cartão — a vinculação a um cliente e a eventual tokenização do cartão só acontecem quando alguém de fato paga através da URL do link, evento que chega depois via webhook `PAYMENT_CONFIRMED`. Não reproduzido nesta sessão (exigiria simular o checkout hospedado da Asaas num navegador).

## Achado 3 (bug adicional, MESMA causa raiz, arquivo diferente) — `renovarAssinatura.ts` usa `value` onde a API exige `installmentValue`

Requisição EXATAMENTE igual ao body montado por `functions/src/renovarAssinatura.ts` (`value` + `installmentCount`, sem `installmentValue`):

```
POST https://sandbox.asaas.com/api/v3/payments
{"customer":"cus_000008453055","billingType":"CREDIT_CARD","value":1164,"installmentCount":3,"dueDate":"2026-07-21","description":"...","creditCard":{...},"creditCardHolderInfo":{...}}
```

Resposta real (ver `03-payment-direto-payload-atual-renovar-400.json`):

```json
{"errors":[{"code":"invalid_installmentValue","description":"O valor da parcela deve ser informado."}]}
```

**HTTP 400, sempre.** A Cloud Function de renovação anual (`renovarAssinatura.ts`), que eu tinha registrado como referência "correta" ao abrir este bug, também falharia sempre que tentasse cobrar uma renovação parcelada — mesma classe de erro, arquivo diferente.

## Achado 4 — payload correto para `/v3/payments` parcelado usa `installmentValue` (valor da parcela), e SIM retorna `creditCardToken`

```
POST https://sandbox.asaas.com/api/v3/payments
{"customer":"cus_000008453055","billingType":"CREDIT_CARD","installmentCount":3,"installmentValue":388,"dueDate":"2026-07-21","description":"...","creditCard":{...},"creditCardHolderInfo":{...}}
```

Resposta real (ver `04-payment-direto-payload-correto-200-com-token.json`): `HTTP 200`, `status: "CONFIRMED"`, e **`creditCard.creditCardToken` presente** (`"d62366cf-01e3-48c6-8c24-57ee846cdd71"`) — confirma que a Asaas RETORNA um token reutilizável quando o cartão é enviado bruto (`creditCard` + `creditCardHolderInfo`) numa cobrança direta via `/v3/payments`, sem precisar de nenhum parâmetro extra de "salvar cartão". Isso é evidência forte (não prova definitiva, pois não testei o caminho via Payment Link pago de fato) de que a arquitetura D-04 é viável — o problema real está nos nomes de campo usados no código, não na premissa de que a Asaas suporta o fluxo.

## Achado 5 — reutilizar creditCardToken salvo (sem cartão bruto) funciona, confirma a viabilidade de D-04

```
POST https://sandbox.asaas.com/api/v3/payments
{"customer":"cus_000008453055","billingType":"CREDIT_CARD","installmentCount":3,"installmentValue":388,"creditCardToken":"d62366cf-01e3-48c6-8c24-57ee846cdd71","dueDate":"2026-07-21","description":"Renovacao anual (3x) - teste token salvo"}
```

Resposta real (ver `05-renovacao-com-token-salvo-200.json`): `HTTP 200`, `status: "CONFIRMED"` — cobrança feita reutilizando só o token, sem enviar `creditCard` bruto de novo. **Isso é o cenário exato de renovação anual da arquitetura D-04** e funciona. Reduz a incerteza restante sobre D-04: o único elo não testado é se um pagamento feito através da URL de um Payment Link (não de uma chamada direta a `/v3/payments`) também retorna `creditCardToken` no payload do webhook — o mecanismo de tokenização em si (reuso de token salvo) está confirmado funcional.

## Conclusão da reprodução

- `root_cause` do erro 400 em ambos os arquivos: **confirmed** — nomes de campo incorretos enviados à API real da Asaas, comprovado por chamada direta.
- A dúvida original do bug (captura de `creditCardToken` via Payment Link) permanece **supported**, não `confirmed`: a evidência do Achado 4 é favorável (tokenização funciona sem parâmetro especial numa cobrança direta), mas o caminho específico "pagamento feito através de um Payment Link" não foi exercitado (exigiria navegador).
