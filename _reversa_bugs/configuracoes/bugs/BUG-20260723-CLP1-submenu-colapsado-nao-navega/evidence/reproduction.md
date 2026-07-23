# Cápsula de reprodução — BUG-20260723-CLP1

- Commit base: 79425a8
- Ambiente: leitura estática de código (sem infra de teste de componente React)
- Comando: leitura de Sidebar.tsx:118-146 (antes do fix)
- Resultado: confirmado — item com children sempre renderiza <button onClick={toggleExpanded}>, nunca <Link>; children só renderizam sob `{!collapsed && isExpanded}` — clique colapsado não tinha efeito observável
- Classificação: determinístico
