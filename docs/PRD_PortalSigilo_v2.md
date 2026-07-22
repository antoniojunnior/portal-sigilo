# PRD — Product Requirements Document

**Portal Sigilo**

Plataforma inteligente de integridade, escuta interna e prevencao de riscos

*Para empresas que agem antes que o silencio vire problema.*

| **Campo** | **Valor** |
| --- | --- |
| **Versao** | 2.0 |
| **Data** | Abril 2026 |
| **Status** | Draft — para uso com Claude Code |
| **Produto** | Portal web + App Android/iOS + WhatsApp + Dashboard |
| **Planos cobertos** | Plano Único |
| **Alteracoes v2** | Tela 0 (boas-vindas + selecao de empresa); anexos em chat e WhatsApp; modelo Firestore multi-tenant validado; marco legal ampliado e certificado |

---

# 1. Visao geral do produto

## 1.1 Proposito

O Portal Sigilo e uma plataforma SaaS de canal de denuncias corporativo com IA, projetada para que empresas ofereçam aos seus colaboradores um espaco seguro, anonimo e acolhedor para relatar irregularidades, assedio, fraudes e outros desvios de conduta.

O produto e multi-tenant: uma unica instancia da plataforma atende dezenas de empresas-clientes (orgs), cada uma com seu portal personalizado, seus gestores e seus casos completamente isolados.

## 1.2 Publico-alvo

| **Perfil** | **Descricao** |
| --- | --- |
| **Empresario / contratante** | Diretor de RH, compliance ou juridico. Decide a compra. Precisa de adequacao legal, gestao de risco e visibilidade organizacional. |
| **Gestor de compliance** | Opera o dashboard. Recebe, faz triagem e acompanha os casos. Precisa de eficiencia e orientacao. |
| **Denunciante** | Colaborador que usa o canal. Precisa de anonimato, simplicidade e confianca de que sera acolhido. |

## 1.3 Marco legal coberto e adequacao certificada

> **Nota:** Esta secao foi revisada com base em pesquisa juridica realizada em abril de 2026. Todas as obrigacoes abaixo foram verificadas em fontes oficiais e publicacoes especializadas.

| **Legislacao** | **Obrigacao principal** | **Impacto direto no produto** |
| --- | --- | --- |
| **Lei 14.457/22 (Art. 23)** | Canal de denuncias obrigatorio com anonimato para todas as empresas com CIPA (mais de 20 empregados). Em vigor desde marco/2023. Multas de ate R$ 6.708,08 por infracao. | Portal de relatos anonimos. Fluxo de acompanhamento por protocolo. Triagem e apuracao documentada. Kit de comunicacao interna (CIPA). |
| **NR-1 (Portaria MTE 1.419/2024 + 765/2025)** | Inclusao obrigatoria de riscos psicossociais (assedio, sobrecarga, metas abusivas) no PGR/GRO. Vigencia educativa desde maio/2025. Fiscalizacao punitiva a partir de 26/05/2026. Aplica-se a TODAS as empresas CLT, independente do porte. | Dados do canal alimentam o PGR. Cada relato e um "evento psicossocial" documentado. Mapa de risco por area viabiliza o inventario de FRPRT. Registros obrigatorios por 20 anos. |
| **Lei 14.611/23 (Dec. 11.795/23)** | Igualdade salarial entre generos. Obrigatorio canal de denuncias para discriminacao salarial. Relatorios semestrais para empresas com 100+ empregados (marco e setembro). Multa de ate 3% da folha salarial + 10x o novo salario. | Categoria especifica para discriminacao salarial no canal. Dados anonimizados para relatorios de transparencia salarial. Aplica-se a empresas com 100+ colaboradores. |
| **LGPD (Lei 13.709/2018, Art. 11 e 46)** | Tratamento de dados pessoais sensiveis exige medidas tecnicas e administrativas. Relatos podem conter dados de saude, orientacao sexual, origem etnica — todos considerados dados sensiveis. Notificacao obrigatoria a ANPD em caso de incidente. DPO recomendado. | Criptografia a nivel de campo no Firestore. Nenhum dado identificador vinculado ao protocolo. Controle de acesso granular. Logs de auditoria. Retencao de 5 anos com TTL. Politica de privacidade exibida no portal. |

> **Atencao:** A NR-1 nao torna o canal de denuncias obrigatorio por si so (isso e obrigacao da Lei 14.457/22 para empresas com CIPA), mas classifica o assedio como risco psicossocial que deve constar no PGR. O Portal Sigilo conecta as duas obrigacoes: cada relato vira um evento documentado que alimenta o ciclo PDCA do GRO.

---

# 2. Arquitetura do sistema

## 2.1 Stack tecnologica

