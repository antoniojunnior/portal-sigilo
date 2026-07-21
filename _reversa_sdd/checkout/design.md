# Checkout, Design Técnico

> Fonte: `src/app/api/checkout/create/route.ts`, `src/lib/asaas/createPaymentLink.ts`, `_reversa_sdd/flowcharts/checkout.md`.

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/checkout/create` | `{plano: "entrada"\|"gestao", ciclo?: "mensal"\|"anual"}` | `{url: string}` | 200, 400, 500, 502, 503 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `createPaymentLink` | `(plano: PlanoId, ciclo: BillingCycle)` | `Promise<{url: string}>` | Lança `Error` com mensagens específicas mapeadas para status HTTP |

## Fluxo Principal
1. Parse do corpo — 400 se JSON inválido (`route.ts:19-23`)
2. Valida `plano` via `isPlanoValido` — 400 se inválido (`:27-32`)
3. Valida `ciclo` se informado via `isCicloValido` — 400 se inválido (`:34-39`)
4. `cicloFinal = ciclo válido ?? "mensal"` (`:41`)
5. `createPaymentLink(plano, cicloFinal)` → `PLANOS_CONFIG[plano][ciclo]` → `POST asaas /v3/paymentLinks` (`createPaymentLink.ts:26-42`)
6. Retorna `{url}` (`route.ts:45`)

## Fluxos Alternativos
- **`ASAAS_API_KEY` ausente:** `createPaymentLink` lança `"ASAAS_API_KEY não configurada"` → mapeado para 503 (`route.ts:49-55`)
- **Asaas retorna erro HTTP ou sem `url`:** lança `"Falha ao criar link de pagamento"`/`"Falha ao obter link de pagamento"` → mapeado para 502 (`:57-65`)
- **Qualquer outro erro:** 500 genérico (`:67-71`)

## Dependências
- `createPaymentLink` (`src/lib/asaas/createPaymentLink.ts`)
- `env.ASAAS_API_KEY`/`ASAAS_BASE_URL`

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Mapeamento de mensagem de erro (string) para status HTTP via comparação exata de texto | `route.ts:47-71` | 🟡 frágil — mudança na mensagem de erro em `createPaymentLink` quebra silenciosamente o mapeamento de status |
| Preços fixos hardcoded em `PLANOS_CONFIG`, distintos da fonte `src/lib/planos.ts` usada pela UI | `createPaymentLink.ts:7-16` vs `src/lib/planos.ts` | 🟡 duas fontes de verdade de preço — ver Riscos |

## Estado Interno
Nenhum.

## Observabilidade
`console.error` em `[checkout/create] ASAAS_API_KEY não configurada`, `[checkout/create] Erro inesperado`.

## Riscos e Lacunas
- 🟡 **Duas fontes de preço**: `PLANOS_CONFIG` (`createPaymentLink.ts`) e `PLANOS` (`src/lib/planos.ts`, usado pela UI de `/planos`) declaram os mesmos valores de forma independente — se um for atualizado sem o outro, a UI mostra um preço e a cobrança real é outro
- 🟡 Mapeamento de erro por comparação de string exata é frágil a refatoração da mensagem de erro
