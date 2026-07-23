# Requirements: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Hoje `/app/relatorios` exige que o gestor de compliance clique em "Gerar relatório" para ver qualquer conteúdo, mesmo no primeiro acesso — a tela some sem essa ação. Esta feature muda o modelo de interação: ao acessar a rota, o relatório é gerado automaticamente com os filtros default (período = mês corrente, sem departamento/categoria, tipo consolidado), sem exigir clique. O botão "Gerar relatório" atual é removido do fluxo inicial. Um botão de aplicação (ex.: "Aplicar filtros") passa a existir, mas só aparece quando o usuário altera a configuração de filtros em relação ao que está exibido — evitando geração involuntária a cada re-render.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/code-analysis.md#10. reports` | Módulo `reports` marcado como complexidade alta; `POST /api/reports/generate` agrega métricas + Claude + máquina de estados de aprovação | 🟢 |
| `_reversa_sdd/addenda/004-relatorios-analiticos-pdf-nr1.md` | Adendo vigente: `/app/relatorios` "troca botão único por formulário completo" — decisão D-05 manteve o paradigma manual (formulário + botão), nunca pediu geração automática | 🟢 |
| `src/app/(dashboard)/app/(protected)/relatorios/page.tsx:64-139` | Estado atual: `handleGenerate` (linhas 109-139) só é chamado pelo `onClick` do botão (linha 161); `useSWR` (linha 84-88) só faz `GET` no mount, que lista relatórios já existentes, nunca gera um novo | 🟢 |
| `src/app/api/reports/generate/route.ts` (GET 265-295, POST 79-262) | `GET` lista relatórios da org; `POST` é quem efetivamente gera (agrega Firestore, chama Claude ou monta tabela analítica, grava doc `rascunho`) | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor de compliance (admin) | Ver o relatório do mês corrente assim que abre a tela, sem etapa extra | Acessa `/app/relatorios` e já vê o relatório consolidado do mês corrente sendo gerado/exibido |
| Gestor de compliance (admin) | Trocar o recorte (período/departamento/categoria/tipo) e revisar antes de confirmar | Altera um filtro, vê aparecer um botão de aplicar, clica, e só então um novo relatório é gerado com o novo recorte |
| Auditor (role bloqueada) ou org com plano suspenso/cancelado | — | Continua sem poder gerar relatório (403), inclusive na geração automática do mount |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Ao montar a rota `/app/relatorios`, se o usuário tiver permissão (não-auditor), o sistema verifica se já existe relatório com os filtros default (período = mês corrente, sem departamento/categoria, `tipo: "padrao"`) gerado nas últimas 24h. Se existir, reaproveita-o (exibe via `GET`, sem novo `POST`). Se não existir, dispara automaticamente a geração (`POST /api/reports/generate`), equivalente ao que hoje só o clique manual aciona. 🟢 — Nova.
   - Origem no legado: `_reversa_sdd/addenda/004-relatorios-analiticos-pdf-nr1.md` (decisão D-05 previa só o modelo manual; esta RN a substitui para o carregamento inicial)
