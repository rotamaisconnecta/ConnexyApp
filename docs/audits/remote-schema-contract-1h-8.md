# 1H-8 — Remote Schema Design / Supabase Contract

- **Data:** 2026-09-24
- **Tipo:** desenho documental do Schema A. Sem implementação.
- **Herdado:** 1H-5, 1H-6, 1H-7, 1H-7A, 1H-7B, 1H-7C. **Não** modificados.
- **Arquivo criado:** este relatório.
- **Arquivos de produto alterados:** 0
- **STATUS:** **PASS**
- **BACKEND READINESS:** **READY WITH OPEN FUTURE DECISIONS**

Nenhuma tabela, migration, policy SQL, Storage bucket, Realtime, repository remoto, tela ou chamada de rede foi criada.

Este documento é o contrato para uma **futura** implementação Supabase do **Schema A — Core Connexy**. Não é SQL executável.

---

## 1. Objetivo

Desenhar o contrato remoto do Schema A com precisão suficiente para que a próxima fase implemente Auth, tabelas, FKs, RLS e Storage **sem inventar entidades, relações, ownership ou constraints fundamentais**.

Schema B (Commerce) entra **somente como anexo**. Payment, Cart, Delivery, Inventory, ProductVariant, Commission, Ticketing e Staff **não** são modelados.

Não copiar:

- `src/integrations/supabase/types.ts` (esqueleto legado de 6 tabelas);
- `ChatRepository` / `ConnectionsRepository` / `FeedRepository` (hipóteses mortas, 1H-5);
- mocks (`MOCK_REELS`, `MOCK_BUSINESSES`, `people`, `places`);
- blobs de localStorage como “uma tabela = um JSON”.

O domínio vem dos contratos **1H-5 → 1H-7C** e do comportamento real do MVP.

---

## 2. Fontes de autoridade

| Fonte | Papel |
| --- | --- |
| `docs/audits/backend-readiness-1h-5.md` | Fontes de verdade locais; stubs ≠ contrato; schema gerado insuficiente |
| `docs/audits/domain-contract-1h-6.md` | Identity, grafo, chat, pin/read, ownership, IDs |
| `docs/audits/domain-decisions-1h-7.md` | Catálogo 4 entidades, reserva, group=conversation, call kind, carona |
| `docs/audits/business-commerce-contract-1h-7a.md` | Product/Service/Order no B; Delivery ≠ Trip |
| `docs/audits/business-customer-experience-1h-7b.md` | App / Business / Admin; Gerenciar ≠ dashboard |
| `docs/audits/domain-decisions-1h-7c.md` | **Prevalece** em conflitos; Payment fora do A; Order ⟂ Reservation |

Código de domínio revalidado (somente leitura): `demo-identity.ts`, `demo-own-profile.ts`, `demo-db.ts`, `demo-posts.ts`, `chat-entities.ts`, `reels-entities.ts`, `local-catalog.ts`, `reservation-store.ts`, `carona-store.ts`, `saved-details.ts`, `demo-settings.ts`.

Quando 1H-7C diverge de um rascunho anterior, **1H-7C vence**.

---

## 3. Princípios

1. **Identity ≠ Profile.** `auth.users.id` = Identity. Profile 1:1 com o mesmo UUID. Sem `profileId` separado.
2. **Follow ≠ ConnectionRequest ≠ Connection.** Três tabelas. Connection pode existir sem Request (`connectUser` / aceite de Carona).
3. **Connection não cria Conversation no banco.** O efeito (ensure DM) é regra de **aplicação**, não trigger.
4. **Participantes são explícitos.** Inbox remoto **não** infere membership de Follow/Request/Connection.
5. **Pin e `last_read_at` pertencem ao participante.** Unread é derivado. Não existe `messages.is_unread`.
6. **Message = conteúdo.** `kind = call` é evento no transcript, **não** WebRTC.
7. **Post ≠ Reel.** Agora é nome de produto; tabelas técnicas `reels` / `reel_likes` / `reel_comments`.
8. **Business ⟂ Place.** Sem FK obrigatória. Event sem `place_id`. Offer → Business obrigatório.
9. **Event ≠ Ticket.** Reservation ≠ Order. Sem FK cruzada no primeiro desenho.
10. **Carona Amiga ≠ Trip ≠ Dispatcher ≠ Delivery.**
11. **Product / Service / Order / OrderItem = Schema B.** Não entram no A.
12. **`/gerenciar` ≠ Business Dashboard.** O A não cria tabelas de dashboard.
13. **Owner-only.** Sem Staff. `owner_id` do catálogo = Identity criadora.
14. **Mocks não migram.** Seed editorial fica fora das tabelas de domínio.
15. **IDs remotos são UUID.** Não reutilizar `lucas`, `demo-direct-…`, `business-${Date.now()}`.
16. **Não reusar o schema gerado.** As 6 tabelas atuais não representam o MVP.

### Packing fechado nesta fase (delegado pelo 1H-7 / 1H-7C)

