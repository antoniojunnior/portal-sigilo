# Cápsula de reprodução — BUG-20260723-MOB1

- Commit base: 79425a8
- Ambiente: leitura estática de código (sem infra de teste de componente React no projeto — dívida técnica já registrada em F-TESTES-01 da varredura)
- Comando: leitura de BottomNav.tsx (items hardcoded sem Faturamento), DashboardLayout.tsx:15 (Sidebar hidden lg:flex), DashboardHeader.tsx:130-131 (badge hidden sm:inline-flex)
- Resultado: confirmado — nenhum caminho de UI leva a /app/configuracoes/faturamento abaixo de 640px
- Classificação: determinístico (não depende de timing, é ausência estrutural de elemento)
