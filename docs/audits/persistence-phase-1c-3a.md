# Fase 1C-3A — Auditoria de Persistência de Reels

> Auditoria **somente de leitura e documentação**. Nenhum código de produto foi
> alterado nesta fase. Todas as conclusões apontam para a decisão GO/NO-GO da
> Fase 1C-3B (persistência de curtidas e comentários de Reels).

## 1. Resumo executivo

Curitdas e comentários de Reels vivem hoje **exclusivamente em localStorage**
(`connexy:reels:likes:v1` e `connexy:reels:comments:v1`), com identidade
global proveniente de `currentUser` (`src/lib/mock-data.ts`, ambiente de demo).
A mídia dos Reels publicados localmente vive em um IndexedDB próprio
(`connexy-reels-local-db`, store `media`) que a camada 1C-1 **intencionalmente
não toca**.

Existe schema Supabase completo e com RLS para `reels`, `reel_likes`,
`reel_comments` e bucket `reels-media` (migração `20260710014946`), porém **o
front-end só usa a tabela `reels` em dois pontos** (publicação e tool MCP
`list_my_reels`); **não existe nenhum código de leitura/escrita de
`reel_likes`** e o único caminho de `reel_comments` no Supabase
(`src/components/reels/comments-sheet.tsx`) está **dormente** (nunca é
importado por nenhuma rota).

A auditoria identificou **duplicidade de fluxo de publicação**: o botão "Criar
reel" principal navega para `/create` (fluxo **fake**, `usePublisherForm`, que
não persiste nada), enquanto o caminho real é `/gerenciar/novo-reel`
(`publishReel`, dual-write local + Supabase com fallback).

**Veredito:** NÃO é necessária refatoração arquitetural da camada 1C-1/Reels
para a 1C-3B. As adaptações são aditivas (migração de curtidas/comentários
para IndexedDB com schema versionado), com **GO condicionado** à correção de
2 gaps de UX de baixo risco observados (§21.3 e §21.4) e ao tratamento de
duplicidade do fluxo de publicação (§21.1) em fase futura, não nesta.

## 2. Objetivo e escopo desta auditoria

- Especificar a auditoria de **persistência de Reels, com foco em curtidas e
  comentários**, seus fluxos, fontes de verdade, durabilidade e relação com o
  Supabase.
- Servir de entrada para a decisão GO/NO-GO da Fase 1C-3B (implementação).
- Responder, em base verificável (arquivo:linha), as perguntas do critério de
  sucesso (§20 de durabilidade).
- Registrar riscos, gaps e camada de isolamento da arquitetura 1C-1 em relação
  ao domínio de Reels.

## 3. Regras impostas (o que foi e o que não foi alterado)

**Não foi feito, por deliberação desta fase:**
- Nenhuma criação de repositório, store, esquema ou migração.
- Nenhuma migração de curtidas/comentários/Reels de localStorage/IndexedDB.
- Nenhuma remoção de localStorage/IndexedDB existente.
- Nenhuma alteração em Supabase (login, link, SQL, migrations, buckets).
- Nenhuma alteração de UI, rotas, publicação ou código de Reels.
- Nenhuma instalação de dependência e nenhum commit/push.

**O que foi feito:** apenas leitura de código e a criação/atualização de
documentação de auditoria (`docs/audits/persistence-phase-1c-3a.md` e
referências cruzadas).

## 4. Inventário do domínio de Reels (arquivos)

Modelo/tipos:
- `src/lib/reels/reel-types.ts` — tipos do domínio.
- `src/lib/reels/reel-utils.ts` — formatação, hashing de texto.

Persistência:
- `src/lib/reels/reel-local-storage.ts` — curtidas, comentários, som e
  metadata dos publicados (localStorage).
- `src/lib/reels/reel-local-media-db.ts` — mídia (IndexedDB dedicado).
- `src/lib/reels/reel-publish.ts` — adapter de publicação (local + Supabase).
- `src/lib/reels/reel-feed.ts` — feed unificado.
- `src/lib/reels/reel-mocks.ts` — mocks estáticos com URLs externas.