2. **RN-02:** O botão "Gerar relatório" (linha 159-176 do `page.tsx` atual) deixa de existir no fluxo inicial. 🟢 — Removida.
3. **RN-03:** Um botão com o texto **"Aplicar filtros"** só é exibido quando o estado atual dos filtros (período, departamento(s), categoria(s), tipo) diverge da configuração do último relatório gerado/exibido na tela. Alterar um filtro e depois desfazer a alteração (voltar ao valor já aplicado) deve esconder o botão de novo. 🟢 — Nova.
4. **RN-04:** Geração automática do mount não deve disparar para o role `auditor` nem para org com plano `suspenso`/`cancelado` — as restrições de acesso já existentes (`reports/generate/route.ts`, bloqueio 403 para `auditor`; `_reversa_sdd/domain.md#Planos são gates de feature aplicados no servidor, nunca só no client`, bloqueio de geração de relatório para plano `suspenso`/`cancelado`) permanecem intactas e valem também para o trigger automático. 🟢 — Alterada (extensão de RN existente para cobrir o novo gatilho automático).
5. **RN-05:** Se a geração automática do mount falhar (erro do Claude, timeout, etc.), a tela exibe fallback silencioso: mostra o último relatório existente (via `GET`) com um aviso discreto de que a atualização falhou, em vez de tela de erro bloqueante. 🟢 — Nova.
6. **RN-06:** Quando não existe nenhum relatório anterior (org nova, ou primeira visita) e a geração automática do mount falha por erro **transitório** (Claude indisponível, timeout — não 403), a tela exibe um botão **"Tentar novamente"** que reexecuta a mesma geração automática com os filtros default. Se a falha for 403 (auditor ou plano suspenso/cancelado, RN-04), o botão **não** aparece — retentar não mudaria o resultado. Esse botão só aparece nessa combinação específica (zero relatórios anteriores + falha transitória); não substitui nem reaparece no fluxo normal (RF-02/RN-02 continuam valendo quando há relatório ou a geração ainda não falhou). O botão permanece disponível a cada nova falha transitória subsequente, sem limite de tentativas — uma 2ª, 3ª ou N-ésima falha transitória repete o mesmo comportamento da 1ª, sem degradar para outro estado. 🟢 — Nova.
   - Origem: achado do `/reversa-audit` (finding A001, HIGH) — RF-02/RN-02 removem o único botão manual existente sem prever um mecanismo de nova tentativa para esse caso extremo

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Ao acessar `/app/relatorios`, o sistema reaproveita relatório existente com filtros default gerado nas últimas 24h (via `GET`), ou chama `POST /api/reports/generate` automaticamente se não houver um recente, sem interação do usuário | Must | Ao abrir a rota, se há relatório default das últimas 24h ele é exibido sem novo POST; caso contrário um novo é gerado automaticamente, sem qualquer clique do usuário | 🟢 |
| RF-02 | Remover o botão "Gerar relatório" do topo da página (linha 159-176 atual) | Must | Botão não existe mais na renderização inicial da tela | 🟢 |
| RF-03 | Introduzir estado "filtros aplicados" vs "filtros em edição"; exibir botão **"Aplicar filtros"** somente quando divergirem | Must | Alterar qualquer filtro faz o botão "Aplicar filtros" aparecer; reverter ao valor aplicado faz o botão sumir; clicar aplica e gera novo relatório com o novo recorte | 🟢 |
| RF-04 | Geração automática do mount não deve duplicar chamadas em re-renders (deve rodar uma única vez por sessão de acesso à rota, não a cada render) | Must | Nenhuma chamada duplicada a `POST /api/reports/generate` é disparada por re-render do componente | 🟢 |
| RF-05 | Estado de carregamento (loading) visível enquanto a geração automática do mount está em andamento | Should | Skeleton ou spinner exibido entre o mount e a resposta do `POST` inicial | 🟡 |
| RF-06 | Auditor e org com plano `suspenso`/`cancelado` continuam recebendo 403 mesmo no trigger automático, sem quebrar a renderização da página | Must | Página não trava/loop nem exibe erro genérico ao role `auditor` ou a org suspensa/cancelada; comportamento equivalente ao 403 manual já existente, caindo no mesmo fallback silencioso do RF-07 | 🟢 |
| RF-07 | Se a geração automática do mount falhar, exibir o último relatório existente (via `GET`) com aviso discreto de falha, em vez de tela de erro bloqueante | Must | Falha simulada no POST automático resulta em relatório anterior visível + aviso, sem tela de erro travando a navegação | 🟢 |
| RF-08 | Quando não há nenhum relatório anterior E a geração automática falha por erro transitório (não 403), exibir botão "Tentar novamente" que reexecuta a geração automática com os filtros default; em caso de 403, não exibir o botão; o botão permanece disponível sem limite de tentativas a cada nova falha transitória | Must | Org sem relatórios + falha transitória simulada no POST automático resulta em mensagem de erro + botão "Tentar novamente" visível, que reexecuta a mesma geração; org sem relatórios + 403 (auditor/plano suspenso) resulta em mensagem de bloqueio sem o botão; clicar "Tentar novamente" e falhar de novo (transitório) mantém o mesmo botão disponível, sem limite | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Geração automática no mount não deve bloquear a renderização da lista de relatórios já existentes (`GET` via `useSWR`) — as duas chamadas podem coexistir | `useSWR` já roda paralelo hoje (linha 84-88); manter esse padrão | 🟡 |
| Segurança | Filtro de role (`auditor` bloqueado), de plano (`suspenso`/`cancelado` bloqueado) e escopo por `org_id` continuam válidos para o trigger automático, sem novo vetor de acesso | Regra invariável do projeto (AGENTS.md, regra 3 e 4); `_reversa_sdd/domain.md#Planos são gates de feature aplicados no servidor, nunca só no client` (bloqueio de plano) | 🟢 |
| Observabilidade | `logAudit` (`acao: "report_generated"`) continua registrando também as gerações disparadas automaticamente, não só as manuais | Padrão já existente em `reports/generate/route.ts`; não há motivo para excluir o trigger automático da auditoria | 🟡 |
| UX | Nenhum "flash" de tela vazia com CTA "Gerar relatório" antes da geração automática completar — o estado vazio (nenhum relatório ainda) deve virar estado de carregamento, não uma chamada à ação manual | Elimina a etapa extra que motivou esta feature | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Acesso inicial gera relatório automaticamente
  Dado que o gestor de compliance acessa /app/relatorios pela primeira vez na sessão
  Quando a página termina de montar
  Então um relatório consolidado do mês corrente é gerado e exibido, sem clique em nenhum botão

