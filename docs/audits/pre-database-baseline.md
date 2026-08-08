# Auditoria Técnica Pré-Banco de Dados — Connexy

- **Data:** 2026-08-07
- **Repositório:** `/home/ricardo/Downloads/opencode-project/ConnexyApp` (branch `main`, HEAD `34e2093`)
- **Escopo:** baseline técnica antes de qualquer alteração no Supabase. Nenhum código de produção, configuração, migration, banco ou lockfile foi alterado.
- **Comandos executados que gravam apenas artefatos de build gitignored:** `npm run lint`, `npm run build`, `npx tsc --noEmit`. `git status` permaneceu limpo após a execução.

> Nota de caminho: o repositório indicado no pedido (`/home/ihm/Conexy`) não existe nesta máquina. A auditoria foi executada no diretório real do projeto (`ConnexyApp`).

---

## 1. Resumo executivo

O Connexy é uma SPA/SSR **TanStack Start** (React 19 + Vite + Nitro com alvo Cloudflare Workers), gerada via `@lovable.dev/vite-tanstack-config`. O projeto **compila** (`build` OK, `tsc` OK) e **falha no lint** (490 problemas, 473 erros de formatação Prettier). Não há testes configurados (sem script, sem Vitest instalado).

O estado real de dados:

- **6 tabelas** existem nas migrations (`profiles`, `places`, `bio_posts`, `reels`, `reel_likes`, `reel_comments`) e 5 migrations no total.
- A camada `repositories → services → hooks/api` é **código real, porém morto**: os 9 hooks de API não são importados por nenhuma rota/componente (0 importadores fora de `src/hooks/api/`), e consultam **~15 tabelas "fantasma"** que não existem nas migrations (ex.: `rides`, `messages`, `conversations`, `notifications`, `businesses`, `events`, `offers`, `coupons`, `connection_requests`, `moments`, `compatibility`, `likes`).
- **Toda a interface é alimentada por mocks**: `src/lib/mock-data.ts` (558 linhas), `engine-mocks.ts`, `mock-businesses.ts`, `reel-mocks.ts`, `mock-conversations.ts`, `feed-sections.ts`, `home-premium.ts`, `mock-sponsored-content.ts` + ~16 conjuntos `MOCK_*` inline em rotas.
- **Fluxos reais conectados ao Supabase hoje:** autenticação (`supabase.auth.*` em rotas/hook) e publicação de Reels (`src/lib/reels/reel-publish.ts`). O restante é simulado.
- **Segurança:** `.env` está versionado no Git; não há CSP nem rate limiting; `supabaseAdmin` (service role) não é exposto ao bundle e não é importado em lugar nenhum; a middleware `requireSupabaseAuth` (validação server-side) existe mas nunca é usada; uploads validados apenas no cliente; políticas de Storage de `reels-media` sem restrição de pasta.

Recomendação geral: **ADIAR/CORRIGIR**. Manter a camada de serviços/repositórios como referência, corrigir o lint e os artefatos sensíveis (`.env`), e **criar** as migrations/tabelas/RLS/RPCs correspondentes antes de conectar o UI real.

---

## 2. Estado do Git

| Item | Resultado | Evidência |
|---|---|---|
| Branch atual | `main` | `git branch --show-current` |
| Commit atual | `34e2093` "atualizar" | `git log --oneline -5` |
| Últimos commits | `34e2093` → `1b708f5` → `efe85b6` → `c73d921` (codegen routeTree) → `a60b176` (merge Fase 2) | `git log` |
| Alterações não commitadas | **Nenhuma** (`git status --short` vazio; 0 linhas) | `git status --short` |
| `.env` versionado | **SIM** — `.env` é rastreado pelo Git (commit `5849ddc`) | `git ls-files .env`; `.gitignore` não cobre `.env` |

Nenhum comando destrutivo do Git foi executado. O build regenerou apenas artefatos gitignored (`.output/`, `.wrangler/`); `git status --short` continuou limpo.

---

## 3. Stack e versões reais

Fonte: `package.json` + `package-lock.json` (resolvido em `node_modules/.package-lock.json`, lockfileVersion 3 = instalado via npm).

