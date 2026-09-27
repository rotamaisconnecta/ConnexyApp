# 1H-6 — Domain Contract / Stage A+B

- **Data:** 2026-09-24
- **Tipo:** contrato de domínio. Sem implementação. Sem backend.
- **Baseline:** `docs/audits/backend-readiness-1h-5.md` (1H-5 PARTIAL).
- **Regra:** código atual + comportamento do produto + decisão arquitetural = contrato futuro.
- **Arquivos de produto alterados:** 0
- **Arquivo criado:** este relatório.
- **Commit / push:** não.
- **STATUS:** **PASS PARTIAL**
- **CONTRACT STATUS:** **NOT_READY** (schema completo). Núcleo A+B (Identity, Profile, Follow, Request, Connection, Conversation, Participant, Pin, Read, Message) está **fechado o bastante para um rascunho de schema limitado**.

Nenhuma tabela, SQL, migration, RLS, bucket, Realtime, Edge Function, API, adapter, store, repository ou entidade de código foi criada. O MVP local permanece intacto.

---

## 1. Objetivo

Transformar os achados da 1H-5 em um **contrato de domínio** estável o suficiente para, depois, desenhar schema remoto **sem descobrir o domínio enquanto se criam tabelas**.

Esta fase **não** implementa Supabase. Sequência: AUDITAR → MAPEAR → DECIDIR → DOCUMENTAR → VALIDAR.

---

## 2. Escopo

**Dentro:** Identity, Profile, grafo social, Conversas (participantes, pin, unread, mensagens, histórico de chamada), Agora, Catálogo, Reservation, Carona Amiga, Mobility (só para separar), Settings, ownership, IDs, visibility, lifecycle, local/remote/hybrid, blockers.

**Fora:** Auth real, OAuth, Storage, Realtime, WebRTC, GPS, pagamentos, matching, dispatcher, sincronização, refatoração, correção de dívidas.

Convenções neste documento:

| Termo | Significado |
| --- | --- |
| CURRENT IMPLEMENTATION | o que o código faz hoje |
| CANONICAL PRODUCT CONTRACT | como o produto deve ser entendido daqui para frente |
| FUTURE BACKEND REPRESENTATION | hipótese remota — **não** autorização para criar tabela |
| OPEN DECISION | não dá para fechar com segurança a partir do produto atual |

O 1H-5 foi lido e **revalidado no código**. Onde o código diverge, o código vence.

---

## 3. Fontes auditadas

| Área | Fontes |
| --- | --- |
| Relatório | `docs/audits/backend-readiness-1h-5.md` |
| Identidade | `demo-identity.ts`, `demo-auth.ts`, `demo-own-profile.ts`, `mock-data.ts` (`currentUser.id = lucas`) |
| Social | `demo-db.ts` (`DemoRequest`, `DemoConnection`, `DemoFollow`, `DemoGroup`) |
| Chat | `chat-entities.ts`, `chat-schema.ts`, `local-chat-persistence.ts`, `conversation.repository.ts`, `message.repository.ts`, `functional-conversation-list.ts`, `conversation-list-state.ts`, `use-chat.ts`, `chat.repository.ts` (stub remoto, **não** SoT) |
| Calls | `demo-call.ts` |
| Agora | `reels-entities.ts`, `reels-schema.ts`, `reel.repository.ts`, `reel-like.repository.ts`, `reel-comment.repository.ts`, `reel-mocks.ts`, `reel-feed.ts`, `reel-social-state.ts`, `saved-details.ts` |
| Momento | `demo-posts.ts`, `lib/types/post.ts` (`PostPrivacy`) |
| Catálogo | `local-catalog.ts`, `catalog-create-form.tsx`, `mock-businesses.ts`, `business-types.ts` |
| Reserva | `reservation-store.ts`, `reservable.ts` |
| Carona | `carona-store.ts` |
| Mobility | `trip-types.ts`, `trip-store.ts`, `dispatcher.ts`, `dispatcher-store.ts`, `ride-blocks.ts` |
| Settings | `demo-settings.ts`, `reel-local-storage.ts` (`SOUND_KEY`), `presence-preference.ts` |
| Gate demo | `demo-config.ts`, `supabase/config.ts` |

---

## 4. Estado atual (síntese revalidada)

O MVP continua local/demo (`VITE_APP_DEMO_MODE=true` em DEV). Três persistências coexistentes: `connexy:demo:*`, IndexedDB de chat/reels, stubs Supabase desligados.

Confirmações contra 1H-5 que **permanecem verdadeiras**:

- Identidade canônica: `getDemoIdentity().id`.
- `connexy:demo:own-profile` é blob único (isolamento fraco).
- Follow, Request e Connection são tipos distintos no mesmo blob `connexy:demo:db`.
- Mensagens vivem em IndexedDB; `demo-db.messages` é legado sem novos writes.
- Participantes **não** estão em `StoredConversation`.
- Pin: `pinnedByUserIds` no aggregate; unread derivado.
- Chamada: overlay em memória + TEXT em `messages`; não é WebRTC.
- `MOCK_REELS` mistura no feed e **não** é SoT de conteúdo do usuário.
- Catálogo UGC em `connexy:demo:catalog`; mocks de marketplace continuam no bundle.
- Reservation é entidade própria; create grava `confirmed`.
- Carona ≠ dispatcher; aceite chama `connectUser` + `sendLocalMessage`.
- Schema gerado de 6 tabelas e `ChatRepository` **não** são o contrato.

Correção / precisão extra vs 1H-5:

- **Connection pode existir sem Request.** `connectUser()` cria a relação direto (Carona usa isso). Request não é o único caminho.
- **Offer.businessId** é obrigatório no create, mas a validação só rejeita se o id existir **no overlay** e não for `business`. Ids de `MOCK_BUSINESSES` são aceitos sem estar no overlay.
- **Catálogo não expõe update/delete** no store — só create (`persist` substitui pelo mesmo id se republicar).
- **Lista funcional de conversas** = conexões do usuário + grupos com participante `accepted`. Conversas IndexedDB órfãs não entram na lista.
- **Group** tem participantes explícitos no próprio `DemoGroup`; o DM origem **nunca** é reutilizado (`createDemoGroup`).
- **PostPrivacy** tem `PUBLIC | CONNECTIONS | FRIENDS | PRIVATE`. FRIENDS ≠ CONNECTIONS no enum da UI; o grafo **não** tem entidade “amigo”.
- **Unread de grupo** na lista é hardcoded `0`.

