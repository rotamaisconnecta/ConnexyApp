# 1H-5 — Auditoria de prontidão para Backend / Supabase

- **Data:** 2026-09-24
- **Tipo:** auditoria somente leitura. Sem implementação de backend.
- **Regra da fase:** AUDIT → MAP → CLASSIFY → DOCUMENT → TEST EXISTING SYSTEM → REPORT.
- **Arquivos de produto alterados nesta fase:** 0
- **Arquivo criado:** este relatório.
- **Commit / push:** não.
- **Classificação de prontidão arquitetural:** **PARTIAL**

Esta fase **não** criou tabelas, migrations, policies, RLS, Edge
Functions, APIs, repositories remotos, hooks remotos, adapters
Supabase, autenticação real, storage buckets, realtime nem triggers.

O MVP local/demo permanece intacto.

---

## 1. Executive Summary

O Connexy opera hoje como **MVP local em modo demo**
(`VITE_APP_DEMO_MODE=true` em `DEV`). Identidade, perfil, grafo
social, conversas, Agora, Momento, catálogo, reservas, Carona Amiga,
settings e corrida funcionam **sem backend**. `isPublicSupabaseConfigured()`
retorna `false` em demo; os fluxos auditados não instanciam nem
consultam o projeto remoto.

A pergunta desta fase:

> Se amanhã substituirmos a persistência local por backend, sabemos
> exatamente o que migrar, o que permanece local, quais entidades e
> relações existem, e quais decisões ainda estão abertas?

**Resposta:** o mapa das fontes de verdade e das entidades **existe e
é determinável pelo código**. A prontidão **não** é READY, porque:

1. Há **três camadas de persistência coexistentes**, não uma só:
   localStorage `connexy:demo:*`, IndexedDB de domínio
   (`connexy-app-local-db`, `connexy-reels-data-local-db`), e um
   conjunto de repositories/services Supabase **instalados e
   referenciados** mas **não usados** no caminho demo.
2. O schema gerado em `src/integrations/supabase/types.ts` tem
   **apenas seis tabelas** (`profiles`, `places`, `bio_posts`,
   `reels`, `reel_likes`, `reel_comments`) e **não cobre** chat,
   conexões, catálogo unificado, reservas, carona nem trip.
3. `ChatRepository` / `ConnectionsRepository` / `FeedRepository`
   assumem tabelas (`conversations`, `messages`,
   `conversation_participants`, `likes`…) que **não existem** nesse
   schema gerado. São hipóteses mortas, não contrato.
4. Muitos campos de produto são **DEMO** (chamada TEXT, motorista
   mock, reserva auto-confirmada, 2FA/cartão visuais, mapa SVG).
5. Decisões de modelo (pin, unread, participantes da conversa,
   isolamento do perfil próprio, Offer→Business, catalog vs mock)
   ainda estão abertas.

O MVP **funciona**. A arquitetura de backend **ainda não está
fechada**. Esta auditoria documenta o que o código realmente persiste,
para que a próxima fase não construa o remoto a partir de stubs ou de
mocks.

---

## 2. Arquitetura atual

### 2.1 Stack de produto

React 19, TypeScript, Vite, TanStack Router, Tailwind, Lucide, Framer
Motion. Pacotes `@supabase/supabase-js` e `@supabase/ssr` estão
instalados. Em demo, o gate `isDemoMode()` força
`isPublicSupabaseConfigured()` = `false`.

### 2.2 Modo demo

Ativado **somente** por `DEV && VITE_APP_DEMO_MODE === "true"`
(`src/lib/demo/demo-config.ts`). Identidade canônica:
`getDemoIdentity().id` (default `lucas` em `src/lib/mock-data.ts`).
Sessão demo: `connexy:demo:auth` (`"1"`). O switcher de identidade
**não é autenticação**.

### 2.3 Camadas de persistência (coexistem)

```text
UI / rotas / hooks
        │
        ├── localStorage  connexy:demo:*     (maioria dos domínios)
        ├── localStorage  chaves históricas  (presença, roles, trip…)
        ├── IndexedDB     connexy-app-local-db          (chat)
        ├── IndexedDB     connexy-reels-data-local-db   (reels domínio)
        ├── IndexedDB     connexy-reels-local-db        (blobs de mídia)
        └── (não usado no demo)  repositories/services → supabase.from(...)
```

Contrato local genérico (Fase 1C-1), documentado em
`docs/audits/persistence-architecture.md`:

```text
UI → Hook → PersistenceRepository → StorageAdapter → IndexedDB
```

Hoje esse contrato **só cobre chat e reels de domínio**. Todo o resto
do MVP escreve direto em localStorage via stores de domínio.

A intenção documentada na 1C-1 — “futuro `SupabaseRepository` no lugar
do adapter, sem reescrever telas” — **ainda não se aplica** a
identidade, social, catálogo, reservas, carona, trip nem settings.

### 2.4 Repositories em uso no demo

| Classe | Store / banco | Caminho demo |
| --- | --- | --- |
| `ConversationRepository` | `conversations` / `connexy-app-local-db` | usado via `local-chat-persistence` |
| `MessageRepository` | `messages` / `connexy-app-local-db` | usado via `local-chat-persistence` |
| `ReelRepository` | `reels` / `connexy-reels-data-local-db` | usado via `local-reel-persistence` / `persisted-reels-reader` |
| `ReelLikeRepository` | `reel_likes` | idem |
| `ReelCommentRepository` | `reel_comments` | idem |

### 2.5 Repositories / services remotos (não usados no demo)

`AuthRepository`, `UserRepository`, `ProfileRepository`,
`ChatRepository`, `ConnectionsRepository`, `FeedRepository`,
`MarketplaceRepository`, `NotificationRepository`,
`PresenceRepository`, `RideRepository` + services correspondentes.

Em demo, `useAuth` sintetiza uma `Session` fake
(`access_token: "demo"`). `use-chat.ts` escolhe o caminho local quando
`!isPublicSupabaseConfigured()`. Telas como `/connecta`, `/home`,
`/profile` ramificam para fixtures/demo.

**Não tratar esses stubs como schema-alvo.** Eles divergem tanto do
código local quanto do `Database` gerado.

---

## 3. Fontes de verdade

Nomes verificados no código. Não assumir prefixos: há
`connexy:demo:*`, `connexy:reels:*`, `connexy_demo_*` e chaves
históricas sem namespace.

### 3.1 Identidade / sessão / perfil

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:identity` | `demo-identity.ts` | id da identidade demo ativa |
| `connexy:demo:auth` | `demo-auth.ts` | sessão demo `"1"` |
| `connexy:demo:signup-pending` | `demo-auth.ts` | onboarding pendente |
| `connexy:demo:own-profile` | `demo-own-profile.ts` | perfil editável (blob único, não mapa) |

### 3.2 Social

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:db` | `demo-db.ts` | connections, requests, groups, follows; `messages[]` **legado sem novos writes** |

