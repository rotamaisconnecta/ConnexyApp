# Fase 1C-3C-0 — Plano de integração da nova persistência de Reels ao Feed (Auditoria + Planejamento)

- **Data:** 2026-09-12
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Fases anteriores:** 1C-3A (auditoria de Reels) · 1C-3B (fundação IndexedDB `connexy-reels-data-local-db` + `ReelRepository`/`ReelLikeRepository`/`ReelCommentRepository`) · `docs/audits/persistence-architecture.md` (seção 13).
- **Natureza desta fase:** SOMENTE auditoria + planejamento. Nenhum código de produto ou comportamento foi alterado.

---

## 1. Objetivo

Responder com precisão, com base no código atual (reverificado nesta fase), a pergunta:

> "Sabemos exatamente como tirar os Reels, likes e comentários das fontes antigas e colocar tudo sob o controle dos novos repositories sem perda de dados, duplicação ou múltiplas fontes de verdade?"

Produzir o desenho técnico completo (seed, migração one-time, idempotência, falhas, identidade, contadores, mídia, publicação, ordem de implementação, fonte de verdade final) para a futura Fase 1C-3C — sem implementar nada dela.

---

## 2. Escopo

### Incluído

- Mapear `MOCK_REELS`, `StoredPublishedReel`, `publishReel`, `reel-local-storage`, `reel-local-media-db`, feed, detalhe, likes/comentários UI, `/gerenciar/novo-reel`, `/create`.
- Confirmar o estado da persistência nova (1C-3B).
- Analisar formato e migrabilidade de `connexy:reels:{likes,comments,published,sound}:v1`.
- Definir estratégia de seed, identidade, fonte de verdade, contadores, mídia, publicação e ordem da 1C-3C.
- Documentar decisões, riscos e itens fora do escopo em `docs/audits/persistence-phase-1c-3c-0.md`.

### Fora do escopo (proibido nesta fase)

- Alterar qualquer tela, rota, componente, publicação, `/create`, `$reelId`, Supabase, autenticação.
- Migrar dados, remover localStorage, conectar o Feed aos repositórios.
- Corrigir lint baseline ou fazer limpeza geral.

---

## 3. Estado atual (reverificado no código)

| Item | Onde | Observação |
| --- | --- | --- |
| `MOCK_REELS` | `src/lib/reels/reel-mocks.ts:21-707` | 15 Reels (`reel-001…reel-015`), content/catálogo demo |
| `Reel`/`ReelComment`/`ReelStats`… | `src/lib/reels/reel-types.ts` | Display types (vídeo, música, localização, stats, etc.) |
| `StoredPublishedReel` | `src/lib/reels/reel-local-storage.ts:173` | Metadata canônica dos publicados (localStorage) |
| `publishReel` | `src/lib/reels/reel-publish.ts:134` | Grava mídia em IDB `connexy-reels-local-db` + metadata em `published:v1` + (tentativa) Supabase |
| Reels local storage | `src/lib/reels/reel-local-storage.ts` | 4 chaves: `likes:v1`, `comments:v1`, `sound:v1`, `published:v1` |
| Media DB | `src/lib/reels/reel-local-media-db.ts` | `connexy-reels-local-db` / store `media` (Blobs); URLs via object URLs |
| Feed | `src/lib/reels/reel-feed.ts` | `getReelFeed()` = publicado (mídia IDB + metadata published:v1) + `MOCK_REELS`, dedup por id |
| Rota Feed | `src/routes/_app.reels.tsx` | Lê `getReelLikes`/`getReelComments`/`getStoredSoundPref`; `SEED_COMMENTS` só para `reel-001` |
| Rota detalhe | `src/routes/_app/reels/$reelId.tsx` | `findReelById` → publicado; `isReelLiked`; `toggleReelLike` |
| Novo-reel (publicação real) | `src/routes/_app.gerenciar.novo-reel.tsx` | Chama `publishReel` → navega para `/reels/$reelId` |
| `/create` | `src/routes/_app/create/reel.tsx` | `usePublisherForm` — NÃO publica (demo) |
| Persistência nova | `src/lib/persistence/domain/reels-{entities,schema}.ts`, `src/repositories/reel*.repository.ts` | Existente, íntegra, sem consumo por nenhuma tela |
| Supabase reels | `reel-publish.ts:100-132`, `comments-sheet.tsx` (órfão), `mcp/tools/list-my-reels.ts`, `integrations/supabase/types.ts` | Sem caminho de leitura no feed |