---

## 5. Identity / Profile

### CURRENT IMPLEMENTATION

- **Identity:** `DemoIdentity { id, name, photo }` escolhida em `connexy:demo:identity` a partir de fixtures (`lucas` + `people`). Switcher **não** é login. Sessão: `connexy:demo:auth === "1"`.
- **Profile:** `DemoOwnProfile` em `connexy:demo:own-profile` (um JSON). Campos públicos/semi: name, handle, photo, cover, city, bio, interests, age. Privados no mesmo blob: `privateAddresses`, `birthDate`. Preferência: `visibility.{confirmedActivity, likedPlaces, mutualFriends}` = `Todos | Conexões | Somente você`. `identityId` é gravado no save, mas o storage **não** é mapa por usuário.
- Terceiros: `people` / `currentUser` — fixtures, não perfis persistidos.

Problema registrado (não corrigido):

> `connexy:demo:own-profile` é um blob local e possui isolamento mais fraco entre identidades do que o modelo remoto futuro deveria possuir.

### CANONICAL PRODUCT CONTRACT

**Identity e Profile são conceitos diferentes.**

| Conceito | Papel | Dados |
| --- | --- | --- |
| **Identity** | quem autentica / dono de tudo | id estável, credenciais, sessão. Hoje: `getDemoIdentity().id`. Futuro: `auth.uid`. |
| **Profile** | dados públicos/editáveis da identidade | name, handle, photo, cover, city, bio, interests, age |

- **ID canônico do usuário:** o id da Identity. No demo, `getDemoIdentity().id`. No remoto, o mesmo papel (`auth.users.id`). **Todo `ownerId` / `userId` / `authorId` / `senderId` do produto refere-se a esse id.**
- **O backend deve usar o ID da identidade como owner:** **sim.**
- **Profile deve ter o mesmo ID do usuário:** **sim (1:1).** Não há produto de “vários perfis por conta”. `profileId` separado **não** é necessário. O schema gerado (`profiles.id`) já aponta nessa direção; isso **não** obriga a reutilizar as colunas atuais dessa tabela.

**Público:** name, handle, photo, cover, city, bio, interests, age (quando o perfil for visível).

**Privado / owner-only:** birthDate, endereços casa/trabalho, flags de visibilidade, sessão/credenciais.

**Misto (regra contextual):** campos do perfil filtrados por `visibility` (atividade confirmada, lugares curtidos, amigos em comum). Isso é **preferência de visibilidade**, não um segundo perfil.

### FUTURE BACKEND REPRESENTATION

- Identity → Auth (não tabela de produto).
- Profile → uma linha por userId, PK = userId.
- Campos privados → mesma linha com RLS owner-only **ou** registro irmão. **OPEN DECISION** de packing, não de conceito.

### OPEN DECISION

- Conta real (e-mail/OTP/OAuth) — INFRA, não domínio.
- packing de campos privados vs tabela `profile_private`.
- O que acontece com fixtures `people` no remoto (seed editorial vs usuários reais).

---

## 6. Social Graph

Três conceitos **já implementados** e **não sinônimos**.

### Follow

| Pergunta | Resposta (código) |
| --- | --- |
| Unilateral? | **Sim.** `DemoFollow { followerId, followeeId, createdAt }` |
| Existe sem conexão? | **Sim.** `toggleFollow` não lê connections |
| Estado próprio? | Binário: existe ou não. Sem pending |
| Cria conversa? | **Não** |

Usado em Agora (`author.isFollowing` via `reel-social-state.ts`).

### Connection Request

| Pergunta | Resposta |
| --- | --- |
| Intenção/pedido? | **Sim.** `DemoRequest` |
| Sender / recipient? | `fromUserId` / `toUserId` |
| Lifecycle? | `pending → accepted \| declined`. Reenvio reabre `pending` |
| Id | determinístico `demo-req-${from}--${to}` |

Não cria conversa sozinho. `acceptRequest` cria/reusa **Connection** e então `ensureLocalConversation`.

### Connection

| Pergunta | Resposta |
| --- | --- |
| Resultado de aceite? | **Caminho principal:** sim (`acceptRequest`) |
| Independente de Request? | **Sim.** `connectUser()` cria connection sem request (Carona) |
| Bilateral? | **Sim.** `userAId` / `userBId` (ordem não é direção) |
| Independente de Follow? | **Sim.** Grafos separados |
| Conversa? | Garante DM `demo-direct-${sorted(a,b).join("--")}` |

Não há entidade `relationship` genérica.

### Group (adjacente)

Não é Follow nem Connection. `DemoGroup`: id próprio, `sourceConversationId` (DM origem **não reusado**), `creatorId`, `participants[]` com status `pending|accepted|declined|cancelled`. Lista de chat só inclui quem está `accepted`.

### Decisão arquitetural (fechada)

Manter **três conceitos distintos**:

```text
Follow              (unilateral, sem conversa)
Connection Request  (intenção, lifecycle)
Connection          (bilateral, pode existir sem request)
```

Group permanece no domínio de **conversa coletiva**, não como quarto tipo de grafo social.

### CURRENT / CANONICAL / FUTURE

**CURRENT:** os três no blob `connexy:demo:db`.

**CANONICAL:** três entidades; Connection.conversationId é **efeito** (garante um DM), não a identidade da conexão.

**FUTURE:** três coleções (ou tabelas hipotéticas). Connection **não** deve ser inferida de Follow.

**OPEN:** unfriend/unblock; se recusar request impede novo request; se Connection obrigatória para DM (hoje Carona força connection).

---

## 7. Conversations

### Participants — decisão fechada

> Participantes da conversa são uma **propriedade explícita da conversa**. Não se infere participação a partir de Follow, Request ou Connection.

Confirmado pelo produto:

- Follow **não** entra na lista de conversas.
- Request pendente **não** cria thread.
- Lista funcional **projeta** DMs a partir de Connection e grupos a partir de `DemoGroup.participants` accepted — isso é **implementação local**, não o contrato.
- Grupo tem membership própria, distinta do DM origem.
- Carona cria Connection **e** conversa como efeito; a conversa ainda precisa de membros próprios no remoto.

