# Baseline de Persistência — Connexy (Fase 1C-0)

- **Data:** 2026-09-11
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Escopo:** auditoria de leitura da persistência atual (localStorage, sessionStorage, estado React, Context/Providers, mocks, Supabase). Nenhum código de produção, configuração, migration, banco ou lockfile foi alterado.
- **Regra da fase:** LER → MAPEAR → CLASSIFICAR → DOCUMENTAR. Nenhuma correção foi aplicada.

---

## 1. Objetivo

Antes de qualquer implementação de persistência local (IndexedDB), mapear com evidência de código:

1. O que está em `localStorage` / `sessionStorage`;
2. O que existe somente em estado React e Context/Providers;
3. O que vem de mocks / dados estáticos;
4. Que dados são entidades de negócio e quais são apenas estado de interface;
5. O que precisa sobreviver a um reload;
6. Onde há múltiplas fontes de verdade;
7. Anomalias: chaves órfãs, persistências duplicadas, dados perdidos no reload ou persistidos sem necessidade;
8. Entidades candidatas a IndexedDB temporário e entidades destinadas ao Supabase.

Nenhum problema encontrado foi corrigido nesta fase.

---

## 2. Escopo

- Lidos: `src/lib/**`, `src/hooks/**`, `src/providers/**`, `src/services/**`, `src/repositories/**`, `src/integrations/**`, `src/types/**`, `src/routes/**` (amostragem dirigida por estado/persistência), `src/components/**` (arquivos com armazenamento), `supabase/migrations/**`, `docs/audits/*` (convenção), `package.json`.
- Não alterados: nenhum arquivo de código.

---

## 3. Arquitetura de persistência encontrada

O Connexy é uma aplicação **TanStack Start** (React 19 + Vite + Nitro/SSR) com integração **Supabase**. Existem **três planos de dados** que coexistem:

### 3.1 Camada Supabase (back-end real, opt-in)
- Cliente browser: `src/lib/supabase/client.ts` — criado via `@supabase/ssr` `createBrowserClient`, gated por `VITE_APP_SUPABASE_URL` + `VITE_APP_SUPABASE_PUBLISHABLE_KEY`.
- Cliente server (SSR, por request): `src/lib/supabase/server.server.ts`.
- Repositórios reais (10 em `src/repositories/`) — todos falam com Supabase (tabelas + RPCs). Serviços (12 em `src/services/`) delegam nesses repositórios; `upload.service.ts` usa Storage diretamente.
- Sessão de autenticação: cookies (`sb-auth-token`, via `@supabase/ssr`), **não** em localStorage.
- Schema real nas migrations: `profiles`, `places`, `bio_posts`, `reels`, `reel_likes`, `reel_comments`, `connection_requests`, `connections`, `blocked_users`, `conversations`, `conversation_participants`, `messages`, `user_locations`, `user_presence` + buckets `bio-media`, `reels-media`, `avatars`.
- Realtime: `postgres_changes` em `messages` e `user_presence`.

### 3.2 Camada demo (substituto local de back-end)
- Ativada apenas com `import.meta.env.DEV && VITE_APP_DEMO_MODE === "true"` (`src/lib/demo/demo-config.ts`) — fail-closed em produção.
- Namespace `connexy:demo:` em localStorage: sessão demo, identidade, próprio perfil, posts e um mini-"banco" (`connexy:demo:db`) com conexões, solicitações, conversas, mensagens e grupos.
- Quando o Supabase está **desconfigurado em DEV**, `useAuth` fabrica um usuário mock; quando configurado, usa o fluxo real.

### 3.3 Camada de estado React / módulos-singleton com stores reativas
- Stores de módulo com `useSyncExternalStore` + persistência em localStorage própria: `trip-store.ts` (`connexy_demo_trip`), `ride-blocks.ts` (`connexy_demo_ride_blocks`), `dispatcher-store.ts` (em memória, sem persistência).
- Contexts montados no layout `/_app`: `ContextEngineProvider`, `PresenceProvider` (check-in) e `PresenceProvider` (preferência de presença).
- Mocks estáticos espalhados: `mock-data.ts`, `mock-businesses.ts`, `reel-mocks.ts`/`reel-feed.ts`, `feed-sections.ts`, `home-premium.ts`, `mock-sponsored-content.ts`, `engine-mocks.ts`, `mock-conversations.ts`, plus arrays `MOCK_*` inline em rotas.

### 3.4 IndexedDB (uso já existente)
- `src/lib/reels/reel-local-media-db.ts` — **IndexedDB nativo (sem lib)**: banco `connexy-reels-local-db` (v1), store `media` (keyPath `id`), guarda blobs de vídeo/pôster de Reels publicados localmente. Este é o único uso atual de IndexedDB.

---

## 4. localStorage

Inventário completo de chaves encontradas (leitura dirigida em `src/`; ver também `docs` associadas e `scripts/final-auth-race-check.mjs` em testes, fora de produção).

### 4.1 Namespace demo `connexy:demo:`

| Chave | Arquivo | Conteúdo | Quem grava | Quem lê |
|---|---|---|---|---|
| `connexy:demo:db` | `src/lib/demo/demo-db.ts` | JSON `DemoDB { connections[], requests[], messages[], groups[] }` | `connectUser`, `sendRequest`, `declineRequest`, `createDemoGroup`, `respondToDemoGroupInvite`, `leaveDemoGroup`, `sendLocalMessage`, `sendLocalMediaMessage`, `sendSharedContentMessage`, `resetDemoData` | `isConnected`, `getConnectionsCount`, `getPendingRequests`, `getMessages`, `getConversationLastMessage`, `getDemoGroupsForUser`, `getDemoGroupInvitesForUser`, `hasPendingRequest` (+ hooks reativos em `use-demo-db.ts`) |
| `connexy:demo:identity` | `src/lib/demo/demo-identity.ts` | id da identidade demo (string) | `setDemoIdentity` | `getDemoIdentity` / `useDemoIdentity` |
| `connexy:demo:own-profile` | `src/lib/demo/demo-own-profile.ts` | JSON `DemoOwnProfile` (nome, handle, foto, capa, cidade, bio, interesses, endereços privados, visibilidade) | `saveDemoOwnProfile` | `getDemoOwnProfile` / `useDemoOwnProfile` |
| `connexy:demo:posts` | `src/lib/demo/demo-posts.ts` | JSON `DemoPost[]` (texto + mídia como data-URL) | `saveDemoPost` | `getDemoPosts` / `useDemoPosts` |
| `connexy:demo:authenticated` | `src/lib/demo/demo-auth.ts` | `"1"` (sessão demo) | `enterDemoSession`, `exitDemoSession` (remove) | `isDemoAuthenticated` |
| `connexy:demo:signup-pending` | `src/lib/demo/demo-auth.ts` | `"1"` (onboarding demo em andamento) | `startDemoSignup`, `clearDemoSignup` (remove) | `isDemoSignupPending` |
| `connexy:demo:saved-profile-media` | `src/routes/_app.perfil.index.tsx` | JSON de data-URLs salvos do perfil | rota `/perfil` (toggle salvar mídia) | rota `/perfil` (galeria) |
| `connexy:demo:saved-details` | `src/components/marketplace/local-engagement.tsx` | array de ids de locais salvos | `toggleSaved` (DetailActionBar) | `savedDetailIds` |
| `connexy:demo:recent-reviews:<targetId>` | `src/components/marketplace/local-engagement.tsx` | JSON `LocalReview[]` | `submitReview` (RecentReviewSection) | `RecentReviewSection` (init) |
| `connexy:demo:redeemed-promotions` | `src/components/marketplace/local-engagement.tsx` | JSON `RedeemedPromotion[]` (cupons resgatados) | `redeem` (PromotionRedeemCard) | `PromotionRedeemCard` |
| `connexy:demo:outing-invites` | `src/components/marketplace/local-engagement.tsx` | JSON de convites "ir juntos" | `sendInvite` (InviteTogetherSheet) | leitura ao enviar |