| **Camada** | **Tecnologia e justificativa** |
| --- | --- |
| **Frontend** | Next.js 14 com TypeScript e App Router. Portal publico e dashboard no mesmo projeto, rotas separadas. SSR para SEO do portal. RSC reduz JS enviado ao denunciante. |
| **Backend / BaaS** | Firebase: Firestore para casos e usuarios, Auth para gestores, Storage para anexos, Functions para logica server-side e chamadas Claude. |
| **IA** | Anthropic API — Claude Sonnet 4 (claude-sonnet-4-20250514). Chamadas exclusivamente via Firebase Functions. Nunca expor chave no client. |
| **App mobile** | React Native (Expo) para Android e iOS. Compartilha logica de negocio com o portal web. |
| **WhatsApp** | WhatsApp Business API via provedor homologado (Twilio ou 360dialog). Numero central do Portal Sigilo — nao numero da empresa-cliente. Fluxo de coleta via webhook para Firebase Functions. |
| **Pagamentos** | Asaas: checkout e assinaturas recorrentes. Webhook atualiza plano_ativo no Firestore. |
| **Estilo** | Tailwind CSS + shadcn/ui para o dashboard. Portal usa CSS modular com identidade propria. |
| **Hospedagem** | Vercel (Next.js) + Firebase (backend). App distribuido via App Store e Google Play. |

## 2.2 Modelo de dados Firestore — multi-tenant validado

A estrutura de colecoes foi projetada para garantir isolamento total entre tenants (orgs) e suportar organizacoes multi-unidade. O campo `org_id` e obrigatorio em todo documento fora da colecao `orgs`.

| **Colecao** | **Descricao e campos principais** |
| --- | --- |
| **orgs** | Organizacao cliente (tenant). `id, nome, slug, plano_ativo, url_canal, logo, dominios_white_label[], criado_em, configuracoes (categorias, boas-vindas, prazo_padrao_dias)`. |
| **units** | Unidade de negocio (organizacoes multi-unidade). `id, org_id, nome, responsavel_id, criado_em`. Cada unit tem gestores proprios e visibilidade isolada de casos. |
| **users** | Gestores. `id, org_id, unit_id (opcional), nome, email, role (admin\|gestor\|auditor), ativo, criado_em`. |
| **cases** | Denuncias. `id, org_id, unit_id (opcional), protocolo, canal_origem (web\|whatsapp\|app\|0800), categoria, urgencia, status, created_at, triagem_ia{}, historico[], mencionados[], anexos[]{nome,tipo,tamanho,storage_path}`. |
| **messages** | Chat anonimo por caso. `id, case_id, org_id, autor (sistema\|denunciante\|gestor), texto, timestamp, anexos[]{nome,tipo,storage_path}`. |
| **audit_logs** | Log imutavel. `id, org_id, user_id, acao, case_id, detalhes, timestamp`. Retencao obrigatoria: 20 anos (NR-1). |
| **reports** | Relatorios. `id, org_id, unit_id (opcional), periodo, gerado_em, texto_claude, aprovado, exportado, tipo (padrao\|personalizado\|esg)`. |
| **whatsapp_sessions** | Sessoes WhatsApp. `id, conversation_id (hash do numero — nao numero em si), org_id, unit_id, case_id (apos criacao), status, historico_ia[], created_at`. O numero do usuario NUNCA e armazenado em texto puro. |

> **Nota:** Compatibilidade multi-unidade: a colecao `units` e subordinada a `orgs` via `org_id`. Cases podem ter `unit_id` opcional. No dashboard, queries filtram por `org_id` e, quando aplicavel, por `unit_id`. O Firestore suporta este modelo nativamente sem necessidade de subcollections. Indices compostos necessarios: `cases(org_id, status, created_at)` e `cases(org_id, unit_id, status)`.

## 2.3 Seguranca e LGPD — regras criticas

> **Nota:** Todas as regras abaixo sao nao-negociaveis. Implementar antes de qualquer feature.

| **Regra** | **Implementacao** |
| --- | --- |
| **Chave Anthropic no server** | Nunca exposta ao browser. Toda chamada passa por Firebase Functions. |
| **Anonimato do denunciante** | Protocolo gerado com UUID v4. Nenhum IP, device fingerprint, cookie de sessao ou numero de telefone vinculado ao caso no Firestore. |
| **Hash do numero WhatsApp** | O campo `conversation_id` armazena apenas o hash SHA-256 do numero do usuario — nunca o numero em texto puro. Nao e possivel reverter para identificar o denunciante. |
| **Isolamento multi-tenant** | Firestore Rules garantem que `org_id` e obrigatorio em toda query. Um tenant nunca le dados de outro. |
| **Isolamento multi-unidade** | Firestore Rules aplicam filtro adicional por `unit_id` para gestores com escopo de unidade. |
| **Bloqueio de mencionados** | Se `user_id` aparece em `case.mencionados[]`, bloquear acesso ao caso automaticamente via Firestore Rules. |
| **Log de auditoria imutavel** | Toda acao no dashboard grava em `audit_logs`. Nenhum documento de `audit_log` pode ser alterado ou excluido (Firestore Rules bloqueiam update e delete). |
| **Retencao de dados** | Cases arquivados apos 5 anos. Audit logs retidos por 20 anos (NR-1). Implementar TTL diferenciado por tipo de documento. |
| **Criptografia em repouso** | Textos de relatos armazenados com criptografia a nivel de campo antes de gravar no Firestore. |
| **Validacao de anexos** | Mime type validado no server (Firebase Function) — nunca confiar no Content-Type enviado pelo client. Tipos aceitos: `image/jpeg, image/png, image/webp, video/mp4, video/quicktime, audio/mpeg, audio/ogg, audio/webm, application/pdf`. Tamanho maximo: 50 MB por arquivo, 200 MB por caso. |
| **Contexto para IA** | O assistente de gestao recebe metadados do caso, nao o texto bruto do relato, salvo decisao explicita do gestor com registro em audit_log. |
| **ANPD — incidentes** | Em caso de incidente de seguranca com dados pessoais, notificar a ANPD conforme art. 48 da LGPD. Implementar rotina de deteccao e alerta interno. |