| Tecnologia | package.json | Resolvido (lock) | Em uso real |
|---|---|---|---|
| Package manager | `bun.lock` + `bunfig.toml` + `package-lock.json` | npm (bun não instalado) | **npm** (node_modules vem do npm) |
| Node | — | **v22.13.0** (runtime) | — |
| React / react-dom | ^19.2.0 | **19.2.7** | Sim |
| Vite | ^8.0.16 | **8.1.3** | Sim |
| TypeScript | ^5.8.3 | **5.9.3** | Sim |
| TanStack Router | ^1.170.16 | **1.170.17** | Sim |
| TanStack Start | ^1.168.26 | **1.168.27** | Sim (SSR/Nitro) |
| TanStack Query | ^5.101.1 | **5.101.2** | Parcial (Provider montado no `__root.tsx`; nenhum `useQuery` ativo fora da camada morta) |
| Tailwind CSS | ^4.2.1 | **4.3.2** | Sim (`@tailwindcss/vite`) |
| Supabase | ^2.110.1 | **2.110.1** | Sim (auth + reels) |
| Zod | ^3.24.2 | **3.25.76** | Sim (validação em services) |
| Nitro | 3.0.260603-beta | beta | Sim (preset Cloudflare no build) |
| ESLint | ^9.32.0 | 9.32.0 | Sim |
| **Vitest / testes** | **NÃO consta** | **NÃO instalado** (`node_modules/vitest` inexistente) | **Não** |
| Jest/Playwright/Cypress | Não consta | — | Não |

**Arquitetura confirmada** (`vite.config.ts`, `src/server.ts`, `src/start.ts`, build): TanStack Start SSR com `server.entry = "server"` (`src/server.ts`), empacotado por Vite e compilado por **Nitro** para Cloudflare Workers (build gera `.output/server/wrangler.json`, `.wrangler/deploy/config.json`). Não é uma SPA pura nem TanStack Start somente cliente: o servidor Nitro faz SSR e renderiza a página de erro (`src/lib/error-page.ts`).

**Divergência de package manager:** há `bun.lock` + `bunfig.toml` commitados, mas o `node_modules` foi instalado com npm e o binário `bun` não existe no ambiente. Dois lockfiles coexistindo = fonte de divergência.

---

## 4. Estrutura e contagens reais

| Categoria | Contagem | Evidência |
|---|---|---|
| Arquivos `.ts` | 256 | `find src -name "*.ts"` |
| Arquivos `.tsx` | 480 | `find src -name "*.tsx"` |
| **Total `.ts`/`.tsx`** | **736** | |
| Arquivos em `src/routes/` | 78 (77 rotas + `README.md`) | `find src/routes -type f` |
| Componentes (`src/components`) | 390 `.tsx` | |
| Hooks (`src/hooks`) | 22 | (9 `api/`, 9 `system/`, 4 raiz) |
| Providers (`src/providers`) | 9 | (auth 2, presence 1, realtime 2, system 4) |
| Services (`src/services`) | 10 | |
| Repositories (`src/repositories`) | 8 | |
| Módulos `src/lib` | 190 | |

### 4.1 Árvore real de rotas (gerada — `src/routeTree.gen.ts`)

- Rotas públicas: `/`, `/auth`, `/cadastro`, `/completar-perfil`, `/finalizar-perfil`, `/interesses`, `/localizacao`, `/welcome`.
- Layout `_app` com ~76 rotas (ver `routeTree.gen.ts:469-545` para a lista completa de `FileRoutesByFullPath`).
- Convenções **mistas**: arquivos planos com ponto (`_app.connecta.tsx`) e diretórios (`_app/feed.tsx`, `_app/chat.tsx`, `_app/create/*`) coexistem no mesmo `_app`.

### 4.2 Rotas duplicadas / conflitantes / sem uso

| Rota | Situação | Evidência |
|---|---|---|
| `/chat/$id` vs `/chat/$conversationId` | **Conflito de segmento dinâmico**: dois filhos de `/chat` casam o mesmo padrão `/{param}`. `_app.chat.$id.tsx` é um redirect para `$conversationId`, mas registra a rota dinâmica duplicada | `routeTree.gen.ts:448-457`; `src/routes/_app.chat.$id.tsx:3-7` |
| `/people` vs `/pessoas` | Duplicação conceitual ("Pessoas Próximas") com telas diferentes | `src/routes/_app.people.tsx`; `src/routes/_app.pessoas.tsx` |
| `/notifications` vs `/notificacoes` | Duplicação conceitual | `src/routes/_app/notifications.tsx`; `src/routes/_app.notificacoes.tsx` |
| `/profile` + `/profile/roles` vs `/perfil/` + `/perfil/$id` | Duplicação conceitual (perfil pt/en) | `routeTree.gen.ts:278-282, 318-327` |
| `/marketplace` | Rota sem uso de navegação identificado (não há item no `BottomNav` correspondente confirmado) | `src/routes/_app/marketplace.tsx` |
| `/ride` (layout) vs `/corrida` | Dois nomes para o mesmo domínio de mobilidade | `routeTree.gen.ts:143-147, 258-262` |