### 4.2 Chaves de domínio/produto

| Chave | Arquivo | Conteúdo | Quem grava | Quem lê |
|---|---|---|---|---|
| `connexy_demo_trip` | `src/lib/mobility/trip/trip-store.ts` | JSON `{ trip: Trip\|null, history: Trip[] }` | `persistAndNotify` (createTrip, transition, patchTrip, markDriverFound, cancelTrip, completeTrip, confirmDriverPayment, recordUnpaidTrip, resetTrip, clearTrip) | `loadState` (boot), `recoverPersistedTripState`/`sanitizeTrip` |
| `connexy_demo_ride_blocks` | `src/lib/mobility/trip/ride-blocks.ts` | JSON `Record<userId, RideBlock>` (inadimplência) | `registerRideBlock`, `clearRideBlock` (futuro) | `getBlockForUser`, `isRideBlocked`, `getRideBlocksSnapshot` |
| `connexy_demo_dispatcher` | `src/lib/mobility/dispatch/dispatcher.ts` | JSON `DemoDispatcherConfig { autoAccept, delayMs }` | `setDemoDispatcherConfig` | `readConfig` (auto-aceite) |
| `connexy_driver_application_v1` | `src/lib/driver/driver-application-storage.ts` | JSON `DriverApplication` (dados do cadastro de motorista) | `saveDriverApplication` | `getDriverApplication`, `isDriverApproved` |
| `connexy_roles` | `src/lib/roles/roles-storage.ts` | JSON `UserRolesState` (roles, activeMode, lastMode, prefs) | `saveRoles`, `setActiveMode`, `addRole`, `removeRole`, `updatePreferences`, `restoreLastMode`, `resetRoles`, `clearRoles` (remove) | `getStoredRoles`, `getRoles`, `getActiveMode`, `getLastMode`, `hasRole` |
| `connexy_context` | `src/lib/context/context-storage.ts` | JSON `ContextState` (role ativo, localização, ambiente, movimento, clima, período, métricas de perto) | `saveContext` (via `refreshContext` do ContextEngine) | `getStoredContext`; `clearContext` (remove) |
| `connexy.presence.preference` | `src/providers/presence/presence-context.tsx` **e** `src/hooks/use-user-presence-control.ts` | `"online"\|"available"\|"dnd"\|"invisible"` | `storePreference` (em ambos os arquivos) | init do estado em ambos os arquivos |
| `connexy.presence.visibility` | `src/lib/presence/presence-privacy.ts` | valor de visibilidade de check-in | `setStoredPresenceVisibility` | `getStoredPresenceVisibility` |
| `connexy.presence.checkins` | `src/lib/presence/presence-privacy.ts` | JSON `PresenceRecord[]` | `savePresenceRecords` (provider de check-in) | `loadPresenceRecords` |
| `connexy_live_events` | `src/lib/live/live-storage.ts` | JSON `LiveEvent[]` (anel, máx. 50) | `storeLiveEvent`, `storeLiveEvents` | `getStoredLiveEvents*`; `clearStoredLiveEvents` (remove) |
| `connexy:reels:likes:v1` | `src/lib/reels/reel-local-storage.ts` | JSON `Record<reelId, boolean>` | `toggleReelLike` | `getReelLikes`, `isReelLiked` |
| `connexy:reels:comments:v1` | `src/lib/reels/reel-local-storage.ts` | JSON `Record<reelId, ReelComment[]>` | `addReelComment`, `toggleCommentLike` | `getReelComments`, `getCommentsForReel` |
| `connexy:reels:sound:v1` | `src/lib/reels/reel-local-storage.ts` | `"on"\|"off"` | `setStoredSoundPref` | `getStoredSoundPref` |
| `connexy:reels:published:v1` | `src/lib/reels/reel-local-storage.ts` | JSON `{ version, items: StoredPublishedReel[] }` | `saveStoredPublishedReel`, `deleteStoredPublishedReel` | `getStoredPublishedReels` |
| `connexy:ai:history` | `src/lib/ai/ai-history.ts` | JSON `AIHistoryEntry[]` (máx. 5000, 90 dias) | `recordAction` | `getHistory*`, cleanups; `clearHistory` (remove) |
| `connexy.mock.blocked-person-ids` | `src/lib/feed/commonalities.ts` | JSON `string[]` | (não encontrado gravador — **leitura apenas**) | `shouldShowNearbyPerson` |
| `connexy.mock.hidden-person-ids` | `src/lib/feed/commonalities.ts` | JSON `string[]` | (não encontrado gravador — **leitura apenas**) | `shouldShowNearbyPerson` |
| `connexy.mock.conversation-invites` | `src/lib/chat/mock-conversation-invites.ts` | JSON `Record<personId, "connected"\|"invited"\|"rejected">` | `writeStoredInvite` | `getConversationInviteStatus`, `readStoredInvites` |
| `connexy:promotion-usage:<userId>:cafe-central-20off` | `src/components/promo-popup.tsx` | JSON `DailyPromoUsage { date, shownPeriods[] }` | `registerImpression` | `readUsage` |
| `connexy.media.permission.granted` | `src/components/upload/UploadSources.tsx` | `"true"` (pedido de permissão já feito) | `requestPermission` | `requestPermission` |
| `connexy.carousel.position.<section>` | `src/components/carousel/PremiumCarousel.tsx` | número (scroll horizontal) | `onScroll` (debounce 200ms) | restore no mount |
| `connexy-carousel-swipe-hint-seen` | `src/lib/carousel/hint.ts` + `src/components/system/swipe-carousel.tsx` | `"1"` (dica já vista) | swipe-carousel | swipe-carousel |

### 4.3 Observações por categoria