---

# 3. Planos e limites por tenant

Cada organizacao tem um campo `plano_ativo` no Firestore. As Firebase Functions e as Firestore Rules aplicam os limites em runtime.

| **Recurso** | **Plano Único** |
| --- | --- |
| **Preco** | R$ 1.164/ano (parcelamento em até 12x sem juros) |
| **Usuarios gestores** | Até 50 |
| **Armazenamento** | 2 GB |
| **SLA suporte** | 4h úteis |
| **Portal web** | Sim |
| **WhatsApp nativo** | Não (Fase 7 pendente) |
| **App Android/iOS** | Não (Fase 8 pendente) |
| **Canal 0800** | Não (Fase 10 pendente) |
| **Triagem por IA** | Sim |
| **Alertas críticos** | Sim |
| **Assistente IA gestor** | Sim |
| **Mapa de risco** | Sim |
| **Relatorios personalizados** | Sim |
| **Relatorios ESG** | Não (Fase 10 pendente) |
| **Multi-unidade** | Não (Fase 10 pendente) |
| **White-label** | Não (Fase 10 pendente) |
| **Gerente de conta** | Não (Fase 10 pendente) |

---

# 4. Portal do denunciante

Aplicacao publica acessivel sem autenticacao. URL padrao: `portalsigilo.com.br/[slug-da-empresa]`. Enterprise usa dominio proprio via white-label. Disponivel como portal web, app mobile e WhatsApp.

## 4.1 Telas e fluxo

### Tela 0 — Boas-vindas e selecao de empresa (NOVA)

> **Nota:** Esta tela e obrigatoria por se tratar de uma plataforma multi-tenant. O denunciante acessa `portalsigilo.com.br` (sem slug) e precisa identificar a empresa antes de prosseguir.

| **Elemento** | **Especificacao** |
| --- | --- |
| **URL de entrada** | `portalsigilo.com.br` — sem parametros de empresa. Alternativa: QR Code / link direto ja com slug (`portalsigilo.com.br/empresa-x`) pula esta tela. |
| **Mensagem de boas-vindas** | Texto fixo institucional do Portal Sigilo. "Este e um canal seguro e sigiloso. Encontre a empresa para continuar." |
| **Campo de busca** | Input de texto com busca por nome da empresa ou codigo de acesso (slug). Debounce de 300ms. Minimo de 3 caracteres para acionar busca. |
| **Resultado da busca** | Lista de orgs ativas com nome e logo (se configurado). Maximo 10 resultados. Ordenado por relevancia de busca. |
| **Acesso por codigo** | Campo alternativo para inserir codigo de acesso fornecido pela empresa (o slug). Resolve diretamente sem busca. |
| **Sem empresa encontrada** | Mensagem: "Nao encontramos essa empresa. Verifique o codigo fornecido ou use o QR Code do seu local de trabalho." |
| **Selecao de unidade** | Se a org e Enterprise com multi-unidade, exibir segundo passo: lista de unidades da empresa. Obrigatorio selecionar antes de avancar. |
| **Anonimato** | Esta tela nao registra nenhum dado do usuario. Nenhum cookie, nenhum log de acesso vinculado a identidade. |
| **Saida** | Apos selecionar empresa (e unidade se Enterprise): redireciona para Tela 1 com `org_id` e `unit_id` na sessao de navegacao (nao em cookie persistente). |

### Tela 1 — Entrada da empresa (Home do canal)

| **Elemento** | **Especificacao** |
| --- | --- |
| **Headline** | Configuravel pelo admin da org. Default: "Este e um espaco seguro para voce ser ouvido." |
| **Logo da empresa** | Exibida no topo se configurada pelo admin. Tamanho maximo: 200x60px. |
| **Nome da unidade** | Se Enterprise multi-unidade, exibir nome da unidade selecionada. Permite voltar para selecionar outra unidade. |
| **CTA principal** | Botao "Contar o que aconteceu" — leva ao chatbot. |
| **CTA secundario** | Botao "Como funciona?" — abre modal explicativo com garantias de anonimato e funcionamento. |
| **Campo de protocolo** | Input formatado (ETK-AAAA-XXXXXX) + botao "Acompanhar" — leva a Tela 4. |
| **Garantias visuais** | Tres icones fixos: Anonimato garantido / Sem identificacao pessoal / Gestao independente. |
| **Rodape** | Conformidade: Lei 14.457/22, NR-1, LGPD. Texto "Canal operado pelo Portal Sigilo." |
| **Sem rastreamento** | Nenhum cookie de analytics ou fingerprint nesta pagina. |

### Tela 2 — Chatbot de coleta (com suporte a anexos)