Nenhuma rota foi editada nem o `routeTree.gen.ts` foi modificado manualmente.

---

## 5. Resultado de build, TypeScript, lint e testes

Scripts reais detectados em `package.json` (não existe script de teste, typecheck, start nem check):

```
dev        vite dev
build      vite build
build:dev  vite build --mode development
preview    vite preview
lint       eslint .
format     prettier --write .
```

| Validação | Comando | Resultado | Resumo dos erros |
|---|---|---|---|
| **Build** | `npm run build` | ✅ **PASS** (exit 0, `✓ built in 1.59s`) | Gera `.output/server/*.mjs`, `wrangler.json`, `_headers`. Nenhum erro. |
| **TypeScript** | `npx tsc --noEmit` (sem script próprio) | ✅ **PASS** (exit 0) | 0 erros. `tsconfig.json` com `strict`, `skipLibCheck`, `noEmit`. |
| **Lint** | `npm run lint` | ❌ **FAIL** (exit 1) | **490 problemas (473 erros, 17 warnings)**, 473 corrigíveis; esmagadoramente `prettier/prettier` (faltam `;`/aspas duplas/quebra de linha). Ex.: `src/routes/_app/event.$eventId.tsx`, `src/lib/upload/*`, `src/components/upload/*`, `src/components/ui/*`. 17 warnings de `react-refresh/only-export-components` e `react-hooks/exhaustive-deps` nos providers. |
| **Testes** | — | ⚠️ **NÃO CONFIGURADO** | Sem script de teste no `package.json`; Vitest não está em `node_modules`; nenhum arquivo de teste em `src`. |

Notas:
- O lint roda em **todo** o repositório (`eslint .`), incluindo arquivos gerados ignorados? Não — `eslint.config.js` ignora `dist`, `.output`, `.vinxi`, e `routeTree.gen.ts` tem `/* eslint-disable */`. Os erros são de código real.
- Nenhuma dependência foi instalada/atualizada.

---

## 6. Inventário de mocks

### 6.1 Módulos centrais de mock (8)

| Arquivo | Conteúdo | Domínio(s) |
|---|---|---|
| `src/lib/mock-data.ts` (558 linhas) | `currentUser` ("lucas"), `people` (12), `findPerson`, `commonGround`, `drivers` (3), `places` (4), `suggestions` (3), `notifications` (4), `allInterests` (16), `compatibilityScore/Info/interestEmoji` | perfil, pessoas, conexões, locais, notificações, mobilidade |
| `src/lib/engine/engine-mocks.ts` | `mockUser`, `mockContext`, `MOCK_PEOPLE` (10), `mockRecommendations` (70), `mockTrending*` (25) | engine/recomendações |
| `src/lib/marketplace/mock-businesses.ts` | `MOCK_PROMOTIONS` (3), `MOCK_EVENTS` (2), `MOCK_BUSINESSES` (6), `MOCK_COUPONS` (3), `findBusinessById/findEventById` | negócios, eventos, promoções |
| `src/lib/chat/mock-conversations.ts` | `MOCK_CONVERSATIONS` (10), `search/sortMockConversations` | chat |
| `src/lib/chat/mock-conversation-invites.ts` | `MOCK_CONNECTED/MOCK_INVITED` + persistência em `localStorage` (`connexy.mock.conversation-invites`) | conexões, chat |
| `src/lib/reels/reel-mocks.ts` | `MOCK_REELS` (15), `findReelById` | Reels |
| `src/lib/ads/mock-sponsored-content.ts` | `SPONSORED_ADS` (6), `sponsoredActionMessage` | ads/promoções |
| `src/lib/feed/feed-sections.ts` + `home-premium.ts` | `MOCK_PEOPLE/PLACES/EVENTS/BUSINESSES/DRIVERS/TRENDING` (45), `HOME_EVENTS` (10), `EXTRA_CARDS` (7), `TRENDING_POSTS` (3), builders | feed, home |
| `src/lib/roles/roles-mocks.ts` | `mockCommonUser/Driver/Business/...` (7 estados) | roles — **código morto (0 consumidores)** |
| `src/lib/context/context-detector.ts` | `weatherCycle` (10 itens) — "All mock data lives here. Prepared for GPS integration." | contexto |

### 6.2 Mocks inline em rotas/componentes (16+)