- **Negócio persistido em localStorage:** conversas/mensagens/grupos demo, posts demo, perfil demo, likes/commentários de reels, cupons resgatados, avaliações de locais, convites "ir juntos", trip + histórico, ride blocks, drivers (aplicação), eventos ao vivo, histórico do AI engine.
- **Estado de UI/UX persistido sem necessidade de negócio:** `connexy.carousel.position.*`, `connexy-carousel-swipe-hint-seen`, `connexy.media.permission.granted`, `connexy:promotion-usage:*`.
- **Chaves com leitura apenas (prováveis órfãs):** `connexy.mock.blocked-person-ids`, `connexy.mock.hidden-person-ids` — nenhum gravador foi encontrado no código (foram projetadas para bloqueio/ocultamento de pessoas, mas ninguém as escreve hoje).
- **Chave duplicada:** `connexy.presence.preference` é escrita/lida em dois módulos (provider `presence-context.tsx` e hook `use-user-presence-control.ts`), ambos com load/save autônomos — fonte de divergência de preferência de presença.
- **Mídia em localStorage:** `connexy:demo:posts` e `connexy:demo:saved-profile-media` (e mensagens demo com dataUrl) armazenam **data-URLs** no localStorage — risco de estouro de quota (~5MB) documentado nos comentários (`demo-db.ts:370`, `demo-posts.ts`).

---

## 5. sessionStorage

Inventário: **1 única chave** em todo o projeto.

| Chave | Arquivo | Conteúdo | Grava | Lê/remove |
|---|---|---|---|---|
| `connexy:demo:repost-media` (`REPOST_MEDIA_SESSION_KEY`) | `src/lib/types/post.ts` (constante); `src/routes/_app.perfil.index.tsx` (grava); `src/components/post/create-post-form.tsx` (lê+remove) | data-URL da imagem a republicar | rota `/perfil` ao clicar "repost" | formulário de criação de post no mount (consome e remove) |

**Conclusão:** uso estritamente temporário, handoff de UI entre tela → formulário. Nenhuma informação de negócio depende de sessionStorage.

---

## 6. Estado React relevante

### 6.1 Stores de módulo (useSyncExternalStore) com persistência própria
| Store | `src/` | Estado | Persistência | Sobrevive reload? |
|---|---|---|---|---|
| `trip-store.ts` | `mobility/trip` | `{ trip, history }` (corrida demo) | localStorage `connexy_demo_trip` | SIM |
| `ride-blocks.ts` | `mobility/trip` | `Record<userId, RideBlock>` | localStorage `connexy_demo_ride_blocks` | SIM |
| `dispatcher-store.ts` | `mobility/dispatch` | drivers demo, ofertas, assignments (candidato a `RideRequest`, `Offer`, `Assignment`) | **em memória** (nenhuma) | NÃO |

Nota relevante: o `dispatcher-store` guarda o estado operacional da corrida (ofertas, aceite, atribuição de motorista) **sem persistência**. Após reload, `dispatcher.ts` reaproveita `requestRide` apenas para trip "buscando"; ofertas/drivers atendidos não são recriados.

### 6.2 Estado de negócio mantido em componentes (amostra por domínio — representativo, não exaustivo)
| Domínio | Exemplos de estado | Arquivos |
|---|---|---|
| Chat | `participant`, `DemoGroup`, `mediaDraft`, `muted`, `replyTo`, paginação de mensagens | `components/chat/ConnexyChatScreen.tsx`, `conversations-screen.tsx` |
| Reels | `reels`, `likeMap`, `commentMap`, `muted`, `activeIdx`, `shareFor` | `routes/_app.reels.tsx` |
| Marketplace | busca/filtros vindos de `MOCK_BUSINESSES` | `routes/_app/marketplace.tsx` |
| Notificações | lista, filtro, `notification-center` (marca-leitura não persiste) | `routes/_app/notificacoes.tsx`, `routes/_app/notifications.tsx`, `components/notifications/` |
| Presence check-in | `checkins[]`, `visibility`, `feedItems[]`, `notifications[]`, `heatmap[]` | `providers/presence/presence-provider.tsx` |
| Presence realtime | `preference`, `presenceByUser: Map` | `providers/presence/presence-context.tsx` |
| Context Engine | `ContextState`, `recommendations[]` | `lib/context/context-provider.tsx` |
| Auth/onboarding | `draft` de perfil, `interests`, forms multi-etapa | rotas `auth`, `cadastro`, `completar-perfil`, `finalizar-perfil`, `interesses` |
| Feed/Home | seções derivadas do Context + live events | `components/feed/SmartFeed.tsx`, `lib/feed/feed-builder.ts` |

### 6.3 Estado apenas de UI (exemplos verificados)
- `publicationTab`, `selectedMediaIndex`, `openAddress`, `customInterest`, `processingImage` (perfil) — UI.
- `inviteOpen`, `selectedIds`, `accepted`, `showHint`, `overflows` — sheets/carousel.
- `paused`, `activeIdx`, `isActive`, `heartBurst`, `commentsOpen`, `shareOpen` (reels/playback) — UI.
- Flags de loading, toasts, diálogos, tabs, filtros temporários — no geral **não persistem**.

---

## 7. Context/Providers

| Provider | Arquivo | Montado em | Estado | Persistência |
|---|---|---|---|---|
| `QueryClientProvider` | `routes/__root.tsx` | raiz | QueryClient (react-query) | nenhuma |
| `CheckInPresenceProvider` (`usePresence`) | `providers/presence/presence-provider.tsx` | `/_app` | check-ins, visibilidade, feed, notificações, mapa, heatmap (mock-gated) | `connexy.presence.checkins` + `connexy.presence.visibility` (somente quando `MOCK_PRESENCE_ENABLED`) |
| `ContextEngineProvider` (`ContextEngineContext`) | `lib/context/context-provider.tsx` | `/_app` | contexto + recomendações + sugestão de período | `connexy_context` |
| `PresenceProvider` (`usePresenceContext`, realtime) | `providers/presence/presence-context.tsx` | `/_app` | preferência + mapa de presença por user (Supabase Realtime quando configurado) | `connexy.presence.preference` |
| `BrandContext` | `components/ui/brand-context.ts`, `brand-provider.tsx` | **(não encontrado ponto de montagem)** | config estática de marca | nenhuma |
| `RealtimeContext` | `providers/realtime/realtime-provider.tsx` | **(sem mount)** | flag `isConnected` + nós de canal | nenhuma |
| `PresenceProvider` (broadcast) | `providers/realtime/presence-provider.tsx` | **(sem mount)** | presença via broadcast | nenhuma |
| `DialogContext`, `ToastContext`, `SnackbarContext`, `BottomSheetContext` | `providers/system/*` | **(sem mount)** | estado de UI | nenhuma |

Provider-chave para a Fase 1C-1: `PresenceProvider` de check-in é o único que deriva feed/notificações/mapa/heatmap em React state a partir de registros persistidos em localStorage — candidato natural a virar consumers de um repository.

---

## 8. Mocks e dados estáticos