Lógica pura (sem persistência):
- `src/lib/reels/reel-comments.ts` — árvore/ordenação de comentários.
- `src/lib/reels/reel-ranking.ts` — ordenação/engajamento.
- `src/lib/reels/reel-filter.ts` — filtros.
- `src/lib/reels/reel-share.ts` — opções e URL de compartilhamento.
- `src/lib/reels/reel-context.ts` — contexto ancorado (local/negócio/oferta/
  evento/corrida).
- `src/lib/reels/reel-actions.ts` — mapeamento de ações por categoria.
- `src/lib/reels/reel-limits.ts` — limites de publicação.

Rotas:
- `src/routes/_app.reels.tsx` — feed vertical (tab Reels).
- `src/routes/_app/reels/$reelId.tsx` — página de detalhe.
- `src/routes/_app.gerenciar.novo-reel.tsx` — publicação real.
- `src/routes/_app/create/reel.tsx` — criação por fluxo fake.

Componentes de UI:
- `src/components/reels/reels-feed.tsx`, `reel-player.tsx`,
  `reel-actions.tsx`, `reel-overlay.tsx`, `reel-likes.tsx` (não utilizado),
  `reel-comments-sheet.tsx`, `reel-comment-item.tsx`, `reel-comment-input.tsx`,
  `comments-sheet.tsx` (dormente, Supabase), `reel-share-sheet.tsx` e demais
  apresentacionais (`reel-user`, `reel-music`, `reel-location`,
  `reel-tags`, `reel-hashtags`, `reel-follow-button`, `reel-save-button`,
  `reel-connect-button`, `reel-loading`).

Hooks e integração:
- `src/hooks/use-active-reel-playback.ts` — reprodução (sem persistência).
- `src/lib/engine/engine-reels.ts` — recomendações (puro).
- `src/lib/integration/integration-reels.ts` — evento/integração (puro).
- `src/lib/mcp/tools/list-my-reels.ts` — MCP que lê a tabela `reels`.

Código 1C-1 relevante (isolamento, §18):
- `src/lib/persistence/types.ts` (coleções reservadas), `errors.ts`,
  `serializer.ts`, `local/local-repository.ts`, `local/indexed-db.ts`,
  `local/local-storage.ts`, `queries.ts`.

## 5. Entidades e tipos do domínio (modelo de dados)

Fonte: `src/lib/reels/reel-types.ts`.

- `Reel` (`reel-types.ts:152`): `id`, `videoUrl`, `posterUrl`, `videos?`,
  `caption`, `category`, `author`, `music`, `location`, `business`, `event`,
  `driver`, `stats`, `hashtags`, `taggedUserIds`, `createdAt`, `likedByMe`,
  `savedByMe`.
- `ReelStats` (`reel-types.ts:78`): `likes`, `comments`, `shares`, `saves`,
  `views`, `duration` — **é o contador derivado**, não a fonte de verdade de
  likes/comentários do usuário.
- `ReelComment` (`reel-types.ts:64`): `id`, `text`, `authorId`, `authorName`,
  `authorPhoto`, `createdAt`, `likes`, `likedByMe`, `replies` — **modelo
  aninhado** (árvore de respostas).
- `ReelAuthor`, `ReelMusic`, `ReelLocation`, `ReelBusiness`, `ReelOffer`,
  `ReelEvent`, `ReelDriver`, `ReelCategory`, `ReelActionType`,
  `ReelCategoryMeta`, `ShareTarget`/`ShareOption`.

Observações:
- `Reel.likedByMe`/`savedByMe` são flags **por usuário**, mas hoje vinculadas a
  um único usuário global de demo.
- `ReelComment` não possui remoção/deleção, edição ou flag de autor na
  interface atual.

## 6. Fontes de verdade e duplicidades (matriz)