| **Elemento** | **Especificacao** |
| --- | --- |
| **Interface** | Tela de chat. Bolhas, input de texto, indicador de digitacao. Badge "Anonimo" fixo no topo. |
| **Progresso** | Barra de progresso discreta indicando etapa da coleta. |
| **IA** | Claude conduz a conversa. Verbo "contar" ou "falar" — nunca "denunciar" — na interface. |
| **System prompt** | Ver secao 6.1. Nunca solicita nome, CPF ou dado identificador. |
| **Respostas rapidas** | Sugestoes de resposta em formato de pills para facilitar o inicio da conversa. |
| **Envio de anexos** | Botao de clipes no input. Suporta: imagens (jpg, png, webp), videos (mp4, mov), audios (mp3, ogg, webm), documentos (pdf). Tamanho maximo: 50 MB por arquivo. |
| **Validacao de anexos** | Validacao de mime type no server (Firebase Function) antes de aceitar upload para o Storage. Rejeita tipos nao permitidos com mensagem clara. Scan de malware via Cloud Virus Scanning se disponivel. |
| **Preview de anexos** | Imagens exibem thumbnail. PDFs exibem nome e tamanho. Audios exibem player simples. Videos exibem thumbnail do primeiro frame. |
| **Limite de anexos** | Maximo de 10 arquivos por relato. Total de 200 MB por caso. |
| **Upload progress** | Barra de progresso por arquivo. Possibilidade de cancelar upload em andamento. |
| **Finalizacao** | Claude detecta completude do relato e apresenta resumo para confirmacao antes de gravar. |
| **Saida** | Caso gravado no Firestore com status "aguardando_triagem". Redireciona para Tela 3. |

### Tela 3 — Confirmacao e protocolo

| **Elemento** | **Especificacao** |
| --- | --- |
| **Protocolo** | UUID v4 formatado como ETK-AAAA-XXXXXX. Exibido em fonte monoespaçada de destaque. |
| **Aviso** | "Guarde este numero. Nenhum dado seu esta vinculado a ele. Sem ele, nao e possivel acompanhar este relato." |
| **Timeline** | Recebido / Em apuracao / Conclusao. Status atual destacado. |
| **Prazo informativo** | "Voce receberá um retorno em ate 30 dias." |
| **CTAs** | "Acompanhar pelo protocolo" e "Voltar ao inicio". |
| **Download** | Botao para salvar o comprovante em PDF simples com protocolo, data e informacoes de contato do canal. |

### Tela 4 — Acompanhamento por protocolo (com suporte a anexos)

| **Elemento** | **Especificacao** |
| --- | --- |
| **Entrada** | Input de protocolo com mascara ETK-AAAA-XXXXXX + validacao de formato. |
| **Exibicao** | Status atual, historico de movimentacoes (sem conteudo do relato), mensagens do gestor. |
| **Chat anonimo** | Campo para o denunciante responder perguntas do comite, mantendo anonimato. Suporta envio de anexos adicionais (mesmos tipos e limites da Tela 2). |
| **Anexos no chat** | Denunciante pode enviar novos arquivos em resposta a perguntas do gestor. Validacao identica a Tela 2. |
| **Atualizacoes** | SSE (Server-Sent Events) para atualizacao em tempo real do status. Fallback: polling a cada 30s. |

## 4.2 WhatsApp — fluxo de coleta revisado

> **Nota:** O denunciante entra em contato com o NUMERO DO PORTAL SIGILO — nao com o numero da empresa-cliente. O Portal Sigilo opera um unico numero WhatsApp Business API centralizado para todas as orgs.

| **Etapa** | **Descricao** |
| --- | --- |
| **Trigger** | Colaborador envia qualquer mensagem para o numero central do Portal Sigilo no WhatsApp. |
| **Boas-vindas** | Mensagem automatica: apresentacao do Portal Sigilo, garantia de anonimato, instrucoes de uso. |
| **Selecao de empresa** | Claude pergunta o nome ou codigo da empresa. Faz busca na colecao orgs e confirma com o usuario. Se nao encontrar, orienta sobre QR Code ou codigo de acesso. |
| **Selecao de unidade** | Se a org e Enterprise multi-unidade, Claude apresenta lista de unidades e solicita selecao antes de prosseguir. |
| **Confirmacao** | Claude confirma empresa e unidade (se aplicavel) antes de iniciar a coleta. |
| **Coleta** | Claude conduz a conversa via webhook. Cada mensagem vai para Firebase Function que chama Claude com historico completo e retorna proxima mensagem. |
| **Envio de anexos** | Denunciante pode enviar imagens, videos, audios e documentos PDF diretamente no WhatsApp. Firebase Function baixa a midia da API do WhatsApp, valida o mime type, re-faz upload para o Firebase Storage e vincula ao caso. |
| **Validacao de anexos** | Mime types aceitos: `image/jpeg, image/png, image/webp, video/mp4, audio/mpeg, audio/ogg, application/pdf`. Maximo 50 MB por arquivo. Arquivos invalidos retornam mensagem de erro clara ao usuario. |
| **Sessao e anonimato** | Sessao identificada por `conversation_id = SHA-256(numero_whatsapp)`. O numero nunca e armazenado em texto puro no Firestore. |
| **Finalizacao** | Claude detecta completude, gera o JSON estruturado, grava o caso e envia o protocolo por texto. |
| **Limitacao de plano** | Disponivel apenas nos planos Gestao e Enterprise. Plano Entrada responde com mensagem informando que o canal e pelo portal web. |

