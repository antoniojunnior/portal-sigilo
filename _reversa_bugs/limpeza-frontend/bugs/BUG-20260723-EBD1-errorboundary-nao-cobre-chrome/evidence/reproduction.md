# Cápsula de reprodução — BUG-20260723-EBD1

- Commit base: d7ae0c0
- Ambiente: leitura estática de código (sem infra de teste de componente React)
- Comando: leitura de DashboardLayout.tsx e src/app/(dashboard)/layout.tsx, grep de ErrorBoundary em src/app/
- Resultado: confirmado — Sidebar/SuspensoBanner/BottomNav renderizados fora de qualquer ErrorBoundary
- Classificação: determinístico
- Achado adjacente durante o fix: ErrorBoundary.tsx usava `if (this.props.fallback)` (checagem de truthiness), o que faria `fallback={null}` cair no card de erro padrão em vez de renderizar nada — corrigido para `!== undefined` como parte do mesmo change set (necessário pro fix funcionar como pretendido)