Cenário: Alterar filtro exibe botão de aplicar
  Dado que um relatório já foi gerado e exibido com os filtros default
  Quando o usuário altera o período, departamento, categoria ou tipo
  Então um botão de aplicar filtros aparece
  E ao clicar nele, um novo relatório é gerado com o novo recorte

Cenário: Reverter filtro ao valor aplicado esconde o botão
  Dado que o usuário alterou um filtro e o botão de aplicar apareceu
  Quando o usuário desfaz a alteração, voltando ao valor do último relatório aplicado
  Então o botão de aplicar filtros desaparece novamente

Cenário: Auditor não pode gerar relatório (comportamento preservado no trigger automático)
  Dado que o usuário logado tem role "auditor"
  Quando ele acessa /app/relatorios
  Então a geração automática retorna 403, igual ao comportamento atual do clique manual, sem travar a tela

Cenário: Re-render não duplica a geração automática
  Dado que a geração automática do mount já foi disparada uma vez para a sessão de acesso à rota
  Quando o componente da página re-renderiza (ex.: mudança de estado não relacionada a filtros)
  Então nenhuma nova chamada a POST /api/reports/generate é disparada

Cenário: Estado de carregamento durante a geração automática
  Dado que o usuário acabou de acessar /app/relatorios
  Quando a geração automática ainda não retornou resposta
  Então a tela exibe um indicador de carregamento no lugar do relatório, sem exibir o estado "nenhum relatório ainda"

Cenário: Org com plano suspenso/cancelado não gera relatório automático (comportamento preservado)
  Dado que a org do usuário logado está com plano "suspenso" ou "cancelado"
  Quando ele acessa /app/relatorios
  Então a geração automática retorna 403, igual ao comportamento atual do clique manual, sem travar a tela

Cenário: Reaproveitar relatório recente em vez de gerar de novo
  Dado que já existe um relatório com os filtros default gerado há menos de 24h
  Quando o usuário acessa /app/relatorios
  Então esse relatório é exibido via GET, sem disparar um novo POST /api/reports/generate

Cenário: Falha na geração automática cai em fallback silencioso
  Dado que já existe um relatório anterior exibível
  Quando a geração automática do mount falha (erro do Claude ou timeout)
  Então a tela exibe o relatório anterior com um aviso discreto de falha, sem tela de erro bloqueante

Cenário: Falha transitória na geração automática sem relatório anterior oferece "Tentar novamente"
  Dado que a org não tem nenhum relatório gerado ainda
  Quando a geração automática do mount falha por erro transitório (Claude indisponível, timeout)
  Então a tela exibe uma mensagem de erro com um botão "Tentar novamente"
  E ao clicar nele, a mesma geração automática com os filtros default é reexecutada

Cenário: 403 permanente sem relatório anterior não oferece "Tentar novamente"
  Dado que a org não tem nenhum relatório gerado ainda
  Quando a geração automática do mount falha por 403 (role "auditor" ou plano suspenso/cancelado)
  Então a tela exibe a mensagem de bloqueio, sem o botão "Tentar novamente" (retentar não mudaria o resultado)