`src/routes/_app/ride.tsx` (`MOCK_DESTINATIONS`), `_app/ride/request.tsx` (`MOCK_COUPONS`), `_app/ride/history.tsx` (`MOCK_HISTORY`), `_app/ride/matching.tsx` (`MOCK_DRIVERS`), `_app/ride/active.tsx` (`MOCK_DRIVER/MOCK_TRIP`), `_app/driver/index.tsx` (`MOCK_EARNINGS/MOCK_RIDE_REQUEST`), `_app/driver/history.tsx` (`MOCK_TRIPS`), `_app/driver/finance.tsx` (`MOCK_ENTRIES`), `_app/driver/profile.tsx` (`MOCK_VEHICLE`), `_app/driver/trip/$tripId.tsx` (`MOCK_RIDE`), `_app/notifications.tsx` (`MOCK_NOTIFICATIONS`, 8), `_app.reels.tsx` (`SEED_COMMENTS`), `components/post/mention-input.tsx` (`MOCK_USERS`), `components/notifications/NotificationBell.tsx` (`MOCK_BELL_NOTIFICATIONS`), `_app/driver/performance.tsx` (estatísticas hardcoded), `components/publisher/usePublisherForm.ts` (toast falso pós-800ms, sem persistência).

### 6.3 Classificação por domínio

| Domínio | Estado | Evidência |
|---|---|---|
| **auth** | ✅ **REAL** | `src/routes/auth.tsx:34,42` (`supabase.auth.signUp/signInWithPassword`); OAuth Google via `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts:34`); `src/hooks/use-auth.ts` |
| **perfil** | 🔶 HÍBRIDO | `currentUser` mock em 20+ arquivos; repos reais (`profile.repository.ts`) mas hook `use-profile` sem uso |
| **pessoas** | 🔴 SIMULADO | `mock-data.ts` `people` → `_app.people.tsx`, `_app.pessoas.tsx`, `person-detail-sheet` |
| **conexões** | 🔴 SIMULADO | `commonGround`, `connection_requests` (tabela inexistente), convites em `localStorage` |
| **feed** | 🔴 SIMULADO | `feed-sections.ts` → `feed-builder.ts` → `SmartFeed.tsx` → `_app/feed.tsx` |
| **Reels** | 🔶 HÍBRIDO | Feed: 15 `MOCK_REELS` + `localStorage`; **publicação REAL** em `reel-publish.ts` (Supabase `reels-media` + `reels`) |
| **eventos** | 🔴 SIMULADO | `mock-businesses.ts` `MOCK_EVENTS` + `home-premium.ts` `HOME_EVENTS` |
| **locais** | 🔴 SIMULADO | `mock-data.ts` `places` (4) — mesmas 4 rows do seed da migration |
| **negócios** | 🔴 SIMULADO | `MOCK_BUSINESSES` (6) → `_app/marketplace.tsx`, `business.$businessId.tsx` |
| **promoções** | 🔴 SIMULADO | `MOCK_COUPONS`, `SPONSORED_ADS` |
| **check-ins** | 🔶 HÍBRIDO | lógica real de presença + 9 registros seed `prs-seed-*` + `currentUser` (presence-provider, `localStorage`) |
| **chat** | 🔴 SIMULADO | `MOCK_CONVERSATIONS` (10); header do arquivo: "Banco de dados ainda não conectado" |
| **notificações** | 🔶 HÍBRIDO | 8 `MOCK_NOTIFICATIONS` + presença real (`_app/notifications.tsx:117`) |
| **mobilidade** | 🔴 SIMULADO | `MOCK_*` inline nas rotas `ride/*` e `driver/*`; `mock-data.ts` `drivers` |

Nenhum mock foi removido. Mocks coexistem com a camada real sem "offline-first" automático (exceção: `reel-publish.ts` faz Supabase → local honestamente).

---

## 7. Inventário Supabase

### 7.1 Diretório `supabase/`

| Item | Presente? | Evidência |
|---|---|---|
| `config.toml` | Sim (apenas `project_id = "lzejdgfvtybarpbgwsyp"`) | `supabase/config.toml` |
| Migrations | **5** | `supabase/migrations/*.sql` |
| Seeds | **Não** | `find supabase -type f` |
| Functions (Edge) | **Não** | idem |
| Testes | **Não** | idem |

### 7.2 Migrations (nomes + o que fazem)

