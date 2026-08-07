# RELATÓRIO — FASE 3B: Criação, Preview e Publicação de Reels

> Projeto: Connexy — Ecossistema digital
> Branch: `main` · Repo limpo antes da fase (`git status` sem alterações pré-existentes)
> Data: 2026-08-07 · Sem commits automáticos (conforme instrução)

---

## 1 · Contexto e objetivo

A Fase 3B implementa o fluxo ponta a ponta de criação de Reels —
**selecionar vídeo → preview → legenda → contexto opcional → revisar → publicar →
abrir no feed** — preservando a rota existente `/_app/gerenciar/novo-reel.tsx`.
A publicação é desacoplada da UI através de um adapter
(`publishReel({ file, caption, context, author }) → { reel, persistence }`) com dois
modos de persistência: **Supabase real** (quando configurado) e **IndexedDB local**
(desenvolvimento/sem backend), nunca fingindo um upload que não aconteceu.

## 2 · Escopo da Fase 3B

- Reescrever `gerenciar.novo-reel.tsx` com as etapas obrigatórias, estados de
  publicação, validação de vídeo e limpeza de `object URLs`.
- Camada de mídia local em IndexedDB (API nativa, chave `connexy-reels-local-db` v1).
- Metadata textual de publicados em `reel-local-storage.ts`.
- Feed unificado `getReelFeed()` (publicados locais + mocks, recém-publicado primeiro,
  sem ids duplicados) e leitura de detalhe `getReelById()`.
- Adapter `publishReel` com tentativa real de publicação no Supabase
  (storage `reels-media` + insert em `reels`) e fallback honesto para local.
- Relatório com 21 seções + resumo final.

## 3 · O que NÃO foi feito (limites respeitados)

- ❌ Não foi criada tabela/migration/bucket/RPC nem alterado RLS.
- ❌ Não foi inventada `SERVICE_ROLE_KEY` nem inserida chave em código.
- ❌ Não é fingido upload persistido — quando o Supabase falha, o modo local é
  reportado explicitamente (`persistence: "local"`).
- ❌ Nenhum base64/blob em `localStorage`; vídeo/pôster ficam no IndexedDB.
- ❌ Nenhum `blob:` URL tratado como permanente — sempre via `URL.revokeObjectURL()`.
- ❌ A integração Supabase existente não foi removida (migrations e cliente intactos).
- ❌ IA / Orchestrator / Live Engine **não** foram ativados.

## 4 · Arquivos criados

| Arquivo | Papel |
|---|---|
| `src/lib/reels/reel-limits.ts` | Limites centralizados (tamanho, duração, MIME, extensões). |
| `src/lib/reels/reel-local-media-db.ts` | IndexedDB nativo `connexy-reels-local-db` v1 (vídeo + pôster em blobs), cache de object URLs e `deleteReelMedia()`. |
| `src/lib/reels/reel-publish.ts` | Adapter `publishReel`, validação `validateReelVideo`, `isSupabaseConfigured`, tentativa real Supabase. |
| `src/lib/reels/reel-feed.ts` | `getReelFeed()`, `getPublishedReels()`, `getReelById()`, `buildPublishedReel()`. |

## 5 · Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/lib/reels/reel-local-storage.ts` | Adicionados `ReelContextRef`, `StoredPublishedReel`, `get/save/deleteStoredPublishedReel` (chave `connexy:reels:published:v1`). |
| `src/routes/_app.gerenciar.novo-reel.tsx` | Reescrita completa do fluxo (vídeo → legenda → contexto → revisão/publicação). |
| `src/routes/_app.reels.tsx` | Feed passa a usar `getReelFeed()` (antes `MOCK_REELS`); `loading` sempre finaliza (try/finally). |
| `src/routes/_app/reels/$reelId.tsx` | Detalhe passa a usar `getReelById()` (resolvendo também reels publicados localmente). |

`routeTree.gen.ts` não mudou (caminhos de rota preservados).

## 6 · Modo de persistência — visão geral

`publishReel` sempre persiste localmente (IndexedDB + metadata) para garantir a
exibição no feed unificado e o deep link `/reels/$reelId`. Se o Supabase estiver
configurado, também **tenta publicar de verdade** no storage `reels-media` e inserir
na tabela `reels`; se qualquer passo remoto falhar (bucket inexistente, usuário não
autenticado, RLS, rede), cai para `persistence: "local"` e a UI informa
"Reel salvo neste dispositivo (modo de desenvolvimento)".

## 7 · Modo local — `reel-local-media-db.ts`