| Fonte | O que é verdade | Localização |
| --- | --- | --- |
| `MOCK_REELS` | Catálogo de Reels demo (conteúdo, stats base, autoria, contexto) | `src/lib/reels/reel-mocks.ts` (hardcoded) |
| `connexy:reels:likes:v1` | Likes do usuário local por reel | `reel-local-storage.ts:15` |
| `connexy:reels:comments:v1` | Comentários do usuário + demais feitos no dispositivo | `reel-local-storage.ts:16` |
| `connexy:reels:published:v1` | Metadata dos Reels publicados via `publishReel` | `reel-local-storage.ts:18` |
| `connexy-reels-local-db` / store `media` | Blobs de vídeo/pôster dos publicados | `reel-local-media-db.ts:13-15` |
| Tabelas `reels`/`reel_likes`/`reel_comments` + bucket `reels-media` | Schema remoto (opt-in, autenticado) | migrations `20260710014946`/`20260810182822` |

**Duplicidades identificadas:**
1. `stats.likes`/`stats.comments` dos mocks são **fixos**; os likes/comentários
   persistidos nas chaves locais são somados **por derivação** na camada de
   visão (feed `viewReels`, `_app.reels.tsx:132-144`) — não há uma única fonte
   unificada de contagem.
2. `SEED_COMMENTS` (3 comentários de demonstração) é **hardcoded na rota**
   (`_app.reels.tsx:41-75`) e replicado só na visão do `reel-001`
   (`_app.reels.tsx:148-150`); não é persistido nem centralizado.
3. Há **dois fluxos de publicação**: `/gerenciar/novo-reel` (persiste) e
   `/create` (não persiste) — ver §10–§11.
4. `comments-sheet.tsx` duplica o comportamento de `reel-comments-sheet.tsx`,
   porém com backend Supabase e nunca é usado — duplicidade dormente.

## 7. Camada de persistência local — visão geral

Persistência do domínio de Reels é **independente da camada 1C-1**:

- 1C-1 = chat/conversas, Gist e futuras coleções (IndexedDB gerenciado),
  com store reservada por domínio e serialização JSON segura.
- Reels = quarteirão próprio: localStorage (metadados/curtidas/comentários) +
  IndexedDB dedicado para mídia.

Consequência: a regra do §3 (não tocar armazenamento de Reels) preserva a
coexistência. A 1C-3B não deve reutilizar os repositórios 1C-1 para replicar a
mídia (Blob) — o serializer 1C-1 **não suporta Blob/File** (§18); a mídia deve
permanecer em `connexy-reels-local-db` ou na nova schema de Reels, se a fase
futura decidir consolidar.

## 8. IndexedDB dedicado dos Reels (connexy-reels-local-db)

Fonte: `src/lib/reels/reel-local-media-db.ts`.

- `DB_NAME = "connexy-reels-local-db"`, `DB_VERSION = 1`,
  `STORE_NAME = "media"`, keyPath `id` (`reel-local-media-db.ts:13-15,39`).
- `ReelMediaRecord`: `id`, `videoBlob` (Blob), `videoType`, `posterBlob`
  (Blob|null), `posterType`, `storedAt` (`:17-24`).
- API: `openDb()` guarda `typeof indexedDB === "undefined"`
  (`:28-46`), `withStore()` (`:48-61`), `saveReelMedia` (`:72`),
  `getReelMedia` (`:84`), `getReelVideoUrl`/`getReelPosterUrl` (`:95,105`),
  `listStoredReelIds` (`:116`), `deleteReelMedia` (`:122`, revoga object URLs).
- Cache de sessão (`objectUrlCache`, `recordCache`, `:65-66`), com revogação de
  URLs em `saveReelMedia`/`deleteReelMedia`.
- Nunca persiste base64 em localStorage; Blobs só viram `URL.createObjectURL`
  para exibição.

Nota: `connexy-reels-local-db` não participa das `RESERVED_COLLECTIONS` da
camada 1C-1; é um banco **externo** ao gerenciador 1C-1.

## 9. localStorage de Reels (chaves e contratos)

Fonte: `src/lib/reels/reel-local-storage.ts`.

| Chave | Formato | Contrato |
| --- | --- | --- |
| `connexy:reels:likes:v1` (`:15`) | `LikesMap = Record<reelId, boolean>` | curtiu ou não, por reel |
| `connexy:reels:comments:v1` (`:16`) | `CommentsMap = Record<reelId, ReelComment[]>` | comentários por reel |
| `connexy:reels:sound:v1` (`:17`) | `"on"` \| `"off"` | preferência de som |
| `connexy:reels:published:v1` (`:18`) | `{ version: 1, items: StoredPublishedReel[] }` | metadata dos publicados |

