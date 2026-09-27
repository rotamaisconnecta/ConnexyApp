# 1H-13 — Cutover Plan Documental / Local Demo → Schema A

- **Data:** 2026-09-25
- **Tipo:** plano documental. Sem implementação.
- **Herdado (não reaberto):** 1H-8 contrato, 1H-9 SQL/RLS, 1H-10 tipos, 1H-11 remote repositories, 1H-12 adapters.
- **STATUS:** **PASS**
- **CUTOVER:** **NOT STARTED**
- **DEMO MVP:** **INTACT**
- **DUAL-WRITE / SYNC:** **não** fazem parte deste plano nem das fases seguintes propostas.

Arquivos de produto, Schema A, migrations, RLS, repositories, adapters, UI e `getDemoIdentity()` **não** foram alterados nesta fase.

---

## 0. Princípio

O cutover é **troca de fonte de verdade por domínio**, na ordem das FKs, atrás de gates objetivos.

```text
LOCAL / DEMO          ADAPTER 1H-12         REMOTE 1H-11         UI
localStorage/IDB  →   tradução explícita →  Schema A + Auth  →  telas
getDemoIdentity()                           auth.uid() UUID
```

Não há período em que as duas persistências sejam escritas juntas. Não há sync automático. Dados demo que não são UUID **não** entram no Postgres.

O grafo demo (`lucas`, `beatriz`, `demo-direct-*`, `business-${Date.now()}`) **não é migrado**. Após Auth, o utilizador começa um grafo Schema A vazio (salvo o `profiles` / `profile_private` criados pelo trigger `handle_new_user`). Campos públicos editáveis do onboarding podem ser **copiados uma vez** (name, handle, bio, interesses, visibility, locale) via adapter — nunca o `id` demo.

---

## 1. Pré-requisitos

| Pré-requisito | Estado 1H-13 | Falta para cutover |
| --- | --- | --- |
| Schema A (20 tabelas) | **PRONTO** (1H-9, Postgres **local**) | aplicar as mesmas migrations **só** com autorização explícita no destino de produto |
| RLS | **PRONTO** (validado 1H-9 SQL + 1H-11 live) | revalidar no destino de produto; anon continua sem dado privado |
| Generated types | **PRONTO** (`schema-a.generated.ts`) | substituir `src/integrations/supabase/types.ts` **junto** com a reescrita dos stubs da UI (1H-10) |
| Remote repositories | **PRONTO** (1H-11, invocação explícita) | `SchemaAClient` com sessão persistida no browser; hoje testes usam `persistSession: false` |
| Adapters | **PRONTO** (1H-12) | a UI ainda não os chama |
| Auth real | **INFRA local** (GoTrue + trigger `handle_new_user`) | **não** há signup/login de produto; `getDemoIdentity()` continua a SoT da UI |
| Identidade UUID | **CONTRATO** (`profiles.id` = `auth.users.id`) | UI não obtém `auth.uid()`; ids demo não são UUID |
| Profile / `profile_private` | **PRONTO** (tabelas + repos + adapter split) | onboarding remoto não ligado |
| Storage | **CONTRATO 1H-8**; 1H-9 **não** criou buckets novos | **bloqueia** cutover de foto/capa, posts com ficheiro, Agora `video_url` |
| Client UI Schema A | **AUSENTE** | `client.ts` da UI tipa o esqueleto de 6 tabelas; `isPublicSupabaseConfigured()` é `false` em demo |
| Stubs legado | **NÃO REUTILIZAR** | `ChatRepository`, RPCs 13B1, `types.ts` — cutover usa 1H-11, não os stubs |
| Feature flag por domínio | **AUSENTE** | necessário para ligar um domínio sem os outros |
| Destino remoto de produto | **NÃO AUTORIZADO** (AGENTS.md) | stack atual = `127.0.0.1` / `connexy-supabase-local` |

**Dependências ainda em falta (não corrigidas aqui):**

