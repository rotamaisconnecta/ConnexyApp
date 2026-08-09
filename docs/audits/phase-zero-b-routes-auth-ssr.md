# Tópico 2B — Rotas duplicadas e autenticação SSR (phase-zero-b)

- **Data:** 2026-08-08
- **Repositório:** `/home/ricardo/Downloads/opencode-project/ConnexyApp` (branch `main`, HEAD `4bfac12`)
- **Base:** `docs/audits/phase-zero-a-env-security.md`, `docs/audits/phase-zero-a1-env-config-consolidation.md` e `docs/audits/pre-database-baseline.md`
- **Escopo:** consolidar rotas duplicadas (canônica `/chat/$conversationId`, rotas públicas canônicas em PT-BR, redirects seguros para aliases em inglês) e consolidar a autenticação SSR (validação por request no servidor, guard real, sem open redirects), preservando todas as telas/mocks/design. **Nenhum banco, migration, policy, bucket ou projeto remoto foi alterado. Nenhum commit foi feito.**

---

## ETAPA A — Inventário de rotas

Inventário completo do `routeTree.gen.ts` (72 caminhos únicos após a consolidação). As rotas "públicas" de onboarding são top-level; as rotas de produto vivem sob o layout `/_app`.

### A.1 Rotas de onboarding (top-level, fora de `/_app`)

| Rota                | Arquivo                           | Observação                                               |
| ------------------- | --------------------------------- | -------------------------------------------------------- |
| `/`                 | `src/routes/index.tsx`            | Splash; decide `/localizacao` (session) ou `/welcome`    |
| `/welcome`          | `src/routes/welcome.tsx`          | Entrada para convidados                                  |
| `/auth`             | `src/routes/auth.tsx`             | Login/cadastro/Google + "Continuar sem entrar" → `/home` |
| `/cadastro`         | `src/routes/cadastro.tsx`         | Onboarding                                               |
| `/interesses`       | `src/routes/interesses.tsx`       | Onboarding                                               |
| `/localizacao`      | `src/routes/localizacao.tsx`      | Onboarding                                               |
| `/completar-perfil` | `src/routes/completar-perfil.tsx` | Onboarding                                               |
| `/finalizar-perfil` | `src/routes/finalizar-perfil.tsx` | Onboarding                                               |

### A.2 Rotas de produto (sob `/_app`)

Layout `_app.tsx` (topo comum: PhoneFrame, BottomNav, NotificationBell, PresenceProvider) com dezenas de filhas: `/home`, `/feed`, `/connecta`, `/discover`, `/marketplace`, `/events`, `/event/$eventId`, `/trending`, `/recommendations`, `/reels`, `/reels/$reelId`, `/engine`, `/design-system`, `/my-connexy`, `/avaliar`, `/locais`, `/local/$id`, `/rota`, `/destino`, `/matching`, `/solicitacao/$id`, `/business/$businessId`, `/gerenciar` + 6 filhas de criação, `/create` + 10 filhas, `/driver` + 5 filhas + `/driver/trip/$tripId`, `/profile/roles`, `/ride` + 4 filhas, e as rotas do escopo desta passagem (pares PT↔EN).

### A.3 Pares de rotas duplicadas (idioma)