- Parse seguro (`safeGet`/`safeSet`/`parseRecord`, `:22-50`), tolerante a
  localStorage indisponível/cheio.
- Likes: `getReelLikes`/`isReelLiked`/`toggleReelLike` (`:56-76`), com
  inversão de estado e gravação imediata.
- Comentários: `getReelComments`/`getCommentsForReel`/`normalizeCommentText`/
  `addReelComment`/`toggleCommentLike` (`:82-141`), máx. 280 caracteres
  (`MAX_COMMENT_LENGTH`, `:20`). `addReelComment` cria IDs `c-<ts>-<rand>`
  e autoral completo a partir de `currentUser` (`:110-120`).
- Som: `getStoredSoundPref`/`setStoredSoundPref` (`:145-154`).
- Publicados: `getStoredPublishedReels`/`saveStoredPublishedReel`/
  `deleteStoredPublishedReel` (`:184-202`), com `ReelContextRef`
  `{ tipo, id, titulo }` — contexto armazenado como referência, não a
  entidade completa (`:163-169`); `ReelPersistence = "supabase" | "local"`.

### Durabilidade
- Likes e comentários sobrevivem a reload (leitura síncrona em montagem do
  componente: `_app.reels.tsx:84-87`).
- **Escopo da chave é global (não por usuário)**: não há `user_id` nas chaves —
  todos os usuários de um mesmo navegador compartilham o mesmo conjunto. Em
  ambientes com vários perfis locais isso conflita.
- Não há limpeza de curtidas/comentários órfãos quando um reel publicada é
  deletado (`deleteStoredPublishedReel` só remove a metadata).

## 10. Publicação de Reels (publishReel)

Fonte: `src/lib/reels/reel-publish.ts`.

Fluxo (`publishReel`, `:134-187`):
1. Gera `reelId` (`reel-ts-rand`, `:89-91`) e `author` a partir de
   `currentUser` (`:77-87`).
2. Se `isSupabaseConfigured()` (**somente** `VITE_APP_SUPABASE_URL` +
   `VITE_APP_SUPABASE_PUBLISHABLE_KEY`, `:93-98`), tenta publicação remota
   via `publishToSupabase`:
   - `supabase.auth.getUser()` — falha se não autenticado (`:101-103`);
   - upload do vídeo em `/reels-media/{user.id}/{reelId}.{ext}` (`:105-110`);
   - upload opcional do pôster (`:112-119`);
   - `insert` na tabela `reels` (`:121-131`);
   - **qualquer falha remota → throw → fallback local** (nunca finge upload);
     o `persistence` reflete o resultado: `"supabase" | "local"` (`:140-147`).
3. Grava **sempre** a mídia no IndexedDB de Reels e a metadata no localStorage
   (`:149-167`) — ou seja, há dupla escrita mesmo quando o remote funciona
   (por design, para exibição offline/feed unificado).
4. Reconstrói a URL de exibição e devolve `{ reel, persistence }`
   (`:169-187`).

Validação: `validateReelVideo` (`:48-60`) — `empty`/`type`/`size`/`duration`
(usando `reel-limits.ts`: 250 MB, 90 s, extensões mp4/mov/webm).

UI do caminho real (`src/routes/_app.gerenciar.novo-reel.tsx`):
- Estados `idle/validating/uploading/saving/saving_local/success/error`
  (`:29-30`); `publishReel` é chamado e o toast informa
  `"Reel publicado!"` (Supabase) ou `"Reel salvo neste dispositivo (modo de
  desenvolvimento)"` (local) (`:193-197`); navega para `/reels/$reelId`.
- `buildContextOptions` deriva contextos (local/negócio/oferta/evento) dos
  `MOCK_REELS` (`:46-64`).
- Entrega clara do destino: linha "Supabase (com fallback local)" quando
  configurado (`:379-381`).

## 11. Dois caminhos de publicação (duplicidade de fluxos)

Fonte: `src/components/publisher/usePublisherForm.ts` não aciona persistência;
`src/routes/_app/create/reel.tsx` apenas consome `usePublisherForm`.

