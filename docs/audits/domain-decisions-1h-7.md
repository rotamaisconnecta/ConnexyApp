# 1H-7 — Domain Decisions Closure

- **Data:** 2026-09-24
- **Tipo:** fechamento de decisões de domínio. Sem backend. Sem SQL. Sem alteração de MVP.
- **Herdado:** `docs/audits/backend-readiness-1h-5.md`, `docs/audits/domain-contract-1h-6.md`
- **Arquivo criado:** este relatório.
- **Arquivos de produto alterados:** 0
- **1H-6:** não foi apagado nem sobrescrito.
- **STATUS:** **PASS**
- **CONTRACT STATUS:** **READY_FOR_SCHEMA**

Esta fase **não** criou tabelas, migrations, RLS, Storage, Realtime, Auth, APIs, adapters nem entidades de código.

---

## 1. Objetivo

Fechar as decisões que a 1H-6 deixou abertas, de modo que a próxima fase possa **desenhar** o schema remoto sem descobrir produto no SQL.

Pergunta desta fase:

> Qual é o contrato de domínio definitivo que o backend deverá representar?

Fluxo: DECISÃO → CONTRATO → (depois) SCHEMA → (depois) IMPLEMENTAÇÃO.

---

## 2. Fontes auditadas

| Decisão | Código |
| --- | --- |
| Privacy | `lib/types/post.ts`, `privacy-selector.tsx`, `demo-posts.ts`, `reel-feed.ts`, `reels-entities.ts`, `demo-own-profile.ts`, `checkin-types.ts` |
| Catálogo | `local-catalog.ts`, `catalog-create-form.tsx`, `home-discovery.ts`, `mock-businesses.ts`, rotas `/create/{event,place,place-business,offer}`, `/local/$id`, `/business/$businessId`, `/event/$eventId`, `_app.gerenciar.tsx` |
| Reservation | `reservation-store.ts`, `reservable.ts`, `reserva.$resourceId.tsx`, `reservas.tsx` |
| Group | `demo-db.ts` (`DemoGroup`, `createDemoGroup`, `respondToDemoGroupInvite`, `leaveDemoGroup`), `group-invite-sheet.tsx`, `functional-conversation-list.ts`, `ConnexyChatScreen.tsx` |
| Call | `demo-call.ts`, `StoredMessageKind` |
| Carona | `carona-store.ts` (`acceptCaronaRequest` → `connectUser` + `sendLocalMessage`) |
| Núcleo A+B | `docs/audits/domain-contract-1h-6.md` |

Princípio de desempate (obrigatório): (1) comportamento existente → (2) intenção Connexy → (3) 1H-6 → (4) menor complexidade → (5) menor acoplamento → (6) evolução → (7) ownership/segurança → (8) conveniência de SQL por último.

---

## 3. Estado herdado do 1H-6

**STATUS:** PASS PARTIAL. **CONTRACT STATUS:** NOT_READY.

Núcleo A+B **já fechado** e **não reaberto** nesta fase:

```text
Identity ≠ Profile
userId = Identity
Profile 1:1 com userId
Follow ≠ Request ≠ Connection
Conversation participants explícitos
Pin = estado do participante
Read = lastReadAt no participante
Message = conteúdo conversacional
Carona ≠ Trip ≠ Dispatcher
Mocks ≠ entidades remotas
Reservation = entidade própria
```

Abertas na 1H-6 e **alvo desta fase:**

1. Privacy de Agora / Momento (FRIENDS vs CONNECTIONS)
2. Estrutura do catálogo (1 vs 4; Business×Place; Event×Place; Offer×Business)
3. Ator e confirmação de Reservation
4. Group × Conversation
5. Call Event
6. Carona → Connection ou só Conversation

### 1H-6 adjustment

Nenhum ponto do núcleo A+B foi invertido. Ajustes de entendimento:

