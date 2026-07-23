# Onboarding: Relatórios Analíticos por Período, Departamento e Categoria

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22
> Para: humano testando a feature pela primeira vez após `/reversa-coding`

## Pré-requisitos

- `.env.local` com `ANTHROPIC_API_KEY` válida
- Org com `plano_ativo: "unico"`, `configuracoes.departamentos` preenchido com ao menos 2 departamentos
- Casos em `cases` cobrindo ao menos 2 departamentos e 2 categorias legais diferentes, incluindo ao menos 1 caso com `categoria_legal: "risco_psicossocial"` (pra testar a seção NR-1 com dado real)
- Sessão de admin dessa org

## Passo a passo

### 0. Confirmar BUG-20260722-CAT1 corrigido primeiro

1. Abrir um caso qualquer em `/app/casos/{caseId}` que já tenha passado por triagem IA
2. Confirmar que o campo "Categoria" aparece (antes da correção, esse campo nunca aparecia — condicional sempre falsa)

### 1. Período customizado (RF-01)

1. Abrir `/app/relatorios`
2. Usar o formulário novo pra escolher um período de 45 dias fora do mês corrente
3. Gerar relatório, conferir que o PDF exportado mostra exatamente esse período no cabeçalho

### 2. Filtro por departamento (RF-02)

1. No formulário, selecionar 1 departamento específico
2. Gerar relatório, conferir que `metricas.total` só conta casos daquele departamento

### 3. Filtro por categoria (RF-03, depende de CAT1 corrigido)

1. Selecionar 1 categoria legal específica (ex.: `risco_psicossocial`)
2. Gerar relatório, conferir que só casos dessa categoria entram na contagem

### 4. Modo analítico vs consolidado (RF-04)

1. Gerar um relatório "Consolidado" (comportamento atual, texto executivo por IA)
2. Gerar um relatório "Analítico" pro mesmo período
3. Conferir que o analítico mostra tabela agregada (departamento×categoria×mês), SEM texto corrido e SEM listar casos individuais

### 5. Seção NR-1 (RF-05)

1. Gerar relatório de um período COM casos de `risco_psicossocial`
2. Conferir que a seção "Riscos Psicossociais (NR-1)" aparece com números reais, na tela E no PDF exportado
3. Gerar relatório de um período SEM esses casos
4. Conferir que a seção ainda aparece, com "nenhum caso no período" (não desaparece)

### 6. Preset trimestral (RF-07)

1. No formulário, usar o preset "Trimestral"
2. Conferir que seleciona automaticamente os últimos 3 meses
3. Conferir o texto de apoio mencionando a NR-1

### 7. Export PDF completo (RF-06)

1. Aprovar e exportar um relatório com todos os filtros aplicados (departamento + categoria + analítico)
2. Abrir o PDF, conferir que TODOS os filtros/seções aparecem refletidos (não só o texto genérico antigo)

## O que NÃO testar aqui (fora do escopo)

- Fluxo de aprovação/reversão (`approve`/`DELETE`) — comportamento inalterado, já coberto antes desta feature
- Bloqueio de `role: "auditor"` — comportamento inalterado

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
