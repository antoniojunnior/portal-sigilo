# Design Skill — Portal Sigilo
## Referência de execução para todas as decisões de UI/UX do projeto

> Este arquivo deve ficar em `docs/DESIGN_SKILL.md`.
> É referenciado diretamente nos prompts de design passados ao Antigravity.
> Baseado na skill `frontend-design` — adaptado para o contexto do Portal Sigilo.

---

## Princípio fundamental

Este projeto exige interfaces de nível profissional e alto padrão.
Não existe "bom o suficiente" em design aqui. Cada pixel é intencional.
Evite completamente estéticas genéricas de IA ("AI slop").

Antes de escrever qualquer linha de CSS ou JSX, responda:
- **Propósito**: qual problema emocional ou funcional esta tela resolve?
- **Tom**: qual é a emoção que o usuário deve sentir ao abrir esta tela?
- **Diferenciação**: o que vai fazer esta interface ser lembrada?
- **Restrição**: o que NÃO pode aparecer aqui (ruído, distração, genérico)?

---

## Tipografia

Escolha fontes com caráter. Evite completamente:
- Inter, Roboto, Arial, system-ui, -apple-system
- Space Grotesk, Poppins, Nunito (clichês de SaaS)
- Qualquer combinação que você já viu em 10 outros produtos

O que buscar:
- Uma fonte **display** com personalidade editorial para headings —
  algo entre autoridade jurídica e tecnologia de alto padrão.
  Exemplos de território (não copiar): DM Serif Display, Fraunces,
  Playfair Display, Cormorant Garamond, Libre Baskerville.
- Uma fonte **sans-serif** para body e UI com excelente legibilidade
  em tamanhos pequenos e boa performance web.
  Exemplos de território: DM Sans, Instrument Sans, Sora, Plus Jakarta Sans.
- Uma fonte **mono** para protocolos (ETK-AAAA-XXXXXX) e dados técnicos.
  Exemplos: JetBrains Mono, IBM Plex Mono, Fira Code.

Regra absoluta: **todas as fontes via CSS variables** — nunca hardcoded.

---

## Cor e tema

Cores âncora do produto (não substituir, apenas complementar):
- Petróleo: `#2A6070` — cor institucional, autoridade, confiança
- Coral: `#C05A4A` — ação, destaque, calor humano

Construir ao redor dessas cores:
- Escala de tons (light, base, dark) para cada cor âncora
- Superfícies neutras que não competem com as cores âncora
- Sistema de cores semânticas: success, warning, danger para urgência
- Tudo via CSS custom properties — zero valores hardcoded no código

Dark mode: implementar desde o início via `prefers-color-scheme`.
O dashboard em dark mode é especialmente importante.
O portal mantém claro como padrão (mais acolhedor ao denunciante).

---

## Movimento e microinterações

Foco em momentos de alto impacto, não animações espalhadas:

**Portal:**
- Entrada de telas: fade-in com translate-y sutil (200ms ease-out)
- Bolhas do chat: slide-up com fade, stagger de 50ms entre bolhas
- Badge "Anônimo": pulse suave e contínuo — elemento de confiança
- Protocolo na Tela 3: reveal com scale + fade (celebração discreta)
- Upload: barra de progresso com easing natural

**Dashboard:**
- Números dos cards: count-up animado na entrada da página
- Hover em linhas de tabela: highlight com 100ms de transição
- Sidebar collapse: cubic-bezier suave
- Alertas críticos: pulse vermelho discreto, não agressivo

Implementar com Tailwind transitions + CSS animations.
Usar `will-change` apenas onde realmente necessário.

---

## Composição espacial

**Portal do denunciante:**
- Espaçamento generoso — o usuário está em estado de vulnerabilidade
- Padding horizontal mínimo de 24px em mobile
- Elementos bem separados, sem densidade
- Max-width de 480px centralizado

**Dashboard:**
- Densidade moderada — profissional precisa de informação
- Rows de tabela com 52px de altura
- Cards com padding de 20px
- Sidebar com largura de 240px colapsada para 64px (ícones)

---

## O que nunca fazer

- Gradientes roxos em fundo branco
- Cards com `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` padrão
- Border-radius uniforme em tudo (use sistema variado: 4px, 8px, 12px, 24px)
- Ícones genéricos do Heroicons/Lucide sem customização de stroke
- Tabelas sem estados: hover, selected, loading, empty
- Inputs sem: label visível, helper text, error state, focus ring visível
- Telas sem estado vazio desenhado
- Qualquer coisa que pareça um template do Tailwind UI

---

## Acessibilidade (não opcional)

- Contraste mínimo 4.5:1 para texto normal (verificar com ferramentas)
- Contraste mínimo 3:1 para texto grande e elementos de UI
- Focus visible em TODOS os elementos interativos — nunca `outline: none` sem alternativa
- Labels associados em TODOS os inputs — nunca placeholder como substituto de label
- Aria-labels em elementos sem texto visível
- Navegação por teclado funcional em todas as telas
- Badge "Anônimo": `aria-label="Sua identidade está protegida"`

---

## Responsividade — prioridades

```
Portal:    xs 320px → sm 480px → md 768px+
Dashboard: md 768px → lg 1024px → xl 1280px+
```

Comportamentos obrigatórios:
- Portal: otimizado para xs/sm, usável em md+
- Dashboard sidebar: drawer em md−, coluna fixa em lg+
- Tabela de casos: scroll horizontal em md−, colunas completas em lg+
- Cards métricas: 1 coluna em xs, 2 em sm, 4 em lg+
- Chat: full-height em mobile, input fixo no bottom
- Modal: full-screen em xs/sm, centered max-width em md+

---

## Verificação antes de considerar concluído

Execute estes comandos e corrija até retornarem zero problemas:

```bash
# Zero cores hardcoded em componentes
grep -r "#[0-9a-fA-F]\{3,6\}" src/components --include="*.tsx" --include="*.css"

# Zero fontes hardcoded
grep -r "font-family:" src/components --include="*.tsx" --include="*.css"

# Zero uso de 'any' no TypeScript
grep -r ": any" src/components --include="*.tsx"
```

Verificações manuais:
- [ ] Abrir portal em 320px — zero elementos cortados
- [ ] Abrir dashboard em 768px — sidebar virou drawer
- [ ] Navegar por teclado em todas as telas — foco sempre visível
- [ ] Verificar contraste das cores com WebAIM Contrast Checker
- [ ] Todo input tem label (não só placeholder)
- [ ] Todos os estados vazios estão desenhados