1. Auth de produto (sessão JWT na UI) sem substituir o switcher demo enquanto `VITE_APP_DEMO_MODE=true`.
2. Storage buckets do contrato 1H-8 + upload (sem data URL no banco).
3. Cliente browser Schema A (`createSchemaAClient` + persistência de sessão) no lugar do Proxy legado, **sem** adaptar `ChatRepository`.
4. Flag de cutover por domínio (default: local).
5. Autorização para o Postgres de produto (hoje só local).
6. Preview de inbox: `last_message_*` só o `created_by` pode UPDATE (limitação 1H-11) — gate de Conversas.
7. Saves: ids locais sem `target_type` — não há import honesto do array `saved-details`.

Não-faltas (já fechadas): Follow ≠ Request ≠ Connection; Connection não cria Conversation; pin/`last_read_at` no participante; Offer → Business; Reservation `pending`; Carona ≠ Trip.

---

## 2. Ordem de migração por domínio

Ordem = dependência de FK / Auth, não importância de produto.

```text
1. Identity / Profile
2. Social
3. Conversations / Messages
4. Content / Agora
5. Catalog
6. Reservations
7. Carona
8. Saves
```

| # | Domínio | Depende de | Porquê esta posição |
| --- | --- | --- | --- |
| 1 | Identity / Profile | Auth | Toda FK de utilizador aponta a `profiles.id` |
| 2 | Social | 1 | `follows` / requests / `connections` → dois profiles |
| 3 | Conversations / Messages | 1 (2 desejável) | participantes = identities; Connection **não** cria DM (1H-8); DM é passo de aplicação **depois** do grafo existir |
| 4 | Content / Agora | 1 + Storage | `author_id`; mídia não é data URL |
| 5 | Catalog | 1 | `owner_id`; Offer exige Business já remoto |
| 6 | Reservations | 1 + 5 | XOR `business_id` / `place_id` UUID |
| 7 | Carona | 1; 2+3 opcional | offer/request autónomos; Connection+DM no accept = **DEFERRED** (1H-8/1H-12) |
| 8 | Saves | 1 + alvos 4/5 | `target_type` + `target_id` UUID já persistidos |

Não inverter Catalog e Reservations. Não inverter Identity e qualquer outro. Não cortar Saves antes dos alvos.

---

## 3. Fonte de verdade por etapa

Regra: **uma** SoT de leitura na UI por domínio. A SoT só muda quando o gate da etapa passa. Local permanece instalado para rollback até o Gate Regression global.

| Domínio | Hoje | Transição | SoT após cutover | Condição objetiva para mudar |
| --- | --- | --- | --- | --- |
| Identity | Local (`getDemoIdentity`) | **sem** overlap: sessão Auth **ou** demo, nunca os dois ids na mesma request | `auth.uid()` | Gate Auth + Gate Identity |
| Profile | Local blob `own-profile` | opcional: **uma** escrita adapter→remote no primeiro login; depois só remote | `profiles` + `profile_private` | row `profiles.id = uid` e private visível só ao owner |
| Social | Local `connexy:demo:db` | grafo demo **descartado** (ids inválidos); remote começa vazio | três tabelas A | Gate RLS: terceiro não lê request; accept **sem** conversation |
| Conversations | IndexedDB + demo-db groups | threads `demo-direct-*` **não** importados | `conversations` + participants + `messages` | participante `accepted` lê mensagens; outsider `[]`; pin isolado |
| Content / Agora | posts LS + IDB reels + media DB | data URLs **não** sobem; UGC novo só com Storage URL | `posts` / `reels` + likes/comments | privacy PRIVATE oculta; like/comment owner-only delete |
| Catalog | `connexy:demo:catalog` + MOCK overlay | MOCK_* **não** entram; UGC com id não-UUID **não** entra | 4 tabelas | Offer sem business falha FK; Business ≠ Place |
| Reservations | LS; create já `confirmed` | novos inserts remotos = `pending` | `reservations` | status inicial `pending`; outsider não vê |
| Carona | LS | sem GPS/Trip; accept **não** orquestra DM | `carona_offers` / `_requests` | owner não pede a própria offer |
| Saves | array untyped | **sem** import do array; só saves novos com tipo | `saves` | owner-only; tipo ∈ contrato |

**Não existe** “período de dual-write”. Transição = janela em que o domínio ainda é local **enquanto** o anterior já é remote. A UI de um domínio não mistura stores.

