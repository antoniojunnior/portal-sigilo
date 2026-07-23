# Interface: `POST /api/reports/generate`

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Contrato: HTTP
> Origem: contrato existente, alterado por esta feature (RF-01, RF-02, RF-03, RF-04, D-02, D-03)

## Antes

```
POST /api/reports/generate
Body: { periodoInicio: string, periodoFim: string, tipo?: "padrao"|"personalizado", filtros?: Record<string,unknown> }

1. Auth: sessão válida, role !== "auditor", plano não suspenso/cancelado
2. Busca cases por org_id + created_at no período
3. Agrega categorias (via c.categoria, BUG-CAT1), leis, resolvidos, pendentes, prazoMedio
4. Chama Claude pra gerar texto executivo
5. Salva reports/{id} com status "rascunho"
```

## Depois

```
POST /api/reports/generate
Body: {
  periodoInicio: string, periodoFim: string,
  tipo?: "padrao" | "personalizado" | "esg" | "analitico",  // + "analitico" novo
  filtros?: { departamentos?: string[], categorias?: string[] }  // agora populado de verdade
}

1. Auth: inalterado (role !== "auditor", plano ativo)
2. Busca cases por org_id + created_at no período (query inalterada)
3. Filtra em memória por filtros.departamentos/filtros.categorias, se presentes (D-02)
4. Agrega categorias via getCategoriaLegal(case) (corrige BUG-CAT1), leis, resolvidos, pendentes, prazoMedio
5. Agrega metricas.risco_psicossocial (contagem + por_subcategoria) — sempre calculado, mesmo zero (D-06)
6. Se tipo === "analitico": PULA a chamada Claude, monta tabela_analitica (departamento×categoria_legal×mes), salva sem texto_claude
7. Senão (padrao/personalizado/esg): chama Claude como antes, salva texto_claude
8. Salva reports/{id} com status "rascunho", incluindo filtros e (se analitico) tabela_analitica
```

- `filtros.departamentos`/`filtros.categorias` vazios ou ausentes = sem filtro (comportamento atual preservado)
- `tipo: "analitico"` é aditivo — os 3 valores existentes continuam funcionando exatamente como antes

## Idempotência e erros

- Sem mudança: cada chamada cria um novo `reports/{id}` (não idempotente por design, já era assim)
- Sem mudança nos códigos de erro (401/403/400/500 existentes)
- Novo: se `filtros.departamentos` referenciar um departamento fora de `orgs.configuracoes.departamentos`, é ignorado silenciosamente no filtro em memória (não gera erro — evita quebrar se a lista de departamentos mudar entre a geração do relatório e a config atual)

## Consumidores conhecidos

- `relatorios/page.tsx` (formulário novo, D-05) — único consumidor conhecido