Inbox de convites (`local-invite-inbox.ts`) é **projeção**, não SoT.

### 3.3 Conversas / mensagens

| Fonte | Arquivo | Papel |
| --- | --- | --- |
| IndexedDB `connexy-app-local-db` stores `conversations`, `messages` | `chat-schema.ts` | SoT de threads e mensagens |
| Facade `local-chat-persistence.ts` | chat | único writer atual de mensagens |
| `connexy:demo:db.messages` | demo-db | legado migrado; sem dual-write |

### 3.4 Agora / Reels (nomes técnicos preservados)

| Fonte | Arquivo | Papel |
| --- | --- | --- |
| IndexedDB `connexy-reels-data-local-db` (`reels`, `reel_likes`, `reel_comments`) | `reels-schema.ts` | SoT de metadados + interações persistidas |
| IndexedDB `connexy-reels-local-db` store `media` | `reel-local-media-db.ts` | blobs de vídeo/pôster |
| `connexy:reels:published:v1` | `reel-local-storage.ts` | legado; migrado one-shot |
| `connexy:reels:likes:v1` | idem | legado |
| `connexy:reels:comments:v1` | idem | legado |
| `connexy:reels:migration-status:v1` | `local-reel-persistence.ts` | marcador de migração |
| `connexy:reels:sound:v1` | `reel-local-storage.ts` | preferência de som (dispositivo) |
| `MOCK_REELS` | `reel-mocks.ts` | catálogo seed; **não** SoT de conteúdo do usuário |

Nome de produto: **Agora**. Infraestrutura técnica permanece `Reel*`.

### 3.5 Momento

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:posts` | `demo-posts.ts` | posts criados pelo usuário (mídia em data URL) |
| `Moment` em `mock-data.ts` | mock-data | seed de bio/perfil; **não** o store de publicação |

### 3.6 Catalog

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:catalog` | `local-catalog.ts` | overlay persistido: Event / Place / Offer / Business |

Fixtures `MOCK_BUSINESSES`, `MOCK_EVENTS`, `MOCK_PROMOTIONS`,
`people`/`places` em `mock-data.ts` continuam a alimentar Home,
marketplace e discovery. O catalog local **não substitui** esses
mocks; **sobreposta**.

### 3.7 Reservations

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:reservations` | `reservation-store.ts` | entidade própria `Reservation` |

### 3.8 Carona Amiga

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:carona` | `carona-store.ts` | `offers` + `requests` |

**Carona Amiga não pertence ao dispatcher operacional da corrida.**

