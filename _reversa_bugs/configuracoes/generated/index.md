<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-23 a partir de 6 bugs (6 resolved, 1 exceção honesta de invariante) -->

# Índice de Bugs — configuracoes

## Resumo por status

| Status | Contagem |
|---|---|
| resolved | 6 |

## Bugs resolvidos e travados (`DONE.md`)

| ID | # | Título | Severidade | Prioridade | regression_tests |
|---|---|---|---|---|---|
| BUG-20260723-MOB1 | 15 | Sem navegação mobile até Faturamento | high | P1 | `scripts/test-configuracoes-residual.ts` |
| BUG-20260723-SRT1 | 18 | sort/order não documentados na Asaas | high | P2 | `scripts/test-billing-date-sort.ts` |
| BUG-20260723-CLP1 | 16 | Submenu colapsado não navega | medium | P2 | `scripts/test-configuracoes-residual.ts` |
| BUG-20260723-ERR1 | 17 | Erro de API da Asaas vira lista vazia | medium | P2 | `scripts/test-configuracoes-residual.ts` |
| BUG-20260723-DAT1 | 20 | Possível offset de 1 dia nas datas | medium | P3 | `scripts/test-billing-date-sort.ts` |
| BUG-20260723-ACT1 | 19 | Item ativo não destaca em reload | low | P3 | `scripts/test-configuracoes-residual.ts` |

## ⚠️ Exceção honesta de invariante (permanece, intencional): BUG-20260723-SRT1

`root_cause.state: supported` (não `confirmed`) mesmo com `resolution_kind: fixed`. Causa: comportamento real da API da Asaas pra `sort`/`order` não pode ser confirmado sem acesso a sandbox — evidência disponível é só a ausência desses parâmetros na documentação pública oficial (`supported`, evidência parcial real). Decisão consciente de **não fabricar** uma confirmação inexistente. A correção (ordenação local, independente do comportamento da API) já está aplicada e testada — só a causa raiz upstream não é 100% confirmável.

## Reconciliações em 2026-07-23

- **MOB1/CLP1/ERR1/ACT1**: `regression_tests: []` → preenchido com `scripts/test-configuracoes-residual.ts` (novo, estrutural).
- **DAT1**: `root_cause.state: hypothesized` → `confirmed` (prosa já dizia "confirmado ao vivo", campo YAML estava desatualizado).
- **SRT1**: `root_cause.state: hypothesized` → `supported` (upgrade honesto, não fabricado).
