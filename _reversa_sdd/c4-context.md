# C4 — Nível 1: Contexto — portal-sigilo

> Gerado pelo Architect em 2026-07-20. Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

```mermaid
C4Context
    title Portal Sigilo — Diagrama de Contexto

    Person(denunciante, "Denunciante", "Colaborador/terceiro que relata uma irregularidade. Sem conta, anônimo.")
    Person(gestor, "Gestor de Compliance", "admin | gestor | auditor. Acessa o dashboard da própria org.")

    System(portalSigilo, "Portal Sigilo", "SaaS multi-tenant de canal de denúncias corporativo com IA (Next.js + Firebase)")

    System_Ext(anthropic, "Anthropic API (Claude)", "Chatbot de coleta, triagem automática, assistente de compliance, geração de relatórios executivos e insights")
    System_Ext(asaas, "Asaas", "Gateway de pagamento — checkout, assinaturas, faturas, webhooks de cobrança")
    System_Ext(firebaseAuth, "Firebase Authentication", "Identidade dos gestores (email/senha), session cookies")
    System_Ext(firestore, "Cloud Firestore", "Banco de dados principal, multi-tenant, com Security Rules")
    System_Ext(firebaseStorage, "Firebase Storage", "Armazenamento de anexos de casos")
    System_Ext(mailExt, "Firebase Trigger Email extension", "Envio de e-mails via collection 'mail' (boas-vindas, notificação de relatório)")

    Rel(denunciante, portalSigilo, "Relata caso, acompanha protocolo", "HTTPS")
    Rel(gestor, portalSigilo, "Gerencia casos, relatórios, assinatura", "HTTPS, sessão autenticada")

    Rel(portalSigilo, anthropic, "Prompts de coleta/triagem/assistente/relatório", "HTTPS REST, streaming")
    Rel(portalSigilo, asaas, "Cria link de pagamento, consulta assinatura/faturas, cancela", "HTTPS REST")
    Rel(asaas, portalSigilo, "Webhook de eventos de pagamento/assinatura", "HTTPS POST + token de acesso")
    Rel(portalSigilo, firebaseAuth, "Verifica ID token, cria/revoga session cookie", "Admin SDK")
    Rel(portalSigilo, firestore, "Lê/escreve casos, mensagens, org, usuários, relatórios, audit logs", "Admin SDK (server) + Client SDK (Auth/Storage init) ")
    Rel(portalSigilo, firebaseStorage, "Upload de anexos validados", "Admin SDK")
    Rel(portalSigilo, mailExt, "Enfileira e-mails transacionais", "Firestore write em collection 'mail'")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Personas

| Persona | Papel | Autenticação |
|---|---|---|
| Denunciante | Relata e acompanha um caso | 🟢 Nenhuma — acesso anônimo via protocolo (`ETK-YYYY-XXXXXX`) |
| Gestor `admin` | Administra org, usuários, billing, aprova relatórios | 🟢 Firebase Auth + session cookie |
| Gestor `gestor` | Gerencia casos, gera/aprova/exporta relatórios | 🟢 Firebase Auth + session cookie |
| Gestor `auditor` | Acesso predominantemente leitura (ver `_reversa_sdd/permissions.md`) | 🟢 Firebase Auth + session cookie |

## Sistemas externos

| Sistema | Papel | Confiança |
|---|---|---|
| Anthropic API (Claude) | 4 pontos de integração: chat de coleta, triagem automática, assistente do gestor, geração de relatórios/insights | 🟢 confirmado, 4 chamadas distintas no código |
| Asaas | Checkout, assinatura, faturas, cancelamento, webhook de provisionamento | 🟢 confirmado |
| Firebase Auth/Firestore/Storage | Identidade, banco de dados, armazenamento de arquivos | 🟢 confirmado |
| Firebase Trigger Email extension | Envio de e-mail transacional | 🟡 inferido — coleção `mail` é usada, mas a extensão em si não está configurada em nenhum arquivo lido (`firebase.json` não lista extensions) |

🔴 **LACUNA:** WhatsApp (Fase 7) e app mobile (Fase 8) aparecem no domínio (`WhatsappSession`, `CanalOrigem` incluindo `whatsapp`/`app`/`0800`) mas não têm integração externa implementada — não aparecem neste diagrama de contexto como sistemas ativos.