### 3.9 Mobility / Trip / Dispatcher

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy_demo_trip` | `trip-store.ts` | estado da viagem demo (uma trip por dispositivo) |
| `connexy_demo_dispatcher` | `dispatcher.ts` | política demo (`autoAccept`, `delayMs`) |
| `connexy_demo_ride_blocks` | `ride-blocks.ts` | bloqueio por inadimplência simulada |
| frota / ofertas | `dispatcher-store.ts` | **memória de módulo**; reconstroi no reload |

### 3.10 Settings

| Chave | Arquivo | Papel |
| --- | --- | --- |
| `connexy:demo:settings` | `demo-settings.ts` | mapa `{ [userId]: { twoFactor, payment, language } }` |

### 3.11 Calls

Não há banco próprio. Overlay em memória (`demo-call.ts`). Histórico
é **mensagem TEXT** em `messages` (`formatDemoCallRecord`).

### 3.12 Outras chaves encontradas (fora A–K, mas reais)

| Chave | Papel | Classificação preliminar |
| --- | --- | --- |
| `connexy:demo:outing-invites` | convite de rolê para pessoa + alvo | HYBRID futuro |
| `connexy:demo:saved-details` | ids salvos (inclui reels) | HYBRID |
| `connexy:demo:saved-profile-media` | mídia salva no perfil | LOCAL/HYBRID |
| `connexy:demo:recent-reviews:{id}` | reviews locais | DEMO/HYBRID |
| `connexy:demo:redeemed-promotions` | cupons resgatados | DEMO |
| `connexy_driver_application_v1` | cadastro motorista (nomes de arquivo, sem blob) | HYBRID/INFRA |
| `connexy_roles` | papéis USER/DRIVER e modo ativo | HYBRID |
| `connexy.presence.preference` | online/available/dnd/invisible | LOCAL/HYBRID |
| `connexy.presence.visibility` | visibilidade de presença (sistema paralelo) | dívida |
| `connexy.presence.checkins` | check-ins locais | DEMO/HYBRID |
| `connexy_context` | contexto de exploração | LOCAL |
| `connexy_live_events` | eventos live simulados | DEMO |
| `connexy:ai:history` | histórico do assistente de templates | DEMO |
| `connexy.media.permission.granted` | permissão de mídia no dispositivo | LOCAL |

### 3.13 IndexedDB (inventário)

| Banco | Stores | Domínio |
| --- | --- | --- |
| `connexy-app-local-db` | `conversations`, `messages` | chat |
| `connexy-reels-data-local-db` | `reels`, `reel_likes`, `reel_comments` | Agora metadados |
| `connexy-reels-local-db` | `media` | Agora blobs |

### 3.14 Schema remoto gerado (não usado no demo)

`src/integrations/supabase/types.ts` — PostgREST 14.5 — tabelas:
`profiles`, `places`, `bio_posts`, `reels`, `reel_likes`,
`reel_comments`. Views/functions/enums: vazios.

Isso é um **esqueleto remoto legado**, não o modelo do MVP local.

---

## 4. Inventário de entidades

### A. Identity / Profile

**Identidade demo (`DemoIdentity`)** — `id`, `name`, `photo`. Catálogo
fixo: `currentUser` + `people`. Persistida só como **id selecionado**.
Não há senha, e-mail real, JWT real.

**Sessão demo** — flag `connexy:demo:auth`. Não é conta.

**Perfil próprio (`DemoOwnProfile`)** — blob único em
`connexy:demo:own-profile`:

- público / semi-público: `name`, `handle`, `photo`, `cover`, `city`,
  `bio`, `interests`, `age`, `birthDate`
- privado: `privateAddresses.home/work`
- preferência de visibilidade: `visibility.confirmedActivity`,
  `likedPlaces`, `mutualFriends` (`Todos` | `Conexões` | `Somente você`)
- `identityId` opcional, gravado no save, mas o storage **não é um
  mapa por usuário** — troca de identidade **não isola** o blob

**O que pertence ao usuário vs ao perfil público (hoje):**

| Dado | Hoje | Futuro provável |
| --- | --- | --- |
| `id` / sessão / auth | identidade demo + flag | `auth.users` (REMOTE) |
| nome, handle, foto, capa, bio, cidade, interesses | perfil próprio | `profiles` público (REMOTE) |
| birthDate, endereços casa/trabalho | no mesmo blob | privado / owner-only (DECISÃO DE PRODUTO) |
| visibilidade | no mesmo blob | preferências (HYBRID) |
| foto/capa como arquivo | URL/data URL no blob | Storage + URL nos metadados |

`currentUser` / `people` continuam **catálogo demo** para terceiros.
Não há tabela de usuários além do perfil próprio + fixtures.

### B. Connections

Três conceitos distintos **já existem** no mesmo blob
`connexy:demo:db`. Não são a mesma entidade.

| Entidade | Campos | Papel |
| --- | --- | --- |
| `DemoRequest` | id, fromUserId, toUserId, message, status `pending\|accepted\|declined`, createdAt | pedido de conexão |
| `DemoConnection` | userAId, userBId, conversationId, connectedAt | relação aceita + thread direto |
| `DemoFollow` | followerId, followeeId, createdAt | follow unidirecional (Agora / social) |
| `DemoGroup` | id, sourceConversationId, name, creatorId, createdAt, participants[{userId, status, invitedAt, respondedAt}] | grupo derivado de um DM; o DM **não** é reutilizado |

Id do DM: `demo-direct-${sorted(userA,userB).join("--")}`.

**Request ≠ connection ≠ follow.** Aceite de request cria connection e
garante conversa IndexedDB. Follow não cria conversa. Grupo tem status
de convite próprio (`pending|accepted|declined|cancelled`).

Não há entidade `relationship` genérica.

### C. Conversations

**StoredConversation** (IndexedDB): `id`, `createdAt`, `updatedAt`,
`lastMessageText`, `lastMessageType`, `pinnedByUserIds?`,
`gestureHandledAt?`.

**Não contém participantes.** Participantes vivem em
`DemoConnection` / `DemoGroup`. A conversa é um agregado de mensagens
+ timestamps + estado de lista.

**StoredMessage:** `id`, `conversationId`, `from` (`me|them`),
`senderId?`, `senderName?`, `text`, `at`, `kind`
(`text|event|location|image|video|audio`), `payload` (dataUrl, mime,
metadados de evento/lugar).

**pinnedByUserIds**

- Vive no registro compartilhado da conversa.
- Alterado pela identidade atual (`getDemoIdentity().id`) via
  `isPinnedForUser` / `withPinnedUser` em `conversation-list-state.ts`.
- Isolamento: array de ids; cada usuário pinna para si no mesmo
  documento.
- Futuro backend: **DECISÃO ABERTA** — coluna array vs tabela
  `conversation_pins (conversation_id, user_id)` vs estado por
  participante. Array no documento compartilhado **não** escala bem
  com RLS por linha de conversa; join table é a hipótese mais
  alinhada a “isolado por usuário”.

**gestureHandledAt**

- Um timestamp **por conversa**, não por usuário.
- Ouvir/Confirmar/Retomar da lista marca o agregado inteiro.
- Isolamento por usuário: **ausente**. Dívida para RLS.

**unread**

- Derivado: `last.senderId !== userId ? 1 : 0`.
- **Não** há `read_at`, cursor nem contador persistido.
- `ChatRepository.markAsRead` existe no stub remoto e **não** no
  caminho local.

**Ownership:** não há `ownerId` na conversa. É relação entre
participantes. Mensagens têm `senderId` opcional; `from: me|them` é
perspectiva do viewer, inadequada como coluna remota.

**Call history:** mensagens TEXT (`Ligação de voz (demo) · encerrada`
etc.). Sessão de chamada: memória de módulo, não persistida.

### D. Agora / Reels

**StoredReel** (metadados persistidos do usuário): caption, category,
author snapshot, context ref, durationS, createdAt, persistence
`supabase|local`. Mídia **não** entra neste registro.

**StoredReelLike:** id determinístico `${reelId}::${userId}`, reelId,
userId.

**StoredReelComment:** id, reelId, parentId (replies), siblingOrder,
likes, likedByMe, author snapshot, text, createdAt.

**ReelMediaRecord:** id, videoBlob, videoType, posterBlob, posterType,
storedAt.

**Distinção obrigatória:**

| Tipo de dado | Fonte | Migrar? |
| --- | --- | --- |
| Conteúdo criado pelo usuário | IndexedDB domínio + media | REMOTE + Storage |
| Interação (like, comment, reply) | `reel_likes` / `reel_comments` | REMOTE |
| Follow do autor | `DemoFollow` em `connexy:demo:db` | REMOTE (grafo) |
| Connect do autor | `DemoRequest` / `DemoConnection` | REMOTE (grafo) |
| Save | `connexy:demo:saved-details` (ids genéricos) | REMOTE (save) — **não** é tabela de reels |
| `MOCK_REELS` | `reel-mocks.ts` | **não** virar tabela automaticamente |
| Som mutado | `connexy:reels:sound:v1` | LOCAL |
| Chaves `v1` de likes/comments/published | legado pós-migração | não migrar; lixo local |

Contadores de like/comment são **derivados** (`countByReel`), não
fonte primária.

Campo `persistence: "supabase" | "local"` no StoredReel é um flag de
origem, **não** prova de escrita remota no demo.

### E. Momento

**DemoPost** (`connexy:demo:posts`): id, authorId, authorName,
authorPhoto, authorHandle (snapshot), text, media[{preview data URL,
type image|video}], category, privacy, locationLabel, hashtags,
createdAt.

Persistente **localmente**. Não há feed remoto. `bio_posts` no schema
gerado é outra forma (`author_id`, `text`, `media_url`, `place_id`) e
**não** é o store de Momento do demo.

Feed/home mistura posts persistidos com mocks de `mock-data.ts`.

### F. Catalog

Tagged union em `local-catalog.ts`. Base comum: `id`, `kind`,
`ownerId`, `createdAt`, `updatedAt`.

| Kind | Campos reais |
| --- | --- |
| `event` | title, description, location, startAt, endAt, capacity?, price?, photo?, businessId? |
| `place` | name, category, address, description, hours?, cover?, lat?, lng? |
| `business` | name, category (`BusinessCategoryValue`), address, description, cover?, lat?, lng? |
| `offer` | **businessId (string, obrigatório)**, title, description, discountValue, validUntil |

**Offer → Business:** campo `businessId: string` no offer. **Não** há
foreign key, índice, cascade nem validação de existência no storage.
Evento tem `businessId?` opcional, mesma natureza (string solta).

O tipo `Business` de `business-types.ts` (hours, rating, promotions
embutidas, photos[]) é o **modelo de marketplace mock**, mais rico que
`CatalogBusiness`. São dois formatos. Não unificar nesta fase.

### G. Reservations

**Reservation é entidade própria**, não um evento colado no recurso.

Campos: id, userId, resourceId, resourceType `business|place`,
resourceName (snapshot), date, time, partySize (1–20), status
`requested|confirmed|cancelled|completed`, createdAt.

`createReservation` grava sempre `status: confirmed`. Os outros
status existem no tipo; o fluxo local **não** implementa aceite do
estabelecimento. Confirmação instantânea = **DEMO**.

Não há estabelecimento-ator, serviço, mesa, confirmação bilateral nem
pagamento. `reservable.ts` só classifica categorias elegíveis
(fixtures + catalog).

### H. Carona Amiga

Isolada do dispatcher. Store `{ offers, requests }`.

**CaronaOffer:** id, ownerId, origin, destination, meetup, date, time,
availableSeats, status `active|full|cancelled|completed`, createdAt.
Origem/destino/meetup são **labels aproximados** (texto), não geo.

**CaronaRequest:** id, rideOfferId, requesterId, status
`requested|accepted|rejected|cancelled`, createdAt, conversationId?

Aceite: `connectUser` + `sendLocalMessage` → cria/reusa DM e anexa
`conversationId`. Relação com chat é **efeito colateral social**, não
despacho de motorista.

Não há matching GPS, preço, veículo de frota nem status de trip.

### I. Mobility / Trip / Dispatcher

Três estados **já separados no código**, todos DEMO:

| Camada | Onde | Conteúdo |
| --- | --- | --- |
| Pedido / viagem do passageiro | `Trip` em `connexy_demo_trip` | origin, destination, stops, status de UI (`solicitar`…`cancelada`), category, fares, paymentMethod `pix\|dinheiro`, paymentConfirmed, paymentIssue, driver snapshot, rating, timestamps |
| Operação do motorista | `dispatcher-store` em memória + `connexy_demo_dispatcher` | frota `DemoDriver`, status `offline\|available\|offering\|accepted\|busy`, ofertas, autoAccept |
| Financeiro | `Trip.payment*` + `connexy_demo_ride_blocks` | PIX/dinheiro simulados; bloqueio `user_not_paid` até “regularização futura” |

`MOCK_DRIVER` / `buildDemoFleet` / `DEMO_DESTINATIONS` / mapa SVG =
DEMO. Cadastro `connexy_driver_application_v1` persiste **nomes de
arquivo**, não blobs.

Uma trip por dispositivo; `userId` opcional no registro.

### J. Settings

Mapa por `userId`: `{ twoFactor: boolean, payment: string, language: string }`.

| Campo | Natureza atual | Futuro |
| --- | --- | --- |
| `language` | preferência de UI, persistida | LOCAL (ou profile locale HYBRID) |
| `twoFactor` | boolean visual, sem OTP | REMOTE quando houver auth real (INFRA) |
| `payment` | string `"Cartão final 4821"` | DEMO; pagamentos reais = INFRA |

Isolamento: **sim**, por chave de identidade. Campos visuais vs
reais: twoFactor e payment são **UI demo**.

Outras “settings” fora deste mapa: presença, roles, som de reels,
visibilidade do perfil.

### K. Calls

| Aspecto | Estado atual |
| --- | --- |
| Overlay voice/video | `DemoCallSession` em memória (`outgoing\|connected`) |
| Histórico | TEXT em `messages` |
| Participantes | callerId, calleeId na sessão; no histórico só o texto |
| WebRTC | **não existe** |

Estado atual: **registro demo de chamada**.  
Estado futuro: **infraestrutura real de chamada** (INFRA, não schema
de mensagens).

---

## 5. Matriz REMOTE / LOCAL / HYBRID / DEMO

| Domínio | Entidade | Fonte atual | Tipo atual | Owner | Relações | Futuro | Confiança |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Identity | DemoIdentity | `connexy:demo:identity` + fixtures | localStorage + mock | dispositivo | perfil, todos os userId | REMOTE (auth) | Alta |
| Identity | Demo session flag | `connexy:demo:auth` | localStorage | dispositivo | — | HYBRID (sessão) | Alta |
| Identity | DemoOwnProfile | `connexy:demo:own-profile` | localStorage blob | identidade atual (fraco) | DemoIdentity | REMOTE + LOCAL visibilidade | Alta |
| Identity | people / currentUser | `mock-data.ts` | fixture | — | discovery, chat catalog | DEMO / seed | Alta |
| Social | DemoRequest | `connexy:demo:db` | localStorage | fromUser | toUser | REMOTE | Alta |
| Social | DemoConnection | `connexy:demo:db` | localStorage | par | conversationId | REMOTE | Alta |
| Social | DemoFollow | `connexy:demo:db` | localStorage | follower | followee, reels | REMOTE | Alta |
| Social | DemoGroup | `connexy:demo:db` | localStorage | creator | participants, source DM | REMOTE | Média |
| Chat | StoredConversation | IDB `conversations` | IndexedDB | relação | messages, pin, gesture | REMOTE | Alta |
| Chat | StoredMessage | IDB `messages` | IndexedDB | sender | conversation | REMOTE | Alta |
| Chat | pinnedByUserIds | campo no aggregate | array no doc | cada userId | conversation | REMOTE (join) / DECISÃO ABERTA | Média |
| Chat | gestureHandledAt | campo no aggregate | número | conversa inteira | last message | DECISÃO ABERTA | Média |
| Chat | unread | derivado | não persistido | viewer | last senderId | REMOTE (cursor) / DECISÃO ABERTA | Média |
| Chat | MOCK_CONVERSATIONS | `mock-conversations.ts` | fixture | — | — | DEMO | Alta |
| Agora | StoredReel | IDB `reels` | IndexedDB | author | likes, comments, media | REMOTE | Alta |
| Agora | ReelMediaRecord | IDB `media` | blob local | author | reel id | REMOTE Storage | Alta |
| Agora | StoredReelLike | IDB `reel_likes` | IndexedDB | user | reel | REMOTE | Alta |
| Agora | StoredReelComment | IDB `reel_comments` | IndexedDB | author | reel, parent | REMOTE | Alta |
| Agora | MOCK_REELS | `reel-mocks.ts` | fixture | — | feed merge | DEMO / seed | Alta |
| Agora | sound preference | `connexy:reels:sound:v1` | localStorage | dispositivo | — | LOCAL | Alta |
| Agora | save | `connexy:demo:saved-details` | ids | viewer | reel/place/event… | REMOTE | Média |
| Momento | DemoPost | `connexy:demo:posts` | localStorage + data URL | author | perfil snapshot | REMOTE + Storage | Alta |
| Momento | Moment mock | `mock-data.ts` | fixture | — | bio | DEMO | Alta |
| Catalog | CatalogEvent/Place/Business/Offer | `connexy:demo:catalog` | localStorage | ownerId | Offer.businessId string | REMOTE | Média |
| Catalog | MOCK_BUSINESSES / EVENTS / PROMOTIONS | `mock-businesses.ts` | fixture | — | marketplace UI | DEMO / seed / DECISÃO DE PRODUTO | Alta |
| Catalog | Place mock | `mock-data.ts` | fixture | — | locais, reserva | DEMO / seed | Alta |
| Reservations | Reservation | `connexy:demo:reservations` | localStorage | userId | resourceId+type | REMOTE | Alta |
| Carona | CaronaOffer | `connexy:demo:carona` | localStorage | ownerId | requests | REMOTE | Alta |
| Carona | CaronaRequest | `connexy:demo:carona` | localStorage | requester | offer, conversationId? | REMOTE | Alta |
| Outing | OutingInvite | `connexy:demo:outing-invites` | localStorage | fromUser | person, target | REMOTE | Média |
| Mobility | Trip | `connexy_demo_trip` | localStorage | passageiro demo | driver snapshot | DEMO → REMOTE futuro | Alta |
| Mobility | Dispatcher fleet/offers | memória + `connexy_demo_dispatcher` | in-memory | sistema demo | Trip | DEMO | Alta |
| Mobility | RideBlock | `connexy_demo_ride_blocks` | localStorage | userId | tripId | DEMO / INFRA pagamentos | Média |
| Mobility | MOCK_DRIVER / destinos | `ride-data.ts` | fixture | — | TripDriver | DEMO | Alta |
| Driver | DriverApplication | `connexy_driver_application_v1` | localStorage nomes | candidato | — | REMOTE + Storage | Média |
| Settings | DemoLocalSettings | `connexy:demo:settings` | mapa localStorage | userId | — | HYBRID | Alta |
| Presence | preference / visibility / checkins | 3 chaves distintas | localStorage | dispositivo | — | HYBRID / DECISÃO ABERTA | Baixa |
| Roles | UserRolesState | `connexy_roles` | localStorage | dispositivo (não keyed) | driver mode | HYBRID | Média |
| Calls | DemoCallSession | memória | overlay | caller | conversation | DEMO | Alta |
| Calls | call TEXT record | messages | texto | sender | conversation | DEMO (até WebRTC) | Alta |
| Live / AI / context | live events, ai history, context | localStorage | simulação | dispositivo | — | DEMO / LOCAL | Alta |
| Reviews / coupons | recent-reviews, redeemed-promotions | localStorage | demo marketplace | viewer | business/place | DEMO | Média |

---

## 6. Matriz de possível backend

Hipótese arquitetural **somente**. Nenhuma tabela deve ser criada a
partir desta lista. Status: `HIPÓTESE` | `DECISÃO DE PRODUTO` |
`INFRA`.

O schema gerado (`profiles`, `places`, `bio_posts`, `reels`,
`reel_likes`, `reel_comments`) **pode** coincidir em nome com algumas
linhas abaixo. **Não** reutilizar cegamente: colunas locais e geradas
já divergem (ex.: comments locais têm `parentId`, `siblingOrder`,
`likes`; gerados têm só `author_id`, `reel_id`, `text`).

| Entidade | Possível tabela futura | Chave primária | Foreign keys | RLS provável | Realtime | Storage | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User/Account | `auth.users` | uuid | — | auth | não | — | INFRA |
| Profile | `profiles` | user_id = auth.uid | auth.users | público + owner | não necessário | avatar/cover | HIPÓTESE (já existe gerada, incompleta vs DemoOwnProfile) |
| Private profile fields | `profile_private` ou colunas | user_id | profiles | somente owner | não | — | DECISÃO DE PRODUTO |
| Connection request | `connection_requests` | id | from, to → profiles | participantes | provavelmente | — | HIPÓTESE |
| Connection | `connections` | (user_a, user_b) | profiles, conversation? | participantes | provavelmente | — | HIPÓTESE |
| Follow | `follows` | (follower, followee) | profiles | público ou dono | não necessário | — | HIPÓTESE |
| Group | `groups` + `group_members` | id | creator, users | membros | provavelmente | — | DECISÃO DE PRODUTO (modelo atual é derivado de DM) |
| Conversation | `conversations` | id | — | participantes | necessário | — | HIPÓTESE (**não** está no schema gerado) |
| Conversation participant | `conversation_participants` | (conv, user) | conversations, profiles | participantes | necessário | — | HIPÓTESE (hoje fora do aggregate) |
| Pin | `conversation_pins` | (conv, user) | conversations, profiles | owner da linha | não necessário | — | DECISÃO DE PRODUTO vs array |
| Message | `messages` | id | conversation, sender | participantes | necessário | anexos | HIPÓTESE |
| Read cursor | `conversation_reads` | (conv, user) | — | owner | provavelmente | — | DECISÃO DE PRODUTO |
| Reel | `reels` | id | author, place? | público + owner | não necessário | vídeo/poster | HIPÓTESE (gerada diverge) |
| Reel like | `reel_likes` | (reel, user) | reels, profiles | público read / owner write | não necessário | — | HIPÓTESE |
| Reel comment | `reel_comments` | id | reel, parent, author | público + owner | provavelmente | — | HIPÓTESE |
| Save | `saves` | (user, target) | polimórfico? | owner | não necessário | — | DECISÃO DE PRODUTO (hoje ids genéricos) |
| Moment / post | `posts` ou `bio_posts` | id | author, place? | privacy | não necessário | mídia | DECISÃO DE PRODUTO (dois formatos no repo) |
| Catalog item | `catalog_items` ou tabelas por kind | id | owner, business_id? | público + owner | não necessário | imagens | DECISÃO DE PRODUTO (1 tabela vs 4; vs fixtures) |
| Reservation | `reservations` | id | user, resource | owner + estabelecimento | provavelmente | — | HIPÓTESE (ator estabelecimento inexistente) |
| Carona offer | `carona_offers` | id | owner | público + owner | provavelmente | — | HIPÓTESE |
| Carona request | `carona_requests` | id | offer, requester, conversation? | owner offer + requester | provavelmente | — | HIPÓTESE |
| Outing invite | `outing_invites` | id | from, to, target | participantes | provavelmente | — | HIPÓTESE |
| Trip | `trips` | id | rider, driver | participantes | necessário | — | INFRA (hoje DEMO) |
| Dispatch offer | `dispatch_offers` | id | trip, driver | motorista + sistema | necessário | — | INFRA |
| Driver application | `driver_applications` | id | user | owner + ops | não | docs/selfie/veículo | INFRA |
| Settings | `user_settings` / device prefs | user_id | profiles | owner | não | — | DECISÃO DE PRODUTO |
| Call session | infra WebRTC (não tabela de chat) | — | — | participantes | necessário | — | INFRA |
| Payment | gateway + ledger | — | trip/reservation | owner + ops | não | — | INFRA |

---

## 7. Relacionamentos

Mapa **real** extraído do código — não um modelo desejado.

```text
DemoIdentity (lucas | people.*)
 ├── Demo session flag
 ├── DemoOwnProfile          [blob único; isolation fraca]
 ├── DemoLocalSettings       [mapa por userId]
 ├── roles / presence        [dispositivo, não keyed]
 │
 ├── Social blob (connexy:demo:db)
 │    ├── DemoRequest        fromUser → toUser
 │    ├── DemoConnection     userA ↔ userB → conversationId
 │    ├── DemoFollow         follower → followee
 │    └── DemoGroup          creator + participants
 │         └── sourceConversationId (DM origem, não reusado)
 │
 ├── StoredConversation (IDB)
 │    ├── StoredMessage*
 │    ├── pinnedByUserIds[]
 │    ├── gestureHandledAt
 │    └── (participantes NÃO estão aqui)
 │
 ├── Agora
 │    ├── StoredReel (author snapshot) → ReelMediaRecord
 │    ├── StoredReelLike (reel × user)
 │    ├── StoredReelComment (parentId replies)
 │    ├── MOCK_REELS (merge no feed, sem persistir)
 │    ├── follow/connect via grafo social
 │    └── save via saved-details (id solto)
 │
 ├── DemoPost (Momento)      author snapshot + media data URL
 │
 ├── Catalog overlay
 │    ├── CatalogEvent  --businessId?--> CatalogBusiness | mock
 │    ├── CatalogPlace
 │    ├── CatalogBusiness
 │    └── CatalogOffer  --businessId--> string (sem FK)
 │
 ├── Reservation             user × (resourceType, resourceId snapshot)
 │
 ├── Carona
 │    ├── CaronaOffer (owner)
 │    └── CaronaRequest → offer
 │         └── conversationId? → connectUser + StoredMessage
 │
 ├── OutingInvite            fromUser × person × target (place/business)
 │
 └── Mobility DEMO
      ├── Trip (1/dispositivo) → TripDriver snapshot
      ├── Dispatcher memória → frota mock
      └── RideBlock (user × trip)