| Item | Decisão 1H-8 |
| --- | --- |
| Campos privados do Profile | Tabela irmã `profile_private` 1:1 (não um blob único com RLS de coluna) |
| Pin | Coluna `pinned` em `conversation_participants` |
| Read cursor | Coluna `last_read_at` em `conversation_participants` |
| `gestureHandledAt` | Coluna opcional **no participante** (corrige isolamento demo) |
| Saves | Tabela `saves` polimórfica no A (já persiste no MVP) |
| Locale | Coluna `locale` em `profiles` (HYBRID 1H-6). 2FA/pagamento **não** |
| Reviews / outing-invites / presence / roles | **Fora do A** (parciais / DEMO) |

---

## 4. Schema A — lista de tabelas

Auth não é tabela de produto: **Supabase Auth** (`auth.users`).

```text
profiles
profile_private

follows
connection_requests
connections

conversations
conversation_participants
messages

posts

reels
reel_likes
reel_comments

businesses
places
events
offers

reservations

carona_offers
carona_requests

saves
```

**20 tabelas de produto.** Nenhuma de Commerce B.

**Fora do A:** Product, Service, Order, OrderItem, Payment, Cart, DeliveryJob, Ticket, Staff, Inventory, Commission, ProductVariant, Trip, Dispatcher, Group (não é tabela), Call session, MOCK_*.

---

## 5. Entidades

Convenções: PK `id uuid default gen_random_uuid()`. Timestamps `timestamptz`. FKs de usuário → `profiles.id` (= `auth.uid()`). `on update restrict`. Delete: ver §10.

Campos listados são o **mínimo contratual**, não um dump do mock rico (`Business.photos[]`, ratings, hours). Extensões de vitrine (horário, faixa de preço, slug público) podem entrar na implementação se já existirem no overlay UGC; **não** importar o tipo `Business` de marketplace.

### 5.1 `profiles`

| Coluna | Tipo conceitual | Obrigatório | Notas |
| --- | --- | --- | --- |
| `id` | uuid PK = `auth.users.id` | sim | Identity |
| `name` | text | sim | |
| `handle` | text unique (case-insensitive) | sim | |
| `photo_url` | text | não | Storage |
| `cover_url` | text | não | Storage |
| `city` | text | não | |
| `bio` | text | não | |
| `interests` | text[] | sim (default `{}`) | |
| `age` | int | não | derivado de `birth_date` no private; cache opcional |
| `locale` | text | não | preferência de idioma |
| `visibility` | jsonb | sim | `{ confirmed_activity, liked_places, mutual_connections }` ∈ `everyone \| connections \| only_me` |
| `created_at` / `updated_at` | timestamptz | sim | |

Não copiar colunas do `types.ts` legado (`headline`, `mood_*`, `now_playing_*`, `vibe_tags`, `looks_for`) — não são o perfil do MVP.

**Não** colocar `birth_date` nem endereços aqui.

### 5.2 `profile_private`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `user_id` | uuid PK FK → profiles | sim |
| `birth_date` | date | não |
| `home_address` | text | não |
| `work_address` | text | não |
| `updated_at` | timestamptz | sim |

SELECT/INSERT/UPDATE/DELETE: **somente owner**. Não existe sem `profiles`.

### 5.3 `follows`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `follower_id` | uuid FK → profiles | sim |
| `followee_id` | uuid FK → profiles | sim |
| `created_at` | timestamptz | sim |

Unilateral. Não cria Conversation. Unique `(follower_id, followee_id)`. Check `follower_id <> followee_id`.

### 5.4 `connection_requests`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `from_user_id` | uuid FK → profiles | sim |
| `to_user_id` | uuid FK → profiles | sim |
| `message` | text | não |
| `status` | `pending \| accepted \| declined` | sim |
| `created_at` / `updated_at` | timestamptz | sim |

Check `from_user_id <> to_user_id`. Unique `(from_user_id, to_user_id)` — reopen = update da mesma linha para `pending`, não segundo pedido paralelo.

Aceite **não** é trigger de Connection: a aplicação faz upsert de `connections` + ensure de Conversation.

### 5.5 `connections`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `user_a_id` | uuid FK → profiles | sim |
| `user_b_id` | uuid FK → profiles | sim |
| `conversation_id` | uuid FK → conversations | **não** |
| `connected_at` | timestamptz | sim |

Par canônico: `user_a_id < user_b_id`. Unique `(user_a_id, user_b_id)`. Check `user_a_id <> user_b_id`.

`conversation_id` é **efeito** (DM associado), não a identidade da conexão. Pode nascer sem Request. Unfriend = **DEFERRED** (feature ausente); a linha representa o par ativo.

### 5.6 `conversations`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `kind` | `direct \| group` | sim |
| `name` | text | grupos: sim; DM: não |
| `created_by` | uuid FK → profiles | sim (grupos); DM: um dos dois |
| `source_conversation_id` | uuid FK → conversations | não | spawn de grupo; **nunca** mutar o DM origem |
| `last_message_text` | text | não | **cache**; SoT = `messages` |
| `last_message_kind` | text | não | cache |
| `last_message_at` | timestamptz | não | cache |
| `created_at` / `updated_at` | timestamptz | sim |