**Fato de maior peso do estado atual:** o modelo **exibido** (`Reel`) é muito mais rico que o modelo **persistido** (`StoredReel/StoredPublishedReel`). Os mocks carregam estatísticas e metadados demo (stats com shares/saves/views, música, entidades completas de local/negócio/evento/motorista, hashtags, `videos[]`), enquanto `StoredReel` guarda apenas a metadata canônica de um Reel criado pelo usuário.

---

## 4. Fontes de verdade atuais

| Fonte | Tipo | Consultada por | Escrita por |
| --- | --- | --- | --- |
| `connexy:reels:published:v1` (`{version:1, items:StoredPublishedReel[]}`) | Persistida (localStorage) | `reel-feed.getPublishedReels`, `getReelById` | `publishReel` via `saveStoredPublishedReel` |
| `connexy:reels:likes:v1` (`Record<reelId, boolean>`) | Persistida (localStorage) | feed (`getReelLikes`), `$reelId` (`isReelLiked`) | `toggleReelLike` |
| `connexy:reels:comments:v1` (`Record<reelId, ReelComment[]>`) | Persistida (localStorage) | feed (`getReelComments`) | `addReelComment`, `toggleCommentLike` |
| `connexy:reels:sound:v1` (`"on"|"off"`) | Persistida (localStorage) | feed e `$reelId` | `setStoredSoundPref` |
| `MOCK_REELS` | Estática em código | feed, `getReelById`, contexto de publicação | — |
| `SEED_COMMENTS` (em `_app.reels.tsx:41-75`) | Estática em código | feed (somente `reel-001`) | — |
| `connexy-reels-local-db` / `media` | Persistida (IndexedDB) | mídia dos publicados | `publishReel` (`saveReelMedia`) |
| `connexy-reels-data-local-db` (1C-3B) | Persistida (IndexedDB) | **nenhuma tela** | somente testes |

---

## 5. Modelo StoredReel (fonte de verdade canônica nova)

`src/lib/persistence/domain/reels-entities.ts`:

```ts
StoredReel          → { id, caption, category, author: StoredReelAuthor,
                        context: StoredReelContextRef|null, durationS, createdAt, persistence }
StoredReelLike      → { id: `${reelId}::${userId}`, reelId, userId, createdAt }
StoredReelComment   → { id, reelId, text, authorId, authorName, authorPhoto,
                        createdAt, likes, likedByMe }   // sem replies (ver §9)
```

O modelo **não** carrega: `videoUrl`/`posterUrl`/`videos`, `music`, `location`/`business`/`event`/`driver` completos, `stats` (incl. shares/saves/views), `hashtags`, `taggedUserIds`, `savedByMe`, `likedByMe`.

Ponto-chave: `StoredReel` foi desenhado para **Reels criados pelo usuário** (espelha `StoredPublishedReel` 1:1). Não foi desenhado para reter o conteúdo demo do ecossistema.

---

## 6. Compatibilidade com MOCK_REELS

### Pergunta fundamental (§4 da fase)

| Campo | MOCK (ex.: `reel-001`) | StoredReel | Vira direto? | Transformação | Risco |
| --- | --- | --- | --- | --- | --- |
| `id` | `"reel-001"` string estável | `id` | SIM | — | Baixo |
| `caption` | string | `caption` | SIM | — | Baixo |
| `category` | `ReelCategoryValue` (9 valores) | `StoredReelCategoryValue` (mesmos 9) | SIM | cast de tipo | Baixo |
| `author` | `ReelAuthor` | `StoredReelAuthor` (mesma forma) | SIM | — | Baixo |
| `context` | (não existe; há `location`/`business`/`event`/`driver` completos) | `StoredReelContextRef {tipo,id,titulo}` | PARCIAL | derivar ref de `location`/`business`/`event`; **driver não tem `tipo`** (sem "motorista" em `ReelContextType`) | Médio |
| `duration` | `stats.duration` | `durationS` | SIM | extrair de `stats` | Baixo |
| `createdAt` | ISO | `createdAt` | SIM | — | Baixo |
| `persistence` | — | `"local"` | SIM | sintetizar `"local"` | Baixo |
| `videoUrl`/`posterUrl`/`videos` | URLs externas demo | — (não existe) | NÃO | depende do catálogo; mídia demo não está no media DB | Médio |
| `music` | `ReelMusic\|null` | — | NÃO | — | Alto (perda visível) |
| `location`/`business`/`event`/`driver` | entidades completas | — (só ref) | NÃO | perda de detalhes renderizados | Alto |
| `stats` (`likes 2340`, `comments 87`, `shares`, `saves`, `views 18500`) | demo | — (o novo modelo deriva likes/comments de coleções) | NÃO | números demo não derivam de nada; sumiriam do feed | Alto |
| `hashtags` | string[] | — | NÃO | deserializável do caption? (só os publicados têm `extractHashtags`) | Médio |
| `taggedUserIds` | string[] | — | NÃO | sem uso visível na renderização atual | Baixo |
| `likedByMe`/`savedByMe` | boolean | — | NÃO | estado de UI, já tratado fora do modelo | Baixo |