| Migration | Faz |
|---|---|
| `20260709023719_b6fe530c-8e03-4dc4-a6cc-bde314507f25.sql` | Cria `profiles`, `places` (com 4 seed rows), `bio_posts`; grants (anon SELECT, authenticated CRUD); RLS + policies; funções `set_updated_at` (trigger) e `handle_new_user` (trigger em `auth.users`) |
| `20260709023733_2ded0438-761d-4f31-87ec-00792fc4fab9.sql` | Revoga EXECUTE de `handle_new_user`/`set_updated_at` de PUBLIC/anon/authenticated |
| `20260709023757_8aad550e-3d70-4f47-814b-bf936a02884e.sql` | Policies de Storage do bucket `bio-media` (leitura pública; escrita/upd/del restrita à pasta `auth.uid()`) |
| `20260710014946_f14f865b-5b49-4733-93d1-375890f4995c.sql` | Cria `reels`, `reel_likes`, `reel_comments` + índices + RLS/policies + policies de Storage do bucket `reels-media` |
| `20260711160607_40e9576c-40d3-4e66-bca2-73a7d6368f70.sql` | Troca policy de `profiles` para "Authenticated users can view profiles" e revoga SELECT de anon |

### 7.3 Tabelas declaradas nas migrations

`profiles`, `places`, `bio_posts`, `reels`, `reel_likes`, `reel_comments` (6 tabelas).

### 7.4 Tabelas "fantasma" consultadas no código (SEM migration, SEM tipo)

`likes`, `rides`, `conversations`, `conversation_participants`, `messages`, `notifications`, `moments`, `compatibility`, `businesses`, `events`, `offers`, `coupons`, `connection_requests` (+ `reviews`, `event_users` em strings de select). Origem: `src/repositories/{feed,ride,chat,notification,profile,marketplace}.repository.ts`, `src/services/discovery.service.ts`.

RPCs referenciados e **não definidos** em migrations/tipos: `get_nearby_profiles` (`discovery.service.ts:16`, `user.repository.ts:67`), `get_nearby_businesses` (`marketplace.repository.ts:31`), `get_compatibility`.

### 7.5 Tipos TypeScript gerados

- `src/integrations/supabase/types.ts` — gerado Lovable/Supabase: só as 6 tabelas, `Functions: { [_ in never]: never }`, `Enums: {}`, Postgrest 14.5.
- `src/types/database/{tables,views,rpc,database.types}.ts` — **manuais**: `tables.ts` usa `Row<T>` com fallback `Record<string, unknown>` para tabelas fora do `Database` (ex.: `Conversation`, `Message`, `Notification`, `Ride`, `Business`, `Event`, `Offer`, `Coupon`, `ConnectionRequest`, etc.), mascarando a ausência de schema real.

### 7.6 Clientes Supabase

| Cliente | Arquivo | Uso |
|---|---|---|
| Browser (publishable key) | `src/integrations/supabase/client.ts` (lazy Proxy, `sb_publishable_`/`sb_secret_` → header `apikey`) | 15 importadores; caminho vivo |
| Server (service role) | `src/integrations/supabase/client.server.ts` (`supabaseAdmin`, lê `SUPABASE_SERVICE_ROLE_KEY`) | **Importado em lugar nenhum** (sem risco de bundle) |
| Alias solto (`any`) | `src/lib/supabase/client.ts` | Todos os repositórios + `discovery.service` (bypassa tipagem rígida) |
| Wrappers não usados | `src/lib/supabase/{auth,realtime,database,rpc,storage,supabase-provider}.ts` | `storage.ts` usado por `upload.service` (morto); demais mortos |
| Providers Realtime | `src/providers/realtime/*` | Não montados; referenciam `VITE_SUPABASE_ANON_KEY` **que não existe no `.env`** |

### 7.7 Variáveis de ambiente (somente nomes)

`SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` (arquivo `.env`). **`SUPABASE_SERVICE_ROLE_KEY` não está definida** — `supabaseAdmin` lançaria erro se usado.

### 7.8 `public.users` / senhas

Não há tabela `public.users` nem armazenamento próprio de `password_hash`. Identidades vivem em `auth.users` (gerenciado pelo Supabase Auth); `handle_new_user` cria linha em `public.profiles` vinculada por FK `auth.users(id)` (migration `...23719`).

### 7.9 Service role no bundle do navegador

**Não.** `supabaseAdmin`/`createSupabaseAdminClient`/`SERVICE_ROLE` não aparecem em nenhum import de código não-server nem em nenhum asset de `.output/public/assets/*`. O único texto `sb_secret_` no bundle é o helper `isNewSupabaseApiKey` (sem material de chave).

### 7.10 Queries Supabase diretas em componentes/rotas

