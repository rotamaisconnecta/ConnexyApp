# Tópico 2B — Rotas duplicadas e autenticação SSR (phase-zero-b)

- **Data:** 2026-08-08
- **Repositório:** `/home/ricardo/Downloads/opencode-project/ConnexyApp` (branch `main`, HEAD `15cc31b`)
- **Base:** `docs/audits/phase-zero-a-env-security.md`, `docs/audits/phase-zero-a1-env-config-consolidation.md` e `docs/audits/pre-database-baseline.md`
- **Escopo:** consolidar rotas duplicadas (canônica `/chat/$conversationId`, rotas públicas canônicas em PT-BR, redirects seguros para aliases em inglês) e consolidar a autenticação SSR (validação por request no servidor, guard real, sem open redirects), preservando todas as telas/mocks/design. **Nenhum banco, migration, policy, bucket ou projeto remoto foi alterado. Nenhum commit foi feito.**

---

## ETAPA A — Inventário de rotas

Inventário completo do `routeTree.gen.ts` (72 caminhos únicos após a consolidação). As rotas "públicas" de onboarding são top-level; as rotas de produto vivem sob o layout `/_app`.

### A.1 Rotas de onboarding (top-level, fora de `/_app`)

| Rota | Arquivo | Observação |
|---|---|---|
| `/` | `src/routes/index.tsx` | Splash; decide `/localizacao` (session) ou `/welcome` |
| `/welcome` | `src/routes/welcome.tsx` | Entrada para convidados |
| `/auth` | `src/routes/auth.tsx` | Login/cadastro/Google + "Continuar sem entrar" → `/home` |
| `/cadastro` | `src/routes/cadastro.tsx` | Onboarding |
| `/interesses` | `src/routes/interesses.tsx` | Onboarding |
| `/localizacao` | `src/routes/localizacao.tsx` | Onboarding |
| `/completar-perfil` | `src/routes/completar-perfil.tsx` | Onboarding |
| `/finalizar-perfil` | `src/routes/finalizar-perfil.tsx` | Onboarding |

### A.2 Rotas de produto (sob `/_app`)

Layout `_app.tsx` (topo comum: PhoneFrame, BottomNav, NotificationBell, PresenceProvider) com dezenas de filhas: `/home`, `/feed`, `/connecta`, `/discover`, `/marketplace`, `/events`, `/event/$eventId`, `/trending`, `/recommendations`, `/reels`, `/reels/$reelId`, `/engine`, `/design-system`, `/my-connexy`, `/avaliar`, `/locais`, `/local/$id`, `/rota`, `/destino`, `/matching`, `/solicitacao/$id`, `/business/$businessId`, `/gerenciar` + 6 filhas de criação, `/create` + 10 filhas, `/driver` + 5 filhas + `/driver/trip/$tripId`, `/profile/roles`, `/ride` + 4 filhas, e as rotas do escopo desta passagem (pares PT↔EN).

### A.3 Pares de rotas duplicadas (idioma)

| Rota canônica (PT-BR) | Alias (EN) | Conteúdo | Situação 2B |
|---|---|---|---|
| `/chat/$conversationId` (`_app/chat.$conversationId.tsx`) | `/chat/$id` (`_app.chat.$id.tsx`) | idênticas (uma só redireciona) | ✅ **CONSOLIDADO** — `/chat/$id` (redirect puro) removido |
| `/pessoas` (`_app.pessoas.tsx`) | `/people` (`_app.people.tsx`) | `/people` tinha a implementação completa; `/pessoas` era stub TODO | ✅ **CONSOLIDADO** — implementação completa movida para `/pessoas`; `/people` virou redirect seguro |
| `/perfil/` index (`_app.perfil.index.tsx`) | `/profile` (`_app.profile.tsx`) + `/profile/roles` | **telas diferentes** (Meu Perfil rico vs Perfil simplificado; `/profile` tem filha `/profile/roles`) | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas |
| `/ride/*` (`_app/ride.tsx` + filhas) | `/corrida` (`_app.corrida.tsx`) | **telas diferentes** (pedido/viagem vs corrida ativa em mapa) | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas |
| `/notificacoes` (`_app.notificacoes.tsx`) | `/notifications` (`_app/notifications.tsx`) | **telas diferentes** (abas+mock vs NotificationCenter+presença) | 🔒 **BLOQUEADO PARA DECISÃO** — mantidas ambas |

Referências internas mapeadas (ETAPA D):

