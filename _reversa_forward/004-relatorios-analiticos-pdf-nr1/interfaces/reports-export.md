# Interface: `GET /api/reports/[reportId]/export`

> Identificador: `004-relatorios-analiticos-pdf-nr1`
> Contrato: HTTP
> Origem: contrato existente, alterado por esta feature (RF-05, RF-06, D-04, D-06)

## Antes

```
GET /api/reports/{reportId}/export

1. Auth: sessão válida, role !== "auditor", report pertence à org, status === "aprovado"
2. Monta PDF: cabeçalho de marca, nome da org, período, métricas (total/resolvidos/pendentes/prazoMedio),
   texto executivo (Claude) paginado, rodapé de confidencialidade
3. Marca status "exportado", loga auditoria
4. Retorna application/pdf
```

## Depois

```
GET /api/reports/{reportId}/export

1. Auth: inalterado
2. Monta PDF: cabeçalho, nome da org, período — inalterado
3. Métricas: inalterado (total/resolvidos/pendentes/prazoMedio)
4. NOVO bloco: se reports.tabela_analitica existe, desenha tabela agregada
   (departamento | categoria | mês | total) em vez do texto executivo
5. Se NÃO for analítico: texto executivo (Claude) paginado — inalterado
6. NOVO bloco, SEMPRE presente: seção "RISCOS PSICOSSOCIAIS (NR-1)" —
   contagem total + distribuição por subcategoria (metricas.risco_psicossocial);
   se zero, mostra "Nenhum caso classificado como risco psicossocial neste período"
   (D-06 — não omite silenciosamente)
7. Rodapé de confidencialidade — inalterado
8. Marca status "exportado", loga auditoria — inalterado
9. Retorna application/pdf — inalterado
```

## Idempotência e erros

- Sem mudança: idempotente na leitura (mesmo `reportId` sempre gera o mesmo PDF a partir do mesmo documento salvo), efeito colateral de marcar "exportado" já existia
- Sem mudança nos códigos de erro (401/403/404/409 existentes)

## Consumidores conhecidos

- `[reportId]/page.tsx` (botão "Aprovar e exportar PDF" / "Exportar PDF") — único consumidor conhecido, sem mudança na chamada (só no conteúdo do PDF retornado)
