# Lote G2 — Inventário de mídias e plano de transição do Storage

Data: 2026-10-12 · Tipo: **AUDITORIA E DOCUMENTAÇÃO (somente local)** · HEAD `16f8c6b` inalterado.

> **Natureza das conclusões:** este documento é resultado de **análise estática** (busca e leitura de
> código e migrations locais). Ele **não** prova existência, quantidade ou conteúdo de objetos no
> Supabase Storage. Nenhum serviço remoto foi acessado. Nenhum objeto foi contado. Onde o código
> sugere um formato, a confiança é indicada por fluxo.
>
> Fases G1–G1.4 permanecem locais. Flag de assinatura de mídia **OFF**. **C2 e C6 permanecem
> abertos.**

## 1. Resumo executivo

O Connexy tem **duas gerações de schema** coexistindo no repositório:

- **Legado** (`bio_posts.media_url`, `profiles.photo_url`, `reels.video_url`/`poster_url`): mídia
  referenciada por **URL pública completa** ou **caminho relativo**, com consumo direto em `<img>`/
  `<video>`. Estes fluxos **quebram de forma visível** se os buckets virarem privados.
- **Schema A** (`posts.media` jsonb; contrato canônico `(bucket,path)` no lote G1/G2 em
  `src/lib/media/`): mídia referenciada por item estruturado, mas o **adapter atual** grava apenas
  `preview` + `mediaId` local, **descartando itens sem `preview`** (`mediaFromJson`) e sem
  `(bucket,path)`. Ou seja, publicações Schema A **já não são resolvíveis remotamente**.

Três buckets existem (`avatars`, `bio-media`, `reels-media`), todos declarados **`public = true`**
em `supabase/config.toml` e materializados como públicos nas migrations. As policies de SELECT de
`storage.objects` são **por bucket e por autenticação**, não por dono/publicação — logo, uma futura
transição para privado **não basta**: precisa também ser acompanhada de autorização por publicação
(D-M3) e assinatura server-side (bloqueada por C2).

Referências mais críticas para a transição:

1. `profiles.photo_url` grava **URL pública** (`bio-avatar.tsx`) **e** **URL assinada de 5 anos**
   (`completar-perfil.tsx`) — formatos mistos no mesmo campo.
2. `bio_posts.media_url` grava **URL pública** e aceita **URL externa arbitrária** via MCP.
3. `reels.video_url`/`poster_url` grava **caminho relativo** (novo) ou string repassada pelo
   adapter — hoje exibido **sem assinatura**.
4. `posts.media` (Schema A) grava `preview` vazio + `mediaId` local — **sem identidade de Storage**.

Não é possível afirmar que a migração é segura. Há dados mistos, referências externas e lacunas de
autorização que exigem verificação integrada autorizada.

## 2. Estado Git real confirmado

Comandos executados (somente leitura): `git rev-parse --short HEAD` → `16f8c6b`;
`git rev-parse --abbrev-ref HEAD` → `backup/connexy-snapshot-2026-10-02`;
`git status --porcelain` → 211 linhas (118 rastreadas/alteradas preexistentes + 93 não rastreadas),
idêntico ao fim de G1.4. Nenhum arquivo preexistente foi alterado por esta fase.

## 3. Inventário de referências (por fluxo)

### 3.1 `profiles.photo_url` / avatar

| # | Origem | Escrita | Leitura/consumo |
| --- | --- | --- | --- |
| 1 | `src/components/bio/bio-avatar.tsx:116-122` | upload em `avatars` (`UploadService.uploadAvatar`, path `${userId}/{uuid}.jpg`) → `supabase.storage.from("avatars").getPublicUrl(path)` → grava **URL pública** em `photo_url`. | `bio-avatar.tsx:68,106`; `_app.home.tsx:98`; `_app.pessoas.tsx:97-99`; `_app.connecta.tsx:176-178`; `_app.solicitacao.$id.tsx:514-545`; `presence-live-feed-real.tsx:114-116`; `chat/ConnexyChatScreen.tsx:211`; `reel-card.tsx:158,211`; `comments-sheet.tsx:137`. |
| 2 | `src/routes/completar-perfil.tsx:247-253` | upload em `avatars` → `createSignedUrl(path, 60*60*24*365*5)` → grava **URL assinada (5 anos)** em `photo_url` (`:262`). | idem acima (campo único, formatos mistos). |
| 3 | `src/lib/adapters/schema-a/profile.ts:106,124` | mapeia `profile.photo` → `photo_url` **verbatim**. | `profile.ts:176` (`photo: publicRow.photo_url`) → `DemoOwnProfile.photo`. |
| 4 | `src/lib/profile/schema-a-profile.ts:150` | remove `photo_url` do patch quando `isLocalMediaUrl(profile.photo)` (evita gravar data/blob). | — |