**Não** há tabela `groups`. Grupo = Conversation `kind=group` + participantes com status de convite.

**Não** há `pinned_by_user_ids[]` na conversa.

**Não** há `owner_id` único da conversa: o aggregate pertence aos participantes.

### 5.7 `conversation_participants`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `conversation_id` | uuid FK → conversations | sim |
| `user_id` | uuid FK → profiles | sim |
| `status` | `pending \| accepted \| declined \| cancelled` | sim |
| `pinned` | boolean default false | sim |
| `last_read_at` | timestamptz | não |
| `gesture_handled_at` | timestamptz | não | UX da lista; isolado por usuário |
| `invited_at` | timestamptz | sim |
| `responded_at` | timestamptz | não |
| `created_at` | timestamptz | sim |

Unique `(conversation_id, user_id)`.

DM: dois participantes `accepted`. Grupo: criador `accepted`; convidados `pending` até aceite. Só `accepted` lê mensagens.

Unread derivado:

```text
unread = existe message
         WHERE conversation_id = P.conversation_id
           AND sender_id <> P.user_id
           AND created_at > coalesce(P.last_read_at, '-infinity')
```

Não persistir `unread_count` nem `is_unread` na mensagem.

### 5.8 `messages`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `conversation_id` | uuid FK → conversations | sim |
| `sender_id` | uuid FK → profiles | sim |
| `kind` | `text \| event \| location \| image \| video \| audio \| call` | sim |
| `text` | text | sim (pode ser vazio em mídia) |
| `payload` | jsonb | não | metadados; **não** data URL |
| `created_at` | timestamptz | sim |

**Proibido** coluna `from` (`me|them`) — perspectiva de UI.

**Call (1H-7):** `kind = call` com payload `{ media: voice\|video, outcome, started_at, ended_at?, caller_id, callee_id }`. Não é sessão WebRTC. Não é tabela `call_sessions`.

Anexos: path em Storage referenciado no payload (`storage_path`, `mime`, `width`…). Delete/edit de mensagem = **DEFERRED**.

### 5.9 `posts` (Momento)

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `author_id` | uuid FK → profiles | sim |
| `text` | text | não |
| `category` | text | não |
| `privacy` | `PUBLIC \| CONNECTIONS \| PRIVATE` | sim |
| `location_label` | text | não |
| `hashtags` | text[] | sim default `{}` |
| `media` | jsonb | sim default `[]` | `[{ url, kind: image\|video }]` — arquivos no Storage |
| `created_at` | timestamptz | sim |

`FRIENDS` do enum de UI **não entra no banco** (1H-7: FRIENDS ≡ CONNECTIONS). Cliente mapeia FRIENDS → `CONNECTIONS`.

Não reutilizar `bio_posts`.

Snapshot de autor **não** é SoT: ler `profiles`. Denorm de leitura na API é opcional.

### 5.10 `reels` (Agora)

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `author_id` | uuid FK → profiles | sim |
| `caption` | text | sim |
| `category` | text | sim | valores atuais do overlay UGC |
| `video_url` | text | sim | Storage |
| `poster_url` | text | não | Storage |
| `duration_s` | numeric | sim |
| `context_type` | text | não | `local \| negocio \| oferta \| evento` |
| `context_id` | uuid | não | referência, **sem FK polimórfica** |
| `context_title` | text | não | snapshot de leitura |
| `created_at` | timestamptz | sim |

Audience **PUBLIC** (1H-7). Sem coluna `privacy` no primeiro A.

Não persistir `author` aninhado como identidade. Não persistir `persistence: supabase|local` (artefato demo).

Contadores de like/comment: **derivados**.

`MOCK_REELS` **não** vira linha.

### 5.11 `reel_likes`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `reel_id` | uuid FK → reels ON DELETE CASCADE | sim |
| `user_id` | uuid FK → profiles | sim |
| `created_at` | timestamptz | sim |

Unique `(reel_id, user_id)`.

### 5.12 `reel_comments`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `reel_id` | uuid FK → reels ON DELETE CASCADE | sim |
| `parent_id` | uuid FK → reel_comments | não | reply |
| `author_id` | uuid FK → profiles | sim |
| `text` | text | sim |
| `sibling_order` | int | não | desempate; fallback `created_at, id` |
| `created_at` | timestamptz | sim |

**Não** persistir `likes` / `liked_by_me` (display local). Curtida de comentário = **DEFERRED**.

### 5.13 `businesses`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `owner_id` | uuid FK → profiles | sim |
| `name` | text | sim |
| `category` | text | sim | taxonomia de negócio do overlay |
| `address` | text | sim |
| `description` | text | não |
| `cover_url` | text | não |
| `lat` / `lng` | numeric | não |
| `created_at` / `updated_at` | timestamptz | sim |

Owner = Identity que publicou. Sem `place_id`. Sem staff. Sem Product.

Não importar `MOCK_BUSINESSES` nem o tipo rico (rating, hours, photos[]) como contrato mínimo. Horário/slug = extensão opcional na implementação se o create UGC passar a coletá-los.