| Fonte | Conteúdo | Telas/fluxos | Natureza |
|---|---|---|---|
| `src/lib/mock-data.ts` | `currentUser` (lucas), `people` (12), `drivers` (3), `places` (4), `suggestions` (3), `notifications` (4), `allInterests` (16), scores/emojis | Home, Pessoas/Connecta, Matching, Locais, Perfis, Notificações, Ride (`currentUser` no dispatcher), Chat | estático/demo |
| `src/lib/marketplace/mock-businesses.ts` | empresas `b1..b6`, eventos `evt-*`, cupons | Marketplace, detalhe de local/oferta | estático/demo |
| `src/lib/reels/reel-mocks.ts` + `reel-feed.ts` | `MOCK_REELS`, montagem de feed | `/reels`, `/reels/$reelId` | estático + localStorage/IDB p/ publicados |
| `src/lib/feed/feed-sections.ts`, `home-premium.ts` | seções de feed premium | Home premium | estático |
| `src/lib/ads/mock-sponsored-content.ts` | anúncios patrocinados | LocalSponsoredFeed | estático |
| `src/lib/engine/engine-mocks.ts` | dados do painel de engine (legado) | `/engine` | estático (legado, não é o engine vivo) |
| `src/lib/chat/mock-conversations.ts` | conversas fictícias | lista de conversas | estático |
| `src/lib/demo/*` | **backends locais completos** (sessão, identidade, perfil, posts, db) | pessoas/connecta, solicitações, chat, perfil, notificações | demo com persistência real em localStorage |
| `local-engagement` + `promo-popup` + `mock-conversation-invites` + `commonalities` | interações simuladas com persistência | detalhe de local, promo de home, cards de pessoa, descoberta | semi-persistidos |

Importante: Nenhuma tela crítica hoje escreve em Supabase fora de payloads condicionais; em demo/DEV o fluxo é 100% local. Os repositórios/Serviços Supabase existem, estão implementados, mas **não são consumidos pelas telas** (a maioria dos hooks `use*` de API está sem importadores — ver §16).

---

## 9. Integrações Supabase relacionadas

- **Clientes:** browser (`lib/supabase/client.ts`) e server/SSR (`lib/supabase/server.server.ts`, por request, com RLS do usuário logado). Camada gerada em `integrations/supabase/` (`client.ts`, `client.server.ts` com `supabaseAdmin` service-role, `auth-middleware.ts`) é **código morto/dormido** (sem importadores ativos).
- **Auth:** `integrations/supabase/auth-attacher.ts` substituído por `lib/supabase/auth-attacher.ts` em `src/start.ts` (middleware de função repassa Bearer). Sessão em cookie.
- **Realtime:** `RealtimeHelper` (postgres_changes), `presence.service.ts`, `use-chat.ts` e `realtime-provider.tsx` (ne­ste último usado apenas quando o provider estiver montado).
- **Storage:** `upload.service.ts` (buckets `avatars`, `bio-media`) e `reel-publish.ts` (bucket `reels-media`). Políticas restringem por pasta do uid (migrations de 2026-08).
- **Repositórios (100% Supabase):** `auth`, `chat`, `connections`, `feed`, `marketplace`, `notification`, `presence`, `profile`, `ride`, `user`.
- **Types:** gerados em `integrations/supabase/types.ts` (6 tabelas tipadas); `types/database/tables.ts` define aliases tipados declarados (inclui tabelas ainda não criadas/descobertas); `views.ts`/`rpc.ts` são stubs.

---

## 10. Entidades identificadas

Baseadas em evidência no código:

1. **Profile/User** — mock `currentUser`, `profiles` (Supabase), `DemoOwnProfile`, rota de onboarding.
2. **Interests** — `allInterests`, `currentUser.interests`, campo `profiles.interests`.
3. **Connection** — `DemoDB.connections`, `connections` (Supabase) + RPCs.
4. **ConnectionRequest** — `DemoDB.requests`, `connection_requests` (Supabase) + RPCs.
5. **Conversation** — derivadas do peer no demo, `conversations` + `conversation_participants` (Supabase), `MOCK_CONNECTED`/`mock-conversations`.
6. **Message** — `DemoDB.messages`, `messages` (Supabase + realtime).
7. **Group** (grupo de conversa) — `DemoDB.groups`; **entidade inferida / sem tabela Supabase clara**.
8. **Notification** — mock `notifications`, geradas no provider de check-in, `notifications` (Supabase).
9. **Ride/Trip** — `trip-store`, `rides` (Supabase via `ride.repository`).
10. **RideRequest/Offer/Assignment** — `dispatcher-store` (em memória); **sem persistência**; futuramente Supabase (RPCs de dispatch não criadas).
11. **Driver** — mock `drivers`, `demo-fleet`, `DriverApplication`; tabela de drivers não encontrada (futuro: `profiles`/role).
12. **RideBlock** — `ride-blocks` (localStorage).
13. **Destination / RouteStop** — parte de `Trip` (demo).
14. **Place** — mock `places`, `places` (Supabase).
15. **FavoritePlace** — `currentUser.favoritePlaceIds` (mock) + `connexy:demo:saved-details`.
16. **Event** — mock eventos marketplace + `events`/`event_users` (Supabase via `marketplace.repository`).
17. **Promotion/Coupon** — mock promoções + `offers`/`coupons` (Supabase) + `connexy:demo:redeemed-promotions`.
18. **Review** — `LocalReview` (localStorage) + join `reviews` (Supabase).
19. **PresenceRecord** (check-in) — `presence-privacy` + `user_presence` (Supabase realtime).
20. **PresencePreference** — `connexy.presence.preference`.
21. **UserPresence (online)** — `user_presence` (Supabase) + provider realtime.
22. **Feed/Post** — `bio_posts` (Supabase), `DemoPost`, `feed-sections`/`SmartFeed`.
23. **Reel** — `reels` (Supabase), `MOCK_REELS`, `StoredPublishedReel`.
24. **ReelLike / ReelComment** — mapas em localStorage + `reel_likes`/`reel_comments` (Supabase).
25. **Business** — `mock-businesses` + `businesses` (Supabase).
26. **LiveEvent** — `live-storage` (localStorage).
27. **AIHistory** — `ai-history` (localStorage).
28. **ContextState** — `context-storage` (localStorage).
29. **Moment** — `moments` (Supabase) + momentos mockados nas pessoas.
30. **Location (user)** — `user_locations` (Supabase); endereços privados no perfil demo.
31. **BlockedUser** — `blocked_users` (Supabase) + chaves `connexy.mock.blocked/hidden-*` (leitura apenas).
32. **OutingInvite** — `connexy:demo:outing-invites`.

---

## 11. Matriz de persistência