## 4.3 App mobile (React Native / Expo)

| **Item** | **Especificacao** |
| --- | --- |
| **Telas** | Espelha o portal web: Tela 0 (selecao empresa), Tela 1 (home), Tela 2 (chatbot), Tela 3 (confirmacao), Tela 4 (acompanhamento). |
| **Autenticacao** | Nenhuma. O app e completamente publico, como o portal. |
| **Selecao de empresa** | Identica a Tela 0 do portal. Busca e selecao de empresa/unidade antes de iniciar. |
| **Envio de anexos** | Acesso a galeria de fotos/videos e gravador de audio nativo. Documentos via seletor de arquivos. Mesma validacao e limites do portal. |
| **Push notifications** | Opcional: notificacao de atualizacao de status para quem optou por receber (via token anonimo sem vinculo ao protocolo, exceto por opt-in explicito do usuario). |
| **Biometria** | Opcional: bloqueio do historico de protocolo salvo via biometria local (Face ID / impressao digital). |
| **Offline** | Cache do protocolo localmente para consulta sem conexao. Fila de envio de mensagens offline. |
| **Distribuicao** | App Store (iOS) e Google Play (Android). Nome: "Portal Sigilo" ou white-label para Enterprise. |
| **Plano** | Disponivel apenas nos planos Gestao e Enterprise. |

---

# 5. Dashboard gerencial

Aplicacao autenticada via Firebase Auth. Acesso restrito a usuarios com role `admin`, `gestor` ou `auditor`, vinculados ao `org_id`. Rotas: `app.portalsigilo.com.br` ou subdominio white-label no Enterprise.

## 5.1 Autenticacao e perfis de acesso

| **Role** | **Permissoes** | **Restricoes** |
| --- | --- | --- |
| **admin** | Tudo: casos, relatorios, configuracoes, usuarios, plano, unidades. | Bloqueado de casos onde e mencionado. |
| **gestor** | Ver e atualizar casos atribuidos. Usar assistente IA. Exportar relatorios. | Nao acessa configuracoes nem usuarios. Bloqueado se mencionado. |
| **auditor** | Somente leitura: casos encerrados e relatorios aprovados. | Nao interage com casos abertos. |

## 5.2 Telas do dashboard

### Tela — Visao geral (Home)

| **Componente** | **Especificacao** |
| --- | --- |
| **Metricas principais** | 4 cards: Casos no periodo / Em aberto / Resolvidos / Tempo medio de resolucao. Comparativo vs periodo anterior. |
| **Lista de casos recentes** | Ultimos 10 casos com: indicador de urgencia (cor), titulo da categoria, protocolo, status, data. Clique abre detalhe. |
| **Mapa de risco por area** | Grid de celulas coloridas (verde/amarelo/vermelho) por departamento. Disponivel a toda org com assinatura ativa. |
| **Grafico de categorias** | Barras horizontais com distribuicao de tipos de denuncias nos ultimos 6 meses. |
| **Assistente IA** | Painel lateral com alertas proativos e input para perguntas. Disponivel a toda org com assinatura ativa. |
| **Filtro de periodo** | Seletor de data no topo. Default: mes atual. |

### Tela — Lista de casos

| **Componente** | **Especificacao** |
| --- | --- |
| **Filtros** | Status, categoria, urgencia, periodo, responsavel, canal de origem, unidade (Enterprise). |
| **Ordenacao** | Por urgencia (default), data, prazo restante. |
| **Colunas** | Indicador urgencia / Canal / Categoria / Protocolo / Responsavel / Status / Data / Dias em aberto. |
| **Busca** | Por numero de protocolo. |
| **Exportacao** | CSV e PDF da lista filtrada. Disponivel a toda org com assinatura ativa. |
| **Paginacao** | Padrao 10 itens por pagina. Opcoes: 20 e 50. |

### Tela — Detalhe do caso

| **Componente** | **Especificacao** |
| --- | --- |
| **Header** | Protocolo, canal de origem, categoria, urgencia (badge colorido), data de criacao, prazo restante. |
| **Triagem IA** | Card com: categoria detectada, subcategoria, urgencia (1-5), lei aplicavel, area de risco, recomendacao. Disponivel a toda org com assinatura ativa. |
| **Historico** | Timeline de movimentacoes: criacao, mudancas de status, atribuicoes, notas. |
| **Chat anonimo** | Interface de mensagens com o denunciante. Historico completo. Input para nova mensagem. Suporte a upload de arquivos pelo gestor para o denunciante responder. |
| **Visualizacao de anexos** | Lista de arquivos enviados pelo denunciante. Preview inline para imagens. Download autenticado para todos os tipos. Player de audio/video inline. |
| **Responsavel** | Dropdown para atribuir a um gestor. Bloqueado se o usuario e mencionado. |
| **Status** | Dropdown: Aguardando triagem / Em apuracao / Pendente de informacao / Encerrado sem infracao / Encerrado com acao. |
| **Prazo** | Input de data. Alerta visual se proximo do vencimento (5 dias). |
| **Notas internas** | Campo de texto livre visivel apenas a gestores. Nao compartilhado com denunciante. |
| **Assistente IA** | Chat contextual ao lado. Metadados do caso (nao relato bruto). Disponivel a toda org com assinatura ativa. |

