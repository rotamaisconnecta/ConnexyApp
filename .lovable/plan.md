
# Reels Connecta — espaço de vídeos verticais contextuais

Inspirado na referência (movea), mas com a personalidade do Connecta: cada reel é **ancorado a um lugar/evento real** e a pessoas próximas. Não é só vídeo — é um momento geolocalizado que conecta.

---

## 1. Diferencial Connecta (não é cópia do Instagram)

Cada reel carrega três camadas exclusivas sobrepostas ao vídeo:

- **Chip de local** (topo-esq): "Vila Madalena, SP · 2,3 km de você" — clicável, leva para `/local/$id`.
- **Chip de evento/vibe** (abaixo do local, quando existir): "Evento Hoje · Festa Sunset · 18:00 · 1,2 km".
- **Pill "Com {nomes} +N pessoas"** acima do áudio — mostra outras pessoas do Connecta que estavam no mesmo lugar/evento. Clicar abre mini-lista com atalho "Enviar solicitação de chat".

Isso transforma o reel em **prova social de presença** — o motor do app.

---

## 2. Navegação

- Novo item no bottom nav: **Reels** (ícone `Clapperboard` ou `Play`), substituindo nada por enquanto — inserido entre Home e Connecta (5 itens viram 5 mantendo os atuais; se preferir 4, ver alternativa no fim).
- Rota `/_app/reels` (pública, dentro do layout já existente com `PhoneFrame`).
- Também acessível como aba dentro de `/home` no topo ("Reels" / "Amigos") em versão futura — Fase 1 entrega só a página dedicada.

---

## 3. Layout da tela `/reels`

Snap scroll vertical fullscreen dentro do `PhoneFrame`:

- **Header transparente** sobre o vídeo: logo Connecta centralizada, `Search` e ícone de mensagens (badge) à direita, tabs "Reels" / "Amigos" abaixo.
- **Vídeo** em `object-cover` ocupando toda a tela, com gradiente inferior para legibilidade.
- **Coluna de ações à direita** (vertical, como referência):
  - Avatar do autor com botão `+` roxo para seguir.
  - `Heart` + contagem (curtir).
  - `MessageCircle` + contagem (comentários — abre bottom sheet).
  - `Send` (compartilhar via chat interno — abre `MeetupSheet`-like para escolher conversa).
  - `Bookmark` (salvar).
  - `MoreHorizontal` (menu: denunciar, não me interessa).
  - Miniatura do áudio girando (link para "Ver mais reels com este som").
- **Bloco inferior esquerdo**:
  - Linha autor: avatar + nome + `BadgeCheck` + botão outline "Seguir".
  - Legenda com emojis, truncada em 2 linhas + "mais".
  - Pill "Com Juliana, Pedro e +12 pessoas" (nova, marca Connecta).
  - Linha de áudio "♪ The Nights – Avicii" com marquee sutil.
- **Barra de progresso** segmentada no rodápe (5 segmentos, ativo com `bg-gradient-brand`).
- **Snap scroll** com `snap-y snap-mandatory` — cada reel é uma section `h-full snap-start`.

Cores: **fundo preto** só nesta tela (o app é claro). Adiciono token `--reel-surface: #0a0a0a` no `styles.css` e uso `bg-[hsl(var(--reel-surface))]` apenas neste escopo, sem quebrar o resto.

---

## 4. Interações

- **Play/pause** ao tocar no vídeo.
- **Double-tap** curte (animação coração roxo `framer-motion`).
- **Mute/unmute** com ícone flutuante que aparece 1.5s.
- **Autoplay** do reel visível via `IntersectionObserver` (threshold 0.7); pausa quando sai da viewport.
- **Prefetch** do próximo vídeo (`<video preload="metadata">` no próximo item).
- **Regra de privacidade ≤2 km**: no chip de local, se distância < 2 km mostra "Próximo de você" em vez do valor exato (mantém padrão do app).

---

## 5. Botão "Criar reel"

- Na tela de reels: FAB circular `bg-gradient-brand` com `+` (canto inferior direito, acima da bottom nav).
- Também em `/gerenciar` → nova aba **Reels** listando os do usuário + botão "Novo reel".
- **Composer** (`/_authenticated/gerenciar/novo-reel` ou modal): upload de vídeo (mp4/webm, ≤60s, validado client-side), preview, campos: legenda, `place_id` (select de `places`), `event_id` opcional (Fase 2), tags de pessoas presentes (autocomplete de amigos), trilha (texto livre nesta fase).

