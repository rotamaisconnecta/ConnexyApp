
# Fase 1 — Bio editável, posts, redesign do chat e compartilhar lugar

Escopo focado no que você marcou como prioridade. Eventos, ofertas com geofence, corrida aceita, notificações push simuladas e substituição de "Rota" por "Lugares" ficam para a **Fase 2** (planejo separadamente ao final desta).

---

## 1. Ativar Lovable Cloud

Cloud liga banco + auth + storage para posts/mídia. Sem isso, a bio editável e o feed pessoal se perdem ao recarregar.

Após ligar, na mesma leva de migrações crio:

### Tabelas (schema `public`, com GRANTs + RLS)

- **`profiles`** (1↔1 com `auth.users`)
  - `id uuid pk` (= `auth.uid()`), `handle text unique`, `name`, `age`, `photo_url`, `bio`, `headline`, `mood_emoji`, `mood_text`, `now_playing_kind`, `now_playing_title`, `now_playing_subtitle`, `interests text[]`, `vibe_tags text[]`, `looks_for text[]`, `created_at`.
  - Trigger `handle_new_user` cria linha em `profiles` no signup.
  - RLS: SELECT `TO anon, authenticated USING (true)` (bio é pública, este era o pedido); INSERT/UPDATE só do próprio (`auth.uid() = id`).

- **`bio_posts`**
  - `id`, `author_id → profiles(id)`, `text`, `media_url`, `media_kind` (`image|video|null`), `place_id → places(id) null`, `created_at`.
  - RLS: SELECT público; INSERT/UPDATE/DELETE só do autor.

- **`places`** (para permitir "compartilhar lugar no chat" com dados reais)
  - `id`, `name`, `description`, `category`, `cover_url`, `lat`, `lng`, `owner_id null`, `created_at`.
  - Seed inicial via migration com os locais que já existem em `mock-data.ts`.
  - RLS: SELECT público; INSERT/UPDATE só do `owner_id`.

- **`user_roles`** + enum `app_role` + função `has_role(uuid, app_role)` (padrão do template — necessário para futuras rotas admin).

Storage bucket `bio-media` (público read, upload autenticado) para imagens/vídeos dos posts.

> Eventos e ofertas ficam para Fase 2. Adianto os `places` agora porque o chat já precisa deles.

---

## 2. Auth mínima