- Banco `connexy-reels-local-db` (v1), store `media` (keyPath `id`).
- Registro `ReelMediaRecord { id, videoBlob, videoType, posterBlob, posterType, storedAt }`.
- API nativa `indexedDB` (sem lib externa); `openDb` lazy com cache de conexão.
- Object URLs criados sob demanda e cacheados por sessão (`objectUrlCache`);
  `saveReelMedia` invalida/revoga URLs antigas; `deleteReelMedia` revoga vídeo e pôster.
- `listStoredReelIds()` disponível para auditoria futura.
- Guardas para SSR/IndexedDB indisponível.

## 8 · Modo Supabase real — `reel-publish.ts`

- `isSupabaseConfigured()` lê `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`
  (e fallback `process.env`) **sem** acessar o cliente (Proxy seguro).
- `publishToSupabase` replica o padrão original da rota: upload do vídeo em
  `reels-media` (`${user.id}/${reelId}.${ext}`), upload opcional do pôster, insert
  em `reels` (author_id, video_url, poster_url, caption, duration_s). RLS exige
  `auth.uid() = author_id` — sem sessão, cai para local.
- **Validação real não foi concluída** neste ambiente: o `.env` tem URL/chave
  configuradas, mas não foi possível autenticar o bucket `reels-media`/inserir linha
  sem um usuário autenticado (ver §20).

## 9 · Validação de vídeo

`validateReelVideo(file, durationS)` retorna `"empty" | "type" | "size" | "duration" | null`:

- **empty**: nenhum arquivo selecionado.
- **type**: MIME fora de `video/mp4`, `video/quicktime`, `video/webm` (com fallback por
  extensão `.mp4/.mov/.webm`).
- **size**: arquivo > `REEL_MAX_FILE_SIZE` (250 MB, alinhado ao `VIDEO_VALIDATION`).
- **duration**: duração ausente ou > `REEL_MAX_DURATION_SECONDS` (90s).
- A UI valida tipo/tamanho na seleção (com toast) e duração no `loadedmetadata` do
  preview; o botão Publicar revalida antes de publicar.

## 10 · Limites centralizados — `reel-limits.ts`

`REEL_MAX_FILE_SIZE` (250 MB), `REEL_MAX_DURATION_SECONDS` (90s),
`REEL_MAX_CAPTION_LENGTH` (240), `REEL_ACCEPT`, `REEL_ALLOWED_EXTENSIONS`,
`REEL_ALLOWED_MIME_TYPES`. Nenhum número mágico em componentes (a rota usa apenas
esses símbolos, inclusive no contador de caracteres da legenda).

## 11 · Estados de publicação

`ReelPublishState = "idle" | "validating" | "uploading" | "saving" | "saving_local" | "success" | "error"`.

- Botão Publicar **desabilitado durante processamento** e com guarda anti-duplo-clique
  (`if (processing) return`).
- Labels contextuais: Validando vídeo… / Enviando… / Salvando… / Salvando neste
  dispositivo… / Publicado! / Tentar novamente.
- `saving_local` é interno (quando Supabase não está configurado); `uploading` quando
  há tentativa remota. Erros exibem mensagem na própria tela + toast.

## 12 · Contexto opcional

- Apenas **evento / local / negócio / oferta** (NÃO pessoa como entidade contextual).
- Categoria derivada: local→PLACE, negócio→BUSINESS, oferta→OFFER, evento→EVENT,
  sem contexto→MOMENT.
- Armazenado como `{ tipo, id, título }` (`ReelContextRef`) — **sem duplicar a entidade
  completa**; a entidade é hidratada em tempo de exibição a partir dos mocks do
  ecossistema (ids reais), mantendo os deep links (`/local/$id`, `/business/$businessId`,
  `/event/$eventId`) funcionais.
- As opções vêm dos mocks (locais/negócios/eventos existentes), então funcionam
  inclusive sem Supabase.

## 13 · Thumbnail / pôster

- Reutilizado o mecanismo da rota original (`grabPoster` via canvas no frame do vídeo,
  `posterBlob` JPEG q0.82) — sem pipeline servidor.
- Modo local: pôster salvo como blob no IndexedDB e exibido via object URL.
- Modo Supabase: pôster enviado ao storage (`*-poster.jpg`) e referenciado no insert.

## 14 · Rascunho (metadata textual)

- A metadata textual (legenda e contexto `{tipo,id,título}`) é persistida em
  `localStorage` (`connexy:reels:published:v1`) — nunca o vídeo.
- O **arquivo de vídeo precisa ser reselecionado** após um reload do app (comportamento
  mínimo aceitável documentado): o fluxo parte da seleção do vídeo em todas as sessões.

## 15 · `deleteLocalReelMedia`

