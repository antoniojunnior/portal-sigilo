# Regression Watch: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`

## Watch principal

| ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `page.tsx`, auto-generate effect | Geração automática dispara **uma única vez** por sessão de acesso à rota, sem duplicação em re-renders ou StrictMode | presença | `POST /api/reports/generate` disparado mais de uma vez no mesmo mount (auditável via `logAudit` com timestamps < 1s de diferença para mesma org) |
| W002 | `page.tsx`, estado `filtrosAlterados` | Botão "Aplicar filtros" aparece quando qualquer filtro difere do snapshot `filtrosAplicados` e desaparece quando revertido ao valor aplicado | presença | Botão visível com filtros inalterados OU invisível com filtros alterados |
| W003 | `page.tsx`, catch de `handleGenerate` | `GenerateError` com `status: 403` não oferece botão "Tentar novamente" quando `reports.length === 0` | presença | Botão "Tentar novamente" visível após 403 (auditor/plano suspenso/cancelado) sem relatórios |
| W004 | `page.tsx`, catch de `handleGenerate` | `GenerateError` com `status !== 403` (erro transitório) oferece botão "Tentar novamente" quando `reports.length === 0` | presença | Zero relatórios + erro transitório sem botão de retry |
| W005 | `page.tsx`, `autoGenerateWarning` | Falha da geração automática com relatórios existentes não sobrescreve `data.reports` e exibe aviso discreto, não banner de erro bloqueante | presença | `data.reports` limpo (undefined/array vazio) após falha; banner vermelho de erro visível no lugar do aviso discreto |

## Histórico de re-extrações

*(vazio — será preenchido pelo agente reverso quando rodar `/reversa` novamente)*

## Arquivadas

*(vazio)*

## Observações

Itens sem peso de regressão (não eram 🟢 no `_reversa_sdd/domain.md`):

- RF-05 (loading state): `autoGenerating` mostra skeleton entre mount e resposta. Originalmente era 🟡 (inferido). Se futura extração confirmar como 🟢, mova para o watch principal.
- RF-08 (retry sem limite): botão "Tentar novamente" permanece disponível a cada falha transitória subsequente. Verificar que não há degradação para outro estado após N falhas.
