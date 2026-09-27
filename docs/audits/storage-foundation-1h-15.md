# 1H-15 — Supabase Storage Foundation

- **Data:** 2026-09-25
- **Tipo:** contrato e paths de Storage. Sem upload de UI, sem migração de mídia.
- **Herdado (não reaberto):** 1H-8 contrato, 1H-9 SQL, 1H-11 repos, 1H-12 adapters, 1H-13 plano, 1H-14 Auth flag.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**
- **CUTOVER:** **NOT STARTED**
- **DUAL-WRITE / SYNC:** **não**
- **BUCKETS CRIADOS:** **0**
- **POLICIES ALTERADAS:** **0** (já suficientes para escrita owner-folder)

Schema A, migrations existentes, repositories, adapters, `types.ts` e componentes de perfil/Agora **não** foram alterados.

---

## 1. Auditoria (somente leitura, Postgres local)

Consulta em `127.0.0.1` / rede `connexy-supabase-local`. **Sem** link/push remoto.

### Buckets encontrados (3)

| id | public | limite | MIME |
| --- | --- | --- | --- |
| `avatars` | true | 5 MiB | jpeg, png, webp |
| `bio-media` | true | 10 MiB | jpeg, png, webp, gif |
| `reels-media` | true | 50 MiB | mp4, quicktime, webm, jpeg |

Iguais a `supabase/config.toml`. Nenhum outro bucket. Não há `post-media`, `reel-media`, `catalog-covers` nem `chat-attachments`.

### Policies atuais (`storage.objects`)

Escrita **não** usa `USING (true)`:

| Bucket | SELECT | INSERT | UPDATE / DELETE |
| --- | --- | --- | --- |
| `avatars` | público **e** authenticated (bucket) | pasta `[1] = auth.uid()` (duas policies equivalentes) | pasta `[1] = auth.uid()` |
| `bio-media` | authenticated (bucket) | `auth.uid() IS NOT NULL` **e** pasta `[1] = auth.uid()` | pasta `[1] = auth.uid()` |
| `reels-media` | authenticated (bucket) | pasta `[1] = auth.uid()` | pasta `[1] = auth.uid()` |

A INSERT antiga de `reels-media` sem pasta (`auth.role() = 'authenticated'`) **já foi substituída** (`20260810182822`). Não recriada.

Buckets `public = true`: GET público do objeto **não** exige policy SELECT extra (docs Storage). SELECT authenticated cobre listagem via API. Restaurar SELECT anónimo em `bio-media`/`reels-media` **não** é mínimo necessário nesta fase (UI não lê Storage).

Upsert futuro exige INSERT + SELECT + UPDATE — as três já existem por bucket, com pasta = uid na mutação.

### Uso de mídia no produto (não ligado a esta camada)

| Superfície | Hoje | Destino Schema A |
| --- | --- | --- |
| Avatar perfil | `UploadService` / `completar-perfil` → `avatars/{uid}/…` (dormant no demo) | mesmo bucket |
| Bio posts | `bio-media/{uid}/…` | mesmo bucket |
| Agora | IndexedDB + `MOCK_REELS`; `reel-publish` remoto só fora do demo | `reels-media/{uid}/…` |
| Posts / Momento | data URL / preview local | **reutilizar** `bio-media` (não criar `post-media`) |
| Capa de perfil | data URL local | `avatars` (`cover`) |
| Catalog covers / chat | local / mock | **adiado** (`catalog-covers`, `chat-attachments`) |
| Product / Order | — | **não** nesta fase |

---

## 2. Estratégia (reutilizar, não duplicar)

1H-8 nomeava `reel-media` e `post-media`. O projeto **já** tem `reels-media` e `bio-media`. Criar os nomes 1H-8 seria duplicata.

| Finalidade Schema A | Bucket reutilizado | Não criar |
| --- | --- | --- |
| Avatar / capa de Profile | `avatars` | — |
| Bio + Momento/post media | `bio-media` | `post-media` |
| Agora vídeo + pôster | `reels-media` | `reel-media` |
| Catalog / chat / Schema B | — | `catalog-covers`, `chat-attachments`, Product/Order |

Gate: `isSchemaAStorageEnabled()` = `isRemoteAuthEnabled()` (1H-14). Demo vence. Sem flag extra, sem store local, sem client Storage nesta fase.

---

## 3. Paths e ownership

```text
{auth.uid()}/{purpose}/{objectId}.{ext}
```

`objectId` e o primeiro segmento são UUID de Auth. `lucas` é recusado.

| purpose | bucket | coluna futura |
| --- | --- | --- |
| `avatar` | `avatars` | `profiles.photo_url` |
| `cover` | `avatars` | `profiles.cover_url` |
| `bio` | `bio-media` | galeria bio (legado) |
| `post` | `bio-media` | `posts.media[].url` |
| `reel` | `reels-media` | `reels.video_url` |
| `reel-poster` | `reels-media` | `reels.poster_url` |

Colunas guardam **path relativo**, não data URL.

Compatível com as policies existentes: `(storage.foldername(name))[1] = auth.uid()::text`.

Quem escreve: utilizador autenticado, só a própria pasta.  
Quem lê: GET público (bucket public) para mídia publicada; API list = authenticated.

---

## 4. O que permanece só local/demo

```text
MOCK_REELS, people, currentUser
IndexedDB connexy-reels-local-db / blobs
data URLs de perfil, posts, capa
connexy:demo:own-profile photo/cover
ids não-UUID (lucas, reel-${Date.now()})
```

Não há migração de ficheiros. Copy-once de perfil **não** inclui blobs.

---

## 5. Camada criada

`src/lib/storage/schema-a-storage.ts`

- nomes dos buckets existentes
- builder de path + prova de ownership
- **não** importa o client Supabase
- **não** faz upload
- **não** usa service role

UI / repos / adapters **não** importam este módulo.

---

## 6. Validação

| Check | Resultado |
| --- | --- |
| `bun test tests/schema-a-storage-1h-15.test.ts` | **10 pass / 0 fail** |
| `bun test` | **395 pass / 8 skip / 0 fail / 2354 expect / 57 files**. Skip = live 1H-11 |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline 1H-14** |
| Demo `networkCalls` | **0** (módulo sem fetch; UI de Storage não ligada) |

---

## 7. PASS / FAIL

| Critério | |
| --- | --- |
| Buckets identificados / reutilizados | **SIM** (`avatars`, `bio-media`, `reels-media`) |
| Buckets duplicados | **NÃO** |
| Policies documentadas; SQL só se necessário | **SIM** / **não aplicado** (escrita já é owner-folder) |
| Demo intacto | **SIM** |
| UI conectada | **NÃO** |
| Cutover de domínio | **NÃO** |
| Schema A inalterado | **SIM** |
| Repos / adapters inalterados | **SIM** |
| Dual-write / sync | **NÃO** |

**STATUS: PASS**