| Tema | 1H-6 | 1H-7 |
| --- | --- | --- |
| Group | conversa coletiva, confiança média, OPEN tabela vs entidade | **fechado:** Conversation com metadata; sem entidade Group |
| Call Event | Message ≠ Call Event; OPEN kind vs coleção | **fechado:** kind estruturado na stream de messages; ainda ≠ WebRTC e ≠ texto livre |
| Catalog 1 vs 4 | OPEN | **fechado:** 4 entidades |
| Reservation `completed` | no tipo, uso fraco | **fora** da machine canônica |
| Event.businessId | campo opcional no tipo | UI de create **não coleta**; permanece opcional “hosted by”, não Place |

---

## 4. Agora Privacy

### CURRENT IMPLEMENTATION

**Agora (Reels):** `StoredReel` **não tem** campo de privacy/audience. O feed (`reel-feed.ts`) une UGC + `MOCK_REELS` para quem está no dispositivo. Follow/Connect/Save são interações sobre conteúdo já visível. Não há filtro de audiência.

**Momento:** `DemoPost.privacy` é string. O seletor de criação oferece `PUBLIC | CONNECTIONS | FRIENDS | PRIVATE` (`PostPrivacy`). Labels: Público / Conexões / Somente amigos / Privado. **`getDemoPosts()` devolve todos os posts — nenhum enforcement de leitura.**

**Perfil:** `Todos | Conexões | Somente você`. Sem “amigos”.

**Presença/check-in (fora de Agora):** `PUBLIC | FRIENDS | ANONYMOUS`. Não há grafo Friends; “amigos” no check-in não é uma entidade.

Não existe caminho de código em que FRIENDS e CONNECTIONS produzam audiências diferentes para Momento ou Agora.

### CANONICAL PRODUCT CONTRACT

Audiência de **conteúdo** (Momento; e Agora se um dia expor seletor):

```text
PUBLIC
CONNECTIONS
PRIVATE
```

**FRIENDS == CONNECTIONS.** Não há grupo “amigos” distinto de Connection. Manter dois níveis só por label da UI seria nomenclatura, não domínio.

**O que é Agora?** Conteúdo de **descoberta pública**. Default e contrato atual: **PUBLIC**. Não é “só conexões”, “só amigos” nem privado. Interações (like, comment, follow, connect, save) não mudam a audiência do vídeo.

**Momento** pode escolher PUBLIC / CONNECTIONS / PRIVATE na criação. Enforcement remoto deverá respeitar isso; o demo ainda não filtra.

Presença `ANONYMOUS` **não** entra no modelo de conteúdo. Check-in continua domínio próprio; o `FRIENDS` de presença mapeia conceitualmente a **CONNECTIONS**.

### FUTURE BACKEND REPRESENTATION

- Reel: `audience` default `PUBLIC` (ou omitido = público). Sem nível extra.
- Post/Momento: `audience` ∈ {PUBLIC, CONNECTIONS, PRIVATE}.
- RLS: público lê PUBLIC; CONNECTIONS lê se há Connection; PRIVATE só author.
- Não criar tabela/enum `friends`.

### RATIONALE

Comportamento real: Agora é praça pública; Momento tem seletor cosmético de 4 valores sem grafo Friends e sem filtro. Menor complexidade: 3 níveis. Consistência com Profile (`Todos/Conexões/Somente você`).

### OPEN QUESTION

Nenhuma estrutural. Evolução futura (Agora CONNECTIONS) reusa o mesmo enum; não precisa de decisão agora.

```text
DECISION: CLOSED
```

---

## 5. Catálogo — 1 tabela ou 4?

### CURRENT IMPLEMENTATION

Um array local (`connexy:demo:catalog`) com tagged union `kind: event|place|offer|business`. Conveniência de **storage local**, não do produto.

O produto trata os quatro como coisas diferentes:

- Quatro fluxos de create (`/create/event`, `place`, `place-business`, `offer`).
- Quatro rotas de detalhe (`/event/$eventId`, `/local/$id`, `/business/$businessId`, oferta no business).
- Campos distintos (Event: startAt/endAt/capacity/price; Offer: discountValue/validUntil/businessId obrigatório; Place vs Business: taxonomias de categoria diferentes).
- Home discovery: `kind: place | business | event | offer` (`home-discovery.ts`).
- Reserva: `resourceType` só `business | place` — Offer e Event **não** são reserváveis.

