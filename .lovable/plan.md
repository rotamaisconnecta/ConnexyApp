# Redesign da Home + novo ícone Connexa

## 1. Substituir o ícone/logo do app

- Registrar o arquivo `Ícone.png` como asset via `lovable-assets` em `src/assets/connexa-logo.png.asset.json`.
- Reescrever `src/components/logo.tsx` para renderizar o novo logo (pin gradiente roxo→rosa + wordmark "connexa") a partir do asset, mantendo a prop `size` e `variant`. Remover o quadrado "R+".
- Atualizar usos que ainda mostram "R+" grande:
  - `src/routes/index.tsx` (splash) — trocar o bloco "R+" pelo logo Connexa.
  - `src/routes/welcome.tsx` — trocar o quadradinho "R+" pelo logo.
  - Onde couber, trocar textos "RotaMais Connecta" por "Connexa" nos títulos visíveis da Home (metadados de SEO podem manter marca atual).

## 2. Redesenhar `/_app/home` inspirada na referência

Manter o `PhoneFrame`, `StatusBar`, `BottomNav` e tokens/utilitários já existentes (`bg-gradient-brand`, `shadow-elegant`, `text-primary`, `bg-accent`, `bg-surface`, etc.). Nada de cores hardcoded.

Nova estrutura vertical (de cima para baixo):

1. **Header**
   - Esquerda: `<Logo />` novo (pin + "connexa").
   - Direita: sino de notificações (com badge) + ícone de mensagens (link para `/connecta` ou lista de chats), ambos em botões redondos `bg-secondary`.

2. **Saudação + clima**
   - Linha 1: "Bom dia, {primeiro nome}! 👋" usando `currentUser.name`, com destaque no nome (`text-primary`).
   - Linha 2: dia da semana + data (pt-BR, via `Intl.DateTimeFormat`).
   - Card à direita: mini widget de clima mock ("28°C · Ensolarado") + bairro/cidade (`São Paulo, SP`) com `ChevronDown`. Layout em grid `grid-cols-[minmax(0,1fr)_auto]` com `min-w-0`/`shrink-0` (regra responsiva).

3. **Busca + atalhos rápidos**
   - Input pill "Para onde vamos hoje?" (visual apenas, sem lógica nova) com ícone `Search`.
   - Chips ao lado: "Casa", "Trabalho", "Outros" (`Home`, `Briefcase`, `MoreHorizontal`).

4. **Grid de ações rápidas (6 ícones circulares)**
   - Pedir corrida → `/rota`
   - Pessoas → `/connecta`
   - Eventos → `/locais` (filtro Eventos, sem alterar rota)
   - Promoções → `/locais`
   - Locais → `/locais`
   - Explorar → `/reels`
   - Cada item: círculo pastel com ícone colorido + label pequena. Reaproveitar `bg-accent`/`text-primary` e variações via `bg-secondary` para variar tons dentro do design system.

5. **Cabeçalho da seção do feed** (⚠️ mudança pedida)
   - Título: **"Pessoas interessantes"** (era "Seu feed contextual").
   - Subtítulo: "Conteúdos selecionados para você, aqui e agora."
   - Link/botão à direita: "Personalizar" com ícone `SlidersHorizontal`.

6. **Cards do feed (ordem)**
   1. **Pessoas interessantes** — card destacando "3 pessoas com interesses em comum perto de você" com 3 avatares de `people` + chips de interesses (Música, Viagens, Cafés) e CTA "Ver pessoas →" para `/connecta`. **Este card vai no topo do feed** conforme pedido.
   2. **Motorista a X min de você** — card com imagem de carro, motorista, preço mock, CTA "Solicitar corrida" → `/rota`.
   3. **Promoção perto de você** — reaproveita `places[0]` (Café Central 20% OFF) no estilo do mockup: imagem à direita, badge "Só hoje!".
   4. **Evento recomendado** — `places[1]` (Festa Sunset), com "amigos vão" (avatares) e CTA "Quero ir".
   5. **Negócio local** — outro item de `places` com desconto e CTA "Ver cardápio".
   - Todos os cards usam `rounded-2xl bg-surface border border-border shadow-soft`, imagens `object-cover`, tipografia `font-display` para títulos.

7. **Rodapé**: mantém `BottomNav` atual (sem mexer nas rotas de navegação nesta fase).

## 3. Fora de escopo (não fazer agora)

- Não alterar backend, tabelas, `mock-data`, rotas de navegação nem `BottomNav`.
- Não trocar fontes globais nem tokens em `src/styles.css`.
- Não substituir marca "RotaMais Connecta" em metadados/SEO globais além do necessário para o header visível.

## Detalhes técnicos

- Novo asset: `src/assets/connexa-logo.png.asset.json` importado como `import connexaLogo from "@/assets/connexa-logo.png.asset.json"` e usado como `<img src={connexaLogo.url} />`.
- `Logo` aceita `size` (altura do pin) e opcionalmente `showWordmark` (default true).
- Data formatada com `new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })`.
- Ícones novos do lucide: `Briefcase`, `MoreHorizontal`, `Ticket`, `Tag`, `Store`, `Compass`, `MessageSquare`, `SlidersHorizontal` (já usados no projeto).
- Manter regra responsiva: linhas com título + widget usam `grid grid-cols-[minmax(0,1fr)_auto]` com `min-w-0` no texto e `shrink-0` nos ícones.