---

## 4. Estratégia de dados

### 4.1 IDs demo ≠ UUID

Recusar como PK/FK (`requireSchemaAUuid`, 1H-12). Não gerar UUID determinístico a partir de `lucas` (colidiria entre ambientes e mentiria a identidade).

Import permitido **somente** se o id local já for UUID **e** o utilizador autenticado for o owner. Caso contrário: deixar no dispositivo e não copiar.

### 4.2 `getDemoIdentity()` → Supabase Auth

Não é rename. São contextos distintos (1H-8, 1H-11, 1H-12).

- Demo: switcher `lucas` / `people[]`. **Não migra.**
- Remoto: signup/login GoTrue → `handle_new_user` cria profile.
- Enquanto `VITE_APP_DEMO_MODE=true`, a UI **não** chama Auth (gate Network = 0).
- Cutover de Identity = a UI deixa de ler `getDemoIdentity()` **naquele build/flag**, não apagar a função do repositório até o Gate Regression.

### 4.3 Dados locais existentes

| Destino | Tratamento |
| --- | --- |
| Grafo social / DMs demo | **abandonar** (ids ilegais) |
| Blob de perfil do user autenticado | **copy-once** dos campos públicos+privados mapeados; não o JSON inteiro |
| Posts/reels com data URL | **não** copiar para colunas de URL; re-upload via Storage numa fase posterior |
| Catálogo UGC `event-${Date.now()}-…` | **não** copiar |
| Reservas `confirmed` de política demo | **não** copiar como `confirmed`; se um dia houver import UUID, forçar `pending` |
| `saved-details` | **não** copiar |
| IndexedDB chat | **não** copiar threads `demo-direct-*` |

Local **não se apaga** no cutover (rollback).

### 4.4 Sem equivalente remoto

`DemoRequest.message`, `Reservation.completed`, `PostPrivacy.FRIENDS` (colapsa para CONNECTIONS se alguém publicar de novo), `senderName`, likes de comentário, `persistence` do reel. Adapter já recusa ou descarta (1H-12). Cutover não inventa colunas.

### 4.5 Derivados

Continuar a calcular na UI: unread, `from` me/them, age a partir de `birth_date` se o cache for null, Event UPCOMING, `pinnedByUserIds` a partir de participantes. **Não** gravar `message.isUnread`.

### 4.6 Mocks

`MOCK_REELS`, `MOCK_BUSINESSES`, `people`, `currentUser`, `mock-conversations` — **conteúdo editorial**, não rows. Fora do cutover de dados.

### 4.7 Blobs / mídia

IndexedDB de reels e data URLs de posts/perfil ficam no dispositivo até existir Storage (pré-requisito em falta). Paths relativos nas colunas, RLS de objeto = owner (contrato 1H-8).

### 4.8 Incompatibilidades 1H-12 (reafirmadas)

Não resolver no cutover via schema:

- saves sem tipo
- `connection_requests.message` ausente no SQL 1H-9
- `last_message_*` só atualizável pelo criador
- INSERT conversation + RETURNING (já contornado no repository 1H-11; UI futura deve usar esse repository, não PostgREST cru)

---

## 5. O que **não** deve ser migrado

```text
MOCK_* / people / currentUser / mock-conversations
places seed sem owner (4 linhas 1H-9) como “meus locais”
disponibilidade / rating / horário fictício de vitrine
unreadCount, isOnline, proximityMeters, threadIcon
auto-confirm de reserva
identity switcher / connexy:demo:auth flag "1"
data URLs, from: me|them, pinnedByUserIds[]
demo-call overlay / WebRTC
Trip / Dispatcher / ride_blocks / GPS
outing-invites, reviews, roles, presence como produto A
2FA / cartão demo (settings)
Product, Service, Order, OrderItem, Payment, Cart, Delivery, Inventory
bio_posts, catalog_items, groups-as-table, call_sessions, tickets, staff
ChatRepository / RPCs 13B1 como caminho de escrita
qualquer id que falhe isSchemaAUuid
```

---

## 6. Cutover por domínio

Padrão único:

```text
LOCAL → ADAPTER → REMOTE REPOSITORY → UI lê REMOTE
```