### Veredito

**`MOCK_REELS` NÃO pode ser representado fielmente por `StoredReel`** sem (a) perder conteúdo visível (música, stats, entidades de contexto) ou (b) ampliar o modelo — o que contradiz a fundação 1C-3B.

### Quantidade e campos

- **15 Reels** (`reel-001…reel-015`), ids **estáveis** (`reel-NNN`).
- Campos: `id, videoUrl, posterUrl, videos?, caption, category, author, music, location, business, event, driver, stats, hashtags, taggedUserIds, createdAt, likedByMe, savedByMe`.
- Todos dependem de mídia **externa** (URLs Pexels/Unsplash) quando exibidos.
- Risco de colisão com ids de publicação local: **desprezível** — publicados usam `reel-${Date.now()}-${rand}` (nunca `reel-NNN`); a dedup atual é por id (comportamento preservado).

### Estratégia escolhida para `MOCK_REELS`: **C — fonte permanente de conteúdo demo (catálogo estático em código)**

- Manter `MOCK_REELS` como **catálogo demo em código** (como hoje), **sem** gravá-lo no `reels` store.
- O `reels` store (via `ReelRepository`) passa a ser fonte de verdade **exclusivamente para Reels criados pelo usuário** (publicados).
- O feed compõe: `ReelRepository` (canônicos) + `MOCK_REELS` (catálogo) + mídia dos publicados (media DB), com dedup por id — **exatamente o merge que `getReelFeed` já faz hoje**, trocando a fonte dos publicados de localStorage para IDB.
- Likes/comentários de mocks funcionam normalmente: `reel_likes`/`reel_comments` referenciam `reelId`; **não é exigido que o Reel exista no store `reels`**.

**Justificativa:** é a opção mais segura tecnicamente — zero perda de conteúdo demo, zero mudança visual, zero ampliação de modelo, zero risco de contadores demo virarem "fonte de verdade" falsa. As alternativas foram rejeitadas:
- A (seed única então apagar mocks): perde stats/música/contexto → quebra visível do feed.
- B (fallback temporário): eliminará conteúdo demo que o produto quer manter.
- D (duplicar catálogo no IDB): cria duas cópias e modelo incompleto.

Se no futuro houver exigência de "Reels demo também persistidos", o correto é estender o modelo com um catálogo/display separado — decisão explícita de modelo, fora desta integração.

---

## 7. Compatibilidade dos Reels publicados (e do Supabase)

### Publicados localmente (`StoredPublishedReel` → `StoredReel`) — **1:1 exato**

| Campo | StoredPublishedReel | StoredReel | Nota |
| --- | --- | --- | --- |
| `id` | `id` | `id` | `reel-<ts>-<rand>` estável |
| `caption` | `caption` | `caption` | — |
| `category` | `ReelCategoryValue` | `StoredReelCategoryValue` | cast de tipo (mesmos literais) |
| `author` | `ReelAuthor` | `StoredReelAuthor` | mesma forma |
| `context` | `ReelContextRef {tipo,id,titulo}` | `StoredReelContextRef` | idênticos |
| `durationS` | `durationS` | `durationS` | — |
| `createdAt` | ISO | `createdAt` | — |
| `persistence` | `"supabase"|"local"` | `StoredReelPersistence` | idênticos |

**Migração → `ReelRepository` com transformação nula. Risco: Baixo.**
Mídia permanece por id no media DB (`getReelVideoUrl(stored.id)`), como `getPublishedReels` já faz.

### Supabase `reels` (remoto, eventual)

Formato da tabela (`integrations/supabase/types.ts`): `author_id, video_url (path de storage), poster_url, caption, place_id, audio_label, tagged_user_ids, duration_s, created_at, id (uuid)`.

| Aspecto | Análise |
| --- | --- |
| Virar `StoredReel`? | **Não diretamente**: faltam `category`, `context`, `author` snapshot; `video_url` é caminho de storage (não object URL); precisaria mapear. |
| Quando relevante | Apenas se o feed passar a listar Reels de outros usuários via Supabase — **não existe esse caminho hoje** (regra §3; MCP `list_my_reels` é leitura para ferramenta). |
| Risco | Médio (schema divergente). Recomenda-se um mapper dedicado quando a integração remota for iniciada — **fora** desta fase. |

### `/create` (usePublisherForm)

Não publica nada (demo puro: espera, toast, navega para `/home`). Permanece intacto nesta fase; é alvo de outra foto (correção do `/create` é explicitamente fora do escopo — decisão da fase).