Uma pessoa **pode** (canonicalmente) participar de uma conversa sem que Follow/Request/Connection estejam no mesmo estado. Hoje o atalho `connectUser` acopla os dois; o contrato **separa** os conceitos para o backend não colapsar RLS em “está conectado?”.

### Pin

**CURRENT:** `StoredConversation.pinnedByUserIds?: string[]` no aggregate compartilhado. Quem altera: identidade atual. Isolamento: o id está ou não no array. Pessoa A pinna sem que B veja pin — **já é o comportamento de produto** (`isPinnedForUser`).

**CANONICAL:** pin pertence à **relação usuário × conversa**, não à conversa em si.

**FUTURE:** estado no participante (`ConversationParticipant.pinned`) **ou** coleção equivalente. **Não** coluna global da conversa como fonte de verdade. A representação SQL exata é hipótese, não tabela a criar.

### Unread / read

**CURRENT:** `unreadCount = last.senderId && last.senderId !== userId ? 1 : 0`. Sem `read_at`, sem cursor, sem persistência. Grupos: sempre `0`. `ChatRepository.markAsRead` é stub morto.

**CANONICAL:** cursor por participante:

```text
ConversationParticipant
    └── lastReadAt
```

Unread da lista = há mensagem com `createdAt > lastReadAt` (e sender ≠ self). **Não** `message.isUnread`.

**Justificativa:** o produto só precisa de badge de thread, não de flag por mensagem; escala; alinha com pin no mesmo registro de participante; o heurístico atual quebra em grupo e em “já li a última mas havia anteriores”.

**Impacto futuro:** ao abrir o thread, atualizar `lastReadAt`. Mensagens não ganham coluna unread.

**OPEN:** `gestureHandledAt` (Ouvir/Confirmar/Retomar) — hoje um timestamp **por conversa**. Canonicalmente seria estado do participante **ou** só local. Não bloqueia A+B.

### CURRENT / CANONICAL / FUTURE

**CURRENT:** `StoredConversation` = id + timestamps + last message + pin array + gesture. Membros fora.

**CANONICAL:** Conversation (id, createdAt, updatedAt, lastMessage preview opcional) + **Participants** (userId, role?, joinedAt, pinned, lastReadAt) + Messages.

**FUTURE:** aggregate remoto com membership explícita. Preview de last message pode ser derivado. **Não** copiar `from: me|them` como coluna.

---

## 8. Messages / Calls

### Messages

**CURRENT `StoredMessage`:** id, conversationId, `from: me|them`, senderId?, senderName?, text, at, kind `text|event|location|image|video|audio`, payload (dataUrl, mime, metadados de evento/lugar). Sem replies. Sem status delivered/read. Áudio é kind de lista, sem MediaRecorder.

**CANONICAL Message:** conteúdo conversacional. Owner = senderId (Identity). Pertence a uma conversationId. Timestamp de criação. Kind de mídia/conteúdo. `from: me|them` é **perspectiva de UI**, não domínio.

**FUTURE:** mensagens com sender_id + conversation_id. Anexos → Storage + metadados, não data URL. Read receipt = `lastReadAt` do participante, não status por mensagem.

**OPEN:** replies/threads dentro do chat (não existem); delete/edit; delivered.

### Calls

**CURRENT:** `DemoCallSession` em memória (`voice|video`, `outgoing|connected`). Ao encerrar, `finishDemoCall` grava **texto** (`Ligação de voz (demo) · encerrada`) via `sendLocalMessage`. Feedback: “Chamadas reais ainda não estão configuradas neste modo demo.”

**CANONICAL:**

| Conceito | Papel |
| --- | --- |
| **Message** | conteúdo (texto, mídia, share de evento/lugar) |
| **Call Event / Call History** | registro de que uma chamada ocorreu (mídia, outcome, timestamps, participantes) |

O histórico TEXT atual **não** é WebRTC e **não** deve virar sessão de mídia.

**FUTURE:** evento de conversa (kind dedicado **ou** coleção de eventos). Sinalização WebRTC = INFRA, fora deste contrato.

**OPEN:** se o evento vive na store de messages com kind `call` ou numa coleção `conversation_events`. Não bloqueia desenhar Message.

---

## 9. Agora

Nomes técnicos **permanecem** `Reel`, `ReelRepository`, `ReelLikeRepository`, `ReelCommentRepository`, `MOCK_REELS`, bancos `connexy-reels-data-local-db` / `connexy-reels-local-db`. Produto: **Agora**.

### Real domain content vs mock

| Tipo | Fonte | Contrato |
| --- | --- | --- |
| Conteúdo do usuário | `StoredReel` + blobs `media` | domínio real → remoto + Storage |
| Like | `StoredReelLike` (`reelId::userId`) | domínio real |
| Comment / reply | `StoredReelComment` (`parentId`, `siblingOrder`) | domínio real |
| Follow do autor | `DemoFollow` | grafo, não tabela de reel |
| Connect do autor | Request/Connection | grafo |
| Save | `connexy:demo:saved-details` (ids genéricos) | save do usuário, **polimórfico** |
| Som mutado | `connexy:reels:sound:v1` | LOCAL |
| `MOCK_REELS` | `reel-mocks.ts` | **não é contrato de backend** |

> Mock não é contrato de backend. Não transformar `MOCK_REELS` em tabela.

### Contrato conceitual

- **Owner:** `author.id` (Identity). Snapshot de nome/handle/photo no reel é denormalização de leitura, não segunda identidade.
- **Visibility:** hoje efetivamente público no dispositivo. Campo de privacy **não** existe em `StoredReel`.
- **Lifecycle:** criado (publicado local) → visível no feed. Sem archived/deleted de produto completo (cascade técnico existe no repository).
- **Likes / comments:** coleções próprias; contadores derivados.
- **Saves:** não são coluna do reel; são relação user × target.
- **Context:** `StoredReelContextRef` (local/negocio/oferta/evento + id + título) — referência, não embed da entidade.

### OPEN

- Privacy de Agora (público vs conexões vs privado) — UI de Momento tem enum; Reel não.
- Save genérico vs `reel_saves`.
- Views/shares persistidos (hoje stats de UI / mock).

