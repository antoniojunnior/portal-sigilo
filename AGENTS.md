<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Portal Sigilo — Regras do Projeto

## O que é este projeto
SaaS multi-tenant de canal de denúncias corporativo com IA.
Stack: Next.js 14 + TypeScript + Firebase + Anthropic API + Tailwind + shadcn/ui.

## Regras invioláveis de segurança

1. A chave ANTHROPIC_API_KEY NUNCA aparece em código client-side.
   Toda chamada à API Anthropic passa por Firebase Functions ou Route Handlers server-side.

2. O número de WhatsApp do usuário NUNCA é armazenado em texto puro.
   Sempre usar SHA-256(numero) como identificador (campo conversation_id).

3. Todo documento no Firestore (exceto `orgs`) deve ter o campo org_id.
   Toda query ao Firestore deve filtrar por org_id.

4. Gestores listados em cases.mencionados[] NUNCA podem acessar esse caso.
   Regra aplicada em Firestore Rules E na UI.

5. Audit logs são imutáveis. Nenhum documento em audit_logs pode ser
   alterado ou excluído. Firestore Rules bloqueiam update e delete.

6. Validação de mime type de anexos é feita SEMPRE no server (Firebase Function).
   Nunca confiar no Content-Type enviado pelo client.

## Convenções do projeto
- TypeScript estrito (strict: true no tsconfig)
- Componentes em PascalCase, funções em camelCase, arquivos em kebab-case
- Erros sempre tratados com try/catch — nunca silenciados
- Variáveis de ambiente acessadas via src/lib/env.ts (nunca process.env direto)
- Usar conventional commits: feat:, fix:, chore:, security:, refactor:

## Estado das fases
- Fase 1 — Fundação: ✅ concluída
- Fase 2 — Portal sem IA: ✅ concluída
- Fase 3 — Chatbot Claude: ✅ concluída
- Fase 4 — Triagem automática: ✅ concluída
- Fase 5 — Dashboard: ✅ concluída
- Fase 6 — Assistente IA: pendente
- Fase 7 — WhatsApp: pendente
- Fase 8 — App mobile: pendente
- Fase 9 — Checkout: pendente
- Fase 10 — Enterprise: pendente