### 5.14 `places`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `owner_id` | uuid FK → profiles | sim |
| `name` | text | sim |
| `category` | text | sim | taxonomia de lugar (≠ business) |
| `address` | text | sim |
| `description` | text | não |
| `hours` | text | não | string do overlay, não grade |
| `cover_url` | text | não |
| `lat` / `lng` | numeric | não |
| `created_at` / `updated_at` | timestamptz | sim |

Independente de Business. Não reutilizar a tabela `places` gerada como “já pronta”.

### 5.15 `events`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `owner_id` | uuid FK → profiles | sim |
| `title` | text | sim |
| `description` | text | não |
| `location` | text | sim | **string**; sem `place_id` |
| `start_at` | timestamptz | sim |
| `end_at` | timestamptz | não |
| `capacity` | int | não |
| `price` | numeric | não | dado informativo; **não** Payment |
| `photo_url` | text | não |
| `business_id` | uuid FK → businesses | **não** | hosted-by opcional |
| `created_at` / `updated_at` | timestamptz | sim |

Sem Ticket. `EventStatus` de mock (UPCOMING/…) é derivável de `start_at`/`end_at` ou fica **DEFERRED**.

### 5.16 `offers`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `owner_id` | uuid FK → profiles | sim | criador ≠ Business |
| `business_id` | uuid FK → businesses | **sim** |
| `title` | text | sim |
| `description` | text | não |
| `discount_value` | numeric | sim |
| `valid_until` | timestamptz | sim |
| `created_at` / `updated_at` | timestamptz | sim |

Offer ≠ Product. Aplicar Offer a Product/Service = evolução B. Cupom mock ≠ Offer.

No remoto, `business_id` aponta só a Business UGC. Oferta contra fixture demo **não existe** fora do dispositivo.

### 5.17 `reservations`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `user_id` | uuid FK → profiles | sim | customer |
| `resource_type` | `business \| place` | sim |
| `business_id` | uuid FK → businesses | XOR |
| `place_id` | uuid FK → places | XOR |
| `resource_name` | text | sim | snapshot |
| `slot_date` | date | sim |
| `slot_time` | time | sim |
| `party_size` | int | sim | 1–20 |
| `status` | `pending \| confirmed \| cancelled` | sim |
| `created_at` / `updated_at` | timestamptz | sim |

Check: exatamente um de `business_id` / `place_id`, coerente com `resource_type`.

**Não** há `completed` no schema (1H-7: nunca escrito). Enum local `requested` mapeia para `pending`.

Auto-confirm do demo **não** é constraint. Estado inicial canônico: `pending`. Promoção para `confirmed` = **política de aplicação** (DEFERRED POLICY, 1H-7C). Sem Order FK.

### 5.18 `carona_offers`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `owner_id` | uuid FK → profiles | sim |
| `origin` | text | sim |
| `destination` | text | sim |
| `meetup` | text | sim | aproximado; **não** geo |
| `ride_date` | date | sim |
| `ride_time` | time | sim |
| `available_seats` | int | sim | ≥ 0 |
| `status` | `active \| full \| cancelled \| completed` | sim |
| `created_at` / `updated_at` | timestamptz | sim |

Sem GPS, tracking, pagamento, dispatcher.

### 5.19 `carona_requests`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `ride_offer_id` | uuid FK → carona_offers | sim |
| `requester_id` | uuid FK → profiles | sim |
| `status` | `requested \| accepted \| rejected \| cancelled` | sim |
| `conversation_id` | uuid FK → conversations | não | após aceite |
| `created_at` / `updated_at` | timestamptz | sim |

Unique `(ride_offer_id, requester_id)`. Check `requester_id` ≠ owner da offer (aplicação + opcional).

Aceite (aplicação, não trigger SQL obrigatório):

```text
CaronaRequest.status = accepted
  → upsert Connection
  → ensure Conversation (DM) + participants accepted
  → set conversation_id
  → decrement seats; offer FULL se 0
```

Participação = esta linha. Connection é efeito social.

### 5.20 `saves`

| Coluna | Tipo | Obrigatório |
| --- | --- | --- |
| `id` | uuid PK | sim |
| `user_id` | uuid FK → profiles | sim |
| `target_type` | text | sim | `business \| place \| event \| offer \| reel \| post` |
| `target_id` | uuid | sim | sem FK polimórfica |
| `created_at` | timestamptz | sim |

Unique `(user_id, target_type, target_id)`. Privado ao user. Substitui o array `connexy:demo:saved-details`.

Reviews, outing-invites, redeemed coupons: **não** nesta tabela.

---

## 6. Relacionamentos

### Diagrama lógico