---

## 10. Catalog

### User-generated vs mock

| Persistente (UGC) | Mock / seed |
| --- | --- |
| `connexy:demo:catalog` — Event, Place, Business, Offer com `ownerId` | `MOCK_BUSINESSES`, `MOCK_EVENTS`, `MOCK_PROMOTIONS`, `MOCK_COUPONS`, `places` em `mock-data.ts` |

A UI **mescla** overlay + fixtures (`getAllBusinesses` + `listCatalogByKind`). Criar oferta lista **owned catalog businesses + fixtures**.

**Não misturar:** mock não vira linha de produção automaticamente.

### Create / edit / delete

- Create: sim, `ownerId = getDemoIdentity().id`, id `${kind}-${Date.now()}-${rand}`.
- Edit/delete de produto: **não há API de store** (só `persist` upsert por id).
- Disclaimer atual: cadastro local, sem catálogo compartilhado entre dispositivos.

---

## 11. Business × Place × Event × Offer

Respostas **somente** com o que o produto faz. Sem FK inventada.

| Pergunta | Resposta |
| --- | --- |
| Business é entidade de domínio real? | **Sim**, como `kind: business` no overlay **e** como fixture de marketplace. São **dois formatos** (CatalogBusiness vs `Business` rico). |
| Place é localização física? | **Sim** no overlay (`address`, lat/lng opcionais) e nos fixtures de `places`. |
| Business possui um ou vários Places? | **Não implementado.** São kinds irmãos. **OPEN DECISION** |
| Event acontece em um Place? | **Não como FK.** `Event.location` é **string**. Sem `placeId`. |
| Event pode ser de um Business? | **Opcional.** `Event.businessId?: string` — sem validação de existência. |
| Offer pertence a Business? | **Conceito de produto: sim.** Create exige `businessId` não vazio. |
| Offer pode existir sem Business? | **Não** no fluxo de create (title + businessId obrigatórios). O id pode apontar a um **mock**, não só a CatalogBusiness. |
| `Offer.businessId` é relação canônica? | **Sim, como relação conceitual Offer → Business.** Não é FK enforced. Pode referenciar fixture. |
| Criador ≠ proprietário ≠ estabelecimento? | **Hoje não.** `ownerId` = identidade que clicou publicar. Não há ator estabelecimento. |
| Quem edita/exclui? | Só o owner **poderia**; o store **não** expõe delete/edit. |
| Owner de cada uma? | `ownerId` da identidade criadora, para os quatro kinds UGC. Mocks não têm owner de produto. |

### CANONICAL (fechado o que dá)

- Quatro **tipos de catálogo** distintos: Business, Place, Event, Offer.
- Offer **requer** um Business de referência (`businessId`).
- Place **não** é automaticamente um estabelecimento; Business **não** é automaticamente um Place.
- Mock catalog ≠ UGC.

### OPEN (bloqueiam schema de catálogo)

- Uma tabela polimórfica vs quatro tabelas.
- Business 1—N Place.
- Event.placeId vs location string.
- Event.businessId obrigatório ou não.
- Unificar CatalogBusiness com `MOCK_BUSINESSES`.
- Ator estabelecimento vs user owner.
- Edit/delete/arquivar.

---

## 12. Reservations

**CURRENT:** entidade `Reservation` em `connexy:demo:reservations`. Campos: id, userId, resourceId, resourceType `business|place`, resourceName (snapshot), date, time, partySize (1–20), status, createdAt. Create → **`confirmed` imediato**. Cancel → `cancelled` pelo mesmo userId. Sem `updatedAt`. Sem ator do estabelecimento. `requested` e `completed` existem no enum e **não** no fluxo de create.

**CANONICAL:** Reservation é **entidade própria**, não clique de UI nem evento colado no recurso.

```text
Reservation
  requester     = Identity (userId)
  target        = resourceType + resourceId (+ snapshot name)
  date / time
  partySize
  status
  createdAt
  (updatedAt conceitual)
```

A confirmação imediata do demo **não** é o contrato definitivo do backend.

Lifecycle **coerente com o tipo atual**, política de transição **OPEN**:

```text
requested → confirmed → cancelled | completed
```

Demo atual: entra já em `confirmed` (atalho de produto local).

### OPEN DECISION (produto — bloqueia schema de reserva “completo”)

- Haverá estabelecimento/ator receptor?
- Confirmação manual vs automática vs disponibilidade?
- `updatedAt` / completed por quem?
- Delivery/retirada (1H-3: não implementado) — fora deste contrato.

---

## 13. Carona

> **Carona Amiga é um domínio social de compartilhamento de deslocamento e NÃO faz parte do dispatcher.**

Confirmado: store `connexy:demo:carona`; aceite **não** toca `Trip` / `LocalDispatcher`.

| Conceito | Código | Contrato |
| --- | --- | --- |
| Ride Offer | `CaronaOffer` ownerId, origin, destination, meetup, date, time, availableSeats, status | quem oferece = owner |
| Request | `CaronaRequest` requesterId, rideOfferId, status | quem solicita ≠ owner |
| Acceptance | `acceptCaronaRequest` só o owner | decrementa vagas; FULL se 0 |
| Participants | implicitamente owner + requesters **accepted** | não há lista `participants[]` própria |
| Meeting point | `meetup` **texto aproximado** | não é geo |
| Conversation | `conversationId?` após aceite via `connectUser` | efeito: DM entre owner e requester |
| Cancel | owner cancela offer (requests pending → cancelled); requester cancela request (devolve vaga se accepted) | |

Lifecycle **real** (dois aggregates):

```text
Offer:    active → full | cancelled | completed
Request:  requested → accepted | rejected | cancelled
```

`completed` existe no offer e **não** tem transição de produto auditada além do tipo. Tratar `completed` como estado previsto, uso atual **fraco**.

**Não misturar** com Trip, Dispatcher, corrida operacional, matching, GPS.

**OPEN:** lista explícita de participantes vs só requests accepted; se aceite deve criar Connection (hoje sim) ou só Conversation; denúncia/bloqueio (código comenta “fica para o backend”).

---

## 14. Mobility

```text
Trip ≠ Carona Amiga
Dispatcher ≠ Carona Amiga
```