- Nova rota pública `/auth` (email/senha + Google via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`).
- `src/routes/_authenticated/route.tsx` gerenciado (não vou editá-lo).
- Rotas que passam a exigir auth (movidas para `_authenticated/`): perfil próprio, painel de gerenciamento, chat e solicitação. Home, `/perfil/$id`, `/local/$id` e `/locais` continuam públicas para preservar link compartilhável de bio.
- Bearer attacher já registrado em `src/start.ts` (verifico e mantenho).

---

## 3. Bio pública dinâmica (`/perfil/$id`)

A tela já existe com layout "Vibe Card". Migração para dados reais:

- Loader passa a chamar um `getPublicProfile.functions.ts` (server fn público com cliente publishable) que devolve `profile` + `bio_posts` + `favorite_places`.
- `commonGround` migra para função que compara `interests`/`vibe_tags` do perfil visto com os do `useCurrentUser()` (do lado cliente).
- Feed de "Momentos" agora vem de `bio_posts` real, com suporte a foto **e vídeo** (`<video controls playsInline>` quando `media_kind='video'`).
- Regra de privacidade ≤2 km continua respeitada.

---

## 4. Painel do criador — bio editável (Fase 1 apenas para posts)

Nova rota `/_authenticated/gerenciar` com abas:

- **Perfil**: editar `name`, `handle`, `photo_url`, `bio`, `headline`, `mood`, `nowPlaying`, `interests[]` (chips), `vibe_tags[]`, `looks_for[]`.
- **Meus posts**: listar `bio_posts` do usuário atual + botão "Novo post" (texto obrigatório; upload opcional para bucket `bio-media`; vincular a um `place` opcional). Editar/apagar inline.

Botão "Editar bio" no `/_authenticated/perfil` leva para o painel.

*(Aba Eventos e aba Empresa/Ofertas entram na Fase 2.)*

---

## 5. Redesign completo do chat (`/_authenticated/chat/$id`) — conforme imagem

Reescrita do layout preservando o `PhoneFrame`:

- **Header**: avatar 44 px com anel roxo + ponto verde, nome grande + selo `BadgeCheck`, "Online agora"/"visto há…". Botões redondos brancos com sombra para telefone / vídeo / menu.
- **Banner de distância**: card branco arredondado logo abaixo, ícone `MapPin` em círculo lilás, "Vocês estão a X km de distância" + "Bairro …" (para ≤2 km mostra "Próximo de você" e esconde a distância exata, seguindo a regra de privacidade); botão outline "Ver no mapa" abre bottom sheet com `MapCanvas`.
- **Chip de data** "HOJE" centralizado com linhas laterais.
- **Balões**:
  - Outros: fundo branco, texto foreground, cantos `rounded-3xl` com canto inferior esquerdo `rounded-md`, sombra suave, timestamp cinza, reações abaixo em pill branca.
  - Meus: `bg-gradient-brand` roxo, texto branco, canto inferior direito `rounded-md`, ticks `Check`/`CheckCheck`.
  - Avatares só nos balões do outro; agrupamento por autor (sem repetir avatar em sequências).
- **Áudio**: waveform sintética (barras animadas), botão play circular, duração.
- **Composer**: input pill grande "Digite uma mensagem…", botão `+` roxo à esquerda, botão de microfone lilás à direita.
- **Attach tiles** (Galeria, Câmera, Áudio, Localização, Contato, Mais) em cards brancos com sombra, ícone roxo, exatamente como na referência.
- Renderers `MText`, `MLocation`, `MAudio` refeitos; `MeetupSheet` mantém API mas UI ganha o mesmo skin.

---

## 6. Compartilhar localização no chat com confirmação

Fluxo:

1. Attach tile "Localização" ou botão `MapPin` no header abrem a `MeetupSheet`.
2. Sheet lista `places` (do banco) ordenados por distância ao usuário.
3. Cada card tem "Sugerir aqui" e "Ver local".
4. Clicar em "Sugerir aqui" abre uma **AlertDialog de confirmação** ("Compartilhar esta localização com {nome}?") — botões "Cancelar" / "Compartilhar". Só após confirmar, o balão `MLocation` é renderizado no chat com nome/endereço/mapa mini + link "Ver local".
5. "Compartilhar minha localização atual" também passa por confirmação.

*Mensagens de chat continuam em estado local nesta fase — persistência real de mensagens fica para Fase 2 para não estourar o escopo.*

---

## 7. Solicitação de chat — preview de bio

Já existe. Ajustes:

- Card de preview no topo com foto grande, nome, `headline` e 3 chips de "terreno em comum" — visualmente igual a um mini "Vibe Card" clicável.
- Card inteiro é link para `/perfil/$id?from=solicitacao`.
- Botões "Recusar" / "Aceitar" preservados.

---

## 8. Detalhes técnicos

- **Server functions** (todas em `src/lib/*.functions.ts`, client-safe):
  - `getPublicProfile({ id })` — publishable client.
  - `getMyProfile()`, `updateMyProfile(input)` — `requireSupabaseAuth`.
  - `listMyBioPosts()`, `createBioPost(input)`, `updateBioPost(input)`, `deleteBioPost({id})` — `requireSupabaseAuth`.
  - `listPlaces()` — publishable client (usado no chat).
- **Uploads** de mídia: `supabase.storage.from('bio-media').upload(...)` direto do cliente autenticado.
- **Query**: `useSuspenseQuery` + `ensureQueryData` no loader, seguindo o padrão do template.
- **Design tokens**: só `bg-surface`, `bg-gradient-brand`, `text-primary`, `text-muted-foreground`, `bg-accent`, `border-border`, `shadow-soft/elegant`. Zero cor hard-coded.
- **Animações**: `framer-motion` para entrada de balões, sheet e cards.
- **Bottom nav**: mantido como está nesta fase (a troca "Rota → Lugares" é da Fase 2 conforme sua priorização).
- **Notificações globais / toasts / geofence / corrida aceita**: Fase 2.

---

## 9. Validação (Playwright + build)

1. Signup → linha em `profiles` criada por trigger.
2. `/gerenciar` → edito bio, adiciono post com imagem, apago post.
3. `/perfil/{outro-id}` público (deslogado) mostra os posts que o outro publicou.
4. Solicitação → card de preview leva à bio; aceitar leva ao chat redesenhado.
5. Chat: header + banner de distância + balões + composer batem com a referência; abrir `MeetupSheet` → "Sugerir aqui" → **AlertDialog** → confirmar → balão de localização aparece.
6. Regra ≤2 km: em todas as telas, distância exata só aparece acima de 2 km.
7. `bun run build` limpo.

---

## Fora do escopo (planejo separado para Fase 2)

Assim que Fase 1 estiver aprovada e mergeada, entrego em plano próprio:
- Eventos (schema + CRUD + descoberta).
- Empresas/lugares próprios + ofertas ativas com raio de geofence + toggle ativa/desativa.
- Simulação de geofencing em background + notificação push local.
- Bottom sheet "Corrida aceita" com dados do motorista + ETA.
- Central de notificações global (toasts + badge no ícone).
- Substituir "Rota" por "Lugares" no bottom nav e migrar rota.