| Rota | Consumidores internos |
|---|---|
| `/chat/$conversationId` | `conversation-row.tsx:47`, `conversations-screen.tsx:44`, `continue-card.tsx:31,57`, `conversation-invite-button.tsx:46`, `NotificationBell.tsx:113`, `_app.solicitacao.$id.tsx:81`, `_app.perfil.$id.tsx:354,376` |
| `/pessoas` (era `/people`) | `context-rules.ts:68,214,284` (atualizados), `FeedNearbyPeople.tsx:38` (atualizado), `roles-engine.ts:126` (já PT) |
| `/notificacoes` | `NotificationBell.tsx:131` |
| `/profile` | `roles-engine.ts:47,72,97,117,301,314,327,340,353,366`, `navigation-items.ts:40`, `bottom-nav.tsx:11,18`, `bottom-nav-item.tsx:29`, `back-button.tsx:17` |
| `/perfil` | `back-button.tsx:16`, `_app.home.tsx:79`, `_app.privacidade.tsx:36` |
| `/ride` | `FeedNearbyDrivers.tsx:75`, `back-button.tsx:19`, `reels/$reelId.tsx:133`, `_app.reels.tsx:231` |
| `/corrida` | `_app.matching.tsx:56,89` |

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

| Par | Razão |
|---|---|
| `/profile` ↔ `/perfil/` | `/profile` é o "Meu Perfil" rico (Hero, ModeSwitcher, stats, favoritos, Meu Connexy, convite) e é **pai** de `/profile/roles`; `/perfil/` é uma tela mais simples (card gradiente + lista). São produtos diferentes; um redirect de `/profile` quebraria a filha `/profile/roles`. Decisão pendente: fundir em `/perfil` (mover roles) ou manter os dois. |
| `/ride/*` ↔ `/corrida` | `/ride` é o fluxo de pedido de viagem (request/matching/history/active); `/corrida` é a corrida ativa em mapa (título "Corrida ativa — RotaMais"). Produtos diferentes. |
| `/notificacoes` ↔ `/notifications` | `/notificacoes` usa abas + mock estático; `/notifications` usa `NotificationCenter` + `usePresence`. Produtos diferentes. |

---

## ETAPA D — Referências internas consolidadas

- `/people` → `/pessoas` em `src/lib/context/context-rules.ts:68,214,284` e `src/components/feed/FeedNearbyPeople.tsx:38`. Grep pós-edição: **0 referências ativas a `/people`** fora do próprio arquivo de alias.
- `/chat/$conversationId`: já canônica em todos os consumidores (ETAPA A.3) — sem alteração.
- Pares BLOQUEADO: referências a `/profile`, `/perfil`, `/ride`, `/corrida`, `/notificacoes`/`/notifications` **mantidas** (ambas as telas existem).

---

## ETAPA E — Auditoria de autenticação (estado encontrado)

### E.1 Clientes e middlewares Supabase

| Componente | Arquivo | Estado |
|---|---|---|
| Cliente canônico do navegador | `src/integrations/supabase/client.ts` (`supabase`, lazy Proxy) | Único cliente vivo (auth em `__root`, `auth.tsx`, `index.tsx`, `use-auth`, `_app.gerenciar`, Reels) |
| Cliente administrativo server-only | `src/integrations/supabase/client.server.ts` (`supabaseAdmin`, service role) | **0 importadores**; `SUPABASE_SERVICE_ROLE_KEY` não configurada; Lovable-generated (não editado) |
| Middleware de auth (server) | `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`) | **Órfão** (0 importadores); Lovable-generated; valida Bearer via `getClaims` (chave publishable) — mantido intacto |
| Middleware de attach (client) | `src/integrations/supabase/auth-attacher.ts` (`attachSupabaseAuth`) | **Ativo** — registrado em `start.ts` como `functionMiddleware`; anexa `Authorization: Bearer <access_token>` aos RPCs de server functions |

### E.2 Fluxo atual

- Sessão **100% client-side** (Supabase persiste em `localStorage`). **Não há cookie de sessão legível pelo servidor.**
- `@supabase/ssr` **não está instalado**; só `@supabase/supabase-js@^2.110.1` (e `@lovable.dev/cloud-auth-js@^1.1.2` p/ OAuth broker).
- Guard client-side existente no layout: `_app.tsx:25-37` — se `useAuth()` não resolve usuário, redireciona para `/auth` e renderiza spinner. Ou seja, **todas** as rotas de produto já exigem sessão no cliente.
- Página `/auth`: login senha / Google (OAuth broker) + "Continuar sem entrar" → `/home`.

