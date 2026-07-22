# Requirements Audit

> Identificador da feature: `002-unificar-plano-assinatura`
> Data: `2026-07-22`
> Documento auditado: `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
>
> Este relatório é estritamente leitor. O `requirements.md` NÃO foi alterado.
> Esta auditoria avalia QUALIDADE DE ESCRITA (clareza, completude, consistência, edge cases textuais), não cobertura de testes de implementação.
>
> Nota: esta é a **terceira execução** de `/reversa-quality` para esta feature. A 2ª rodada reprovou 1 item (Q-018, caminho de arquivo residual em §10); o documento foi editado manualmente depois (ver Histórico do `requirements.md`, linha "fechando o residual de Q-018"). Esta rodada reavalia do zero, sem herdar a numeração das rodadas anteriores.

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de itens | 22 |
| Aprovados | 20 |
| Reprovados | 2 |
| Veredito | Aprovado com ressalvas |

## Itens por categoria

### Clareza

- [X] Q-001 | Clareza | As frases de RN/RF têm sujeito, verbo e objeto explícitos e um único significado (ex.: RN-08, RF-01)?
- [ ] Q-002 | Clareza | A linha "Compatibilidade retroativa" (§6) é uma frase única, sem ambiguidade de leitura?
- [X] Q-003 | Clareza | Não há frases iniciadas por "talvez", "provavelmente" ou "se possível" sem qualificação numérica?

### Completude

- [X] Q-004 | Completude | Todas as 11 seções obrigatórias do template estão preenchidas com conteúdo real, sem placeholder?
- [X] Q-005 | Completude | Cada Requisito Funcional (RF-01 a RF-12) tem critério de aceite verificável na coluna "Critério de aceite"?
- [X] Q-006 | Completude | Existem cenários Gherkin para casos felizes (contratação, renovação) E casos negativos (checkout rejeitado, assinatura suspensa)?

### Consistência

- [X] Q-007 | Consistência | Termos-chave (`plano_ativo`, `categoria_legal`, `"unico"`) aparecem com a mesma grafia em todas as seções?
- [X] Q-008 | Consistência | IDs citados cruzadamente (RNF §6 citado em §10 Lacunas) existem na seção que os define?
- [X] Q-009 | Consistência | O nível de confidência (🟢/🟡/🔴) de cada item é coerente com a força da fonte citada (ex.: RNF "Compatibilidade retroativa" 🟡 reflete incerteza da inferência, não da regra-fonte S6 em si, que é 🟢)?

### Cobertura

- [X] Q-010 | Cobertura | RF-07, RF-09 e RF-11 (sem Gherkin dedicado) têm justificativa explícita registrada no documento para essa ausência?
- [X] Q-011 | Cobertura | Todo RF classificado como Must tem pelo menos um cenário Gherkin cobrindo seu comportamento observável (direta ou indiretamente)?
- [ ] Q-012 | Cobertura | Existe cenário Gherkin dedicado para a falha de cobrança de renovação levando à suspensão (RNF "Idempotência e falha de cobrança", §6)?

### EdgeCases

- [X] Q-013 | EdgeCases | Limites numéricos relevantes têm valor concreto (50 usuários, 2GB, R$1.164/ano, 12x, 5 departamentos, 1–3 casos/departamento), não "muitos"/"poucos"?
- [X] Q-014 | EdgeCases | Estados iniciais/vazios (base de teste reiniciada, org recém-provisionada) foram considerados sem entrar em detalhe de implementação prematuro?
- [X] Q-015 | EdgeCases | Concorrência/retentativa foi considerada onde relevante (RNF "renovação disparada mais de uma vez não pode duplicar cobrança")?

### Jargão

- [X] Q-016 | Jargão | A sigla "IA" é expandida ("Inteligência Artificial") na primeira ocorrência (Resumo executivo)?
- [X] Q-017 | Jargão | A sigla "MoSCoW" é expandida (Must/Should/Could/Won't) no título da seção que a usa?
- [X] Q-018 | Jargão | Um humano novo no time entenderia `categoria_legal`/`area_risco`/`Case.status` sem consultar glossário externo, dado que os valores possíveis são enumerados inline (RF-10)?

### SoluçãoImplícita

- [X] Q-019 | SoluçãoImplícita | O documento descreve o quê (comportamento observável) e não como implementar, mesmo ao citar símbolos do legado (`PLAN_USER_LIMITS`, `getPlanoLimit`) como pontos de verificação, não como prescrição de arquitetura nova?
- [X] Q-020 | SoluçãoImplícita | §10 ("Lacunas") permanece livre de caminho de arquivo de implementação, confirmando o fechamento do residual de Q-018 da rodada anterior?

### Princípios

- [X] Q-021 | Princípios | Não há `.reversa/principles.md` neste projeto — categoria não aplicável, nenhuma regra do requirements pode violar um princípio inexistente
- [X] Q-022 | Princípios | Nenhum conflito com princípio foi omitido silenciosamente (não há nada a omitir, dado Q-021)

## Itens reprovados, detalhe

### Q-002

> motivo: A linha "Compatibilidade retroativa" (§6, Requisitos Não Funcionais) funde dois cenários condicionais numa única frase longa ("...não são alterados... se esses logs persistirem fora do escopo... caso o reset também limpe audit_logs, a regra de imutabilidade S6 não se aplica..."), exigindo releitura para separar as duas ramificações.
> sugestão: Quebrar em duas frases: (1) "Se o reset preservar `audit_logs` fora do escopo de dados removidos, os registros históricos que citam `entrada`/`gestao`/`enterprise` permanecem intocados, respeitando a regra S6." (2) "Se o reset também apagar `audit_logs`, a regra de imutabilidade S6 não se aplica — ela protege contra alteração de registro existente, não contra descarte de ambiente de teste efêmero."

### Q-012

> motivo: A RNF "Idempotência e falha de cobrança" (§6) exige que falha na cobrança de renovação suspenda a org — um comportamento Must, adicionado retroativamente após achado de rodadas anteriores de `/reversa-audit`/`/reversa-quality` (ver Histórico do `requirements.md`). Nenhum dos 6 cenários Gherkin em §7 testa esse gatilho especificamente. O cenário "Assinatura suspensa continua bloqueada" testa a *consequência* de `plano_ativo="suspenso"` (acesso bloqueado), mas não o *caminho* "renovação falha → org suspensa" que esta feature introduz como novidade.
> sugestão: Adicionar um cenário: "Cenário: Falha na cobrança de renovação suspende o acesso / Dado uma org com assinatura ativa cujo ciclo anual venceu hoje / Quando a cobrança de renovação falha (cartão recusado, token expirado, ou qualquer erro de confirmação) / Então `plano_ativo` passa a `suspenso` imediatamente, sem retentativa automática".

## Veredito

**Aprovado com ressalvas**

Dois itens reprovados, nenhum classificado como CRITICAL (não há cobertura ausente no sentido pleno — o comportamento de suspensão já é testado por outro cenário, só falta o gatilho específico; não há princípio violado, dado que não existem princípios formais; não há contradição interna entre seções). O documento já passou por duas rodadas anteriores de `/reversa-quality` (vereditos "Reprovado" → "Aprovado com ressalvas") e por 5 rodadas de `/reversa-plan`/`/reversa-audit` sem que nenhum achado técnico fosse rastreado de volta a uma ambiguidade do `requirements.md` em si — os dois itens acima são refinamentos de redação/cobertura de cenário, não bloqueadores para a feature já implementada e auditada.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Auditoria gerada por `/reversa-quality` (1ª execução) — veredito Reprovado, 4 itens | reversa |
| 2026-07-21 | Segunda execução, pós-edição manual — veredito Aprovado com ressalvas, 1 item (Q-018, caminho de arquivo residual em §10) | reversa |
| 2026-07-22 | Terceira execução, releitura completa e independente do `requirements.md`, já maduro após 5 rodadas de `/reversa-audit` e implementação completa. Veredito Aprovado com ressalvas, 2 itens novos (Q-002 clareza de frase composta, Q-012 cenário de falha de renovação ausente) | reversa |
