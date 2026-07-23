# Onboarding: Reestruturar Configuracoes com Submenu e Faturamento dedicado

> Identificador: `006-split-configuracoes`
> Data: `2026-07-23`

## Como testar essa feature

### Pre-requisitos

- Estar logado como **admin** (role `admin`) em uma org com `asaas_customer_id` configurado
- A org deve ter ao menos uma fatura registrada no Asaas (gerada pelo checkout ou webhook)

### Passo a passo

1. **Submenu no Sidebar**
   - Acesse `/app` — o sidebar a esquerda deve mostrar "Configuracoes" com um icone de expansao (chevron)
   - Clique em "Configuracoes" — deve expandir mostrando "Organizacao" e "Faturamento"
   - Clique em "Organizacao" — navega para `/app/configuracoes`
   - Clique em "Faturamento" — navega para `/app/configuracoes/faturamento`
   - Verifique que o item ativo fica destacado em ambos os casos
   - Logado como **gestor** (nao-admin): o item "Configuracoes" nao deve aparecer

2. **Pagina de Organizacao (`/app/configuracoes`)**
   - A sidebar interna (abas: Organizacao, Usuarios, Faturamento, Preferencias) **nao** deve existir
   - O bloco "Plano e Faturamento" (com badge do plano e link) **nao** deve existir
   - As secoes "Dados da Organizacao", "Membros da Equipe" e "Zona de Perigo" devem estar visiveis
   - O formulario de organizacao (nome, slug, boas-vindas, prazo, departamentos) deve funcionar normalmente (PATCH /api/dashboard/org)
   - A tabela de membros (convidar, alterar role, ativar/desativar) deve funcionar normalmente
   - A zona de perigo (desativar canal) deve funcionar normalmente

3. **Pagina de Faturamento (`/app/configuracoes/faturamento`)**
   - O bloco "Assinatura Ativa" (plano, status, valor, ciclo, vencimento) **nao** deve existir
   - O link/botao de voltar (seta para esquerda) **nao** deve existir
   - A tabela "Faturas" deve exibir ate 15 registros (antes eram 5)
   - Cada linha deve mostrar: data de vencimento + data de pagamento (ou "—" se nao paga)
   - Faturas com status PENDING/OVERDUE devem mostrar "—" na coluna Pagamento
   - Faturas com status RECEIVED/CONFIRMED devem mostrar a data de pagamento
   - O bloco "Cancelar Assinatura" (se subscription ativa) deve aparecer abaixo das faturas
   - O fluxo de cancelamento (modal, digitar "CANCELAR", confirmar) deve funcionar

4. **Verificacao de regressao**
   - Acessar `/app/configuracoes/faturamento` como gestor (nao-admin) → deve redirecionar para `/app`
   - Acessar `/app/configuracoes` como admin → a pagina carrega sem erros no console
   - Navegar entre as paginas do sidebar → os itens ativos atualizam corretamente
   - O GET `/api/reports/generate` e POST `/api/reports/generate` continuam funcionando (feature 005)