**Trip:** estado da corrida do passageiro (`connexy_demo_trip`) — origem, destino, stops, status de UI, fare, paymentMethod demo, driver snapshot, rating. **DEMO.**

**Dispatcher / LocalDispatcher:** frota em **memória**, config `connexy_demo_dispatcher` (autoAccept, delayMs), status operacional do motorista. **DEMO.**

**Pagamento:** PIX/dinheiro simulados + `connexy_demo_ride_blocks`. **DEMO / INFRA.**

Contrato futuro: **preservar a separação**. Stage A+B **não** inclui schema de Trip. Promover `connexy_demo_trip` a tabela de produção sem redesenho é fora de escopo e **incorreto**.

---

## 15. Settings

`connexy:demo:settings` = mapa `{ [userId]: { twoFactor, payment, language } }`.

| Campo | Classificação canônica |
| --- | --- |
| `language` | **User preference** — pode acompanhar a conta (HYBRID) |
| `twoFactor` | **não é setting de UI.** É segurança da Identity. Hoje boolean visual. DEMO até Auth real |
| `payment` | **não é setting.** String demo (“Cartão final 4821”). INFRA pagamentos |
| `connexy:reels:sound:v1` | **Local-only** (dispositivo) |
| `connexy.media.permission.granted` | **Local-only** |
| presença / roles | **OPEN** (chaves históricas, não este mapa) |

Não sincronizar nesta fase. Canonical: só `language` (e futuras prefs de UI) pertencem a “settings de usuário”; 2FA e pagamento **saem** deste blob no remoto.

---

## 16. Ownership matrix

Células não auditáveis = `OPEN DECISION`.

| Entidade | Owner | Participantes | Público/Privado | Lifecycle |
| --- | --- | --- | --- | --- |
| Identity | o próprio usuário (auth) | — | privado | ativo |
| Profile | User (mesmo id) | — | misto (públicos + privados) | ativo |
| Follow | follower | follower, followee | relacional; lista de followees não é feed público obrigatório | ativo / removido |
| Connection Request | sender (fromUser) | sender, recipient | privado | pending → accepted/declined |
| Connection | o par (sem owner único) | dois users | relacional / privado a terceiros | ativo |
| Conversation | **participantes** (sem owner único) | members explícitos | privado | ativo |
| ConversationParticipant | o user da linha | conversation | privado | joined / left OPEN DECISION |
| Pin | o participante | — | privado ao user | ligado/desligado |
| Read cursor | o participante | — | privado ao user | lastReadAt |
| Message | sender | conversation members | privado | criado (edit/delete OPEN) |
| Call Event | caller + conversation | caller, callee | privado | registro; sessão real = INFRA |
| Group | creator + members | participants com status | privado | convite + accepted |
| Reel/Agora (UGC) | creator (author.id) | — | público hoje; privacy OPEN | publicado |
| Reel like | user | reel | visível como contagem; linha relacional | ativo |
| Reel comment | author | reel (+ parent) | público no reel | criado |
| Save | user | target id | privado ao user | ativo |
| Moment/Post | author | — | privacy enum (enforcement OPEN) | criado |
| Catalog Business UGC | ownerId (user) | — | público no dispositivo | create-only hoje |
| Catalog Place UGC | ownerId | — | público | create-only |
| Catalog Event UGC | ownerId | — | público | create-only; businessId opcional |
| Catalog Offer UGC | ownerId; refere businessId | — | público | create-only |
| Mock catalog | — | — | seed | **não domínio remoto** |
| Reservation | requester (userId) | requester; target ator = OPEN DECISION | privado | confirmed imediato no demo; canonical requested→… |
| Carona offer | ownerId | owner + accepted requesters | discoverable se active | active/full/cancelled/completed |
| Carona request | requester | owner, requester | privado aos dois | requested→… |
| Trip | traveler (userId opcional) | driver snapshot | operacional DEMO | machine de UI |
| Dispatcher | sistema demo | frota mock | operacional DEMO | memória |
| Settings language | user | — | privado | HYBRID |
| Settings 2FA/payment | — | — | DEMO | não contrato |
| Device sound/permission | device | — | local | local-only |

---

## 17. ID contract

Não alterar IDs atuais. Não migrar. Contrato **conceitual** do futuro (quem gera, escopo, estabilidade).

| ID | Hoje | Canonical | Quem gera | Estabilidade | Owner / relação |
| --- | --- | --- | --- | --- | --- |
| **userId** | `getDemoIdentity().id` (`lucas`, ids de `people`) | Identity PK | Auth (hoje fixture) | estável para sempre | dono de tudo |
| **profileId** | não existe (blob) | **= userId** | — | 1:1 | profile |
| **connectionRequestId** | `demo-req-${from}--${to}` | id próprio (hoje derivado do par) | app | estável por par | from/to |
| **connectionId** | **não há id**; o par (userA, userB) | PK do par ou id opaco | app | estável | dois users + conversationId efeito |
| **conversationId** | DM `demo-direct-${sorted}`; grupo `demo-group-…`; IndexedDB id | id próprio da conversa | app no create | estável | participants |
| **messageId** | gerado no send local | id próprio | app | estável | conversation, sender |
| **reelId** | id do StoredReel / mock | id próprio; mocks **não** entram | app no publish | estável | author |
| **businessId** | catalog `business-…` **ou** id de fixture | id de Business de domínio **quando UGC**; fixtures não são PK remota | app | estável | owner; Offer aponta para cá |
| **placeId** | catalog `place-…` ou mock-data | id de Place UGC | app | estável | owner |
| **eventId** | catalog `event-…` ou MOCK_EVENTS | id de Event UGC | app | estável | owner; businessId? |
| **offerId** | catalog `offer-…` ou MOCK_PROMOTIONS | id de Offer UGC | app | estável | owner + businessId |
| **reservationId** | `reservation-${ts}-${rand}` | id próprio | app | estável | requester + resource |
| **rideId** (Carona offer) | `carona-${ts}-${rand}` | id da offer | app | estável | owner |
| **requestId** (Carona) | `carona-req-…` | id do pedido de vaga | app | estável | offer + requester |
| **tripId** | trip store | DEMO; fora A+B | app demo | sessão | traveler |

