# Data Delta: Relatórios Analíticos por Período, Departamento e Categoria

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Data: 2026-07-22

## Resumo

`reports/{reportId}` ganha 2 campos novos opcionais. Nenhuma migração de dado histórico — campos ausentes em relatórios antigos significam "gerado antes desta feature", tratado como o comportamento atual (consolidado, sem filtros).

## Estrutura atual (sem mudança)

```
reports/{reportId}: {
  id, org_id, periodo: {inicio, fim}, gerado_em, texto_claude,
  aprovado, exportado, tipo: "padrao" | "personalizado" | "esg",
  status: "rascunho" | "aprovado" | "exportado",
  filtros?: Record<string, unknown>,  // já existia, nunca populado
  metricas: {total, resolvidos, pendentes, prazoMedio, topCategorias},
}
```

## Estrutura nova

```
reports/{reportId}: {
  ...campos existentes,
  tipo: "padrao" | "personalizado" | "esg" | "analitico",  // + valor novo
  filtros?: {
    departamentos?: string[],   // subconjunto de orgs.configuracoes.departamentos
    categorias?: string[],      // subconjunto de CATEGORIAS_LEGAIS
  },
  tabela_analitica?: Array<{
    departamento: string,
    categoria_legal: string,
    mes: string,        // "YYYY-MM"
    total: number,
  }>,  // presente só quando tipo === "analitico"
  metricas: {
    ...campos existentes,
    risco_psicossocial?: {
      total: number,
      por_subcategoria: Record<string, number>,  // via triagem_ia.subcategoria, quando presente
    },
  },
}
```

## O que NÃO muda

- `texto_claude` continua existindo e sendo gerado do mesmo jeito pra `tipo !== "analitico"` — nenhuma mudança no fluxo de IA existente
- Fluxo de aprovação/exportação (`status`, `aprovado_em`, `exportado_em`) inalterado
- `metricas.{total,resolvidos,pendentes,prazoMedio,topCategorias}` continuam sendo calculados do mesmo jeito (só a FONTE de `topCategorias` muda, de `c.categoria` pra `getCategoriaLegal(c)`, corrigindo BUG-CAT1)

## Migração

n/a. Relatórios antigos sem `filtros`/`tabela_analitica`/`metricas.risco_psicossocial` continuam renderizando normalmente (campos opcionais, UI trata ausência como "sem filtro"/"sem essa seção detalhada").

## Índices Firestore

Nenhum índice novo necessário (D-02: filtro em memória, não `.where()` novo). `firestore.indexes.json` permanece sem alteração.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-22 | Versão inicial gerada por `/reversa-plan` | reversa |