```

Relações **não** encontradas como FK real: Offer.businessId,
Event.businessId, Reservation.resourceId, save ids, Reel context,
OutingInvite.targetId. São strings copiadas.

---

## 8. Ownership

Convenção: **hoje** = o que o código permite; **futuro** = hipótese
de RLS, não implementada.

### Identidade / perfil

1. Cria: onboarding demo / defaults de `currentUser`.
2. Edita: identidade ativa, no blob único.
3. Apaga: não há delete de conta.
4. Visualiza: próprio perfil nas telas de profile; terceiros vêm de
   fixtures.
5. Interage: n/a.
6. Owner: teoricamente `identityId`; na prática o blob é global no
   dispositivo.
7. Público: nome, handle, foto, bio, interesses.
8. Privado: endereços, birthDate (no mesmo blob).
9. Relação: não.

### Connection request / connection / follow / group

1. Request: fromUser cria; toUser aceita/recusa.
2. Connection: criada no aceite; não há “editar”.
3. Follow: follower cria/remove.
4. Group: creator convida; participante responde.
5. Visualização: participantes (e discovery de pessoas mock).
6. Dado de relação entre usuários: **sim**.

### Conversation / message

1. Conversa: efeito de `connectUser` / grupo / carona aceite.
2. Mensagem: sender (identidade atual).
3. Delete de mensagem/conversa: não há produto de delete remoto;
   clear local existe em utilitários de persistência.
4. Visualiza: quem tem o thread no dispositivo (sem ACL real).
5. Pin: cada userId no array.
6. Público: **não**.
7. Relação: **sim**.

### Reel / like / comment / media

1. Reel: author (identidade atual) + blob local.
2. Like/comment: viewer.
3. Delete: mídia local tem delete; produto de delete remoto não
   auditado como fluxo completo.
4. Visualiza: feed local (mocks + persistidos) — efetivamente público
   no dispositivo.
5. Owner do reel: authorId.
6. Like: relação user×reel.
7. Comment: conteúdo do author com parent.

### Momento

1. Cria/edita: authorId = identidade.
2. Privacy é **string** no post; enforcement real: **não**.
3. Mídia no próprio registro (data URL).

### Catalog

1. Cria: `ownerId = getDemoIdentity().id`.
2. Edita/apaga: owner no store local (disclaimer: sem catálogo
   compartilhado entre dispositivos).
3. Visualiza: qualquer um no mesmo browser (overlay + mocks).
4. Offer.businessId não prova ownership do business.

### Reservation

1. Cria: userId; status já `confirmed`.
2. Cancela: mesmo userId.
3. Estabelecimento **não** é ator.
4. Privado ao userId no read (`listReservations` filtra).

### Carona

1. Offer: ownerId cria/cancela.
2. Request: requester cria; owner aceita/recusa; requester pode
   cancelar.
3. Visualiza offers `active` de outros; as próprias na lista “minhas”.
4. Conversation pós-aceite: os dois passam a ser participantes do DM.

### Trip / dispatcher / calls / settings

Trip: passageiro do dispositivo. Dispatcher: sistema demo. Calls:
caller na sessão; histórico como mensagem. Settings: userId do mapa.

---

## 9. RLS futura — somente análise

Sem SQL. Sem policies. Classificação por entidade que **provavelmente**
será remota.

| Entidade | RLS hipotética |
| --- | --- |
| profiles (campos públicos) | público + owner |
| profile privado / birthDate / endereços | somente owner |
| connection_requests | participantes (from, to) |
| connections | participantes |
| follows | público read; write = follower |
| groups / members | membros; convites pendentes = convidado + creator |
| conversations / messages | participantes |
| pins / reads / gestures | somente owner da linha |
| reels metadados | público + owner (privacy de reel = DECISÃO DE PRODUTO) |
| reel_likes / comments | público read; write = autor da interação; delete = autor ou dono do reel (DECISÃO DE PRODUTO) |
| saves | somente owner |
| posts / momentos | regra contextual (`privacy` string hoje) |
| catalog | público + owner; offers ligadas a business = regra contextual |
| reservations | owner; futuro + estabelecimento (ator inexistente) |
| carona offers | público das ativas + owner |
| carona requests | owner da offer + requester |
| outing invites | participantes |
| trips / dispatch | participantes + motorista; ops |
| driver application | somente owner + ops |
| settings 2FA/pagamento reais | somente owner |
| language | LOCAL — sem RLS |
| calls WebRTC | participantes — INFRA, não RLS de TEXT |

---

## 10. Storage futuro

Separar **arquivo** de **metadados**.

| Dado | Arquivo | Metadados |
| --- | --- | --- |
| Avatar / capa do perfil | blob/URL | `photo`, `cover` no perfil |
| Foto/vídeo de Momento | hoje data URL no JSON | `DemoPost.media[]` |
| Vídeo/pôster Agora | IndexedDB `media` blobs | `StoredReel` + duration/caption |
| Imagem de Event/Place/Business | data URL/`photo`/`cover` no catalog | campos do item |
| Anexos de chat (image/video/audio) | `payload.dataUrl` na mensagem | kind, mime, fileName |
| Documentos de motorista | **não persistidos** (só `*Name`) | `DriverApplication` |
| Foto do veículo | só nome | vehicle.photoName |
| Selfie / RG | só nome | identity.*Name |

Não criar bucket nesta fase. Chat e Momento hoje estouram localStorage
com data URLs — risco conhecido, não bug a “corrigir” aqui.

MOCK_REELS usam URLs de fixture (pravatar/unsplash) — seed, não
upload de usuário.

---

## 11. Realtime futuro

| Domínio | Classificação | Motivo |
| --- | --- | --- |
| Messages | necessário | thread ao vivo entre dispositivos |
| Conversation list (last message, unread) | necessário | derivado das mensagens |
| Connection requests / groups | provavelmente | aceite aparece no outro aparelho |
| Carona request/accept | provavelmente | vaga e conversa |
| Outing invites | provavelmente | simétrico a requests |
| Reservation status | provavelmente | só quando houver ator estabelecimento |
| Trip / dispatcher | necessário (quando sair de DEMO) | matching e posição |
| Calls | necessário (INFRA WebRTC) | sinalização; **não** o TEXT atual |
| Reels likes/comments | decisão aberta | feed local tolera refresh; live comments são produto |
| Follow | não necessário | eventual consistente basta |
| Catalog CRUD | não necessário | publicação, não chat |
| Settings / language / sound | não necessário | |
| Profile | não necessário | |

Não implementar realtime. O demo usa `window` CustomEvent +
`storage` event no **mesmo** browser.

---

## 12. Offline / cache

| Dado | Sobrevive reload? | Fonte de verdade? | Cache? | Fallback? | Só demo? |
| --- | --- | --- | --- | --- | --- |
| `connexy:demo:*` stores | sim | **sim** (local) | não | n/a | sim (modo), dados reais do usuário demo |
| Chat IDB | sim | **sim** | não | n/a | persistência real local |
| Reels domínio + media IDB | sim | **sim** para user-generated | não | MOCK_REELS preenche feed | híbrido feed |
| `connexy:reels:*:v1` legado | sim | não (pós-migração) | lixo | — | legado |
| Trip localStorage | sim | **sim** no demo | não | — | DEMO |
| Dispatcher frota | **não** (memória) | runtime | — | reconstrói fleet | DEMO |
| Call session | **não** | runtime | — | histórico TEXT | DEMO |
| MOCK_* / people / places | bundle | seed | n/a | UI quando store vazio | DEMO |
| Session flag | sim | demo auth | — | — | DEMO |
| `useAuth` token `"demo"` | memória derivada | não | — | substitui JWT | DEMO |
| Stubs Supabase | não chamados | não | — | código morto no demo | — |

No demo, localStorage/IndexedDB **são** a fonte de verdade, não cache
de um remoto. Após backend, esses stores viram cache/fallback —
**mudança de papel**, não migração automática.

---

## 13. Mocks

### MOCKS QUE NÃO DEVEM VIRAR BANCO AUTOMATICAMENTE

| Mock | Arquivo | Papel hoje | Não fazer |
| --- | --- | --- | --- |
| `MOCK_REELS` | `reel-mocks.ts` | seed do feed Agora | virar tabela `reels` |
| `MOCK_REELS` (engine) | `engine-mocks.ts` | recomendações do motor | misturar com Agora |
| `MOCK_CONVERSATIONS` | `mock-conversations.ts` | UI fallback / não-demo | schema de chat |
| `MOCK_BUSINESSES` / `MOCK_EXTRA_*` | `mock-businesses.ts` | marketplace, Home, reserva | copiar 1:1 para `businesses` |
| `MOCK_EVENTS` / `MOCK_PROMOTIONS` / `MOCK_COUPONS` | idem | catálogo comercial seed | tabelas promocionais cegas |
| `people` / `currentUser` / `places` | `mock-data.ts` | identidade, discovery, locais | `users`/`places` literais |
| `Moment[]` no mock-data | mock-data | bio seed | `bio_posts` |
| `MOCK_DRIVER` / destinos | `ride-data.ts` | corrida visual | `drivers` de produção |
| `buildDemoFleet` | `demo-fleet.ts` | dispatcher | frota real |
| MapCanvas SVG | ride UI | mapa | tiles/GPS |
| `DEMO_CALL_FEEDBACK` | `demo-call.ts` | overlay | rows de WebRTC |
| Assistente `connexy:ai:history` | templates | chat de ajuda | tabela de LLM |
| `connexy_live_events` | live-storage | simulação | realtime live |
| Reviews / cupons locais | `local-engagement.tsx` | engajamento demo | `reviews` sem produto |
| Engine recommendations | `engine-mocks.ts` | cards | ranking remoto |

Para cada um: tratar como **seed**, **catálogo editorial**,
**fixture de teste** ou **DEMO**. Conteúdo real só entra no banco
quando um usuário/estabelecimento **criar** o registro (catalog
overlay, DemoPost, StoredReel, Reservation, CaronaOffer, etc.).

---

## 14. Decisões abertas

### Produto

- Follow vs connection vs request: três grafos; o produto remoto
  deve expô-los separados ou unificar?
- Grupos: continuar derivados de DM (`sourceConversationId` nunca
  reusado) ou serem conversas de N participantes?
- Privacy de Momento e de Reel: strings/flags locais sem enforcement.
- Catalog: uma tabela polimórfica vs Event/Place/Business/Offer
  separados vs CMS editorial + UGC.
- Offer.businessId / Event.businessId: FK real no futuro?
- Reserva: confirmação instantânea vs aceite do estabelecimento
  (ator hoje inexistente). Delivery/retirada: ainda fora.
- Save genérico (`saved-details`) vs saves por tipo.
- Settings: language local; 2FA/pagamento reais exigem produto de
  auth/billing.
- Presença: duas chaves (`preference` vs `visibility`) + checkins.
- Perfil próprio: um blob vs perfil por identidade vs `auth.users`.
- `bio_posts` gerado vs `DemoPost`: qual é o Momento canônico?

### Arquitetura

- Pin: array no documento vs join table.
- Unread / read cursor: inexistente no local.
- `gestureHandledAt` compartilhado vs por usuário.
- `StoredMessage.from: me|them` vs só `senderId`.
- Participantes: hoje no grafo social, não na conversa.
- Adapter IndexedDB só em chat/reels; resto é store ad hoc —
  unificar antes do swap remoto?
- Stubs `ChatRepository` etc. vs redesenho a partir das entidades
  locais.
- Schema gerado de 6 tabelas: adotar, estender ou ignorar?

### Infraestrutura (não são decisões de tabela)

- Auth real (e-mail/OTP/OAuth).
- Storage de mídia (reels, momentos, chat, avatares, docs motorista).
- Realtime.
- WebRTC / chamadas.
- GPS / mapas.
- Gateway de pagamento / regularização de RideBlock.
- Validação de documentos de motorista.
- IA além de templates.

### Dívidas observadas (não corrigidas nesta fase)

- Own-profile não isolado por identidade.
- Roles/`connexy_roles` não keyed por userId.
- Dual presença.
- Data URLs em localStorage (momentos, anexos de chat).
- Reserva `requested` nunca usado no create.
- Dispatcher não sobrevive reload (só config + trip).
- Campo `StoredReel.persistence = "supabase"` no caminho local.

Classificação: **bug atual** só se o MVP local quebrar; nenhum
bloqueou esta auditoria. O restante é dívida / decisão / infra.

---

## 15. Dependências de infraestrutura

| Capacidade | Dependência | Bloqueia qual domínio remoto |
| --- | --- | --- |
| Contas reais | Supabase Auth | tudo com owner |
| RLS | Auth + modelo de participantes | chat, conexões, reservas |
| Storage | buckets + CDN | Agora, Momento, avatar, chat media, driver docs |
| Realtime | canais / postgres changes | mensagens, dispatch, carona, convites |
| GPS / maps | provedor de mapa + permissão | trip, carona geo, nearby real |
| WebRTC | sinalização + STUN/TURN | calls (independente de messages TEXT) |
| Pagamentos | PSP + ledger | trip fare, RideBlock, futuro reserva |
| Moderação / denúncia | ops | carona, chat, reels (hoje só comentário no código) |
| IA | modelo/API | assistente (hoje templates) |

Pacotes Supabase já instalados **não** constituem essa infra: o gate
de demo os desliga.

---

## 16. Ordem sugerida para futura migração

A ordem A–G do briefing é razoável. A auditoria **ajusta o recorte**,
não inverte o princípio “identidade primeiro”.

### Etapa A — Identidade

Auth real, `profiles`, split público/privado, substituir
`getDemoIdentity()` como owner. Sem isso, RLS de qualquer outra
tabela é teatro.

### Etapa B — Grafo social + conversas

Requests, connections, follows, groups, conversations,
participants, messages. Inclui **pin/unread como decisão explícita**.
Carona e outing **já escrevem** nesse grafo; não dá para migrar
carona antes do DM.

### Etapa C — Conteúdo

Momento + Agora metadados + Storage de mídia. Likes/comments.
**Não** importar `MOCK_REELS` nem `Moment` de `mock-data`.

### Etapa D — Catálogo + reservas (+ outing)

Só depois de A (owner). Decidir overlay UGC vs fixtures editoriais.
Reservas exigem decisão do ator estabelecimento. Offer.businessId
vira FK só se o produto unificar CatalogBusiness e MOCK_BUSINESSES.

### Etapa E — Carona Amiga

Depende de A+B. Continua **fora** do dispatcher.

### Etapa F — Mobilidade operacional

Trip + dispatcher + RideBlock. Continua DEMO até GPS, frota real e
pagamento. Não promover `connexy_demo_trip` a tabela de produção
sem redesenho.

### Etapa G — Pagamentos + infra pesada

GPS, realtime de dispatch, WebRTC, Storage pesado, IA, documentos
de motorista.

**Justificativa da ordem:** o código já acopla Carona e grupos ao
`connectUser`/`sendLocalMessage`. Conteúdo (C) pode paralelizar com
B depois de A. Mobilidade (F) não desbloqueia o resto do MVP social.
Pagamentos (G) desbloqueiam RideBlock e, eventualmente, reserva paga.

Nenhuma etapa foi implementada.

---

## 17. Riscos

1. **Implementar o schema dos stubs** (`ChatRepository.from("conversations")`)
   em vez do modelo local real (participantes no grafo, pin array,
   mensagens IndexedDB).
2. **Reusar as 6 tabelas geradas** como se fossem o MVP: faltam chat,
   conexões, catálogo, reservas, carona; `reel_comments` gerado é
   mais pobre que `StoredReelComment`.
3. **Promover mocks a linhas de produção** (`MOCK_REELS`,
   `MOCK_BUSINESSES`, `MOCK_DRIVER`).
4. **Tratar TEXT de chamada como sessão WebRTC.**
5. **Misturar Carona Amiga com dispatcher.**
6. **Achar que o adapter IndexedDB já cobre o app** — só chat/reels.
7. **Own-profile / roles sem isolamento** virarem um único `profiles`
   row compartilhado.
8. **Data URLs** migrados literais para Postgres em vez de Storage.
9. **Reservation.confirmed instantâneo** virar regra de negócio remota
   sem estabelecimento.
10. **Ligar Supabase no demo** sem gate — quebraria o MVP local
    (`isDemoMode` hoje impede isso).
11. **Dual-write** legado (`demo-db.messages`) se alguém “reativar”
    o array.
12. **RLS de conversa** sem tabela de participantes — o aggregate
    atual não tem quem pode ler.

---

## 18. Conclusão

O MVP local está **funcionalmente consolidado** (1H-4 PASS). A
prontidão para backend é **PARTIAL**: as fontes de verdade foram
encontradas, as entidades principais catalogadas, ownership e
relações documentados, mocks separados, e o que é DEMO foi marcado
como DEMO.

O que impede READY:

- decisões de produto ainda abertas (grafo, catálogo, reserva,
  pin/unread, Momento vs `bio_posts`);
- duas (na prática três) persistências;
- schema remoto gerado e stubs **desalinhados** do modelo local;
- infra (auth, storage, realtime, WebRTC, GPS, pagamentos) ainda
  fora do escopo, mas necessária para vários “REMOTE”.

Não está **BLOCKED**: nada estrutural essencial ficou indecifrável no
código. Amanhã é possível desenhar a Etapa A sem inventar entidades
— desde que se **ignore** o impulso de copiar mocks e stubs.

### Status final

| Critério | Resultado |
| --- | --- |
| Fontes de verdade identificadas | PASS |
| Entidades principais catalogadas | PASS |
| Ownership documentado | PASS |
| Relações documentadas | PASS |
| LOCAL / REMOTE / HYBRID / DEMO | PASS |
| Possíveis tabelas futuras (hipótese) | PASS |
| RLS futura (análise) | PASS |
| Storage futuro | PASS |
| Realtime futuro | PASS |
| Mocks separados | PASS |
| Decisões abertas explícitas | PASS |
| Dependências de infra explícitas | PASS |
| Nenhuma tabela/migration/backend | PASS |
| MVP local intacto | PASS |
| Prontidão arquitetural | **PARTIAL** |

### Recomendação para a próxima fase

Não implementar backend ainda. A próxima fase útil é **fechar as
decisões de produto/arquitetura da Etapa A+B** (identidade canônica
remota, grafo, participantes de conversa, pin/unread) **ou** um
spike documentado de alinhamento: “schema gerado vs entidades
locais vs stubs — qual contrato sobrevive”. Qualquer criação de
tabela antes disso reintroduz as suposições que esta fase existiu
para impedir.

---

## Apêndice — Verificação desta fase

Nenhum arquivo de produto foi alterado. Não foram criados testes
artificiais.

| Check | Resultado |
| --- | --- |
| Testes unitários existentes (não-browser) | **326 pass / 0 fail / 1509 expect()** em 32 arquivos |
| Testes browser CDP | não reexecutados (produto intacto); evidência 1H-2/1H-4: `networkCalls = 0` |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| Network demo | `isDemoMode()` ⇒ `isPublicSupabaseConfigured() === false` |
| Supabase remoto | **0** nos fluxos demo auditados |
| Tabelas / migrations / RLS / Edge / buckets | **0** criados |