### E.3 Duplicidades encontradas (fora do escopo de mudança desta passagem)

- Dois hooks `useAuth`: `src/hooks/use-auth.ts` (usado por `_app.tsx` e `_app.gerenciar.tsx`) e `src/hooks/api/use-auth.ts` (sem uso ativo).
- Dois providers de sessão **não montados**: `src/providers/auth/session-provider.tsx` e `src/lib/supabase/supabase-provider.tsx` (nenhum JSX os utiliza).

### E.4 Segurança

- Nenhum open redirect pré-existente (nenhum redirect com origem externa).
- `requireSupabaseAuth` (o "guard real" previsto) era código morto; o servidor não validava sessão por request.

---

## ETAPA F — Consolidação de autenticação SSR (implementado)

Sem instalar dependências; usando apenas APIs confirmadas do TanStack Start instalado (`@tanstack/react-start@^1.168.26`, `@tanstack/react-router@^1.170.16`, `@supabase/supabase-js@^2.110.1`).

### F.1 Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/auth/return-to.ts` | `sanitizeReturnTo(value)` — aceita apenas caminho absoluto interno que começa com `/`, rejeita `//`, `scheme://` e `\`. **Sem open redirect.** |
| `src/lib/auth/server-auth.ts` | `isSupabaseConfigured()` (env server ou `import.meta.env.VITE_*`); `createServerAuthClient(token)` — cliente **por request** (novo `createClient` com chave publishable, `persistSession:false`, `autoRefreshToken:false`, fetch wrapper compatível com chaves `sb_*`); `resolveRequestUser()` — token da cookie de sessão ou do header `Authorization: Bearer`, validado no servidor via `auth.getUser(token)`. |
| `src/lib/auth/route-guard.ts` | `requireAuth` — guard compatível com `beforeLoad`. **Env-gated**: se Supabase não configurado → no-op (dev/demo intacto). No SSR: validação por request no servidor; no cliente: `supabase.auth.getSession()`. Não autenticado → `throw redirect({ to: "/auth", search: { returnTo: sanitizado }, replace: true })`. |
| `src/lib/auth/session-cookie.ts` | `syncSessionCookie(session)` — espelha a sessão em cookie JS-readable (`connexy-access-token`, `Path=/; SameSite=Lax; Max-Age=604800`), porque o servidor não enxerga o `localStorage`. |

### F.2 Integrações

- `src/routes/__root.tsx`: `onAuthStateChange((event, session) => syncSessionCookie(session))` + `getSession().then(...)` na hidratação — mantém o cookie em sincronia (login/logout/refresh).
- `src/routes/auth.tsx`: `validateSearch` (`returnTo?: string` opcional); após login/Google navega para `sanitizeReturnTo(returnTo) ?? "/localizacao"` via `navigate({ href })` (API oficial). Fallback preserva o comportamento atual.

### F.3 Trade-off documentado

- O cookie é **JS-readable** (não `httpOnly`) — mesmo limite de confiança do `localStorage` que o Supabase já usa. Endurecimento de produção (cookie `httpOnly` setado por rota servidor, `SameSite=Strict`) fica como pendência (ver ETAPA J).
- O guard só passa a valer quando `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` (server) ou `VITE_*` estiverem configurados. No estado atual de demo (config vazia) o comportamento é idêntico ao anterior.

---

## ETAPA G — Guards nas rotas privadas críticas

Aplicado **um único ponto de guard SSR** no layout: `src/routes/_app.tsx` → `beforeLoad: requireAuth`. Isso cobre todas as rotas críticas listadas (todas vivem sob `/_app`):

| Rota crítica | Coberta por |
|---|---|
| `/perfil/` (Meu perfil) | `_app.tsx` beforeLoad |
| `/pessoas` | `_app.tsx` beforeLoad |
| `/chat` + `/chat/$conversationId` | `_app.tsx` beforeLoad |
| `/notificacoes` | `_app.tsx` beforeLoad |
| `/corrida` | `_app.tsx` beforeLoad |
| `/gerenciar` + filhas de criação | `_app.tsx` beforeLoad |
| `/create` + filhas (publicação) | `_app.tsx` beforeLoad |

