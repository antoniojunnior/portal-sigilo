# Guia de Implementação — Portal Sigilo
## Para uso com Claude Code · Versão 1.0 · Abril 2026

---

> **Como usar este guia**
> Este documento orienta a construção do Portal Sigilo fase a fase.
> Cada fase tem: contexto para passar ao Claude Code, prompt principal,
> prompts complementares e checklist de validação.
>
> **Nunca avance para a próxima fase sem concluir o checklist da fase atual.**
>
> Referências ao PRD indicam seções do arquivo `PRD_PortalSigilo_v2.docx`.
> Cole apenas a seção indicada no prompt — nunca o documento inteiro.

---

## Pré-requisitos antes de começar

Execute estes passos manualmente antes de abrir o Claude Code pela primeira vez.

### Contas e serviços necessários
- [ ] Conta Google com projeto Firebase criado (plano Spark para início, Blaze para Functions)
- [ ] Conta Anthropic com chave de API gerada
- [ ] Conta Vercel (deploy do Next.js)
- [ ] Conta Asaas (pagamentos) — modo sandbox para desenvolvimento
- [ ] Conta Twilio ou 360dialog (WhatsApp Business API) — Fase 7
- [ ] Node.js 20+ instalado localmente
- [ ] Git configurado

### Criação do repositório
```bash
# 1. Crie o projeto Next.js
npx create-next-app@latest portal-sigilo \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd portal-sigilo

# 2. Instale as dependências base
npm install firebase firebase-admin
npm install @anthropic-ai/sdk
npm install -D @types/node

# 3. Instale Firebase CLI globalmente
npm install -g firebase-tools

# 4. Faça login no Firebase
firebase login

# 5. Inicialize o Firebase no projeto
firebase init
# Selecione: Firestore, Functions (TypeScript), Storage, Emulators
# Emulators: Firestore, Functions, Storage, Auth

# 6. Instale shadcn/ui
npx shadcn-ui@latest init

# 7. Inicie o Claude Code dentro do repositório
claude
```

### Estrutura de pastas a criar manualmente
```
portal-sigilo/
├── src/
│   ├── app/
│   │   ├── (portal)/          # Rotas públicas do denunciante
│   │   │   ├── page.tsx       # Tela 0 — seleção de empresa
│   │   │   ├── [slug]/        # Tela 1 — home da empresa
│   │   │   │   ├── page.tsx
│   │   │   │   ├── chat/      # Tela 2 — chatbot
│   │   │   │   ├── confirmacao/  # Tela 3
│   │   │   │   └── acompanhar/   # Tela 4
│   │   └── (dashboard)/       # Rotas autenticadas
│   │       └── app/
│   ├── lib/
│   │   ├── firebase/          # Config Firebase client-side
│   │   ├── firebase-admin/    # Config Firebase Admin (server-side)
│   │   └── types/             # Tipos TypeScript compartilhados
│   └── components/
│       ├── portal/            # Componentes do portal público
│       └── dashboard/         # Componentes do dashboard
├── functions/                 # Firebase Functions (TypeScript)
│   └── src/
│       ├── index.ts
│       ├── chat.ts            # Chatbot Claude
│       ├── triagem.ts         # Triagem automática
│       ├── webhook-asaas.ts   # Webhook de pagamento
│       └── webhook-whatsapp.ts
├── firestore.rules            # Regras de segurança
├── firestore.indexes.json     # Índices compostos
├── storage.rules              # Regras do Storage
├── docs/
│   ├── PRD_PortalSigilo_v2.docx
│   └── SECURITY.md            # Lido no início de cada sessão
├── CLAUDE.md                  # Lido automaticamente pelo Claude Code
└── .env.local                 # Variáveis de ambiente (nunca commitar)
```

---

## CLAUDE.md — Cole este conteúdo no arquivo raiz

```markdown
# Portal Sigilo — Contexto para o Claude Code

## O que é este projeto
SaaS multi-tenant de canal de denúncias corporativo com IA.
Stack: Next.js 14 + TypeScript + Firebase + Anthropic API + Tailwind + shadcn/ui.

## Regras invioláveis (leia antes de escrever qualquer código)
1. A chave ANTHROPIC_API_KEY NUNCA aparece em código client-side.
   Toda chamada à API Anthropic passa por Firebase Functions ou Route Handlers server-side.
2. O número de WhatsApp do usuário NUNCA é armazenado em texto puro.
   Sempre usar SHA-256(numero) como identificador.
3. Todo documento no Firestore (exceto `orgs`) deve ter o campo org_id.
   Toda query ao Firestore deve filtrar por org_id.
4. Gestores mencionados em um caso NUNCA podem acessar esse caso.
5. Audit logs são imutáveis. Nenhum documento em audit_logs pode ser
   alterado ou excluído (Firestore Rules bloqueiam update e delete).
6. Validação de mime type de anexos é feita SEMPRE no server (Firebase Function).
   Nunca confiar no Content-Type enviado pelo client.

## Estado atual do projeto
[Atualize esta seção ao final de cada fase]
- Fase 1: [ ] Pendente
- Fase 2: [ ] Pendente
- Fase 3: [ ] Pendente
- Fase 4: [ ] Pendente
- Fase 5: [ ] Pendente
- Fase 6: [ ] Pendente
- Fase 7: [ ] Pendente
- Fase 8: [ ] Pendente
- Fase 9: [ ] Pendente
- Fase 10: [ ] Pendente

## Convenções do projeto
- Sempre usar TypeScript estrito (strict: true no tsconfig)
- Componentes em PascalCase, funções em camelCase, arquivos em kebab-case
- Erros sempre tratados com try/catch e logados (nunca silenciados)
- Variáveis de ambiente acessadas via lib/env.ts (nunca process.env direto)
```

---

## SECURITY.md — Cole este conteúdo no arquivo docs/

```markdown
# Regras de Segurança — Portal Sigilo
## Leia este arquivo no início de cada sessão do Claude Code

### S1 — Chave Anthropic
NUNCA em código client-side.
NUNCA em arquivos que possam ser importados pelo browser.
SEMPRE em Firebase Functions ou Next.js Route Handlers com 'use server'.
Verificar: grep -r "ANTHROPIC" src/app --include="*.tsx" --include="*.ts"
           → Deve retornar zero resultados.

### S2 — Anonimato do denunciante
Protocolo: UUID v4 formato ETK-AAAA-XXXXXX. Zero vínculo com IP/device/cookie.
WhatsApp: conversation_id = SHA-256(numero). O número nunca em texto puro.
Nenhum campo que identifique o denunciante nos documentos cases ou messages.

### S3 — Isolamento multi-tenant
org_id obrigatório em TODO documento (exceto orgs).
Toda query ao Firestore filtra por org_id.
Firestore Rules negam acesso se org_id do token != org_id do documento.

### S4 — Isolamento multi-unidade (Enterprise)
Gestores com escopo de unidade só veem cases com seu unit_id.
Admins da org veem todos os cases da org.

### S5 — Bloqueio de mencionados
Se users/{userId} está em cases/{caseId}/mencionados[],
esse usuário não pode ler, escrever ou ser atribuído ao caso.
Implementado em Firestore Rules E na UI.

### S6 — Imutabilidade de audit_logs
Firestore Rules: allow read: if isGestor(); allow create: if true;
                 allow update, delete: if false; // NUNCA permitir

### S7 — Validação de anexos (server-side)
Mime types aceitos: image/jpeg, image/png, image/webp,
                    video/mp4, video/quicktime,
                    audio/mpeg, audio/ogg, audio/webm,
                    application/pdf
Tamanho máximo: 50 MB por arquivo, 200 MB por caso, 10 arquivos por relato.
Validação: Firebase Function verifica mime type ANTES do upload para Storage.
NUNCA aceitar o Content-Type enviado pelo client sem re-validar no server.

### S8 — LGPD
Dados de saúde, orientação sexual, origem étnica em relatos = dados sensíveis.
Criptografia a nível de campo antes de gravar no Firestore.
Retención: cases arquivados após 5 anos, audit_logs após 20 anos.
Em caso de incidente: notificar ANPD conforme art. 48 da LGPD.
```

---

## Fase 1 — Fundação

