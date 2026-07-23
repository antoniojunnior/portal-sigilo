# Onboarding: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`

## Passo a passo pra testar manualmente

1. Faça login como usuário com role `admin` ou `gestao` (não `auditor`) de uma org com pelo menos 1 caso registrado.
2. Acesse `/app/relatorios`.
3. **Esperado (RF-01):** sem clicar em nada, um relatório consolidado do mês corrente aparece (ou um indicador de carregamento — RF-05 — seguido do relatório).
4. Confirme que **não existe** mais o botão "Gerar relatório" no topo (RF-02).
5. Clique em "Configurar período e filtros", altere o período para "Trimestre" ou selecione um departamento.
6. **Esperado (RF-03):** um botão "Aplicar filtros" aparece.
7. Desfaça a alteração (volte o filtro ao valor original). **Esperado:** o botão "Aplicar filtros" some de novo.
8. Altere o filtro de novo e clique em "Aplicar filtros". **Esperado:** um novo relatório é gerado com o novo recorte, e o botão some (novo estado vira o "aplicado").
9. Recarregue a página (F5) dentro de 24h do relatório default gerado no passo 3. **Esperado (RN-01):** o relatório default é reaproveitado (sem nova chamada visível de geração/loading longo) — não deve chamar Claude de novo.
10. Login como `auditor`. Acesse `/app/relatorios`. **Esperado (RF-06):** nenhuma tela quebrada; comportamento equivalente ao 403 que já existia no botão manual.

## Como simular falha (RF-07)

1. Temporariamente invalide `ANTHROPIC_API_KEY` no ambiente local (ou intercepte a chamada de rede pro Claude) antes de acessar `/app/relatorios` sem relatório recente em cache.
2. **Esperado:** a tela mostra o último relatório existente (se houver) com aviso discreto de falha, não uma tela de erro bloqueante. Se não houver nenhum relatório anterior, documentar o comportamento observado — este é o único caso não coberto explicitamente pelo requirements (ausência total de relatório anterior + falha do automático).

## Onde olhar no código

- `src/app/(dashboard)/app/(protected)/relatorios/page.tsx` — toda a mudança de comportamento
- `src/app/api/reports/generate/route.ts` — inalterado, apenas passa a ser chamado também automaticamente
- `functions/src/scheduledReports.ts` — não tocado por esta feature, mas é o precedente de "relatório sem clique" já existente no domínio (ver `investigation.md`)