Mocks (`MOCK_BUSINESSES`, `places`, `MOCK_EVENTS`) **não** são o overlay e **não** viram contrato remoto.

### CANONICAL PRODUCT CONTRACT

**Opção B — quatro entidades de domínio:**

```text
Event
Place
Business
Offer
```

Não usar `CatalogItem` polimórfico como contrato. O tagged union local não define o remoto.

### FUTURE BACKEND REPRESENTATION

Quatro coleções (hipótese de schema na 1H-8). Integridade: Offer → Business. Índices e RLS por tipo. Mocks permanecem seed/editorial, fora dessas coleções até haver UGC equivalente.

### RATIONALE

Relacionamentos, campos, rotas, permissões de reserva e evolução divergem. Uma tabela genérica empurraria `NULL`s e RLS frágil. Princípio 4–7 vencem a conveniência do array único (princípio 8).

```text
DECISION: CLOSED
```

---

## 6. Business × Place

### CURRENT IMPLEMENTATION

Kinds **irmãos**. Cada um tem `address` / lat-lng próprios. **Não** há `Business.placeId` nem `Place.businessId`. Create de Place e de Business são telas distintas. Reserva pode apontar a um **ou** outro (`resourceType`). Locais (`/locais`, `places`) e marketplace (`MOCK_BUSINESSES` + overlay) são superfícies paralelas — o mesmo café real **pode** existir duas vezes, uma em cada lista.

Não há cadeia de filiais (1—N) no produto.

### CANONICAL PRODUCT CONTRACT

**Possibilidade 3 (fechada):** Place é **independente**. Business **não possui** Places. Business **não é** o mesmo unitário que Place.

- Place = local físico descobível (endereço, categoria de lugar, reserva de local).
- Business = estabelecimento comercial (categoria de negócio, ofertas, detalhe de marketplace, reserva de negócio).
- Colocação no mundo real **não** é modelada por FK neste contrato. Cada um carrega o próprio endereço.
- **Não** há `Business └── Places[]`.
- **Não** fundir as duas entidades (quebraria `resourceType` da reserva e as duas listagens).

### FUTURE BACKEND REPRESENTATION

Tabelas/coleções distintas, sem FK obrigatória entre elas. Um `placeId` opcional em Business **não** entra no contrato atual (seria campo novo sem produto).

### RATIONALE

O MVP não implementa multi-unidade nem “negócio = um lugar”. Inventar 1—N ou 1—1 criaria relação que o create/reserva não usam. Independência é o que o usuário já opera.

```text
DECISION: CLOSED
```

---

## 7. Event × Place

### CURRENT IMPLEMENTATION

`CatalogEvent.location` é **string obrigatória** (label “Local”). **Não existe `placeId` no overlay.** `businessId` é opcional no **tipo**, mas `catalog-create-form` **não envia** `businessId` ao criar evento. Não há flag “online”. Não há picker de Place nem de Business no create de evento.

### CANONICAL PRODUCT CONTRACT

- Event **não** exige Place.
- Event **não** exige Business.
- Event tem **localização própria** (`location` texto). Pode ser endereço, nome de casa, ou a palavra “Online” como texto — **não** há tipo `online` no domínio.
- `placeId` **não** faz parte do contrato (não criar o campo).
- `businessId` permanece **opcional** = “evento associado a um negócio” (hosted by), não “o evento acontece neste Place”.

### FUTURE BACKEND REPRESENTATION

Event com `location` (texto) + `business_id` nullable. Sem `place_id`.

### RATIONALE

O create e o detalhe já funcionam só com string. Obrigar `placeId` forçaria cadastro de Place para todo rolê informal — o produto não pede isso.

```text
DECISION: CLOSED
```

---

## 8. Offer × Business

