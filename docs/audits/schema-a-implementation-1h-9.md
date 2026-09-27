# 1H-9 — Schema A SQL / Supabase Contract Implementation

- **Data:** 2026-09-25
- **Tipo:** implementação local do Schema A. Sem cutover. Sem Commerce B.
- **Contrato:** `docs/audits/remote-schema-contract-1h-8.md` (não modificado)
- **Ambiente:** Supabase **local** (`127.0.0.1`, stack reduzida já em execução). **Não** houve push/link/SQL no projeto remoto.
- **Arquivos de produto (`src/`) alterados:** 0
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**
- **CUTOVER:** **NOT STARTED**

Nenhuma tela, store, repository local, rota ou `getDemoIdentity()` foi alterada.

---

## 1. Objetivo

Transformar o contrato 1H-8 em SQL versionado (tabelas, PKs, FKs, constraints, índices, timestamps), mapeamento Auth → Profile, e RLS. O MVP local continua sendo a fonte de verdade da UI.

---

## 2. Auditoria pré-implementação

### Ambiente

| Item | Resultado |
| --- | --- |
| Destino | **Local apenas** (`supabase_db_*` em `127.0.0.1:54322`) |
| Remoto | **não tocado** (AGENTS.md) |
| `db reset` | **não** |
| Stack | já ligada (43h); serviços excluídos (realtime container, studio, mailpit, …) **parados** |
| Rede | `connexy-supabase-local` |
| Migrations locais aplicadas antes | 9 (até `20260821000000`) |
| Arquivos de migration pendentes (já no repo, não criados aqui) | `20260825025605`, `20260825025843`, `20260826000000` — aplicados no catch-up **sem reset** |

### Schema legado (conflito com 1H-8)

Já existiam `profiles`, `places`, `reels`, `reel_likes`, `reel_comments`, `connection_requests`, `connections`, `conversations`, `conversation_participants`, `messages`, mais `bio_posts`, `blocked_users`, `user_locations`, `user_presence`.

1H-8 **prevalece**. A migration **não copiou** `types.ts` / `ChatRepository`. Evoluiu as tabelas de nome coincidente e **criou** as ausentes. Tabelas fora do A **não foram apagadas** (proibição de reset/destruição).

Seed de `places` (4 linhas sem owner) **não foi deletado**.

---

## 3. Migration criada

```text
supabase/migrations/20260925030806_schema_a_core.sql
```

Aplicada em: **local**. Não aplicada em produção/remoto.

Catch-up (arquivos já existentes): policies de storage + `messages` na publication `supabase_realtime`. 1H-9 **não** adicionou tabelas novas ao Realtime.

---

## 4. Tabelas Schema A

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

**20/20.** RLS ligado em todas.

**Não criadas (Schema B / futuro):** products, services, orders, order_items, payments, cart, delivery, inventory, product_variants, commission, ticketing, staff, catalog_items, groups, call_sessions, trips.

**Legado permanece (fora do A):** `bio_posts`, `blocked_users`, `user_locations`, `user_presence`.

---

## 5. Auth mapping

```text
auth.users
  └── profiles.id = auth.users.id   (FK ON DELETE RESTRICT)
        └── profile_private.user_id  (1:1)
```

Trigger `handle_new_user` (pós-signup):

- insere `profiles` (name + handle derivado do uuid, sem usar `user_metadata` para autorização);
- insere `profile_private` vazio.

Perfis locais pré-existentes (2) receberam linha em `profile_private`.

**Frontend:** `getDemoIdentity()` **não** foi substituído.

---

## 6. PK / FK / constraints / índices

Conforme 1H-8:

- UUID PKs (inclusive `reel_likes.id` e `conversation_participants.id`; unique composto mantido).
- `follows`: not self + unique par.
- `connection_requests`: `from_user_id` / `to_user_id`, unique par direcional, status `pending|accepted|declined`.
- `connections`: `user_a_id < user_b_id`, unique par, `conversation_id` **opcional**.
- Conversation **não** exige `connection_id` (coluna legado removida). Aceite de request **não** cria Conversation no banco.
- `conversation_participants`: `pinned`, `last_read_at`, `gesture_handled_at`, `status` de convite.
- `messages.kind` inclui `call`; coluna `text`; `payload` jsonb; **sem** `is_unread`.
- `posts.privacy` ∈ `PUBLIC|CONNECTIONS|PRIVATE`.
- `offers.business_id` NOT NULL → businesses RESTRICT.
- `reservations`: XOR business/place, party 1–20, status `pending|confirmed|cancelled`, default `pending`.
- `carona_requests`: unique (offer, requester); trigger bloqueia requester = owner.
- `saves`: unique (user, type, id); types `business|place|event|offer|reel|post`.
- FKs Schema A → profiles: **RESTRICT**.
- Índices do §9 do 1H-8 (handle `lower()`, inbox, feeds, FKs).

