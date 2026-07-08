
# Plano: Bio pública "Vibe Card" + Preview de solicitação + Encontros no chat

## Visão geral
Três frentes conectadas, mantendo a proposta de proximidade + descoberta local do app:
1. Nova **página de bio pública** (`/perfil/$id`) rica e inovadora — o "Vibe Card".
2. Tela de **solicitação de chat** ganha botão "Ver perfil" antes de aceitar/recusar.
3. Tela de **chat** ganha painel "Encontrar-se" para sugerir e compartilhar um local de encontro próximo.

O fio inovador: em vez de uma bio estática de rede social, o perfil combina **presença ao vivo** (status atual, humor, música/atividade), **momentos** (posts curtos com foto + texto atrelados a um local do app), e um **"terreno em comum"** calculado (interesses compartilhados + locais/eventos que ambos curtiram). Assim a bio serve à decisão "vale a pena conversar?" antes do aceite.

---

## 1. Modelo de dados (mock)

### `src/lib/mock-data.ts`
Estender `Person` (sem quebrar telas atuais — todos os campos opcionais):

- `handle?: string` — @nome
- `headline?: string` — frase curta ("Café + vinil + caminhadas")
- `mood?: { emoji: string; text: string }` — humor do dia ("☕ modo café")
- `nowPlaying?: { kind: "music" | "reading" | "watching"; title: string; subtitle?: string }`
- `vibeTags?: string[]` — 3–5 tags de vibe ("cinéfilo", "corujão", "explorador de bairro")
- `favoritePlaceIds?: string[]` — referência a `places[]`
- `looksFor?: string[]` — o que busca em conexões ("amizade", "role a dois", "network")
- `stats?: { connections: number; meetups: number; joinedAt: string }`
- `moments?: Moment[]`

Novo tipo:
```ts
type Moment = {
  id: string;
  text: string;
  photo?: string;         // url
  placeId?: string;       // vincula a um local do app
  createdAgo: string;     // "há 2 h"
  likes: number;
};
```

Popular 4 pessoas com dados ricos (Beatriz, Rafael, Juliana, Carlos) e 1–2 com dados mínimos para testar fallback.

Adicionar helper `commonGround(a, b)` em `src/lib/mock-data.ts` (ou `src/lib/people.ts` novo): recebe pessoa + `currentUser`, retorna `{ sharedInterests: string[]; sharedVibe: string[]; distanceHint: string }`.

---

## 2. Página de bio pública — `src/routes/_app.perfil.$id.tsx`

Rota nova. Loader busca `people.find(...)` e faz `notFound()` se não existir.

### Layout (mobile-first, dentro do PhoneFrame)

```
[← voltar]                              [•••]
┌──────────── Vibe Card (hero) ────────────┐
│ foto grande + gradiente da marca         │
│ Nome, idade · @handle                    │
│ Presença: 🟢 online · "Próximo de você"  │
│ Humor do dia: ☕ modo café                │
│ Ouvindo agora: 🎧 "Blonde" — Frank Ocean │
└──────────────────────────────────────────┘

[ Terreno em comum ]  ← chip destacado, animado
 3 interesses · 1 local favorito em comum
 (mostra os itens compartilhados como pills)

[ Sobre ]  headline + bio + looksFor pills

[ Vibe tags ]  chips arredondadas

[ Momentos ]  feed vertical de posts:
  ┌────────────┐
  │ foto/vídeo │  texto curto
  │            │  📍 Café Central · há 2 h · ♥ 12
  └────────────┘

[ Locais favoritos ]  carrossel horizontal reutilizando cards de places

[ Estatísticas ]  linha compacta: conexões · encontros · desde

Sticky footer:
[ Recusar ] [ Iniciar conversa ]   ← só aparece quando entramos via ?from=solicitacao
                                   ← fora do fluxo de solicitação, mostra só "Enviar solicitação"
```

Notas de privacidade: reutilizar `personProximityLabel`/`personProximityRadius` (regra ≤2 km sem distância exata) já existente.

### Componentes novos, sob `src/components/profile/`
- `VibeHero.tsx` — hero com foto, gradiente, presença, humor, nowPlaying.
- `CommonGround.tsx` — bloco que calcula e mostra o "terreno em comum".
- `MomentCard.tsx` — card de momento com foto opcional + local.
- `FavoritePlacesRow.tsx` — reaproveita estilo dos cards de `_app.locais.tsx`.