```mermaid
erDiagram
  auth_users ||--|| profiles : "id = uid"
  profiles ||--|| profile_private : user_id
  profiles ||--o{ follows : follower
  profiles ||--o{ follows : followee
  profiles ||--o{ connection_requests : from
  profiles ||--o{ connection_requests : to
  profiles ||--o{ connections : user_a
  profiles ||--o{ connections : user_b
  conversations ||--o{ conversation_participants : has
  profiles ||--o{ conversation_participants : member
  conversations ||--o{ messages : has
  profiles ||--o{ messages : sender
  connections }o--o| conversations : "conversation_id opcional"
  profiles ||--o{ posts : author
  profiles ||--o{ reels : author
  reels ||--o{ reel_likes : has
  reels ||--o{ reel_comments : has
  reel_comments ||--o{ reel_comments : parent
  profiles ||--o{ businesses : owner
  profiles ||--o{ places : owner
  profiles ||--o{ events : owner
  businesses ||--o{ events : "hosted_by opcional"
  businesses ||--o{ offers : "business_id NOT NULL"
  profiles ||--o{ offers : owner
  profiles ||--o{ reservations : customer
  businesses ||--o{ reservations : "XOR place"
  places ||--o{ reservations : "XOR business"
  profiles ||--o{ carona_offers : owner
  carona_offers ||--o{ carona_requests : has
  profiles ||--o{ carona_requests : requester
  carona_requests }o--o| conversations : "após aceite"
  profiles ||--o{ saves : owner
```

### Matriz

| De | Para | Cardinalidade | FK | Obrigatório |
| --- | --- | --- | --- | --- |
| profiles | auth.users | 1:1 | profiles.id | sim |
| profile_private | profiles | 1:1 | user_id | sim |
| follows | profiles | N:1 ×2 | follower_id, followee_id | sim |
| connection_requests | profiles | N:1 ×2 | from, to | sim |
| connections | profiles | N:1 ×2 | user_a, user_b | sim |
| connections | conversations | N:0..1 | conversation_id | opcional |
| conversation_participants | conversations | N:1 | conversation_id | sim |
| conversation_participants | profiles | N:1 | user_id | sim |
| messages | conversations | N:1 | conversation_id | sim |
| messages | profiles | N:1 | sender_id | sim |
| conversations | conversations | 0..1 | source_conversation_id | opcional |
| posts | profiles | N:1 | author_id | sim |
| reels | profiles | N:1 | author_id | sim |
| reel_likes | reels / profiles | N:1 | reel_id, user_id | sim |
| reel_comments | reels / profiles | N:1 | reel_id, author_id | sim |
| reel_comments | reel_comments | N:0..1 | parent_id | opcional |
| businesses / places / events / offers | profiles | N:1 | owner_id | sim |
| events | businesses | N:0..1 | business_id | opcional |
| offers | businesses | N:1 | business_id | **sim** |
| reservations | profiles | N:1 | user_id | sim |
| reservations | businesses | N:0..1 | business_id | XOR |
| reservations | places | N:0..1 | place_id | XOR |
| carona_offers | profiles | N:1 | owner_id | sim |
| carona_requests | carona_offers | N:1 | ride_offer_id | sim |
| carona_requests | profiles | N:1 | requester_id | sim |
| carona_requests | conversations | N:0..1 | conversation_id | opcional |
| saves | profiles | N:1 | user_id | sim |

Self-reference: `reel_comments.parent_id`, `conversations.source_conversation_id`.

---

## 7. Ownership

| Entidade | Proprietário | Participantes | Visibilidade |
| --- | --- | --- | --- |
| Identity (Auth) | o próprio uid | — | privado |
| profiles | user = id | — | misto (público + prefs) |
| profile_private | user_id | — | owner-only |
| follows | follower | follower, followee | relacional |
| connection_requests | from_user | from, to | privado ao par |
| connections | o par (sem owner único) | dois users | privado a terceiros |
| conversations | participantes | members | privado |
| conversation_participants | user da linha | conversation | privado |
| messages | sender_id | accepted members | privado |
| posts | author_id | — | privacy |
| reels | author_id | — | público |
| reel_likes | user_id | reel | contagem pública / linha do user |
| reel_comments | author_id | reel | público no reel |
| businesses / places / events / offers | owner_id (Identity criadora) | — | público |
| reservations | user_id (customer) | + owner do target UGC (leitura/aceite futuro) | privado |
| carona_offers | owner_id | owner + accepted requesters | discoverable se `active` |
| carona_requests | requester_id | owner da offer + requester | privado aos dois |
| saves | user_id | — | owner-only |

Offer.business_id **não** transfere ownership da oferta ao negócio.

---

## 8. RLS conceitual

Sem SQL. Papéis: `anon` (não autenticado), `authenticated`, `owner`/`author` (uid = coluna), `participant` (linha em `conversation_participants` com `status = accepted`), `request_party` (from ou to), `connection_party` (user_a ou user_b), `reservation_target_owner` (owner do business/place alvo), `carona_offer_owner`.

