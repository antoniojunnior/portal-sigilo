# Requirements Audit

> Identificador da feature: `003-insights-ia-dashboard-admin`
> Data: `2026-07-22`
> Documento auditado: `_reversa_forward/003-insights-ia-dashboard-admin/requirements.md`

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
- [X] Q-002 | Clareza | Não há frases iniciadas por "talvez", "provavelmente" ou "se possível" sem qualificação numérica
- [X] Q-003 | Clareza | Termos do glossário do projeto são definidos na primeira ocorrência

### Completude

- [X] Q-004 | Completude | Todas as seções obrigatórias do template estão preenchidas com conteúdo, não placeholders
- [X] Q-005 | Completude | Cada Requisito Funcional tem critério de aceite verificável
- [X] Q-006 | Completude | Existem cenários Gherkin para casos felizes E casos negativos

### Consistência

- [X] Q-007 | Consistência | Termos chave do domínio aparecem com a mesma grafia em todas as seções
- [X] Q-008 | Consistência | IDs citados em uma seção existem na seção que os define
- [X] Q-009 | Consistência | Confidência (🟢 / 🟡 / 🔴) coerente com a fonte citada do `_reversa_sdd/`

### Cobertura

- [X] Q-010 | Cobertura | Todo Requisito Funcional tem pelo menos um cenário Gherkin
- [X] Q-011 | Cobertura | Toda Regra de Negócio nova ou alterada cita a regra original do `_reversa_sdd/domain.md` quando aplicável

### EdgeCases

- [X] Q-012 | EdgeCases | Limites numéricos relevantes têm valor concreto
- [X] Q-013 | EdgeCases | Estados vazios, nulos e iniciais foram considerados
- [X] Q-014 | EdgeCases | Concorrência, retentativa e timeout foram considerados quando aplicáveis

### Jargão

- [X] Q-015 | Jargão | Um humano novo no time entenderia o requirements sem glossário
- [ ] Q-016 | Jargão | Siglas são expandidas na primeira ocorrência

### SoluçãoImplícita

- [X] Q-017 | SoluçãoImplícita | O requirements descreve o quê, não o como
- [ ] Q-018 | SoluçãoImplícita | Não há nome de biblioteca, framework ou produto comercial no documento

### Princípios

- [X] Q-019 | Princípios | Cada Regra de Negócio respeita os princípios ativos em `.reversa/principles.md`
- [X] Q-020 | Princípios | Conflitos com princípios estão registrados explicitamente, não escondidos

## Itens reprovados, detalhe

### Q-016

> motivo: "CTA" (usado pela primeira vez no §1) e "MoSCoW" (§8) não são expandidos na primeira ocorrência. "CTA" pode não ser familiar para leitores fora do contexto de produto/UI. "MoSCoW" é explicado indiretamente pela tabela em §8, mas a sigla em si não é definida.
> sugestão: No §1, expandir "CTA (Call to Action)". No §8, renomear para "Prioridade MoSCoW (Must / Should / Could / Won't)" ou similar.

### Q-018

> motivo: "Anthropic API" é citada como produto comercial no RF-03 ("sem nova chamada à Anthropic API") e no RNF de Custo (§6). Embora a dependência seja real e a menção adicione clareza ao contexto do rate limit, o template de qualidade exige ausência de nomes de produto em requirements.
> sugestão: Substituir por "API de IA externa" mantendo a referência exata ao produto nos documentos técnicos derivados (roadmap e investigation.md, onde já aparecem com detalhes de implementação).

## Veredito

**Aprovado com ressalvas** — 2 itens reprovados, nenhum CRITICAL.

As reprovações são cosméticas (Q-016, expansão de siglas) e de pureza de requirements (Q-018, nome de produto). Nenhuma afeta a implementabilidade ou a cobertura. O requirements está suficientemente claro, completo e consistente para gerar plano e código — tanto que já gerou, com 13/13 ações implementadas e zero findings CRITICAL/HIGH/MEDIUM no cross-check do `/reversa-audit`.

O `requirements.md` NÃO foi modificado.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Auditoria gerada por `/reversa-quality` | reversa |