### Tela — Relatorios

| **Componente** | **Especificacao** |
| --- | --- |
| **Relatorio padrao** | Todos os planos. PDF com metricas do periodo selecionado. |
| **Relatorio personalizado** | Disponivel a toda org com assinatura ativa. Filtros por categoria, area, status, periodo, canal de origem. |
| **Geracao automatica mensal** | Claude gera texto executivo. Gestor revisa e aprova antes de exportar. |
| **Relatorio ESG** | Apenas Enterprise. Indicadores GRI S-OWN-2 e G-GOV-2 gerados automaticamente. |
| **Historico** | Lista de relatorios com status (rascunho/aprovado/exportado). |

### Tela — Configuracoes (admin)

| **Secao** | **Campos** |
| --- | --- |
| **Perfil da organizacao** | Nome, logo, slug, URL do canal, categorias de denuncia ativas (incluindo discriminacao salarial para conformidade Lei 14.611/23), texto de boas-vindas. |
| **Usuarios** | Lista, adicionar, editar role, desativar. Limite por plano aplicado na UI e na Function. |
| **Comite** | Atribuicao de categoria a responsavel padrao. Prazo default por categoria. |
| **Notificacoes** | E-mail de alerta por urgencia. Webhook opcional. |
| **Plano e faturamento** | Plano atual, data de renovacao, link para portal Asaas. |
| **White-label** | Apenas Enterprise. Dominio proprio, cores primarias, logo no portal. |
| **Endomarketing** | Download do kit de comunicacao interna (PDF, QR Code, imagens para cartaz e tela de TV corporativa). |

## 5.3 Multi-unidade (Enterprise) — estrutura validada

> **Nota:** A estrutura de colecoes descrita na secao 2.2 comporta integralmente a operacao multi-unidade. Cases com `unit_id` ficam visveis apenas para gestores daquela unit. O admin da org ve todos os casos. Indices compostos necessarios estao listados na secao 2.2.

| **Elemento** | **Especificacao** |
| --- | --- |
| **Dashboard consolidado** | Visao agregada de todas as unidades. Filtro por unidade, regiao ou grupo. Apenas admin da org. |
| **Dashboards independentes** | Cada unidade tem gestores proprios que veem apenas seus casos via `unit_id`. |
| **Mapa comparativo** | Heatmap comparando nivel de risco entre unidades. |
| **Relatorio consolidado** | Geracao de relatorio executivo para o grupo inteiro ou por unidade. |
| **Selecao na Tela 0** | Denunciante escolhe a unidade na Tela 0. O `unit_id` e gravado no caso na criacao. |

---

# 6. Integracoes com Claude (Anthropic API)

Todos os pontos de IA chamam Claude Sonnet via Firebase Functions. Nunca diretamente do client. Modelo: `claude-sonnet-4-20250514`. Max tokens: 1500 por triagem, 4000 para relatorios.

## 6.1 Ponto 1 — Chatbot de coleta

### Objetivo

Conduzir a coleta do relato com empatia, em linguagem natural. Nao solicitar dados identificadores. Suportar envio de anexos durante a conversa.

### System prompt — fragmento de referencia

```
Voce e o assistente de escuta do canal de denuncias da empresa {nome_org}{, unidade: {nome_unit}}.
Conduza a conversa com empatia e neutralidade.
Use "contar" ou "falar", nunca "denunciar".
Nao solicite nome, CPF, matricula ou qualquer dado identificador.
Quando o usuario enviar um arquivo, confirme o recebimento e pergunte se quer adicionar mais contexto.
Ao identificar completude do relato, produza um JSON:
{
  categoria,
  subcategoria,
  urgencia (1-5),
  areas_mencionadas[],
  ha_evidencias,
  recorrente,
  descricao_resumida
}
Encerre com acolhimento.
```

### Fluxo tecnico

- Client envia mensagem ou metadados de anexo para Firebase Function `/chat` via POST com historico.
- Anexos sao pre-processados: upload para Storage, geracao de signed URL temporario para referencia na conversa.
- Function chama Claude com system prompt + historico + nova mensagem. Resposta via SSE (streaming).
- Quando Claude retorna JSON estruturado, Function grava caso no Firestore com status `aguardando_triagem`.
- Notificacao enviada para o gestor responsavel pela categoria.

## 6.2 Ponto 2 — Triagem automatica

### Objetivo

Classificar automaticamente o caso via Firestore trigger (`onCreate` na colecao `cases`).

### System prompt — fragmento de referencia

```
Voce e o sistema de triagem de compliance.
Receba o JSON do relato e retorne:
{
  categoria_legal (enum: assedio_moral | assedio_sexual | discriminacao_salarial |
                   discriminacao | fraude | desvio_etico | violacao_lgpd |
                   seguranca_trabalho | risco_psicossocial | conflito_interesses | outro),
  urgencia (1-5),
  lei_aplicavel[] (enum: lei_14457 | nr1 | lei_14611 | lgpd | clt | outro),
  area_risco,
  requer_especialista (boolean),
  resumo_executivo (max 150 chars)
}
Nao invente informacoes.
```