| Aspecto | `/gerenciar/novo-reel` | `/create` (reel) |
| --- | --- | --- |
| Módulo | `reel-publish.publishReel` | `usePublisherForm` (fake) |
| Persiste | Sim (local + Supabase com fallback) | **Não** (setTimeout ~800 ms + toast) |
| Acesso | Menu "gerenciar" | Botão "Criar reel" do feed |
| Observação | Caminho por design | **Vetor de confusão**: não há onde o usuário veja o reel criado no feed |

Consequência:
- O botão principal do feed (`_app.reels.tsx:376-383`) vai para `/create`, o
  caminho que **não persiste** → reels "publicados" por ali desaparecem em
  qualquer reload e não aparecem no feed unificado.
- A auditoria classifica isso como **dívida de UX/fluxo (MÉDIO-AlTO)**; o
  tratamento (unificação) está **fora do escopo da 1C-3B** e deve ser uma fase
  própria de correção de produto.

## 12. Feed unificado (published + mocks)

Fonte: `src/lib/reels/reel-feed.ts` (lido integralmente nesta auditoria).

- `getReelFeed()` combina `getStoredPublishedReels()` (metadata local) com
  `MOCK_REELS` (ecossistema), **sem duplicar ids**, com os publicados mais
  recentes primeiro.
- `buildPublishedReel()` hidrata a metadata de um reel publicado localmente em
  um `Reel` completo, resolvendo vídeo/pôster via URLs de objeto do
  `reel-local-media-db` e derivando contexto a partir do `MOCK_REELS` matcher
  (contextos `local`/`negocio`/`oferta`/`evento`).
- `getReelById()` serve tanto o feed quanto a página de detalhe
  (`$reelId.tsx:49`).

Nota: o feed não infla `stats.likes`/`stats.comments` com os dados
persistidos — isso é feito **na rota** via `viewReels` (derivação, §6 e §15).

## 13. Curitdas — fluxo completo

Escrita (interação):
- Feed: `ReelActions.onLike` → `ReelsFeed.onToggleLike` →
  `handleToggleLike(reelId)` (`_app.reels.tsx:152-155`) → `toggleReelLike`
  (`reel-local-storage.ts:70`) → `setLikeMap` (estado) → re-render.
- Detalhe: `handleToggleLike` (`$reelId.tsx:90-102`) idem.
- Duplo toque no vídeo dispara `heartBurst` e like
  (`reel-player.tsx:61-76`; `$reelId.tsx:65-88`).

Leitura (montagem):
- `likeMap` inicia com `getReelLikes()` (`_app.reels.tsx:84`); no efeito de
  carga do feed aplica `likedByMe: storedLikes[r.id] ?? r.likedByMe`
  (`_app.reels.tsx:98-119`).

Derivação de contador:
- `viewReels` (`_app.reels.tsx:132-144`): `baseLikes = stats.likes − (likedByMe)`
  e `likes = baseLikes + (liked por mim ? 1 : 0)` — o "like do usuário" é
  **fabricado por consistência** em cima dos stats do mock.
- Unicidade: `LikesMap` garante um like por reel por usuário do navegador
  (não há multi-contagem).

Persistência e durabilidade:
- Síncrona (localStorage), imediata a cada toggle; sobrevive reload.
- **Não existe leitura/escrita de `reel_likes` no Supabase em lugar nenhum do
  front-end** (o símbolo `reel_likes` só aparece em types/reserva/migração).

UI presentacional:
- `reel-actions.tsx` (feed) usa `reel.likedByMe` e `formatReelCount(stats.likes)`.
- `reel-likes.tsx` existe como componente genérico **sem uso** (dormente).

## 14. Comentários — fluxo completo

Escrita (interação):
- Feed: `ReelCommentsSheet.onAddComment` → `handleAddComment`
  (`_app.reels.tsx:179-192`) → `addReelComment` (localStorage, `:105-127`) →
  atualiza `commentMap` e incrementa `stats.comments`.