---

## 8. Análise dos likes antigos (`connexy:reels:likes:v1`)

| Item | Valor constatado |
| --- | --- |
| Formato | `Record<reelId, boolean>` (JSON) via `getReelLikes` |
| Volume possível | pequeno (1 boolean por Reel curtido/desseguido) |
| Relação Reel → usuário | chave = `reelId`; **sem `userId`, sem `createdById`, sem timestamp** |
| Compatibilidade `StoredReelLike` | `reelId` ok; `userId` **faltante**; `createdAt` **inexistente** (sintetizar) |
| Risco de colisão | chave determinística `reelId::userId` — sem colisão se o mesmo usuário não propagar 2x (idempotência) |
| Migração one-time possível | **SIM, com atribuição de identidade** (ver §10) |
| Reel já existente no IDB | só entradas `true` migram; `get()` pré-existente na chave `reelId::userId` → skip (idempotente) |
| Usuário atual desconhecido | entrada não migrada, registrada em log (nada descartado silenciosamente) |

### O dado antigo pode ser migrado com segurança?

**SIM, com a ressalva de identidade** (§10): transformação exata por entrada com valor `true`:

```
{ for each [reelId] = true } →
  StoredReelLike { id: reelLikeId(reelId, identityId),
                   reelId, userId: identityId,
                   createdAt: <ISO da execução da migração> }
```

- Entradas `false` são omitidas (equivalem a "não curtido"; não geram registro).
- `createdAt` sintetizado = momento da migração (impacto: ordenação por data de curtida retroativamente achatada — sem uso atual na UI).
- **Nada é apagado** da fonte antiga (mantida como rollback).
- Se a identidade ativa não puder ser resolvida → registrar e **não** inventar identidade.

---

## 9. Análise dos comentários antigos (`connexy:reels:comments:v1`)

| Item | Valor constatado |
| --- | --- |
| Formato | `Record<reelId, ReelComment[]>` via `getReelComments` |
| Campos | `id, text, authorId, authorName, authorPhoto, createdAt, likes, likedByMe, replies` |
| IDs | `c-${Date.now()}-${rand}` — únicos por criação; risco de colisão entre Reels desprezível |
| Autor | **estampado** no registro (`authorId`/`authorName`/`authorPhoto` = currentUser no ambiente demo) |
| Timestamps | ISO presente |
| Likes | `likes` + `likedByMe` espelhados |
| `replies` | **nunca renderizado na UI** (verificado: únicas ocorrências são os 3 seeds). Na prática `addReelComment` sempre grava `replies: []` |
| Comentários seed | `SEED_COMMENTS` **não** estão no localStorage — são código estático no feed (§4) |
| Duplicação | dedupe por `id` ao migrar (skip se já existir na store) |

### Compatibilidade e migração

**Compatível com `StoredReelComment`** campo a campo, exceto `replies` (inexistente no novo modelo). Estratégia de migração:

```
for each [reelId] → array:
  for each comment:
    StoredReelComment {
      id: comment.id, reelId,
      text, authorId, authorName, authorPhoto, createdAt,
      likes: comment.likes, likedByMe: comment.likedByMe
    }   // replies: se array vazio → ok; se NÃO-vazio → NÃO é dropado cegamente:
        // gravado em log de auditoria (lista de ids) para decisão posterior.
        // (Esperado: nunca ocorre — UI não rendeiza replies.)
```

- Dedupe por `id` contra a store (`get` antes do `put`).
- Validação de entrada mínima (id + text strings) já existente em `getReelComments`.
- Seeds (`SEED_COMMENTS`) ficam no catálogo estático junto de `MOCK_REELS` (estratégia C) — **não** são migrados.

---

## 10. Identidade do usuário (crítica)

| Cenário | Identidade efetiva |
| --- | --- |
| Demo mode autenticado | `useAuth` → sessão demo com id = `useDemoIdentity().id` (persistido em `connexy:demo:identity`; default `"lucas"`) |
| DEV sem Supabase | `developmentMockUser = { id: currentUser.id }` (`"lucas"`) |
| Supabase real | `user.id` (= uid uuid) |
| Autor de Reels publicados | `buildReelAuthorFromCurrentUser()` → sempre `currentUser` (`"lucas"`) |
| Autor de comentários antigos | `addReelComment` estampa `authorId: currentUser.id` (`"lucas"`) |

### Respostas da fase