Cenário: Segunda tentativa também falha, botão continua disponível
  Dado que o usuário clicou em "Tentar novamente" após a 1ª falha transitória
  Quando essa 2ª tentativa também falha por erro transitório
  Então a tela continua exibindo a mensagem de erro com o botão "Tentar novamente" disponível, sem limite de tentativas
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|----------------|
| RF-01 | Must | É o pedido central da feature — elimina o clique obrigatório no acesso inicial |
| RF-02 | Must | Consequência direta de RF-01: manter o botão antigo ao lado do fluxo automático confundiria o usuário |
| RF-03 | Must | Sem isso, qualquer alteração de filtro exigiria nova visita à rota ou geraria relatórios sem confirmação |
| RF-04 | Must | Evita custo de API (Claude) e ruído de auditoria por chamadas duplicadas em re-render |
| RF-05 | Should | Sem loading, a transição do mount para o relatório pronto pode parecer tela quebrada |
| RF-06 | Must | Regra de segurança existente não pode ser enfraquecida pela mudança de gatilho |
| RF-07 | Must | Evita que falha transitória de IA deixe o gestor sem nenhum relatório visível |
| RF-08 | Must | Sem isso, uma org nova cuja primeira geração falhe fica permanentemente sem forma de tentar de novo, já que RF-02 removeu o único botão manual |

## 9. Esclarecimentos

### Sessão 2026-07-23

- **Q:** Se já existir relatório recente com os mesmos filtros default, o acesso à rota deve reaproveitar ou sempre gerar novo?
  **R:** Reaproveitar se existir relatório gerado nas últimas 24h com os mesmos filtros default; senão gerar novo. (RN-01, RF-01, cenário Gherkin "Reaproveitar relatório recente")
- **Q:** Qual o texto do botão que aparece quando o usuário altera os filtros?
  **R:** "Aplicar filtros". (RN-03, RF-03)
- **Q:** Se a geração automática do mount falhar, o que a tela deve mostrar?
  **R:** Fallback silencioso: mostra o último relatório existente (via GET) e um aviso discreto de que a atualização falhou. (RN-05, RF-07, cenário Gherkin "Falha na geração automática")

### Sessão 2026-07-23 (b) — pós-`/reversa-audit`, finding A001 HIGH

- **Q:** Quando não existe nenhum relatório anterior e a geração automática falha, o que a tela deve mostrar?
  **R:** Botão "Tentar novamente" que reexecuta a mesma geração automática com os filtros default — restrito a falha transitória (Claude/timeout); em caso de 403 (auditor/plano suspenso), o botão não aparece, pois retentar não mudaria o resultado. (RN-06, RF-08, cenários Gherkin "Falha transitória... oferece 'Tentar novamente'" e "403 permanente... não oferece 'Tentar novamente'")

### Sessão 2026-07-23 (c) — pós-`/reversa-quality`, item Q-017 reprovado

- **Q:** Se o usuário clica "Tentar novamente" e a geração falha de novo (transitória), o que acontece?
  **R:** Botão permanece disponível, sem limite de tentativas — usuário pode clicar quantas vezes quiser. (RN-06, RF-08, cenário Gherkin "Segunda tentativa também falha, botão continua disponível")

## 10. Lacunas

Nenhuma lacuna pendente. Todas as dúvidas foram resolvidas nas três sessões de esclarecimentos de 2026-07-23.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-07-23 | Sessão de esclarecimentos: 3 dúvidas resolvidas (reaproveitamento 24h, label do botão, fallback de erro) — RN-01/RF-01 e RF-03 reescritos, RN-05/RF-07 adicionados | reversa |
| 2026-07-23 | Correção pós-`/reversa-audit` (finding A002, HIGH): RN-04/RF-06 estendidos para cobrir também plano `suspenso`/`cancelado` (regra 🟢 já existente em `_reversa_sdd/domain.md`), não só `auditor`; cenário Gherkin dedicado adicionado | reversa |
| 2026-07-23 | Sessão de esclarecimentos (b), pós-`/reversa-audit`: finding A001 (HIGH) resolvido — RN-06/RF-08 adicionados (botão "Tentar novamente" só para zero-relatórios + falha transitória, nunca para 403); 2 cenários Gherkin novos; findings A002/A003 (LOW, âncora e NFR desatualizado) corrigidos junto | reversa |
| 2026-07-23 | Sessão de esclarecimentos (c), pós-`/reversa-quality` (item Q-017 reprovado): RN-06/RF-08 explicitam que o botão "Tentar novamente" não tem limite de tentativas; cenário Gherkin "Segunda tentativa também falha" adicionado | reversa |