- Like em comentário: `onLikeComment` → `handleLikeComment`
  (`_app.reels.tsx:194-213`) → `toggleCommentLike` (localStorage,
  `:129-141`) — replica o estado otimista no `commentMap`.
- Página de detalhe: **gap** — `ReelCommentsSheet` é montado com
  `comments={[]}` e `onAddComment/onLikeComment` **no-op**
  (`$reelId.tsx:333-340`). Comentários visíveis no detalhe = nenhum.

Leitura (montagem):
- `commentMap` inicia com `getReelComments()` (`_app.reels.tsx:85-87`).
- Visão: `openComments` mistura `SEED_COMMENTS` (só para `reel-001`) com os do
  storage (`_app.reels.tsx:148-150`).

Seed e árvore:
- `SEED_COMMENTS` hardcoded na rota (3 itens, `c1`–`c3`) — fonte duplicada
  (§6), não persistida.
- `reel-comments.ts` fornece `getTopLevelComments/getReplies/buildCommentTree`
  e ordena por `recent` (createdAt desc) ou `popular` (likes desc) — porém o
  sheet atual **não renderiza a árvore** (apenas itens de primeiro nível; a
  resposta `replies` existe no tipo mas não é usada na UI).

Max. 280 caracteres, texto normalizado, autor = `currentUser`.

Persistência e durabilidade:
- Síncrona (localStorage), sobrevive reload.
- **Caminho Supabase `comments-sheet.tsx` dormente** (lê/insere `reel_comments`
  com join `profiles:author_id(name, photo_url)`, mas **nenhuma rota o
  importa** — `grep CommentsSheet` retorna apenas a definição).

## 15. Contadores agregados (stats) e derivações

- `reel-ranking.ts:31-33` usa `engagementScore = likes×1 + comments×2 +
  shares×3` para ordenação `sortSmart`/`sortByPopularity` — sobre `stats`
  derivados da visão (feed), **não** sobre a fonte persistida.
- Nos mocks, `stats.likes/comments/shares/saves/views` são constantes
  hardcoded; a contribuição real do usuário (locally) chega por derivação em
  `viewReels` (feed) e nas rotas individuais (detalhe/`${id}`).
- Implicação para a 1C-3B: **sem agregado global**, o número exibido de
  "curtidas" não reflete outras pessoas além do usuário local — é um valor de
  demonstração. Qualquer solução futura precisa decidir se (a) mantém os stats
  mockados como base e soma interação local (estado atual) ou (b) adota
  contadores gerenciados (local e depois remoto).

## 16. Identidade de usuário

- Local/feed: `currentUser` (`@/lib/mock-data`) é ÚNICO e **global** ao app —
  usado em `reel-publish.ts` (`:15,77-87`), `reel-local-storage.ts`
  (`:13,113-116`). Não há perfil por aba/sessão.
- Supabase (quando ativo): `auth.uid()` rege RLS e autorias
  (`reel-publish.ts:101-130`; policies §17).
- Conflito conhecido: se a 1C-3B persistir curtidas/comentários com
  `user_id`, precisa reconciliar a identidade de demo (`currentUser`) com a
  identidade autenticada (`auth.uid()`), ou persistir a **chave por usuário**
  (e.g. `connexy:reels:likes:{userId}:v2`) mantendo o estado atual para usuário
  não-autenticado.

## 17. Relação com Supabase (schema, storage, policies)

Migração `supabase/migrations/20260710014946…sql` (lida integralmente):
- `public.reels` (`id uuid pk`, `author_id`→profiles CASCADE, `video_url`,
  `poster_url`, `caption`, `place_id`→places SET NULL, `audio_label`,
  `tagged_user_ids uuid[]`, `duration_s`, `created_at`), índices
  `reels_created_at_idx`/`reels_author_idx`, RLS com SELECT pública e
  INSERT/UPDATE/DELETE do autor.
- `public.reel_likes` (`reel_id`+`user_id` CASCADE, PK composta, `created_at`),
  índice `reel_likes_reel_idx`, RLS: SELECT pública, "User can like"
  (INSERT check `auth.uid() = user_id`), "User can unlike" (DELETE
  `auth.uid() = user_id`).