- `src/components/reels/comments-sheet.tsx:36-41,65-69` — `.from("reel_comments")` em componente (**código morto**, `CommentsSheet` não importado).
- `src/routes/__root.tsx:149` — `supabase.auth.onAuthStateChange`.
- `src/routes/auth.tsx:24,34,42`; `src/routes/index.tsx:22`; `src/routes/_app.gerenciar.tsx:143` — `supabase.auth.*`.
- `src/hooks/use-auth.ts:12,17` — sessão (usado por `_app.tsx`).
- `src/lib/reels/reel-publish.ts:100-121` — `getUser`, upload `reels-media`, insert `reels` (única escrita real viva).
- `src/integrations/lovable/index.ts:34` — `setSession` (bridge OAuth Lovable).

---

## 8. Matriz de RLS (migrations existentes)

| Tabela | RLS habilitado | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `profiles` | ✅ | `authenticated` USING(true) (mig final; anon revogado) | owner (`auth.uid() = id`) | owner | — (sem policy de delete) |
| `places` | ✅ | **anon + authenticated** USING(true) — inclui `lat/lng` | owner (`auth.uid() = owner_id`) | owner | owner |
| `bio_posts` | ✅ | anon + auth (pública) | author | author | author |
| `reels` | ✅ | anon + auth (pública) | author | author | author |
| `reel_likes` | ✅ | anon + auth (pública) | self (`auth.uid() = user_id`) | — | self |
| `reel_comments` | ✅ | anon + auth (pública) | author | — | author |
| Storage `bio-media` | — | pública | auth + pasta = `auth.uid()` | owner (pasta uid) | owner (pasta uid) |
| Storage `reels-media` | — | pública | auth (**sem restrição de pasta**) | owner | owner |

Gaps: 15 tabelas consultadas pelos repositórios não têm tabela/RLS no repositório; RPCs `get_nearby_*` desconhecidos. Se essas tabelas existirem fora do controle de migrations (criadas no dashboard), o estado real de RLS é **inverificável**.

---

## 9. Segurança

| Item | Estado | Evidência |
|---|---|---|
| Error Boundary global | ✅ Presente | `src/routes/__root.tsx:126-127` (`errorComponent`, `notFoundComponent`); 5 rotas com `errorComponent` próprio (`_app.perfil.$id.tsx:56`, `_app.local.$id.tsx:31`, `business.$businessId.tsx:23`, `event.$eventId.tsx:31`, `solicitacao.$id.tsx:30`) |
| CSP / security headers | ❌ **Nenhum** | `.output/public/_headers` só tem `cache-control` para `/assets/*`; zero matches de CSP/HSTS/XFO/permissions-policy/referrer-policy/helmet |
| Rate limiting | ❌ **Nenhum** | Sem `rate.limit`/429/retry-after; app sem endpoints de API |
| Uploads | ⚠️ Client-side apenas | `src/lib/reels/reel-publish.ts:104-131` (`validateReelVideo`: 250MB, mp4/mov/webm, 90s) e `src/services/upload.service.ts` (MIME de `file.type` + 10MB) — tudo no cliente, MIME spoofável; erros de upload engolidos (`publishReel` cai para local) |
| `user_id/author_id/owner_id` do cliente | ⚠️ Em camada morta | `ride.repository.ts:45,56` (update/rate sem filtro de ownership), `notification.repository.ts:21,32,38`, `discovery.service.ts:37-44,52-61`, `feed.repository.ts:43,48`, `chat.repository.ts:27-38,50-69` — **não alcançáveis pelo UI hoje**; virariam IDOR se conectadas sem RLS |
| `dangerouslySetInnerHTML` | 1 ocorrência baixa | `src/components/ui/chart.tsx:73` (padrão shadcn, CSS estático) |
| Localização de terceiros no browser | ⚠️ Mitigado por design | UI renderiza apenas `distanceMeters`/labels (`attendance-list.tsx:78`); presença é `localStorage`; **porém** `places.lat/lng` é pública via RLS e RPCs `get_nearby_*` podem expor coordenadas de outros usuários (funções não definidas no repo) |
| `.env` no Git | ❌ Rastreado | `git ls-files .env` → sim; contém apenas chaves publishable, mas é uma prática de risco |
| `supabaseAdmin` no bundle | ✅ Não exposto | ver §7.9 |
| Auth server-side | ⚠️ Ausente | `requireSupabaseAuth` (`auth-middleware.ts:34`) definido e **nunca importado**; gate de auth só client-side (`src/routes/_app.tsx:25-37`) |

---

## 10. Problemas críticos (P0)