### Objetivo
Configurar toda a infraestrutura sem escrever nenhuma tela.
Segurança e isolamento multi-tenant testados antes de qualquer feature.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo — SaaS multi-tenant de canal de denúncias corporativo.
Stack: Next.js 14, TypeScript, Firebase (Firestore + Auth + Storage + Functions),
       Anthropic API (Claude Sonnet), Tailwind CSS, shadcn/ui.

Leia o arquivo CLAUDE.md e docs/SECURITY.md antes de começar.

Fase atual: 1 — Fundação.
Fases anteriores concluídas: nenhuma.
```

### Prompt principal
```
Implemente a Fase 1 — Fundação do Portal Sigilo.

TAREFAS (nesta ordem exata, sem pular):

1. Crie o arquivo src/lib/env.ts que centraliza todas as variáveis
   de ambiente com validação em runtime. Se uma variável obrigatória
   faltar, lançar erro claro no startup. Incluir:
   - ANTHROPIC_API_KEY (server-only — nunca exportar para o client)
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY (para Admin SDK)
   - FIREBASE_CLIENT_EMAIL (para Admin SDK)
   - NEXT_PUBLIC_FIREBASE_API_KEY (client-side — sem segredo)
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   Variáveis sem prefixo NEXT_PUBLIC_ não devem ser acessíveis no bundle do browser.

2. Crie src/lib/firebase/client.ts — inicialização do Firebase client SDK
   (apenas variáveis NEXT_PUBLIC_).

3. Crie src/lib/firebase-admin/admin.ts — inicialização do Firebase Admin SDK
   com as credenciais server-side. Este arquivo NUNCA pode ser importado
   por componentes client-side.

4. Crie src/lib/types/index.ts com as interfaces TypeScript para:
   - Org, Unit, User (com Role: 'admin' | 'gestor' | 'auditor')
   - Case (com Status, CanalOrigem, TriagemIA)
   - Message, AuditLog, Report, WhatsappSession
   Basear nas coleções da seção 2.2 do PRD (que vou colar abaixo).

5. Crie o arquivo firestore.rules completo com:
   - Isolamento por org_id (regra global: nenhum documento acessível
     sem org_id correspondente ao token do usuário)
   - Isolamento por unit_id para gestores Enterprise
   - Bloqueio de mencionados em cases
   - audit_logs: allow read para gestores, allow create para todos,
     allow update/delete NUNCA (if false)
   - Regras separadas para whatsapp_sessions (acesso apenas server-side
     via Admin SDK)

6. Crie firestore.indexes.json com os índices compostos necessários:
   - cases: [org_id ASC, status ASC, created_at DESC]
   - cases: [org_id ASC, unit_id ASC, status ASC, created_at DESC]
   - cases: [org_id ASC, urgencia DESC, created_at DESC]
   - messages: [case_id ASC, timestamp ASC]
   - audit_logs: [org_id ASC, timestamp DESC]

7. Crie storage.rules com:
   - Nenhum acesso direto ao Storage pelo client sem autenticação
   - Uploads de denunciantes somente via Firebase Function (Admin SDK)
   - Gestores autenticados podem fazer download de anexos do seu org_id

8. Crie o arquivo .env.local com as variáveis (valores placeholder)
   e .env.example documentado para o time. Adicione .env.local ao .gitignore.

[Cole aqui a seção 2.2 — Modelo de dados Firestore do PRD]
[Cole aqui a seção 2.3 — Segurança e LGPD do PRD]
```

### Prompts complementares

**Se o Claude Code gerar as Firestore Rules de forma simplificada, use:**
```
As Firestore Rules estão incompletas. Quero que você:
1. Adicione uma função isAuthenticated() que verifica auth != null
2. Adicione isGestorDaOrg(orgId) que verifica se o usuário autenticado
   pertence àquela org (lendo de users/{userId})
3. Adicione isMencionado(caseId) que verifica se o userId está em
   cases/{caseId}/mencionados[]
4. Aplique isMencionado() como condição de negação em TODAS as regras
   de cases — se o usuário é mencionado, negar acesso mesmo sendo admin
5. Para audit_logs: certifique-se que update e delete retornam false
   explicitamente, não apenas sem regra de permissão
```

**Para criar dados de teste no Firestore Emulator:**
```
Crie o arquivo scripts/seed-emulator.ts que popula o Firestore Emulator
com dados de teste para desenvolvimento:
- 2 orgs: uma com plano 'entrada', outra com plano 'gestao'
- 3 usuários: um admin e um gestor para a org 'gestao', um admin para 'entrada'
- 5 cases variados (categorias e urgências diferentes) para a org 'gestao'
- 10 messages para um dos cases
- 5 audit_logs

Execute com: npx ts-node scripts/seed-emulator.ts
```

### Checklist de validação — Fase 1

> Execute cada item. Só avance quando todos estiverem marcados.

**Segurança (crítico):**
- [ ] `grep -r "ANTHROPIC_API_KEY" src/app --include="*.tsx" --include="*.ts"`
  → Deve retornar **zero resultados**. Se aparecer algo, a chave está exposta.
- [ ] `grep -r "privateKey\|private_key" src/app --include="*.tsx" --include="*.ts"`
  → Deve retornar **zero resultados**.
- [ ] Abra o browser com o emulador rodando. No console do browser (F12),
  execute `window.__FIREBASE_DEFAULTS__` e confirme que não há chaves privadas visíveis.

**Firestore Rules — teste manual no emulador:**
```bash
# Inicie os emuladores
firebase emulators:start

# Acesse a UI do emulador
# http://localhost:4000/firestore
```
- [ ] Crie um case SEM o campo `org_id` → deve ser **rejeitado**
- [ ] Tente ler um case de uma org diferente da do usuário → deve ser **rejeitado**
- [ ] Tente fazer update em um audit_log existente → deve ser **rejeitado**
- [ ] Tente fazer delete em um audit_log → deve ser **rejeitado**
- [ ] Adicione um userId em `cases/{caseId}/mencionados[]`.
  Tente ler esse case com esse userId autenticado → deve ser **rejeitado**

**Tipos TypeScript:**
- [ ] `npx tsc --noEmit` → zero erros
- [ ] Todos os campos da seção 2.2 do PRD estão nas interfaces

**Índices:**
- [ ] `firestore.indexes.json` tem os 5 índices compostos listados

**Variáveis de ambiente:**
- [ ] `.env.local` está no `.gitignore`
- [ ] `.env.example` tem todas as variáveis documentadas sem valores reais
- [ ] Iniciar o app sem `.env.local` → deve lançar erro descritivo, não crash silencioso

**Atualizar CLAUDE.md:**
- [ ] Marcar Fase 1 como concluída no arquivo CLAUDE.md

---

## Fase 2 — Portal do Denunciante (sem IA)

### Objetivo
Construir todas as telas do portal público. O denunciante deve conseguir
fazer um relato completo e receber um protocolo sem nenhuma IA envolvida.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo — SaaS multi-tenant de canal de denúncias.
Stack: Next.js 14, TypeScript, Firebase, Tailwind, shadcn/ui.
Fase atual: 2 — Portal do denunciante (sem IA).
Fase 1 concluída: fundação, Firebase, Firestore Rules, tipos.

Leia CLAUDE.md e docs/SECURITY.md antes de começar.
```

