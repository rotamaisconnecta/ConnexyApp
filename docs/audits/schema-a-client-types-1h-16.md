# 1H-16 — Schema A Client e Tipagem

- **Data:** 2026-09-25
- **Tipo:** coexistência de tipagem. Sem cutover de UI.
- **Herdado:** 1H-8 contrato, 1H-9 SQL, 1H-10 dump, 1H-11 repos, 1H-12 adapters, 1H-13 plano, 1H-14 Auth, 1H-15 Storage.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**
- **CUTOVER:** **NOT STARTED**
- **SUBSTITUIÇÃO DE `types.ts`:** **NÃO FEITA** (bloqueio documentado)

Schema A SQL, migrations, RLS, Auth, Storage, adapters de domínio, `getDemoIdentity()`, chat/catálogo/Agora locais **não** foram alterados.

---

## 1. Decisão

```text
Schema A  →  schema-a.generated.ts  →  schema-a-database.ts  →  createSchemaAClient
                                                                   remote repositories

Legado    →  integrations/supabase/types.ts  →  lib/supabase/client
                                                stubs / bio / ChatRepository
```

Substituição completa de `types.ts` **exige remodelagem** de stubs e de UI que ainda lê o esqueleto de 6 tabelas. Esta fase **não** faz essa remodelagem.

---

## 2. Client Schema A

| Peça | Papel |
| --- | --- |
| `src/integrations/supabase/schema-a-database.ts` | contrato técnico: **reexporta** o dump (sem copiar tabelas) |
| `src/integrations/supabase/remote/client.ts` | `createSchemaAClient<SchemaADatabase>` |
| `src/lib/supabase/client.ts` | **inalterado** — `Database` legado, sessão persistida, Auth 1H-14 |

Não foi criado um terceiro client com URL/key. O factory Schema A continua explícito (url/key injetados). O client da UI continua no Proxy legado. `integrations/supabase/client.ts` (Lovable, locked) continua sem importadores vivos.

---

## 3. Generated types

Fonte: `supabase/schema-a.generated.ts` (**não editado**).

`SchemaADatabase` / `SchemaAJson` são aliases. As 20 tabelas do Schema A compilam contra o dump.

Adapters 1H-12 continuam a importar o dump diretamente (sem mudança de modelo). Remote repos passam pelo contrato `schema-a-database.ts`.

---

## 4. Dependências de `types.ts`

### 4.1 Diretas (10) — todas **legado**, isoladas

| Arquivo | Classe | Notas |
| --- | --- | --- |
| `src/lib/supabase/client.ts` | 2 legado | client vivo da UI / Auth |
| `src/lib/supabase/server.server.ts` | 2 legado | SSR |
| `src/lib/supabase/rpc.ts` | 2 legado | RPCs; `Functions` no esqueleto é `never` |
| `src/lib/supabase/database.ts` | 2 legado | helper `from`/`rpc` |
| `src/integrations/supabase/client.ts` | 4 não utilizado | locked; zero importadores vivos |
| `src/integrations/supabase/auth-middleware.ts` | 2 legado | locked |
| `src/types/database/tables.ts` | 2 legado | aliases + `FallbackRow` para tabelas ausentes |
| `src/types/database/database.types.ts` | 4 não utilizado | reexport; sem consumidores |
| `src/types/database/views.ts` | 4 não utilizado | sem consumidores |
| `src/types/database/rpc.ts` | 4 não utilizado | sem consumidores |

Nenhuma destas é classe **1 Schema A**. Remote repos **não** importam `types.ts`.

### 4.2 Transitivas via `@/types/database/tables` — legado / incompatível

| Consumidor | Classe |
| --- | --- |
| `ChatRepository` / `chat.service.ts` | **3 incompatível** — `sendMessage` usa `content`; Schema A tem `text`. `MessageRow` hoje é `FallbackRow` |
| `bio-personal-data.tsx` e bio/* | **3 incompatível** — `headline`/`age`/`name?: string \| null` vs `profiles` Schema A (`name`/`handle` required) |
| `ProfileRepository` (`moments`, `compatibility`) | **3 incompatível** — tabelas fora do A |
| `feed.repository` / `BioPostRow` | **3 incompatível** — `bio_posts` fora do produto A |
| `notification` / `ride` / `marketplace` (`coupons`) | **3 incompatível** — fora do A |
| `conversations-screen`, `ConnexyChatScreen`, `perfil.$id`, `solicitacao`, `gerenciar.bio`, `use-connections` | **2 legado** — tipos de UI ainda no esqueleto |

### 4.3 Schema A (já no dump) — classe 1

Remote: profile, social, conversation, content, catalog, reservation, carona, save.  
Adapters `src/lib/adapters/schema-a/*`.

### 4.4 Isolar, não adaptar

`ChatRepository`, RPCs 13B1, `bio_posts`, `blocked_users`, `user_locations`, `user_presence`. Presentes no dump como legado de banco; **não** são usadas pelos remote repositories.

---

## 5. O que migrou / o que permaneceu

**Migrou (tipagem apenas):**

- `remote/client.ts` e `remote/types.ts` → `schema-a-database.ts`
- `remote/content.repository.ts` → `SchemaAJson` (mesmo `Json` do dump)

**Permaneceu legado:**

- `types.ts` (6 tabelas: `bio_posts`, `places`, `profiles`, `reels`, `reel_likes`, `reel_comments`)
- client UI, stubs, bio, ChatRepository
- adapters: dump direto (já Schema A)

---

## 6. Incompatibilidades (bloqueio de substituição)

Se `types.ts` fosse trocado pelo dump **agora**:

1. `chat.service.ts` — `content` não existe em `messages` (`text`).
2. `bio-personal-data.tsx` — `headline`, `age`, nullability de `name`/`handle`.
3. `ProfileRepository.updateProfile` — colunas legado vs Schema A + `profile_private`.
4. `from("moments"|"notifications"|"rides"|"likes"|"compatibility"|"coupons")` — tabelas ausentes no A; hoje `FallbackRow` mascara o erro.
5. RPCs 13B1 passariam a existir no tipo e convidariam `ChatRepository.getDirectConversation` a “compilar” contra um caminho que o cutover **não** deve usar.

Risco da substituição futura: **só** junto com isolamento/remoção desses stubs (fase de cutover de domínio, não desta).

---

## 7. Validação

| Check | Resultado |
| --- | --- |
| `bun test tests/schema-a-client-types-1h-16.test.ts` | **6 pass** |
| `bun test tests/schema-a-remote-1h-11.test.ts` | **6 pass** (unit; live skip se Postgres local não estiver no harness) |
| `bun test` | **401 pass / 8 skip / 0 fail / 2422 expect / 58 files** |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline 1H-15** |
| Demo `networkCalls` | **0** (UI não importa o contrato Schema A) |
| Auth Demo | **não ativado** |

---

## 8. PASS / FAIL

| Critério | |
| --- | --- |
| Client Schema A tipado | **SIM** (`createSchemaAClient<SchemaADatabase>`) |
| Generated types = fonte técnica | **SIM** |
| `types.ts` não quebrado à força | **SIM** |
| Dependências identificadas | **SIM** |
| Remote repos compilam | **SIM** |
| Demo intacto | **SIM** |
| Cutover | **NÃO** |

**STATUS: PASS**