1. **`.env` versionado no Git** — `git ls-files .env` confirma; `.gitignore` não cobre `.env`. Sem valores vazados em histórico (1 commit), mas deve sair do repositório antes de qualquer expansão.
2. **15+ tabelas "fantasma" + RPCs inexistentes na camada de repositórios** — `src/repositories/*`, `src/services/discovery.service.ts` consultam `rides`, `messages`, `conversations`, `notifications`, `businesses`, `events`, `offers`, `coupons`, `connection_requests`, `moments`, `compatibility`, `likes` etc., e `get_nearby_profiles`/`get_nearby_businesses`/`get_compatibility` que não existem em migrations nem tipos. Se o UI for conectado a essa camada antes do schema existir, tudo falha em runtime.
3. **Auth sem validação server-side** — `requireSupabaseAuth` morto; `_app.tsx` só protege no cliente; rotas SSR servem HTML sem sessão.
4. **Policy de upload `reels-media` sem restrição de pasta** — `auth.role()='authenticated'` permite qualquer usuário autenticado gravar em qualquer prefixo (migration `...14946:73-75`), divergente da proteção por pasta de `bio-media`.
5. **Migração aplicada mas versões divergentes** — `profiles` teve a leitura restrita a `authenticated` na última migration, mas `places`/`bio_posts`/`reels`/likes/comments continuam legíveis por **anon** (algumas intencionalmente feed-style; `places` expõe `lat/lng`).

## 11. Problemas importantes (P1)

1. **Lint quebrado** — `npm run lint` falha: 490 problemas (473 erros prettier). Bloqueia CI de qualidade.
2. **Nenhum teste** — sem script, sem Vitest instalado.
3. **Camada real (repos/services/hooks) 100% órfã** — `src/hooks/api/*` com 0 importadores; `ProfileService` sem uso; providers `auth-provider/session-provider/realtime-*` nunca montados. Alto custo de manutenção e risco de confusão com os mocks.
4. **Identidade do usuário hardcoded "lucas"** — `currentUser` em `mock-data.ts` e `CURRENT_USER_ID="lucas"` no presence-provider e no `reel-publish` (fallback) fazem a UI simular um usuário fixo.
5. **Catálogos de mock inconsistentes entre si** — "Café Aroma" (marketplace) vs "Café Central" (mock-data/seed); IDs não se cruzam (só Reels referenciam o ecossistema).
6. **Dois lockfiles commitados** (`bun.lock` + `package-lock.json`) e `bunfig.toml`, com `node_modules` instalado por npm — divergência de package manager.
7. **Rotas duplicadas/ambiguas** — `/people`+`/pessoas`, `/notifications`+`/notificacoes`, `/profile`+`/perfil`, `/chat/$id`+`/chat/$conversationId` (conflito de segmento dinâmico), `/ride`+`/corrida`.
8. **Sem headers de segurança / rate limiting** para o Worker (`.output/public/_headers`).
9. **Uploads sem validação server-side** (MIME spoofável) e erros de upload engolidos em `reel-publish.ts:141-146`.
10. **`VITE_SUPABASE_ANON_KEY` referenciada mas não definida** — `src/providers/realtime/*` quebrariam se montados.

## 12. Problemas posteriores (P2)

1. Código morto volumoso: `src/lib/ai/*` (13), `src/lib/orchestrator/*` (8), `engine-{score,utils,chat,feed,profile}.ts`, 3 componentes de engine, `roles-mocks.ts`, `CommentsSheet`, 9 hooks de API, 9 services inalcançáveis.
2. Convenção mista de rotas (ponto plano vs diretório) dificulta manutenção.
3. `react-refresh/only-export-components` warnings em todos os providers (17 warnings).
4. `chart.tsx:73` inline style e `error-page.ts` `onclick` inline exigiriam refactor para CSP estrito.
5. `process.env` referenciado em código de cliente (`reel-publish.ts:93-97`).
6. `publisher/usePublisherForm.ts` simula publicação com toast falso.
7. Sem `wrangler.toml`/`.dev.vars` no repo para envs de produção (Cloudflare).

---

## 13. Divergências entre o manual e o código