Critério de “domínio concluído”: a tela desse domínio **não** lê a chave demo correspondente; testes do domínio passam com JWT; rollback da flag restaura o local **sem** ter apagado o LS/IDB.

### 6.1 Identity / Profile

- Auth session válida; `profiles.id = uid`; `profile_private` 1:1.
- UI Perfil/onboarding usa `RemoteProfileRepository` + adapter split.
- **Concluído quando:** handle/name persistidos após reload **remoto**; outro user não lê private; `getDemoIdentity()` não é consultado nessa superfície.

### 6.2 Social

- Follow / request / connect via `RemoteSocialRepository`. Accept **não** abre DM.
- **Concluído quando:** três tabelas distintas na UI; terceiro isolado; nenhum `demo-direct-*`.

### 6.3 Conversations / Messages

- `createDirect` do 1H-11 (UUID cliente + participantes depois INSERT).
- Pin / `last_read_at` no participante; unread derivado.
- **Concluído quando:** outsider não lista mensagens; pin de A ≠ pin de B; nenhuma coluna `is_unread`.
- **Bloqueio parcial:** preview `last_message_*` stale se o peer envia — documentado; corrigir em fase de chat (policy/RPC), não nesta.

### 6.4 Content / Agora

- Posts com privacy A; reels só com `video_url` de Storage.
- **Concluído quando:** PRIVATE oculto a não-autor; like/comment persistidos; `MOCK_REELS` não é SoT.
- **Bloqueio:** Storage.

### 6.5 Catalog

- Quatro entidades; Offer com `business_id` UUID.
- **Concluído quando:** criar negócio/lugar/evento/oferta sobrevive reload remoto; MOCK overlay não grava no A.

### 6.6 Reservations

- Insert `pending`; XOR resource; party 1–20.
- **Concluído quando:** UI mostra `pending` em reserva nova (não auto-confirm); owner do alvo ainda vê.

### 6.7 Carona

- Offer/request apenas. Sem orquestração Connection+DM.
- **Concluído quando:** pedido do owner é recusado; accept decrementa assentos / `full`.

### 6.8 Saves

- Só pares `(type, id)` do contrato.
- **Concluído quando:** lista remota owner-only; array `saved-details` não é SoT.

---

## 7. Rollback

Sem implementação nesta fase. Contrato operacional:

1. **Flag por domínio** volta a `local`. A UI deixa de instanciar o remote repository desse domínio.
2. **Não apagar** `connexy:demo:*` nem IndexedDB durante o cutover.
3. Auth: logout da sessão Schema A; demo volta a `getDemoIdentity()` se o modo demo estiver ligado.
4. Dados já escritos no Postgres **permanecem** (não há `db reset`; AGENTS.md). Rollback de produto ≠ wipe.
5. Se Auth falhar a meio: abortar **antes** de Social; Profile remoto órfão é o par trigger (aceitável; user reentra).
6. Se Conversas falhar: Social pode ficar remote (não há FK obrigatória conversation←connection).
7. Se Catalog falhar: não avançar Reservations/Saves desses alvos.
8. Demo global: `VITE_APP_DEMO_MODE=true` + `isPublicSupabaseConfigured() === false` ⇒ `networkCalls = 0` (estado atual). Rollback total = esse par.

Não propor dual-write “para facilitar o rollback”.

---

## 8. Gates

Todos devem ser **binários**. Falha = não avançar a ordem do §2.

| Gate | Passa quando | Falha se |
| --- | --- | --- |
| **Auth** | `client.auth.getUser()` devolve UUID; JWT nas chamadas; demo mode **não** autentica | switcher demo usado como uid; sessão Proxy `types.ts` |
| **Identity** | `profiles.id = uid`; adapter recusa `lucas`; contextos demo ≠ auth | PK demo; blob inteiro de perfil enviado |
| **Data** | só UUIDs e campos mapeados 1H-12; mocks e derivados fora | import `saved-details`, `MOCK_*`, data URL como `video_url` |
| **RLS** | matriz 1H-9/1H-11 reproduzida no destino: private, request, messages accepted-only, saves owner, reservation XOR | SELECT permissivo; anon em privado |
| **Repository** | UI fala só com `src/integrations/supabase/remote/*` + adapters; **não** ChatRepository / RPCs 13B1 | stub legado na escrita |
| **UI** | superfície do domínio sem import de store demo; rotas inalteradas em forma, só data source | cutover “global” de todas as telas de uma vez |
| **Regression** | suite local ≥ baseline; fluxos do domínio anterior ainda PASS; demo flag-off/on | regressão em domínio já cortado |
| **Network** | demo `VITE_APP_DEMO_MODE=true` ⇒ **0** chamadas de app; cutover de um domínio ⇒ só esse domínio gera fetch Schema A | fetch em demo; fallback silencioso remote→local |

