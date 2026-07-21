# Interface: `POST /api/checkout/create`

> Identificador: `002-unificar-plano-assinatura`
> Contrato: HTTP
> Origem no legado: `_reversa_sdd/checkout/requirements.md`, `src/app/api/checkout/create/route.ts`

## Antes

```json
// Request
{ "plano": "entrada" | "gestao", "ciclo": "mensal" | "anual" }

// Response 200
{ "url": "<link de pagamento Asaas>" }

// Response 400
{ "error": "Plano inválido. Valores aceitos: entrada, gestao" }
```

## Depois

```json
// Request
{ "plano": "unico", "parcelas": 1 | 2 | ... | 12 }

// Response 200
{ "url": "<link de pagamento Asaas>" }

// Response 400 (identificador antigo ou parcelas fora de faixa)
{ "error": "Plano inválido. Valor aceito: unico" }
{ "error": "Parcelamento inválido. Aceito: 1 a 12." }
```

- Campo `ciclo` deixa de existir — não há mais ciclo mensal/anual a escolher, o plano único já é anual por definição
- Campo novo `parcelas` — substitui a escolha de ciclo pela escolha de forma de pagamento (à vista = 1, ou até 12x)
- `isPlanoValido` passa a aceitar apenas `"unico"`; qualquer valor antigo (`entrada`, `gestao`, `enterprise`) retorna 400
- Validação de `parcelas`: inteiro entre 1 e 12 — fora dessa faixa retorna 400

## Idempotência e erros

- Sem mudança na idempotência do link de pagamento em si (cada chamada gera um novo link, comportamento herdado do legado)
- Opção A confirmada (D-04 do `roadmap.md`): o corpo da chamada à Asaas dentro deste Route Handler muda de `chargeType: "RECURRENT"` para `chargeType: "INSTALLMENT"` com `installmentCount: parcelas`, e a resposta da Asaas deve ser usada para persistir `asaas_credit_card_token` em `orgs` (via `provisionOrg`, ver `interfaces/webhook-asaas.md`) — ver `investigation.md` para a análise completa
