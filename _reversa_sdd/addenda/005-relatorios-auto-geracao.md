# Adendo: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`
> Cenário: **legado** — ancorado em `_reversa_sdd/architecture.md` + `_reversa_sdd/domain.md`

## Vigência

Vigente desde 2026-07-23.

## Resumo da entrega

Feature que elimina a obrigatoriedade do clique manual em "Gerar relatório" ao acessar `/app/relatorios`. Ao montar a rota, o sistema agora verifica se existe relatório com filtros default gerado nas últimas 24h e reaproveita, ou dispara a geração automaticamente. O botão "Gerar relatório" foi removido; um novo botão "Aplicar filtros" aparece condicionalmente apenas quando o usuário altera os filtros em relação ao relatório exibido. Fallback de erro mantém relatórios anteriores visíveis com aviso discreto, ou oferece botão "Tentar novamente" quando não há relatório anterior e o erro é transitório. **13 ações concluídas** (100%).

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `architecture.md` | Páginas React (App Router) / `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | regra-alterada | O gatilho de geração de relatório mudou de exclusivamente manual (botão "Gerar relatório") para automático no mount + botão condicional "Aplicar filtros" quando filtros divergem do snapshot aplicado. Ver `legacy-impact.md` da feature 005 |
| `architecture.md` | Páginas React (App Router) / `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` | componente-extinto | Botão "Gerar relatório" do topo da página removido. Ver `legacy-impact.md` da feature 005 |
| `architecture.md` | `src/lib/*` (utilitários) | componente-novo | `src/lib/reports/report-filters.ts` — funções puras `getDefaultFilters()`, `filtersEqual()`, `isReportWithinHours()` para filtros default, comparação e reaproveitamento. Ver `legacy-impact.md` da feature 005 |
| `domain.md` | Relatório é gerado exclusivamente por clique manual do gestor | regra-alterada | Agora o relatório default é gerado automaticamente no acesso à rota, com reaproveitamento se existir um recente (<24h) com os mesmos filtros. O clique manual foi substituído por "Aplicar filtros" condicional (RN-01, RN-02, RN-03) |
| `domain.md` | Erro de geração exibe banner vermelho bloqueante | regra-alterada | Nova política de fallback: com relatórios anteriores → aviso discreto sem bloqueio; sem relatórios anteriores + erro transitório → botão "Tentar novamente"; sem relatórios + 403 → mensagem sem botão (RN-05, RN-06) |
| `domain.md` | `handleGenerate` lança `new Error(msg)` no catch de `!res.ok` | regra-alterada | Agora lança `new GenerateError(msg, res.status)`, subclasse de `Error` com campo `status: number`, permitindo decisão client-side baseada no código HTTP (D-09) |
| `architecture.md` | `POST /api/reports/generate` — Route Handler | regra-alterada (sem mudança de contrato) | O endpoint passa a ser chamado também pelo trigger automático do mount, além do clique manual de "Aplicar filtros". Nenhuma alteração no Route Handler — o `logAudit`/`report_generated` já registra indistintamente |

## Regras sob vigilância

IDs dos watch items criados nesta entrega (detalhes em `_reversa_forward/005-relatorios-auto-geracao/regression-watch.md`):

- **W001** — Geração automática dispara uma única vez por sessão de rota
- **W002** — Botão "Aplicar filtros" aparece/desaparece corretamente conforme divergência
- **W003** — 403 sem relatórios não oferece botão "Tentar novamente"
- **W004** — Erro transitório sem relatórios oferece botão "Tentar novamente"
- **W005** — Falha automática com relatórios existentes exibe aviso discreto, não erro bloqueante

## Fontes

- `_reversa_forward/005-relatorios-auto-geracao/legacy-impact.md`
- `_reversa_forward/005-relatorios-auto-geracao/regression-watch.md`
- `_reversa_forward/005-relatorios-auto-geracao/requirements.md`
- `_reversa_forward/005-relatorios-auto-geracao/progress.jsonl`