---

## 7. RLS

Policies por tabela seguem a matriz 1H-8 (SELECT/INSERT/UPDATE/DELETE). Pontos-chave:

- `auth.uid()` envolvido em `(select auth.uid())`.
- Helpers `security definer` em schema `private` (não no contrato de domínio; infra de RLS).
- Chat: mensagens só com participante `accepted`.
- Catálogo/Agora/posts: **authenticated**, não `USING (true)` anon.
- `profile_private` / `saves`: owner-only.
- Reservas: customer **ou** owner do business/place alvo.
- Sem policy permissiva em dado privado.

**Nota de implementação (não altera 1H-8):** SELECT de `conversations` permite qualquer membership (incl. `pending`) para o inbox de convite; leitura de `messages` continua `accepted`-only.

---

## 8. Storage

**Nenhum bucket novo.** 1H-8 lista buckets como contrato futuro, não desta etapa.

Buckets legado que **já existiam:** `avatars`, `bio-media`, `reels-media`. Não removidos.

---

## 9. Realtime

**Não habilitado por esta fase** para tabelas novas.

Publication pré-existente: `user_presence`, `messages` (este último via migration antiga aplicada no catch-up). Sem channels/broadcast novos.

---

## 10. Testes de banco

Arquivo: `tests/schema-a-1h-9.sql` (transação + rollback).

| Classe | Resultado |
| --- | --- |
| 20 tabelas A presentes | pass |
| Tabelas B ausentes | pass |
| Self-follow / follow duplicado | pass |
| Connection invertida | pass |
| Offer sem Business | pass |
| Reservation XOR / party_size | pass |
| Message kind `call` | pass |
| Save isolado user A vs B | pass |
| Pending participant não lê messages | pass |
| Accepted lê messages | pass |
| Anon sem privilegio em privado | pass |
| Carona owner não pede a própria offer | pass |
| `supabase db advisors --local` (security) | no issues |

---

## 11. Divergências do 1H-8 (documentadas, contrato preservado)

Não se alterou o 1H-8. O SQL evolui o legado **em direção** ao contrato:

| Ponto | Tratamento |
| --- | --- |
| Colunas legado em `profiles` (`headline`, `mood_*`, `vibe_tags`, `looks_for`) | **mantidas**; não fazem parte do A |
| `places.owner_id` NULL nas 4 seeds | **nullable** de propósito; INSERT autenticado exige owner = uid |
| Colunas legado em `reels` / `messages` | **mantidas** além do contrato (place_id, media_path, …) |
| Enums PG antigos | colunas convertidas para `text` + CHECK; tipos enum órfãos podem restar |
| RPCs 13B1 (`send_connection_request`, `remove_connection`, nearby, block) | **atualizados** para novos nomes de coluna; `respond_to_connection_request` **não** cria Conversation |
| `remove_connection` security definer | ainda apaga Connection (legado); DELETE via RLS da tabela continua **DEFERRED** |
| `types.ts` gerado | **não regenerado** (cutover não iniciado; 1H-5: não copiar) |
| SELECT conversation vs pending | ver §7 |

Nenhuma divergência silenciosa de domínio (Offer→Business, Follow≠Request≠Connection, pin no participante, Event≠Ticket, Reservation≠Order).

---

## 12. Blockers

**Nenhum IMPLEMENTATION BLOCKER** para o Schema A.

Saves estavam suficientemente definidos no 1H-8 (owner, unique, types, sem FK polimórfica) — implementados.

---

## 13. Não implementado / DEFERRED

Payment, Cart, Delivery, Inventory, Variant, Commission, Ticket, Staff, Schema B, buckets 1H-8 (`post-media`, `catalog-covers`, `chat-attachments`), Realtime de produto, cutover, unfriend, política de confirmação de reserva, privacy extra de Agora, delete de conta.

---

## 14. Demo / rede

`VITE_APP_DEMO_MODE` e persistência local **intactos**. O produto demo **não** passou a chamar o PostgREST. Validação SQL usou o Postgres local via CLI/docker, não o app.

---

## 15. Recomendação da próxima fase

**1H-10 — Schema A generated types (sem cutover)**

Regenerar tipos a partir do schema local, **sem** ligar repositories da UI, **sem** substituir localStorage/IndexedDB, **sem** Schema B.

Não iniciar 1H-10 nesta entrega.

---

## Validação de projeto

| Check | Resultado |
| --- | --- |
| `src/` alterado | 0 |
| 1H-8 | intacto |
| SQL schema tests | pass |
| Testes unitários (não-browser) | **346 pass / 0 fail / 2087 expect()** |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| `bun run lint` | FAIL (504 problemas pré-existentes em `src/`/`tests/` de fases anteriores; nenhum arquivo de produto desta fase) |