- **Bucket:** `avatars` (5 MiB, `image/jpeg|png|webp`).
- **Formato armazenado:** URL pública **ou** URL assinada de 5 anos (`completar-perfil`). Legado.
- **Autenticação:** `profiles` SELECT apenas `authenticated` (migration `20260825025605`). Bucket
  `avatars` é público.
- **Confiança:** **confirmado** para escrita/leitura; **desconhecido** se produção realmente contém
  URLs assinadas antigas.

### 3.2 `bio_posts.media_url`

| Origem | Escrita | Leitura/consumo |
| --- | --- | --- |
| `src/components/bio/bio-posts.tsx:39-53` | upload em `bio-media` → `getPublicUrl` → grava **URL pública**; `media_kind = "image"`. | `bio-posts.tsx:296-299` (`<img src>`); `_app.perfil.$id.tsx:89`. |
| `bio-posts.tsx:131-140` | troca de mídia: novo upload → **URL pública**; remove objeto antigo via `extractStoragePathFromUrl` (`:141-148`). | idem. |
| `src/lib/mcp/tools/create-moment.ts:13,27` | aceita `media_url` de **URL externa arbitrária** (`z.string().url()`) e grava direto. | `list-my-moments.ts:19` lê `media_url`. |
| `src/lib/adapters/schema-a/content.ts:56-79` | (Schema A) `mediaToJson`/`mediaFromJson` — ver 3.4. | — |

- **Tabela:** `bio_posts` (criada em `20260709023719…:56-64`): `media_url TEXT`, `media_kind TEXT
  CHECK (image|video)`. RLS `"Bio posts are public" USING (true)` e GRANT SELECT a `anon`.
- **Bucket:** `bio-media` (10 MiB). **Formato:** URL pública ou URL externa arbitrária.
- **Autenticação/privacidade:** tabela legada é **pública para todos** (inclusive `anon`). Não há
  vínculo entre privacidade da publicação e acesso ao objeto — **incompatível** com o modelo
  `PUBLIC/CONNECTIONS/PRIVATE` do Schema A.
- **Confiança:** **confirmado** (código/migration); objeto existir no Storage = **desconhecido**.

### 3.3 `reels.video_url` / `reels.poster_url`

| Origem | Escrita | Leitura/consumo |
| --- | --- | --- |
| `src/lib/reels/reel-publish.ts:127-145` | upload em `reels-media`, path `${user.id}/${reelId}.{ext}` e `${user.id}/${reelId}-poster.jpg`; grava **caminho relativo** em `video_url`/`poster_url`. | `reel-feed.ts:75-81` (build via `getReelVideoUrl` local); `reel-publish.ts:211-214`. |
| `src/lib/adapters/schema-a/content.ts:130-131` | `toRemoteReelInsert` grava `media.videoUrl`/`media.posterUrl` **verbatim** (string recebida). | `components/reels/reel-card.tsx:111-112` (`src={reel.video_url}`); `routes/_app/reels/$reelId.tsx:264-265`; `reel-player.tsx:42-43,93`. |
| `src/lib/reels/reel-mocks.ts` | fixtures com **URLs externas** (Pexels/Unsplash). | tela de Reels em demo. |

- **Tabela:** `reels` (colunas base anteriores; `video_url` não-nulo, `poster_url` nullable —
  `supabase/schema-a.generated.ts:968-1002`). RLS `reels_select_authenticated USING (true)`.
