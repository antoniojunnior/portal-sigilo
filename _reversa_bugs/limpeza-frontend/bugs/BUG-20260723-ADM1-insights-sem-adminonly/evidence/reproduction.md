# Cápsula de reprodução — BUG-20260723-ADM1

- Commit base: d7ae0c0
- Ambiente: leitura estática de código
- Comando: grep de adminOnly em Sidebar.tsx NAV_ITEMS, grep de role em route.ts
- Resultado: confirmado — item Insights sem adminOnly, GET /api/dashboard/insights sem checagem de role
- Classificação: determinístico