Garantias:
- **Sem loops**: `/auth` está fora de `/_app` e não é guardada; `/welcome` e `/` não são guardados. O redirect usa `replace: true` e `returnTo` sanitizado (interno-only). Ex.: `/people` → `/pessoas` (guard) → `/auth` (se não autenticado) — um salto, sem ciclo.
- **Paridade com o comportamento atual**: o layout já redirecionava ao cliente quando `!user`; o guard adiciona a validação no servidor por request.
- `/perfil/$id` (perfil público de outra pessoa) **não** foi guardada — é tela pública de consulta (decisão registrada).

---

## ETAPA I — Validações

| Validação | Comando | Resultado |
|---|---|---|
| Build | `npm run build` | ✅ PASS (exit 0) — `routeTree.gen.ts` regenerado |
| TypeScript | `npx tsc --noEmit` | ✅ PASS (exit 0) |
| Lint (total) | `npm run lint` | ❌ exit 1 — **490 problemas (473 erros, 17 warnings)** — **idêntico à baseline, sem regressão** |
| ESLint (arquivos alterados) | `npx eslint <12 arquivos>` | ✅ 0 erros (2 prettier corrigidos nos arquivos novos) |
| Whitespace | `git diff --check` | ✅ PASS (exit 0) |
| Grep `/chat/$id` em `src/` | — | ✅ 0 (fora de histórico/documentação) |
| Grep `/people` em `src/` (fora do alias) | — | ✅ 0 |

---

## ETAPA J — Estado do Git e pendências

```
D  src/routes/_app.chat.$id.tsx              (staged — remoção; SEM commit)
 M src/components/feed/FeedNearbyPeople.tsx  (/people → /pessoas)
 M src/lib/context/context-rules.ts          (/people → /pessoas ×3)
 M src/routeTree.gen.ts                      (regenerado pelo build)
 M src/routes/__root.tsx                     (cookie sync da sessão)
 M src/routes/_app.people.tsx                (alias → redirect /pessoas)
 M src/routes/_app.pessoas.tsx               (implementação completa movida)
 M src/routes/_app.tsx                       (beforeLoad: requireAuth)
 M src/routes/auth.tsx                       (validateSearch returnTo + navegação)
?? src/lib/auth/                             (return-to, server-auth, route-guard, session-cookie)
```

**Nenhum commit foi feito** (regra 2B). HEAD permanece `15cc31b`.

### Pendências reais

1. **Decisões BLOQUEADO PARA DECISÃO** (produto): `/profile`↔`/perfil/` (+ destino de `/profile/roles`), `/ride/*`↔`/corrida`, `/notificacoes`↔`/notifications`.
2. **Ativar o guard em produção**: definir `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` no servidor (`.dev.vars`/deploy) — a partir daí o guard passa a validar por request. Endurecimento recomendado: cookie `httpOnly` setado por rota de servidor (substituindo o espelhamento JS-readable), `SameSite=Strict` e `__Host-` prefix.
3. **Limpeza futura de duplicidades de auth**: unificar `hooks/use-auth.ts` × `hooks/api/use-auth.ts`; montar ou remover `providers/auth/session-provider.tsx` × `lib/supabase/supabase-provider.tsx`.
4. **Código Lovable-generated** (`auth-middleware.ts`, `client.server.ts`) permanece intacto (gerado; não editado). `requireSupabaseAuth` continua órfão; se for ativar o padrão de middleware de server function, migrar para o cliente por request de `server-auth.ts`.
5. **Commit** desta passagem (decisão do usuário; não executado).

---

## Resumo final

- **status:** CONCLUÍDO (escopo de consolidação seguro) + BLOQUEADO PARA DECISÃO (3 pares de telas distintas)
- **rotas consolidadas:** `/chat/$id` removido; `/people` → redirect `/pessoas`; implementação completa em `/pessoas`
- **auth SSR:** cliente por request (`server-auth.ts`), guard env-gated (`route-guard.ts`), `returnTo` interno-only (`return-to.ts`), cookie de sessão espelhado (`session-cookie.ts`); integrado em `_app.tsx`, `__root.tsx` e `auth.tsx`
- **build:** ✅ PASS (exit 0) · **TypeScript:** ✅ PASS · **lint:** 490 → 490 (sem regressão) · **git diff --check:** ✅
- **mocks/telas/design:** preservados (sem overwrite de telas distintas; apenas movimento de implementação `/people`→`/pessoas` e redirect)
- **banco remoto/migrations/RLS/Realtime:** nenhum acesso ou alteração
- **necessidade de commit:** SIM, mas não executado (decisão do usuário)