| Entidade | Origem atual | Persistência atual | Sobrevive reload? | Precisa persistir? | IndexedDB temporário? | Supabase futuro? | Observações |
|---|---|---|---|---|---|---|---|
| Profile (donos) | mock `currentUser` + `DemoOwnProfile` + `profiles` | localStorage `connexy:demo:own-profile`; Supabase `profiles` | SIM (demo); SIM (Supabase) | SIM | SIM (demo; hoje localStorage) | SIM | `auto perfis` já têm tabela |
| Interests | `allInterests` (mock) + `profiles.interests` | parte do perfil | vê Perfil | SIM | junto do Perfil | SIM | — |
| Connection | `DemoDB.connections` + `connections` (Supabase) | localStorage `connexy:demo:db`; tabela | PARCIAL (demo SIM; real parcial) | SIM | SIM (demo) | SIM | — |
| ConnectionRequest | `DemoDB.requests` + `connection_requests` | localStorage `connexy:demo:db`; tabela | SIM (demo) | SIM | SIM (demo) | SIM | — |
| Conversation | demo (derivada do peer) + `conversations` + `MOCK_CONNECTED` | localStorage `connexy:demo:db`; tabela | SIM (demo) | SIM | SIM (demo) | SIM | múltiplas fontes |
| Message | `DemoDB.messages` + `messages` | localStorage `connexy:demo:db`; tabela + realtime | SIM (demo) | SIM | SIM (demo) | SIM | data-url em localStorage q/mídia |
| Group | `DemoDB.groups` | localStorage `connexy:demo:db` | SIM (demo) | SIM | SIM (demo) | DESCONHECIDO | sem tabela Supabase encontrada |
| Notification | mock + provider check-in + `notifications` | localStorage `connexy.presence.checkins` (derivadas); tabela | PARCIAL | NÃO em localStorage | NÃO | SIM | geradas em memória |
| Ride/Trip | `trip-store` + `rides` | localStorage `connexy_demo_trip`; tabela | SIM (demo) | SIM | SIM (demo) | SIM | inclui histórico |
| RideRequest/Offer/Assignment | `dispatcher-store` | **nenhuma (em memória)** | NÃO | SIM (enquanto fluxo ativo) | SIM (temporário) | SIM | perda no reload hoje |
| Driver (cadastro) | `DriverApplication` | localStorage `connexy_driver_application_v1` | SIM | SIM | NÃO (preferência/doc) | SIM | arquivos são só nomes |
| Driver (frota) | mock `drivers` + `demo-fleet` | em memória | NÃO | NÃO (demo) | NÃO | SIM | — |
| RideBlock | `ride-blocks` | localStorage `connexy_demo_ride_blocks` | SIM | SIM | SIM (demo) | SIM | sem tela de regularização |
| Destination/RouteStop | dentro de `Trip` | localStorage `connexy_demo_trip` | SIM | SIM (fluxo ativo) | SIM (junto da Trip) | SIM | — |
| Place | mock `places` + `places` | estático; tabela seeded | SIM | PARCIAL | NÃO (catálogo) | SIM | catálogo vem do backend |
| FavoritePlace | `currentUser.favoritePlaceIds` + `saved-details` | mock; localStorage | SIM (demo) | SIM (local do usuário) | SIM (demo) | SIM | — |
| Event | mock marketplace + `events` | estático; tabela | SIM | PARCIAL | NÃO | SIM | catálogo backend |
| Promotion/Coupon | mock + `offers`/`coupons` + `redeemed-promotions` | estático; tabela; localStorage | PARCIAL | SIM (resgate local) | SIM (cupons resgatados) | SIM | — |
| Review | `LocalReview` + join `reviews` | localStorage por local; tabela | SIM (demo) | SIM | SIM (demo) | SIM | — |
| PresenceRecord (check-in) | seed mock + provider | localStorage `connexy.presence.checkins` | SIM (mock-on) | PARCIAL | SIM (se mantiver mock) | SIM | feed/notif/mapa são derivados |
| PresencePreference | provider/hook | localStorage `connexy.presence.preference` | SIM | SIM (preferência) | NÃO | SIM | chave duplicada em 2 arquivos |
| UserPresence (online) | Supabase realtime | tabela `user_presence` | NÃO (sessão) | NÃO | NÃO | SIM | estado efêmero |
| Feed/Post | `DemoPost` + `bio_posts` + mocks | localStorage `connexy:demo:posts`; tabela | SIM (demo) | SIM | SIM (demo; mídia) | SIM | — |
| Reel | `MOCK_REELS` + `StoredPublishedReel` + `reels` | localStorage `connexy:reels:published:v1` + **IndexedDB** `connexy-reels-local-db` + tabela | SIM | SIM | **JÁ em IndexedDB** (manter) | SIM | dual-write local+remoto |
| ReelLike/ReelComment | mapas localStorage + tabelas | localStorage `:likes:v1`/`:comments:v1` | SIM (local) | PARCIAL | SIM | SIM | divergências possíveis c/ Supabase |
| Business | `mock-businesses` + `businesses` | estático; tabela | SIM | PARCIAL | NÃO | SIM | catálogo backend |
| LiveEvent | `live-storage` | localStorage `connexy_live_events` (máx 50) | SIM (últimos 50) | PARCIAL (replay recente) | SIM | DESCONHECIDO | anel de replay |
| AIHistory | `ai-history` | localStorage `connexy:ai:history` (máx 5000) | SIM | SIM | SIM | SIM | metadados de interação |
| ContextState | context engine | localStorage `connexy_context` | SIM | PARCIAL (cache curto) | NÃO | DESCONHECIDO | estado derivado/efêmero |
| Moment | mock + `moments` | estático; tabela | SIM | SIM | NÃO (back) | SIM | — |
| UserLocation | `user_locations` | — | NÃO (só remoto) | NÃO | NÃO | SIM | — |
| OutingInvite | marketplace | localStorage `connexy:demo:outing-invites` | SIM (demo) | SIM (demo) | SIM | DESCONHECIDO | — |

Legenda: `PARCIAL` indica que parte da entidade persiste e outra não, ou que persiste apenas em um modo (demo vs real).

---

## 12. Matriz de localStorage