- `public.reel_comments` (`id uuid pk`, `reel_id` CASCADE, `author_id`
  CASCADE, `text`, `created_at`), índice composto, RLS: SELECT pública, insert
  do autor, delete do autor.
- Storage bucket `reels-media`: policies `public read`, `auth upload`,
  `owner update`, `owner delete`.

Migrações complementares (`20260810182822…`, `20260825025605…`) reforçam
storage policies (leitura pública, upload por pasta `{auth.uid()}`).

Importante: o front-end **não tem código de curtida/comentário remoto**; o
então dormente `comments-sheet.tsx` é o único candidato a ser reativado para
`reel_comments`, e `reel_likes` não tem nenhum consumidor.

## 18. Compatibilidade com a camada 1C-1 e isolamento (Reels fora do escopo 1C-1)

- `src/lib/persistence/types.ts:127-128`: `reel_likes` e `reel_comments`
  **já estão reservadas** em `RESERVED_COLLECTIONS` — a 1C-3B pode usá-las
  como schema futuro sem conflito de nomes.
- `src/lib/persistence/local/indexed-db.ts`: declara explicitamente **não
  tocar** `connexy-reels-local-db` / store `media` (comentário no arquivo).
  Reveja os comentários da 1C-1 para confirmar a lista de exclusões.
- `src/lib/persistence/serializer.ts`: **não suporta Blob/File/Buffer** —
  mídia de Reels não pode passar pelo serializer 1C-1; deve manter-se no
  quarteirão próprio (ou em schema de Reels dedicado).
- Isolamento por arquitetura: nenhum arquivo do domínio de Reels importa a
  camada 1C-1, e nenhum arquivo 1C-1 importa Reels. Coexistência garantida.

## 19. Dados que NÃO devem ir para a nova persistência (daqui e da auditoria 1C-1)

- **Blobs de vídeo/pôster** não passam pelo serializer 1C-1 (§18); ficam no
  IndexedDB de Reels.
- `MOCK_REELS` (conteúdo demo) permanece como fonte estática — não é
  migrado; é matéria para a fase de produto (backend real).
- Metadata de contexto completa (não referência) — hoje guarda-se apenas
  `ReelContextRef` (§9); manter.
- Preferência de som (`connexy:reels:sound:v1`) é estado de UI — pode
  permanecer em localStorage.
- `stats` derivados dos mocks (§15) não entram como fonte primária na nova
  persistência enquanto existirem mocks.
- Nenhum dado do Supabase remoto deve ser baixado/copiado localmente nesta
  fase (regra operacional).

## 20. Durabilidade após reload (perguntas do critério de sucesso)

Respostas verificadas (arquivo:linha):

1. **Curitdas sobrevivem a reload?** Sim — chave localStorage, leitura em
   montagem (`_app.reels.tsx:84,98-119`).
2. **Comentários sobrevivem a reload?** Sim — `commentMap` inicializado de
   `getReelComments()` (`_app.reels.tsx:85-87`).
3. **Publicados locais sobrevivem a reload?** Sim — metadata em localStorage
   + mídia em IndexedDB; feed os reconstitui (`reel-feed.ts`,
   `getStoredPublishedReels`).
4. **Publicados remotos são lidos de volta na sessão?** Não automaticamente:
   o feed é local; o caminho remoto só existe para publicar (e para a tool
   MCP `list_my_reels`). Reels remotos não aparecem no feed unificado.
5. **Likes/comentários da página de detalhe persistem?** Sim, mas o detalhe
   **não os exibe** (gap §14).
6. **Unicidade de like por usuário?** Garantida no navegador (um perfil
   global de demo).
7. **Fonte única de contagem?** Não — há duplicidade mock × storage com
   derivação em `viewReels` (§6, §15).
8. **Curtidas/comentários replicam entre dispositivos?** Não (localStorage
   por navegador; sem `reel_likes`/`reel_comments` utilizados).
9. **Fallback de publicação sem perda?** Sim — escrita local sempre ocorre;
   falha remota degrada para `persistence: "local"` sem dados perdidos.
10. **Dados sensíveis em localStorage/IDB de Reels?** Não — apenas Blobs e
    metadata; sem JWT/secrets.

