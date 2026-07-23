# Cápsula de reprodução — BUG-20260723-DTN1

- Commit base: d7ae0c0
- Comando: npx eslint "src/app/(dashboard)/app/(protected)/insights/page.tsx"
- Resultado: "Cannot call impure function during render... Date.now" (react-hooks/purity)
- Classificação: determinístico
