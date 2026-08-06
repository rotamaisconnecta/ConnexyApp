# Auditoria de Implementação do MVP — Connexy

> Data: 06/08/2026 · Escopo: análise integral do repositório
> `/home/ricardo/Downloads/opencode-project/ConnexyApp`
> Auditoria **somente leitura** — nenhum arquivo foi alterado.
> Stack: TanStack Start/Router 1.x · React 19 · Tailwind 4 · Supabase · Framer Motion · sonner · zod
> Slogan da base de dados: **Dados simulados locais. Banco de dados ainda não conectado.**

---

## Sumário executivo

O projeto é um "super app" de proximidade (pessoas, eventos, locais, negócios, mobilidade e reels) com
**77 rotas** geradas (`src/routeTree.gen.ts`). A arquitetura segue `routes → components → hooks →
services → repositories → Supabase`, porém a maior parte dessa cadeia é **código morto**:

- **Nenhum** hook de `src/hooks/api/*` é importado por rota ou componente.
- **Nenhum** `src/services/*` nem `src/repositories/*` é consumido por tela real.
- As telas usam **dados simulados locais** (`src/lib/mock-data.ts`, `src/lib/feed/*`, `src/lib/chat/*`,
  `localStorage`) com pouquíssimas exceções de acesso real ao Supabase.
- O schema Supabase real possui **apenas 6 tabelas** (`profiles`, `places`, `bio_posts`, `reels`,
  `reel_likes`, `reel_comments`), enquanto os repositórios consultam **mais de 14 tabelas e 2 RPCs
  que não existem** nas migrações.

### Schema real do Supabase (migrações em `supabase/migrations/`)

| Tabela | Origem |
|---|---|
| `profiles` | `20260709023719_*.sql` (L2-27) + RLS ajustada em `20260711160607_*.sql` |
| `places` | `20260709023719_*.sql` (L29-48, seed de 4 locais L50-54) |
| `bio_posts` | `20260709023719_*.sql` (L56-72) |
| `reels`, `reel_likes`, `reel_comments` | `20260710014946_*.sql` (L3-66) |

Funções: `set_updated_at`, `handle_new_user` (`20260709023719_*.sql` L74-94). RPCs de proximidade
(`get_nearby_profiles`, `get_nearby_businesses`) **não existem** em nenhuma migração.

### Tabelas/RPCs referenciados no código mas SEM migração e SEM tipo gerado

Caem no fallback `FallbackRow = Record<string, unknown>` (`src/types/database/tables.ts:11-15`):

| Referência | Onde | Status |
|---|---|---|
| `conversations`, `conversation_participants`, `messages` | `src/repositories/chat.repository.ts:8,18,32,42,52,64` | inexistente |
| `connection_requests` | `src/services/discovery.service.ts:38,54` | inexistente |
| `moments`, `compatibility` | `src/repositories/profile.repository.ts:25,34,40,46` | inexistente |
| `likes` | `src/repositories/feed.repository.ts:48,54` | inexistente |
| `notifications` | `src/repositories/notification.repository.ts:8,19,30,38,44` | inexistente |
| `businesses`, `events`, `event_users`, `offers`, `coupons`, `reviews` | `src/repositories/marketplace.repository.ts:22,47,56,78,87,102` | inexistente |
| `rides` | `src/repositories/ride.repository.ts:8,21,37,47,58` | inexistente |
| RPC `get_nearby_profiles` | `src/repositories/user.repository.ts:67`, `src/services/discovery.service.ts:16` | inexistente |
| RPC `get_nearby_businesses` | `src/repositories/marketplace.repository.ts:31` | inexistente |

O único cliente de tipos gerado (`src/integrations/supabase/types.ts`, 424 linhas) declara somente as 6
tabelas e `Functions: { [_ in never]: never }` (L291-293).

### Buckets de storage

Políticas existem para `bio-media` (`20260709023757_*.sql`) e `reels-media`
(`20260710014946_*.sql` L69-83), mas **nenhuma migração cria os buckets**. O `UploadService` usa buckets
`avatars` e `posts` (`src/services/upload.service.ts:26,34`) que também não existem.

### Duplicidade de clientes Supabase