> **Nota:** A categoria `risco_psicossocial` e a lei `nr1` foram adicionadas para atender a NR-1 / Portaria MTE 1.419/2024.

### Fluxo tecnico

- Firestore trigger dispara ao criar documento em `cases`.
- Function chama Claude com o JSON do relato + system prompt.
- Valida e tipifica o retorno JSON antes de gravar.
- Atualiza o documento com `triagem_ia` e muda status para `triado`.
- Se urgencia >= 4: dispara alerta imediato para admin.

## 6.3 Ponto 3 — Assistente para gestores

### Objetivo

Chat contextual no detalhe do caso. Orienta sobre conduta, documentacao e prazos legais.

### System prompt — fragmento de referencia

```
Voce e um assistente de compliance.
Caso: categoria={categoria}, urgencia={urgencia}/5, lei: {leis}, prazo: {dias}d.
Oriente o gestor sobre conduta, documentacao e prazos legais.
Nao invente jurisprudencia.
```

## 6.4 Ponto 4 — Geracao de relatorios executivos

### Objetivo

Firebase Function scheduled (mensal) agrega dados e Claude gera texto executivo. Gestor revisa e aprova.

### Prompt de geracao — fragmento de referencia

```
Dados de {mes}/{ano}: {n_casos} casos, categorias: {lista},
resolvidos: {n_resolvidos}, pendentes: {n_pendentes},
tempo medio: {dias}d, categorias_legais_acionadas: {leis}.

Gere relatorio executivo:
(1) sumario em 3 paragrafos,
(2) analise de tendencias,
(3) alertas de risco com referencia legal,
(4) recomendacoes priorizadas.

Portugues formal, sem jargao.
```

---

# 7. Notificacoes e alertas

| **Evento** | **Destinatario** | **Canal** |
| --- | --- | --- |
| **Novo caso recebido** | Gestor responsavel pela categoria | E-mail + push (app) |
| **Caso com urgencia >= 4** | Admin + gestor | E-mail imediato + alerta no dashboard |
| **Prazo de caso em 5 dias** | Gestor responsavel | E-mail diario |
| **Prazo de caso vencido** | Admin + gestor | E-mail + alerta vermelho no dashboard |
| **Nova mensagem do denunciante** | Gestor responsavel | E-mail + push |
| **Novo anexo recebido** | Gestor responsavel | E-mail com tipo e nome do arquivo |
| **Relatorio mensal gerado** | Admin | E-mail com link para aprovacao |
| **Caso encerrado** | Denunciante (via canal de protocolo) | Mensagem no chat anonimo |
| **Padrao atipico detectado** | Admin (Gestao+) | Alerta no assistente IA do dashboard |

---

# 8. Checkout e gestao de planos

## 8.1 Fluxo de contratacao

1. Usuario acessa `portalsigilo.com.br` e seleciona o plano.
2. Redirecionado para checkout Asaas com os dados preenchidos.
3. Apos pagamento confirmado, webhook Asaas chama Firebase Function `/webhook/asaas`.
4. Function cria documento na colecao `orgs` com `plano_ativo`, `slug`, `data_inicio`, `data_renovacao`.
5. Cria usuario admin inicial e envia e-mail de boas-vindas com link de acesso.
6. Ativacao do portal em 48h via wizard no dashboard.

## 8.2 Controle de limites por plano

| **Limite** | **Implementacao** |
| --- | --- |
| **Usuarios gestores** | Firestore Rule nega criacao de user se `count >= limite do plano`. |
| **Armazenamento** | Firebase Function verifica storage utilizado antes de aceitar upload. Retorna 403 se excedido. |
| **WhatsApp / app** | Firestore Rule e UI bloqueiam acesso se `plano_ativo` nao incluir o canal. |
| **Triagem IA** | Function verifica plano antes de chamar Claude. Plano Entrada: grava sem triagem. |
| **Relatorios personalizados** | UI desabilita opcoes avancadas se plano for Entrada. |
| **Multi-unidade** | Colecao `units` bloqueada por Firestore Rule se `plano != enterprise`. |

---

# 9. Sequencia de construcao recomendada para o Claude Code

> **Nota:** Seguir esta ordem. Nao avancar para a fase seguinte sem que a anterior esteja testada e segura.