| Chave | Arquivo | Quem grava | Quem lê | Conteúdo | Finalidade | Deve persistir? | Destino futuro |
|---|---|---|---|---|---|---|---|
| `connexy:demo:db` | `lib/demo/demo-db.ts` | connectUser, sendRequest, declineRequest, createDemoGroup, respondToDemoGroupInvite, leaveDemoGroup, sendLocalMessage, sendLocalMediaMessage, sendSharedContentMessage, resetDemoData | getMessages, getPendingRequests, getConnectionsCount, getDemoGroups*, isConnected | DemoDB (conexões, solicitações, mensagens, grupos) | back-end local demo (social/chat) | SIM (demo) | IndexedDB temporário (messages+cônjuges de relacionamento) |
| `connexy:demo:identity` | `lib/demo/demo-identity.ts` | setDemoIdentity | getDemoIdentity/useDemoIdentity | id de identidade demo | troca de identidade em DEV | SIM (demo) | Manter localStorage (DEV) |
| `connexy:demo:own-profile` | `lib/demo/demo-own-profile.ts` | saveDemoOwnProfile | useDemoOwnProfile | DemoOwnProfile | perfil próprio em demo | SIM (demo) | IndexedDB temporário → Supabase `profiles` |
| `connexy:demo:posts` | `lib/demo/demo-posts.ts` | saveDemoPost | useDemoPosts | DemoPost[] (com data-url) | posts do fluxo "Nova publicação" em demo | SIM (demo) | IndexedDB temporário (mídia) → `bio_posts` |
| `connexy:demo:authenticated` | `lib/demo/demo-auth.ts` | enterDemoSession/exitDemoSession | isDemoAuthenticated | flag sessão demo | sessão demo local | SIM (demo) | Manter localStorage (DEV) |
| `connexy:demo:signup-pending` | `lib/demo/demo-auth.ts` | startDemoSignup/clearDemoSignup | isDemoSignupPending | flag onboarding demo | guarda de onboarding demo | SIM (demo) | Manter localStorage (DEV) |
| `connexy:demo:saved-profile-media` | `routes/_app.perfil.index.tsx` | toggleSavedMedia | getSavedProfileMedia | data-URLs salvos | media salvos do perfil | SIM (demo) | IndexedDB temporário |
| `connexy:demo:saved-details` | `components/marketplace/local-engagement.tsx` | DetailActionBar | DetailActionBar | ids de locais salvos | itens salvos (favoritos) | SIM | IndexedDB temporário |
| `connexy:demo:recent-reviews:<targetId>` | `components/marketplace/local-engagement.tsx` | RecentReviewSection | RecentReviewSection | LocalReview[] | avaliações locais | SIM | IndexedDB temporário → `reviews` |
| `connexy:demo:redeemed-promotions` | `components/marketplace/local-engagement.tsx` | PromotionRedeemCard | PromotionRedeemCard | RedeemedPromotion[] | cupons resgatados | SIM | IndexedDB temporário → `coupons`/servidor |
| `connexy:demo:outing-invites` | `components/marketplace/local-engagement.tsx` | InviteTogetherSheet | InviteTogetherSheet | convites "ir juntos" | convites de saída | SIM (demo) | Avaliar (Supabase/rota) |
| `connexy_demo_trip` | `lib/mobility/trip/trip-store.ts` | persistAndNotify (todo o ciclo de Trip) | loadState/recoverPersistedTripState | { trip, history } | corrida demo + histórico | SIM (fluxo ativo) | IndexedDB temporário → `rides` |
| `connexy_demo_ride_blocks` | `lib/mobility/trip/ride-blocks.ts` | registerRideBlock/clearRideBlock | getBlockForUser/isRideBlocked | bloco de inadimplência | impedimento de nova corrida | SIM | IndexedDB temporário → backend |
| `connexy_demo_dispatcher` | `lib/mobility/dispatch/dispatcher.ts` | setDemoDispatcherConfig | readConfig | config de auto-aceite | política demo do dispatcher | SIM (demo) | Manter localStorage (config DEV) |
| `connexy_driver_application_v1` | `lib/driver/driver-application-storage.ts` | saveDriverApplication | getDriverApplication/isDriverApproved | DriverApplication | cadastro de motorista (rascunho) | SIM | Manter localStorage (rascunho) → Supabase |
| `connexy_roles` | `lib/roles/roles-storage.ts` | saveRoles/setActiveMode/addRole/removeRole/updatePreferences/restoreLastMode/resetRoles/clearRoles | getStoredRoles/getRoles/getActiveMode/getLastMode/hasRole | UserRolesState | roles/modo ativo/preferências | SIM (preferência) | Manter localStorage (preferência de sessão/local) |
| `connexy_context` | `lib/context/context-storage.ts` | saveContext (context engine) | getStoredContext | ContextState | contexto do engine | PARCIAL (cache de sessão curto) | Manter localStorage (cache curto) / Avaliar |
| `connexy.presence.preference` | `providers/presence/presence-context.tsx` + `hooks/use-user-presence-control.ts` | storePreference (2 locais) | init de estado (2 locais) | preferência de presença | preferência online/dnd/invisível | SIM (preferência) | Manter localStorage; **eliminar duplicação** |
| `connexy.presence.visibility` | `lib/presence/presence-privacy.ts` | setStoredPresenceVisibility | getStoredPresenceVisibility | visibilidade de check-in | privacidade de check-in | SIM (preferência) | Manter localStorage |
| `connexy.presence.checkins` | `lib/presence/presence-privacy.ts` | savePresenceRecords (provider mock) | loadPresenceRecords | PresenceRecord[] | registros de check-in (mock) | PARCIAL (mock) | IndexedDB temporário (se mantiver mock) → `user_presence` |
| `connexy_live_events` | `lib/live/live-storage.ts` | storeLiveEvent(s) | getStoredLiveEvents* | LiveEvent[] (anel 50) | replay de eventos live | PARCIAL | IndexedDB temporário ou Avaliar |
| `connexy:reels:likes:v1` | `lib/reels/reel-local-storage.ts` | toggleReelLike | getReelLikes/isReelLiked | Record<reelId, bool> | curtidas de reels | SIM (local) | IndexedDB temporário → `reel_likes` |
| `connexy:reels:comments:v1` | `lib/reels/reel-local-storage.ts` | addReelComment/toggleCommentLike | getReelComments | Record<reelId, ReelComment[]> | comentários de reels | SIM (local) | IndexedDB temporário → `reel_comments` |
| `connexy:reels:sound:v1` | `lib/reels/reel-local-storage.ts` | setStoredSoundPref | getStoredSoundPref | "on"/"off" | preferência de som | SIM (preferência) | Manter localStorage |
| `connexy:reels:published:v1` | `lib/reels/reel-local-storage.ts` | saveStoredPublishedReel/deleteStoredPublishedReel | getStoredPublishedReels | { version, items } | reels publicados localmente | SIM | IndexedDB/metadata → Supabase `reels` |
| `connexy:ai:history` | `lib/ai/ai-history.ts` | recordAction | getHistory*/cleanup | AIHistoryEntry[] (5000) | histórico de interações do AI engine | SIM | IndexedDB temporário → Supabase |
| `connexy.mock.blocked-person-ids` | `lib/feed/commonalities.ts` | **— (nenhum gravador encontrado)** | shouldShowNearbyPerson | ids bloqueados (mock) | ocultar pessoa da descoberta | **Avaliar (órfã)** | Avaliar / Remover ou ligar à feature |
| `connexy.mock.hidden-person-ids` | `lib/feed/commonalities.ts` | **— (nenhum gravador encontrado)** | shouldShowNearbyPerson | ids ocultados (mock) | ocultar pessoa da descoberta | **Avaliar (órfã)** | Avaliar / Remover ou ligar à feature |
| `connexy.mock.conversation-invites` | `lib/chat/mock-conversation-invites.ts` | writeStoredInvite | getConversationInviteStatus/readStoredInvites | Record<personId, status> | status de convite de conversa (mock) | PARCIAL | IndexedDB temporário → `connection_requests`/`conversations` |
| `connexy:promotion-usage:<user>:cafe-central-20off` | `components/promo-popup.tsx` | registerImpression | readUsage | DailyPromoUsage | limite de exibição da promo | NÃO (UI/anti-spam) | Manter localStorage (anti-abusivo) |
| `connexy.media.permission.granted` | `components/upload/UploadSources.tsx` | requestPermission | requestPermission | "true" | evita re-pedir permissão de câmera | NÃO (UX) | Manter localStorage (cache de permissão) |
| `connexy.carousel.position.<section>` | `components/carousel/PremiumCarousel.tsx` | onScroll | restore no mount | número (scroll) | posição de carousel | NÃO (UI) | Remover posteriormente ou Manter localStorage |
| `connexy-carousel-swipe-hint-seen` | `lib/carousel/hint.ts`, `components/system/swipe-carousel.tsx` | swipe-carousel | swipe-carousel | "1" | dica "deslize" já vista | NÃO (UI) | Manter localStorage |