| Entidade | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| profiles | autenticado (campos públicos); anon só se produto exigir listagem pública futura | trigger pós-signup / uid = id | uid = id | **DEFERRED** (conta) |
| profile_private | uid = user_id | uid = user_id | uid = user_id | uid = user_id |
| follows | autenticado (grafo visível no produto) | follower_id = uid | não | follower_id = uid |
| connection_requests | from ou to = uid | from = uid | to (accepted/declined) ou from (reopen pending) | **não** no 1º A (status cobre) |
| connections | user_a ou user_b = uid | uid ∈ {a,b} | conversation_id só pelas partes | **DEFERRED** unfriend |
| conversations | participante accepted | autenticado (create DM/grupo) | created_by (nome de grupo) | **DEFERRED** |
| conversation_participants | se o viewer é participant da mesma conversa | criador convida connection; self-insert no create | próprio: pinned, last_read_at, gesture, aceite/recusa do próprio convite | leave → status `cancelled` (update) |
| messages | participant accepted | sender = uid **e** participant accepted | **DEFERRED** | **DEFERRED** |
| posts | PUBLIC: autenticado; CONNECTIONS: conexão mútua; PRIVATE: author | author = uid | author | author |
| reels | autenticado (público) | author = uid | author | author (cascade likes/comments) |
| reel_likes | autenticado (ou count via RPC) | user_id = uid | não | user_id = uid |
| reel_comments | autenticado | author = uid | author (texto) **DEFERRED** se não houver UI | author |
| businesses / places / events / offers | autenticado (catálogo público) | owner = uid | owner | owner (RESTRICT se filhos) |
| reservations | user_id = uid **ou** reservation_target_owner | user_id = uid | customer cancela; target_owner confirma/cancela (quando política existir) | não (status) |
| carona_offers | `active` para autenticado; sempre owner | owner = uid | owner | owner (cancel = status) |
| carona_requests | requester **ou** offer owner | requester = uid, ≠ owner | requester cancela; owner accept/reject | não (status) |
| saves | user_id = uid | user_id = uid | não | user_id = uid |

Anon: **sem** chat, reservas, grafo, saves. Catálogo/Agora públicos no dispositivo hoje; no remoto o 1º corte assume **authenticated** para simplificar RLS. Abertura anon do feed = decisão de implementação, não blocker.

Realtime (futuro, não nesta fase): `messages` e `conversation_participants` para o próprio uid. Não desenhar channels agora.

---

## 9. Índices

Somente os que o produto consulta.

| Tabela | Índice | Motivo |
| --- | --- | --- |
| profiles | unique `lower(handle)` | identity pública |
| follows | `(follower_id)`, `(followee_id)` | “quem eu sigo / quem me segue” |
| connection_requests | `(to_user_id, status)`, `(from_user_id)` | inbox de pedidos |
| connections | `(user_a_id)`, `(user_b_id)` | lookup do par |
| conversation_participants | `(user_id, status)` | inbox |
| conversation_participants | unique `(conversation_id, user_id)` | membership |
| messages | `(conversation_id, created_at)` | thread |
| posts | `(author_id, created_at desc)` | perfil |
| reels | `(author_id, created_at desc)` | perfil/Agora |
| reels | `(created_at desc)` | feed público |
| reel_likes | unique `(reel_id, user_id)` | uma curtida |
| reel_likes | `(reel_id)` | count |
| reel_comments | `(reel_id, created_at)` | sheet |
| reel_comments | `(parent_id)` | replies |
| businesses / places / events / offers | `(owner_id)` | “meus cadastros” |
| events | `(start_at)` | discovery |
| events | `(business_id)` | hosted-by |
| offers | `(business_id)`, `(valid_until)` | detalhe do negócio |
| reservations | `(user_id, created_at desc)` | minhas reservas |
| reservations | `(business_id)`, `(place_id)` | incoming do owner |
| carona_offers | `(status, ride_date)`, `(owner_id)` | discovery / minhas |
| carona_requests | `(ride_offer_id, status)`, `(requester_id)` | inbox da offer |
| saves | unique `(user_id, target_type, target_id)` | toggle |

FK indexes padrão em todas as FKs não cobertas acima.

Não indexar `payload` jsonb no 1º A.

---

## 10. Constraints

| Constraint | Onde | Por quê |
| --- | --- | --- |
| PK uuid | todas | estabilidade |
| `profiles.id` = auth uid | profiles | Identity 1:1 |
| unique handle | profiles | identidade pública |
| `follower_id <> followee_id` | follows | |
| unique par follow | follows | sem duplicata |
| `from <> to` + unique par | connection_requests | um pedido por direção |
| `user_a_id < user_b_id` + unique | connections | sem duplicata A-B / B-A |
| unique membership | conversation_participants | |
| `kind` ∈ enum | messages, conversations | |
| `privacy` ∈ PUBLIC/CONNECTIONS/PRIVATE | posts | sem FRIENDS |
| unique like | reel_likes | |
| `business_id NOT NULL` | offers | 1H-7 |
| XOR business/place + type | reservations | target único |
| `party_size` 1–20 | reservations | produto |
| `status` ∈ pending/confirmed/cancelled | reservations | sem completed |
| unique (offer, requester) | carona_requests | uma vaga-pedido |
| `available_seats >= 0` | carona_offers | |
| unique save | saves | |

### Delete / update

