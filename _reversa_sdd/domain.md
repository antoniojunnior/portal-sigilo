# Domínio de Negócio — portal-sigilo

> Gerado pelo Detective em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
> Fontes: `git log` (52 commits), `firestore.rules`, `docs/SECURITY.md`, `docs/PRD_PortalSigilo_v2.md`, código-fonte (`_reversa_sdd/code-analysis.md`).

## Glossário

| Termo | Significado |
|---|---|
| **Org (tenant)** | Empresa cliente do SaaS. Toda entidade de negócio pertence a uma org (`org_id`) |
| **Gestor** | Usuário interno da empresa cliente com acesso ao dashboard (role `admin`, `gestor` ou `auditor`) |
| **Denunciante** | Pessoa que registra um relato. **Nunca tem conta** — anônimo por design (S2), acessa só via protocolo |
| **Caso (case)** | Um relato/denúncia registrado, identificado por `protocolo` |
| **Protocolo** | Identificador público do caso, formato `ETK-YYYY-XXXXXX`, único por org, sem vínculo com identidade do denunciante |
| **Triagem** | Classificação automática (IA) ou manual do caso: categoria legal, urgência, leis aplicáveis, área de risco |
| **Mencionado** | Gestor citado como parte envolvida em um caso — bloqueado de acessá-lo (S5), mesmo sendo admin |
| **Unidade (unit)** | Subdivisão da org (multi-site), feature Enterprise. Gestor com `unit_id` só vê casos da própria unidade |
| **Plano** | Nível de assinatura: `entrada`, `gestao`, `enterprise` (+ estados `suspenso`/`cancelado` fora do enum declarado) |
| **Relatório** | Documento executivo gerado por IA a partir de dados agregados de um período, com ciclo de aprovação |
| **Insight** | Texto curto gerado por IA (diário, ou sob demanda) resumindo padrões nos casos recentes da org |

## Regras de negócio centrais (por que o sistema existe assim)

### Anonimato do denunciante é a regra fundadora (S2)
🟢 Confirmado em `docs/SECURITY.md` e reforçado em código: `cases`/`messages` nunca guardam identidade do denunciante; `GET /api/cases/track` deliberadamente não revela se um protocolo existe quando não encontrado (evita enumeração); `runTriagem`/relatórios nunca expõem texto individual de relato para além do necessário. O tipo `WhatsappSession.conversation_id` já é modelado como SHA-256 do número — a regra foi pensada **antes** do canal WhatsApp existir (Fase 7 ainda pendente), indicando que o anonimato é tratado como requisito de arquitetura, não como feature adicionada depois.

### Isolamento multi-tenant é aplicado em duas camadas redundantes (S3)
🟢 Toda query em Route Handlers filtra por `org_id` (defesa 1), e Firestore Rules bloqueiam acesso cruzado (defesa 2) — mesmo sabendo que o Admin SDK (usado nos Route Handlers) **ignora** as Rules. Isso é evidência de que a equipe tratou "Admin SDK bypassa Rules" como risco conhecido e mitigou explicitamente checando `org_id` manualmente em cada rota (ex.: `PLAN_USER_LIMITS` em `dashboard/users` tem comentário explícito: *"Admin SDK bypasses Firestore Rules, so we check here"*).

### Bloqueio de mencionados (S5) é tratado como regra de conflito de interesse, não de permissão comum
🟢 Aplicado de forma redundante: Firestore Rules (`isMencionado`) **e** filtro manual em toda rota de dashboard que lista/detalha casos. O código nunca conta apenas com uma camada — cada handler relevante (`dashboard/cases`, `dashboard/cases/[caseId]`, `dashboard/cases/[caseId]/messages`, `dashboard/heatmap`, `dashboard/metrics`, `dashboard/insights`, `assistant`) reimplementa a checagem. 🟡 Isso é um padrão repetido sem abstração central (helper `checkCaseAccess` existe só em `dashboard/cases/[caseId]/messages`) — indica risco de uma nova rota esquecer a checagem.

### Planos são gates de feature aplicados no servidor, nunca só no client
🟢 Plano `entrada`: sem assistente IA, sem triagem por IA (`runTriagem` retorna cedo), sem relatório personalizado, limite de 1 usuário, 2GB de storage. Plano `suspenso`/`cancelado`: bloqueia assistente e geração de relatório. Todos os gates são checados no Route Handler (nunca delegados à Firestore Rule, que não tem acesso fácil a lógica de negócio complexa como essa).

### Auditoria (audit_logs) é tratada como trilha legal imutável, não como log de debug
🟢 Regra S6: Firestore Rules bloqueiam update/delete incondicionalmente. `logAudit` nunca lança exceção para o chamador (falha de auditoria não pode derrubar a operação de negócio) — decisão deliberada de priorizar disponibilidade da operação principal sobre garantia de auditoria em 100% dos casos, com o trade-off registrado via `console.error`.

