# 1H-10 — Schema A Generated Types

- **Data:** 2026-09-25
- **Tipo:** geração de tipos TypeScript a partir do Postgres local da 1H-9.
- **Contrato de domínio:** 1H-6 / 1H-7C / 1H-8 — **não** substituídos.
- **Migrations / RLS:** **UNCHANGED**
- **Cutover:** **NOT STARTED**
- **Produto (`src/` aplicação):** **0 arquivos alterados**
- **STATUS:** **PASS**

Os tipos gerados são representação técnica do banco. Não são fonte de verdade do domínio.

---

## 1. Como os tipos eram gerados

| Item | Estado |
| --- | --- |
| Arquivo oficial (Lovable / cliente vivo) | `src/integrations/supabase/types.ts` |
| Conteúdo anterior | 6 tabelas (`bio_posts`, `places`, `profiles`, `reels`, `reel_likes`, `reel_comments`) + `PostgREST 14.5` |
| Script npm | **nenhum** (`package.json` não tem `gen types`) |
| Consumidores | `src/lib/supabase/{client,database,rpc,server.server}.ts`, `src/types/database/*`, stubs (`ChatRepository`, `chat.service`, bio) |
| `ChatRepository` | **não** usado no demo; **não** adaptado nesta fase |

---

## 2. Comando (Postgres local 1H-9)

```text
npx supabase gen types typescript --local --schema public --network-id connexy-supabase-local
```

- `--linked` / remoto: **não**
- Resultado CLI copiado **sem edição manual** para:

```text
supabase/schema-a.generated.ts
```

`--local` sozinho falhou (rede Docker `supabase_network_*` inexistente). A stack local usa `connexy-supabase-local`. Isso é configuração de CLI, não mudança de schema.

Tentativa `--schema public --schema auth`: gera tabelas internas do GoTrue (`audit_log_entries`, sessions, …). **Não** foi adotada — não é Schema A.

---

## 3. Por que `types.ts` não foi substituído

Substituição do arquivo oficial **foi tentada** e revertida.

`bunx tsc --noEmit` passou a falhar em código vivo que importa `Database`:

- `src/components/bio/bio-personal-data.tsx` — `string | null` vs `string | undefined`
- `src/services/chat.service.ts` — propriedade `content` inexistente (coluna agora é `text`)

Isso seria **ligar os tipos à aplicação**. A fase proíbe adaptar `ChatRepository` / UI para caber. O arquivo oficial permanece o esqueleto legado. O artefato 1H-10 não tem importadores.

---

## 4. Schema A — 20/20

Presentes em `supabase/schema-a.generated.ts`:

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

### Coerência (amostra vs 1H-8 / SQL 1H-9)

| Tabela | PK / relações / notas |
| --- | --- |
| `profiles` | `id`, `handle`, `name` required; `visibility` Json; `locale`/`cover_url`/`city`; colunas legado (`headline`, `vibe_tags`, …) |
| `profile_private` | PK `user_id` 1:1 → `profiles` |
| `follows` | `follower_id`, `followee_id` → `profiles` |
| `connection_requests` | `from_user_id`, `to_user_id`, `status: string` |
| `connections` | `user_a_id`, `user_b_id`, `conversation_id` nullable |
| `conversations` | `kind`, `created_by`, `source_conversation_id` nullable; **sem** `connection_id` |
| `conversation_participants` | `id`, `pinned`, `last_read_at`, `status`, `gesture_handled_at` |
| `messages` | `sender_id`, `kind`, `text`, `payload`; **sem** `is_unread` |
| `posts` | `privacy: string` |
| `reels` / likes / comments | `parent_id`, `sibling_order`; like com `id` |
| `offers` | `business_id` required → `businesses` |
| `reservations` | XOR colunas `business_id`/`place_id` nullable; `slot_date`/`slot_time`; `status: string` |
| `saves` | `target_type`, `target_id`; FK só `user_id` (polimórfico) |

`profiles.Relationships` **não** lista `auth.users` porque o dump é só `public`. O mapeamento continua no SQL (`profiles.id` → `auth.users.id`).

CHECks de domínio (`pending\|confirmed`, kinds) aparecem como `string`, não como union TS — limite do gerador, não do contrato.

---

## 5. Legado no dump (banco real)

```text
bio_posts
blocked_users
user_locations
user_presence
```

Também: `Functions` 13B1 (`are_connected`, `get_direct_conversation`, …) e `Enums` órfãos PG (`connection_request_status`, `conversation_kind`, `message_kind` com valores antigos). Colunas de domínio já são `text`. **Não apagados.**

---

## 6. Diferenças vs `src/integrations/supabase/types.ts` (oficial legado)

O arquivo vivo **não** reflete o Schema A. Continua o esqueleto de 6 tabelas. Isso é deliberado até a fase de repositories remotos.

---

## 7. Tooling extra

`eslint.config.js`: ignore de `supabase/schema-a.generated.ts`. O dump da CLI não passa no Prettier; editar o arquivo gerado é proibido. Sem o ignore, o lint saltava de 504 para 1591 problemas.

---

## 8. Impacto no produto

- UI, rotas, stores, localStorage, IndexedDB, `getDemoIdentity()`: **intactos**
- Nenhum repository remoto criado
- Nenhuma chamada de rede no demo
- `types.ts` revertido ao estado pré-fase

---

## Validação

| Check | Resultado |
| --- | --- |
| Schema A no dump | **20/20** |
| Migrations / RLS | inalterados |
| `bun test` | **346 pass / 0 fail / 2087 expect()** |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| `bun run lint` | FAIL **504** (484 errors, 20 warnings) — **igual à 1H-9**; gerado ignorado |

---

## Próxima fase recomendada

**1H-11 — Remote repositories (Schema A), ainda sem cutover do demo**

Importar `supabase/schema-a.generated.ts` (ou então substituir `types.ts` **junto** com a reescrita dos stubs). Não ligar a UI.

Não iniciar 1H-11 nesta entrega.