- **Como o usuário é identificado no modo demo/local:** id da demo identity ativa (`useDemoIdentity`), com default global `currentUser.id` = `"lucas"`.
- **ID estável?** Sim, enquanto a demo identity não é trocada; no Supabase é o `uid`.
- **Pode ser usado na migração?** Sim — para likes, usar `auth.user?.id ?? currentUser.id` no momento da migração.
- **Likes antigos podem ser associados corretamente ao usuário?** **PARCIALMENTE.** Likes antigos não guardam `userId`; o produto sempre tratou como "minhas curtidas" do aparelho. A atribuição segura é à **identidade ativa na migração** (na prática `"lucas"`). Se a demo identity tiver sido trocada, o histórico é atribuído ao perfil errado — **limitação documentada, sem como recuperar** (nada a inventar).
- **Comentários antigos podem ser associados?** **SIM** — `authorId` está no registro.
- **Dados que NÃO podem migrar com segurança:** likes quando a identidade ativa for desconhecida/ambígua; qualquer registro malformado (mantidos e logados).

**Regra:** NÃO inventar identidade; quando não houver segurança, pular e logar.

---

## 11. Estratégia de seed

```
MOCK_REELS               →  NÃO vira seed no IDB. Permanece catálogo demo em código (estratégia C, §6).
SEED_COMMENTS            →  NÃO vira seed no IDB. Permanece no catálogo (reel-001).
StoredPublishedReel[]    →  SEED REAL: `published:v1` é migrado 1:1 para `ReelRepository` (§7).
```

- O "seed" do `reels` store é **apenas o que hoje já é conteúdo persistido do usuário** (`published:v1`), nunca os mocks.
- Quando a migração roda pela primeira vez, o `reels` store deve terminar com: os publicados antigos (migrados) + todo Reel publicado daqui em diante (por `publishReel`, §17).
- Condição de seed guardada em marcador de migração (§12).

---

## 12. Estratégia de migração one-time (desenho técnico — não implementado)

### Cadeias alvo

```
published:v1 ──(1:1)──→ ReelRepository (store reels)
likes:v1     ──(true; userId=identidade; createdAt sintetizado)──→ ReelLikeRepository
comments:v1  ──(exceto replies; dedupe por id)──→ ReelCommentRepository
sound:v1     ──(NÃO migra; permanece localStorage — preferência de UI)──→ —
```

### Quando ocorre

Em **bootstrap lazy** da camada de persistência de Reels (analogia `ensureLocalChatLoaded` da 1C-2), antes da primeira leitura do feed que dependa das stores —i.e., esquema `ensureLocalReelsLoaded()` chamado pelo facade de Reels a ser criado na 1C-3C.

### Como saber se já ocorreu

**Marcador dedicado em localStorage**: `connexy:reels:migration-status:v1`

```
{ version: 1, ranAt: ISO, counts: { reels, likes, comments } }
```

(Segunda fonte de segurança: cada migração é idempotente por registro — §§8-9 — portanto mesmo sem o marcador não duplica.)

### Onde guardar versão/flag

- Marcador em localStorage (chave nova, sem prefixo de migração antiga). Motivo: a migração é capaz de ler localStorage e IndexedDB; escrever no localStorage evita depender de uma store vazia para deduzir "já migrou".
- A referência do marcador NÃO é a presença de conteúdo no IDB (um usuário pode ter publicado 0 reels).

### Idempotência

- `reels`: `get(id)` antes de `put`; registros já existentes não são sobrescritos (dedup por `id`).
- `likes`: chave determinística `reelLikeId(reelId, userId)` — `get` antes de `put`; re-execução não cria duplicatas.
- `comments`: dedup por `id` no store.
- Marcador só é gravado após o término bem-sucedido de reels+likes+comments.

### Interrupção / falha

- Interrompida → marcador ausente; próxima execução retoma; passos idempotentes tornam a retomada segura.
- Erro em um item → log `console.warn` (padrão 1C-2), continua com os demais; item afetado fica para a próxima execução.
- Falha de abertura do IndexedDB → nenhuma gravação, UI continua com a fonte antiga (feed intacto).
- **Nada é apagado** da fonte antiga; rollback = simplesmente continuar usando `published:v1`/`likes:v1`/`comments:v1` (não removidos nesta fase).

### Se o IDB já tiver parte dos dados

Os passos per-registro (get→put) garantem: registros novos migram; registros já presentes são preservados (sem sobrescrita, sem duplicação). Ajuda a reconciliar escrita pré-existente (ex.: teste manual, publish futuro).

### Evitar duplicação

Chave primária determinística de likes + dedupe por id em reels/comments + marcador one-time.

### Remoção dos dados antigos

**Somente depois da confirmação** (fase de limpeza pós-1C-3C, com opção explícita/backup). Durante 1C-3C os dados antigos são mantidos integralmente como rollback. A desativação de *escrita* (não de leitura/remoção) faz parte da etapa H (§19).