Todos os textos em pt-BR, mantendo o tom do app.

---

## 3. Solicitação de chat — `src/routes/_app.solicitacao.$id.tsx`
Ajustes mínimos:
- Adicionar botão terciário **"Ver perfil de {nome}"** entre o header e os botões de aceitar/recusar, navegando para `/perfil/$id?from=solicitacao`.
- Mostrar um **preview compacto** já na tela (3 pills de "terreno em comum" + 1 vibe tag) para dar contexto imediato — os detalhes ficam na página de bio.

Não mexer no fluxo de aceitar/recusar existente.

---

## 4. Chat — `src/routes/_app.chat.$id.tsx` — painel "Encontrar-se"

Novo botão no header (ícone `MapPin` ao lado de `Video`/`Phone`) abre um **bottom sheet** "Encontrar-se agora".

Sheet:
```
Encontrar-se com {nome}
Locais próximos a vocês dois:

[ mini MapCanvas com pins do usuário + local sugerido ]

Sugestões (lista):
  ☕ Café Central — 200 m de você
     [ Sugerir aqui ]  [ Ver local ]
  🍔 Burger House — 500 m
     [ Sugerir aqui ]  [ Ver local ]
  🎶 Sunset no Parque — 2,3 km · Hoje 16h
     [ Sugerir aqui ]  [ Ver local ]

[ Compartilhar minha localização atual ]
```

- "Sugerir aqui" envia uma **mensagem do tipo `location`** já existente no chat, com `label = place.name` e `proximity = <distância a partir do usuário>` (reaproveita o renderer `MLocation` que já mostra `MapCanvas` no balão).
- "Ver local" navega para `/local/$id` (rota já existe).
- "Compartilhar minha localização atual" mantém o comportamento atual do botão do composer.
- Também expor um atalho "Encontrar-se" no menu de anexos (`AttachTile` "Encontro") reutilizando o mesmo sheet — descoberta.

Novo componente `src/components/chat/meetup-sheet.tsx` com o bottom sheet + animação (`framer-motion`). Fonte dos locais: `places` de `mock-data.ts`, ordenados por `distanceMeters`.

---

## 5. Ganchos de navegação
- **Home** (`_app.home.tsx`): card do carrossel "Pessoas próximas" fica clicável → `/perfil/$id`. O botão/CTA para conectar continua indo para `/solicitacao/$id`.
- **Connecta** (`_app.connecta.tsx`): tocar no avatar/nome → `/perfil/$id`. O botão "Conectar" continua indo para `/solicitacao/$id`.
- **Chat header**: nome/foto vira link para `/perfil/$id`.

---

## 6. Rota / roteamento
- Novo arquivo `src/routes/_app.perfil.$id.tsx` com `createFileRoute("/_app/perfil/$id")`, `head`, `loader`, `notFoundComponent`, `errorComponent`, `component`.
- Sem mudanças em `__root.tsx` (o TanStack gera o routeTree).

---

## Detalhes técnicos
- Sem backend: todos os dados vêm de `mock-data.ts`. `Moment.likes` pode ter estado local (`useState`) para curtir.
- Motion: reaproveitar padrões existentes (`framer-motion` com entrance suave).
- Estilos: usar tokens semânticos (`bg-gradient-brand`, `bg-accent`, `text-primary`, `bg-surface`, `text-muted-foreground`). Nada de cores hard-coded.
- Privacidade: distância nunca aparece exata para ≤2 km na página de bio nem no sheet de encontros; usar helpers já existentes.
- Acessibilidade: botões com `aria-label`, imagens com `alt`.

## Fora do escopo
- Persistência real, autenticação, backend, envio real de localização.
- Edição da própria bio pelo usuário atual (só leitura de perfis alheios nesta rodada).
- Mudanças em `_app.matching.tsx` (motoristas).

## Validação
1. Home → toque num rosto do carrossel → abre `/perfil/$id` com hero + terreno em comum + momentos.
2. Connecta → toque no card (área do avatar/nome) → abre bio; botão "Conectar" continua indo para solicitação.
3. Solicitação → botão "Ver perfil" abre bio; voltar mantém a solicitação; aceitar leva ao chat.
4. Chat → botão MapPin no header abre sheet "Encontrar-se"; "Sugerir aqui" posta um balão de localização com nome do local.
5. Regra de privacidade ≤2 km continua sendo respeitada em todas as telas de pessoas.