### Prompt principal
```
Implemente a Fase 2 — Portal do denunciante (sem IA).

IMPORTANTE: Nesta fase, o chat da Tela 2 é estático — sem chamadas
à API Anthropic. O fluxo deve funcionar 100% sem IA.

TAREFAS:

1. TELA 0 — Boas-vindas e seleção de empresa
   Rota: /  (portalsigilo.com.br)
   - Mensagem institucional do Portal Sigilo
   - Input de busca por nome da empresa (busca na coleção orgs, campo 'nome')
   - Busca com debounce de 300ms, mínimo 3 caracteres
   - Lista de resultados com nome e logo
   - Campo alternativo para código de acesso direto (slug)
   - Se a org selecionada é Enterprise com multi-unidade:
     exibir segundo passo — lista de unidades (coleção units filtrada por org_id)
   - Ao confirmar: redirecionar para /[slug] com org_id e unit_id (se houver)
     armazenados em sessionStorage (não localStorage, não cookie persistente)
   - ZERO cookies, ZERO logs de acesso, ZERO analytics nesta tela
   - Se URL já tem slug (link direto): pular para Tela 1

2. TELA 1 — Home do canal da empresa
   Rota: /[slug]
   - Carregar dados da org pelo slug (coleção orgs, campo slug)
   - Exibir nome e logo da empresa (se configurado)
   - Se multi-unidade: exibir nome da unidade e botão "Trocar unidade"
   - Subheadline configurável (campo orgs.configuracoes.boas_vindas)
   - Botão "Contar o que aconteceu" → /[slug]/chat
   - Botão "Como funciona?" → modal com explicação e garantias de anonimato
   - Input de protocolo com máscara ETK-XXXX-XXXXXX → /[slug]/acompanhar
   - 3 ícones de garantia: Anônimo / Sem identificação / Gestão independente
   - Rodapé fixo com: Lei 14.457/22, NR-1, LGPD, "Canal operado pelo Portal Sigilo"

3. TELA 2 — Chatbot de coleta (UI estática por ora)
   Rota: /[slug]/chat
   - Interface de chat (bolhas, input, botão enviar)
   - Badge "Anônimo" fixo e sempre visível no topo
   - Barra de progresso discreta (4 etapas: Início → Detalhes → Evidências → Confirmação)
   - Mensagem inicial automática do "sistema" apresentando o canal
   - Input de texto com suporte a Enter para enviar
   - Botão de clipe para anexar arquivos
   - Validação de anexos no CLIENT (preview apenas):
     tipos aceitos: jpg, png, webp, mp4, mov, mp3, ogg, webm, pdf
     tamanho máximo: 50MB por arquivo
     IMPORTANTE: a validação real de mime type será feita no server na Fase 3
   - Preview de arquivos antes do envio (thumbnail para imagens, nome+tamanho para outros)
   - Ao "enviar" um relato (por ora sem IA): criar um Case no Firestore
     com status 'aguardando_triagem', org_id, unit_id (se houver),
     protocolo gerado como ETK-YYYY-XXXXXX (ano atual + 6 chars aleatórios)
   - Redirecionar para Tela 3 com o protocolo gerado

4. TELA 3 — Confirmação e protocolo
   Rota: /[slug]/confirmacao?protocolo=ETK-XXXX-XXXXXX
   - Protocolo em destaque com fonte monoespaçada (font-mono)
   - Aviso: "Guarde este número. Nenhum dado seu está vinculado a ele."
   - Aviso adicional: "Sem ele, não é possível acompanhar este relato."
   - Timeline visual: Recebido (ativo) → Em apuração → Conclusão
   - Prazo informativo: "Você receberá retorno em até 30 dias."
   - Botão "Acompanhar pelo protocolo" → /[slug]/acompanhar?protocolo=...
   - Botão "Voltar ao início" → /[slug]
   - Botão "Salvar comprovante" → gera PDF simples com protocolo, data,
     nome da empresa e contato do canal (sem dados do relato)

5. TELA 4 — Acompanhamento por protocolo
   Rota: /[slug]/acompanhar
   - Input com máscara ETK-XXXX-XXXXXX
   - Ao buscar: carregar case pelo protocolo (filtrar por org_id + protocolo)
   - Exibir: status atual, histórico de movimentações (sem conteúdo do relato),
     mensagens do gestor para o denunciante
   - Chat simples para o denunciante responder (sem IA, só gravar em messages)
   - Suporte a envio de anexos adicionais (mesmos tipos e limites)
   - Polling a cada 30 segundos para atualizar status
   - Se protocolo não encontrado: mensagem clara sem revelar se existe ou não

REQUISITOS GERAIS:
- Layout responsivo de 320px a 1440px (testar em mobile!)
- Acessibilidade: todo input com label, contraste WCAG AA, foco visível
- Loading states em todas as ações assíncronas
- Error states tratados e exibidos ao usuário
- Nenhum dado do denunciante gravado além do necessário
- sessionStorage limpo ao navegar para fora do portal

[Cole aqui a seção 4.1 e 4.2 do PRD]
```

### Prompts complementares

**Para o componente de chat (Tela 2):**
```
O componente de chat da Tela 2 precisa ser componentizado de forma que
na Fase 3 eu possa trocar a lógica estática por chamadas à API Claude
sem reescrever a UI. Crie:

- src/components/portal/ChatBubble.tsx — bolha de mensagem (sistema/usuário)
- src/components/portal/ChatInput.tsx — input + botão enviar + botão de anexo
- src/components/portal/ChatAttachment.tsx — preview de arquivo antes do upload
- src/components/portal/ChatContainer.tsx — orquestra o chat, recebe como prop
  uma função onSendMessage(text: string, attachments: File[]) => Promise<void>
  Esta função será substituída na Fase 3 pela chamada ao Claude.
```

**Para geração do protocolo:**
```
Crie a função generateProtocol() em src/lib/utils/protocol.ts que:
1. Gera um UUID v4
2. Formata como ETK-[ANO]-[6 chars aleatórios maiúsculos]
   Exemplo: ETK-2026-A3F7K2
3. Verifica no Firestore se o protocolo já existe (colisão improvável mas possível)
4. Se existir, gera novamente (máximo 3 tentativas)
5. Retorna o protocolo único

Esta função é chamada no server (Firebase Function ou Route Handler),
nunca no client diretamente.
```

### Checklist de validação — Fase 2

**Fluxo completo do denunciante:**
- [ ] Acesse `/` sem slug → aparece Tela 0 com campo de busca
- [ ] Busque "empresa" com menos de 3 caracteres → busca NÃO dispara
- [ ] Busque uma empresa existente → aparece na lista com nome e logo
- [ ] Selecione a empresa → redireciona para `/[slug]`
- [ ] Na Tela 1, clique "Como funciona?" → modal abre com garantias
- [ ] Na Tela 1, clique "Contar o que aconteceu" → vai para Tela 2
- [ ] Na Tela 2, tente anexar um arquivo `.exe` ou `.zip` → deve ser rejeitado na UI
- [ ] Anexe uma imagem válida → preview aparece
- [ ] Anexe um PDF válido → nome e tamanho aparecem
- [ ] "Envie" o relato → Tela 3 aparece com protocolo no formato ETK-AAAA-XXXXXX
- [ ] Na Tela 3, clique "Salvar comprovante" → PDF baixado sem dados do relato
- [ ] Na Tela 3, clique "Acompanhar" → Tela 4 com protocolo preenchido
- [ ] Na Tela 4, veja o status "Aguardando triagem"

**Anonimato:**
- [ ] Abra o DevTools (F12) → aba Application → SessionStorage
  → Deve conter org_id e unit_id (se houver), NUNCA dados do relato
- [ ] Inspecione o documento gravado no Firestore (emulador)
  → Deve ter protocolo, org_id, status. NÃO deve ter IP, nome, e-mail, dispositivo.

**Acessibilidade:**
- [ ] Navegue por toda a Tela 2 usando apenas o teclado (Tab + Enter)
- [ ] Execute axe DevTools no Chrome → zero erros críticos

**Responsividade:**
- [ ] Abra em 375px (iPhone SE) → nenhum elemento cortado
- [ ] Abra em 768px (tablet) → layout legível
- [ ] Abra em 1440px (desktop) → layout confortável

**Banco de dados:**
- [ ] Verifique no Firestore Emulator que o Case foi criado
- [ ] O Case NÃO tem campos: ip, userAgent, email, nome, telefone
- [ ] O protocolo segue o formato ETK-AAAA-XXXXXX

**Atualizar CLAUDE.md:** marcar Fase 2 como concluída.

---

## Fase 3 — Chatbot com Claude

### Objetivo
Integrar Claude ao chat de coleta. O denunciante agora conversa com IA.
Esta é a fase mais crítica em termos de segurança — a chave Anthropic
entra em jogo.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 3 — Chatbot com Claude.
Fases 1 e 2 concluídas.

CRÍTICO: Nesta fase trabalhamos com a API Anthropic.
Leia CLAUDE.md e docs/SECURITY.md antes de qualquer código.
A chave ANTHROPIC_API_KEY nunca pode aparecer em código client-side.
```

### Prompt principal
```
Implemente a Fase 3 — Chatbot com Claude.

ARQUITETURA OBRIGATÓRIA:
- Client (browser) → POST para Firebase Function /chat
- Firebase Function → chama API Anthropic com a chave do servidor
- Firebase Function → retorna resposta via Server-Sent Events (SSE)
- NUNCA: Client → API Anthropic diretamente

TAREFAS:

1. Crie a Firebase Function /chat em functions/src/chat.ts:
   - Recebe: { messages: ChatMessage[], org_id: string, unit_id?: string,
               attachmentRefs?: string[] }
   - Valida org_id (verificar se existe na coleção orgs)
   - Carrega configurações da org (nome, categorias ativas)
   - Monta o system prompt com as variáveis da org (ver seção 6.1 do PRD)
   - Chama Claude Sonnet (claude-sonnet-4-20250514) via Anthropic SDK
   - Faz streaming da resposta via SSE
   - Quando detectar JSON estruturado na resposta do Claude:
     a. Valida e tipifica o JSON
     b. Grava o Case no Firestore com status 'aguardando_triagem'
     c. Gera o protocolo via generateProtocol()
     d. Grava audit_log da criação
     e. Retorna evento SSE especial: { type: 'case_created', protocolo }
   - Tratamento de erros: se Claude falhar, retornar mensagem amigável
     sem expor detalhes técnicos ao usuário

2. System prompt (implementar exatamente como especificado):
   [Cole aqui o fragmento de system prompt da seção 6.1 do PRD]
   - Substituir {nome_org} pelo nome real da org
   - Substituir {nome_unit} pelo nome da unidade se houver
   - O prompt instrui Claude a NUNCA pedir dados identificadores
   - O prompt instrui Claude a usar "contar"/"falar", nunca "denunciar"
   - Quando o relato estiver completo, Claude produz JSON estruturado

3. Detecção do JSON de finalização:
   - Claude sinaliza fim do relato com JSON no formato:
     { "type": "case_complete", "data": { categoria, urgencia, ... } }
   - A Function detecta este padrão na stream e processa
   - Validar TODOS os campos do JSON antes de gravar no Firestore
   - Se JSON inválido: solicitar ao Claude que reformate (máx 2 tentativas)

4. Suporte a anexos no chat:
   - Antes de iniciar a conversa, se houver arquivos selecionados pelo usuário:
     a. Client envia arquivo para endpoint de upload /api/upload-attachment
     b. Route Handler (server-side) valida mime type REAL do arquivo
        (usar biblioteca 'file-type' para detectar mimo real, não confiar
        no Content-Type do client)
     c. Se válido: salvar em Storage no path
        orgs/{org_id}/cases/temp/{uuid}/{filename}
     d. Retornar signed URL temporário (15 minutos) e storage_path
     e. O chat_message do usuário inclui referência ao storage_path
   - A Function /chat inclui referências aos arquivos no contexto do Claude
     (como texto descritivo: "Usuário enviou: imagem.jpg, audio.mp3")

5. Atualizar o componente ChatContainer da Fase 2:
   - A prop onSendMessage agora chama o endpoint /chat via SSE
   - Tokens chegam em streaming → exibir em tempo real na bolha do Claude
   - Indicador de "digitando..." enquanto aguarda primeiro token
   - Ao receber evento 'case_created': redirecionar para Tela 3 com protocolo

[Cole aqui a seção 6.1 completa do PRD]
```

### Prompts complementares

**Para criar o endpoint de upload de anexos:**
```
Crie o Route Handler src/app/api/upload-attachment/route.ts:
1. Aceita POST com FormData contendo o arquivo
2. Lê os bytes do arquivo (não confiar no Content-Type do client)
3. Usa a biblioteca 'file-type' para detectar o mime type real:
   npm install file-type
4. Verifica contra a lista de tipos permitidos:
   image/jpeg, image/png, image/webp, video/mp4, video/quicktime,
   audio/mpeg, audio/ogg, audio/webm, application/pdf
5. Verifica tamanho máximo (50 MB)
6. Se válido: salva no Firebase Storage via Admin SDK
   Path: orgs/{org_id}/cases/temp/{uuid}/{filename}
7. Retorna { storage_path, filename, mime_type, size }
8. Se inválido: retorna 400 com mensagem clara
9. Grava audit_log da tentativa (incluindo rejeições — importante para LGPD)
```

**Para testar o SSE:**
```
Crie um script de teste manual em scripts/test-chat.ts:
1. Simula uma conversa completa com o chatbot
2. Envia 3-4 mensagens progressivas
3. Na última mensagem, Claude deve detectar completude e gerar o JSON
4. Verifica que o Case foi criado no Firestore Emulator
5. Verifica que o protocolo foi gerado corretamente
6. Exibe cada token recebido via SSE para confirmar streaming

Execute com: npx ts-node scripts/test-chat.ts
```

### Checklist de validação — Fase 3

**Segurança (crítico — não pule):**
- [ ] `grep -r "ANTHROPIC_API_KEY" src/ --include="*.ts" --include="*.tsx"`
  → Deve retornar **zero resultados** em arquivos dentro de `src/app/`
  → PODE aparecer apenas em `functions/src/` ou route handlers com 'use server'
- [ ] Abra o DevTools → aba Network → filtre por "chat"
  → O request vai para Firebase Functions, NÃO para `api.anthropic.com`
- [ ] Abra o bundle do Next.js no DevTools → Source → search "sk-ant"
  → Deve encontrar **zero resultados**

**Upload de anexos:**
- [ ] Envie um arquivo `.exe` renomeado para `.jpg`
  → Deve ser rejeitado (detecção por bytes, não extensão)
- [ ] Envie um PDF real → aceito, storage_path retornado
- [ ] Envie um arquivo > 50 MB → rejeitado com mensagem clara
- [ ] Envie 11 arquivos → décimo-primeiro deve ser rejeitado

**Fluxo do chatbot:**
- [ ] Inicie uma conversa → Claude responde em streaming (tokens aparecem progressivamente)
- [ ] Indicador "digitando..." aparece antes do primeiro token
- [ ] Converse por 3-5 mensagens → Claude pede mais detalhes naturalmente
- [ ] Complete o relato → Claude gera JSON e redireciona para Tela 3
- [ ] Verifique no Firestore Emulator:
  - Case criado com todos os campos corretos
  - status: 'aguardando_triagem'
  - Nenhum campo identificador do denunciante
- [ ] Verifique audit_log criado para a criação do case

**Cenários de erro:**
- [ ] Simule falha da API Anthropic (desconecte internet) → mensagem amigável, sem stacktrace
- [ ] Envie org_id inválido para /chat → retorna 400, não 500

**Atualizar CLAUDE.md:** marcar Fase 3 como concluída.

---

## Fase 4 — Triagem Automática por IA

### Objetivo
Classificar automaticamente cada Case assim que é criado no Firestore,
antes de qualquer ação humana. Acionar alertas para casos críticos.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 4 — Triagem automática por IA.
Fases 1, 2, 3 concluídas.
Leia CLAUDE.md e docs/SECURITY.md.
```

### Prompt principal
```
Implemente a Fase 4 — Triagem automática por IA.

TAREFAS:

1. Crie Firebase Function em functions/src/triagem.ts:
   - Trigger: Firestore onDocumentCreated('cases/{caseId}')
   - Verificar se plano da org suporta triagem (Gestão ou Enterprise)
     Se plano for 'entrada': apenas atualizar status para 'triado_manual'
     e encerrar sem chamar Claude
   - Para Gestão e Enterprise: chamar Claude com o JSON do relato
   - System prompt de triagem (implementar exatamente):
     [Cole aqui o fragmento de system prompt da seção 6.2 do PRD]
   - O enum categoria_legal DEVE incluir:
     assedio_moral | assedio_sexual | discriminacao_salarial | discriminacao |
     fraude | desvio_etico | violacao_lgpd | seguranca_trabalho |
     risco_psicossocial | conflito_interesses | outro
     (discriminacao_salarial e risco_psicossocial são obrigatórios por
     lei 14.611/23 e NR-1 respectivamente)
   - O campo lei_aplicavel[] usa enum:
     lei_14457 | nr1 | lei_14611 | lgpd | clt | outro
   - Validar TODOS os campos do JSON retornado por Claude
   - Se JSON inválido: tentar novamente (máx 2 tentativas), depois
     gravar com categoria 'outro' e flag needs_manual_review: true
   - Atualizar o Case com o objeto triagem_ia e status 'triado'
   - Gravar audit_log da triagem

2. Sistema de alertas para casos críticos:
   - Se urgencia >= 4: disparar notificação imediata para admin da org
   - Implementar em functions/src/notificacoes.ts
   - Por ora: enviar e-mail via Firebase Extensions (Trigger Email)
     ou via nodemailer com SMTP configurado em variáveis de ambiente
   - Formato do e-mail:
     Assunto: "[URGENTE] Novo caso crítico — {categoria} — Protocolo {protocolo}"
     Corpo: urgência, categoria, lei aplicável, link para o dashboard
     NUNCA incluir o conteúdo do relato no e-mail
   - Gravar audit_log da notificação enviada

3. Adicionar campo mencionados[] ao fluxo:
   - Durante a triagem, Claude pode identificar pessoas mencionadas
     no relato pelo cargo/área (nunca pelo nome, pois o relato é anônimo,
     mas o gestor pode identificar por contexto)
   - Por ora: deixar mencionados[] como array vazio
   - A Function deve aceitar o campo mas não populá-lo automaticamente
     (gestores preencherão manualmente via dashboard na Fase 5)

[Cole aqui a seção 6.2 completa do PRD]
```

