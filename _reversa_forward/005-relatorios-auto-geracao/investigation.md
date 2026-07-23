# Investigation: Geração Automática de Relatório ao Acessar a Rota

> Identificador: `005-relatorios-auto-geracao`
> Data: `2026-07-23`

## 1. Pergunta de investigação

O sistema já tem algum padrão de geração automática de relatório que possa ser reaproveitado, ou este é o primeiro caso de "gerar sem clique"?

## 2. Achado: já existe geração automática, mas em outro eixo (scheduled, não client)

`functions/src/scheduledReports.ts` (Cloud Function, cron mensal dia 1 06h BRT) já gera relatório completo do mês anterior automaticamente para orgs elegíveis, grava em `reports` e envia e-mail via extensão Firebase Trigger Email. Ou seja: o sistema já tem precedente de "relatório sem clique humano" — só que disparado por servidor/cron, não pelo acesso à página. Não é reaproveitável diretamente (é uma Cloud Function isolada, sem relação com o `page.tsx`), mas confirma que "relatório existir sem ação manual" já é um padrão aceito no domínio, reduzindo o risco de a mudança ser estranha ao produto.

Fonte: `_reversa_sdd/code-analysis.md#12. cross-cutting`.

## 3. Alternativas avaliadas para o trigger client-side

| Alternativa | Prós | Contras | Descartada por quê |
|---|---|---|---|
| `useEffect` de mount com guarda `useRef` (escolhida, D-01) | Simples, sem dependência nova, controle explícito de "disparei uma vez" | Precisa de teste específico contra duplicação em `StrictMode`/re-render | — |
| Disparar `POST` dentro do `fetcher` do `useSWR` | Reaproveita o hook já existente | `useSWR` re-executa o fetcher a cada `refreshInterval` (60s, já configurado na página) — gerar POST a cada 60s automaticamente é comportamento não pedido pelo requirements e caro (chamada a Claude) | Custo de API e comportamento surpresa |
| Geração automática no servidor (ex.: Route Handler que já retorna relatório pronto no primeiro `GET`) | Centraliza a regra "gera se não existir recente" no backend | Contrato de `GET /api/reports/generate` hoje é síncrono e rápido (lista); transformá-lo em "gera se preciso" o tornaria lento/bloqueante e mudaria a semântica do endpoint existente (efeito colateral em verbo GET) | Viola expectativa de idempotência de GET; RF exige apenas mudança de UI |

## 4. Padrões de código já usados no projeto, reaproveitados aqui

- `useState`/`useCallback` para estado de filtros: já existe integralmente em `page.tsx:66-107`, reaproveitado sem mudança de forma.
- Tratamento de erro com `generateError` (`page.tsx:67, 133-136`): reaproveitado para o fallback silencioso (RF-07), só muda o texto/estilo do banner de erro para "aviso discreto" quando há dado anterior disponível.
- `useSWR` com `refreshInterval: 60000` (`page.tsx:84-88`): mantido sem alteração; a decisão de reaproveitar/gerar roda em cima do `data` que ele já entrega.

## 5. Riscos técnicos levantados na investigação (não cobertos por requirements, virou seção de Riscos do roadmap)

- `StrictMode` do React (dev) monta/desmonta effects duas vezes — guarda por `useRef` precisa sobreviver a isso, não só a re-renders normais em produção.
- Fuso horário do navegador do usuário pode divergir do servidor (Firestore grava em UTC via `admin.firestore.Timestamp`/ISO); janela de "24h" é aproximação client-side, aceitável para este caso de uso (não é regra de compliance crítica, é conveniência de UX).