---

## 13. Fontes de verdade (duplicidades encontradas)

```text
Profile
 ├── mock `currentUser` (src/lib/mock-data.ts)
 ├── localStorage `connexy:demo:own-profile` (demo)
 ├── Supabase `profiles` (ProfileRepository / onboarding)
 └── estado React de rascunho nas rotas de onboarding/perfil
RISCO: ALTO. Fonte principal hoje: demo (localStorage) quando demo; Supabase quando configurado.

Conversations/Connections
 ├── `connexy:demo:db` (conexões + mensagens demo)
 ├── `MOCK_CONNECTED` (src/lib/chat/mock-conversation-invites.ts)
 ├── `connexy.mock.conversation-invites` (statuses de convite)
 ├── `mock-conversations.ts` (conversas estáticas)
 └── Supabase `conversations`/`connection_requests`/`connections`
RISCO: ALTO. Múltiplos "bancos" simulados + backend real.

Presença
 ├── `connexy.presence.preference` (escrita por 2 arquivos)
 ├── `connexy.presence.visibility` (privacidade de check-in)
 ├── `connexy.presence.checkins` (registros mock)
 └── Supabase `user_presence` (realtime)
RISCO: MÉDIO/ALTO — a mesma chave `connexy.presence.preference` é mantida em 2 módulos independentes.

Descoberta (quem aparece)
 ├── `connexy.mock.blocked-person-ids` / hidden (leitura apenas)
 ├── `connexy.mock.conversation-invites` + `MOCK_CONNECTED`
 └── RPCs `get_nearby_profiles`/`find_pending_request_for_receiver` (Supabase)
RISCO: MÉDIO — regra de exibição depende de várias fontes simuladas.

Reels
 ├── `connexy:reels:published:v1` (metadata local)
 ├── IndexedDB `connexy-reels-local-db` (mídia local)
 ├── `reel-mocks.ts`/`reel-feed.ts` (estáticos)
 └── Supabase `reels` + bucket `reels-media` (dual-write em `reel-publish.ts`)
RISCO: ALTO — dual-write local+remoto com flag `persistence`; sem reconciliação entre elas.

Ride
 ├── `connexy_demo_trip` (Trip + histórico)
 ├── dispatcher-store (em memória: ofertas/atribuição)
 ├── mock `drivers`
 └── Supabase `rides` (RideRepository)
RISCO: MÉDIO — estado operacional do dispatch não persiste; fontes divergem entre modos.

Notifications
 ├── mock `notifications` (mock-data)
 ├── derivadas no provider de check-in (memória/localStorage)
 ├── `notification-center` (estado React)
 └── Supabase `notifications` (NotificationRepository)
RISCO: MÉDIO — 3 a 4 origens não reconciliadas.
```

**Fonte principal por entidade (hoje):**
- Demais entidades sociais/chat: demo/localStorage quando demo; Supabase quando configurado.
- **Fonte principal real:** Supabase (após config) — as telas ainda não consomem repositórios em massa (ver §16).

---

## 14. Dados que NÃO devem ir para IndexedDB

Estados puramente de interface/UX encontrados no projeto:

- `connexy.carousel.position.<section>` — posição de scroll de carousel (PremiumCarousel).
- `connexy-carousel-swipe-hint-seen` — dica "deslize" já vista (swipe-carousel).
- `connexy.media.permission.granted` — cache de permissão de câmera (UploadSources).
- `connexy:promotion-usage:*` — anti-spam de exibição de popup (promo-popup).
- Flags de sessão demo (`connexy:demo:authenticated`, `connexy:demo:signup-pending`) e `connexy:demo:identity` — estado de sessão/DEV, não dados de negócio.
- Preferências (`connexy.presence.preference`, `connexy:reels:sound:v1`, `connexy_roles.preferences`, visibilidade de check-in) — continuam adequadas em localStorage.
- Estado visual geral (tab ativa, modal aberto, filtro temporário, playback paused/active, loading, toast/dialog/snackbar/bottom-sheet) — permanece apenas em memória.

---

## 15. Candidatos a persistência local temporária (IndexedDB)

Para cada item: por que persistir, fluxo dependente, o que deve sobreviver, relacionamentos e substituição futura.