### Retenção de dados tem regras diferentes por tipo de entidade
🟢 `cases`: TTL do Firestore em `created_at + 5 anos` (exclusão automática). `audit_logs`: **sem** TTL — comentário no código (`types/index.ts:147-149`) explica que TTL do Firestore bypassaria as Rules de imutabilidade, então a retenção de 20 anos (conforme NR-1, citado em `docs/PRD_PortalSigilo_v2.md`) depende de um job externo de export ainda **não encontrado no código** (🔴 LACUNA).

### Divergência entre `docs/SECURITY.md` (S7/S8) e implementação real
🔴 **LACUNA confirmada** — `docs/SECURITY.md` especifica limites que o código não implementa:
- S7 documenta "200 MB por caso, 10 arquivos por relato" — o código (`upload-attachment/route.ts`) só valida 50MB por arquivo e limite de storage por plano; não há contagem de arquivos por caso nem limite agregado de 200MB por caso.
- S8 documenta "criptografia a nível de campo" para dados sensíveis (saúde, orientação sexual, etnia) antes de gravar no Firestore — **nenhuma rotina de criptografia de campo foi encontrada** no código-fonte lido. Dados sensíveis do relato parecem ser gravados em texto puro em `messages.texto` / `cases.triagem_ia`.
- S8 documenta notificação à ANPD em caso de incidente — não há rotina de detecção/alerta automatizado no código.

Essas três lacunas são as mais relevantes encontradas pelo Detective e requerem validação humana antes de qualquer alegação de conformidade LGPD ser feita a clientes.

## Linha do tempo de negócio (arqueologia Git)

🟢 Extraída de `git log --oneline` (52 commits, sequência cronológica reversa abaixo):

| Marco | Commits representativos | Interpretação |
|---|---|---|
| Fundação | `58a0274` (create-next-app) → `fbe3e9e` → `ba90b9a` (Fase 1: env, Firebase, tipos, Rules) → `8514908` (security: enforce server-only boundaries) | Segurança (S1: chave Anthropic server-only) foi tratada **desde a fundação**, não como retrofit |
| Fase 2 — Portal sem IA | `f5b6c30`, `19231cf` (rebranding + design system), `9bb7622`/`c399275` (redesign visual seguindo mockups) | Iteração visual pesada logo após o MVP funcional — indica que o design system não veio pronto do início |
| Fase 3/4 — Chatbot + Triagem | `7d033a0` ("fases 3 e 4: concluidas", commit único agregando as duas fases) | Chatbot e triagem por IA foram tratados como uma unidade de entrega, não fases separadas na prática |
| Fase 5 — Dashboard | `8016cb0` → `2edb522`/`72841b4` (fixes de seed/auth) → `b343b60`/`24f647f` (fix login) → `41a6a41` (redesign completo) | Vários fixes de autenticação logo após o dashboard inicial sugerem que a integração Auth+Firestore Rules exigiu iteração — coerente com a complexidade de `verifySession` |
| Estabilização dashboard | `2fe7399`→`0eadfb7` (série de 9 fixes: overflow mobile, badges, dropdown, hooks, iOS zoom, hydration) | Fase de polimento intensivo pós-Fase 5, típico de primeiro contato com uso real/QA |
| Fase 6 — Assistente IA + Relatórios | `f4a0dd5` (commit único: "Assistente IA para gestores e geração de relatórios") | Assistente e relatórios entregues juntos — reforça que ambos compartilham a mesma integração Claude e foram desenhados como uma feature de IA coesa |
| Fase 9 — Checkout/Billing | `985fece` (Epic 9: checkout Asaas + webhook) → `45140fb` (limites de plano + banner suspensão) → `fcd7237`/`285460b`/`3d6db72` (planos v2, design tokens) → `eb02067` (script sandbox) → `1bf7639`→`94e2367` (stories 9.7-9.11: ciclo completo de gerenciamento de assinatura, terminando em QA gate) | Fase 9 é a mais recente e mais processual: cada story tem commit próprio e a última (`94e2367`) é explicitamente um QA gate de revisão — indica adoção do processo AIOX/story-driven só a partir desta fase |

🟡 **Inferência:** o salto de granularidade (fases 1-6 com poucos commits "grandes" vs. Fase 9 com 11+ commits story-by-story) sugere que o processo de desenvolvimento formal (SDC — Story Development Cycle do AIOX) só foi adotado a partir do Epic 9. Fases anteriores foram desenvolvidas de forma mais monolítica/exploratória.

## TODOs / dívidas técnicas conhecidas explicitamente no código

🟢 Único TODO textual encontrado no código de produto:
- `src/app/(dashboard)/app/(protected)/configuracoes/page.tsx:247` — `// TODO Fase 9: implementar endpoint de desativação do canal` — feature de desativar o canal de denúncias da org ainda não tem endpoint correspondente em `src/app/api/`.

## Ver também

- `_reversa_sdd/state-machines.md` — máquinas de estado de `Case` e `Report`
- `_reversa_sdd/permissions.md` — matriz RBAC completa
- `_reversa_sdd/adrs/` — decisões arquiteturais retroativas