### Checklist de validação — Fase 4

**Triagem automática:**
- [ ] Crie um Case manualmente no Firestore Emulator
  → Aguarde 5-10 segundos → o campo `triagem_ia` deve aparecer no documento
- [ ] Verifique que `triagem_ia.categoria_legal` é um dos valores do enum
- [ ] Verifique que `triagem_ia.lei_aplicavel` é um array (pode ser vazio)
- [ ] Verifique que o status mudou para 'triado'
- [ ] Crie um Case com urgência 4 ou 5 → e-mail de alerta deve ser enviado
- [ ] Verifique audit_log criado para a triagem

**Plano Entrada:**
- [ ] Para org com plano 'entrada': Case deve ficar com status 'triado_manual'
  → Campo triagem_ia NÃO deve ser preenchido

**Robustez:**
- [ ] Simule retorno de JSON inválido do Claude (mock) → deve tentar novamente
- [ ] Após 2 tentativas com JSON inválido → gravar com categoria 'outro'
  e `needs_manual_review: true`

**Atualizar CLAUDE.md:** marcar Fase 4 como concluída.

---

## Fase 5 — Dashboard de Gestão

### Objetivo
Construir a interface autenticada para gestores. Esta fase tem as
regras mais complexas de acesso — atenção redobrada.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 5 — Dashboard de gestão.
Fases 1–4 concluídas.
Leia CLAUDE.md e docs/SECURITY.md.
CRÍTICO: Toda ação do gestor gera um audit_log. Sem exceções.
```

### Prompt principal
```
Implemente a Fase 5 — Dashboard de gestão.