---

## 13. Idempotência

Consolidado (§12): execução repetida da migração produz o mesmo resultado. Garantida por (1) marcador one-time, (2) `get` antes de `put`, (3) chave determinística de likes, (4) dedupe por id. Verificável por teste de "reload conceitual" (nova instância de repository/adapter sobre o mesmo disco lê os dados; nova execução não acumula).

---

## 14. Tratamento de falhas

| Cenário | Comportamento projetado |
| --- | --- |
| IndexedDB indisponível/bloqueado | faca não abre; feed continua com lógica atual (sem quebra) |
| Storage cheio/indisponível (localStorage) | `safeGet`/`safeSet` já toleram; marcador pode não ser gravado → retoma na próxima |
| Erro por registro | loga e segue; retoma na próxima execução |
| Identidade ambígua (likes) | pula e loga (nunca inventa) |
| Comentário com `replies` não-vazio | loga (auditoria); esperado que não ocorra |
| Duplicidade | impossível por idempotência (§13) |
| Rollback | fontes antigas intactas; sem `removeItem` durante 1C-3C |

---

## 15. Estratégia de contadores

### Como o feed calcula hoje (verificado em `_app.reels.tsx`)

- **Likes**: `likeMap` (localStorage) mergeado em `likedByMe`; contador = `baseLikes + (liked?1:0)` sobre `stats.likes` do mock/publicado (`viewReels:132-144`) — **derivado** do mapa local + número base estático.
- **Comentários**: `commentMap` (localStorage) para o sheet; contador `stats.comments` incrementado localmente em `handleAddComment` — misto (base estática + incremento local).
- **Views/shares/saves**: estáticos nos `stats` do mock (publicados = 0) — **hardcoded/demo**.

### Regra-alvo

> Não duplicar contadores persistidos quando deriváveis dos registros reais.

### Estratégia futura (1C-3C)

- **Likes/comentários de Reels do usuário**: derivados de `ReelLikeRepository.countByReel` / `ReelCommentRepository.countByReel` (fonte de verdade = coleções). Nenhum `stats.likes/comments` persistido no `StoredReel`.
- **Likes/comentários de mocks (catálogo)**: permanecem valores demo nos `stats` do catálogo em código (não são dados de usuário; não viram fonte — ver §6).
- **Visualizações**: fora do escopo (só existem como número demo; não há implementação de "view real" para persistir).
- **shares/saves**: estado de UI atual (só state local, sem persistência). `savedByMe` fica onde está — nenhuma mudança nesta fase.

---

## 16. Estratégia de mídia

- `connexy-reels-local-db` / store `media` (Blobs) **permanece separado e intocado** — decisão 1C-1/1C-3B mantida.
- Referência futura: o `StoredReel.id` (string estável) é a chave de ligação com a mídia — `getReelVideoUrl(id)` / `getReelPosterUrl(id)` como já ocorre em `getPublishedReels`.
- `StoredReel` **não** guarda URL/binário; o feed monta a exibição com object URLs do media DB (comportamento atual preservado).
- Mocks usam URLs externas diretas (`videoUrl`/`posterUrl` do catálogo) — também inalterado.

---

## 17. Estratégia de publicação

### Dual-write atual (verificado em `publishReel:134-188`)

Já existe **dual-write** hoje, entre camadas: mídia → IDB media (`saveReelMedia`) + metadata → localStorage `published:v1` (`saveStoredPublishedReel`) + tentativa Supabase. O feed lê metadata do localStorage e mídia do IDB.

### Arquitetura futura (1C-3C, não implementada)

1. `publishReel` passa a gravar a metadata em **`ReelRepository` (store `reels`)** — mesma transformação 1:1 de `StoredPublishedReel`.
2. Durante a transição, **dual-write temporário e explícito**: `published:v1` (legado) + `reels` (novo), para não quebrar versões antigas/retorno; removido na etapa H (§19).
3. Mídia continua IDB media; Supabase continua como tentativa opcional (persistence flag).
4. Likes/comentários da publicação futura: apenas via repositórios (nada muda de formato).
5. Publicados recém-criados devem aparecer no feed **imediatamente** — por isso o corte de leitura do feed (§19, etapa D) só acontece **depois** do dual-write de escrita.

---

## 18. Arquitetura alvo

```
UI (feed, detalhe, sheets)
   │  (camada de acesso Reels — facade a criar na 1C-3C, padrão 1C-2)
   ▼
ReelRepository ────────→ store reels            (Reels do usuário)
ReelLikeRepository ────→ store reel_likes       (curtidas por userId+reelId)
ReelCommentRepository ─→ store reel_comments    (comentários por reelId)
   ▲
MOCK_REELS (código) = catálogo demo  ·  SEED_COMMENTS (código) = demo
   ▲
media DB (connexy-reels-local-db) = Blobs dos Reels do usuário
```