**requestId** no grafo social ≠ **requestId** da Carona. Escopos diferentes. No remoto, não colidir nomes sem prefixo de domínio.

---

## 18. Visibility

Níveis que **existem no produto** (não inventar um quarto sem uso):

| Nível | Onde aparece |
| --- | --- |
| Público / Todos | PostPrivacy.PUBLIC; profile visibility “Todos”; catálogo UGC; Agora hoje |
| Conexões | PostPrivacy.CONNECTIONS; profile “Conexões” |
| Privado / Somente você | PostPrivacy.PRIVATE; profile “Somente você”; reservations; chat; settings |
| FRIENDS (“Somente amigos”) | só no enum de Momento | **OPEN DECISION** — o grafo não tem Friends |
| Presence PUBLIC/FRIENDS/ANONYMOUS | check-in | fora do núcleo A+B; não promover sem produto |

Aplicação canônica:

| Recurso | Visibility canônica |
| --- | --- |
| Profile campos públicos | público; recortes via preferências |
| Profile privado | owner-only |
| Agora UGC | **público até OPEN de privacy** |
| Events / places / businesses / offers UGC | público (cadastro local hoje) |
| Reservations | privado (requester; + target se existir ator) |
| Carona offer active | discoverable (não-owner) |
| Carona request | privado aos dois |
| Chat | privado aos participantes |

Não forçar `connections` em catálogo/Agora sem UI que já aplique.

---

## 19. Lifecycle / state machine

Somente estados **necessários** e presentes no código. Sem máquinas implementadas.

### Connection Request

```text
(none) → pending → accepted | declined
                ↖ reopen pending (mesmo par)
```

### Group invite (participant)

```text
pending → accepted | declined | cancelled
```

Creator já entra `accepted`.

### Reservation (tipo)

```text
create demo: → confirmed → cancelled
canonical:   requested → confirmed → cancelled | completed
```

`requested`/`completed` são do tipo; política de entrada = OPEN.

### Carona Offer

```text
active → full (seats=0)
active|full → cancelled (owner)
completed  (tipo existe; transição de produto fraca)
full → active (se requester cancela accepted e devolve vaga)
```

### Carona Request

```text
requested → accepted | rejected | cancelled
accepted → cancelled (requester; devolve vaga)
```

### Event (catalog)

Sem status próprio no overlay. Mapper para UI usa `UPCOMING` sempre. **Lifecycle de Event UGC = created.** Status MOCK (`UPCOMING/ONGOING/FINISHED/CANCELLED`) **não** é contrato UGC.

### Offer (catalog)

Created + `validUntil`. Sem `isActive` no overlay (mapper força `true`). Expiração = campo, não machine.

### Trip (DEMO, fora A+B)

```text
solicitar → … → conclusao | cancelada
```

Não copiar essa machine para Carona.

### Call History

```text
session memória: outgoing → connected → (fim)
histórico persistido: TEXT com outcome ended | declined | missed
```

Canonical: evento terminal de histórico, não session WebRTC.

### Follow / Connection / Message / Reel

Sem machine além de existe/não existe (follow) ou created (message/reel). Connection não tem “unfriend” no demo.

---

## 20. Local / Remote / Hybrid

| Domínio | Classificação | Motivo |
| --- | --- | --- |
| Identity / Auth | Remote | dono de RLS |
| Profile | Remote | conteúdo de conta |
| Profile visibility prefs | Hybrid | acompanham user; cache local ok |
| Follow / Request / Connection | Remote | grafo multi-dispositivo |
| Group | Remote | membership |
| Conversation + participants | Remote | chat |
| Pin / lastReadAt | Remote | por user, entre aparelhos |
| Messages | Remote | |
| Call session WebRTC | INFRA / não A+B | |
| Call history event | Remote (quando existir) | registro, não mídia |
| GestureHandledAt | OPEN / provavelmente Local ou participant | UX de lista |
| Reel UGC + likes/comments | Remote | |
| Reel media | Remote Storage | |
| MOCK_REELS | **não remoto** | seed/demo |
| Save | Remote | |
| Sound / media permission | Local-only | |
| Moment UGC | Remote + Storage | |
| Catalog UGC | Remote | após decisões de modelo |
| Mock catalog | **não remoto** | |
| Reservation | Remote | entidade própria |
| Carona offer/request | Remote | social |
| Trip / dispatcher / ride blocks | DEMO até infra | não Stage A+B |
| Settings language | Hybrid | |
| Settings 2FA/payment blob | DEMO | não migrar como está |
| Demo session flag / identity switcher | Local demo | some com Auth |

---

## 21. Current vs Canonical vs Future Backend

### Identity / Profile

```text
CURRENT IMPLEMENTATION
Switcher + blob único own-profile; session flag; fixtures de terceiros.

CANONICAL PRODUCT CONTRACT
Identity ≠ Profile. userId = Identity. Profile 1:1 com o mesmo id.
Público vs privado separados conceitualmente.

FUTURE BACKEND REPRESENTATION
Auth + profiles PK=userId. Privados com RLS owner-only.

OPEN DECISION
Packing dos privados; destino dos fixtures people.
```

### Follow / Request / Connection

```text
CURRENT IMPLEMENTATION
Três arrays no mesmo localStorage. Connection sem id próprio.
connectUser pode pular Request.

CANONICAL PRODUCT CONTRACT
Três conceitos distintos. Follow unilateral. Request = intenção.
Connection = par bilateral, pode nascer sem request.

FUTURE BACKEND REPRESENTATION
Três coleções. Connection não se deriva de Follow.

OPEN DECISION
Unfriend; se DM exige Connection.
```

### Conversation participants

```text
CURRENT IMPLEMENTATION
StoredConversation sem members. Lista = connections + grupos accepted.

CANONICAL PRODUCT CONTRACT
Participants são relação explícita da conversa. Não inferir de Follow/Request/Connection.

FUTURE BACKEND REPRESENTATION
Membership por conversa (hipótese: conversation_participants).
Connection/group podem criar conversa; não *são* a conversa.

OPEN DECISION
leftAt / roles (admin de grupo).
```

### Pin