| Relação | On delete |
| --- | --- |
| FKs → profiles | **RESTRICT** no 1º A (sem hard-delete de conta) |
| messages → conversations | CASCADE se a conversa for apagada (hoje delete **DEFERRED**) |
| participants → conversations | CASCADE com a conversa |
| reel_likes / reel_comments → reels | CASCADE |
| reel_comments.parent_id | SET NULL ou RESTRICT replies; **RESTRICT** no 1º A |
| offers → businesses | **RESTRICT** (não apagar negócio com ofertas) |
| events.business_id | SET NULL |
| reservations → business/place | **RESTRICT** |
| carona_requests → carona_offers | **RESTRICT** (cancelar offer = status nas requests, não apagar histórico) |
| connections.conversation_id | SET NULL |
| carona_requests.conversation_id | SET NULL |
| conversations.source_conversation_id | SET NULL |

Update de PKs: não.

---

## 11. Timestamps / histórico

| Uso | Colunas |
| --- | --- |
| Auditoria de linha | `created_at` em todas; `updated_at` onde há mutação de produto (profile, requests, catalog, reservation, carona, conversation) |
| Agendamento | `events.start_at/end_at`; `reservations.slot_date/slot_time`; `carona_offers.ride_date/ride_time`; `offers.valid_until` |
| Estados | colunas `status` nas machines fechadas; transições na aplicação |
| Snapshot | `reservations.resource_name`; `reels.context_title`; message payload de share; **não** reconstruir histórico só pelo catálogo live |
| Read cursor | `last_read_at` no participante |
| Call | timestamps **dentro** do payload `kind=call`, não colunas da message |

`StoredConversation.lastMessage*` vira cache opcional, não histórico canônico.

Media histórica: URLs de Storage, não data URL.

---

## 12. Demo → remoto

| Domínio | Fonte atual | Futuro remoto | Observação |
| --- | --- | --- | --- |
| Identity | `getDemoIdentity()` / `connexy:demo:identity` | Auth `auth.users` | Switcher **não** migra |
| Sessão | `connexy:demo:auth` | Auth session | Flag `"1"` é mecanismo demo |
| Onboarding flag | `connexy:demo:signup-pending` | fluxo Auth/profile completeness | não tabela |
| Profile público | `connexy:demo:own-profile` (parte) | `profiles` | **não** migrar o blob inteiro |
| Profile privado | mesmo blob (birthDate, addresses) | `profile_private` | packing fechado aqui |
| Locale | `connexy:demo:settings.language` | `profiles.locale` | |
| 2FA / cartão demo | `settings.twoFactor/payment` | **não tabela** | Auth / Payment DEFERRED |
| Follow / Request / Connection | `connexy:demo:db` | três tabelas | `groups[]` → conversations+participants |
| Messages legado no db | `demo-db.messages[]` | **não** | já migrado p/ IndexedDB; sem dual-write |
| Conversas | IndexedDB `conversations` | `conversations` + `conversation_participants` | pin array → coluna do participant |
| Mensagens | IndexedDB `messages` | `messages` + Storage | `from` some; `sender_id` obrigatório; kind `call` |
| Post/Momento | `connexy:demo:posts` | `posts` + Storage | privacy FRIENDS→CONNECTIONS |
| Agora metadados | IndexedDB `connexy-reels-data-local-db` | `reels`, `reel_likes`, `reel_comments` | |
| Agora blobs | IndexedDB `connexy-reels-local-db` | Storage bucket `reel-media` | não tabela |
| Catálogo UGC | `connexy:demo:catalog` | 4 tabelas | tagged union local **não** vira `catalog_items` |
| Reservas | `connexy:demo:reservations` | `reservations` | `confirmed` imediato → política, status `pending` |
| Carona | `connexy:demo:carona` | `carona_offers` + `carona_requests` | |
| Saves | `connexy:demo:saved-details` | `saves` | ids genéricos → type+id |
| Inbox convites | `local-invite-inbox.ts` | **projeção** de participants/requests | não tabela |
| Call overlay | `demo-call.ts` memória | **não** | só message kind `call` |
| Trip / Dispatcher / ride_blocks | `connexy_demo_*` | **não Schema A** | DEMO mobilidade |
| Roles / presence / context | chaves históricas | **não Schema A** | |
| Reel sound / media permission | `connexy:reels:sound:v1` etc. | **LOCAL** | dispositivo |
| Chaves reels `v1` legado | likes/comments/published | **não** | lixo de migração local |

### O que o backend substitui

Persistência de Identity/Profile, grafo, chat, posts, Agora metadados+mídia, catálogo UGC, reservas, carona, saves, locale.

### O que é só mecanismo demo

Identity switcher, session flag, auto-confirm de reserva, call overlay, data URLs, `from: me|them`, `pinnedByUserIds[]`, fixtures mesclados na UI, dispatcher/trip, 2FA/cartão visuais.

### O que **não** vira tabela

MOCK_*, `people`/`currentUser` como users, `bio_posts`, `catalog_items`, `groups`, `call_sessions`, `payments`, `carts`, `tickets`, `trips`, `dispatchers`, `employees`, `inventory`, `commissions`, `message.is_unread`, blob único de perfil.