- **Bucket:** `reels-media` (50 MiB). **Formato:** caminho relativo (novo) **ou** string do adapter.
- **Consumo:** componentes passam o valor direto como `src`. Se for caminho relativo, **não é uma
  URL** — o render remoto provavelmente falha hoje e dependerá de assinatura.
- **Confiança:** **confirmado** para o adapter local; comportamento de render remoto = **inferido**.

### 3.4 `posts.media` (Schema A, jsonb)

| Origem | Escrita | Leitura/consumo |
| --- | --- | --- |
| `src/lib/adapters/schema-a/content.ts:56-62` (`mediaToJson`) | grava `{ preview, type, mediaId? }` — **sem** `bucket`/`path`/`posterPath`. | — |
| `src/lib/adapters/schema-a/content.ts:64-79` (`mediaFromJson`) | **descarta item cujo `preview` não seja string**. | `content.ts:103` (`toDomainPost`). |
| `src/routes/_app/create-post.tsx:38-42` | publica item com `preview: ""` e `mediaId` (id local OPFS), via `saveLocalMedia`. | `_app.perfil.index.tsx:975,996` (`LocalMediaFrame mediaId/fallbackUrl`). |
| `src/lib/media/media-contract.ts:137-182` | `normalizePostMedia`/`classifyPostMedia` (G1) preservam itens sem `preview` se `(bucket,path)` válido; itens sem identidade são descartados. | `happening-now.ts:260` (`post.media[0]?.preview`); `post/demo-post-detail.tsx:105-107`. |

- **Tabela:** `posts` (`media jsonb NOT NULL DEFAULT '[]'`; `privacy` CHECK
  `PUBLIC|CONNECTIONS|PRIVATE`), RLS `posts_select_privacy` = `PUBLIC OR author OR (CONNECTIONS AND
  are_connected)` (`20260925030806…:750-782`).
- **Formato atual:** `preview` (data URL local **ou** vazio) + `mediaId`; **não** é referência de
  Storage. **Bucket:** nenhum (identidade ausente).
- **Risco:** publicação Schema A não guarda `(bucket,path)`; uma futura assinatura **não consegue
  resolver** esta mídia sem mudança de contrato (ajuste D-M1 adiado).
- **Confiança:** **confirmado**.

### 3.5 Mídia local (IndexedDB / OPFS / demo)

- `src/lib/media/local-media-storage.ts` — OPFS primário (`connexy-media/…`), IndexedDB de metadados,
  fallback de Blob; Object URLs temporárias (`:1-6,376-390`).
- `src/lib/reels/reel-local-media-db.ts` — mídia de Reels local (referenciado por `reel-publish.ts`).
- Persistência de perfis salvos: `_app.perfil.index.tsx:78,277` (`SAVED_PROFILE_MEDIA_KEY` em
  `localStorage`).
- **Formato:** `mediaId` + blob/OPFS; Object URL (`blob:`). **Nunca** ir para Storage remoto.

### 3.6 Uploads, helpers e adapters

- `src/services/upload.service.ts` — `uploadMedia/uploadAvatar/uploadPostMedia`, `getPublicUrl`,
  `extractStoragePathFromUrl` (`:51-64`, marker `/storage/v1/object/public/`). Buckets suportados:
  `avatars`, `bio-media` (`BUCKETS :44-47`). **Não** inclui `reels-media`.
- `src/lib/supabase/storage.ts` — wrapper `supabase.storage.from(bucket)` (`getPublicUrl`,
  `upload`, `remove`, `list`).
- `src/lib/storage/schema-a-storage.ts` — contrato de origem: `{ownerId}/{purpose}/{objectId}.{ext}`,
  `SCHEMA_A_STORAGE_BUCKETS`, `ownerIdFromStoragePath`, `isRemoteMediaPath`, `isSchemaAStorageEnabled`.
- `src/lib/media/media-path.ts` — validação/parse canônico (G1): `parseStorageUrl`, markers
  `/object/public/` e `/object/sign/`, origem confiável.

### 3.7 MCP