| Rota canônica (PT-BR)                                     | Alias (EN)                                         | Conteúdo                                                                                             | Situação 2B                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/chat/$conversationId` (`_app/chat.$conversationId.tsx`) | `/chat/$id` (`_app.chat.$id.tsx`)                  | idênticas (uma só redireciona)                                                                       | ✅ **CONSOLIDADO** — `/chat/$id` (redirect puro) removido                                           |
| `/pessoas` (`_app.pessoas.tsx`)                           | `/people` (`_app.people.tsx`)                      | `/people` tinha a implementação completa; `/pessoas` era stub TODO                                   | ✅ **CONSOLIDADO** — implementação completa movida para `/pessoas`; `/people` virou redirect seguro |
| `/perfil/` index (`_app.perfil.index.tsx`)                | `/profile` (`_app.profile.tsx`) + `/profile/roles` | **telas diferentes** (Meu Perfil rico vs Perfil simplificado; `/profile` tem filha `/profile/roles`) | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas                                                      |
| `/ride/*` (`_app/ride.tsx` + filhas)                      | `/corrida` (`_app.corrida.tsx`)                    | **telas diferentes** (pedido/viagem vs corrida ativa em mapa)                                        | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas                                                      |
| `/notificacoes` (`_app.notificacoes.tsx`)                 | `/notifications` (`_app/notifications.tsx`)        | **telas diferentes** (abas+mock vs NotificationCenter+presença)                                      | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas                                                      |

Referências internas mapeadas (ETAPA D):

| Rota                       | Consumidores internos                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/chat/$conversationId`    | `conversation-row.tsx:47`, `conversations-screen.tsx:44`, `continue-card.tsx:31,57`, `conversation-invite-button.tsx:46`, `NotificationBell.tsx:113`, `_app.solicitacao.$id.tsx:81`, `_app.perfil.$id.tsx:354,376` |
| `/pessoas` (era `/people`) | `context-rules.ts:68,214,284` (atualizados), `FeedNearbyPeople.tsx:38` (atualizado), `roles-engine.ts:126` (já PT)                                                                                                 |
| `/notificacoes`            | `NotificationBell.tsx:131`                                                                                                                                                                                         |
| `/profile`                 | `roles-engine.ts:47,72,97,117,301,314,327,340,353,366`, `navigation-items.ts:40`, `bottom-nav.tsx:11,18`, `bottom-nav-item.tsx:29`, `back-button.tsx:17`                                                           |
| `/perfil`                  | `back-button.tsx:16`, `_app.home.tsx:79`, `_app.privacidade.tsx:36`                                                                                                                                                |
| `/ride`                    | `FeedNearbyDrivers.tsx:75`, `back-button.tsx:19`, `reels/$reelId.tsx:133`, `_app.reels.tsx:231`                                                                                                                    |
| `/corrida`                 | `_app.matching.tsx:56,89`                                                                                                                                                                                          |

---

## ETAPA B — Rota `/chat/$id` removida (redirect puro)

`src/routes/_app.chat.$id.tsx` continha **apenas** um `loader` que fazia `redirect({ to: "/chat/$conversationId", params: { conversationId: params.id } })`. Conforme a instrução ("rotas que sejam apenas redirecionamentos para outra rota devem ser removidas"), foi removida via `git rm`. A canônica `/chat/$conversationId` já estava correta (usa `ConnexyChatScreen` + `Route.useParams()`); o shell `_app/chat.tsx` usa `useMatch({ from: "/_app/chat/$conversationId" })`.

- Sem perda de conteúdo (nenhum outro consumidor referênciava `/chat/$id`; o único match era o `routeTree.gen.ts`, regenerado).
- Após `npm run build`, o `routeTree.gen.ts` foi regenerado sem `/chat/$id` (grep → 0).

---

## ETAPA C — Alias `/people` → `/pessoas` + redirects seguros

Decisão (par PT↔EN **com o mesmo propósito** e sem produto distinto):

- `/people` era a tela completa (grid de `PremiumCardView` + `buildFullPeopleCards`); `/pessoas` era um stub com `TODO`.
- A rota canônica (PT-BR) é `/pessoas`. A implementação completa foi **movida integralmente** para `_app.pessoas.tsx` (mesmos componentes, mocks, design e título "Pessoas — Connexy"); o stub TODO foi substituído.
- `_app.people.tsx` virou alias com **redirect seguro usando a API real** do TanStack Router instalado (v1.170.16): `loader: () => { throw redirect({ to: "/pessoas", replace: true }) }` — `replace` e `redirect` são da API oficial (`@tanstack/router-core` `redirect.d.ts`).
- Sem overwrite silencioso de produto real: o stub não tinha funcionalidade; nada foi perdido.

Pares marcados **BLOQUEADO PARA DECISÃO** (telas genuinamente diferentes; mantidas ambas, sem redirect, sem overwrite):

| Par                                | Razão                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/profile` ↔ `/perfil/`            | `/profile` é o "Meu Perfil" rico (Hero, ModeSwitcher, stats, favoritos, Meu Connexy, convite) e é **pai** de `/profile/roles`; `/perfil/` é uma tela mais simples (card gradiente + lista). São produtos diferentes; um redirect de `/profile` quebraria a filha `/profile/roles`. Decisão pendente: fundir em `/perfil` (mover roles) ou manter os dois. |
| `/ride/*` ↔ `/corrida`             | `/ride` é o fluxo de pedido de viagem (request/matching/history/active); `/corrida` é a corrida ativa em mapa (título "Corrida ativa — RotaMais"). Produtos diferentes.                                                                                                                                                                                   |
| `/notificacoes` ↔ `/notifications` | `/notificacoes` usa abas + mock estático; `/notifications` usa `NotificationCenter` + `usePresence`. Produtos diferentes.                                                                                                                                                                                                                                 |

---

## ETAPA D — Referências internas consolidadas

- `/people` → `/pessoas` em `src/lib/context/context-rules.ts:68,214,284` e `src/components/feed/FeedNearbyPeople.tsx:38`. Grep pós-edição: **0 referências ativas a `/people`** fora do próprio arquivo de alias.
- `/chat/$conversationId`: já canônica em todos os consumidores (ETAPA A.3) — sem alteração.
- Pares BLOQUEADO: referências a `/profile`, `/perfil`, `/ride`, `/corrida`, `/notificacoes`/`/notifications` **mantidas** (ambas as telas existem).

---

## ETAPA E — Auditoria de autenticação (estado encontrado)

### E.1 Clientes e middlewares Supabase

| Componente                         | Arquivo                                                                      | Estado                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente canônico do navegador      | `src/integrations/supabase/client.ts` (`supabase`, lazy Proxy)               | Único cliente vivo (auth em `__root`, `auth.tsx`, `index.tsx`, `use-auth`, `_app.gerenciar`, Reels)                                       |
| Cliente administrativo server-only | `src/integrations/supabase/client.server.ts` (`supabaseAdmin`, service role) | **0 importadores**; `SUPABASE_SERVICE_ROLE_KEY` não configurada; Lovable-generated (não editado)                                          |
| Middleware de auth (server)        | `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`)       | **Órfão** (0 importadores); Lovable-generated; valida Bearer via `getClaims` (chave publishable) — mantido intacto                        |
| Middleware de attach (client)      | `src/integrations/supabase/auth-attacher.ts` (`attachSupabaseAuth`)          | **Ativo** — registrado em `start.ts` como `functionMiddleware`; anexa `Authorization: Bearer <access_token>` aos RPCs de server functions |

### E.2 Fluxo atual

- Sessão **100% client-side** (Supabase persiste em `localStorage`). **Não há cookie de sessão legível pelo servidor.**
- `@supabase/ssr` **não está instalado**; só `@supabase/supabase-js@^2.110.1` (e `@lovable.dev/cloud-auth-js@^1.1.2` p/ OAuth broker).
- Guard client-side existente no layout: `_app.tsx:25-37` — se `useAuth()` não resolve usuário, redireciona para `/auth` e renderiza spinner. Ou seja, **todas** as rotas de produto já exigem sessão no cliente.
- Página `/auth`: login senha / Google (OAuth broker) + "Continuar sem entrar" → `/home`.

### E.3 Duplicidades encontradas (limpeza desta passagem)

Foram **removidos** (0 importadores verificados, sem barrel/re-export, sem cabeçalho Lovable-generated; funcionalidade já coberta pelo fluxo vivo `hooks/use-auth.ts` + `supabase.auth` + guard SSR):

| Arquivo removido                          | Motivo                                                     |
| ----------------------------------------- | ---------------------------------------------------------- |
| `src/hooks/api/use-auth.ts`               | Hook duplicado do `hooks/use-auth.ts` vivo; 0 importadores |
| `src/providers/auth/auth-provider.tsx`    | Provider de auth nunca montado; 0 importadores             |
| `src/providers/auth/session-provider.tsx` | Provider de sessão nunca montado; 0 importadores           |
| `src/lib/supabase/supabase-provider.tsx`  | Provider de Supabase nunca montado; 0 importadores         |
| `src/lib/supabase/auth.ts` (`AuthHelper`) | Wrapper morto do cliente canônico; 0 importadores          |

Mantida como **infraestrutura futura pré-database** (2A preservou `client.server.ts`; mesmo critério): `src/services/*` (`auth.service`, `user.service`), `src/repositories/*` (auth, chat, feed, marketplace, notification, profile, ride, user), `src/hooks/api/*` restantes (chat, discovery, feed, marketplace, notifications, profile, ride, upload) e `src/lib/supabase/errors.ts` + wrappers `client/database/realtime/rpc/storage`. Nenhum desses tem importador vivo; são a camada de dados prevista para quando o banco existir.

### E.4 Segurança

- Nenhum open redirect pré-existente (nenhum redirect com origem externa).
- `requireSupabaseAuth` (o "guard real" previsto) era código morto; o servidor não validava sessão por request.

---

## ETAPA F — Consolidação de autenticação SSR (implementado)

Sem instalar dependências; usando apenas APIs confirmadas do TanStack Start instalado (`@tanstack/react-start@^1.168.26`, `@tanstack/react-router@^1.170.16`, `@supabase/supabase-js@^2.110.1`).

### F.1 Arquivos novos

| Arquivo                          | Responsabilidade                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth/return-to.ts`      | `sanitizeReturnTo(value)` — aceita apenas caminho absoluto interno que começa com `/`, rejeita `//`, `scheme://` e `\`. **Sem open redirect.**                                                                                                                                                                                                                                                                   |
| `src/lib/auth/server-auth.ts`    | `isSupabaseConfigured()` (env server ou `import.meta.env.VITE_*`); `createServerAuthClient(token)` — cliente **por request** (novo `createClient` com chave publishable, `persistSession:false`, `autoRefreshToken:false`, fetch wrapper compatível com chaves `sb_*`); `resolveRequestUser()` — token da cookie de sessão ou do header `Authorization: Bearer`, validado no servidor via `auth.getUser(token)`. |
| `src/lib/auth/route-guard.ts`    | `requireAuth` — guard compatível com `beforeLoad`. **Env-gated**: se Supabase não configurado → no-op (dev/demo intacto). No SSR: validação por request no servidor; no cliente: `supabase.auth.getSession()`. Não autenticado → `throw redirect({ to: "/auth", search: { returnTo: sanitizado }, replace: true })`.                                                                                             |
| `src/lib/auth/session-cookie.ts` | `syncSessionCookie(session)` — espelha a sessão em cookie JS-readable (`connexy-access-token`, `Path=/; SameSite=Lax; Max-Age=604800`), porque o servidor não enxerga o `localStorage`.                                                                                                                                                                                                                          |

### F.2 Integrações

- `src/routes/__root.tsx`: `onAuthStateChange((event, session) => syncSessionCookie(session))` + `getSession().then(...)` na hidratação — mantém o cookie em sincronia (login/logout/refresh).
- `src/routes/auth.tsx`: `validateSearch` (`returnTo?: string` opcional); após login/Google navega para `sanitizeReturnTo(returnTo) ?? "/localizacao"` via `navigate({ href })` (API oficial). Fallback preserva o comportamento atual.

### F.3 Trade-off documentado

- O cookie é **JS-readable** (não `httpOnly`) — mesmo limite de confiança do `localStorage` que o Supabase já usa. Endurecimento de produção (cookie `httpOnly` setado por rota servidor, `SameSite=Strict`) fica como pendência (ver ETAPA J).
- O guard só passa a valer quando `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` (server) ou `VITE_*` estiverem configurados. No estado atual de demo (config vazia) o comportamento é idêntico ao anterior.

### F.4 Limpeza de duplicidades de auth (dead code)

Removidos 5 módulos de auth sem nenhum importador (detalhes na ETAPA E.3). Impacto validado: `tsc` ✅, build ✅, lint cai de **490 → 487** (3 warnings pré-existentes removidos, **0 erros adicionados**).

---

## ETAPA G — Guards nas rotas privadas críticas

Aplicado **um único ponto de guard SSR** no layout: `src/routes/_app.tsx` → `beforeLoad: requireAuth`. Isso cobre todas as rotas críticas listadas (todas vivem sob `/_app`):

| Rota crítica                      | Coberta por           |
| --------------------------------- | --------------------- |
| `/perfil/` (Meu perfil)           | `_app.tsx` beforeLoad |
| `/pessoas`                        | `_app.tsx` beforeLoad |
| `/chat` + `/chat/$conversationId` | `_app.tsx` beforeLoad |
| `/notificacoes`                   | `_app.tsx` beforeLoad |
| `/corrida`                        | `_app.tsx` beforeLoad |
| `/gerenciar` + filhas de criação  | `_app.tsx` beforeLoad |
| `/create` + filhas (publicação)   | `_app.tsx` beforeLoad |

Garantias:

- **Sem loops**: `/auth` está fora de `/_app` e não é guardada; `/welcome` e `/` não são guardados. O redirect usa `replace: true` e `returnTo` sanitizado (interno-only). Ex.: `/people` → `/pessoas` (guard) → `/auth` (se não autenticado) — um salto, sem ciclo.
- **Paridade com o comportamento atual**: o layout já redirecionava ao cliente quando `!user`; o guard adiciona a validação no servidor por request.
- `/perfil/$id` (perfil público de outra pessoa) **não** foi guardada — é tela pública de consulta (decisão registrada).

---

## ETAPA I — Validações

| Validação                                | Comando                    | Resultado                                                                                                                           |
| ---------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Build                                    | `npm run build`            | ✅ PASS (exit 0) — `routeTree.gen.ts` regenerado                                                                                    |
| TypeScript                               | `npx tsc --noEmit`         | ✅ PASS (exit 0)                                                                                                                    |
| Lint (total)                             | `npm run lint`             | ❌ exit 1 — **487 problemas (473 erros, 14 warnings)** — **abaixo da baseline 490 (melhora de 3 warnings), sem regressão de erros** |
| ESLint (arquivos alterados)              | `npx eslint <12 arquivos>` | ✅ 0 erros (2 prettier corrigidos nos arquivos novos)                                                                               |
| Whitespace                               | `git diff --check`         | ✅ PASS (exit 0)                                                                                                                    |
| Grep `/chat/$id` em `src/`               | —                          | ✅ 0 (fora de histórico/documentação)                                                                                               |
| Grep `/people` em `src/` (fora do alias) | —                          | ✅ 0                                                                                                                                |

---

## ETAPA J — Estado do Git e pendências

```
D  src/hooks/api/use-auth.ts                      (staged — remoção; SEM commit meu)
D  src/lib/supabase/auth.ts                       (staged — remoção; SEM commit meu)
D  src/lib/supabase/supabase-provider.tsx         (staged — remoção; SEM commit meu)
D  src/providers/auth/auth-provider.tsx           (staged — remoção; SEM commit meu)
D  src/providers/auth/session-provider.tsx        (staged — remoção; SEM commit meu)
 M src/components/feed/FeedNearbyPeople.tsx       (/people → /pessoas)
 M src/lib/context/context-rules.ts               (/people → /pessoas ×3)
 M src/routeTree.gen.ts                           (regenerado pelo build)
 M src/routes/__root.tsx                          (cookie sync da sessão)
 M src/routes/_app.people.tsx                     (alias → redirect /pessoas)
 M src/routes/_app.pessoas.tsx                    (implementação completa movida)
 M src/routes/_app.tsx                            (beforeLoad: requireAuth)
 M src/routes/auth.tsx                            (validateSearch returnTo + navegação)
?? src/lib/auth/                                  (return-to, server-auth, route-guard, session-cookie)
?? docs/audits/phase-zero-b-routes-auth-ssr.md
```

**Commit externo:** o commit `a297cdd "atualizar"` (autor `rotamaisconnecta`, 2026-08-08 11:11) foi feito **fora desta sessão** e incluiu somente a remoção de `src/routes/_app.chat.$id.tsx` (etapa B). **Nenhum outro commit foi feito**; o restante das alterações 2B permanece staged/untracked aguardando decisão do usuário (regra: não commitar nesta passagem).

### Pendências reais

1. **Decisões BLOQUEADO PARA DECISÃO** (produto): `/profile`↔`/perfil/` (+ destino de `/profile/roles`), `/ride/*`↔`/corrida`, `/notificacoes`↔`/notifications`.
2. **Ativar o guard em produção**: definir `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` no servidor (`.dev.vars`/deploy) — a partir daí o guard passa a validar por request. Endurecimento recomendado: cookie `httpOnly` setado por rota de servidor (substituindo o espelhamento JS-readable), `SameSite=Strict` e `__Host-` prefix.
3. ~~Limpeza de duplicidades de auth~~ — **FEITA nesta passagem** (E.3/F.4): removidos 5 módulos mortos. Camada de dados pré-database (`services/`, `repositories/`, `hooks/api/`, `lib/supabase/` wrappers) **mantida** como infraestrutura futura; revisitar quando o banco for conectado.
4. **Código Lovable-generated** (`auth-middleware.ts`, `client.server.ts`) permanece intacto (gerado; não editado). `requireSupabaseAuth` continua órfão; se for ativar o padrão de middleware de server function, migrar para o cliente por request de `server-auth.ts`.
5. **Commit** do restante desta passagem (decisão do usuário; não executado nesta sessão). A remoção de `_app.chat.$id.tsx` já foi commitada externamente em `a297cdd`.

---

## Resumo final

- **status:** CONCLUÍDO (escopo de consolidação seguro) + BLOQUEADO PARA DECISÃO (3 pares de telas distintas)
- **rotas consolidadas:** `/chat/$id` removido; `/people` → redirect `/pessoas`; implementação completa em `/pessoas`
- **auth SSR:** cliente por request (`server-auth.ts`), guard env-gated (`route-guard.ts`), `returnTo` interno-only (`return-to.ts`), cookie de sessão espelhado (`session-cookie.ts`); integrado em `_app.tsx`, `__root.tsx` e `auth.tsx`
- **dead code removido:** 5 módulos de auth sem importadores (hooks/providers duplicados); camada de dados pré-database preservada
- **build:** ✅ PASS (exit 0) · **TypeScript:** ✅ PASS · **lint:** 490 → 487 (3 warnings removidos, sem regressão de erros) · **git diff --check:** ✅
- **mocks/telas/design:** preservados (sem overwrite de telas distintas; apenas movimento de implementação `/people`→`/pessoas` e redirect)
- **banco remoto/migrations/RLS/Realtime:** nenhum acesso ou alteração
- **necessidade de commit:** SIM, mas não executado (decisão do usuário)

---

# Revisão corretiva 2B.1

**Data:** 2026-08-08 · **Branch:** `main` · **HEAD no início da revisão:** `4bfac12` (esperado `15cc31b` — divergência explicada na seção 15) · **Nenhum commit executado nesta passagem.**

## 1. Status real

**PARCIAL.** Dois escopos impedem CONCLUÍDO: (a) três pares de rotas permanecem **BLOQUEADO PARA DECISÃO** (`/profile`↔`/perfil`, `/notifications`↔`/notificacoes`, `/ride`↔`/corrida`) e (b) a autenticação SSR **não demonstra ciclo completo** access/refresh/cookie/logout server-side (seção 8-10), sendo portanto PARCIAL/BLOQUEADA para produção. A consolidação de rotas (seções 2-7 acima) está correta e preservada.

## 2. Contradição de PresenceProvider resolvida

- `PresenceProvider` (de `@/providers/presence/presence-provider`) **já estava montado no HEAD `15cc31b`** (`git show 15cc31b:src/routes/_app.tsx` — linha 43 do JSX original). Não foi montado durante o Tópico 2B; a única mudança de 2B em `_app.tsx` foi adicionar `beforeLoad: requireAuth`.
- **Regra aplicada:** como era condição preexistente, **não houve remoção silenciosa** — registra-se aqui como preexistente.
- O componente montado é o **provider de presença mock** (localStorage + seeds sintéticos), **não** o provider de Realtime. Ele não cria `subscription`, `channel`, `presence` nem conexão Realtime (usa apenas `loadPresenceRecords`/`savePresenceRecords`/`dispatchCheckinCreated` — todos puros/mock).
- Os providers reais de Realtime (`@/providers/realtime/realtime-provider` com `supabase.channel("realtime-connection")` e `@/providers/realtime/presence-provider` com `supabase.channel("online-users")`) existem no código mas têm **0 importadores** — não estão na árvore JSX.

## 3. Situação real de Realtime

**Realtime NÃO está montado.** Nenhum provider ativo abre channel, subscription ou presença no Supabase remoto. `src/lib/supabase/realtime.ts` (`RealtimeHelper`) tem 0 importadores. Não foi conectado nem verificado contra o Supabase remoto.

## 4. Herança real de `/perfil/$id`

No `routeTree.gen.ts` real, `AppPerfilIdRoute` (`src/routes/_app.perfil.$id.tsx`) tem `getParentRoute: () => AppRoute` — ou seja, está **sob o layout `/_app`** e **herda `beforeLoad: requireAuth`**. A decisão do Tópico 2B ("`/perfil/$id` não foi guardada — tela pública") estava **incorreta**: a rota é protegida. Matriz pública/protegida corrigida:

| Classificação                                  | Rotas                                                                                                                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Públicas (top-level, sem guard)                | `/`, `/welcome`, `/auth`, `/cadastro`, `/interesses`, `/localizacao`, `/completar-perfil`, `/finalizar-perfil`                                                                                       |
| Protegidas (sob `/_app`, herdam `requireAuth`) | todas as demais, **incluindo `/perfil/$id`, `/perfil/`, `/profile`, `/profile/roles`, `/ride/*`, `/corrida`, `/notificacoes`, `/notifications`, `/pessoas`, `/chat/*`, `/gerenciar/*`, `/create/*`** |

Verificação por `getParentRoute: () => rootRouteImport` (top-level) × `() => AppRoute` (`/_app`): todas as rotas de onboarding são top-level; **não** há rota de produto fora de `/_app`.

## 5. Inventário de server functions e endpoints

| Item                                   | Ocorrências                                                                                                          | Situação                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `createServerFn`                       | **0** em todo `src/`                                                                                                 | —                                                                                         |
| Server routes / handlers / API routes  | **0** (nenhum `createAPIFileRoute`, nenhum dir `api/`)                                                               | —                                                                                         |
| Loaders que leem dados privados        | **0 vivos** (rotas usam mocks; camada `repositories/`+`services/`+`hooks/api/` é dead code com 0 importadores vivos) | —                                                                                         |
| Funções que modificam dados do usuário | **0 vivos**                                                                                                          | —                                                                                         |
| `functionMiddleware`                   | `attachSupabaseAuth` (client) em `start.ts`                                                                          | **ATIVO**                                                                                 |
| `attachSupabaseAuth`                   | `start.ts:22`                                                                                                        | Ativo; anexa `Authorization: Bearer` nos RPCs de server functions (hoje sem consumidores) |
| `requireSupabaseAuth`                  | `auth-middleware.ts`                                                                                                 | **AINDA ÓRFÃO** (0 importadores)                                                          |
| `resolveRequestUser`                   | `route-guard.ts:27` (SSR)                                                                                            | Usado pelo guard; valida token no servidor via `getUser`                                  |

**Classificação: `requireSupabaseAuth` = AINDA ÓRFÃO** (não foi substituído; continua código morto Lovable-generated, intacto). Não é simultaneamente "substituído" e "órfão": o guard SSR de 2B usa um cliente próprio (`server-auth.ts`) e não reutiliza `requireSupabaseAuth`.

## 6. Proteção no data/API boundary

**Não existem endpoints privados reais nesta aplicação.** Não há server functions, server routes nem handlers lendo/escrevendo dados. A camada de dados (repositories/services/hooks) é pré-database e não está conectada a nenhum consumidor vivo. Como não existem handlers, **nada foi modificado** para autenticar handler — não se inventa proteção onde não há endpoint. Quando a camada de dados for conectada, cada server function privada deve aplicar `requireSupabaseAuth` (ou o equivalente por request de `server-auth.ts`) **no próprio handler**, nunca confiando apenas no `beforeLoad`. `service_role` (`client.server.ts`) permanece com 0 importadores e não chega ao navegador.

## 7. Situação final de requireSupabaseAuth

**AINDA ÓRFÃO.** Arquivo Lovable-generated intacto, 0 importadores, valida Bearer via `getClaims`. Não foi substituído e não está ativo.

## 8. Conteúdo lógico da sessão SSR (sem valores)

| Item          | Onde                                                                                                             | Observação                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| access token  | cookie JS-readable `connexy-access-token` (espelhado por `syncSessionCookie`) + `localStorage` (Supabase client) | cookie `Path=/; SameSite=Lax; Max-Age=604800`, **sem `httpOnly`** |
| refresh token | **apenas** `localStorage` do navegador                                                                           | **não** está no cookie; servidor não o lê                         |

O servidor só enxerga o access token espelhado. Não há cookie com refresh token.

## 9. Renovação e remoção de cookies

- **Renovação server-side: AUSENTE.** `createServerAuthClient` usa `persistSession:false`/`autoRefreshToken:false`; `resolveRequestUser` valida o access token por request via `getUser`. Não há rota/loader server que troque refresh→access e devolva set-cookie. Um access token expirado → `getUser` falha → redirect `/auth`. **Não há ciclo completo demonstrado.**
- **Atualização de cookies na resposta:** o cookie é reescrito **apenas pelo JS do navegador** (`onAuthStateChange` em `__root.tsx` + `getSession().then`), não pelo servidor. A primeira resposta SSR após login não carrega set-cookie.
- **Logout:** `syncSessionCookie(null)` apaga o cookie (`Max-Age=0`) no evento `SIGNED_OUT`; `localStorage` é limpo pelo próprio Supabase client. A remoção funciona no cliente, mas não passa por endpoint server.

## 10. Compatibilidade ou limitação de OAuth/PKCE

- O fluxo de Google usa `@lovable.dev/cloud-auth-js` (broker `/~oauth/initiate`, popup/web_message, devolve `access_token`+`refresh_token`) e `supabase.auth.setSession`. **Não** usa PKCE com troca de código em rota server e **não** usa `@supabase/ssr` (não instalado).
- **OAuth/PKCE compatível com SSR: NÃO VERIFICADO.** O modelo atual é session client-side espelhada; sem callback PKCE server-side e sem set-cookie httpOnly não há base para afirmar compatibilidade SSR do OAuth.
- **Cookie Secure em HTTPS:** NÃO definido (`document.cookie` sem `Secure`).
- **Cache-Control/Vary:** respostas autenticadas não definem `Cache-Control` nem `Vary`.
- **Cliente por request:** SIM no servidor (`createServerAuthClient` cria cliente novo por chamada); no navegador é o singleton `supabase`. Nenhum estado de usuário compartilhado entre requests no servidor.
- **Tokens em logs/erros:** nenhum token aparece em `console.error`/mensagens desta camada (mensagens citam apenas nomes de variáveis). Não foi verificada exposição via outros logs.

## 11. Comportamento de "Continuar sem entrar"

O botão em `auth.tsx:182` é `<Link to="/home">`. `/home` está sob `/_app` (guardado). Com o guard ativo (configuração presente), navegar para `/home` sem sessão dispara `requireAuth` → redirect para `/auth?returnTo=...`. Com configuração ausente em dev, o layout `_app.tsx` redireciona ao cliente para `/auth` (spinner enquanto `!user`). **Conclusão: o botão retorna para a própria tela de autenticação** — o fluxo de "entrar sem autenticar" não está preservado com o guard ativo. Registrado; design não alterado nesta passagem.

## 12. Fail-open ou fail-closed

- **Estado encontrado: FAIL-OPEN** — `requireAuth` fazia `if (!isSupabaseConfigured()) return;`, liberando rotas protegidas em produção sem configuração.
- **Correção aplicada nesta passagem** (`src/lib/auth/route-guard.ts`): bypass para mocks **somente em dev** (`import.meta.env.DEV`, API real do Vite, já usada em `orchestrator.ts:40`); em produção sem configuração, `requireAuth` **lança erro citando apenas os nomes das variáveis ausentes** (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) → **FAIL-CLOSED**.
- Sem variável nova para contornar o problema; sem reintrodução de duplicação entre `SUPABASE_*` e `VITE_SUPABASE_*` (mantida a leitura dual existente). Compatível com Cloudflare Workers (resolução de env em build/runtime Nitro).

## 13. Situação de CSRF

- `createCsrfMiddleware` **está disponível** na versão instalada (`@tanstack/react-start@^1.168.26` → reexporta de `@tanstack/start-client-core`; `handlerType` existe em `RequestServerOptions`).
- Estava **AUSENTE** (mas `start.ts` é custom e a doc oficial exige registrá-lo explicitamente quando `start.ts` existe).
- **Implementado** em `src/start.ts`: `createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" })` registrado em `requestMiddleware` (junto do `errorMiddleware`). Sem origens externas, sem `allowRequestsWithoutOriginCheck`. `attachSupabaseAuth` preservado.
- **Situação: ATIVO** (protege server functions; hoje sem server functions, fica pronto para o futuro).

## 14. Matriz dos três pares bloqueados

### `/profile` ↔ `/perfil/`

| Aspecto               | `/profile` (`_app.profile.tsx`)                                                                                                                                                             | `/perfil/` (`_app.perfil.index.tsx`)                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Finalidade            | "Meu Perfil" rico                                                                                                                                                                           | Perfil simplificado                                                                                     |
| Recursos exclusivos   | `Hero`, `ModeSwitcher`, bio, vibe tags, locais favoritos, Meu Connexy, ConnexyInviteCard, stats                                                                                             | Card gradiente, atalhos (gerenciar, viagens, conexões, favoritos, invisível, configurações), interesses |
| Rotas filhas          | `/profile/roles` (`_app/profile/roles.tsx`)                                                                                                                                                 | nenhuma                                                                                                 |
| Consumidores          | `roles-engine.ts` (10 refs), `navigation-items.ts`, `bottom-nav.tsx`, `bottom-nav-item.tsx`, `back-button.tsx:17`, `my-connexy.tsx:730`, `gerenciar.tsx:188`                                | `back-button.tsx:16`, `_app.home.tsx:79`, `_app.privacidade.tsx:36`                                     |
| Recomendação canônica | mover `/profile/roles` para `/perfil/roles`; fundir telas em `/perfil`                                                                                                                      | manter como canônica final                                                                              |
| Impacto da migração   | redirect `/profile`→`/perfil/` + mover filha `roles`; atualizar 6+ arquivos                                                                                                                 | —                                                                                                       |
| Arquivos a alterar    | `_app.profile.tsx`, `_app/perfil/*` (novo `roles`), `roles-engine.ts`, `navigation-items.ts`, `bottom-nav.tsx`, `bottom-nav-item.tsx`, `back-button.tsx`, `my-connexy.tsx`, `gerenciar.tsx` | —                                                                                                       |

### `/notifications` ↔ `/notificacoes`

| Aspecto               | `/notifications` (`_app/notifications.tsx`)                               | `/notificacoes` (`_app.notificacoes.tsx`)         |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Finalidade            | NotificationCenter + notificações de presença                             | Abas + mock estático                              |
| Recursos exclusivos   | `NotificationCenter`, dados de `usePresence`, `router.history`            | Abas Todas/Social/Viagens/Promoções, `BackButton` |
| Rotas filhas          | nenhuma                                                                   | nenhuma                                           |
| Consumidores          | **0 internos**                                                            | `NotificationBell.tsx:131` (botão "ver todas")    |
| Recomendação canônica | fundir a implementação (NotificationCenter+presença) em `/notificacoes`   | manter como canônica final                        |
| Impacto da migração   | apagar/redirect `/notifications`; absorver UI em `/notificacoes`          | —                                                 |
| Arquivos a alterar    | `_app/notifications.tsx`, `_app.notificacoes.tsx`, `NotificationBell.tsx` | —                                                 |

### `/ride` ↔ `/corrida`

| Aspecto               | `/ride` (`_app/ride.tsx` + `_app/ride/{request,matching,history,active}.tsx`)                   | `/corrida` (`_app.corrida.tsx`)                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Finalidade            | Fluxo de pedido de viagem (request/matching/history/active)                                     | Corrida ativa em mapa                                                   |
| Recursos exclusivos   | `RideRequestForm`, `StopManager`, favoritos, `ScheduleRide`, 4 filhas                           | `MapCanvas`, driver card, modo social, "finalizar corrida (demo)"       |
| Rotas filhas          | `/ride/request`, `/ride/matching`, `/ride/history`, `/ride/active`                              | nenhuma                                                                 |
| Consumidores          | `FeedNearbyDrivers.tsx:75`, `back-button.tsx:19`, `_app.reels.tsx:231`, `reels/$reelId.tsx:133` | `_app.matching.tsx:56,89`                                               |
| Recomendação canônica | manter `/ride` (pai do fluxo completo)                                                          | `/corrida` sobrepõe-se a `/ride/active`; decidir absorção ou manutenção |
| Impacto da migração   | se absorver `/corrida` → atualizar `_app.matching.tsx` (2 refs)                                 | —                                                                       |
| Arquivos a alterar    | `_app.corrida.tsx`, `_app.matching.tsx`, `_app/ride/active.tsx`                                 | —                                                                       |

Nenhum destes pares foi consolidado nesta passagem.

## 15. Estado do Git ao final da revisão

- HEAD no início: `4bfac12` (o esperado pela instrução era `15cc31b`). **Divergência de ponto de partida:** os commits `a297cdd` e `4bfac12` (ambos "atualizar", autor `rotamaisconnecta`) foram feitos **fora desta sessão** e contêm as alterações do Tópico 2B. O working tree desta passagem continha **somente** o relatório (não as alterações 2B, que já estavam commitadas).
- Nenhum commit executado nesta passagem (regra mantida).
- Estado final (working tree):

```
 M docs/audits/phase-zero-b-routes-auth-ssr.md   (revisão corretiva 2B.1 + ajustes do relatório)
 M src/lib/auth/route-guard.ts                    (FAIL-CLOSED em produção: throw com nomes das variáveis)
 M src/start.ts                                   (CSRF: createCsrfMiddleware ativo p/ server functions)
```

- `docs/audits/phase-zero-b-routes-auth-ssr.md` presente no estado final do Git (commitado em `4bfac12`, agora com a revisão 2B.1 no working tree).
- Remoção de `src/routes/_app.chat.$id.tsx` **preservada** (commitada em `a297cdd`).
- Nenhum arquivo inesperado; nenhum valor sensível exibido.

## 16. Validações (revisão 2B.1)

| Validação                       | Resultado                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Build                           | ✅ PASS (exit 0) — `routeTree.gen.ts` **não** foi alterado pela build                                                  |
| TypeScript (`npx tsc --noEmit`) | ✅ PASS (exit 0)                                                                                                       |
| Lint geral                      | ❌ exit 1 — **487 problemas (473 erros, 14 warnings)** — abaixo da baseline 490, sem regressão (mesma contagem pós-2B) |
| ESLint arquivos alterados       | ✅ 0 erros                                                                                                             |
| Prettier arquivos alterados     | ✅                                                                                                                     |
| `git diff --check`              | ✅ PASS                                                                                                                |
| service_role no bundle client   | ✅ ausente                                                                                                             |
| Dependências instaladas         | ❌ NENHUMA (`package.json`/`package-lock.json` inalterados)                                                            |
| Banco remoto acessado           | ❌ NENHUM                                                                                                              |

## 17. Dependência ou autorização necessária para concluir SSR

Para a autenticação SSR sair de PARCIAL, é necessária **autorização para instalar `@supabase/ssr`** e reestruturar o fluxo: cookie `httpOnly` setado por rota servidor (`createServerClient`), refresh via rota servidor que atualiza o cookie, callback OAuth/PKCE server-side, `Secure` em HTTPS e `SameSite=Strict`. Isso não foi feito nesta passagem (proibido instalar dependências); a implementação atual de espelhamento JS-readable **não** é considerada SSR completa e **não deve ser apresentada como pronta para produção**. Alternativa sem dependência (documentada, não aplicada): rota servidor que emite set-cookie httpOnly e renova via `getUser`+refresh — exige autorização e testes.

---

## Resumo final (revisão 2B.1)

- **status real:** PARCIAL (3 pares BLOQUEADO PARA DECISÃO + autenticação SSR parcial)
- **Realtime efetivamente montado:** NÃO
- **PresenceProvider no HEAD original (15cc31b):** SIM (preexistente, mock; não é Realtime)
- **/perfil/$id herda o guard:** SIM (está sob `/_app`)
- **beforeLoad ativo:** SIM (`_app.tsx` → `requireAuth`)
- **endpoints privados protegidos no handler:** NÃO EXISTEM (nenhum endpoint privado real)
- **requireSupabaseAuth:** AINDA ÓRFÃO
- **cookie contém access token:** SIM (espelhamento JS-readable)
- **cookie contém refresh token:** NÃO
- **refresh server-side:** AUSENTE
- **OAuth/PKCE compatível com SSR:** NÃO VERIFICADO
- **ausência de configuração em produção:** FAIL-CLOSED (corrigido nesta passagem)
- **CSRF das server functions:** ATIVO (implementado nesta passagem)
- **pares de rotas ainda bloqueados:** `/profile`↔`/perfil/`, `/notifications`↔`/notificacoes`, `/ride`↔`/corrida`
- **build:** ✅ · **TypeScript:** ✅ · **lint antes/depois:** 487/487 · **git diff --check:** ✅
- **arquivos alterados:** `docs/audits/phase-zero-b-routes-auth-ssr.md`, `src/lib/auth/route-guard.ts`, `src/start.ts`
- **banco remoto alterado:** NÃO · **dependências instaladas:** NÃO · **commit executado:** NÃO

A consolidação de rotas foi preservada, mas a autenticação SSR permanece parcial e não foi autorizada para commit.