Gate Network do **demo** permanece 0 até o modo demo ser desligado de propósito. Cutover ≠ ligar rede no MVP demo atual.

---

## 9. Blockers documentados (não corrigidos)

| # | Blocker | Impacto | Fase que deve tratar |
| --- | --- | --- | --- |
| B1 | Auth de produto / sessão UI ausentes | nenhum domínio pode mudar SoT | 1H-14 |
| B2 | Storage buckets do 1H-8 não criados | Profile foto/capa, Post media, Agora | 1H-15 |
| B3 | `types.ts` + client UI legado | ligar UI hoje quebra tsc (1H-10) | 1H-16 (junto com stubs) |
| B4 | Schema A só no Postgres local | cutover de **produto** remoto não autorizado | operacional / AGENTS.md, não código |
| B5 | `last_message_*` RLS creator-only | inbox preview incompleto no chat remote | fase Conversas |
| B6 | Saves locais sem `target_type` | impossível import honesto | aceitar SoT vazia no cutover Saves |
| B7 | Flag por domínio inexistente | risco de cutover total acidental | 1H-14/16 |

Não são blockers de **contrato**: Carona→DM (DEFERRED), `request.message` (ausente no SQL), Schema B, unfriend, delete de mensagem.

---

## 10. Ordem das próximas fases (não iniciar)

Não implementar abaixo. Cada fase deve recusar dual-write, sync e cutover fora do domínio da fase.

| Fase | Conteúdo | Não fazer |
| --- | --- | --- |
| **1H-14** | Auth de produto (signup/login/session) atrás de flag; **demo intacto** | substituir `getDemoIdentity()` no demo; ligar outras telas |
| **1H-15** | Storage buckets do contrato 1H-8 + RLS de objeto + upload mínimo | migrar data URLs em massa |
| **1H-16** | Cliente UI Schema A: substituir `types.ts` **com** reescrita/isolamento dos stubs (`ChatRepository` fora do caminho) | adaptar stubs ao dump |
| **1H-17** | Cutover **Profile** (flag): LOCAL→ADAPTER→REMOTE→UI Perfil | social/chat |
| **1H-18** | Cutover **Social** | criar Conversation no accept |
| **1H-19** | Cutover **Conversas/Mensagens** (+ decisão B5) | WebRTC; `is_unread` |
| **1H-20** | Cutover **Posts + Agora** (depende 1H-15) | MOCK_REELS |
| **1H-21** | Cutover **Catalog** | Product/Service |
| **1H-22** | Cutover **Reservations** | auto-confirm; Order |
| **1H-23** | Cutover **Carona** | Trip/Dispatcher; orquestração DM se ainda DEFERRED |
| **1H-24** | Cutover **Saves** | import untyped |
| **1H-25** | Desligar demo no build de produto; Gate Network deixa de ser 0 | apagar localStorage no mesmo passo |

Schema B (Payment/Order/Delivery) **depois** do A estável, fora desta sequência.

---

## 11. Validação desta fase

Somente prova de que o plano **não** exigiu alterações de código:

- produto / Schema A / repos / adapters / UI: **não tocados**
- demo: continua SoT local
- networkCalls demo: **0** (nenhuma tela nova)

| Check | Resultado |
| --- | --- |
| `bun test` | **379 pass / 0 fail / 2348 expect()** |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |

---

## 12. O que este documento não é

Não é autorização para `supabase link`, migration remota, dual-write, sync, cutover de UI, Schema B, Auth implementado, nem commit/push.