### CURRENT IMPLEMENTATION

Create recusa oferta sem `businessId`. UI: “Cadastre um negócio antes…” + select de overlay UGC **e** fixtures `getAllBusinesses()`. Se o id já está no overlay e **não** é `kind: business`, erro. Fixtures **sem** linha no overlay são aceitos. `ownerId` da oferta = identidade que publicou, **não** o business. Após salvar, navega para `/business/$businessId`.

### CANONICAL PRODUCT CONTRACT

```text
Offer.businessId = canonical Business relationship
```

- Toda oferta **pertence a um Business** (referência obrigatória).
- A oferta **não existe** sem Business.
- `businessId` é **referência de domínio**, não ownership da linha.
- **Owner/creator** = Identity que criou a oferta.
- **Editor/exclusão** = o owner (mesmo Identity). O Business referenciado não é ator operador neste contrato.
- No remoto, `businessId` aponta a **Business de domínio** (UGC). Fixtures mock **não** são PK remota — ofertas UGC contra mock só existem no demo.

### FUTURE BACKEND REPRESENTATION

Offer.business_id NOT NULL → Business.id. RLS: create/update/delete = owner da oferta. Leitura pública.

### RATIONALE

O fluxo de create e o detalhe já são “oferta de um negócio”. A frouxidão para mocks é limitação demo, não o contrato.

```text
DECISION: CLOSED
```

### Catalog ownership (os quatro)

| Entidade | owner | creator | editor | visibility | lifecycle |
| --- | --- | --- | --- | --- | --- |
| Business | Identity que publicou | = owner | owner | público | created (sem delete de produto) |
| Place | Identity que publicou | = owner | owner | público | created |
| Event | Identity que publicou | = owner | owner | público | created; tempo via startAt/endAt |
| Offer | Identity que publicou | = owner | owner | público | created; validade `validUntil` |

**Não confundir:** criador = proprietário **neste produto** (não há conta estabelecimento distinta). `Offer.businessId` não transfere ownership da oferta ao negócio.

```text
DECISION: CLOSED
```

---

## 9. Reservation

### CURRENT IMPLEMENTATION

Entidade própria. Customer = `userId`. Target = `resourceType` (`business`|`place`) + `resourceId` + snapshot `resourceName`. Slot: `date`, `time`, `partySize`. **Não há** mesa, profissional, serviço ou SKU. Create grava `status: confirmed`. Cancel pelo mesmo userId. UI lista Confirmada/Cancelada/Concluída/Solicitada; **completed** e **requested** nunca são escritos no create/cancel. Sem inbox de estabelecimento. `getBusinessById` / `mergeCatalogPlaces` só para achar o alvo.

### 3.1 Ator

| Papel | Contrato |
| --- | --- |
| **Customer** | Identity requester (`userId`) |
| **Target** | Business **ou** Place (o registro de catálogo / fixture) |
| **Resource** | **Não existe** no MVP. Não inventar mesa/serviço |

Não há ator “estabelecimento logado”. O owner do Business/Place UGC é um Identity de usuário, não um dashboard operador.

### 3.2 Quem confirma?

Auto-confirm do demo **não** é copiado como única verdade remota, mas também **não** se inventa operador.

**Contrato fechado:**

- Estado **inicial canônico:** `pending`.
- **Política de confirmação:** se o target **não** tem owner de domínio (fixture) **ou** o produto não expõe aceite do owner, a aplicação **pode** promover `pending → confirmed` na hora (política, não ausência de `pending`).
- Se o target UGC tem `ownerId` e no futuro houver aceite, esse owner confirma. **Isso é extensão compatível**, não um terceiro ator.
- Sem motor de disponibilidade externa (Modelo C rejeitado — não existe no produto).

Demo atual = política auto na escrita. Remoto = persiste `pending` como estado real; auto-confirm é regra de aplicação documentada para a geração sem operador.

### 3.3 Lifecycle

```text
pending → confirmed → cancelled
        → cancelled
```

