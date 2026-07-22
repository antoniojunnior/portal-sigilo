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

### S4 — Isolamento multi-unidade
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