- `src/lib/mcp/tools/create-moment.ts` — entrada `media_url` **URL arbitrária**; grava em
  `bio_posts.media_url`. Sem validação de origem/owner.
- `src/lib/mcp/tools/list-my-moments.ts` — lê `media_url` de `bio_posts`.

### 3.8 Outras referências de mídia

- `catalog.repository.ts:103,123` / `catalog.ts:106,125` — `photo_url` de catálogo (mesmo padrão de
  URL), sem bucket dedicado. `places.cover_url` usa **URLs externas** (Unsplash) em seeds.
- `messages.media_bucket` + `messages.media_path` (`20260819180000…:67-77`) — **configuração
  estruturada** `(bucket,path)` (exemplo pré-existente do padrão canônico). RLS por participante da
  conversa. **Nenhum bucket próprio** de anexos foi criado (`SCHEMA_A_DEFERRED_BUCKETS`).
- Chat/attachment demo: blob local (`phase-15-video-preview`, `chat-attachment-experience`).

## 4. Classificação das referências

| Formato | Onde | Determinístico? |
| --- | --- | --- |
| Caminho relativo de Storage | `reels.video_url`/`poster_url` (novo), `schema-a-storage` | **Sim** (prepend bucket + assinatura). |
| URL pública do Supabase | `profiles.photo_url` (bio-avatar), `bio_posts.media_url`, `catalog.photo_url` | **Sim**, extraindo `bucket`+`path` do pathname; **mas** perde-se a relação com `ownerId`/publicação. |
| URL assinada | `profiles.photo_url` (`completar-perfil`, 5 anos) | **Parcial**: o path é extraível, o token expira; **não** re-assinar sem autorização. |
| URL de domínio/CDN externo | `places.cover_url`, `reel-mocks`, `create-moment` MCP | **Não** (não é Supabase; converter exigiria download/reupload). |
| URL local/blob | `mediaId`/`blob:` (OPFS, IndexedDB, previews) | **Não** (nunca migra para Storage). |
| Estruturada `(bucket,path)` | `messages.media_bucket/path`; contrato G1 (`media-contract.ts`) | **Sim** (formato-alvo). |
| Inválido/desconhecido | item `posts.media` com `preview:""`+`mediaId`; URL externa em `path` | **Não** sem dados adicionais. |

Separadamente:

- **Conversão determinística:** caminho relativo de Reels; URL pública/assinada do Supabase
  (extração `bucket`+`path`).
- **Precisa consultar dados adicionais:** relação `path`→`author_id`/`privacy` para autorizar;
  existência real do objeto (só fase integrada).
- **Sem informação suficiente:** `posts.media` sem `(bucket,path)`; `create-moment` com URL externa;
  `photo_url` sem dono confiável.
- **Podem parar de funcionar se os buckets ficarem privados:** todas as URLs públicas acima, os
  caminhos de Reels renderizados sem assinatura e `photo_url` públicos.

## 5. Inventário de buckets e políticas (somente arquivos locais)

| Bucket | `public` (config) | Tamanho | MIME | SELECT `storage.objects` | INSERT | UPDATE/DELETE |
| --- | --- | --- | --- | --- | --- | --- |
| `avatars` | `true` (`config.toml:16-19`) | 5 MiB | jpeg/png/webp | `Avatars authenticated read` → `USING (bucket_id='avatars')` (`20260825025843…`) | `Avatars owner upload` (`foldername[1]=uid`) | owner folder |
| `bio-media` | `true` (`config.toml:6-9`) | 10 MiB | jpeg/png/webp/gif | `Bio media authenticated read` → `USING (bucket_id='bio-media')` (`20260825025605…`) | `Bio media auth upload` (`20260709023757…`) | owner folder |
| `reels-media` | `true` (`config.toml:11-14`) | 50 MiB | mp4/quicktime/webm/jpeg | `Reels media authenticated read` → `USING (bucket_id='reels-media')` (`20260825025605…`) | `Reels media auth upload` (`20260810182822…`) | owner folder |

Pontos-chave:

- **SELECT é por bucket e por estar autenticado — não por dono, não por publicação.** Assim, um
  usuário autenticado pode assinar/baixar **qualquer** objeto dos três buckets. É **mais amplo** que
  a RLS de `posts` (que é por `privacy`). Isto é a lacuna central que D-M3 endereça.
- **`public=true` torna a policy de SELECT irrelevante para leitura anônima via
  `/object/public/…`.** Enquanto os buckets forem públicos, "mídia autenticada" não é proteção.
- `profiles` é **authenticated-only** (`20260825025605:24-30`); `bio_posts` é **público** inclusive
  `anon` (`20260709023719:65-69`).
- Migrations **não** alteram `storage.buckets.public` para `false` em nenhum ponto.
- **O estado de produção não pode ser inferido destes arquivos.** `supabase/config.toml` aponta
  `project_id = "rsukwuqocgjmwwuwtqaf"`, mas isso é configuração local — não é prova de que os
  buckets/policies em produção coincidem.

## 6. Conhecido vs. desconhecido

**Conhecido (código/migrations locais):** formatos gravados, buckets, policies, consumidores,
lacunas de autorização, ausência de vínculo `bio_posts`×privacidade.

**Desconhecido (exige fase integrada autorizada):** existência/quantidade de objetos; se há URLs
assinadas antigas em `photo_url`; se há itens `posts.media` legados com `(bucket,path)`; se
`/object/public/` realmente ignora a RLS como esperado; se a auto-assinatura é bloqueada após
revogar SELECT (hipóteses C6); estado real de policies em produção.

## 7. Matriz de compatibilidade e risco

Legenda de risco: **Q** = quebra visual/funcional; **C** = confidencialidade (vazamento/acesso
indevido). "Mecanismo de recuperação" assume autorização de C2.

| Tipo de mídia | Referência atual | Localização | Hoje | Após bucket privado | Migração? | Risco Q | Risco C | Recuperação | Teste necessário |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Avatares (bio-avatar) | URL pública em `photo_url` | `bio-avatar.tsx:118-122` | Renderiza | **Quebra** (URL pública inválida) | Sim (→ path + assinatura) | Alta | Média (público hoje) | Re-assinar por `path` extraído | C6: dono/troca/público |
| Avatar (completar-perfil) | URL assinada 5 anos | `completar-perfil.tsx:247-262` | Renderiza até expirar | Continua até expirar; **não regenerável** | Sim | Média | Alta (token de 5 anos persistido) | Backfill para path + assinatura curta | Expiração/rotação |
| Publicação pública (`bio_posts`) | URL pública `media_url` | `bio-posts.tsx:45,133` | Renderiza | **Quebra** | Sim | Alta | Alta (tabela pública `anon`) | Backfill bucket+path | Anônimo negado |
| Publicação Schema A `PUBLIC` | `preview`/`mediaId` | `content.ts:56-79`; `create-post.tsx:38-42` | Mídia local só no cliente | **Não resolvível remotamente** (sem `(bucket,path)`) | Sim (contrato D-M1) | Alta | Baixa | Reescrever itens com `(bucket,path)` | Isolamento `PUBLIC` vs `CONNECTIONS` |
| Publicação `CONNECTIONS` | idem | idem + RLS `posts_select_privacy` | Não modelado p/ mídia | **Não resolvível** | Sim | Alta | Média (SELECT por bucket) | Autorização por publicação (D-M3) | Usuário conectado vs não |
| Publicação `PRIVATE` | idem | idem | idem | **Não resolvível** | Sim | Alta | Alta | idem | Terceiro negado |
| Reels vídeo/capa | caminho relativo | `reel-publish.ts:127-145` | Render **sem assinatura** (provável falha remota) | **Quebra** se não assinado | Sim (assinar) | Alta | Média (SELECT por bucket) | Resolver assinado (G1) | Render + expiração |
| URLs assinadas antigas | `photo_url` | `completar-perfil.tsx` | Válidas até expirar | Continuam até expirar | Sim (backfill) | Baixa | Alta | Rotacionar p/ assinatura curta | Token não em log |
| Mídia local/demo | `mediaId`/`blob:` | `local-media-storage.ts` | Só no navegador | Inalterado | Não | Baixa | Baixa | n/a | Não vazar p/ Storage |
| MCP `media_url` | URL externa arbitrária | `create-moment.ts:13,27` | Grava qualquer URL | Inalterado | Sim (re-hospedar/validar) | Média | Média (URL externa/rastreamento) | Validar origem + reupload | URL externa rejeitada |
| Catálogo/`places.cover_url` | URL externa | `catalog.ts`; seeds | Renderiza | Inalterado | Opcional | Baixa | Baixa | n/a | n/a |