## 21. Problemas encontrados (observações e gaps)

1. **Fluxo de criação fake** (`/create` + `usePublisherForm`) não persiste
   nada; conflita com `/gerenciar/novo-reel` (dual path) — §11.
2. **Página de detalhe sem comentários**: `comments={[]}`, handlers no-op —
   §14 (gaps de produto confirmados; não bloqueiam 1C-3B).
3. **Seed de comentários hardcoded na rota** — duplicidade e "mock dentro de
   rota" (`_app.reels.tsx:41-75,148-150`).
4. **Contagem não síncrona entre canvas** (feed vs. detalhe): cada rota
   deriva `stats` independente; toggles não se propagam entre telas.
5. **Limpeza inexistente**: deletar um reel publicado não remove likes/
   comentários do storage (chaves orfãs).
6. **`reel-likes.tsx` e `comments-sheet.tsx` dormentes** — códigos mortos no
   domínio (eliminação/reativação em fase futura).
7. **`ReelComment.replies` não renderizado** — o tipo suporta respostas, a UI
   não.

## 22. Riscos priorizados

| Prioridade | Risco | Mitigação proposta (fase futura) |
| --- | --- | --- |
| ALTO | Duplo caminho de publicação; usuário perde o reel "criado" via `/create` | Unificar fluxos na mesma tela de publicação (`publishReel`) |
| ALTO | Likes/comentários sem `user_id`; múltiplos perfis compartilham o mesmo estado | Chaves por usuário (`:v2` com owner) na migração |
| MÉDIO | Seed e contadores duplicados; sem fonte única de `stats` | Banco de mocks + stats derivados centralizados |
| MÉDIO | Detalhe sem comentários navegáveis | Reutilizar `ReelCommentsSheet` na tela de detalhe |
| MÉDIO | Orfãos ao deletar reel | Cascata de limpeza nos repositórios de Reels |
| BAIXO | Componentes dormentes mantendo dívida | Remover/reativar de forma documentada |
| BAIXO | Backup de blobs em cache de sessão (object URLs) | Já revogado em save/delete; manter |

Nenhum risco implica refatorar a arquitetura 1C-1 ou quebrar a coexistência
com `connexy-reels-local-db`.

## 23. Decisão GO/NO-GO e escopo para a Fase 1C-3B

**GO (condicionado)** — a 1C-3B pode seguir como fase aditiva, **sem
refatoração arquitetural**, com:

1. **Novo schema de persistência de Reels** (repositories + stores versionadas)
   migrando curtidas e comentários do localStorage para IndexedDB com
   versionamento e owner (`userId`), mantendo leitura compatível com o modo
   demo não-autenticado.
2. Reutilização das **coleções reservadas** `reel_likes`/`reel_comments`
   (1C-1, `types.ts:127-128`) para nomes de store; mídia permanece em
   `connexy-reels-local-db`.
3. Duplo mecanismo de **derivação de contadores** centralizado (mock base +
   interação local), removendo a derivação espalhada nas rotas.
4. **Cascata de limpeza** (deletar reel → limpar likes/comments).
5. Manter `supabase.reel_comments/reel_likes` como candidatos a consumers
   futuros (reativar `comments-sheet.tsx` quando o produto autorizar).

**NO-GO (não fazer nesta fase):** migração de `MOCK_REELS`, mídia para o
serializer 1C-1, renomeação/substituição de `connexy-reels-local-db`, e
qualquer operação remota Supabase.

## 24. Validações e conformidade

- **Regras da fase:** nenhum código de produto alterado; somente
  documentação criada (`docs/audits/persistence-phase-1c-3a.md`).
- **Comparação de baseline** (referência: conversas/feed/chat da 1C-2):
  - `bunx tsc --noEmit` — sem erros novos (ver resultado na execução desta
    auditoria).
  - `bun run build` — sem erros novos.
  - `bun test` — suíte existente (55 testes) sem regressões.
  - `bun lint` — sem problemas novos em relação ao baseline
    (~503 problemas: ~483 erros, ~20 avisos, pré-existentes).
- **Git:** nada commitado; nenhuma força-push/rebase/amend; nenhum acesso ao
  Supabase remoto.