```text
CURRENT IMPLEMENTATION
pinnedByUserIds[] no aggregate.

CANONICAL PRODUCT CONTRACT
Estado do usuário sobre a conversa (A pinna sem B).

FUTURE BACKEND REPRESENTATION
Campo/coleção no participante. Não SoT no documento da conversa.

OPEN DECISION
SQL exato (coluna vs tabela) — hipótese, não implementação.
```

### Unread

```text
CURRENT IMPLEMENTATION
Derivado da última mensagem; grupos sempre 0.

CANONICAL PRODUCT CONTRACT
Participant.lastReadAt. Sem message.isUnread.

FUTURE BACKEND REPRESENTATION
Cursor no participante; unread derivado.

OPEN DECISION
Nenhuma estrutural. Precisão de “lido até” vs “aberto o thread”.
```

### Messages / Calls

```text
CURRENT IMPLEMENTATION
StoredMessage; from me|them; call = TEXT.

CANONICAL PRODUCT CONTRACT
Message = conteúdo. Call Event = histórico de chamada, não WebRTC.
senderId é o autor.

FUTURE BACKEND REPRESENTATION
messages + (kind call_event ou conversation_events). Storage para anexos.

OPEN DECISION
Onde mora o call event; edit/delete/replies.
```

### Agora

```text
CURRENT IMPLEMENTATION
IDB domínio + media; feed merge MOCK_REELS; likes/comments reais;
follow/connect via grafo; save ids genéricos.

CANONICAL PRODUCT CONTRACT
UGC + interações = domínio. MOCK_REELS não é backend.

FUTURE BACKEND REPRESENTATION
reels / likes / comments de UGC. Mídia em Storage. Não importar mocks.

OPEN DECISION
Privacy do reel; shape de save.
```

### Catalog / Business / Offer

```text
CURRENT IMPLEMENTATION
Tagged union UGC + mocks. Offer.businessId obrigatório, FK frouxa.
Sem edit/delete. Event.location string. Business ≠ Place.

CANONICAL PRODUCT CONTRACT
Quatro tipos. Offer → Business conceitual. Mock ≠ UGC.
Owner = criador (user). Sem ator estabelecimento hoje.

FUTURE BACKEND REPRESENTATION
Só UGC. Relação Offer.businessId quando o Business for domínio real.
Não copiar MOCK_BUSINESSES.

OPEN DECISION
1 vs 4 tabelas; Business–Place; Event.placeId; ator estabelecimento.
```

### Reservation

```text
CURRENT IMPLEMENTATION
Entidade própria; create já confirmed; cancel pelo requester.

CANONICAL PRODUCT CONTRACT
Entidade própria. Auto-confirm demo ≠ política remota definitiva.

FUTURE BACKEND REPRESENTATION
reservations com requester + target + slot + status.

OPEN DECISION
Ator receptor; auto vs manual; completed.
```

### Carona

```text
CURRENT IMPLEMENTATION
offers+requests locais; meetup texto; aceite → connectUser + mensagem.

CANONICAL PRODUCT CONTRACT
Domínio social próprio. ≠ Trip/Dispatcher. Meeting point aproximado.

FUTURE BACKEND REPRESENTATION
carona_offers + carona_requests. conversationId opcional pós-aceite.

OPEN DECISION
Participants explícitos vs só requests; se força Connection.
```

### Trip

```text
CURRENT IMPLEMENTATION
Trip store + dispatcher memória + MOCK_DRIVER. DEMO.

CANONICAL PRODUCT CONTRACT
Separado de Carona. Não é Stage A+B.

FUTURE BACKEND REPRESENTATION
Fora deste contrato. Requer GPS, frota, pagamento.

OPEN DECISION
Todo o modelo operacional — INFRA/produto futuro.
```

### Settings

```text
CURRENT IMPLEMENTATION
Mapa por userId: twoFactor, payment, language.

CANONICAL PRODUCT CONTRACT
language = user preference. 2FA/pagamento não são este blob.
Som/permissão = local-only.

FUTURE BACKEND REPRESENTATION
prefs de conta (language). 2FA no Auth. Pagamento no PSP.

OPEN DECISION
Lista completa de prefs sincronizáveis (presença, roles).
```

---

## 22. Decision Matrix

| Tema | Estado atual | Decisão canônica | Confiança | Bloqueia backend? |
| --- | --- | --- | --- | --- |
| Identity/Profile | switcher + blob único | conceitos distintos; userId=Identity; profileId=userId | Alta | Não (A+B) |
| Isolamento own-profile | blob global | dívida; remoto 1 linha/user | Alta | Não (não copiar o blob) |
| Follow/Request/Connection | três tipos no mesmo blob | manter três conceitos | Alta | Não |
| Connection sem request | `connectUser` | permitido | Alta | Não |
| Conversation participants | inferidos na lista | explícitos na conversa | Alta | **Sim se ignorado** (RLS) |
| Pin | array no aggregate | estado participante | Alta | Não (modelo fechado) |
| Unread | derivado / grupo=0 | lastReadAt no participante | Alta | Não |
| Messages | StoredMessage + from me/them | conteúdo; senderId | Alta | Não |
| Calls | TEXT demo | Call Event ≠ Message ≠ WebRTC | Alta | Não para Message |
| Agora UGC vs mock | merge no feed | mock ≠ backend | Alta | **Sim se MOCK_REELS virar tabela** |
| Save | ids genéricos | relação user×target | Média | Não para A+B |
| Catalog UGC vs mock | overlay + fixtures | separados | Alta | Não se mocks ficarem de fora |
| Business vs Place | kinds irmãos | entidades distintas; sem 1—N | Média | **Sim para schema de catálogo** |
| Offer.businessId | string obrigatória, FK frouxa | relação canônica conceitual | Alta | Parcial (shape da FK) |
| Event.location | string; businessId? | sem Place FK hoje | Alta | **Sim para schema de event** |
| Reservation | entidade; auto-confirm | entidade própria; política OPEN | Alta | **Sim para fluxo remoto completo** |
| Carona vs Trip | stores isolados | permanecer isolados | Alta | Não |
| Carona participants | implícitos | OPEN se lista própria | Média | Não para rascunho offer/request |
| Trip/Dispatcher | DEMO | fora A+B | Alta | Não A+B; sim mobilidade |
| Settings | 3 campos demo | language HYBRID; resto não migrar | Alta | Não |
| FRIENDS vs CONNECTIONS | dois valores de privacy | OPEN | Média | Parcial (posts) |
| Group vs conversation | DemoGroup + id próprio | conversa coletiva com members | Média | Parcial (1 tabela vs 2) |
| Schema gerado / stubs | 6 tabelas + ChatRepository | **não são o contrato** | Alta | **Sim se reusados cegamente** |