| Fonte | Alegação | Código real | Divergência |
|---|---|---|---|
| `README_INTEGRACAO.md:38-51` | Tabela `messages` recomendada (`conversation_id`, `sender_id`, `type`, `content`, `audio_url`, ...) | `messages` não existe nas migrations; `chat.repository.ts` consulta `messages` fantasma | Manual descreve schema que o repo já assume mas que nunca foi migrado |
| `README_INTEGRACAO.md:26-32` | Rota `/chat/123` usável | `/chat/$id` é só redirect para `/chat/$conversationId`; rota real é `/chat/$conversationId` | Rota do manual é aliased |
| `README_INTEGRACAO.md:64-76` | Chat "já implementado" com Supabase | Chat 100% simulado (`MOCK_CONVERSATIONS`, header "Banco ainda não conectado") | Overclaim de integração |
| `AUDITORIA_IMPLEMENTACAO_MVP.md:7` | Slogan: "Dados simulados locais. Banco ainda não conectado." | Confirmado, exceto auth e publish de Reels | **Manual antigo CONSISTENTE** com o código |
| `AUDITORIA_IMPLEMENTACAO_MVP.md:21-22` | Schema real = 6 tabelas; repositórios consultam 14+ | Confirmado (§7) | Consistente |
| `AUDITORIA_IMPLEMENTACAO_MVP.md:64-67` | `supabaseAdmin` quebrado por falta de `SUPABASE_SERVICE_ROLE_KEY` | Confirmado (§7.7) | Consistente |
| Reports recentes (`RELATORIO_FASE_3A/3B`) | Reels com publicação Supabase + fallback local | Confirmado em `reel-publish.ts` | Consistente |
| `README_INTEGRACAO.md` vs reports | Manual descreve fluxos como prontos; reports os marcam como pendentes | Código: mocks dominantes, camada real órfã | Manual mais otimista que reports |

Conclusão: os relatórios recentes estão alinhados ao código; o manual (`README_INTEGRACAO.md`) exagera o estado de integração com o Supabase.

---

## 14. Recomendação: MANTER, CORRIGIR, CRIAR ou ADIAR

**Recomendação global: CORRIGIR (com partes CRIAR e ADIAR).**

- **MANTER:** camada `repositories`/`services` como blueprint de domínio (estrutura boa); migrations de `profiles/places/bio_posts/reels/reel_likes/reel_comments`; mocks como base visual para esforço de dados.
- **CORRIGIR (antes de qualquer banco):** tirar `.env` do Git; rodar `format` + corrigir lint; resolver o conflito de rotas `/chat/*`; definir policies de Storage `reels-media` por pasta `auth.uid()`; wire do `requireSupabaseAuth` quando existirem server fns.
- **CRIAR (na fase de banco, em migrations novas — não editar as existentes):** as 15 tabelas fantasma com RLS por usuário (auth.uid()), RPCs `get_nearby_profiles`/`get_nearby_businesses`/`get_compatibility`, bucket policies para `avatars`/`posts`, e seeds de dev.
- **ADIAR:** conectar rotas reais à camada repos/services até o schema + RLS existirem e serem testados; módulos IA/orchestrator (ficam desconectados por ora).

---

## 15. Próximos passos na ordem segura

1. Remover `.env` do controle de versão (`git rm --cached .env`) e adicionar `.env*` ao `.gitignore` (sem rotacionar ainda; valores são publishable).
2. `npm run format` + corrigir erros restantes de `npm run lint` até exit 0 (commit separado).
3. Definir 1 lockfile oficial (decidir npm vs bun) e remover o outro + `bunfig.toml` se npm for o padrão.
4. Resolver duplicidades de rota: eliminar `/chat/$id` (redirect já cobre), `/pessoas`, `/notificacoes`, `/perfil` vs `/profile`, `/corrida` vs `/ride` — escolher um nome por conceito.
5. Congelar o inventário de mocks por domínio (já feito neste relatório) como contrato para o schema.
6. Escrever migration nova (não editar as 5 existentes) criando: `rides`, `conversations`, `conversation_participants`, `messages`, `notifications`, `moments`, `likes`, `connection_requests`, `businesses`, `events`, `event_users`, `offers`, `coupons`, `reviews`, `compatibility` — com RLS mínimo (SELECT envolvido; INSERT/UPDATE/DELETE apenas `auth.uid()` no dono).
7. Criar RPCs `get_nearby_profiles`, `get_nearby_businesses`, `get_compatibility` com `security definer` + `search_path` fixo e retorno sem coordenadas brutas (distância apenas).
8. Ajustar policies de Storage: `reels-media` upload com pasta `auth.uid()`; criar policies para buckets `avatars` e `posts`.
9. Atualizar `src/integrations/supabase/types.ts` (regenerar via Supabase CLI) para incluir tabelas/funções novas; remover o fallback `Record<string, unknown>` de `src/types/database/tables.ts`.
10. Somente então conectar rotas aos `hooks/api` existentes, preservando mocks como fallback de dev.

---

**Estado final:** nenhum código de produção, configuração, migration, banco de dados ou lockfile foi alterado. Únicos artefatos gravados: `docs/audits/pre-database-baseline.md` (este relatório) e saídas de build gitignored (`.output/`, `.wrangler/`). `git status --short` permaneceu vazio.