- `src/lib/supabase/client.ts` — usado pelos repositórios (código morto).
- `src/integrations/supabase/client.ts` — usado pelas rotas/componentes (código vivo).
- `src/integrations/supabase/client.server.ts:67` cria `supabaseAdmin` exigindo `SUPABASE_SERVICE_ROLE_KEY`,
  **ausente do `.env`** (o `.env` só tem `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e variantes `VITE_*`).
- `VITE_SUPABASE_ANON_KEY` é referenciado em `src/providers/realtime/presence-provider.tsx:18-19` e
  `realtime-provider.tsx:23-24`, mas **não existe no `.env`**.

### Testes

**Não existe suíte de testes**: `package.json` (L6-13) só tem scripts `dev/build/build:dev/preview/lint/format`;
nenhum `*.test.*`/`*.spec.*` no repositório; nenhum runner (vitest/jest/playwright) instalado.

### Acesso real ao Supabase hoje (única exceção)

- `src/routes/auth.tsx` — `supabase.auth.signUp/signInWithPassword` (L34, L42) e OAuth Google via
  `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts`).
- `src/routes/_app.gerenciar.novo-reel.tsx` — lê `places` (L37), upload em `reels-media` (L76-88), insert em
  `reels` (L96-105).
- `src/components/reels/comments-sheet.tsx` — lê/grava `reel_comments` real (L36-41, L65-68) — **mas não é
  usado pelas rotas de reels**, que usam `reel-comments-sheet.tsx` (mock).

---

## Rotas existentes (geral)

| Rota | Arquivo |
|---|---|
| `/` | `src/routes/index.tsx` |
| `/auth`, `/cadastro`, `/welcome` | `src/routes/auth.tsx`, `cadastro.tsx`, `welcome.tsx` |
| `/interesses`, `/localizacao`, `/completar-perfil`, `/finalizar-perfil` | `src/routes/{interesses,localizacao,completar-perfil,finalizar-perfil}.tsx` |
| `/_app` (layout) | `src/routes/_app.tsx` |
| `/_app/home`, `/_app/connecta`, `/_app/people`, `/_app/pessoas`, `/_app/recommendations`, `/_app/trending` | `_app.{home,connecta,people,pessoas,recommendations,trending}.tsx` |
| `/_app/perfil`, `/_app/perfil/$id`, `/_app/profile`, `/_app/profile/roles` | `_app.perfil.index.tsx`, `_app.perfil.$id.tsx`, `_app.profile.tsx`, `_app/profile/roles.tsx` |
| `/_app/solicitacao/$id` | `_app.solicitacao.$id.tsx` |
| `/_app/chat`, `/_app/chat/$id`, `/_app/chat/$conversationId` | `_app/chat.tsx`, `_app.chat.$id.tsx`, `_app/chat.$conversationId.tsx` |
| `/_app/events`, `/_app/event/$eventId` | `_app.events.tsx`, `_app.event.$eventId.tsx` |
| `/_app/locais`, `/_app/local/$id` | `_app.locais.tsx`, `_app.local.$id.tsx` |
| `/_app/marketplace`, `/_app/business/$businessId`, `/_app/avaliar` | `_app.marketplace.tsx`, `_app.business.$businessId.tsx`, `_app.avaliar.tsx` |
| `/_app/notificacoes`, `/_app/notifications` | `_app.notificacoes.tsx`, `_app/notifications.tsx` |
| `/_app/my-connexy`, `/_app/privacidade`, `/_app/design-system` | `_app.my-connexy.tsx`, `_app.privacidade.tsx`, `_app/design-system.tsx` |
| `/_app/discover`, `/_app/feed` | `_app/discover.tsx`, `_app/feed.tsx` |
| `/_app/ride`, `/_app/ride/{request,matching,active,history}` | `_app/ride.tsx`, `_app/ride/*.tsx` |
| `/_app/driver`, `/_app/driver/{cadastro,profile,finance,history,performance,trip/$tripId}` | `_app/driver/*.tsx` |
| `/_app/corrida`, `/_app/rota`, `/_app/destino`, `/_app/matching`, `/_app/engine` | `_app.{corrida,rota,destino,matching,engine}.tsx` |
| `/_app/reels`, `/_app/reels/$reelId` | `_app.reels.tsx`, `_app/reels/$reelId.tsx` |
| `/_app/create`, `/_app/create/{photo,video,text,moment,offer,event,place,place-business,ride,reel}` | `_app/create.tsx`, `_app/create/*.tsx` |
| `/_app/create-post`, `/_app/gerenciar`, `/_app/gerenciar/{nova-*,novo-*}` | `_app.create-post.tsx`, `_app.gerenciar.tsx`, `_app.gerenciar.*.tsx` |

---

# Módulos auditados

## 1. Autenticação

**1. Rotas existentes:** `/auth` (`src/routes/auth.tsx`), `/` (`src/routes/index.tsx` — splash que
redireciona para `/welcome` ou `/localizacao` conforme sessão, L18-24), guard do shell em
`src/routes/_app.tsx:25-27` (redireciona para `/auth` sem sessão).

**2. Componentes utilizados:** `PhoneFrame`/`StatusBar` (`src/components/phone-frame.tsx`),
`Logo` (`src/lib/branding/brand-config.ts`), `Toaster` (sonner, `src/routes/__root.tsx:160`).

**3. Hooks:** `useAuth` (`src/hooks/use-auth.ts`), `useGlobalDragScroll` (`src/hooks/system/use-drag-scroll.ts`).
`useAuth` de `src/hooks/api/use-auth.ts` é **código morto**.

**4. Services:** `src/services/auth.service.ts`, `src/services/user.service.ts` — **não usados** pelas rotas.

**5. Repositories:** `src/repositories/auth.repository.ts` (usa `supabase.auth.*` real),
`src/repositories/user.repository.ts` (usa `profiles` e RPC inexistente `get_nearby_profiles` L67) —
**código morto**.

**6. Tabelas Supabase relacionadas:** `profiles` (existe; criada via trigger `handle_new_user`). `auth.users`
(gerenciada pelo Supabase Auth).

**7. Uso de dados reais ou mocks:** **REAL** — `auth.tsx` chama `supabase.auth.signUp/signInWithPassword`
(L34, L42) e OAuth Google (L56). O perfil é criado **somente pelo trigger** `handle_new_user`
(`20260709023719_*.sql` L80-91); o `UserRepository.create` que faria isso é código morto.

**8. Botões sem implementação:** `src/routes/auth.tsx:173-175` — "Continuar sem entrar" (`Link to="/home"`):
rota existe, mas o guard de `_app.tsx` redireciona de volta a `/auth` (**beco sem saída**). `src/routes/localizacao.tsx:40-52` — "Permitir localização"/"Agora não" apenas navegam; coordenadas descartadas.

**9. Erros de navegação:** pós-signup não navega (toast "Conta criada!"); fluxo real (`/auth`) nunca passa
pelo onboarding fake. Sem outros alvos quebrados.

**10. Políticas RLS:** `profiles` — SELECT só para `authenticated` (`20260711160607_*.sql`), INSERT com
`auth.uid() = id`, UPDATE com `auth.uid() = id`; **sem política DELETE**. `REVOKE SELECT ON profiles FROM anon`
(L3). Triggers com EXECUTE revogado de PUBLIC/anon/authenticated (`20260709023733_*.sql`).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** confirmação de email (sem UI/rota de token; erro mostrado cru),
reset de senha sem tela (existe só `AuthRepository.resetPasswordForEmail`, dead code), sem magic link,
sem 2FA (apesar de `input-otp` estar nas deps), validação mínima (só `required`/`minLength={6}` no HTML,
`auth.tsx:129,139,145`), `parseSupabaseError` (`src/lib/supabase/errors.ts`) não usado no fluxo real,
`supabaseAdmin` quebrado por falta de `SUPABASE_SERVICE_ROLE_KEY`, OAuth dependente de config externa do
Lovable, sem guard de onboarding (rotas de onboarding acessíveis a anônimos e a logados).

---

## 2. Onboarding

**1. Rotas existentes:** `/cadastro` (`src/routes/cadastro.tsx`), `/completar-perfil`
(`src/routes/completar-perfil.tsx`), `/interesses` (`src/routes/interesses.tsx`), `/finalizar-perfil`
(`src/routes/finalizar-perfil.tsx`), `/localizacao` (`src/routes/localizacao.tsx`).

**2. Componentes utilizados:** `PhoneFrame`, `StatusBar`, `BackButton` (`src/components/navigation/back-button.tsx`),
`UploadMedia` (`src/components/upload/UploadMedia.tsx` e subs `UploadDropzone/UploadPreview/UploadGrid/UploadToolbar/UploadProgress/UploadSources`).

**3. Hooks:** somente `useState`/`useEffect` locais; `usePermissions` (`src/hooks/system/use-permissions.ts`) não usado.

**4. Services:** nenhum conectado.

**5. Repositories:** nenhum conectado.

**6. Tabelas Supabase relacionadas:** `profiles` (deveria ser gravada; não é).

**7. Uso de dados reais ou mocks:** **100% MOCK / descartado** — `cadastro.tsx` tem dados pré-preenchidos
falsos ("Lucas Almeida"); `completar-perfil.tsx` mantém estado local e só navega (L62-65); `interesses.tsx`
usa `allInterests` de mock e não persiste (L135); `finalizar-perfil.tsx` simula verificação por
`setInterval` fake (L78-92) e "Criar meu perfil" só navega para `/localizacao` (L318-325); `localizacao.tsx`
lê coordenadas e as descarta, navegando para `/home`. **Nada chega a `profiles` nem ao storage.**

**8. Botões sem implementação:** `cadastro.tsx:38` (câmera do avatar, sem onClick), `cadastro.tsx:57`
("Pular", sem onClick), `finalizar-perfil.tsx:249-264` (métodos de verificação simulados),
`UploadMedia.tsx:218-226` ("Simular Upload" com `simulateUpload` fake, L149-162).

**9. Erros de navegação:** steppers inconsistentes ("Passo 1 de 3" → "2 de 3" → "3 de 4" → "4 de 4");
dois fluxos paralelos: `/welcome → /cadastro` (fake) versus `/auth` (real), que nunca se cruzam.

**10. Políticas RLS:** não aplicáveis (nada persiste).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** persistir perfil em `profiles`/storage; campos coletados
(gênero, status, localização) **não existem como colunas** em `profiles` (schema real: `age`, `handle`,
`name`, `bio`, `headline`, `mood_*`, `now_playing_*`, `interests`, `vibe_tags`, `looks_for`, `photo_url`);
unificar fluxos fake/real; remover identidade mock (`currentUser` "Lucas Almeida" é exibido em telas logadas).

---

## 3. Home

**1. Rotas existentes:** `/_app/home` (`src/routes/_app.home.tsx`).

**2. Componentes utilizados:** `BrandLogo` (`src/components/ui/brand-logo.tsx`),
`HomePremiumFeed` (`src/components/feed/HomePremiumFeed.tsx`), `LocalSponsoredFeed`
(`src/components/ads/LocalSponsoredFeed.tsx`), `PresenceLiveFeed`
(`src/components/presence/presence-live-feed.tsx`), `NotificationBell`
(`src/components/notifications/NotificationBell.tsx`, via `_app.tsx:51`), `BottomNav`
(`src/components/bottom-nav.tsx`), `PromoPopup` (`src/components/promo-popup.tsx`, `_app.tsx:57`).

**3. Hooks:** `useState`/`useMemo`/`useRef`/`useEffect` locais; `getStoredRoles` (`src/lib/roles/roles-storage.ts`);
`usePresence` (indireto via `PresenceLiveFeed`).

**4. Services:** nenhum.

**5. Repositories:** nenhum.

**6. Tabelas Supabase relacionadas:** nenhuma (tudo mock).

**7. Uso de dados reais ou mocks:** **MOCK** — `currentUser`, `people`, `places`, `drivers` de
`src/lib/mock-data.ts`; feed montado por `src/lib/feed/home-premium.ts` (`HOME_EVENTS`, `EXTRA_CARDS`,
`TRENDING_POSTS`, builders `buildNearbyPeople()` etc.); anúncios de `src/lib/ads/mock-sponsored-content.ts`
(CTA só dispara `toast.success`, `LocalSponsoredFeed.tsx:68-74`); presença em `localStorage`
(`src/providers/presence/presence-provider.tsx`, `CURRENT_USER_ID = "lucas"`).

**8. Botões sem implementação:** categorias de busca (`_app.home.tsx:254-262`) só fecham o dropdown, sem
navegar/filtrar; link "Mensagens" (`_app.home.tsx:154-161`) aponta para `/connecta` em vez de `/chat`;
CTA do anúncio (`LocalSponsoredFeed.tsx:68-74`).

**9. Erros de navegação:** busca global (`_app.home.tsx:226`) usa `result.route as never` — para motoristas
leva a `/ride/request` fora do contexto do feed; cards do feed premium (`src/components/feed/cards/premium-card.tsx:162`)
apontam para `/discover` e `/connecta` como destinos genéricos.

**10. Políticas RLS:** não aplicáveis (dados mock).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** conectar feed/eventos/pessoas ao Supabase; corrigir destino do link de
mensagens; implementar categorias de busca; presença real via geolocalização + realtime
(`src/providers/realtime/*` não é montado e exige `VITE_SUPABASE_ANON_KEY`).

---

## 4. Pessoas Próximas

**1. Rotas existentes:** `/_app/people` (`src/routes/_app.people.tsx`), `/_app/pessoas`
(`src/routes/_app.pessoas.tsx`), `/_app/connecta` (`src/routes/_app.connecta.tsx`), `/_app/discover`
(`src/routes/_app/discover.tsx` — mapa), `/_app/matching` (`src/routes/_app.matching.tsx`).

**2. Componentes utilizados:** `PremiumCardView`/cards de `src/components/feed/cards/*` (`_app.people.tsx`),
`PresenceDot` (`src/components/presence/presence-dot.tsx`), `ConversationInviteButton`
(`src/components/chat/conversation-invite-button.tsx`), `MapCanvas` (discover). O diretório
`src/components/discovery/*` (`PersonCard`, `PeopleGrid`, `PeopleList`, `DiscoveryFiltersPanel`,
`DiscoverySearch`, `CompatibilityBadge`, `ConnectButton`, `FavoriteButton`, `IgnoreButton`) é
**código órfão** — nada o importa.

**3. Hooks:** `useState` locais; `useDiscovery` (`src/hooks/api/use-discovery.ts`) é **código morto**.

**4. Services:** `src/services/discovery.service.ts` — **código morto**; consulta RPC inexistente
`get_nearby_profiles` (L16) e tabela inexistente `connection_requests` (L38).

**5. Repositories:** `src/repositories/user.repository.ts` (RPC `get_nearby_profiles` L67, inexistente) —
**código morto**.

**6. Tabelas Supabase relacionadas:** `profiles` (existe), RPC `get_nearby_profiles` (**inexistente**),
`connection_requests` (**inexistente**).

**7. Uso de dados reais ou mocks:** **MOCK** — `people` de `src/lib/mock-data.ts`; `buildFullPeopleCards()`
e presença local. `/pessoas` é **placeholder TODO** (`_app.pessoas.tsx:26-31`).

**8. Botões sem implementação:** filtros `SlidersHorizontal` sem onClick (`_app.connecta.tsx:37-39`);
`MoreHorizontal` sem onClick (`_app.matching.tsx:61-63`).

**9. Erros de navegação:** `_app.discover.tsx:312` navega para `/perfil` (perfil do próprio usuário) em vez
de `/perfil/$id` da pessoa tocada.

**10. Políticas RLS:** `profiles` legível só por `authenticated`; `connection_requests` sem tabela.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** implementar `/pessoas` (filtros por idade/interesses/disponibilidade/
compatibilidade); ligar componentes órfãos do discovery; criar RPC `get_nearby_profiles` e tabela
`connection_requests`; corrigir navegação do discover; remover casts `as never`.

---

## 5. Perfil contextual

**1. Rotas existentes:** `/_app/perfil` (`src/routes/_app.perfil.index.tsx`), `/_app/perfil/$id`
(`src/routes/_app.perfil.$id.tsx`), `/_app/profile` (`src/routes/_app.profile.tsx` — rota do BottomNav),
`/_app/profile/roles` (`src/routes/_app/profile/roles.tsx`).

**2. Componentes utilizados:** `Hero`, `Badge` (`src/components/profile/atoms/`), `MomentItem`
(`src/components/profile/MomentItem`), `PresenceDot`, `ConversationInviteButton`
(`_app.perfil.$id.tsx:343`), `ModeSwitcher` (`src/components/roles/ModeSwitcher.tsx`, `_app.profile.tsx`).

**3. Hooks:** `useState` locais; `useProfile` (`src/hooks/api/use-profile.ts`) **código morto**.

**4. Services:** `src/services/profile.service.ts` e `src/services/user.service.ts` — **código morto**.

**5. Repositories:** `src/repositories/profile.repository.ts` (consulta `moments` L25 e `compatibility` L46,
ambas inexistentes), `user.repository.ts` — **código morto**.

**6. Tabelas Supabase relacionadas:** `profiles` (existe), `moments`, `compatibility`, `likes`
(inexistentes).

**7. Uso de dados reais ou mocks:** **MOCK** — loader de `_app.perfil.$id.tsx:47` usa `findPerson()` de
`src/lib/mock-data.ts`; momentos, locais favoritos, stats mock; `_app.perfil.index.tsx` e `_app.profile.tsx`
usam `currentUser` mock.

**8. Botões sem implementação:** `_app.perfil.index.tsx:31` "Ver perfil público" (div sem Link);
`:50-52` "Minhas viagens", "Conexões", "Locais favoritos" (sem Link); `_app.perfil.$id.tsx:76-81` "Mais
opções" (sem onClick); `_app.perfil.$id.tsx:335-340` "Aceitar conversa" navega ao chat **sem gravar
status de conexão**; `MomentItem` curtir só toggla estado local (L378).

**9. Erros de navegação:** duplicidade de rotas `/perfil` + `/profile` com propósitos sobrepostos
(ambas mock, mas uma é o "perfil público", outra o "meu perfil").

**10. Políticas RLS:** `profiles` só `authenticated` (SELECT); sem DELETE.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** usar `profiles` real no loader (`useProfile`/`ProfileService`);
implementar ações do perfil; duplicar/consolidar `/perfil` e `/profile`; gravar conexão ao aceitar conversa.

---

## 6. Solicitações de conversa

**1. Rotas existentes:** `/_app/solicitacao/$id` (`src/routes/_app.solicitacao.$id.tsx`).

**2. Componentes utilizados:** `StatusBar`, `BackButton`, `PresenceDot`, `motion` (framer), `Link` para
preview da bio (`search={{ from: "solicitacao" }}`).

**3. Hooks:** `useState`/`useRouter`/`useNavigate`; `Route.useSearch()` para o modo
(`validateSearch` zod `mode: "send" | "receive"`, L16-18).

**4. Services:** nenhum.

**5. Repositories:** nenhum — persistência via `src/lib/chat/mock-conversation-invites.ts`
(localStorage, chave `connexy.mock.conversation-invites`).

**6. Tabelas Supabase relacionadas:** `connection_requests` (inexistente — convites vivem em localStorage).

**7. Uso de dados reais ou mocks:** **MOCK** — loader usa `people.find` (`src/routes/_app.solicitacao.$id.tsx:26`);
estado inicial `MOCK_CONNECTED = { beatriz, rafael }` e `MOCK_INVITED = ["juliana"]`; `writeStoredInvite`
persiste em localStorage. Modo `send`: "Enviar convite"/"Enviar novo convite" → `invited` + toast + volta,
sem abrir conversa. Modo `receive`: "Aceitar conversa" → `connected` + navega para
`/chat/$conversationId` (`getConversationId ?? personId`). Estado `invited` mostra "Convite enviado"/
"Aguardando resposta" e só "Voltar".

**8. Botões sem implementação:** nenhum (fluxo implementado). Ação "Cancelar convite" é opcional e não existe.

**9. Erros de navegação:** ao aceitar em modo receive, a conversa não é criada em `MOCK_CONVERSATIONS` — o
chat abre com `DEFAULT_PARTICIPANT`/`findPerson` fallback (não quebra, mas não há histórico).

**10. Políticas RLS:** `connection_requests` sem tabela → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** migrar convites para `connection_requests` no Supabase (com RLS entre as
partes); persistir conversa criada ao aceitar; notificações reais de convite.

---

## 7. Chat

**1. Rotas existentes:** `/_app/chat` (`src/routes/_app/chat.tsx` — lista `ConversationsScreen` ou `Outlet`
conforme `useMatch` de `chat/$conversationId`), `/_app/chat/$id` (`src/routes/_app.chat.$id.tsx` — redirect
para `$conversationId`), `/_app/chat/$conversationId` (`src/routes/_app/chat.$conversationId.tsx` →
`ConnexyChatScreen`).

**2. Componentes utilizados:** `ConversationsScreen` (`src/components/chat/conversations-screen.tsx`),
`ConversationRow` (`conversation-row.tsx`), `ContinueCard` (`continue-card.tsx`), `ConnexyChatScreen`
(`ConnexyChatScreen.tsx`), `ChatHeader` (`chat-header.tsx`), `MessageInput` (`message-input.tsx`),
`AttachmentSheet`, `MeetupSheet` (`meetup-sheet.tsx`), `EmojiPicker`, `ChatSearch`, `QuickReactions`,
`VoiceRecorder`.

**3. Hooks:** `useState`/`useMemo` locais; `useChat` (`src/hooks/api/use-chat.ts`) é **código morto**.

**4. Services:** `src/services/chat.service.ts` — **código morto**.

**5. Repositories:** `src/repositories/chat.repository.ts` (consulta `conversations`,
`conversation_participants`, `messages` — todas inexistentes) — **código morto**.

**6. Tabelas Supabase relacionadas:** `conversations`, `conversation_participants`, `messages`
(inexistentes).

**7. Uso de dados reais ou mocks:** **100% MOCK** — `MOCK_CONVERSATIONS` (10 conversas,
`src/lib/chat/mock-conversations.ts`, header do arquivo declara "Banco de dados ainda não conectado");
`ConnexyChatScreen.tsx` **ignora o histórico real** e sempre gera `buildMockMessages()` (L163);
`DEFAULT_PARTICIPANT` = "Juliana Santos" (L30-35); resposta automática "Show! Combinado então 🎉" após 3,2s
(L220). Ações do menu (silenciar/fixar/arquivar) são estado local sem persistência
(`conversations-screen.tsx:58-85`).

**8. Botões sem implementação:** perfil do participante no `chat-header.tsx:52-89` (sem onClick);
Videocall/Ver perfil/Bloquear → `toast.info("... em breve")` (`ConnexyChatScreen.tsx:301,364-398`);
anexos não-LOCATION → "Anexo disponível em breve" (`attachment-sheet.tsx`).

**9. Erros de navegação:** `NotificationBell` navega para `/chat/maria` (`NotificationBell.tsx:51,112-115`);
`maria` não existe em `MOCK_CONVERSATIONS` → cai no participante padrão (rota existe, dado mock).

**10. Políticas RLS:** sem tabelas de chat → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabelas de chat + RLS por participante; conectar `useChat`/real time
(`src/providers/realtime/realtime-provider.tsx` não é montado); persistir mensagens/histórico; implementar
chamadas/videocall/anexos reais; definir qual comments-sheet usar em reels (ver módulo Engines/Reels).

---

## 8. Eventos

**1. Rotas existentes:** `/_app/events` (`src/routes/_app.events.tsx`), `/_app/event/$eventId`
(`src/routes/_app/event.$eventId.tsx`).

**2. Componentes utilizados:** `StatusBar`, `BackButton`, `EventCard` local, `BusinessCard`
(`_app.event.$eventId.tsx:260`), `EventCalendar`/`EventList`/`PresenceCheckin`/`PresentList`
(imports L4-8).

**3. Hooks:** `useState` local; `usePresence` (indireto via `PresenceCheckin`).

**4. Services:** `src/services/marketplace.service.ts` — **não usado**.

**5. Repositories:** `src/repositories/marketplace.repository.ts` (consulta `events` L56,78) — **código morto**.

**6. Tabelas Supabase relacionadas:** `events`, `event_users`/`attendees` (inexistentes).

**7. Uso de dados reais ou mocks:** **MOCK** — `eventsToday()`/`eventsUpcoming()` de
`src/lib/feed/home-premium.ts:289-295` sobre `HOME_EVENTS` (ids `ev1..ev10`). **O detalhe ignora o
`params.eventId`** e sempre renderiza `MOCK_EVENT` "Noite de Jazz" (`_app.event.$eventId.tsx:130`; mock L77-92).

**8. Botões sem implementação:** `handleShare()` vazio (`_app.event.$eventId.tsx:134`, acionado L161);
`handleAttend` só alterna estado local (L136-138, L230-239).

**9. Erros de navegação:** qualquer `/event/ev1..ev10` exibe a mesma tela "Noite de Jazz" (id `evt-1`).
Rota existe; dado não varia.

**10. Políticas RLS:** sem tabela `events` → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabelas `events`/`event_users` + RLS; listar do Supabase; respeitar
`eventId` no detalhe; implementar share/check-in persistente.

---

## 9. Locais

**1. Rotas existentes:** `/_app/locais` (`src/routes/_app.locais.tsx`), `/_app/local/$id`
(`src/routes/_app.local.$id.tsx`).

**2. Componentes utilizados:** `StatusBar`, `BackButton`, `MapCanvas` (`_app.local.$id.tsx:53`),
`PresenceCheckin` (L119), `PresentList` (L127).

**3. Hooks:** `useState` local (filtro L17); `usePresence` (indireto).

**4. Services:** nenhum.

**5. Repositories:** nenhum.

**6. Tabelas Supabase relacionadas:** `places` — **EXISTE** (migração L29-48, com seed) mas **não é usada**.

**7. Uso de dados reais ou mocks:** **MOCK** — `places` de `src/lib/mock-data.ts:291-338`; reviews
hardcoded (`_app.local.$id.tsx:133-143`); loader usa `findPlace` (`_app.local.$id.tsx:27`).

**8. Botões sem implementação:** busca decorativa sem `onChange` (`_app.locais.tsx:29-32`); Bookmark/Share
(`_app.local.$id.tsx:54,57`); "Usar promoção" (L83); grade de ações Ligar/Rota/Salvar/Compartilhar sem
`onClick` (L96-103).

**9. Erros de navegação:** "Ir até lá" → `/rota` (existe). Nenhum alvo quebrado.

**10. Políticas RLS:** `places` — SELECT público (anon), INSERT/UPDATE/DELETE owner (migração L45-48).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** conectar a tela a `supabase.from("places")`; implementar ações
(Ligar/Rota/Salvar/Compartilhar/promoção); remover reviews hardcoded; persistir check-in/bookmark.

---

## 10. Negócios

**1. Rotas existentes:** `/_app/marketplace` (`src/routes/_app.marketplace.tsx`), `/_app/business/$businessId`
(`src/routes/_app.business.$businessId.tsx`).

**2. Componentes utilizados:** `SearchBar`, `CategoryFilter`, `MarketplaceFiltersPanel`, `BusinessGrid`,
`OfferCarousel`, `LoadingMarketplace`, `EmptyMarketplace` (`marketplace.tsx`); `BusinessHeader`,
`BusinessDetails`, `CouponList`, `FollowBusinessButton`, `BusinessGallery`, `BusinessHours`,
`BusinessRating`, `BusinessMapPreview`, `EventList` (`business.$businessId.tsx`).

**3. Hooks:** `useMarketplace` (`src/hooks/api/use-marketplace.ts:9`) **nunca importado**; estado local.

**4. Services:** `src/services/marketplace.service.ts` — **não usado**.

**5. Repositories:** `src/repositories/marketplace.repository.ts` — consulta `businesses` (L22,47),
`offers` (L87), `coupons` (L102), `reviews` (L48) e RPC `get_nearby_businesses` (L31), todos inexistentes —
**código morto**.

**6. Tabelas Supabase relacionadas:** `businesses`, `offers`, `coupons`, `reviews` (inexistentes).

**7. Uso de dados reais ou mocks:** **MOCK** — `MOCK_BUSINESSES` (`marketplace.tsx:141-280`),
`MOCK_PROMOTIONS` (L72-108); filtros locais (`filterBusinesses`/`sortBusinesses`, L291-297). **O detalhe
ignora `params.businessId`** — qualquer id exibe "Bistrô Paulista" (`business.$businessId.tsx:197`);
apenas os cupons filtram pelo id (L199-202).

**8. Botões sem implementação:** `handleShare()`/`handleSave()` vazios (`business.$businessId.tsx:212,214`);
Favorite/Follow só togglam estado local (L204-210).

**9. Erros de navegação:** `/business/b1..b6` e `/business/evt-1` (do `NotificationBell.tsx:69`) exibem o
mesmo negócio mock. Rotas existem; dados não variam.

**10. Políticas RLS:** sem tabelas → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabelas `businesses`/`offers`/`coupons`/`reviews` + RPC
`get_nearby_businesses`; usar `useMarketplace`; respeitar `businessId` no detalhe; persistir follow/favorite.

---

## 11. Promoções

**1. Rotas existentes:** sem rota dedicada — ofertas em `/marketplace` (`OfferCarousel`,
`marketplace.tsx:332`), detalhe em `/business/$businessId` (`CouponList`), popup global em `/_app`
(`src/components/promo-popup.tsx`, montado em `_app.tsx:57`), criação em `/_app/create/offer`
(`src/routes/_app/create/offer.tsx`).

**2. Componentes utilizados:** `OfferCarousel`/`OfferCard`, `CouponCard`/`CouponList` (copiar cupom via
`onCopy`, `src/components/marketplace/coupon-card.tsx`), `PromoPopup`.

**3. Hooks:** `useMarketplace` não usado; `useState` local.

**4. Services:** `MarketplaceService` — não usado.

**5. Repositories:** `MarketplaceRepository.getOffers` (tabela `offers` inexistente) — **código morto**.

**6. Tabelas Supabase relacionadas:** `offers`, `coupons` (inexistentes).

**7. Uso de dados reais ou mocks:** **MOCK** — `MOCK_PROMOTIONS` (`marketplace.tsx:72-108`), cupons mock
(`business.$businessId.tsx:148-192`). `PromoPopup` usa `sessionStorage` `rmc:promo-dismissed`
(`promo-popup.tsx:6,15`).

**8. Botões sem implementação:** "Ver oferta" do popup → `/local/cafe-central` (id existe em mock);
"Usar promoção" (`_app.local.$id.tsx:83`) sem ação.

**9. Erros de navegação:** nenhum alvo quebrado.

**10. Políticas RLS:** sem tabelas → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabelas + persistência de cupons utilizados; `create/offer.tsx`
"publica" em vão (ver publisher, §13); ligar popup a ofertas reais.

---

## 12. Notificações

**1. Rotas existentes:** `/_app/notificacoes` (`src/routes/_app.notificacoes.tsx`), `/_app/notifications`
(`src/routes/_app/notifications.tsx`); `NotificationBell` montado em `_app.tsx:51` (oculto nas rotas de
notificação e chat, L20-23).

**2. Componentes utilizados:** `NotificationBell`, `NotificationCenter`
(`src/components/notifications/notification-center.tsx`), `NotificationCard/Filters/Group/Header/List/
Settings/Skeleton`.

**3. Hooks:** `useNotifications` (`src/hooks/api/use-notifications.ts:4`) **nunca usado**; `usePresence`
para notificações sintéticas (`_app/notifications.tsx:101-115`).

**4. Services:** `src/services/notification.service.ts` — **não usado**.

**5. Repositories:** `src/repositories/notification.repository.ts` (tabela `notifications` inexistente) —
**código morto**.

**6. Tabelas Supabase relacionadas:** `notifications` (inexistente).

**7. Uso de dados reais ou mocks:** **MOCK** — Bell com `MOCK_BELL_NOTIFICATIONS`
(`NotificationBell.tsx:34-71`, ids hardcoded `evt-1`, `b1`, `maria`); `_app.notificacoes.tsx` usa
`notifications` de `src/lib/mock-data.ts:350`; `_app/notifications.tsx` mescla presença + `MOCK_NOTIFICATIONS`
locais; leitura/dismiss via `src/lib/notifications/notification-actions.ts:10-24` (local).

**8. Botões sem implementação:** tabs de `_app.notificacoes.tsx:38-47` só setam estado, não filtram a lista;
settings toggles locais (`notification-settings.tsx:56`).

**9. Erros de navegação:** Bell → `/chat/maria` (conversa inexistente, fallback mock), `/event/evt-1`
(sempre "Noite de Jazz"), `/business/b1` (sempre "Bistrô Paulista"). Rotas existem; dados não batem.

**10. Políticas RLS:** sem tabela → sem RLS.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabela `notifications` + RLS; integrar `useNotifications`; filtrar
tabs; notificações push; substituir IDs mock do Bell.

---

## 13. Meu Connexy

**1. Rotas existentes:** `/_app/my-connexy` (`src/routes/_app.my-connexy.tsx`), `/_app/gerenciar`
(`src/routes/_app.gerenciar.tsx`), `/_app/gerenciar/*` (redirecionam para `/create/*`), `/_app/privacidade`.

**2. Componentes utilizados:** `WizardBase` (`src/components/my-connexy/wizard-base.tsx`),
`FormField`/`CategoryPicker`/`PhotoUploader`/`PreviewCard` (`my-connexy.tsx:329-401`),
`PanelShell`/`PanelCard`/`PanelAction` (L524-625), `ModeSwitcher` (`src/components/roles/ModeSwitcher.tsx`).

**3. Hooks:** `getStoredRoles` (localStorage); nenhum hook de API.

**4. Services:** nenhum.

**5. Repositories:** nenhum.

**6. Tabelas Supabase relacionadas:** nenhuma usada (roles em `localStorage` — `src/lib/roles/roles-storage.ts`,
chave `connexy_roles`).

**7. Uso de dados reais ou mocks:** **MOCK** — `currentUser` de `src/lib/mock-data.ts` (L32); stats/atividades
hardcoded (L134-175); os 5 wizards "Publicar" apenas fecham e disparam evento `roleChanged`
(`handleWizardComplete`, L649-652; `wizard-base.tsx:36-42`) — **nada persiste**. `create-post.tsx:16-18` —
`handlePublish` só navega para `/home`. `usePublisherForm` (`src/components/publisher/usePublisherForm.ts:9-15`)
simula 800ms + toast "Publicado com sucesso!" + volta ao `/home` — **nenhum fluxo `/create/*` persiste nada**,
exceto `novo-reel`.

**8. Botões sem implementação:** `PanelAction` **sem `onClick`** (`my-connexy.tsx:606-625`) — Editar/
Estatísticas/Promoções/Excluir/Ingressos/Ativar/Pausar/Duplicar/Corridas/Ganhos/Histórico/Avaliações são
decorativos; `PhotoUploader` é div sem handler (L375-388); campos `FormField` não-controlados (L329-352).

**9. Erros de navegação:** "Resumo" → `/profile/roles` (existe); ações rápidas → `/driver` (existe) e
wizards internos. Nenhum alvo quebrado.

**10. Políticas RLS:** n/a.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** persistir publicações/roles (nada salva no Supabase); implementar ações do
painel; controlar `FormField`; logout real em `_app.gerenciar.tsx:143` (existe, mas sem confirmação).

---

## 14. Mobilidade (ride + driver)

**1. Rotas existentes:** passageiro — `/_app/ride` (`src/routes/_app/ride.tsx`),
`/_app/ride/request`, `/_app/ride/matching`, `/_app/ride/active`, `/_app/ride/history`
(`src/routes/_app/ride/*.tsx`); legado — `/_app/corrida`, `/_app/rota`, `/_app/destino`, `/_app/matching`,
`/_app/avaliar`. Motorista — `/_app/driver` (`_app/driver/index.tsx`), `/_app/driver/cadastro`,
`/_app/driver/profile`, `/_app/driver/finance`, `/_app/driver/history`, `/_app/driver/performance`,
`/_app/driver/trip/$tripId`.

**2. Componentes utilizados:** `src/components/mobility/*`, `src/components/driver/*`
(Modals de aceite/rejeição, sheets), `src/components/roles/ModeSwitcher` (ativação de papel motorista).

**3. Hooks:** `useState` locais; `useRide` (`src/hooks/api/use-ride.ts`) **código morto**.

**4. Services:** `src/services/ride.service.ts` — **código morto**.

**5. Repositories:** `src/repositories/ride.repository.ts` (consulta `rides` inexistente, L8,21,37,47,58) —
**código morto**.

**6. Tabelas Supabase relacionadas:** `rides` (inexistente).

**7. Uso de dados reais ou mocks:** **100% MOCK** — `MOCK_DESTINATIONS`, `MOCK_COUPONS`, `MOCK_DRIVERS`
(+ `rankDrivers` de `src/lib/mobility/ride-matching.ts`), `MOCK_TRIP`, `MOCK_HISTORY`, `MOCK_EARNINGS`,
`MOCK_RIDE_REQUEST`, `MOCK_VEHICLE`, `MOCK_ENTRIES`, `MOCK_TRIPS` — tudo em estado local por rota.
Único ponto real: `_app/driver/cadastro.tsx:70` grava papel em `localStorage` (`addRole`/`setActiveMode`).
`onAccept`/`onDecline` do motorista só fecham a sheet (`_app/driver/index.tsx:92-93`).

**8. Botões sem implementação:** `_app/driver/trip/$tripId.tsx:35` — `onAction={(action) => {}}` (no-op);
`_app.destino.tsx:161` — `onClick={() => {}}`.

**9. Erros de navegação:** rotas legado `rota/destino/matching/corrida` coexistem com o novo `ride/*`
(fluxos duplicados e parcialmente inconsistentes). Nenhum alvo quebrado.

**10. Políticas RLS:** sem tabela `rides` → sem RLS. Papel motorista é só `localStorage` — qualquer usuário
pode ativá-lo editando storage (sem verificação de documento).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabela `rides` (+ `drivers`, pagamentos) e RLS; integrar `useRide`;
geolocalização real; persistir corridas/ganhos/histórico; implementar ações da trip ativa; consolidar
rotas legado vs `ride/*`.

---

## 15. Engines

**1. Rotas existentes:** `/_app/engine` (`src/routes/_app.engine.tsx`), `/_app/matching`
(`src/routes/_app.matching.tsx`), `/_app/feed` (`src/routes/_app/feed.tsx`).

**2. Componentes utilizados:** `SmartFeed` (`src/components/feed/SmartFeed.tsx`, consome
`ContextEngineContext`), `ContextEngineProvider` (`src/lib/context/context-provider.tsx`, montado em
`_app.tsx:41`), componentes de `src/components/engine/*`.

**3. Hooks:** `usePresence`; contexto de engine (`src/lib/context/*`); nenhum hook de API.

**4. Services:** nenhum conectado (engines são TypeScript puro).

**5. Repositories:** nenhum.

**6. Tabelas Supabase relacionadas:** nenhuma (tudo em memória).

**7. Uso de dados reais ou mocks:** **100% MOCK / em memória** — `src/lib/engine/engine.ts`
(`initializeEngine`, `refreshRecommendations`, `getDashboardData`) opera sobre
`src/lib/engine/engine-mocks.ts` (`mockUser`, `mockContext`, `mockRecommendations`) com coordenadas fixas
de São Paulo (`engine-context.ts:12-13`); `src/lib/feed/feed-sections.ts` (MOCK_PEOPLE 150, MOCK_PLACES 230,
MOCK_EVENTS 333, MOCK_BUSINESSES 436, MOCK_DRIVERS 466, MOCK_TRENDING 496) e `feed-builder.ts` montam
templates por environment/role; `src/lib/orchestrator/*` e `src/lib/context/*` (detector/provider/rules/
storage) são sistemas locais sem backend.

**8. Botões sem implementação:** na rota engine/matching: `MoreHorizontal` (`_app.matching.tsx:61-63`).

**9. Erros de navegação:** nenhum alvo quebrado.

**10. Políticas RLS:** n/a (sem tabelas).

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** alimentar engines com dados reais (profiles/places/events/businesses via
RPC de proximidade); geolocalização real no contexto; persistir recomendações; reels: escolher entre
`src/components/reels/comments-sheet.tsx` (real, `reel_comments`) e `reel-comments-sheet.tsx` (mock).

---

## 16. Segurança

**1. Rotas existentes:** `/_app/privacidade` (`src/routes/_app.privacidade.tsx` — "modo invisível" só em
`localStorage` `rmc:invisible`), `/_app/profile/roles` (ativação de papéis), `/_app/avaliar` (avaliações mock).

**2. Componentes utilizados:** toggles de settings (`notification-settings.tsx`), `ModeSwitcher`.

**3. Hooks:** `usePermissions` (não usado), `useOffline` (não usado).

**4. Services:** `src/services/upload.service.ts` (real, buckets `avatars`/`posts` inexistentes) — não usado.

**5. Repositories:** `src/repositories/user.repository.ts`, `marketplace.repository.ts` (RPCs inexistentes)
— código morto.

**6. Tabelas Supabase relacionadas:** `profiles` (existe), `places`/`bio_posts`/`reels`/`reel_likes`/
`reel_comments` (existem) — ver RLS abaixo.

**7. Uso de dados reais ou mocks:** modos invisível/papéis são `localStorage`; avaliações mock.

**8. Botões sem implementação:** nenhum específico além dos já listados.

**9. Erros de navegação:** nenhum.

**10. Políticas RLS (resumo real das migrações):**

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | só `authenticated` (`20260711160607`) | `auth.uid() = id` | `auth.uid() = id` | **— (sem política)** |
| `places` | público | owner | owner | owner |
| `bio_posts` | público | author | author | author |
| `reels` | público | author | author | author |
| `reel_likes` | público | próprio user | — | próprio user |
| `reel_comments` | público | author | — | author |
| storage `bio-media`/`reels-media` | público | authenticated (pasta própria) | owner | owner |

**Lacunas:** `profiles` sem DELETE; `places`/`bio_posts`/`reels`/`likes`/`comments` legíveis por `anon`
(dados sociais expostos); tabelas de repositórios inexistentes sem RLS; papéis (motorista/negócio) sem
validação no backend; `get_nearby_*` inexistentes; buckets nunca criados; credenciais de service role
ausentes; `VITE_SUPABASE_ANON_KEY` ausente; clientes Supabase duplicados.

**11. Testes existentes:** nenhum.

**12. Pendências para produção:** criar tabelas + RLS + RPCs; políticas DELETE no `profiles`; reavaliar
exposição anon de conteúdo social; validação real de papéis; rate limiting/2FA/confirmação de email;
unificar clientes e segredos de ambiente.

---

## Reels e Publisher (transversais, complementares)

- **Reels:** rotas `/_app/reels` e `/_app/reels/$reelId` são **100% mock** (`src/lib/reels/reel-mocks.ts`,
  15 reels; likes/saves/follows/comentários em estado local; `_app.reels.tsx:177-182` botão Buscar sem
  onClick; `:260` `onConnect={() => {}}`; `$reelId.tsx:185` `onOpenProfile` no-op; `:279-280` comentários
  no-op; `src/components/reels/reel-actions.tsx:35` avatar `onClick={() => {}}`). O único fluxo real é
  `gerenciar.novo-reel.tsx` (upload `reels-media` + insert `reels`) e o `comments-sheet.tsx` (real).
- **Publisher/Criação:** todos os `/create/*` e `/gerenciar/*` usam `usePublisherForm` (mock, 800ms + toast)
  — **nada persiste**, exceto o fluxo de reel. `src/lib/upload/upload-engine.ts:61-63` e
  `upload-storage.ts:3-5` lançam `'Storage provider not configured.'`.

---

## Pendências globais para produção (consolidadas)

1. **Schema:** criar migrações para `conversations`, `conversation_participants`, `messages`,
   `connection_requests`, `notifications`, `moments`, `compatibility`, `likes`, `businesses`, `events`,
   `event_users`, `offers`, `coupons`, `reviews`, `rides` + RPCs `get_nearby_profiles`/
   `get_nearby_businesses`; ou remover os repositórios mortos.
2. **Storage:** criar buckets `bio-media`, `reels-media`, `avatars`, `posts` (políticas já existem para os
   dois primeiros).
3. **Conectar telas aos dados:** Home/feed, pessoas próximas, perfil (`profiles`), chat (real time), eventos,
   locais (`places`), negócios/promoções, notificações, mobilidade — hoje 100% mock.
4. **Código morto:** decidir entre ativar ou remover `src/hooks/api/*`, `src/services/*`,
   `src/repositories/*` e `src/components/discovery/*` (nenhum é usado).
5. **Autenticação:** confirmação de email, reset de senha com UI, magic link, 2FA, validação e erros
   amigáveis; preencher `.env` (SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY).
6. **Onboarding:** persistir perfil em `profiles`/storage; unificar fluxos `/cadastro` (fake) e `/auth` (real).
7. **Navegação:** remover casts `as never`; corrigir `/perfil` no discover; destino real dos cards premium;
   link "Mensagens" para `/chat`; resolver duplicações `/perfil`+`/profile` e `/notificacoes`+`/notifications`.
8. **Botões decorativos:** implementar ações do painel Meu Connexy, perfil, locais, negócios, chat,
   motorista e reels (listadas por módulo).
9. **RLS/segurança:** política DELETE no `profiles`; reavaliar leitura anon de conteúdo social; papéis
   validados no backend; rate limiting.
10. **Testes:** não existe suíte — definir runner (vitest) e cobrir ao menos auth, chat e matching.
11. **Consolidação:** unificar os dois clientes Supabase; resolver conflito entre `comments-sheet.tsx` (real)
    e `reel-comments-sheet.tsx` (mock); consolidar fluxos legado de mobilidade (`rota/destino/matching/
    corrida`) com `ride/*`.
