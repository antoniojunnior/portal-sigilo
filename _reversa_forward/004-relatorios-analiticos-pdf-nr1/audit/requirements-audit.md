# Requirements Audit

> Identificador da feature: `004-relatorios-analiticos-pdf-nr1`
> Data: `2026-07-22`
> Documento auditado: `_reversa_forward/004-relatorios-analiticos-pdf-nr1/requirements.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de itens | 20 |
| Aprovados | 18 |
| Reprovados | 2 |
| Veredito | Aprovado com ressalvas |

## Itens por categoria

### Clareza

- [X] Q-001 | Clareza | Cada frase do requirements tem sujeito, verbo e objeto explícitos
- [X] Q-002 | Clareza | Não há frases iniciadas por "talvez", "provavelmente" sem qualificação
- [X] Q-003 | Clareza | Termos do glossário definidos na primeira ocorrência

### Completude

- [X] Q-004 | Completude | Todas as seções obrigatórias preenchidas com conteúdo
- [X] Q-005 | Completude | Cada RF tem critério de aceite verificável
- [X] Q-006 | Completude | Cenários Gherkin para casos felizes E negativos (5 cenários, incl. ausência NR-1 e auditor bloqueado)

### Consistência

- [X] Q-007 | Consistência | Termos chave com mesma grafia em todas as seções
- [X] Q-008 | Consistência | IDs citados existem na seção que os define
- [X] Q-009 | Consistência | Confidência coerente com fonte citada do `_reversa_sdd/`

### Cobertura

- [X] Q-010 | Cobertura | Todo RF tem pelo menos um cenário Gherkin
- [X] Q-011 | Cobertura | Toda RN cita regra original do `_reversa_sdd/domain.md` quando aplicável

### EdgeCases

- [X] Q-012 | EdgeCases | Limites numéricos têm valor concreto (24h, 3 meses, 50 docs)
- [X] Q-013 | EdgeCases | Estados vazios/nulos/iniciais considerados (NR-1 zero = "nenhum caso")
- [X] Q-014 | EdgeCases | Concorrência/retentativa/timeout considerados quando aplicável (rate limit cobre)

### Jargão

- [X] Q-015 | Jargão | Humano novo entenderia sem glossário
- [ ] Q-016 | Jargão | Siglas expandidas na primeira ocorrência

### SoluçãoImplícita

- [X] Q-017 | SoluçãoImplícita | Descreve o quê, não o como
- [ ] Q-018 | SoluçãoImplícita | Não há nome de produto comercial no documento

### Princípios

- [X] Q-019 | Princípios | RNs respeitam princípios ativos
- [X] Q-020 | Princípios | Conflitos registrados explicitamente

## Itens reprovados

### Q-016

> motivo: "CTA" (§1) e "MoSCoW" (§8) não expandidos na primeira ocorrência.
> sugestão: Expandir "CTA (Call to Action)" no §1 e "MoSCoW (Must/Should/Could/Won't)" no §8.

### Q-018

> motivo: "Anthropic API" citada no RNF de Custo (§6). Embora seja a dependência real, o template exige ausência de nomes de produto.
> sugestão: Substituir por "API de IA externa", mantendo detalhes técnicos no roadmap.

## Veredito

**Aprovado com ressalvas** — 2 itens reprovados, nenhum CRITICAL.

Cosméticos (Q-016 expansão de siglas, Q-018 nome de produto). Não afetam implementabilidade. Feature implementada com 11/11 ações e zero findings CRITICAL/HIGH/MEDIUM no cross-check.

O `requirements.md` NÃO foi modificado.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Auditoria gerada por `/reversa-quality` | reversa |