## 8. Plano de migração reversível (não executado)

Para cada etapa: **Pré-requisitos**, **Evidências exigidas**, **Sucesso**, **Abortar se**.

1. **Inventário e baseline dos objetos e referências.**
   - Pré: autorização de leitura integrada (C2/C6); acesso a um dump/consulta de `storage.objects`.
   - Evidências: lista de `(bucket, path, owner, size, created_at)` **agregada** (sem imprimir
     tokens), contagem por bucket e formato das referências nas tabelas.
   - Sucesso: 100% das referências de mídia classificadas como determinística/ambígua/externa/local.
   - Abortar: se a contagem de objetos divergir do inventário de referências sem explicação.

2. **Contrato canônico de mídia.**
   - Pré: revisão de `src/lib/media/media-contract.ts` (G1).
   - Evidências: `(bucket,path)` obrigatório para itens de Storage; `preview`/`mediaId` só
     legado/local.
   - Sucesso: `normalizePostMedia`/`classifyPostMedia` preservam todo item válido; testes verdes.
   - Abortar: se um formato legado legítimo não tiver caminho de conversão.

3. **Resolução das referências legadas ambíguas.**
   - Pré: etapa 1; script de extração `bucket`+`path` de URLs públicas/assinadas (sem rede).
   - Evidências: diff de patches propostos por tabela; lista de itens **não** convertíveis.
   - Sucesso: cada referência tem destino definido (path, reupload ou descarte justificado).
   - Abortar: se houver referência sem dono determinável e com risco de confidencialidade.

4. **Autorização por publicação e proprietário (D-M3).**
   - Pré: ADR G0/G0.2; `are_connected`/`posts_select_privacy` como base.
   - Evidências: regra `PUBLIC`(autenticado)/`CONNECTIONS`(`are_connected`)/`PRIVATE`(dono) aplicada
     à mídia, não só à linha.
   - Sucesso: testes C6 de negação passam; `authorizeMediaAccess` revalida dono e bucket×tipo.
   - Abortar: se a autorização de objeto depender de SELECT bucket-wide.

5. **Buckets privados e políticas mínimas.**
   - Pré: etapa 4 aprovada; **autorização explícita de C2**.
   - Evidências: `storage.buckets.public=false`; revogada SELECT bucket-wide; INSERT/UPDATE/DELETE
     owner-folder mantidos.
   - Sucesso: anônimo e não-autorizado não leem; dono/assinatura server-side leem.
   - Abortar: se qualquer leitura legítima depender de caminho público.

6. **Assinatura server-side (somente após C2).**
   - Pré: etapas 4–5; serverFn com credencial injetada (nunca no bundle).
   - Evidências: TTL ≤ 300s (D-M4), lote ≤ 100, sem token em log, respostas tipadas.
   - Sucesso: resolver integrado retorna URLs curtas apenas autorizadas.
   - Abortar: se exigir service-role no cliente.

7. **Validação de leituras autorizadas e negadas.**
   - Pré: etapa 6; matriz C6 (§9).
   - Evidências: resultados por caso (permitido/negado) em ambiente local autorizado.
   - Sucesso: todos os casos negativos negados; positivos servidos.
   - Abortar: se houver acesso indevido.

8. **Transição gradual dos consumidores.**
   - Pré: resolver disponível; flag de mídia (hoje OFF) habilitável por ambiente.
   - Evidências: migração por tipo (avatar → bio_posts → posts → reels → MCP), com fallback local.
   - Sucesso: nenhum consumidor lê `/object/public/` após o corte.
   - Abortar: se um consumidor não tiver caminho de assinatura.

