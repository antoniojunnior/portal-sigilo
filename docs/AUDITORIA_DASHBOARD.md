# Auditoria Técnica e de Design — Dashboard Portal Sigilo (V2)

Este documento consolida a auditoria completa da área logada do Portal Sigilo, focando em refinamento estético, integridade técnica e prontidão para produção (SaaS Enterprise).

---

## 1. Identidade Visual e Design System

### 1.1. Unificação da Marca (Branding)
- **Status Atual**: O `Sidebar.tsx` reconstrói o logo manualmente (ícone + texto).
- **Problema**: O componente oficial `src/components/portal/LogoSigilo.tsx` existe mas não é utilizado na navegação principal.
- **Ação**: Substituir as linhas 58-67 de `Sidebar.tsx` pela chamada `<LogoSigilo variant="full" iconSize={34} />`.
- **Refinamento**: O componente `LogoSigilo.tsx` ainda utiliza cores hexadecimais fixas (`#2A6070`, `#C05A4A`). Devem ser migradas para os tokens CSS correspondentes (`var(--color-primary)`, `var(--color-accent)`) para manter a consistência com o tema.

### 1.2. Eliminação de Valores "Hardcoded" no CSS
- **Local**: `src/app/globals.css`.
- **Problema**: Presença de classes utilitárias com hexadecimais fixos (ex: `.btn-primary-petroleo { background: #2A6070 }`).
- **Ação**: Mapear todas as ocorrências de cores para os tokens definidos em `tokens.css`.

---

## 2. Navegação e Gestão de Módulos (Supressão)

Atualmente, o sistema exibe rotas que ainda não possuem lógica de negócio ou páginas físicas, o que prejudica a experiência do usuário (UX).

- **Módulo Mensagens (`/app/mensagens`)**:
    - **Status**: Não implementado.
    - **Ação**: Remover do `Sidebar.tsx` (NAV_ITEMS) e do `BottomNav.tsx`. Este módulo deve ser habilitado apenas na **Fase 7**.
- **Módulo Usuários (`/app/usuarios`)**:
    - **Status**: Não implementado.
    - **Ação**: Suprimir do menu. A gestão de usuários deve ser uma sub-seção de "Configurações".
- **Roadmap em Relatórios**:
    - **Problema**: Seções de "IA Insight" e "Indicadores ESG" em `relatorios/page.tsx` exibem selos de "Próxima Fase" de forma muito proeminente.
    - **Ação**: Substituir por estados de "Empty State" elegantes ou ocultar completamente para usuários que não possuem o plano Enterprise, mantendo apenas um banner de upgrade discreto.

---

## 3. Integridade de Dados (Mock vs. Real)

### 3.1. Dashboard Header
- **Notificações**: O contador no `DashboardHeader.tsx` está fixo em `notifications = 3`.
- **Ação**: Se não houver sistema de notificações pronto, remover o selo numérico ou conectar ao Firestore filtrando por `org_id` e `lida: false`.

### 3.2. Lógica de SLA e Urgência
- **Mock detectado**: Em `src/app/(dashboard)/app/(protected)/page.tsx` (linha 264), o cálculo de SLA é fictício: `const slaHours = item.urgencia === 5 ? -12 : ...`.
- **Ação**: O backend (API) deve retornar a data limite (`deadline_at`). O frontend deve calcular as horas restantes ou excedidas com base no horário atual do servidor.

### 3.3. Métricas de Tendência
- **Problema**: As tendências (setas de subida/descida) são baseadas em strings retornadas pela API (ex: `+12%`).
- **Ação**: Padronizar o retorno da API para objetos estruturados: `{ value: 12, direction: 'up', label: 'vs. mês anterior' }`.

---

## 4. Responsividade e Mobile First

### 4.1. Unificação do Menu Mobile
- **Situação**: Atualmente existe um `BottomNav` para as 4 rotas principais e um `Sidebar` como Drawer para o restante.
- **Ajuste**: 
    1. O `BottomNav` deve manter os itens: Home, Casos, Relatórios e **IA Assistant** (quando pronto).
    2. O botão "Mais" do `BottomNav` deve abrir o `Sidebar` (Drawer) contendo as opções administrativas e logout.
    3. Garantir que o `safe-area-bottom` do iOS esteja sendo respeitado (atualizado em `BottomNav.tsx`).

### 4.2. Visualização de Casos em Mobile
- **Melhoria**: Os cards de casos em mobile (`md:hidden`) em `page.tsx` precisam exibir a **categoria** e o **status** de forma mais clara, similar ao design da tabela desktop, para evitar que o usuário precise clicar em cada caso para saber do que se trata.

---

## 5. Débitos Técnicos (Checklist de Refino)

- [ ] **Componentização de Tabelas**: O `RelatoriosPage` e o `DashboardOverview` possuem implementações manuais de tabelas. Criar um componente `<DataTable />` genérico com suporte a skeleton loading e estados vazios.
- [ ] **Error Boundaries**: Adicionar tratamento de erro específico para a seção de `IAInsightsCard`, para que uma falha na API da Anthropic não quebre o dashboard inteiro.
- [ ] **Null Safety**: Garantir que as métricas que podem vir nulas do Firestore (ex: `prazoMedio`) não causem crash no render (uso de `?.` e `??`).
- [ ] **Sincronização**: Migrar de `fetch` puro em `useEffect` para `SWR` ou `TanStack Query` para ganhar cache e revalidação em foco.

---
**Última Atualização:** 02 de Maio de 2026
**Responsável:** Antigravity AI Assistant