---

## 6. Backend (Lovable Cloud)

Nova tabela `reels` + storage bucket:

- **`reels`**: `id`, `author_id → profiles(id)`, `video_url`, `poster_url`, `caption`, `place_id → places(id) null`, `audio_label`, `tagged_user_ids uuid[]`, `duration_s int`, `created_at`.
  - RLS: SELECT `TO anon, authenticated USING (true)`; INSERT/UPDATE/DELETE só do autor.
  - GRANT SELECT em `anon, authenticated`; ALL em `service_role`.
- **`reel_likes`**: `reel_id`, `user_id`, PK composta. RLS: SELECT público; INSERT/DELETE só do próprio user.
- **`reel_comments`**: `id`, `reel_id`, `author_id`, `text`, `created_at`. RLS: SELECT público; INSERT do autenticado; DELETE só do autor.
- **Storage bucket `reels-media`**: público read, upload autenticado (mp4/webm/poster jpg).

Contagens (likes/comments) via **view materializada** ou `count` inline em query (Fase 1 usa `count` inline — simples).

---

## 7. Server functions (client-safe `.functions.ts`)

- `listReels({ cursor })` — publishable client, ordena por `created_at desc`, paginado 10 em 10, join com `profiles` e `places`.
- `getReelDetail({ id })` — publishable client (para deep-link `/reel/$id`, Fase 2).
- `createReel(input)` — `requireSupabaseAuth`.
- `deleteReel({ id })` — `requireSupabaseAuth`, valida author.
- `toggleReelLike({ reelId })` — `requireSupabaseAuth`, upsert/delete.
- `listReelComments({ reelId })` / `addReelComment({ reelId, text })` — publishable / auth.

Upload de vídeo direto do cliente autenticado via `supabase.storage.from('reels-media').upload(...)`. Poster gerado no cliente com `<video>` + `canvas.toDataURL('image/jpeg')` no primeiro frame.

---

## 8. Seed / demo

Migração inclui 4–5 reels de demo (vídeos curtos públicos livres de direito) vinculados aos `places` já semeados, para a tela nascer cheia enquanto ninguém publicou.

---

## 9. Arquivos

**Novos**
- `src/routes/_app.reels.tsx` — feed vertical.
- `src/components/reels/reel-card.tsx` — item individual com overlays.
- `src/components/reels/reel-actions.tsx` — coluna direita.
- `src/components/reels/reel-overlay-chips.tsx` — chips local/evento/pessoas.
- `src/components/reels/comments-sheet.tsx` — bottom sheet.
- `src/routes/_authenticated/gerenciar.novo-reel.tsx` — composer.
- `src/lib/reels.functions.ts` — server fns.
- Migração SQL: `reels`, `reel_likes`, `reel_comments`, bucket, seeds.

**Editados**
- `src/components/bottom-nav.tsx` — adiciona item Reels.
- `src/routes/_app.gerenciar.tsx` — aba "Reels".
- `src/styles.css` — token `--reel-surface`.

---

## 10. Validação

1. `bun run build` limpo.
2. Playwright: abrir `/reels` → 3 reels renderizam, autoplay muda ao rolar, double-tap curte, tap no chip de local navega para `/local/$id`.
3. Criar reel autenticado → aparece no topo do feed.
4. Curtir/descurtir persiste após reload.
5. Regra ≤2 km respeitada no chip de local.

---

## Fora do escopo (Fase 2 do Reels, se pedir)

- Aba "Amigos" com feed filtrado.
- Deep-link `/reel/$id` com OG image para compartilhamento externo.
- Filtros e trilhas nativas (biblioteca de áudios).
- Edição client-side (trim, textos, stickers).
- Reels vinculados a eventos (depende de `events` da Fase 2 geral).

---

## Alternativa de bottom nav

Se preferir manter 5 itens: **substituo "Rota"** por "Reels" (Rota migra para dentro de Home como já está no card de mobilidade). Alinha com o plano geral de "Rota → Lugares" da Fase 2. Prefere substituir ou adicionar? Se não responder, mantenho os 5 atuais + Reels vira o 6º com layout compacto.
