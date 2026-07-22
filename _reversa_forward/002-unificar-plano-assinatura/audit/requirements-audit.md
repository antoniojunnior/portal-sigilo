# Requirements Audit

> Identificador da feature: `002-unificar-plano-assinatura`
> Data: `2026-07-21`
> Documento auditado: `_reversa_forward/002-unificar-plano-assinatura/requirements.md`
>
> Este relatório é estritamente leitor. O `requirements.md` NÃO foi alterado.
> Esta auditoria avalia QUALIDADE DE ESCRITA (clareza, completude, consistência, edge cases textuais), não cobertura de testes de implementação.
>
> Nota: esta é a **segunda execução** de `/reversa-quality` para esta feature. A 1ª rodada reprovou 4 itens (Q-010, Q-014, Q-016, Q-018); o documento foi editado manualmente depois. Esta rodada reavalia do zero.

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de itens | 20 |
| Aprovados | 19 |
| Reprovados | 1 |
| Veredito | Aprovado com ressalvas |

## Itens por categoria

### Clareza

- [X] Q-001 | Clareza | Cada frase do requirements tem sujeito, verbo e objeto explícitos
- [X] Q-002 | Clareza | Não há frases iniciadas por "talvez", "provavelmente" ou "se possível" sem qualificação numérica
- [X] Q-003 | Clareza | Termos do glossário do projeto são definidos ou contextualizados na primeira ocorrência

### Completude

- [X] Q-004 | Completude | Todas as seções obrigatórias do template estão preenchidas com conteúdo, não placeholders
- [X] Q-005 | Completude | Cada Requisito Funcional (RF-01 a RF-12) tem critério de aceite verificável
- [X] Q-006 | Completude | Existem cenários Gherkin para casos felizes E casos negativos

### Consistência

- [X] Q-007 | Consistência | Termos chave do domínio aparecem com a mesma grafia em todas as seções
- [X] Q-008 | Consistência | IDs citados (RN-*, RF-*, IDs externos) vêm prefixados pelo arquivo de origem, evitando colisão
- [X] Q-009 | Consistência | Confidência (🟢/🟡/🔴) coerente com a força da fonte citada — inclusive na nova RNF "Idempotência e falha de cobrança" (🟢, confirmada diretamente pelo dono do negócio)

### Cobertura

- [X] Q-010 | Cobertura | Todo Requisito Funcional tem pelo menos um cenário Gherkin, ou uma justificativa explícita de por que não precisa — **corrigido**: §7 agora tem nota explicando que RF-07/RF-09/RF-11 são estruturais/documentais, não comportamentais
- [X] Q-011 | Cobertura | Toda Regra de Negócio nova ou alterada cita a fonte original do `_reversa_sdd/`

### EdgeCases

- [X] Q-012 | EdgeCases | Limites numéricos relevantes têm valor concreto
- [X] Q-013 | EdgeCases | Estados vazios, nulos e iniciais foram considerados
- [X] Q-014 | EdgeCases | Concorrência, retentativa e comportamento de falha foram considerados quando aplicáveis — **corrigido**: nova RNF "Idempotência e falha de cobrança" em §6 cobre explicitamente idempotência da renovação e comportamento em caso de falha

### Jargão

- [X] Q-015 | Jargão | Um humano novo no time entenderia o requirements sem depender de glossário externo
- [X] Q-016 | Jargão | Siglas são expandidas na primeira ocorrência — **corrigido**: "IA (Inteligência Artificial)" expandida em §1, "MoSCoW (Must/Should/Could/Won't)" expandida no título de §8

### SoluçãoImplícita

- [X] Q-017 | SoluçãoImplícita | O requirements descreve o quê, não o como
- [ ] Q-018 | SoluçãoImplícita | Não há nome de caminho de arquivo de código-fonte prescrevendo a solução no corpo do requirements
  > motivo: a RNF "Compatibilidade de billing" (§6) foi corretamente reescrita sem o caminho de arquivo — mas §10 ("Lacunas") ainda tem a frase "confirmar se `functions/src/webhookAsaas.ts` já suporta o evento de cobrança de assinatura anual parcelada..." — a mesma classe de problema (caminho de arquivo de implementação dentro de uma seção que deveria descrever *o quê*, não *onde no código*) sobrevive num segundo lugar do documento que a edição anterior não cobriu. É uma correção parcial, não completa.
  > sugestão: em §10, trocar "confirmar se `functions/src/webhookAsaas.ts` já suporta..." por algo como "confirmar se o mecanismo de webhook de pagamento já em uso já suporta..." — a investigação técnica de qual arquivo exato precisa mudar já está em `investigation.md`/`roadmap.md`, não precisa se repetir aqui.

### Princípios

- [X] Q-019 | Princípios | Cada Regra de Negócio respeita os princípios ativos do projeto — `.reversa/principles.md` não existe, item vacuamente satisfeito
- [X] Q-020 | Princípios | Conflitos com princípios estão registrados explicitamente, não escondidos — não se aplica, mesma razão

## Itens reprovados, detalhe

### Q-018

> motivo: §10 ("Lacunas") ainda cita o caminho `functions/src/webhookAsaas.ts` diretamente — a mesma classe de achado da rodada anterior (Q-018), corrigida em §6 mas não em §10.
> sugestão: reescrever a frase de §10 em termos agnósticos de arquivo, análogo ao que já foi feito em §6.

## Veredito

**Aprovado com ressalvas**

1 item reprovado, não-CRITICAL (SoluçãoImplícita não é gatilho de CRITICAL pela definição do template). Os 3 outros itens reprovados na rodada anterior (Q-010, Q-014, Q-016) estão de fato corrigidos nesta releitura. O item remanescente (Q-018) é uma correção incompleta — o mesmo tipo de problema já identificado e parcialmente resolvido, restando um segundo local no documento. Fácil de fechar com uma edição pontual em §10.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-21 | Auditoria gerada por `/reversa-quality` | reversa |
| 2026-07-21 | Segunda execução, pós-edição manual do `requirements.md`. Q-010/Q-014/Q-016 confirmados corrigidos. Q-018 permanece reprovado — correção anterior cobriu §6 mas não a ocorrência equivalente em §10 | reversa |
