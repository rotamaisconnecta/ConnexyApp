# 1H-12 — Adapters Domínio Local ↔ Schema A

- **Data:** 2026-09-25
- **Tipo:** fronteira de tradução de modelos. Sem cutover, dual-write ou sync.
- **Herdado:** 1H-8 contrato, 1H-9 SQL, 1H-10 dump, 1H-11 remote repositories — **não modificados**.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**
- **CUTOVER:** **NOT STARTED**

Nenhuma tela, repository local, repository remoto, migration, RLS ou `getDemoIdentity()` foi alterada.

---

## 1. Objetivo

```text
LOCAL DOMAIN
     ↓
  ADAPTER
     ↓
REMOTE SCHEMA A
```

e o inverso, tipado, testado, sem misturar persistências.

---

## 2. Auditoria dos modelos locais (somente leitura)

| Domínio | Modelo local | Persistência | Chave demo |
| --- | --- | --- | --- |
| Identity | `DemoIdentity` | localStorage | `connexy:demo:identity` |
| Profile | `DemoOwnProfile` (público+privado no mesmo blob) | localStorage | `connexy:demo:own-profile` |
| Social | `DemoFollow`, `DemoRequest`, `DemoConnection` | localStorage | `connexy:demo:db` |
| Conversation | `StoredConversation` | IndexedDB | `connexy-app-local-db` |
| Message | `StoredMessage` / `DemoMessage` | IndexedDB | store `messages` |
| Group | `DemoGroup` + `DemoGroupParticipant` | localStorage | `connexy:demo:db` |
| Post | `DemoPost` | localStorage | `connexy:demo:posts` |
| Reel | `StoredReel`, `StoredReelLike`, `StoredReelComment` | IndexedDB | `connexy-reels-data-local-db` |
| Reel media | blobs | IndexedDB media | `connexy-reels-local-db` |
| Catalog | `CatalogBusiness/Place/Event/Offer` | localStorage | `connexy:demo:catalog` |
| Reservation | `Reservation` | localStorage | `connexy:demo:reservations` |
| Carona | `CaronaOffer`, `CaronaRequest` | localStorage | `connexy:demo:carona` |
| Save | `string[]` ids sem tipo | localStorage | `connexy:demo:saved-details` |
| Settings | `DemoLocalSettings` | localStorage | `connexy:demo:settings` |

Remote técnico: rows de `supabase/schema-a.generated.ts` via aliases em `src/integrations/supabase/remote/types.ts` (**lido, não alterado**).

---

## 3. Adapters criados

Diretório: `src/lib/adapters/schema-a/`

| Arquivo | Traduz |
| --- | --- |
| `identity.ts` | DemoIdentity ⟂ Schema A Auth UUID |
| `profile.ts` | DemoOwnProfile ↔ `profiles` + `profile_private` |
| `social.ts` | Follow / Request / Connection |
| `conversation.ts` | Conversation, Participant, Message, Group |
| `content.ts` | Post, Reel, Like, Comment |
| `catalog.ts` | Business, Place, Event, Offer |
| `reservation.ts` | Reservation |
| `carona.ts` | CaronaOffer, CaronaRequest |
| `save.ts` | Save |
| `ids.ts` / `errors.ts` / `classification.ts` | UUID, erros de mapeamento, classificação de campos |

API: `toRemote*Insert` / `toDomain*` (e `toStored*` quando o IDB cabe). **Não** é uma segunda camada de repositories. Não chama Supabase.

---

## 4. Identidade

```text
Demo: getDemoIdentity()     ≠     Remote: auth.uid() UUID
```

`lucas` **não** vira PK remota. `toSchemaAAuthIdentity` exige UUID. O adapter não substitui um contexto pelo outro.

---

## 5. Campos mapeados (resumo)

Ver §12 para a tabela completa de não-correspondência.

Mapeamentos explícitos (não JSON blob):

- `photo` → `photo_url`, `cover` → `cover_url`
- visibility PT → `everyone|connections|only_me`
- `privateAddresses` / `birthDate` → `profile_private` (não vão para `profiles`)
- `language` Português → `locale` `pt-BR` (opcional; 2FA/pagamento **não**)
- Follow/Request/Connection: snake_case + ISO timestamps; par canônico `user_a < user_b`
- pin / `last_read_at` / `gesture_handled_at` no **participante**
- `from: me|them` derivado de `sender_id` vs viewer
- Post media array → `jsonb`; FRIENDS → CONNECTIONS (flag `collapsedFromFriends`)
- Reservation `requested` ↔ `pending`; insert remoto **sempre** `pending`
- Carona `date/time` → `ride_date/ride_time`
- Save exige `target_type` do Schema A

---

## 6. Campos derivados / mock / UI-only

| Campo | Classificação |
| --- | --- |
| `unreadCount` / unread | LOCAL DERIVED (`last_read_at` vs `last_message_at`) |
| `StoredMessage.from` | LOCAL DERIVED |
| `DemoOwnProfile.age` | LOCAL DERIVED (cache opcional em `profiles.age`) |
| Event UPCOMING | LOCAL DERIVED de `start_at` |
| `pinnedByUserIds` no agregado | LOCAL DERIVED da lista de participantes |
| `MockConversation.isOnline`, `proximityMeters`, `threadIcon` | MOCK |
| `StoredReel.author.verified / isFollowing / profession` | MOCK / snapshot UI |
| `StoredReelComment.likes / likedByMe` | UNMAPPED (não existem no A) |
| `StoredReel.persistence` | UNMAPPED (flag local) |