- **Quem pede:** customer cria `pending` (demo: atalho visual confirmed).
- **Quem confirma:** política auto **ou** owner do target UGC (quando existir aceite).
- **Quem cancela:** customer (já existe); owner do target UGC pode cancelar no futuro sem novo estado.
- **`completed`:** **fora** da machine. Existe no enum/UI e **nunca** é setado. Não levar ao schema até haver ação de produto.

### 3.4 Ownership / campos necessários

```text
id
requester (userId)
resourceType (business | place)
resourceId
resourceName (snapshot de leitura)
date
time
partySize
status (pending | confirmed | cancelled)
createdAt
updatedAt   (conceitual; hoje só createdAt)
```

Sem mesa, sem payment, sem operador separado.

```text
DECISION: CLOSED
```

---

## 10. Group × Conversation

### CURRENT IMPLEMENTATION

`DemoGroup`: `id`, `name`, `creatorId`, `sourceConversationId`, `participants[{userId, status, invitedAt, respondedAt}]`. Create **sempre** gera id novo; o DM origem **não** é reutilizado (comentário explícito no código). Convites só para **connections**. UI: nome, sheet de convite, inbox “Convite para {name}”, aceite/recusa, `leaveDemoGroup` → `cancelled`. Lista de chat: só `accepted`. Mensagens usam `group.id` como `conversationId`.

**Não há:** foto de grupo, descrição, roles admin além do creator, permissões granulares, entidade Group fora do blob social.

### CANONICAL PRODUCT CONTRACT

**Opção A:**

```text
Conversation
 ├── name? / createdBy?
 ├── sourceConversationId? (spawn; DM não se muta em grupo)
 └── Participants[]  (status: pending | accepted | declined | cancelled)
```

Grupo **não** é entidade de domínio extra. É uma Conversation com **vários participants** + metadata (nome, criador, convite).

Comportamento específico que **cabe no participante / na conversa:**

- nome do grupo → `Conversation.name`
- creator → `createdBy` / primeiro participant accepted
- convite → `Participant.status = pending` (ainda sem ler mensagens)
- leave → `cancelled` / left
- “não reciclar o DM” → criar **outra** Conversation; guardar `sourceConversationId` opcional

Isso **não** justifica `Group └── Conversation └── Members`.

### FUTURE BACKEND REPRESENTATION

Uma coleção `conversations` (DM ou grupo distinguível por `name`/`createdBy` ou `kind: direct|group`) + `conversation_participants` com status. Sem tabela `groups`.

### RATIONALE

1H-6: participants explícitos; Group não é quarto grafo. Extra (nome, convite, não mutar DM) são atributos da conversa/membro. Opção B duplicaria membership.

```text
DECISION: CLOSED
```

---

## 11. Call Event

### CURRENT IMPLEMENTATION

Sessão em memória (`voice|video`, `outgoing|connected`, caller, callee, startedAt). Ao terminar: `sendLocalMessage` com **texto** (`Ligação de voz (demo) · encerrada|recusada|perdida`). `kind` da mensagem permanece texto padrão. Aparece **no thread**. Sem duração persistida, sem consulta fora do chat, sem WebRTC.

### CANONICAL PRODUCT CONTRACT

Chamada **não é conteúdo** composto pelo usuário. É um **evento** que o produto mostra **dentro do transcript**.

**Opção A (fechada), com estrutura:**

```text
Message.kind = call   (além de text|event|location|image|video|audio)
payload = { media, outcome, startedAt, endedAt?, callerId, calleeId }
```

Não é entidade/agregado separado (`conversation_events`). Não é WebRTC. Não é TEXT livre como fonte de verdade.

Critérios:

| Critério | Conclusão |
| --- | --- |
| É conteúdo? | Não |
| É evento? | Sim |
| Consulta separada? | Não no produto (só o thread) |
| Duração/status/participantes/início-fim | Cabem no payload do kind |
| WebRTC futuro | INFRA de sessão, **fora** deste registro |
| Histórico independente | Não existe UI de call log |

### FUTURE BACKEND REPRESENTATION