9. **Critérios de corte e rollback.**
   - Corte (D-M5): **0 URLs `/public/`** em referências ativas; 0 erros de autorização; TTL curto
     confirmado.
   - Rollback **sem reabrir objetos**: restaurar referências/contrato anteriores e o comportamento
     compatível **sem** tornar buckets públicos novamente. Prioridade: reverter patches de dados e
     desligar a flag, mantendo buckets privados.
   - Abortar rollback público: **nunca** reabrir `public=true` como solução automática.

10. **Verificação pós-migração.**
    - Pré: etapa 8 concluída.
    - Evidências: varredura estática por `/object/public/`; testes C6 re-executados; auditoria de logs
      sem tokens.
    - Sucesso: corte mantido; nenhum vazamento.
    - Abortar: qualquer regressão de confidencialidade → rollback da etapa 9.

## 9. Plano de testes para C6 (propostos, não executados)

**Unitários (locais, sem rede):** escopo de cache obrigatório/isolamento entre viewers (G1.4);
`clampMediaUrlTtl`; `parseStorageUrl` origem/URL decodificada; `validateMediaPath`; `bucketSupportsKind`;
`authorizeMediaAccess` com dono/bucket×tipo; invalidação positiva/negativa e in-flight (G1.4).

**Integrados locais (dependem de stack Supabase local e autorização; hoje pendentes):**

1. Anônimo tentando obter mídia.
2. Proprietário acessando mídia própria.
3. Usuário conectado acessando publicação `CONNECTIONS`.
4. Usuário não conectado tentando `CONNECTIONS`.
5. `PRIVATE` acessada por terceiro.
6. Mudança de `PUBLIC` → `PRIVATE` (invalidar cache).
7. Desconexão/revogação de acesso (invalidar cache).
8. Objeto inexistente/removido.
9. Bucket/caminho arbitrários enviados pelo cliente.
10. Caminho pertencente a outro usuário.
11. Bucket incompatível com o tipo.
12. Expiração da URL assinada.
13. Acesso direto por `/storage/v1/object/public/`.
14. Ausência de tokens em logs.
15. Regressões em avatar/publicações/Reels.
16. Isolamento entre usuários no cache.

**Só após autorização específica:** 1–7 e 13 (exigem policies/buckets reais e C2); verificação de
`public=true` vs RLS e de auto-assinatura (C6).

## 10. Decisões ainda necessárias

- Autorizar (ou não) C2: `public=false` + revogar SELECT bucket-wide + serverFn de assinatura.
- Definir backfill de `photo_url`/`bio_posts.media_url` (URL → `(bucket,path)`) e destino de URLs
  externas do MCP.
- Aprovar alteração do contrato de `posts.media` (D-M1) para incluir `(bucket,path)`, incluindo
  decisão sobre itens hoje sem identidade.
- Definir se `bio_posts` legado será migrado para `posts`/Schema A ou descontinuado (ADR
  `adr-bio-posts-to-posts.md`).
- Definir política de rotação das URLs assinadas de 5 anos em `photo_url`.

## 11. Recomendação de próxima fase

**G3 — Verificação integrada autorizada (leitura) de C6 + baseline de objetos**, precedida de
**autorização explícita** para operações de leitura no projeto autorizado `rsukwuqocgjmwwuwtqaf`.
Sem essa autorização, permanecer em fases locais (ex.: aplicar o contrato D-M1 ao adapter sem
integrar UI/demo). **Não** avançar para a etapa 5 (buckets privados) antes de 4 e de C2.

## 12. Verificação final desta fase

- Nenhum serviço remoto acessado; nenhuma migration, bucket, política, flag ou dado alterado;
  `.env`/`.env.local`/`config.toml` intactos.
- Somente leitura de código/migrations + criação deste documento. HEAD `16f8c6b` inalterado;
  arquivos preexistentes preservados.
- Ambiguidade registrada como bloqueio: estado real de produção e existência de objetos são
  **desconhecidos** por análise estática.
