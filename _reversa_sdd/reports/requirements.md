# Reports

> Fonte: `_reversa_sdd/code-analysis.md` §10 (complexidade alta), `_reversa_sdd/state-machines.md` §2.

## Visão Geral
Relatório executivo gerado por Claude a partir de dados agregados de casos (nunca conteúdo individual), com máquina de estados de aprovação e exportação em PDF. 🟢

## Responsabilidades
- Agregar métricas do período e gerar texto executivo via IA 🟢
- Gerenciar ciclo de vida do relatório (rascunho → aprovado → exportado) 🟢
- Exportar PDF formatado com branding e métricas 🟢
- Listar e detalhar relatórios da org 🟢

## Regras de Negócio
- Role `auditor` não pode gerar, aprovar nem exportar relatórios 🟢
- Plano `suspenso`/`cancelado` bloqueia geração 🟢
- Relatório `personalizado` exige plano ≥ gestão 🟢
- Aprovação: qualquer não-auditor aprova; só `admin` reverte para rascunho; aprovar já aprovado/exportado retorna 409 (idempotência) 🟢
- Exportação só permitida com `status === "aprovado"`; após exportar, `status → "exportado"` (transição terminal) 🟢
- Prompt à IA instrui explicitamente a não incluir conteúdo individual de relato nem inventar dados 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Agregar métricas do período (categorias, leis, resolvidos/pendentes, prazo médio, top-5) | Must | Métricas batem com contagem manual sobre os mesmos dados |
| RF-02 | Gerar texto executivo em 4 partes via Claude | Must | Resposta contém sumário, tendências, alertas legais, recomendações |
| RF-03 | Bloquear geração para role auditor e plano suspenso/cancelado | Must | 403 nos dois casos |
| RF-04 | Exigir plano ≥ gestão para tipo personalizado | Must | Plano entrada + tipo personalizado retorna 403 |
| RF-05 | Impor máquina de estados rascunho→aprovado→exportado sem pular etapas | Must | Export com status≠aprovado retorna 409 |
| RF-06 | Gerar PDF com header, métricas e texto formatado, paginado automaticamente | Must | PDF válido gerado sem overflow de conteúdo |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Auditabilidade | Cada transição de estado gera audit log dedicado | `src/app/api/reports/**/route.ts` | 🟢 |
| Privacidade | Prompt à IA proíbe explicitamente conteúdo individual de relato | `src/app/api/reports/generate/route.ts:109` | 🟢 |
| Confiabilidade | Máquina de estados com guardas — nenhuma transição pula etapa | `src/app/api/reports/[reportId]/{approve,export}/route.ts` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um relatório em status "rascunho"
Quando GET /api/reports/[reportId]/export é chamado
Então retorna 409, PDF não é gerado

Dado um relatório aprovado
Quando GET /api/reports/[reportId]/export é chamado
Então retorna PDF válido e o status muda para "exportado"

Dado role="auditor"
Quando POST /api/reports/generate é chamado
Então retorna 403 "Auditores não podem gerar relatórios."
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Geração com agregação correta | Must | Base de todo o fluxo |
| Máquina de estados guardada | Must | Sem isso, exportação de rascunho seria possível |
| Export em PDF | Must | Formato de entrega exigido pelo produto |
| Reversão para rascunho | Should | Correção de erro humano, não caminho crítico |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/reports/generate/route.ts` | `POST`, `GET` | 🟢 |
| `src/app/api/reports/[reportId]/route.ts` | `GET` | 🟢 |
| `src/app/api/reports/[reportId]/approve/route.ts` | `POST`, `DELETE` | 🟢 |
| `src/app/api/reports/[reportId]/export/route.ts` | `GET` | 🟢 |
