# PHASE 10.6.8 — UX Premium Final + Publisher Experience

## Objetivo

Fechamento da camada de UX do Connexy: navegação inferior universal com 5 slots (Home, Mapa, ➕ Criar, Meu Connexy, Perfil), carrossel premium com profundidade (depth scale) e memória de posição por seção, painel de criação premium com 8 cards grandes, botões universais de mídia (câmera/galeria/vídeo/arquivo) com permissão, multiupload com reordenação, botões PUBLISH com safe-area e toda navegação de retorno apontando para `/home`. Somente camada de UX — nenhum engine foi alterado.

## O que mudou

### Navegação (Bottom Nav universal)

- `src/components/bottom-nav.tsx` reescrito: 5 slots fixos — Home `/home`, Mapa `/discover`, botão central ➕ `/create` (gradiente, `shadow-floating`, ring ativo), Meu Connexy `/my-connexy`, Perfil `/profile`.
- Indicador de item ativo com `motion.span` (layoutId), `aria-current="page"`, safe-area padding inferior, `z-50` fixo.
- `src/routes/_app.tsx`: shell app agora renderiza `<BottomNav />` sem prop; removidos `activeMode`/`getActiveMode`/listener `roleChanged`.
- `src/routes/_app.home.tsx`: removido o pill "Modo Usuário/Modo Motorista" + popover — o seletor de modo agora vive apenas em Perfil; imports limpos.

### Carrossel Premium (profundidade + memória)

- `PremiumCarousel.tsx` com novo prop opcional `section`:
  - Escala de profundidade: card ativo 1.00 (opacity 100%), anterior/próximo 0.96 (85%), demais 0.92 (70%).
  - `LayoutGroup` + `AnimatePresence` + mola; `activeIndex` derivado do scroll via `useMotionValueEvent`; clique abre o detalhe, arrastar continua funcionando.
- Memória de scroll por seção: `localStorage` key `connexy.carousel.position.<section>` (salvo com debounce 200 ms, restaurado no mount).
- Todos os consumidores passam `section`: `people`, `places`, `businesses`, `drivers`, `trending`, `recommendations`, `events-upcoming`, `events-today` (os dois últimos via novo prop `section` em `FeedNearbyEvents` e `HomePremiumFeed`).
- Setas no desktop mantidas.

### Painel de Criação Premium

- `src/routes/_app/create.tsx` reescrito com `CREATE_PANEL` de **8 cards grandes**: 📷 Criar Foto, 🎥 Criar Vídeo, 📝 Criar Texto, 🎉 Criar Evento (EVENT_CREATOR), 🏪 Criar Negócio (BUSINESS), 📍 Criar Local (PLACE_OWNER), 💰 Criar Oferta (BUSINESS), 🎬 Criar Reel — título/emoji/descrição, hover scale, e `RoleActivationModal` para itens com role bloqueada (`requiredRole` + `lockedReason`).
- Removido o grid antigo/animações e o sheet de ações rápidas; `StatusBar` + link de voltar para `/home`.
- `src/routes/_app/create/place-business.tsx` (novo): BusinessForm com nome, chips de categoria, descrição, `UploadMedia` (multiplo, max 5), endereço, horário, telefone, website, visibilidade e `PublisherFooter`.

### Upload / Mídia

- `src/components/upload/UploadSources.tsx` (novo): botões de origem por modo — foto/misto: Tirar foto (capture, `getUserMedia`) + Galeria; vídeo: Gravar vídeo/Escolher vídeo; misto e foto: Arquivo. Inputs ocultos registrados em `inputsRef`; permissão em cache no `localStorage` key `connexy.media.permission.granted`.
- `UploadMedia.tsx`: renderiza `UploadSources` acima do dropzone + `handleMove(id, dir)` para reordenação.
- `UploadGrid.tsx`: setas de reordenação canto inferior direito (sempre visíveis no mobile, hover no desktop), desabilitadas nas pontas, `stopPropagation`.
- Evento e Oferta habilitados com multiupload `mode="photo" multiple maxFiles={5}`.

### Publisher / Retorno

- `PublisherFooter.tsx`: `pb-[calc(5rem+env(safe-area-inset-bottom,0px))]` + `z-20` — botão PUBLISH nunca fica atrás da bottom nav.
- Toda navegação de retorno para `/home` (nunca `/feed`): `usePublisherForm.ts`, `notifications.tsx` (`handleBack`), `NotificationBell.tsx` (mock `redirectTo`).

## Arquivos novos

- src/routes/_app/create/place-business.tsx
- src/components/upload/UploadSources.tsx
- PHASE10.6.8-UX-FINAL.md

## Arquivos alterados

- src/components/bottom-nav.tsx, src/routes/_app.tsx, src/routes/_app.home.tsx
- src/components/carousel/PremiumCarousel.tsx + consumidores de feed (FeedNearby*, FeedTrending, FeedRecommendations, HomePremiumFeed)
- src/routes/_app/create.tsx, src/routes/_app/create/event.tsx, src/routes/_app/create/offer.tsx
- src/components/upload/UploadMedia.tsx, UploadGrid.tsx, index.ts
- src/components/publisher/PublisherFooter.tsx, src/components/publisher/usePublisherForm.ts
- src/routes/_app/notifications.tsx, src/components/notifications/NotificationBell.tsx
- src/routeTree.gen.ts (gerado automaticamente)

## Não alterado

- AI Engine, Live Engine, Orchestrator, Feed Engine, Context Engine, SmartFeed e Role Engine (`roles-engine.ts`) permanecem intactos.

## Validação

- npm run lint (0 erros novos nos arquivos desta fase; baseline pré-existente reduzido de 302 → 193 erros + 17 avisos via prettier --fix)
- npx tsc --noEmit (sem erros)
- npm run build (sucesso; routeTree.gen.ts regenerado com `place-business`)
