# Cápsula de reprodução — BUG-20260723-ACT1

- Commit base: 79425a8
- Ambiente: leitura estática de código (sem infra de teste de componente React)
- Comando: leitura de Sidebar.tsx:52 (antes do fix)
- Resultado: confirmado — `useState<Set<string>>(new Set())` sem inicializador baseado em pathname; acesso direto/reload a uma rota filha não expandia o acordeão
- Classificação: determinístico