1. **Conversas, mensagens e grupos (demo)** — hoje em `connexy:demo:db`. Fluxo social/chat completo depende de conexões, solicitações, conversas e mensagens sobreviverem ao reload; mensagens com mídia (data-url) estouram o quota do localStorage. Relacionamentos: Message→Conversation→(peer); Group↔participants. Futuro: Supabase `conversations`, `conversation_participants`, `messages`.
2. **Posts do feed (demo)** — hoje em `connexy:demo:posts`. Publicação "Nova publicação" deve sobreviver ao reload; mídia em data-url. Relaciona-se com Profile (autor). Futuro: `bio_posts` + storage.
3. **Profile próprio (demo)** — hoje em `connexy:demo:own-profile`. Edição de perfil deve sobreviver; usado por toda a UI (nome/foto/capa/interesses). Futuro: `profiles`.
4. **Reels publicados (metadata) + mídia** — metadata hoje em `connexy:reels:published:v1`; mídia **já está em IndexedDB** (`connexy-reels-local-db`). Fluxo de publicação de reels depende disso; relação Reel→author/context. Futuro: `reels` + bucket `reels-media`. Manter e estender, não migrar.
5. **Curtidas e comentários de reels** — hoje em `connexy:reels:likes:v1`/`:comments:v1`. Sobrevivem ao reload para alimentar feed/contadores. Relacionam-se com Reel/Profile. Futuro: `reel_likes`/`reel_comments`.
6. **Trip + histórico de corrida (demo)** — hoje em `connexy_demo_trip`. Fluxo /ride/* depende do estado da corrida sobreviver (sanitização já existe). Relaciona Origin/Destino/Driver/Stops/RideBlock. Futuro: `rides`.
7. **RideBlocks** — hoje em `connexy_demo_ride_blocks`. Impede nova corrida até regularização; relação com Trip/User. Futuro: backend de inadimplência.
8. **Estado do dispatcher (ofertas/atribuição) — HOJE PERDIDO no reload** — em memória. Releases: corrida ativa após reload deve restaurar ofertas/motorista. Relaciona Trip/Driver. Futuro: RPCs/dispatch real.
9. **Presença/check-ins (mock)** — hoje em `connexy.presence.checkins`. Mapa/heatmap/feed/notificações derivam disso; lista cresce. Relaciona Place/Event/User. Futuro: `user_presence` + eventos.
10. **Histórico do AI engine** — hoje em `connexy:ai:history` (até 5000). Recomendações dependem do histórico persistido. Relacionado a qualquer entidade (entityId/entityType). Futuro: backend de analytics/AI.
11. **Feed de eventos live** — hoje em `connexy_live_events` (anel 50). Replay de eventos na UI pós-reload. Futuro: protocolo backend (DESCONHECIDO).
12. **Engajamento do marketplace (favoritos/envs, avaliações, cupons, convites "ir juntos")** — hoje em `connexy:demo:*`. Fluxos de detalhe de local dependem de sobreviver; avaliações/cupons relacionam-se com Business/Place. Futuro: `reviews`, `coupons`, backend de convites.

**Não candidatos** (permanecem em localStorage ou somem): preferências de sessão, roles/modo, contexto do engine, driver application (rascunho), configuração do dispatcher, anti-spam/UX flags citados na §14.

---

## 16. Riscos e problemas

### CRÍTICO
1. **Redes dual-write de Reels sem reconciliação** (`reel-publish.ts`): Ao publicar com Supabase configurado, grava **tanto** no Supabase **quanto** em localStorage+IndexedDB, com flag `persistence`. Não há sincronização/limpeza entre as fontes — uma publicação pode divergir ou duplicar após falha parcial.
2. **Mídia em data-URL no localStorage** (`connexy:demo:posts`, `connexy:demo:saved-profile-media`, mensagens com `payload.dataUrl`): estouro de quota do localStorage (~5MB) em uso normal do fluxo demo — os `catch` silenciosos ocultam a falha.
3. **Sem barreira única de storage**: cada módulo implementa seu próprio `safeGet/safeSet/JSON.parse` (espalhados em `reel-local-storage`, `demo-*`, `trip-store`, `ride-blocks`, `local-engagement`, livestorage, etc.). Sem versão de schema nem migração de chaves, uma evolução de formato invalida dados antigos silenciosamente (ex.: `sanitizeTrip` é a única sanitização dedicada).

### ALTO
4. **Profile com múltiplas fontes**: mock `currentUser` + `connexy:demo:own-profile` + `profiles` (Supabase) + rascunhos de onboarding — divergência de dados entre modos e telas.
5. **Redes sociais com múltiplos "bancos" simulados**: `DemoDB` + `MOCK_CONNECTED` + `mock.conversation-invites` + `mock-conversations` para a mesma informação (conexões/conversas/convites).
6. **Chave `connexy.presence.preference` duplicada** em `presence-context.tsx` e `use-user-presence-control.ts` — gravações concorrentes podem sobrescrever a preferência.
7. **Camada de repositórios/Serviços Supabase implementada mas sem consumidores reais** (hooks `use*` em `hooks/api/` sem importadores; telas usam mocks): o "real" e o "demo" divergiram de propósito, mas sem um contrato único o caminho para prod é múltiplo.

### MÉDIO
8. **Estado do dispatcher sem persistência** — ofertas/atribuição/aceite de motorista da corrida ativa são perdidos no reload (apenas "buscando" é re-requestado).
9. **Chaves de bloqueio/ocultação órfãs** (`connexy.mock.blocked-person-ids`, `connexy.mock.hidden-person-ids`) — lidas mas nunca escritas; feature abandonada ou incompleta.
10. **Hooks e providers mortos**: `useFeed`, `useMarketplace`, `useNotifications`, `useRide`, `useProfile`, `useUpload`, `useUserPresenceControl`, `useConnectionPresence`, providers realtime/system/brand sem mount — confundem auditoria e aumentam superfície.
11. **Dois "engines"** (`lib/engine/` mock-legado e `lib/context/` ativo) e **duas camadas Supabase** (`lib/supabase/` ativa e `integrations/supabase/` gerada/morta) — duplicação estrutural.
12. **Realtime consumido por caminhos paralelos** (RealtimeHelper, presence service, `use-chat` via `supabase.channel` direto e `realtime-provider`) sem camada única de assinatura.

### BAIXO
13. Nomes de chave inconsistentes: mix de `connexy_` (underscore), `connexy:`, `connexy.` e prefixos `connexy:demo:` sem padrão documentado.
14. Identificadores de sessão demo e preferências persistem para sempre (sem TTL/limpeza), mas são inofensivos.
15. `_app.local.$id.tsx`/`perfil.index.tsx` compartilham mídia com data-url e a chave `saved-profile-media` só tem gravador na própria rota.

*(Nada foi corrigido nesta fase.)*

---

## 17. Recomendações para a Fase 1C-1

Direções abertas (sem implementar):

1. **Definir o contrato da camada Repository de persistência local**: interface única (ex.: `get/set/remove/clear` + eventos de mudança) sobre IndexedDB, espelhando o formato de entidades já existentes (Message, Post, ReelLike, etc.), com **sanitização/validação** no load (padrão já usado em `sanitizeTrip`).
2. **Adotar IndexedDB (nativo, sem lib — precedente já existe em `reel-local-media-db.ts`)** para as entidades da §15; manter localStorage apenas para preferências/anti-spam/estado de DEV.
3. **Eliminar as duplicidades da §13** antes de criar stores novas — em especial `connexy.presence.preference` (1 módulo) e as fontes de conversa/conexão (decisão demo vs real).
4. **Decidir o modelo de migração de chaves** (versionamento + migração por chave) já que hoje não existe.
5. **Criar rota/flag de reconciliação de dados locais ↔ Supabase** somente depois de o contrato local estar estável; manter o dual-write de Reels sob observação.
6. **Definir lunas de TTL/capacidade** para as coleções que crescem (AI history, live events, check-ins).
7. Registrar convenção de namespace de chaves (`connexy:<domain>:<key>:<vN>`) para padrão único.

---

## 18. Conclusão

O Connexy já possui:
- uma camada Supabase **real, implementada e tipada** (repos/serviços/migrations), porém **ainda não consumida pelas telas** de forma geral;
- uma camada demo **completa e persistida em localStorage** (`connexy:demo:*` + stores de domínio), que cobre social, reels, marketplace, presença, mobilidade e AI;
- **um único uso de IndexedDB** (mídia de reels, nativo);
- múltiplas duplicidades de fonte de verdade, principalmente em perfil, conexões/conversas, presença e reels.

A Fase 1C-1 deve partir deste mapa: definir o contrato da camada Repository local sobre IndexedDB para as entidades da §15, mantendo localStorage para preferências e estado de DEV, e só então conectar as telas — ainda sem migração para Supabase.

---

*Fase 1C-0 — auditoria somente de leitura. Nenhuma alteração de código, banco, lockfile ou configuração foi realizada.*