---

## 23. Backend Blockers

### Blocker técnico

- Três persistências coexistentes; adapter IndexedDB só cobre chat/reels.
- Stubs `ChatRepository` / schema gerado **divergem** do modelo local — reutilizá-los cria o schema errado.
- Data URLs em Momento e anexos de chat não cabem em coluna Postgres.

### Blocker de domínio

- Catálogo: Business–Place–Event sem relações fechadas.
- Offer.businessId aponta a UGC **ou** fixture.
- Group: membership no grupo vs na conversa (hoje o group **é** o id da conversa).
- Call event vs message kind.

### Blocker de produto

- Ator estabelecimento / política de confirmação de Reservation.
- Privacy de Agora; FRIENDS vs CONNECTIONS vs “amigo”.
- Unfriend, delete de mensagem, edit/delete de catálogo.
- Destino editorial dos mocks (seed vs CMS vs jogar fora).

### Blocker de segurança

- Sem Auth real não há RLS.
- Own-profile e `connexy_roles` sem isolamento por identidade — **não copiar**.
- `from: me|them` não pode ser ACL.
- Participantes não modelados ⇒ impossível RLS correta de chat.

### Blocker de ownership

- Connection/Conversation sem owner único (correto) — exige membership, não `owner_id`.
- Catalog owner = user criador, não estabelecimento.
- Reservation sem owner do recurso.

### Blocker de lifecycle

- Reservation `confirmed` imediato vs requested.
- Event/Offer sem machine real.
- Carona `completed` sem transição de produto.
- Trip machine não deve vazar para Carona.

**Não são blockers de A+B (identity/graph/chat):** Trip, GPS, WebRTC, pagamentos, matching, IA.

---

## 24. Open Decisions

Lista objetiva do que **ainda** precisa de produto/arquitetura antes de um schema **completo**:

1. Packing de campos privados do Profile.
2. Se DM **exige** Connection (hoje Carona força).
3. Unfriend / block.
4. Group: só `conversations`+participants ou entidade Group.
5. `gestureHandledAt` local vs participante remoto.
6. Call history: kind em messages vs `conversation_events`.
7. Privacy de Agora.
8. Save polimórfico vs por tipo.
9. FRIENDS vs CONNECTIONS (Momento).
10. Catálogo: 1 tabela vs 4; Business 1—N Place; Event.placeId.
11. Unificação CatalogBusiness × MOCK_BUSINESSES.
12. Ator estabelecimento; confirmação de reserva.
13. Carona: participants[] explícitos; se aceite cria Connection.
14. Quais settings sincronizam além de language.
15. Destino de `people` / MOCK_* no remoto.

---

## 25. Recommendation

Recomendações **fechadas** (código + produto justificam):

1. **Separar Identity de Profile.** userId canônico = Identity. Profile PK = userId.
2. **Manter Follow, Request e Connection distintos.** Follow não cria chat. Connection pode existir sem Request.
3. **Participants explícitos na conversa.** Não inferir de grafo. Pin e lastReadAt no participante.
4. **Pin = estado do user sobre a conversa.**
5. **Read = lastReadAt**, não flag por mensagem.
6. **Message ≠ Call Event ≠ WebRTC.**
7. **Mocks não são entidades remotos** (`MOCK_REELS`, `MOCK_BUSINESSES`, `MOCK_DRIVER`, `people` como seed).
8. **Reservation é entidade própria.** Auto-confirm demo não é a política remota.
9. **Carona Amiga ≠ Trip ≠ Dispatcher.** Meeting point textual.
10. **Não usar `ChatRepository` nem as 6 tabelas geradas como contrato.**
11. **Settings:** language pode ser remota; 2FA/pagamento deste blob não.
12. **Offer conceitualmente pertence a um Business**; a FK rígida só depois de o Business de domínio existir (UGC, não fixture).

Não implementar nada disso agora.

### Próxima fase

O contrato **completo** **não** está `READY_FOR_SCHEMA`.

A próxima fase **não** deve criar tabelas de catálogo, reserva, trip, storage ou RLS completa.

Fase seguinte **coerente**, se o produto quiser avançar:

> **Rascunho de schema limitado a Stage A+B** (Identity/Profile, Follow, Connection Request, Connection, Conversation, Participant, Pin, Read, Message) — ainda como documento, **ou** um fechamento curto das OPEN DECISIONS de catálogo/reserva/visibility **antes** de qualquer SQL.

Não iniciar essa fase aqui.

### Readiness conclusion

| Recorte | Prontidão |
| --- | --- |
| Identity / Profile | definido |
| Social graph | definido |
| Conversation + participants + pin + read | definido |
| Message | definido |
| Call / WebRTC | Call Event definido; infra OPEN |
| Agora UGC vs mock | definido; privacy OPEN |
| Catalog model | **não** fechado o bastante para SQL |
| Reservation policy | entidade sim; ator/confirmação OPEN |
| Carona vs Trip | separado; participants OPEN |
| Schema remoto completo | **NOT_READY** |
| Schema remoto só A+B (doc) | possível na **próxima** fase documental |

**1H-6 STATUS: PASS PARTIAL** — domínio A+B majoritariamente definido; decisões de produto restantes impedem schema completo sem retrabalho.

---

## Apêndice — Validação desta fase

Nenhum arquivo de produto alterado nesta fase. Testes existentes não
modificados. Sem testes artificiais. Sem pasta `supabase/migrations`
criada.

| Check | Resultado |
| --- | --- |
| Testes unitários existentes (não-browser) | **326 pass / 0 fail / 1509 expect()** em 32 arquivos |
| Testes browser CDP | não reexecutados (produto intacto); 1H-2/1H-4: `networkCalls = 0` |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| Network / Supabase nos fluxos demo | gate `isDemoMode()` ⇒ configurado = false; **0** chamadas novas |
| Tabelas / migrations / RLS / Storage / Realtime | **0** |