Mesma store de messages, kind `call`, payload estruturado. Cliente demo pode continuar mostrando a linha no fio. Sessão WebRTC **não** é esta linha.

### RATIONALE

A única superfície é o transcript. Separar agregado obrigaria join para o único read path. 1H-6 (“Call Event ≠ Message conteúdo ≠ WebRTC”) mantém-se: o kind `call` não é body de chat.

```text
DECISION: CLOSED
```

---

## 12. Carona × Connection

### CURRENT IMPLEMENTATION

`acceptCaronaRequest`: só o owner; `connectUser(requester, owner)` (cria Connection **sem** Connection Request se ainda não existir) + `conversationId` no request + `sendLocalMessage` com destino/horário/encontro. O par passa a aparecer na **lista de conexões** e no chat funcional.

Participação na carona **já** é `CaronaRequest` (`requested|accepted|rejected|cancelled`). Connection é **efeito colateral social**, não o registro da vaga.

### CANONICAL PRODUCT CONTRACT

**Opção A:**

```text
Ride Request accepted
  → Connection (se ainda não houver)
  → Conversation (DM dos dois)
```

- Participar de Carona Amiga **é** um ato social de confiança neste produto (domínio social, não dispatcher).
- O usuário **passa a ter** Connection permanente até um futuro unfriend (OPEN de produto residual, não desta decisão).
- Connection **já podia** existir sem Request (1H-6 / `connectUser`).
- **Ride Participation** continua sendo `CaronaRequest`, não a Connection.
- Não criar “chat operacional sem vínculo”: o produto não oferece essa opção.

### FUTURE BACKEND REPRESENTATION

No accept: upsert Connection do par + ensure Conversation + set `CaronaRequest.conversationId`. Não inferir vaga a partir do grafo.

### RATIONALE

Comportamento existente deliberado (`connectUser`, não só `ensureLocalConversation`). Intenção Connexy: Carona Amiga é social. Opção B (só Conversation) **mudaria** o significado já entregue (a pessoa entra em Conexões). O risco de misturar operacional/social aplica-se à **corrida/dispatcher**, já separado.

```text
DECISION: CLOSED
```

---

## 13. Decision Matrix

| Decisão | Resultado | Justificativa | Confiança | Bloqueia schema? |
| --- | --- | --- | --- | --- |
| Agora Privacy | **PUBLIC** (descoberta) | Sem campo; feed aberto | Alta | Não |
| FRIENDS vs CONNECTIONS | **FRIENDS ≡ CONNECTIONS**; enum conteúdo = PUBLIC / CONNECTIONS / PRIVATE | Sem grafo Friends; sem filtro distinto | Alta | Não |
| Catalog structure | **4 entidades** | Campos, rotas, FKs, reserva | Alta | Não |
| Business × Place | **Independentes**; sem 1—N; sem fusão | Telas e `resourceType` paralelos | Alta | Não |
| Event × Place | **Sem placeId**; location texto; businessId opcional hosted-by | Create só pede string Local | Alta | Não |
| Offer × Business | **businessId canônico obrigatório**; owner = criador | Create recusa sem negócio | Alta | Não |
| Reservation actor | **customer + target (business\|place)**; sem sub-recurso; sem operador separado | Código só tem isso | Alta | Não |
| Reservation confirmation | **pending inicial**; auto-confirm = política se não há aceite de owner | Demo não dita o estado; Modelo C inexistente | Alta | Não |
| Reservation lifecycle | **pending → confirmed → cancelled**; sem `completed` | completed nunca escrito | Alta | Não |
| Group | **Conversation + participants + name/createdBy/source**; sem entidade Group | Convite e nome cabem no membro/conversa | Alta | Não |
| Call Event | **Message kind `call` estruturado** | Só aparece no thread; ≠ WebRTC | Alta | Não |
| Carona → Connection | **Sim: accept cria Connection + Conversation** | `connectUser` deliberado; domínio social | Alta | Não |

---

## 14. Decisões fechadas