### Confirmação/contestação da decisão "Repository = fonte de verdade"

- **`ReelRepository` como fonte de verdade do conteúdo publicado**: **CONFIRMADO** — é a única cópia persistida de metadata do usuário.
- **`ReelLikeRepository` como fonte de verdade de curtidas**: **CONFIRMADO** — mas o contador *exibido* ainda soma a base demo dos mocks (catálogo). Delimitação explícita: o repository é a verdade do usuário; os `stats` demo dos mocks continuam sendo exibição demo.
- **`ReelCommentRepository` como fonte de verdade de comentários**: **CONFIRMADO**, com a nota de que os `SEED_COMMENTS` de `reel-001` são demo estático (§6, §9).
- **Ressalva documentada**: a fonte de verdade "canônica" cobre **conteúdo criado pelo usuário**; o conteúdo demo (mocks/seeds) fica no código de propósito (estratégia C). Isto EVITA simular uma fonte persistida para dados que não são do usuário.

---

## 19. Ordem de implementação futura (1C-3C) — ordem revisada

A sequência A→H proposta pela fase foi **avaliada e ajustada**. Motivo: os passos D/E/F de "leitura pelo feed" dependem das escritas correspondentes; o corte do feed para `ReelRepository` exige que `publishReel` **já** escreva lá (senão Reel recém-publicado some do feed). Ordem segura:

1. **A. Migração de conteúdo**: `published:v1` → `ReelRepository` (one-time idempotente; §7, §12). `MOCK_REELS` → inalterado (catálogo).
2. **B. Migração de likes**: `likes:v1` (só `true`) → `ReelLikeRepository` com identidade ativa (§8, §10).
3. **C. Migração de comentários**: `comments:v1` → `ReelCommentRepository` (§9).
4. **C+ (nova, inserida) — publicação em dual-write temporário**: `publishReel` grava metadata também em `reels` (mantendo `published:v1`) — garante que o corte do feed não perca Reels novos.
5. **D. Feed lê `ReelRepository`** (componente conteúdo) — `getReelFeed` troca a fonte dos publicados de `published:v1` para `reels` (media continua media DB; mocks continuam catálogo).
6. **E. Feed lê `ReelLikeRepository`** — `likeMap`/`viewReels`/`handleToggleLike` migram para `addLike`/`removeLike`/`isLiked`/`countByReel` (leitura e escrita juntas).
7. **F. Feed lê `ReelCommentRepository`** — sheet/comentários migram para `listByReel`/`create`.
8. **G. Validação de reload** — testes automáticos + manual: salvar → recarregar → recuperar (feed, like, comentário, publicado novo).
9. **H. Desativação das fontes antigas** — remove-se o dual-write de `published:v1` (escritas); `likes:v1`/`comments:v1` deixam de ser escritos; remoção das chaves fica para fase de limpeza posterior (com confirmação), mantendo rollback imediato.

**Ajustes em relação à ordem proposta:** inserção do passo C+ (dual-write de publicação antes do corte de leitura); D precedido por C+; E e F agrupam leitura+escrita por feature (nunca só leitura); H só ao final.

---

## 20. Critérios de aceite da próxima fase (1C-3C)

- Feed compõe conteúdo dos publicados a partir de `ReelRepository` (não mais `published:v1`).
- `isLiked`/toggles de like usam `ReelLikeRepository`; comentários usam `ReelCommentRepository`.
- `publishReel` grava no `reels` store; Reel recém-publicado aparece de imediato no feed.
- Migração one-time idempotente provada por testes (repeat execution não duplica; reload lê de volta).
- Rollback disponível: chaves `:v1` intactas, exceto desativação explícita de escrita (etapa H).
- Mídia, Supabase, auth, rotas, `/create`, `$reelId` e comportamento visual inalterados.
- Suíte: novos testes passando + 86 existentes passando; tsc clean; build OK; lint sem problemas novos (baseline 503/483/20).

---

## 21. Riscos

