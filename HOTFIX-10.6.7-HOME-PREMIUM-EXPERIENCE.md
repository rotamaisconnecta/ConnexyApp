# HOTFIX 10.6.7 — Home Premium Experience

## Objetivo

Redesenhar a Home do Connexy como uma experiência premium com 7 seções (Pessoas Próximas, Eventos Próximos, Locais Próximos, Eventos de Hoje, Em Alta, Recomendações e Footer), todas usando um único `PremiumCarousel` compartilhado, cards ~25% maiores, links "Ver tudo" por seção, novas rotas (`/people`, `/events`, `/trending`, `/recommendations`), feed inteligente misto de recomendações/trending e footer visível com padding de safe-area. Nenhum engine foi alterado.

## O que mudou

### Home (7 seções, nesta ordem)

1. **👥 Pessoas Próximas** → `/people` — cards maiores (foto 112%), compatibilidade %, status online/offline, distância via `formatPersonDistance` (esconde distâncias abaixo de 2 km: "Muito perto", "Bem próximo", "Na sua região", "Perto de você").
2. **🎉 Eventos Próximos** → `/events` — cards com banner, participantes e CTA.
3. **📍 Locais Próximos** → `/discover?filter=places` — cards com rating, horário e status aberto/fechado.
4. **📅 Eventos de Hoje** → `/events?today=true` — mesma rota de eventos com toggle Hoje/Próximos.
5. **🔥 Em Alta** → `/trending` — feed misto (eventos, negócios, pessoas, lugares, promoções e publicações) sem repetir cards, com badge de tendência.
6. **💡 Recomendações** → `/recommendations` — feed inteligente misturando restaurantes, promoções, negócios, lugares, eventos patrocinados, hotéis, academias, cinema, bares, lojas, cafeterias e serviços, ranqueado por avaliação + proximidade + pessoas presentes + interesse do usuário + popularidade. Exibe apenas informações existentes (⭐ rating, 📍 distância, 👥 pessoas, 🎁 promo, 🏷 categoria, 🕒 horário).
7. **Footer** — "Connect — Conectando pessoas, lugares e momentos", com padding de safe-area (`env(safe-area-inset-bottom)`) para nunca ser coberto pela bottom nav.

### Componentes

- `PremiumCarousel.tsx`: carrossel compartilhado, reescrito com free-drag (mouse/touch/trackpad), inércia, spring, sem snap-lock, sem bottom bar/contador/indicadores, ~15% de peek do próximo card, cursor grab/grabbing, hover scale 1.03, setas hover no desktop.
- Cards ~25% maiores (foto, padding e tipografia), com animações Framer Motion (fade/scale/slide/hover/elevation). Responsivo: 4 cards desktop, 3 tablet, 2 mobile.
- Toda seção possui título com "Ver tudo" alinhado à direita + ícone de seta.

### Novas rotas

- `/people` — grade de pessoas ranqueadas por compatibilidade/proximidade.
- `/events` (+ `?today=true`) — lista de eventos com toggle Hoje/Próximos.
- `/trending` — grade do feed Em Alta com nota explicativa.
- `/recommendations` — grade do feed inteligente com chips de filtro por categoria.
- `/discover` — suporta `?filter=places` para pré-selecionar o filtro "Locais".

### Arquivos novos

- src/lib/feed/home-premium.ts — tipos `PremiumCard`, labels/emojis por categoria, ranking (`scorePremiumCard`/`rankPremiumCards` com dedup), dados curados e builders de seção (usa apenas `mock-data`, sem engines).
- src/components/feed/cards/premium-card.tsx — renderizador compartilhado de card premium (chips condicionais, badge de tendência, online, compatibilidade).
- src/components/feed/HomePremiumFeed.tsx — composição das 7 seções com animação em cascata.
- src/routes/_app.people.tsx, _app.events.tsx, _app.trending.tsx, _app.recommendations.tsx

### Arquivos alterados

- src/components/carousel/PremiumCarousel.tsx
- src/components/feed/FeedNearbyPeople.tsx / FeedNearbyEvents.tsx / FeedNearbyPlaces.tsx / FeedNearbyBusinesses.tsx / FeedTrending.tsx / FeedRecommendations.tsx / FeedFooter.tsx
- src/routes/_app.home.tsx (usa HomePremiumFeed) / _app.discover.tsx (search `?filter=places`)
- src/routeTree.gen.ts (gerado automaticamente)

## Não alterado

- AI Engine, Feed Engine, Context Engine, Live Engine, Orchestrator, Upload Engine e Role Engine permanecem intactos.

## Validação

- npm run lint (nenhum erro novo; baseline pré-existente mantido)
- npx tsc --noEmit (sem erros)
- npm run build (sucesso)
