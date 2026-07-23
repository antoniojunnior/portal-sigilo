# Requirements Audit

> Identificador da feature: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Documento auditado: `_reversa_forward/005-relatorios-auto-geracao/requirements.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de itens | 23 |
| Aprovados | 22 |
| Reprovados | 1 |
| Veredito | Aprovado com ressalvas |

## Itens por categoria

### Clareza

- [X] Q-001 | Clareza | RN-01 (reaproveitamento de relatório recente) tem sujeito, verbo e critério numérico explícitos, sem ambiguidade sobre quando reaproveitar vs gerar novo
- [X] Q-002 | Clareza | Cada critério de aceite de RF-01 a RF-08 é verificável objetivamente (não usa termos vagos como "rápido" ou "adequado")
- [X] Q-003 | Clareza | RN-06 evita hedging não quantificado ("talvez", "geralmente") — usa condições binárias (transitório vs 403) e o limite numérico de 24h já fixado em RN-01

### Completude

- [X] Q-004 | Completude | Todas as 11 seções do template estão preenchidas com conteúdo real, sem placeholders `<...>` remanescentes
- [X] Q-005 | Completude | Cada Requisito Funcional (RF-01 a RF-08) tem critério de aceite verificável na própria linha da tabela
- [X] Q-006 | Completude | A seção "Esclarecimentos" registra as duas sessões de `/reversa-clarify` realizadas, com Q&R rastreáveis a RN/RF/cenários específicos

### Consistência

- [X] Q-007 | Consistência | Termos-chave ("filtros default", "geração automática", "trigger automático", "fallback silencioso") aparecem com a mesma grafia em todas as seções onde são usados
- [X] Q-008 | Consistência | Identificadores citados dentro do próprio documento (RN-06 cita RF-02/RN-02; RF-08 é citado no MoSCoW e nos cenários Gherkin) existem de fato nas seções correspondentes
- [X] Q-009 | Consistência | Marcação de confidência (🟢/🟡/🔴) é coerente com a força da fonte — RF-05 (🟡, UX inferida) e RF-01/02/03/04/06/07/08 (🟢, comportamento direto do pedido) refletem a origem real de cada um

### Cobertura de cenários

- [X] Q-010 | Cobertura de cenários | Existe cenário Gherkin para o caso feliz principal (acesso inicial gera relatório automaticamente)
- [X] Q-011 | Cobertura de cenários | Existem cenários Gherkin para os dois casos negativos de bloqueio (auditor e plano suspenso/cancelado), cada um em cenário próprio
- [X] Q-012 | Cobertura de cenários | O edge case "zero relatórios anteriores + falha" tem cobertura Gherkin dupla, diferenciando falha transitória (oferece retry) de 403 permanente (não oferece)
- [X] Q-013 | Cobertura de cenários | Existe cenário Gherkin cobrindo a não-duplicação de chamadas em re-render

### Edge cases

- [X] Q-014 | Edge cases | O limite da janela de reaproveitamento é um valor concreto (24h), não um termo vago como "recente"
- [X] Q-015 | Edge cases | Estados vazios/iniciais foram considerados: zero relatórios anteriores (RN-06/RF-08), filtros sem departamento/categoria selecionados (default)
- [X] Q-016 | Edge cases | Falha transitória e falha permanente (403) são diferenciadas com critério verificável (RN-06), evitando um retry inútil sobre um bloqueio que não muda
- [ ] Q-017 | Edge cases | O comportamento para uma segunda falha consecutiva do botão "Tentar novamente" (o usuário clica, falha de novo) é explicitado
  > motivo: RN-06/RF-08 e os cenários Gherkin cobrem a primeira falha e o clique em "Tentar novamente", mas não dizem se o botão permanece visível, se há limite de tentativas, ou se uma segunda falha transitória se comporta igual à primeira. Não é um cenário exótico — é a continuação direta do próprio cenário que a feature introduziu.
  > sugestão: adicionar uma frase a RN-06 ("o botão permanece disponível a cada nova falha transitória, sem limite de tentativas") ou um cenário Gherkin curto "Segunda tentativa também falha".

### Ausência de jargão

- [X] Q-018 | Jargão | Termos técnicos usados ("fallback silencioso", "trigger automático") são explicados inline na primeira ocorrência, dispensando glossário externo
- [X] Q-019 | Jargão | Código de status HTTP (403) é usado sem expansão, mas é apropriado ao público-alvo do documento (equipe técnica que já lida com Route Handlers no resto do projeto)

### Ausência de solução implícita

- [X] Q-020 | SoluçãoImplícita | RN-01 a RN-05 e a maioria dos RFs descrevem comportamento observável (o quê), não mecanismo de implementação
- [X] Q-021 | SoluçãoImplícita | Nenhum nome de hook/API React (`useState`, `useRef`, `useEffect`) aparece no requirements — ficam corretamente reservados ao `roadmap.md`
- [X] Q-022 | SoluçãoImplícita | Nenhum nome de classe/tipo de implementação (ex.: `GenerateError`) vaza do `roadmap.md` para o `requirements.md` — o documento fala só em "erro transitório" e "403"

### Princípios

- [X] Q-023 | Princípios | n/a — projeto não tem `.reversa/principles.md` configurado; nenhuma regra do requirements pôde ser avaliada contra princípios inexistentes, portanto nenhuma violação é possível

## Itens reprovados, detalhe

### Q-017

> motivo: RN-06/RF-08 e os cenários Gherkin cobrem a primeira falha transitória e o clique em "Tentar novamente", mas não dizem o que acontece se essa segunda tentativa também falhar — o botão some, continua, há um limite? A lacuna é direta: é a continuação natural do próprio fluxo que a feature está introduzindo, não um caso exótico.
> sugestão: adicionar uma frase a RN-06 do tipo "o botão permanece disponível a cada nova falha transitória, sem limite de tentativas" (ou definir um limite, se fizer sentido de produto), e opcionalmente um cenário Gherkin curto "Segunda tentativa também falha, botão continua disponível".

## Veredito

**Aprovado com ressalvas**

1 item reprovado, sem nenhum CRITICAL (não há cobertura de cenário ausente no sentido crítico, princípio violado, ou contradição interna — o item reprovado é uma lacuna de continuação de fluxo, não uma ausência estrutural).

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Auditoria gerada por `/reversa-quality` | reversa |