| Severidade | Risco | Mitigação |
| --- | --- | --- |
| **HIGH** | Likes antigos sem `userId` — atribuição a identidade da migração pode "errar" o dono se a demo identity tiver sido trocada | atribuir a `auth.user?.id ?? currentUser.id`; documentar; pular+logar se ambíguo (nunca inventar) |
| **HIGH** | Converter `MOCK_REELS` em `StoredReel` perderia música/stats/contexto (rejeitado; decisão C) | manter catálogo em código; não gravar mocks no IDB |
| **MEDIUM** | Corte do feed para `ReelRepository` antes dos publishes escreverem lá → Reels novos somem | dual-write temporário de publicação (passo C+) antes do passo D |
| **MEDIUM** | Falha/Interrupção de migração entre passos | idempotência por registro + marcador one-time + log; nada apagado |
| **MEDIUM** | `StoredReelComment` sem `replies` — futura feature de respostas exigirá evolução de modelo | registro/documentação; `replies` não-vazios auditados (não dropados cegamente) |
| **MEDIUM** | Reels do Supabase (remoto) com schema divergente, sem categoria/context/autor | fora do escopo; mapper dedicado quando houver integração remota |
| **LOW** | Colisão de ids publicados vs mocks | ids `reel-<ts>-<rand>` vs `reel-NNN`; dedup por id já em `getReelFeed` |
| **LOW** | Duplicação de likes/comentários na re-execução | chave determinística + dedupe por id + marcador |
| **LOW** | Preferência de som fora do IDB | decisão mantida (estado de UI/local; sound:v1 fica) |

---

## 22. Decisões (resumo)

| # | Decisão |
| --- | --- |
| D1 | `MOCK_REELS` = **catálogo demo permanente em código** (estratégia C); NÃO vira seed no IDB. |
| D2 | `SEED_COMMENTS` = demo estático (junto de mocks); NÃO migra. |
| D3 | Seed real do `reels` store = migração 1:1 de `published:v1`. |
| D4 | Likes antigos migram **somente `true`**, com `userId` = identidade ativa e `createdAt` sintetizado; sem `userId` original comprovável. |
| D5 | Comentários migram exceto `replies` (não renderizadas); `replies` não-vazios → auditoria/log. |
| D6 | Migração guardada por marcador `connexy:reels:migration-status:v1` + idempotência per-registro. |
| D7 | Fonte de verdade final = `ReelRepository`/`ReelLikeRepository`/`ReelCommentRepository` para conteúdo do usuário; catálogo demo permanece em código. |
| D8 | Contadores de likes/comentários derivados das coleções (countByReel); números demo dos mocks continuam demo. |
| D9 | Mídia permanece em `connexy-reels-local-db`/`media`; `StoredReel.id` é o vínculo. |
| D10 | Ordem 1C-3C revisada: migração A/B/C → dual-write de publicação C+ → corte de leitura D/E/F → reload G → desativação H. |
| D11 | `sound:v1` permanece localStorage (estado de UI). |
| D12 | Nenhuma chave removida durante 1C-3C (rollback); remoção em fase de limpeza posterior. |

---

## 23. Itens explicitamente fora do escopo

- Conectar o Feed aos repositórios (é a 1C-3C).
- Corrigir o fluxo `/create` (usePublisherForm não publica) e qualquer roadmap de `/create`.
- Corrigir a tela de detalhe `$reelId` (comentários vazios/`ReelCommentsSheet` desligado).
- Supabase (Likes/Comentários remotos), sync, Realtime, offline queue, migration de RLS/auth.
- Mídia: mover `connexy-reels-local-db`/`media`, migrar Blobs, ou duplicar.
- Chaves `:v1` (incl. `sound:v1`): remoção, renomeação ou reescrita de formato.
- Motor de recomendação (`engine-mocks.ts` `MOCK_REELS: Recommendation[]` — conceito diferente, mesmo nome).
- Correção do lint baseline (503/483/20) e limpeza de código órfão (`deleteStoredPublishedReel`, `deleteReelMedia`, `listStoredReelIds`, `getCommentsForReel`, `comments-sheet.tsx`).
- Componentes definidos e não usados (`CommentsSheet`/Supabase, `ReelLikes`, `ReelCard`).

---

## Resposta à regra final (§22)

**SIM, sabemos exatamente como migrar.** O plano acima define, com transformações campo a campo e ordem segura: `published:v1` → `ReelRepository` (1:1), `likes:v1` → `ReelLikeRepository` (com a ressalva de identidade, HIGH), `comments:v1` → `ReelCommentRepository` (dedupe por id), mantendo `MOCK_REELS`/`SEED_COMMENTS` como catálogo demo, sem perda, duplicação ou múltiplas fontes de verdade **para conteúdo de usuário** (a delimitação mocks-vs-usuário é explícita).

**Vinculado por design:** identidade de likes antigos (HIGH) — nada impede a integração, mas exige a regra "atribuir à identidade ativa; pular+logar se ambíguo". Se o produto exigir atribuição historicamente correta de likes demo, isso é um bloqueio de dados (histórico indisponível), não um bloqueio de código.

Sem stop-condition §21 disparada. Nenhum código de produto foi tocado nesta fase.