| **Fase** | **Entregaveis e criterios de conclusao** |
| --- | --- |
| **Fase 1 — Fundacao** | Next.js 14 com TypeScript. Firebase configurado. Estrutura de colecoes com indices compostos. Firestore Security Rules implementadas e testadas para multi-tenant e multi-unidade. Variaveis de ambiente configuradas (chave Anthropic nunca no client). |
| **Fase 2 — Tela 0 e Portal sem IA** | Tela 0 de selecao de empresa/unidade. Telas 1, 2 (UI), 3 e 4 sem IA. Geracao de protocolo UUID. Layout responsivo (WCAG AA). Suporte a upload de anexos com validacao de mime type no server. |
| **Fase 3 — Chatbot com Claude** | Firebase Function `/chat` com streaming SSE. System prompt de coleta. Deteccao de finalizacao e JSON estruturado. Gravacao no Firestore. Suporte a referencias de anexos na conversa. Testar 20+ cenarios. |
| **Fase 4 — Triagem automatica** | Firestore trigger em `cases.onCreate`. Function com categorias legais atualizadas (incluindo `risco_psicossocial` e `discriminacao_salarial`). Alerta de urgencia. |
| **Fase 5 — Dashboard de gestao** | Firebase Auth com roles. Firestore Rules por role, org_id e unit_id. Telas: visao geral, lista, detalhe, configuracoes. Visualizacao e download de anexos. Bloqueio de mencionados. Audit logs. |
| **Fase 6 — Assistente IA e relatorios** | Chat contextual no detalhe. Relatorio mensal automatico com aprovacao. Exportacao em PDF. |
| **Fase 7 — WhatsApp** | Integracao com provedor WhatsApp Business API. Fluxo de selecao de empresa/unidade via Claude. Suporte a midia (imagens, videos, audios, PDFs). Hash do numero para anonimato. Teste de ponta a ponta. |
| **Fase 8 — App mobile** | React Native com Expo. Telas espelhando portal incluindo Tela 0. Acesso a galeria e gravador de audio. Push notifications anonimas. |
| **Fase 9 — Checkout e planos** | Integracao Asaas. Webhook de pagamento. Criacao automatica de org. Controle de limites. Teste de upgrade e downgrade. |
| **Fase 10 — Enterprise** | Multi-unidade no Firestore. Dashboard consolidado. White-label. Relatorios ESG (GRI S-OWN-2 e G-GOV-2). Canal 0800. Gerente de conta. |

---

# 10. Requisitos nao-funcionais

| **Categoria** | **Requisito** | **Metrica** |
| --- | --- | --- |
| **Performance** | Portal carrega em menos de 2s (LCP) | Vercel Analytics |
| **Performance** | Resposta do chatbot em menos de 1.5s (streaming) | Firebase Functions logs |
| **Performance** | Upload de anexo concluido em menos de 5s para arquivos ate 10 MB | Firebase Storage metrics |
| **Disponibilidade** | Uptime minimo de 99.5% | Firebase + Vercel SLA |
| **Seguranca** | Nenhuma chave secreta no bundle do client | Revisao manual por fase |
| **Seguranca** | Numero do WhatsApp nunca armazenado em texto puro | Auditoria antes do lancamento |
| **LGPD** | Dados do denunciante nao identificaveis | Auditoria de campos antes do lancamento |
| **LGPD** | Retencao de audit_logs por 20 anos (NR-1) | Configuracao de TTL no Firestore |
| **Acessibilidade** | WCAG AA no portal do denunciante | axe DevTools |
| **Escalabilidade** | Suportar 10.000 orgs sem degradacao | Firestore + Functions auto-scaling |
| **Mobile** | Portal responsivo de 320px a 1440px | Teste em dispositivos reais |
| **SEO** | Portal indexavel, robots.txt configurado | Google Search Console |
| **Seguranca de anexos** | Mime type validado no server antes de armazenar | Teste com arquivos de extensao falsa |

---

# 11. Glossario

| **Termo** | **Definicao** |
| --- | --- |
| **Denunciante** | Colaborador que utiliza o canal para fazer um relato. Sempre anonimo. |
| **Relato** | Descricao de um ocorrido feita pelo denunciante. Nunca chamado de "denuncia" na interface do colaborador. |
| **Caso** | Registro interno gerado a partir de um relato. Gerenciado pelo dashboard. |
| **Protocolo** | Identificador unico (UUID v4, formato ETK-AAAA-XXXXXX) que vincula denunciante ao caso sem revelar identidade. |
| **Triagem** | Processo automatico de classificacao do caso por IA apos o relato. |
| **Comite** | Conjunto de gestores responsaveis pela apuracao dos casos. |
| **Mencionado** | Usuario gestor citado no relato. Bloqueado automaticamente de acessar o caso. |
| **plano_ativo** | Campo no Firestore que controla quais features estao disponiveis para o tenant. |
| **Tenant** | Organizacao cliente (org). Todos os dados sao isolados por org_id. |
| **Unit** | Unidade de negocio dentro de uma org Enterprise. Cases podem ser vinculados a uma unit especifica. |
| **Slug** | Identificador textual unico da org na URL (ex: `empresa-abc` em `portalsigilo.com.br/empresa-abc`). |
| **White-label** | Configuracao Enterprise que exibe a marca do cliente no portal, sem mencao ao Portal Sigilo. |
| **FRPRT** | Fatores de Risco Psicossocial Relacionados ao Trabalho. Conceito da NR-1 / Portaria MTE 1.419/2024. |
| **PGR** | Programa de Gerenciamento de Riscos. Documento obrigatorio pela NR-1. |
| **ESG** | Environmental, Social and Governance. Indicadores usados em relatorios de sustentabilidade. |
| **SLA** | Service Level Agreement. Tempo maximo de resposta de suporte por plano. |
| **DPO** | Data Protection Officer. Responsavel pela conformidade com a LGPD. |

---

*Portal Sigilo · PRD v2.0 · Abril 2026 · Para uso com Claude Code*