1. Identity ≠ Profile; userId = Identity; Profile 1:1 — **reconfirmado**.
2. Follow / Request / Connection — **reconfirmado**.
3. Participants explícitos; pin e lastReadAt no participante — **reconfirmado**.
4. Message = conteúdo; Call = kind `call` no transcript, não WebRTC.
5. Agora = público; Momento usa PUBLIC \| CONNECTIONS \| PRIVATE; FRIENDS não é nível.
6. Catálogo = Event, Place, Business, Offer (quatro).
7. Place ⟂ Business; endereços próprios.
8. Event.location texto; sem placeId.
9. Offer.businessId obrigatório; referência, não ownership da oferta.
10. Catalog owner = creator Identity; visibilidade pública.
11. Reservation: requester + target business/place; partySize+slot; pending/confirmed/cancelled.
12. Group não é entidade; é Conversation N-participantes.
13. Carona accept → Connection + Conversation; participação = CaronaRequest.
14. Trip/Dispatcher continuam fora deste contrato.
15. Mocks continuam fora do schema de domínio.

---

## 15. Open Decisions after 1H-7

**Nenhum blocker de domínio permanece entre as seis decisões desta fase.**

Itens **adiados**, explícitos, **não bloqueiam** desenhar o schema A+B + catálogo/reserva/carona:

| Item | Por que não bloqueia |
| --- | --- |
| Packing de campos privados do Profile (coluna vs tabela irmã) | Decisão de **schema** 1H-8, conceito já fechado |
| Unfriend / block | Feature ausente; Connection é par ativo; pode entrar depois |
| `gestureHandledAt` local vs remoto | UX de lista; não é entidade |
| Save polimórfico vs por tipo | Relação user×id; shape na 1H-8 |
| Seed/CMS dos MOCK_* e `people` | Não são tabelas de domínio |
| Aceite de reserva pelo owner UGC (UI) | Estado `pending` já cabe; política auto documentada |
| Presença ANONYMOUS | Fora de Agora/Momento |

Estes **não** voltam a `NOT_READY`. A 1H-8 não deve reabrir FRIENDS, CatalogItem polimórfico, Group table, Call WebRTC, nem Trip misturado com Carona.

---

## 16. Schema readiness

O contrato que o backend deverá representar:

```text
Identity (auth)
Profile (1:1 userId)
Follow
ConnectionRequest
Connection
Conversation + Participants (pin, lastReadAt, status de convite)
Message (kinds incl. call estruturado)
Reel + Like + Comment          [audience default PUBLIC]
Post/Moment                    [audience PUBLIC|CONNECTIONS|PRIVATE]
Business, Place, Event, Offer  [Offer.businessId NOT NULL]
Reservation                    [requester + business|place + pending|confirmed|cancelled]
CaronaOffer + CaronaRequest    [accept → Connection + Conversation]
```

Fora: Trip, Dispatcher, WebRTC, mocks, Storage buckets (desenho 1H-8), RLS SQL (desenho 1H-8).

**CONTRACT STATUS: READY_FOR_SCHEMA**

Significa: a 1H-8 pode **desenhar** o contrato remoto (ainda documento, ainda sem CREATE TABLE). **Não** significa implementar Supabase nesta fase.

---

## 17. Recomendação da próxima fase

Não criar schema nesta entrega.

Próxima fase apropriada:

> **1H-8 — Remote Schema Design / Supabase Contract**

Começar como **desenho/documentação** (tabelas hipotéticas, PKs, FKs, RLS em prosa, Storage, Realtime) alinhado a este contrato e ao 1H-6. Sem migrations até o desenho ser aceito.

Não iniciar 1H-8 aqui.

---

## Apêndice — Validação

Nenhum arquivo de produto alterado. Testes existentes não modificados.

| Check | Resultado |
| --- | --- |
| Testes unitários existentes (não-browser) | **326 pass / 0 fail / 1509 expect()** em 32 arquivos |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| Supabase / migrations novas | 0 |
| Network introduzida | 0 |