Existe em `reel-local-media-db.ts` (exclui o registro do IndexedDB e revoga as object
URLs de vídeo/pôster) mesmo sem UI de exclusão acoplada nesta fase. Há também
`deleteStoredPublishedReel()` para a metadata em `reel-local-storage.ts`.

## 16 · Feed unificado — `getReelFeed()`

- `getReelFeed()` = publicados locais (recém-publicado primeiro, pois `saveStoredPublishedReel`
  faz `unshift`) + mocks, **sem ids duplicados** (Set de dedupe).
- `sortSmart` do feed tende a rankear o recém-publicado no topo (fator idade ≈ 0).
- `getReelById()` resolve mocks e publicados locais; aplica `likedByMe` persistido.
- `_app.reels.tsx` consome `getReelFeed()`; `$reelId.tsx` consome `getReelById()`.
- Tolerante a IndexedDB bloqueado (pula reels sem mídia; loading sempre finaliza).

## 17 · Navegação pós-publicação e deep link

- Após publicar, navega via rota tipada `nav({ to: "/reels/$reelId", params: { reelId } })`.
- Share/WhatsApp continuam funcionando com URL `/reels/$reelId` (mesmo padrão da Fase 3A),
  inclusive para reels publicados localmente.

## 18 · Likes/comentários do novo reel

- Stats do novo reel começam **coerentes/vazios**: `{ likes: 0, comments: 0, shares: 0,
  saves: 0, views: 0, duration }`, `likedByMe: false`, `savedByMe: false`.
- Curtidas e comentários persistem pelos mesmos mecanismos da Fase 3A
  (`toggleReelLike`, `addReelComment`), funcionando para ids de reels publicados.

## 19 · Integridade da FASE 3A

- Autoplay, um vídeo por vez, pausa em aba oculta, som persistente, likes/comentários
  locais, share/WhatsApp, contexto, deep link, busca e multi-vídeo **preservados**:
  o feed e o player não foram alterados em comportamento; apenas a fonte de dados
  (`getReelFeed`/`getReelById`). `tsc`, build e ESLint passam nas rotas alteradas.

## 20 · Supabase real — resultado da validação

- `.env` possui `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (projeto Lovable),
  então `isSupabaseConfigured()` retorna `true` e a publicação **tenta** o caminho real.
- A validação de ponta a ponta do caminho remoto **não foi confirmada** neste ambiente:
  sem um usuário autenticado (`auth.getUser()`), o upload/insert é bloqueado pelo RLS
  ("Author can insert reel" exige `auth.uid() = author_id`) e o fluxo cai, de forma
  honesta, para `persistence: "local"`.
- **Cenário sem Supabase configurado**: coberto por design — `reel-publish` nunca toca o
  cliente quando não configurado e a rota não usa mais `useAuth()` (que acessava o
  cliente e lançava exceção sem env). Feed/detalhe não importam Supabase.

## 21 · tsc / build / ESLint

- `npx tsc --noEmit` → **limpo** (0 erros).
- `npm run build` → **ok** (client + SSR/nitro; `routeTree.gen.ts` sem mudanças).
- ESLint nos arquivos novos/alterados → **0 erros/avisos** (após `--fix` prettier).
- ESLint geral → **473 erros / 17 avisos** (baseline pré-existente da Fase 3A; **0
  introduzidos**).
- Smoke test SSR: `/gerenciar/novo-reel`, `/reels` e `/reels/reel-001` retornam HTTP 200.

---

## RESUMO FINAL

| Item | Resultado |
|---|---|
| Arquivos novos | 4 (`reel-limits`, `reel-local-media-db`, `reel-publish`, `reel-feed`) |
| Arquivos alterados | 4 (`reel-local-storage`, `gerenciar.novo-reel`, `_app.reels`, `$reelId`) |
| Modo de persistência | IndexedDB local (sempre, p/ feed) + Supabase real (tentativa; fallback honesto) |
| Supabase real validado? | Parcial — tentativa real implementada e executada; sem usuário autenticado no ambiente, cai para local com aviso claro |
| `tsc --noEmit` | OK |
| `npm run build` | OK |
| ESLint novos erros | 0 |
| ESLint baseline | 473 erros pré-existentes (inalterado) |
| Commits | Nenhum (conforme instrução) |

**Pendências / observações**
1. Validar o caminho Supabase real com um usuário autenticado e bucket `reels-media`
   criado (não realizado por falta de sessão no ambiente).
2. O arquivo de vídeo deve ser reselecionado após reload (rascunho é só metadata).
3. Reels publicados localmente vivem no dispositivo; em outro dispositivo/browser não
   aparecem (semântica intencional do modo local).
4. Sem UI de exclusão nesta fase, mas `deleteReelMedia`/`deleteStoredPublishedReel`
   estão disponíveis para a próxima fase.