AUTENTICAÇÃO:
- Firebase Auth com e-mail/senha para gestores
- Middleware Next.js verificando token em todas as rotas /app/*
- Após login: verificar se user existe em users/{uid} com ativo: true
- Se não existir ou ativo: false → redirecionar para página de erro
- Armazenar role e org_id no contexto React (AuthContext)

TAREFAS:

1. Sistema de autenticação:
   - Página de login: /app/login
   - AuthContext com: user, org_id, unit_id, role, loading
   - Middleware em middleware.ts protegendo /app/* (exceto /app/login)
   - Hook useAuth() com acesso fácil ao contexto
   - Logout limpa todo o estado e redireciona para /app/login

2. Layout base do dashboard:
   - Sidebar com navegação: Visão Geral, Casos, Relatórios, Configurações
   - Sidebar oculta itens que o role não pode acessar
   - Header com: nome do gestor, org, badge do plano, botão logout
   - Breadcrumb em todas as páginas

3. TELA — Visão Geral (Home do dashboard):
   Rota: /app
   [Implementar conforme seção 5.2 do PRD — Tela Visão Geral]
   - 4 cards de métricas com comparativo vs período anterior
   - Lista de 10 casos recentes com indicador de urgência colorido
   - Gráfico de categorias (barras horizontais — últimos 6 meses)
   - Mapa de risco: exibir apenas se plano for Gestão ou Enterprise
   - Assistente IA: exibir apenas se plano for Gestão ou Enterprise
   - Seletor de período no topo (default: mês atual)
   - TODAS as queries filtram por org_id do usuário autenticado

4. TELA — Lista de casos:
   Rota: /app/casos
   [Implementar conforme seção 5.2 do PRD — Tela Lista de Casos]
   - Filtros: status, categoria, urgência, período, responsável, canal de origem
   - Paginação: 10 por página (padrão), opções 20 e 50
   - Coluna "canal de origem" com ícone (web/whatsapp/app/0800)
   - Ordenação por urgência (padrão), data, prazo restante
   - Exportação CSV e PDF: apenas Gestão e Enterprise
   - Busca por protocolo
   - CRÍTICO: Casos onde o usuário está em mencionados[] NÃO aparecem na lista

5. TELA — Detalhe do caso:
   Rota: /app/casos/[caseId]
   [Implementar conforme seção 5.2 do PRD — Tela Detalhe do Caso]
   - Header com protocolo, canal, categoria, urgência, prazo
   - Card de Triagem IA: apenas Gestão e Enterprise
   - Timeline de histórico de movimentações
   - Chat anônimo com o denunciante (polling 30s para novas mensagens)
   - Visualização de anexos: thumbnail imagens, player áudio/vídeo inline,
     download autenticado via signed URL para todos os tipos
   - Dropdown de responsável: NÃO exibir usuários que estão em mencionados[]
   - Dropdown de status com as opções do PRD
   - Input de prazo com alerta visual se < 5 dias
   - Notas internas (visíveis apenas para gestores, nunca para o denunciante)
   - Botão "Adicionar mencionado": adiciona user_id ao array mencionados[]
     → Ao adicionar: esse usuário perde acesso imediato ao caso (Firestore Rules)
   - CRÍTICO: Se o usuário atual está em mencionados[]: redirecionar para /app/casos
     com mensagem "Você foi identificado como parte neste caso."
   - TODO audit_log para: leitura do caso, mudança de status,
     atribuição de responsável, envio de mensagem, download de anexo

6. TELA — Configurações (apenas admin):
   Rota: /app/configuracoes
   [Implementar conforme seção 5.2 do PRD — Tela Configurações]
   - Todas as seções do PRD, com controle de acesso por role
   - Upload de logo da empresa (com validação de tipo e tamanho)
   - Gestão de usuários: adicionar, editar role, desativar
     → Ao adicionar usuário: enviar e-mail com link de primeiro acesso
   - Limite de usuários por plano aplicado na UI E na Function de criação

AUDIT LOGS (obrigatório em todo o dashboard):
- Criar helper logAudit(action, caseId?, details?) que grava em audit_logs
- Ações que DEVEM gerar audit_log:
  * Leitura de caso (quando gestor abre /app/casos/[caseId])
  * Mudança de status
  * Atribuição de responsável
  * Envio de mensagem para denunciante
  * Download de anexo
  * Adição de mencionado
  * Exportação de lista ou relatório
  * Login e logout
  * Criação/edição/desativação de usuário

[Cole aqui as seções 5.1 e 5.2 completas do PRD]
```

### Checklist de validação — Fase 5

**Autenticação:**
- [ ] Acesse `/app/casos` sem login → redireciona para `/app/login`
- [ ] Faça login com usuário inválido → mensagem de erro clara
- [ ] Faça login com usuário `ativo: false` → acesso negado com mensagem
- [ ] Após logout → tente voltar com botão "Voltar" do browser → redireciona para login

**Controle de acesso por role:**
- [ ] Login como `auditor` → menu Configurações não aparece
- [ ] Login como `gestor` → menu Configurações não aparece
- [ ] Login como `admin` → menu Configurações aparece
- [ ] Tente acessar `/app/configuracoes` como `gestor` diretamente na URL
  → deve ser redirecionado

**Bloqueio de mencionados:**
- [ ] Adicione um userId em `cases/{caseId}/mencionados[]`
- [ ] Faça login com esse userId → o case NÃO aparece na lista
- [ ] Tente acessar `/app/casos/[caseId]` diretamente → redireciona com mensagem
- [ ] O userId bloqueado NÃO aparece no dropdown de "atribuir responsável"

**Audit logs:**
- [ ] Abra um case → verifique audit_log com ação 'case_viewed'
- [ ] Mude o status → verifique audit_log com status anterior e novo
- [ ] Tente fazer update diretamente no audit_log pelo Firestore Emulator
  → deve ser rejeitado pelas Rules

**Isolamento multi-tenant:**
- [ ] Login com gestor da Org A → NÃO vê cases da Org B
- [ ] Tente acessar `/app/casos/[caseId_da_org_B]` → deve ser negado

**Atualizar CLAUDE.md:** marcar Fase 5 como concluída.

---

## Fase 6 — Assistente de IA para Gestores e Relatórios

### Objetivo
Adicionar o assistente Claude contextual no dashboard e a geração
automática de relatórios mensais.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 6 — Assistente IA para gestores e relatórios.
Fases 1–5 concluídas.
Leia CLAUDE.md e docs/SECURITY.md.
CRÍTICO: O assistente de gestão recebe METADADOS do caso, não o texto
bruto do relato. Ver regra S-IA no SECURITY.md.
```

### Prompt principal
```
Implemente a Fase 6 — Assistente de IA para gestores e relatórios.

TAREFAS:

1. Assistente de IA contextual no detalhe do caso:
   - Painel de chat lateral na Tela de Detalhe do Caso
   - Apenas para Gestão e Enterprise (verificar plano)
   - Criar Firebase Function /assistant-chat
   - A Function recebe: { caseId, messages[], user_token }
   - Verificar autenticação e acesso ao case
   - Montar contexto APENAS com metadados (não o texto do relato):
     { categoria, urgencia, lei_aplicavel, dias_em_aberto, status }
   - System prompt conforme seção 6.3 do PRD:
     [Cole aqui o fragmento de system prompt da seção 6.3]
   - Streaming via SSE (mesma arquitetura do /chat)
   - Se o gestor quiser que Claude leia o relato bruto:
     a. Exibir alerta: "Isso concederá ao assistente acesso ao conteúdo
        completo do relato. Confirmar?"
     b. Ao confirmar: gravar audit_log com action: 'ai_full_access_granted'
     c. Incluir o texto do relato no contexto do Claude apenas nessa sessão

2. Painel do assistente na Visão Geral:
   - Painel lateral com alertas proativos gerados pelo Claude
   - A Function analisa os cases abertos da org e gera insights:
     "3 casos de assédio moral nos últimos 30 dias — padrão atípico"
     "2 casos próximos do prazo de 30 dias"
   - Atualizado uma vez por dia (Firebase Scheduled Function)
   - Resultado cacheado em orgs/{org_id}/ai_insights

3. Tela de Relatórios:
   Rota: /app/relatorios
   - Lista de relatórios com status (rascunho/aprovado/exportado)
   - Filtros de período para relatório padrão (todos os planos)
   - Relatório personalizado: apenas Gestão e Enterprise
   - Botão "Gerar relatório do mês" (aciona a Function de geração)
   - Visualização do relatório gerado (antes de aprovar)
   - Botão "Aprovar e exportar como PDF"
   - Botão "Solicitar revisão" (volta para status rascunho)

4. Firebase Scheduled Function para geração de relatórios mensais:
   - Executa no dia 1 de cada mês às 06:00 (horário de Brasília)
   - Para cada org com plano Gestão ou Enterprise:
     a. Agrega dados do mês anterior do Firestore
     b. Chama Claude com o prompt da seção 6.4 do PRD
     c. Grava o relatório em reports/{reportId} com status 'rascunho'
     d. Envia e-mail para o admin com link para revisão
   - NUNCA incluir conteúdo de relatos individuais no relatório — apenas métricas

5. Exportação de relatório em PDF:
   - Usar biblioteca 'pdf-lib' ou 'puppeteer' (Firebase Functions suporta)
   - Layout: cabeçalho com logo da org, período, métricas, texto do Claude
   - Rodapé: "Gerado pelo Portal Sigilo em [data]"
   - Download autenticado via signed URL temporário

[Cole aqui as seções 6.3 e 6.4 completas do PRD]
```

### Checklist de validação — Fase 6

- [ ] Abra o detalhe de um case com plano Gestão
  → painel do assistente aparece ao lado
- [ ] Pergunte ao assistente sobre o caso → responde com base nos metadados
- [ ] Verifique que o assistente NÃO menciona o texto bruto do relato
- [ ] Clique "Conceder acesso ao relato completo" → alerta de confirmação
  → Após confirmar: audit_log com 'ai_full_access_granted'
- [ ] Para plano Entrada → painel do assistente NÃO aparece
- [ ] Na tela de relatórios: clique "Gerar relatório" → aguarde → relatório aparece como rascunho
- [ ] Exporte o relatório em PDF → download funciona
- [ ] O PDF NÃO contém texto de relatos individuais, apenas métricas

**Atualizar CLAUDE.md:** marcar Fase 6 como concluída.

---

## Fase 7 — Integração WhatsApp

### Objetivo
Integrar o WhatsApp Business API ao fluxo de coleta.
O número central é do Portal Sigilo — não da empresa-cliente.
Esta fase tem a regra de anonimato mais crítica: nunca armazenar
o número do usuário em texto puro.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 7 — Integração WhatsApp.
Fases 1–6 concluídas.
Leia CLAUDE.md e docs/SECURITY.md.
CRÍTICO: O número de WhatsApp do denunciante NUNCA é armazenado em texto puro.
conversation_id = SHA-256(numero_do_usuario)
```

### Prompt principal
```
Implemente a Fase 7 — Integração WhatsApp.

PRÉ-REQUISITO: Configure as variáveis de ambiente:
WHATSAPP_API_URL, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN,
WHATSAPP_VERIFY_TOKEN (para verificação do webhook)

TAREFAS:

1. Endpoint de verificação do webhook (GET):
   Rota: /api/webhook/whatsapp
   - WhatsApp envia: hub.mode, hub.verify_token, hub.challenge
   - Verificar hub.verify_token === process.env.WHATSAPP_VERIFY_TOKEN
   - Se válido: responder com hub.challenge
   - Se inválido: retornar 403

2. Endpoint de recebimento de mensagens (POST):
   Rota: /api/webhook/whatsapp
   Firebase Function: functions/src/webhook-whatsapp.ts
   - Verificar assinatura HMAC-SHA256 do payload (X-Hub-Signature-256)
   - Extrair o número do remetente da mensagem
   - IMEDIATAMENTE calcular conversation_id = SHA-256(numero)
   - Descartar o número original — NUNCA gravar em variável persistente
   - Buscar ou criar sessão em whatsapp_sessions usando conversation_id
   - Passar mensagem para a lógica de processamento

3. Lógica de fluxo da sessão WhatsApp:
   Estado da sessão (campo 'status' em whatsapp_sessions):
   'novo' → 'aguardando_empresa' → 'aguardando_unidade' (se Enterprise)
   → 'coletando' → 'finalizado'

   Estado 'novo': enviar mensagem de boas-vindas do Portal Sigilo
   Estado 'aguardando_empresa':
   - Usuário enviou texto → buscar org pelo nome ou slug
   - Se encontrar 1 org: confirmar com o usuário (enviar nome + pergunta)
   - Se encontrar múltiplas: listar as primeiras 5 e pedir escolha
   - Se não encontrar: pedir código de acesso (slug)
   Estado 'aguardando_unidade' (apenas Enterprise):
   - Listar unidades da org selecionada e pedir escolha numérica
   Estado 'coletando':
   - Encaminhar mensagem para Firebase Function /chat (mesma da Fase 3)
   - Passar historico_ia da sessão como contexto
   - Responder ao usuário com a resposta do Claude
   - Ao detectar case_created: atualizar sessão para 'finalizado',
     enviar protocolo por mensagem

4. Suporte a mídia no WhatsApp:
   - Receber mensagens de mídia (image, video, audio, document)
   - Para cada mídia:
     a. Baixar o arquivo da API do WhatsApp usando o media_id
     b. Verificar mime type real (usar biblioteca 'file-type')
     c. Verificar tamanho (máx 50 MB)
     d. Se válido: fazer upload para Firebase Storage via Admin SDK
        Path: orgs/{org_id}/cases/temp/{conversation_id}/{uuid}/{filename}
     e. Associar ao relato em andamento na sessão
   - Tipos aceitos: image/jpeg, image/png, image/webp,
     video/mp4, audio/mpeg, audio/ogg, application/pdf
   - Se inválido: responder ao usuário com mensagem clara de erro

5. Envio de mensagens de saída:
   - Criar helper sendWhatsAppMessage(to, text) em functions/src/whatsapp-client.ts
   - Usar API do WhatsApp: POST /messages com to, type, text
   - Retry automático em caso de falha (máx 3 tentativas, backoff exponencial)
   - Gravar audit_log para cada mensagem enviada

6. Limitação por plano:
   - Se org tem plano 'entrada': responder com mensagem
     "Este canal está disponível pelo portal web: portalsigilo.com.br/[slug]"
   - NÃO iniciar fluxo de coleta

[Cole aqui a seção 4.2 completa do PRD]
```

### Checklist de validação — Fase 7

**Segurança do número de telefone (crítico):**
- [ ] Após enviar uma mensagem pelo webhook (use Postman/curl com payload simulado):
  Busque em todo o Firestore pelo número do teste
  → Deve encontrar **zero ocorrências do número em texto puro**
- [ ] Verifique que `whatsapp_sessions/{id}` tem `conversation_id` como hash,
  não o número

**Fluxo completo:**
- [ ] Use o ambiente de sandbox do WhatsApp Business API
- [ ] Envie uma mensagem → recebe boas-vindas
- [ ] Digite nome da empresa → recebe confirmação
- [ ] Converse até o fim do relato → recebe protocolo
- [ ] O Case aparece no dashboard com canal_origem: 'whatsapp'

**Mídia:**
- [ ] Envie uma imagem válida pelo WhatsApp → aparece como anexo no case
- [ ] Envie um arquivo inválido → recebe mensagem de erro no WhatsApp

**Webhook:**
- [ ] GET na verificação com token inválido → 403
- [ ] POST com assinatura HMAC inválida → 403 (segurança contra spoofing)

**Atualizar CLAUDE.md:** marcar Fase 7 como concluída.

---

## Fase 8 — App Mobile (React Native / Expo)

### Objetivo
Construir o app para Android e iOS espelhando o portal web,
incluindo a Tela 0 de seleção de empresa.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo — App Mobile.
Stack: React Native com Expo (SDK 51+), TypeScript.
Fase atual: 8 — App Mobile.
Fases 1–7 concluídas (web e Functions prontos).
Leia CLAUDE.md e docs/SECURITY.md.
O app é PÚBLICO — nenhuma autenticação do denunciante.
```

### Prompt principal
```
Implemente a Fase 8 — App Mobile (React Native / Expo).

INICIALIZAÇÃO:
npx create-expo-app mobile --template expo-template-blank-typescript
cd mobile
npx expo install expo-router expo-secure-store expo-file-system
npx expo install expo-document-picker expo-image-picker expo-av
npx expo install @react-native-async-storage/async-storage

TAREFAS:

1. Estrutura de navegação:
   - Usar Expo Router com file-based routing
   - Stack navigator com as seguintes rotas:
     / → Tela 0 (seleção de empresa)
     /[slug] → Tela 1 (home da empresa)
     /[slug]/chat → Tela 2 (chatbot)
     /[slug]/confirmacao → Tela 3 (protocolo)
     /[slug]/acompanhar → Tela 4 (acompanhamento)

2. Tela 0 — Seleção de empresa:
   - Busca de empresa idêntica ao portal web
   - Usar a mesma API Firebase (coleção orgs)
   - Armazenar org_id e unit_id no estado de navegação (não em storage)

3. Telas 1–4:
   - Espelhar o comportamento do portal web
   - Usar componentes React Native nativos (não web components)
   - A lógica de negócio (chamadas Firebase, /chat endpoint) é compartilhada

4. Envio de anexos no app:
   - Tela 2: botão de câmera/galeria usa expo-image-picker
   - Tela 2: botão de documento usa expo-document-picker
   - Gravação de áudio: expo-av com botão dedicado de gravar/parar
   - Validação de tipo e tamanho antes do upload
   - Progress bar durante upload

5. Push Notifications anônimas:
   - Usar Expo Push Notifications
   - AO CRIAR UM CASE: solicitar permissão de notificação
   - Se concedido: armazenar o token de push em cases/{caseId}/push_tokens[]
     O token NÃO é vinculado a nenhum dado pessoal
   - Ao mudar status do case (Function): enviar push via Expo Push API
   - Mensagem: "Seu relato foi atualizado. Abra o app para ver."
   - Ao abrir via notificação: ir direto para Tela 4 com o protocolo

6. Armazenamento seguro do protocolo:
   - Usar expo-secure-store para salvar protocolos localmente
   - Chave: 'saved_protocols'
   - Valor: array JSON de { protocolo, slug, data }
   - Na Tela 0: botão "Meus protocolos salvos" lista os protocolos locais
   - Biometria opcional para abrir a lista (Face ID / impressão digital)

7. Modo offline (protocolo):
   - Salvar último status consultado em AsyncStorage
   - Quando offline: exibir último status com aviso "Sem conexão — dados podem estar desatualizados"

[Cole aqui a seção 4.3 completa do PRD]
```

### Checklist de validação — Fase 8

- [ ] `npx expo start` → app abre sem erros
- [ ] Fluxo completo em simulador iOS (Mac) ou Android Emulator
- [ ] Envie uma foto tirada na hora pelo chat → aparece no dashboard
- [ ] Grave um áudio e envie → aparece no dashboard
- [ ] Receba uma notificação push ao mudar status no dashboard
- [ ] Salve um protocolo e verifique no expo-secure-store
- [ ] Ative biometria para protocolos → funciona no simulador
- [ ] Coloque o app offline (modo avião) → exibe último status com aviso

**Atualizar CLAUDE.md:** marcar Fase 8 como concluída.

---

## Fase 9 — Checkout e Gestão de Planos

### Objetivo
Integrar o Asaas para pagamentos. Ao confirmar o pagamento,
a org é criada automaticamente e o admin recebe acesso.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 9 — Checkout e gestão de planos.
Fases 1–8 concluídas.
IMPORTANTE: Usar modo sandbox do Asaas para desenvolvimento.
Variáveis: ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN
```

### Prompt principal
```
Implemente a Fase 9 — Checkout e gestão de planos.

TAREFAS:

1. Página de planos em portalsigilo.com.br/planos:
   - Exibir os 3 planos (Entrada, Gestão, Enterprise)
   - Toggle anual/mensal com preços dinâmicos
   - Plano Gestão destacado como "Mais escolhido"
   - Botão "Contratar" para Entrada e Gestão
   - Botão "Falar com especialista" para Enterprise (link para WhatsApp/e-mail)
   - Ao clicar "Contratar": formulário com nome, e-mail, nome da empresa, CNPJ

2. Firebase Function /create-checkout:
   - Recebe: { plano, nome_empresa, email, cnpj, periodo (anual|mensal) }
   - Valida CNPJ (dígitos verificadores)
   - Cria cliente no Asaas (POST /customers)
   - Cria assinatura no Asaas (POST /subscriptions) com:
     - billingType: CREDIT_CARD ou PIX
     - cycle: MONTHLY ou YEARLY
     - value: conforme o plano e período
     - nextDueDate: hoje + 1 dia
   - Retorna URL do checkout do Asaas (campo hostedUrl da resposta)
   - Redirecionar o usuário para o checkout do Asaas

3. Firebase Function /webhook-asaas (POST):
   Rota: /api/webhook/asaas
   - Verificar autenticidade via header token do Asaas
   - Processar evento 'PAYMENT_CONFIRMED':
     a. Buscar assinatura no Asaas para obter os dados da org
     b. Criar documento na coleção orgs com:
        plano_ativo, slug (gerado do nome da empresa),
        data_inicio, data_renovacao, asaas_subscription_id
     c. Criar usuário admin em Firebase Auth (e-mail + senha temporária)
     d. Criar documento em users/{uid} com role: 'admin', org_id
     e. Enviar e-mail de boas-vindas com link de primeiro acesso
        e instruções para trocar a senha
     f. Gravar audit_log da criação da org
   - Processar evento 'PAYMENT_OVERDUE':
     a. Atualizar org com status: 'inadimplente'
     b. Bloquear acesso ao dashboard (middleware verifica status da org)
     c. Enviar e-mail de aviso ao admin
   - Processar evento 'SUBSCRIPTION_DELETED':
     a. Atualizar org com status: 'cancelado'
     b. Manter dados por 90 dias (período de carência para reativação)

4. Controle de limites em runtime:
   - Firebase Function /check-limits (chamada antes de ações críticas):
     a. Criar usuário: verificar count(users where org_id = X)
     b. Upload de arquivo: verificar storage utilizado
     c. WhatsApp: verificar se plano inclui o canal
   - Se limite excedido: retornar 403 com código de erro específico
   - UI deve tratar esses códigos com mensagem orientativa e link para upgrade

5. Tela de upgrade de plano (no dashboard):
   - Em /app/configuracoes/plano
   - Exibir plano atual e opções de upgrade
   - Botão "Fazer upgrade" chama /create-checkout com o novo plano
   - Ao confirmar no Asaas: webhook atualiza plano_ativo no Firestore

[Cole aqui a seção 8 completa do PRD]
```

### Checklist de validação — Fase 9

- [ ] Acesse /planos → 3 planos exibidos com preços corretos
- [ ] Toggle anual/mensal → preços atualizam corretamente
- [ ] Preencha o formulário de contratação → redireciona para Asaas sandbox
- [ ] Complete o pagamento no sandbox do Asaas
- [ ] Webhook recebido → org criada no Firestore Emulator
- [ ] E-mail de boas-vindas recebido com link de acesso
- [ ] Login com as credenciais recebidas → acesso ao dashboard
- [ ] Verifique que o plano_ativo está correto na org
- [ ] Simule evento PAYMENT_OVERDUE no sandbox → acesso bloqueado
- [ ] Verifique controle de limite de usuários (tente criar além do limite)

**Atualizar CLAUDE.md:** marcar Fase 9 como concluída.

---

## Fase 10 — Enterprise (Multi-unidade, White-label, ESG, 0800)

### Objetivo
Implementar todas as funcionalidades exclusivas do plano Enterprise.

### Contexto para colar no início da sessão
```
Projeto: Portal Sigilo.
Fase atual: 10 — Enterprise.
Fases 1–9 concluídas.
Esta fase só ativa para orgs com plano_ativo: 'enterprise'.
```

### Prompt principal
```
Implemente a Fase 10 — Enterprise.

TAREFAS:

1. Multi-unidade:
   - Seção em Configurações para gerenciar unidades (CRUD da coleção units)
   - Cada unit tem: nome, responsavel_id, criado_em
   - Ao criar usuário gestor Enterprise: pode limitar ao escopo de uma unit
   - Dashboard consolidado em /app: seletor "Todas as unidades" ou unit específica
   - Mapa comparativo de risco entre unidades (heatmap)
   - Relatório consolidado: agrega dados de todas as units

2. White-label:
   - Configurações em /app/configuracoes/white-label
   - Campos: domínio próprio, cor primária, cor secundária, logo
   - Ao salvar: atualizar orgs/{org_id}/configuracoes.white_label
   - Middleware Next.js: verificar se o domínio da requisição corresponde
     a alguma org com white-label configurado
   - Se sim: usar as configurações de cor e logo dessa org no portal

3. Relatórios ESG:
   - Indicadores GRI S-OWN-2 (canais de denúncia) e G-GOV-2 (ética):
     S-OWN-2: número de casos reportados, % resolvidos, tempo médio de resolução
     G-GOV-2: existência e funcionamento do canal, cobertura de colaboradores
   - Seção "ESG" na tela de Relatórios
   - Geração automática semestral (março e setembro — alinhado à Lei 14.611/23)
   - Exportação em formato aceito por auditores (PDF estruturado)
   - Dados sempre anonimizados conforme LGPD

4. Canal 0800:
   - Integração com provedor de telefonia (Twilio Voice ou similar)
   - Fluxo de URA simples: saudação → selecionar empresa/unidade → relatar
   - Gravação da chamada transcrita por IA (Whisper API ou similar)
   - Transcrição processada como texto pelo chatbot Claude
   - Protocolo enviado por SMS ao final da chamada (sem vincular ao número)
   - ATENÇÃO: o número do chamador NÃO é armazenado (usar ID anônimo da sessão)

5. Gerente de conta no painel admin:
   - Seção em /app em "Suporte Enterprise"
   - Nome, foto e contato direto do gerente de conta
   - Botão de agendamento de reunião (link Calendly ou similar)
   - Histórico de reuniões e ações combinadas

[Cole aqui as seções 5.3 e 10 do PRD]
```

### Checklist de validação — Fase 10

- [ ] Crie uma org Enterprise e configure 3 unidades
- [ ] Gestor da Unidade A NÃO vê cases da Unidade B
- [ ] Admin da org vê cases de todas as unidades
- [ ] Dashboard consolidado mostra métricas de todas as unidades
- [ ] Configure white-label com domínio e cor → portal exibe as configurações
- [ ] Relatório ESG gerado com indicadores GRI S-OWN-2 e G-GOV-2
- [ ] Simule chamada 0800 (sandbox Twilio) → case criado sem número armazenado

---

## Checklist Final — Antes de ir para produção

> Execute tudo antes do primeiro cliente real.

### Segurança
- [ ] Auditoria completa: `grep -r "sk-ant\|ANTHROPIC_API_KEY" src/app/` → zero resultados
- [ ] Auditoria completa: buscar número de telefone em texto puro no Firestore → zero resultados
- [ ] Todas as Firestore Rules revisadas por um segundo par de olhos
- [ ] Teste de penetração básico: tentar acessar dados de outra org com token válido
- [ ] Variáveis de ambiente de produção diferentes das de desenvolvimento
- [ ] Firebase App Check ativado (bloqueia requisições de origens não autorizadas)

### LGPD
- [ ] Política de Privacidade publicada em portalsigilo.com.br/privacidade
- [ ] Termo de Uso publicado em portalsigilo.com.br/termos
- [ ] DPO indicado (nome e contato publicados conforme LGPD art. 41)
- [ ] TTL de audit_logs configurado para 20 anos
- [ ] TTL de cases configurado para 5 anos (arquivamento)
- [ ] Processo de resposta a requisições de titulares (art. 18 LGPD) documentado
- [ ] Processo de notificação à ANPD em caso de incidente (art. 48 LGPD) documentado

### Performance
- [ ] Lighthouse no portal público → Performance >= 90
- [ ] LCP < 2s medido no Vercel Analytics
- [ ] Funções Firebase com cold start < 1s (usar warm-up se necessário)

### Monitoramento
- [ ] Firebase Crashlytics ativo no app mobile
- [ ] Alertas de erro no Firebase Functions (Cloud Monitoring)
- [ ] Alerta se webhook do Asaas falhar (pagamento sem ativação de org)
- [ ] Alerta se triagem automática falhar consecutivamente

### Legal
- [ ] Verificar conformidade com Lei 14.457/22: canal anônimo ✓, acompanhamento ✓
- [ ] Verificar conformidade com NR-1: registros por 20 anos ✓, risco_psicossocial ✓
- [ ] Verificar conformidade com Lei 14.611/23: categoria discriminacao_salarial ✓
- [ ] Verificar conformidade com LGPD: criptografia ✓, sem dados identificadores ✓

---

## Dicas para trabalhar com o Claude Code como desenvolvedor júnior

### 1. Se o Claude Code parar no meio do código
Cole este prompt:
```
Você parou antes de terminar. Continue exatamente de onde parou,
sem repetir o que já foi gerado. Comece do ponto onde interrompeu.
```

### 2. Se o código gerado tiver um erro que você não entende
Cole o erro completo e use:
```
Recebi este erro ao executar o código que você gerou:
[cole o erro aqui]

Explique o que causou o erro e corrija-o.
```

### 3. Se perceber que o código violou uma regra de segurança
Use:
```
O código gerado viola a regra [número da regra] do SECURITY.md.
Especificamente: [descreva o problema].
Corrija sem mudar outras partes do código.
```

### 4. Se quiser entender um trecho de código antes de aceitar
Use:
```
Antes de implementar, explique em português simples o que este código faz,
quais os riscos de segurança que ele previne e como eu testaria manualmente
que ele está funcionando corretamente.
```

### 5. Para fazer backup antes de mudanças grandes
```bash
# Antes de iniciar uma fase nova ou mudança grande:
git add -A && git commit -m "fase-[N]: checkpoint antes de [descrição]"
```

### 6. Se algo der muito errado
```bash
# Voltar ao último commit estável:
git checkout .
```

---

*Portal Sigilo · Guia de Implementação v1.0 · Abril 2026*
*Para uso com Claude Code · Atualizar CLAUDE.md ao final de cada fase*