---

## 13. Mocks que não migram

| Mock | Motivo |
| --- | --- |
| `MOCK_REELS` | seed visual; Agora UGC é IndexedDB |
| `MOCK_BUSINESSES` / `MOCK_EVENTS` / `MOCK_PROMOTIONS` / `MOCK_COUPONS` | vitrine; overlay UGC é o domínio |
| `places` / `people` / `currentUser` em `mock-data.ts` | catálogo demo de terceiros |
| `mock-conversations.ts` unreadCount | UI de lista mock |
| Cupons resgatados | DEMO |
| Reviews `recent-reviews` | parcial; fora do A |
| Live events / AI history | DEMO |
| Driver application / frota em memória | mobilidade DEMO |

Unificar mock + UGC = trabalho de **conteúdo/CMS**, não schema.

---

## 14. Compatibilidade com Schema B

O A permite, **sem remodelar Business/Profile**:

```text
Business
 ├── Product     (business_id, owner_id)
 ├── Service     (business_id, owner_id)
 ├── Offer       (já no A)
 └── Order       (customer_id → profiles, business_id → businesses)
       └── OrderItem
```

`owner_id` já é Identity. Staff futuro = membership **nova**, sem `staff_id` obrigatório no A.

Reservation permanece independente. FK opcional Order↔Reservation = evolução, não quebra o A.

Fulfillment = coluna do Order no B, não tabela no primeiro B.

Payment / Cart / DeliveryJob / Inventory / Variant / Commission / Ticket: anexos futuros, **zero** colunas reservadas no A “por precaução”.

Professional ⊂ Business+Profile: sem tabela `professionals`.

Gerenciar continua publisher no App; dashboard web compartilha as **mesmas** tabelas quando existir.

**Anexo Schema B (conceitual, não modelar agora):**

```text
products
services
orders
order_items
```

Campos mínimos já fechados em 1H-7A/7C (publication, availability, fulfillmentMode no Order, snapshots no item). Fora do 1º B: Payment, Cart, DeliveryJob, ProductVariant, Inventory, Staff, Ticket, Commission, Offer→Product.

---

## 15. Decisões abertas (não blockers)

| Item | Classificação | Nota |
| --- | --- | --- |
| Política quem confirma reserva | DEFERRED POLICY | Schema tem `pending`; app decide auto vs owner |
| Unfriend / block | DEFERRED | Connection = par ativo |
| DM exige Connection? | DEFERRED | Carona força; chat genérico OPEN residual 1H-6 |
| Delete/edit de message e post | DEFERRED | sem UI |
| Account deletion / cascade users | DEFERRED | RESTRICT por enquanto |
| Roles de grupo (admin) | DEFERRED | creator = created_by |
| Privacy de Agora além de PUBLIC | DEFERRED | |
| Comment likes | DEFERRED | |
| Extensões de vitrine Business (hours, slug, photos) | opcional na implementação | não reabrir domínio |
| Anon SELECT de catálogo/Agora | implementação | 1º corte autenticado |
| Seed CMS dos mocks | conteúdo | |
| Incoming reservation UX | experiência B | mesma tabela |
| Locale vs tabela `user_preferences` | packing já no profile | suficiente |

Nenhuma impede desenhar ou implementar o Schema A.

---

## 16. Blockers

**Nenhum blocker de domínio para o Schema A.**

Riscos de **implementação** (não reabrem produto):

1. **Não copiar** `integrations/supabase/types.ts` (`profiles`, `places`, `bio_posts`, `reels`, `reel_likes`, `reel_comments` no formato atual). Substituir/redesenhar na fase SQL.
2. **Não copiar** `ChatRepository.markAsRead` / tabelas hipotéticas dos stubs.
3. **Não** criar trigger Auth→Conversation automática.
4. **Não** colocar Commerce B na mesma migration do A.
5. **Não** promover Trip/Dispatcher.

Auth real é **infra** da implementação, não decisão de produto em aberto.

---

## 17. Recomendação da próxima fase

**1H-9 — Schema A SQL (Auth mapping, migrations, RLS, Storage buckets)**

Ainda:

- sem cutover do MVP demo;
- sem Schema B;
- sem Realtime de produto;
- sem gateway;
- sem dashboard web.

A 1H-9 pode escrever SQL **alinhado a este contrato**. Não deve inventar tabelas. Não iniciar 1H-9 nesta entrega.

---

## Storage (contrato, sem criar buckets)

| Bucket futuro | Conteúdo |
| --- | --- |
| `avatars` | photo/cover de profile |
| `post-media` | Momento |
| `reel-media` | vídeo + pôster Agora |
| `catalog-covers` | business/place/event |
| `chat-attachments` | image/video/audio de message |

Paths relativos nas colunas `*_url` / payload. RLS de Storage = owner do objeto. **Não criado nesta fase.**

---

## Apêndice — Validação

| Check | Resultado |
| --- | --- |
| Produto alterado | 0 |
| Relatórios anteriores | intactos |
| Testes unitários (não-browser) | **346 pass / 0 fail / 2087 expect()** |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
