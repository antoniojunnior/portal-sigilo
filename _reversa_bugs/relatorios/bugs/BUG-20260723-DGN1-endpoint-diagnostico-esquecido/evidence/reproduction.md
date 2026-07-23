# Cápsula de reprodução — BUG-20260723-DGN1

- Commit base: 79425a8 (HEAD no início do fix)
- Branch: main
- Ambiente: leitura estática de código (sem necessidade de rodar servidor — o defeito é a existência do arquivo, não um comportamento condicional)
- Comando: `cat src/app/api/reports/diagnostic/route.ts` + `grep -n "role\|plano" src/app/api/reports/diagnostic/route.ts`
- Resultado: arquivo existe, 75 linhas, nenhuma ocorrência de checagem de `role` ou `plano` — confirma ausência total de autorização
- Classificação: determinístico (não depende de timing/concorrência, é presença de código)
- Taxa: 1/1 — toda leitura do arquivo confirma a ausência de gate
