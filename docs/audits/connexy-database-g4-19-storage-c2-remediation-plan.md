# Connexy — G4.19: Plano de remediação da exposição C2 do Storage

Data: 2026-10-15 · Tipo: **AUDITORIA E PLANEJAMENTO (somente estático/local)** · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` inalterado.

> **Natureza das conclusões:** resultado de **análise estática** de código, migrations e
> configuração local. **Nenhum** runtime foi iniciado, **nenhuma** requisição HTTP foi feita e
> **nenhum** serviço remoto foi acessado. Este documento **não** prova o estado real do projeto
> Supabase, da CDN/borda, das policies aplicadas nem do conteúdo dos buckets. Onde o código sugere
> um formato, a confiança é indicada por fluxo.
>
> **Esta fase NÃO corrige C2.** Ela apenas o inventaria e propõe um plano reversível. A flag de
> assinatura de mídia (`VITE_APP_SCHEMA_A_MEDIA_URL`) permanece **desligada**. `rsukwuqocgjmwwuwtqaf`
> é o único projeto remoto considerado, e apenas como alvo futuro — **nada foi tocado**.
>
> Regra de leitura: **[F]** = fato verificado em arquivo local; **[I]** = inferência a partir de
> código/config; **[H]** = hipótese ainda não comprovada (não tratar como segura).

---

## 1. Veredito

- **C2 permanece ABERTO e NÃO corrigido.** Os três buckets ativos (`avatars`, `bio-media`,
  `reels-media`) são declarados `public = true` e materializados como públicos; a leitura de
  `storage.objects` é **por bucket** (não por dono nem por publicação). **[F]**
- **O desenho de remediação já existe no repositório** (contrato canônico `(bucket,path)`,
  autorização server-side por publicação, assinatura com service role server-only, TTL 60–300 s,
  cache escopado por visualizador) e foi auditado no G4.18 como **APROVADO COM RESSALVAS**. **[F]**
- **O que falta é a execução coordenada** (buckets privados + backfill de referências + habilitação
  gradual de consumidores), que depende de autorização específica de C2 e de acesso integrado ao
  projeto alvo. **[I]**
- **A migração NÃO é trivialmente segura:** coexistem dados legados por **URL pública**, **URL
  assinada de 5 anos** persistida em campo público, **URLs externas arbitrárias** (MCP) e itens
  Schema A **sem identidade de Storage**. Um corte cego quebra telas de forma visível. **[F]**
- **Veredito desta fase:** *PLANO VIÁVEL, EXECUÇÃO NÃO AUTORIZADA.* Não declarar C2 corrigido; não
  avançar para privacidade de buckets antes de concluir as etapas 1–4 do plano (§4) e obter
  autorização explícita.

---

## 2. Inventário de buckets e políticas

### 2.1 Buckets declarados (config local — não é prova de produção) **[F]**

| Bucket | `public` | Limite | MIME permitido | Fonte |
| --- | --- | --- | --- | --- |
| `avatars` | `true` | 5 MiB | image/jpeg, image/png, image/webp | `supabase/config.toml:16-19`; `20260816120000_create_avatars_bucket.sql:7-18` |
| `bio-media` | `true` | 10 MiB | image/jpeg, image/png, image/webp, image/gif | `supabase/config.toml:6-9`; `20261009120000_ensure_bio_reels_storage_buckets.sql:18-29` |
| `reels-media` | `true` | 50 MiB | video/mp4, video/quicktime, video/webm, image/jpeg | `supabase/config.toml:11-14`; `20261009120000_...:31-42` |

- `supabase/config.toml:1` → `project_id = "rsukwuqocgjmwwuwtqaf"` (apenas config **local**; não
  invoca nem linka o projeto remoto). **[F]**
- Buckets "deferidos", nunca criados: `post-media`, `reel-media`, `catalog-covers`,
  `chat-attachments` (`src/lib/storage/schema-a-storage.ts:18-23`). **[F]**

### 2.2 Políticas de `storage.objects` por bucket (linha do tempo de migrations) **[F]**

**`avatars`** — leitura efetivamente **pública/anônima**:

| Operação | Policy | Definição | Fonte |
| --- | --- | --- | --- |
| SELECT | `Avatars public read` | `USING (bucket_id = 'avatars')` — **sem `TO`** (aplica a anon) | `20260816120000_...:23-25` |
| SELECT | `Avatars authenticated read` | `FOR SELECT TO authenticated USING (bucket_id = 'avatars')` | `20260825025843_...:1-3` |
| INSERT | `Avatars owner upload` | `foldername(name)[1] = auth.uid()::text` | `20260825025843_...:5-7` (substitui `Avatars authenticated insert` de `20260816120000:28-33`) |
| UPDATE | `Avatars owner update` | owner-folder | `20260825025843_...:9-12` |
| DELETE | `Avatars owner delete` | owner-folder | `20260825025843_...:14-16` |

> **[F]** A migration `20260825025843` **não** remove a policy `Avatars public read` criada em
> `20260816120000` (o `DROP` é de `Avatars authenticated read`). Como policies permissivas são
> somadas por `OR`, a leitura anônima do bucket `avatars` **permanece concedida**.

**`bio-media`** — leitura `TO authenticated`, porém **bucket-wide**:

| Operação | Policy | Definição | Fonte |
| --- | --- | --- | --- |
| SELECT | `Bio media public read` (removida) | — | criada `20260709023757:2-3`; **`DROP`** em `20260825025605:2` |
| SELECT | `Bio media authenticated read` | `FOR SELECT TO authenticated USING (bucket_id = 'bio-media')` | `20260825025605:3-5` |
| INSERT | `Bio media auth upload` | `auth.uid() IS NOT NULL AND foldername[1]=uid` | `20260709023757:4-5` |
| UPDATE/DELETE | owner-folder | `foldername[1]=auth.uid()` | `20260709023757:6-9` |

**`reels-media`** — leitura `TO authenticated`, **bucket-wide**:

| Operação | Policy | Definição | Fonte |
| --- | --- | --- | --- |
| SELECT | `Reels media public read` (removida) | — | criada `20260710014946:69-71`; **`DROP`** em `20260825025605:7` |
| SELECT | `Reels media authenticated read` | `FOR SELECT TO authenticated USING (bucket_id = 'reels-media')` | `20260825025605:8-10` |
| INSERT | `Reels media auth upload` | `foldername[1]=auth.uid()` | `20260810182822:2` |
| UPDATE/DELETE | owner-folder | `foldername[1]=auth.uid()` | `20260825025605:13-22` |

### 2.3 Fatos de confidencialidade (C2) **[F]**

1. `public = true` torna a policy de SELECT **irrelevante** para leitura anônima via
   `/storage/v1/object/public/<bucket>/<path>` — o bucket é servido como público.
2. Mesmo onde a leitura exige `authenticated`, o filtro é **por bucket**, não por dono nem por
   privacidade da publicação. Um usuário autenticado pode ler qualquer objeto dos três buckets.
3. Nenhuma migration altera `storage.buckets.public` para `false`. **[F]**
4. `profiles` (onde mora `photo_url`) é `authenticated`-only desde `20260825025605:24-30`, mas as
   **URLs públicas** já emitidas continuam acessíveis sem login (o objeto é público). **[F]**
5. Tabelas legadas `bio_posts` e `reels` continuam com **SELECT público (inclusive `anon`)**:
   `bio_posts` (`20260709023719:56-69`), `reels` (`20260710014946:3-27`). As URLs/caminhos de mídia
   nelas podem ser enumerados por qualquer um. **[F]**
6. `posts` (Schema A) é `revoke all ... from anon, public` + RLS por privacidade
   (`20260925030806_schema_a_core.sql:762-782`). A **linha** está protegida; o **objeto** continua
   exposto enquanto o bucket for público. **[F]**

> **Ponto central:** o SELECT bucket-wide é **mais amplo** que a RLS de `posts`. Enquanto os buckets
> forem públicos, "mídia autenticada" não é proteção de confidencialidade. Fechar C2 exige
> simultaneamente (a) `public=false`, (b) revogar a SELECT bucket-wide e (c) servir por assinatura
> autorizada por publicação.

---

## 3. Matriz de consumidores (quem escreve/lê e por qual formato)

Legenda de formato: **PUB** = URL pública do Storage; **SIGN** = URL assinada; **PATH** = caminho
relativo `{uid}/...`; **CANON** = `(bucket,path)` canônico em `posts.media`; **EXT** = URL externa;
**LOCAL** = OPFS/IndexedDB/`blob:`.

### 3.1 Avatares (`avatars`)

| Papel | Local | Formato | Observações |
| --- | --- | --- | --- |
| Escreve | `src/components/bio/bio-avatar.tsx:115-123` | **PUB** em `profiles.photo_url` | `UploadService.uploadAvatar` → `getPublicUrl` |
| Escreve | `src/routes/completar-perfil.tsx:236-262` | **SIGN** (TTL `60*60*24*365*5` ≈ 5 anos) em `profiles.photo_url` | token de longa duração persistido; `extractStoragePathFromUrl` só lê `/public/`, então remoção não acha o path |
| Escreve | `src/services/upload.service.ts:75-79,101-113` | **PUB** | helper `getPublicUrl`/`uploadAvatar` |
| Lê/renderiza | `bio-avatar.tsx:68,106`; `_app.home.tsx:98`; `_app.pessoas.tsx:97-99`; `_app.connecta.tsx:176-178`; `_app.solicitacao.$id.tsx:514-545`; `presence-live-feed-real.tsx:114-116`; `chat/ConnexyChatScreen.tsx:211`; `reels/reel-card.tsx:158,211`; `reels/comments-sheet.tsx:137`; `feed/FeedNearbyPeople.tsx:33`; `discover.tsx:145` | PUB/SIGN direto em `<img src>` | campo único, formatos mistos |
| Remove | `bio-avatar.tsx:145-170`; `_app.perfil/index` | usa `extractStoragePathFromUrl` (só `/public/`) | não remove objeto de URL assinada |

### 3.2 Publicações legadas (`bio-media`, `bio_posts.media_url`)

| Papel | Local | Formato | Observações |
| --- | --- | --- | --- |
| Escreve | `src/components/bio/bio-posts.tsx:39-53` (criar), `:131-140` (trocar) | **PUB** em `bio_posts.media_url` | `getPublicUrl` após upload; `media_kind="image"` |
| Escreve | `src/lib/mcp/tools/create-moment.ts:13,27` | **EXT** arbitrária (`z.string().url()`) em `bio_posts.media_url` | sem validação de origem/dono |
| Lê/renderiza | `bio-posts.tsx:296-299`; `_app.perfil.$id.tsx:89` | PUB/EXT direto em `<img src>` | tabela pública inclusive `anon` |
| Remove | `bio-posts.tsx:74-81,141-148,173-179` | extrai path só de `/public/` | — |

### 3.3 Reels (`reels-media`, `reels.video_url`/`poster_url`)

| Papel | Local | Formato | Observações |
| --- | --- | --- | --- |
| Escreve | `src/lib/reels/reel-publish.ts:127-145` | **PATH** em `video_url`/`poster_url` | upload para `reels-media`; colunas guardam o caminho, não a URL |
| Escreve | `src/lib/adapters/schema-a/content.ts:130-134` | string repassada (`video_url`/`poster_url`) | adapter legado |
| Lê/renderiza | `reels/reel-card.tsx:111-112` (`src={reel.video_url}`) | **mas o valor vem de OPFS** | `reel-feed.ts:70-87` chama `getReelVideoUrl` (object URL local); o caminho remoto **não** é renderizado hoje |
| Lê | `reels/reel-local-media-db.ts:166+` | LOCAL | OPFS/IndexedDB |

> **[F]** A renderização de Reels usa mídia local (OPFS). O caminho remoto em `video_url`
> **não é consumido como URL** no feed atual. Ainda assim, a coluna é pública (SELECT da tabela) e
> revela o `{uid}/{reelId}.{ext}`.

### 3.4 Publicações Schema A (`posts.media`, caminho canônico)

| Papel | Local | Formato | Observações |
| --- | --- | --- | --- |
| Contrato | `src/lib/media/media-contract.ts:24-213` | **CANON** `(bucket,path)` + `posterPath` | `preview`/`mediaId` só legado/local |
| Adapter | `src/lib/adapters/schema-a/content.ts:57-96` | **CANON** quando presente | preserva `bucket`/`path`/`posterPath` |
| Render (seguro) | `src/routes/_app.perfil.index.tsx:978-1003`; `src/components/post/demo-post-detail.tsx:107-129` → `PostMediaFrame` | CANON → **SIGN** | via `use-secure-post-media-url.ts` → `post-media-signer.ts` → `getPostMediaUrl` |
| Gate | `src/lib/media/media-url-flag.ts:27-30` | — | **OFF** por padrão (`VITE_APP_SCHEMA_A_MEDIA_URL !== "true"` ⇒ `isMediaUrlSigningEnabled=false`) |
| Fallback | `post-media-frame.tsx:28-36` | LOCAL/PUB preview | com flag OFF cai em `LocalMediaFrame` (OPFS + `preview`) |

> **[F]** Hoje a flag está OFF ⇒ `shouldUseSecurePostMedia` retorna `false` ⇒ **nenhuma** chamada a
> `getPostMediaUrl` em produção. O único consumidor de runtime de `getPostMediaUrl` é o próprio
> `post-media-signer.ts:19`. **[F]**

### 3.5 Outros

| Tipo | Local | Formato | Observações |
| --- | --- | --- | --- |
| Chat (anexos) | `chat/message-bubble.tsx:231-260`; `chat/ConnexyChatScreen.tsx:1326-1340` | LOCAL (`LocalMediaFrame`) | `messages.media_bucket`/`media_path` estruturado; **sem bucket próprio criado** |
| Catálogo | `integrations/supabase/remote/catalog.repository.ts`; `adapters/schema-a/catalog.ts` | EXT/PUB (`photo_url`, `cover_url`) | sem bucket dedicado |
| Lugares | seeds `20260709023719` (`places.cover_url`) | EXT (Unsplash) | — |
| Mídia local/demo | `src/lib/media/local-media-storage.ts`; `reel-local-media-db.ts` | LOCAL | nunca vai a Storage remoto |

### 3.6 Síntese de dependências por formato **[F]**

- **Dependentes de URL pública (quebram se o bucket virar privado):** `bio-avatar` (`photo_url`
  PUB), `bio-posts` (`media_url` PUB), chat/avatar de terceiros que renderizam esses campos.
- **Dependentes de URL assinada longa:** `completar-perfil.tsx` (5 anos) — continua válida até
  expirar, **não regenerável** sem backfill, e é um token portador persistido em campo público.
- **Dependentes de caminho relativo:** Reels no banco (não renderizado remotamente hoje).
- **Já prontos para o modelo seguro:** itens Schema A **canônicos** + `PostMediaFrame` + endpoint
  `getPostMediaUrl` (flag OFF).
- **Não convertíveis mecanicamente:** `create-moment` (URL externa), `places.cover_url`/mocks
  (domínios externos), itens Schema A **sem `(bucket,path)`**.

---

## 4. Plano de migração por etapas (proposto, NÃO executado)

Cada etapa: **Objetivo · Pré-requisitos · Evidências exigidas · Critério de sucesso · Abortar se**.
Nenhuma etapa abaixo foi executada nesta fase.

**Etapa 0 — Governança e autorização.**
- Objetivo: obter autorização explícita de C2 e definir o projeto alvo (`rsukwuqocgjmwwuwtqaf`),
  janela e escopo.
- Pré: aprovação de quem opera o Supabase; ambiente local isolado de teste.
- Evidências: registro de aprovação; lista de operações permitidas (lectura/escrita/policy).
- Sucesso: autorização documentada com escopo e rollback acordados.
- Abortar: qualquer operação em produção não autorizada.

**Etapa 1 — Baseline e inventário integrado (leitura).**
- Objetivo: conhecer objetos e formatos reais antes de tocar em policies.
- Pré: etapa 0; acesso de leitura a `storage.objects`.
- Evidências: contagem `(bucket, path, owner, size, created_at)` **agregada** (sem imprimir tokens);
  distribuição de formatos em `profiles.photo_url`, `bio_posts.media_url`, `reels.video_url`/`poster_url`,
  `posts.media`; contagem de URLs assinadas antigas.
- Sucesso: 100% das referências classificadas (PUB/SIGN/PATH/CANON/EXT/LOCAL/ambígua).
- Abortar: divergência inexplicada entre objetos e referências.

**Etapa 2 — Endurecer o contrato de escrita (código, sem tocar buckets).**
- Objetivo: impedir novas gravações no formato frágil.
- Pré: contrato canônico aprovado (`media-contract.ts`, D-M1).
- Evidências: novos uploads de avatar/posts gravam `(bucket,path)` (campo apropriado), não URL
  pública/assinada; `completar-perfil.tsx` deixa de persistir URL assinada de 5 anos.
- Sucesso: testes unitários verdes; nenhum novo write em formato legado.
- Abortar: se um fluxo legítimo não tiver campo canônico.

**Etapa 3 — Backfill/dupla-leitura das referências legadas.**
- Objetivo: converter PUB/SIGN/PATH → CANON onde determinístico; marcar não conversíveis.
- Pré: etapa 1; extrator `bucket`+`path` **offline** (sem rede).
- Evidências: patch proposto por tabela + lista de itens não conversíveis; para `photo_url` assinado,
  plano de rotação/descarte.
- Sucesso: cada referência com destino definido (path, reupload ou descarte justificado).
- Abortar: referência sem dono determinável com risco de confidencialidade.

**Etapa 4 — Autorização por publicação/objeto (já implementada; validar cobertura).**
- Objetivo: garantir que a leitura de objeto derive da **linha autorizada**.
- Pré: `canViewPost`/`authorizeMediaAccess`/`createMediaUrlService` (G4.18).
- Evidências: cobertura de consumers pelo caminho assinado (avatar/bio/reels/chat), não só posts.
- Sucesso: nenhum leitor depende de SELECT bucket-wide.
- Abortar: se a autorização de objeto depender de leitura ampla de bucket.

**Etapa 5 — Buckets privados e políticas mínimas.**
- Objetivo: `public=false` + revogar SELECT bucket-wide, mantendo INSERT/UPDATE/DELETE owner-folder.
- Pré: etapas 1–4 aprovadas; **autorização de C2**.
- Evidências: `storage.buckets.public=false`; policies SELECT revistas (por autor/assinatura);
  `anon` sem leitura.
- Sucesso: leitura só via assinatura autorizada; dono lê o próprio (se desejado).
- Abortar: se qualquer leitura legítima depender de caminho público.

**Etapa 6 — Assinatura server-side ampliada.**
- Objetivo: estender `/getPostMediaUrl` (ou equivalente) a avatar/bio/reels/chat.
- Pré: etapa 5; service role server-only confirmado (G4.18 §4.2).
- Evidências: TTL 60–300 s, sem token em log, respostas tipadas, sem service role no bundle.
- Sucesso: consumidores recebem URLs curtas apenas autorizadas.
- Abortar: se exigir credencial privilegiada no cliente.

**Etapa 7 — Corte gradual por tipo (flags por ambiente).**
- Objetivo: migrar consumidores um a um (avatar → bio_posts → posts → reels → chat), com fallback
  local intacto.
- Pré: etapa 6; flag de mídia habilitável por ambiente.
- Evidências: por tipo, nenhum `<img>/<video>` aponta para `/object/public/`.
- Sucesso: 0 URLs `/public/` ativas; 0 regressões visuais nos testes.
- Abortar: consumidor sem caminho de assinatura.

**Etapa 8 — Verificação pós-corte e higiene.**
- Objetivo: varrer, confirmar corte e remover tokens antigos.
- Pré: etapa 7; autorização.
- Evidências: varredura estática por `/object/public/` e por tokens em logs; rotação das URLs de 5
  anos; reexecução da matriz de testes (§5).
- Sucesso: corte mantido, nenhum vazamento.
- Abortar: qualquer regressão → rollback (§7).

**Etapa 9 — Descontinuação de legado.**
- Objetivo: decidir destino de `bio_posts` (migrar para `posts` ou descontinuar) e do MCP `media_url`.
- Pré: ADR `adr-bio-posts-to-posts.md`; etapas 3, 7.
- Evidências: plano de migração de dados + validação de contagens.
- Sucesso: legado sem leitura pública de mídia.
- Abortar: se houver dependência de dados legados não mapeada.

---

## 5. Matriz de testes e critérios de aprovação

**Nenhum teste abaixo foi executado.** Os unitários são locais/sem rede; os integrados dependem do
projeto alvo e de autorização.

### 5.1 Unitários (locais, sem rede) — verificáveis por leitura/já cobertos **[F]/[I]**

| # | Alvo | Esperado | Fonte |
| --- | --- | --- | --- |
| U1 | `clampMediaUrlTtl` (intervalo/NaN/Inf) | 60–300, default 300 | `media-authorization.ts:44-53` |
| U2 | `validateMediaPath` (absoluto/`..`/`\`/`%xx`/controle/sem-uuid) | rejeita | `media-path.ts:59-85` |
| U3 | `parseStorageUrl` (origem confiável, decode único) | só mesma origem | `media-path.ts:113-160` |
| U4 | `classifyMediaValue` (CANON > PUB/SIGN > local > inválido) | ordem correta | `media-contract.ts:71-131` |
| U5 | `authorizeMediaAccess` (dono, bucket×tipo, index inválido) | `invalid-ref`/`missing` | `media-authorization.ts:78-125` |
| U6 | `canViewPost` (PUBLIC/CONNECTIONS/PRIVATE) | coerente com RLS | `media-authorization.ts:56-67` |
| U7 | cache escopado por `viewerId` + in-flight | sem vazamento cruzado | `media-resolver.ts:131-133`; `use-secure-post-media-url.ts:77` |
| U8 | `shouldUseSecurePostMedia` (sem viewer/uuid/canon/flag) | `false` | `post-media-resolver.ts:150-160` |

### 5.2 Integrados no projeto alvo (exigem autorização de C2) — propostos

| # | Cenário | Esperado pós-C2 |
| --- | --- | --- |
| I1 | Anônimo em `/object/public/...` de qualquer bucket | **negado** (bucket privado) |
| I2 | Anônimo no endpoint de mídia | erro de auth (barrado no middleware — G4.17) |
| I3 | DONO lê mídia própria (PUBLIC/PRIVATE) | `ready` |
| I4 | Conectado lê `CONNECTIONS` | `ready` |
| I5 | Não conectado lê `CONNECTIONS` | `forbidden` |
| I6 | Terceiro lê `PRIVATE` | `forbidden` |
| I7 | Autenticado lê objeto de outro bucket (path alheio) | negado (RLS/assinatura) |
| I8 | `bucket`/`path` arbitrários do cliente | `missing`/`forbidden` |
| I9 | Mudança PUB→PRIVATE invalida acesso e cache | nova leitura negada; URL antiga expira ≤300 s |
| I10 | Desconexão/revogação | idem I9 |
| I11 | Objeto inexistente/removido | `missing`/`forbidden` |
| I12 | Expiração da URL assinada | >300 s falha; re-assinação só autorizada |
| I13 | Isolamento de cache entre visualizadores | sem reuso cruzado |
| I14 | Ausência de tokens/URLs assinadas em logs | nenhum segredo em log |

### 5.3 Critérios de aprovação (corte) **[I]**

1. **0 referências ativas** para `/storage/v1/object/public/` em código/consumidores de produção.
2. `storage.buckets.public = false` nos três buckets ativos, com policies mínimas aplicadas.
3. Todos os cenários negativos (§5.2) negados **sem** emissão de `url` (`status ∈
   {forbidden, missing, unavailable}`).
4. Todos os positivos servem URL com `expiresAt − now ∈ [60,300]` apontando para o `(bucket,path)`
   autorizado.
5. Nenhum token/URL assinada em logs; service role ausente do bundle do cliente.
6. Zero regressões visuais nos fluxos de avatar, bio, posts, reels e chat.

---

## 6. Riscos, decisões pendentes e dependências

### 6.1 Riscos

| Risco | Tipo | Severidade | Mitigação no plano |
| --- | --- | --- | --- |
| Buckets públicos (C2) | Confidencialidade | **Alta** | Etapas 4–6; não corrigido ainda |
| URL assinada de 5 anos persistida em campo público | Confidencialidade | **Alta** | Etapa 3 (rotação) + Etapa 2 (parar de emitir) |
| `bio_posts`/`reels` com SELECT público (`anon`) | Confidencialidade | **Alta** | Etapas 3/9 |
| URL bucket-wide `authenticated` (qualquer um lê qualquer objeto) | Confidencialidade | **Média** | Etapa 5 (revogar SELECT amplo) |
| URL assinada não revogável até expirar (≤300 s) | Confidencialidade | **Média** | TTL curto + invalidação de cache (G4.18) |
| Corte cego quebra avatar/bio/Reels | Disponibilidade/UX | **Alta** | Etapas 2/3/7 (gradual + fallback local) |
| `create-moment` grava URL externa arbitrária | Integridade/privacidade | **Média** | Etapa 9 (validar/re-hospedar) |
| Item Schema A sem `(bucket,path)` | Funcional | **Média** | Etapa 3; D-M1 já no adapter |
| Sem rate limiting no endpoint de assinatura | Abuso | **Baixa** | Dependência futura |
| Divergência de namespace de env (`APP_*` vs `VITE_APP_*`) | Configuração | **Baixa** | Consolidar wiring (fail-closed hoje) |

### 6.2 Decisões pendentes

- Autorizar C2 (buckets privados + revogação da SELECT + assinatura) e **quando**.
- Definir backfill de `photo_url`/`bio_posts.media_url` (URL → `(bucket,path)`) e destino de URLs
  externas do MCP.
- Aprovar extensão do contrato de mídia a avatar/bio/reels/chat (hoje o caminho assinado cobre
  `posts`).
- Definir se `bio_posts` migra para `posts`/Schema A ou é descontinuado (`adr-bio-posts-to-posts.md`).
- Definir política de rotação das URLs assinadas de 5 anos.
- Decidir sobre leitura do dono vs. apenas assinatura (policies SELECT mínimas).

### 6.3 Dependências

- Autorização explícita de C2 e janela de execução (Etapa 0).
- Acesso integrado de leitura ao projeto alvo para baseline (Etapa 1).
- Stack Supabase local autorizado para testes de policies (integrados §5.2).
- Habilitação controlada da flag `VITE_APP_SCHEMA_A_MEDIA_URL` por ambiente.
- Consolidação do namespace de env.

---

## 7. Estratégia de rollback

**Princípio: nunca reabrir um bucket como público para "consertar".** O rollback reverte
**configuração/dados/flag**, não reabre exposição. **[I]**

1. **Flag primeiro:** desligar `VITE_APP_SCHEMA_A_MEDIA_URL` (retorna consumidores ao caminho
   legado/local) — reversão mais rápida e menos arriscada.
2. **Consumidores:** reverter o patch de UI/adapters que passou a exigir assinatura, por tipo,
   mantendo buckets privados.
3. **Dados:** se o backfill corromper referências, restaurar a partir de snapshot **prévio** dos
   campos afetados (`photo_url`, `media_url`, `posts.media`) capturado na Etapa 1.
4. **Policies:** restaurar **as policies anteriores** (owner-folder para mutação; SELECT mínimo) —
   jamais `public=true`.
5. **Proibido como rollback:** tornar bucket público, reemitir URL de 5 anos, ou reabilitar leitura
   anônima.
6. **Ponto de não-retorno:** a Etapa 5 (`public=false`) é a mais sensível; exige snapshot e plano de
   reversão de policy testado antes de aplicar.

---

## 8. Estado do Git (antes/depois)

| Momento | HEAD | Branch | `git status --short` |
| --- | --- | --- | --- |
| Antes desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 259 entradas |
| Depois desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 259 + este relatório (G4.19) |

- Delta **desta fase**: apenas `docs/audits/connexy-database-g4-19-storage-c2-remediation-plan.md`
  (novo).
- As **259** entradas preexistentes (incluindo os relatórios G4.17 e G4.18) foram **preservadas**;
  nenhum `reset`/`clean`/`checkout`/`rebase`/commit/push.
- Nenhuma alteração de código de aplicação, testes existentes, dependências, configurações,
  `.env`/`.env.local`, `config.toml`, migrations, lockfiles ou flags.

---

## 9. Confirmação de ausência de runtime, requisições e operações remotas

- **Nenhum runtime iniciado** (Wrangler/workerd não executados; `pgrep` confirmou zero processos).
- **Nenhuma requisição HTTP** e **nenhuma** chamada ao Supabase remoto.
- **Nenhum** login, token, cookie ou credencial produzido/coletado; nenhum segredo impresso.
- **Nenhuma** migração/SQL executados; nenhum bucket/policy/flag alterado;
  `VITE_APP_SCHEMA_A_MEDIA_URL` permanece **desligada**.
- **C2 NÃO foi corrigido nesta fase.** Análise exclusivamente por leitura estática de código,
  migrations e `supabase/config.toml`.

---

## 10. Recomendação de próxima fase

**Não** avançar para a Etapa 5 (buckets privados). Próximo passo recomendado, após autorização de
C2: **Etapa 2** (endurecer a escrita para o formato canônico, sem tocar buckets) e **Etapa 1**
(baseline integrado de leitura no projeto alvo `rsukwuqocgjmwwuwtqaf`). Sem autorização de C2,
permanecer em fases locais e no endurecimento do contrato de escrita.