`message.isUnread` **não** é campo remoto e o adapter recusa transportá-lo.

---

## 7. Campos sem correspondência

| Campo local | Domínio | Correspondência remota | Tratamento |
| --- | --- | --- | --- |
| `DemoIdentity.id` (`lucas`) | Identity | UUID Auth | recusar como PK; contextos distintos |
| Blob `connexy:demo:own-profile` | Profile | duas tabelas | split explícito; não copiar JSON |
| `DemoRequest.message` | Social | coluna inexistente (1H-9) | drop no insert; `null` no domain adaptado |
| `DemoConnection.conversationId` obrigatório | Social | `conversation_id` nullable | demo-direct-* → `null`; não cria Conversation |
| `StoredMessage.senderName` | Chat | — | ignorar no insert |
| `StoredMessageKind` sem `call` | Chat | `kind=call` | AdaptedMessage mantém `call`; Stored perde o kind |
| `PostPrivacy.FRIENDS` | Post | não existe | colapsa para CONNECTIONS, documentado |
| `DemoPost.authorName/photo/handle` | Post | só `author_id` | snapshot exigido na volta; não inventar |
| Reel `videoUrl` (media DB) | Agora | `video_url` obrigatório | insert exige URL extra; sem upload |
| `ReservationStatus.completed` | Reserva | não existe | erro de mapeamento |
| auto-confirm demo | Reserva | default `pending` | política local **não** transportada |
| `saved-details` ids sem tipo | Save | `target_type` obrigatório | `fromLocalSavedDetailId` devolve `targetType: null`; não inventa FK |
| outing-invites / reviews / roles | — | fora do A | FUTURE |
| Product / Service / Order / Payment | Commerce B | — | sem adapter |
| Carona → Connection + DM | Carona | aplicação 1H-8 | DEFERRED |

Nenhuma coluna nova foi pedida ao Schema A.

---

## 8. Decisões preservadas

- Follow ≠ Request ≠ Connection
- Connection **não** cria Conversation no adapter
- Business ≠ Place; Offer → Business UUID; Event ≠ Ticket
- Participantes explícitos; pin/read no participante
- Agora = produto / Reel = modelo técnico
- Carona ≠ Trip ≠ Dispatcher ≠ Delivery
- Identity demo ≠ Auth

---

## 9. Incompatibilidades (não blockers)

1. IDs demo não-UUID não podem ser PKs/FKs remotas.
2. Saves locais são um array untyped; o A exige tipo.
3. Pedido de conexão local tem `message`; o SQL 1H-9 não.
4. Reserva `completed` e privacy `FRIENDS` não existem no A.
5. Preview `last_message_*` e unread continuam regras de aplicação.

Nada disso exigiu alterar o Schema A. O adapter traduz ou recusa.

---

## 10. Testes

`tests/schema-a-adapters-1h-12.test.ts`

Cobertura: Identity/Profile, Follow, ConnectionRequest, Connection, Conversation, Participant, Message, Post, Reel, Business, Place, Event, Offer, Reservation, CaronaOffer, CaronaRequest, Save.

- Round-trip dos campos relevantes (profile split, follow, connection nullable, post media, catalog, carona, save)
- Nullability (private row ausente, conversation_id null, media vazia recusada)
- Ownership (owner `lucas` recusado; owner UUID preservado; author snapshot não vira coluna)
- Derived não enviados (`isUnread`, `authorName`, `likes`, `isFollowing`, auto-confirm)

Isolamento: rotas/componentes não importam os adapters; adapters não chamam `getDemoIdentity(` nem remote repositories.

---

## 11. Qualidade

| Check | Resultado |
| --- | --- |
| `bun test` | **379 pass / 0 fail / 2348 expect()** (55 arquivos). Baseline 1H-11: 360 / 2217. Delta: +19 testes |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline 1H-11** |
| `networkCalls` demo | **0** |

---

## 12. Impacto no MVP

| Item | Estado |
| --- | --- |
| UI / rotas | intactas |
| localStorage / IndexedDB | intactos |
| Remote repositories 1H-11 | UNCHANGED |
| Local repositories | UNCHANGED |
| Schema A / migrations / RLS | UNCHANGED |
| `types.ts` legado / ChatRepository | UNCHANGED |
| dual write / sync / fallback | **não** implementados |

---

## 13. Blockers

Nenhum. Diferenças LOCAL ≠ REMOTE foram traduzidas ou documentadas.

---

## 14. Deferred

- Cutover UI
- Dual-write / sync
- Orquestração Carona → Connection + DM
- Coluna `connection_requests.message` (exigiria mudança de Schema A)
- Save local com `target_type`
- Schema B

---

## Próxima fase recomendada

**1H-13 — Cutover plan (documental) ou feature-flag de um domínio isolado, ainda sem ligar o demo.**

Não iniciar nesta entrega.
