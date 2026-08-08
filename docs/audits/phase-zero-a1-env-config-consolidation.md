# Tópico 2A — Passagem corretiva de consolidação de config (phase-zero-a1)

- **Data:** 2026-08-07
- **Repositório:** `/home/ricardo/Downloads/opencode-project/ConnexyApp` (branch `main`, HEAD `34e2093`)
- **Base:** `docs/audits/phase-zero-a-env-security.md` (Tópico 2A) e `docs/audits/pre-database-baseline.md`
- **Escopo:** passagem corretiva mínima — consolidar o consumo de variáveis do Supabase, eliminar referência a variável pública inexistente, unificar Realtime e Reels no cliente canônico do navegador, manter a configuração administrativa server-only. **Nenhum banco, migration, policy, bucket ou projeto remoto foi alterado.**

---

## 1. Variáveis públicas canônicas

Padrão público único aceito (browser):

| Variável | Classificação | Consumo |
|---|---|---|
| `VITE_SUPABASE_URL` | PUBLIC_BROWSER | `client.ts` (browser), `reel-publish.ts` (check) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | PUBLIC_BROWSER | `client.ts` (browser), `reel-publish.ts` (check) |

`VITE_SUPABASE_ANON_KEY` **não** é chave pública canônica — nunca existiu no `.env` e foi **removida** do código (ver §3).

## 2. Variáveis server-only

| Variável | Classificação | Consumo |
|---|---|---|
| `SUPABASE_URL` | SERVER_ONLY | `client.ts:35` (fallback SSR), `auth-middleware.ts:36`, `client.server.ts:36` |
| `SUPABASE_PUBLISHABLE_KEY` | SERVER_ONLY (material público, lida só no servidor) | `client.ts:37` (fallback SSR), `auth-middleware.ts:37` |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER_ONLY, OPCIONAL — **não configurada** | `client.server.ts:37` (cliente administrativo) |

Nenhuma variável server-only foi adicionada ao `.env` real nem ao exemplo como obrigatória.

## 3. Referências inexistentes removidas ou corrigidas

- **`VITE_SUPABASE_ANON_KEY` (inexistente no `.env`)** — remoção completa do código:
  - `src/providers/realtime/realtime-provider.tsx:24` — removida.
  - `src/providers/realtime/presence-provider.tsx:19` — removida.
  - Removida também do `.env.example`. Não há mais nenhuma referência em `src/` (grep confirmado). Ocorrências restantes existem apenas em relatórios históricos (`AUDITORIA_IMPLEMENTACAO_MVP.md`, audits anteriores) — documentação, não fluxo ativo.
- **`process.env.*` em código de navegador** — `isSupabaseConfigured()` (`reel-publish.ts:93-97`) lia `import.meta.env.VITE_* ?? process.env.SUPABASE_*`. O fallback `process.env` foi removido; a função agora lê somente o par público canônico. Isso também elimina o P2.5 da baseline ("`process.env` referenciado em código de cliente").
- **Sem fallback silencioso anon↔publishable**: não foi introduzida nenhuma lógica que troque anon por publishable — um único padrão público (publishable) é usado.

## 4. Clientes Supabase encontrados

| Cliente | Arquivo | Uso real |
|---|---|---|
| **Canônico do navegador** | `src/integrations/supabase/client.ts` (`supabase`, lazy Proxy) | **Único** cliente vivo: auth (`__root`, `auth.tsx`, `index.tsx`, `use-auth`, `_app.gerenciar`, etc.), Reels (`reel-publish.ts`), `comments-sheet` |
| Administrativo server-only | `src/integrations/supabase/client.server.ts` (`supabaseAdmin`, lazy Proxy) | **0 importadores** — nenhum código do navegador importa; sem uso ativo |
| Auth middleware (server) | `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`) | Definido, **nunca importado**; usa chave publishable (não service role) |
| Wrappers "solto" | `src/lib/supabase/*` (`client`, `auth`, `realtime`, `database`, `rpc`, `storage`) | Camada morta; todos envolvem o cliente canônico (nenhum `createClient` paralelo) |

Inventário de `createClient(`: **apenas** `client.ts` e `client.server.ts` (dentro de `src/integrations/supabase/`). Os providers de Realtime eram o único ponto de criação paralela — corrigido.

## 5. Cliente canônico escolhido

`supabase` de `src/integrations/supabase/client.ts` — o cliente oficial do navegador, lazy Proxy que cria o client real sob demanda. Suas mensagens de erro citam **apenas nomes** de variáveis ausentes (nenhum valor); valida apenas as variáveis públicas necessárias (`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` no browser).

## 6. Ajustes feitos em Realtime e Reels

### Realtime (`src/providers/realtime/*`)

- `realtime-provider.tsx`: removido o `createClient(...)` paralelo com `VITE_SUPABASE_ANON_KEY`; agora usa o `supabase` canônico importado. Tipos mantidos via `SupabaseClient` (type-only).
- `presence-provider.tsx`: idem; `channelRef` tipado com `RealtimeChannel` (type-only); o canal passa a ser criado no cliente canônico.
- **Observação de acoplamento:** os providers de `providers/realtime/` **não são importados por nenhuma rota/componente** (fluxo ativo de presença usa `providers/presence/presence-provider.tsx`, baseado em `localStorage`, sem Supabase). A correção remove a referência quebrada e deixa os módulos prontos para uso futuro, sem mudar o comportamento atual.

### Reels (`src/lib/reels/reel-publish.ts`)

- Já usava o cliente canônico (`import { supabase } from "@/integrations/supabase/client"`) para `auth.getUser`, upload e insert — **sem alteração** nesses fluxos.
- `isSupabaseConfigured()` (usado por `_app.gerenciar.novo-reel.tsx:182,379` e por `publishReel`) agora lê apenas `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`, removendo o `process.env` do bundle de cliente.

## 7. Situação do `supabaseAdmin`

- Mantido como **infraestrutura futura** em `src/integrations/supabase/client.server.ts` (não apagado).
- Server-only, lazy Proxy: só lança erro **se acessado** e `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` ausentes — o que não acontece hoje (0 importadores).
- **Não exigida para autenticação normal** (auth usa `client.ts` com publishable; middleware usa publishable). A ausência da service role **não** derruba build nem inicialização.
- Nenhum valor fictício de service role foi criado; nenhuma chave real foi adicionada.

## 8. Aliases duplicados `SUPABASE_*` / `VITE_SUPABASE_*` — mantidos, com justificativa

O runtime **exige** os dois conjuntos de nomes — não é duplicação removível:

- **Browser:** o Vite expõe ao bundle apenas variáveis com prefixo `VITE_` (`import.meta.env.VITE_*`). Variáveis sem prefixo não chegam ao navegador.
- **Server:** SSR/Nitro/Cloudflare Workers leem `process.env.SUPABASE_*` (convenção de `.env`/`.dev.vars` sem prefixo).

Por isso a duplicação de **valores** (mesmo material) é mantida, mas o **consumo** foi centralizado: o cliente canônico `client.ts` é o único leitor duplo (`import.meta.env.VITE_* || process.env.SUPABASE_*`); módulos server-only leem `process.env.SUPABASE_*`; módulos de navegador leem apenas `VITE_*`. Nenhuma API do TanStack Start/Nitro/Cloudflare foi inventada — o padrão usado já existia no projeto.

## 9. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/providers/realtime/realtime-provider.tsx` | Usa cliente canônico; remove `VITE_SUPABASE_ANON_KEY` e o `createClient` paralelo |
| `src/providers/realtime/presence-provider.tsx` | Usa cliente canônico; remove `VITE_SUPABASE_ANON_KEY` e o `createClient` paralelo; `channelRef` com `RealtimeChannel` |
| `src/lib/reels/reel-publish.ts` | `isSupabaseConfigured()` lê apenas `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`; remove fallback `process.env` |
| `.env.example` | Refletido apenas a config aceita: 2 públicas, 2 server-only, service role comentada (OPCIONAL); removidos `VITE_SUPABASE_ANON_KEY` e `*_PROJECT_ID` (sem consumidor em `src`) |
| `.gitignore` | **Verificado (sem nova alteração)** — já continha `.env`, `.env.*`, `!.env.example`, `.dev.vars`, `.dev.vars.*`, `*.pem`, `*.key` |

Não alterados: `client.ts`, `client.server.ts`, `auth-middleware.ts`, `routeTree.gen.ts`, `package.json`/lockfiles, `supabase/*`, mocks, telas/rotas.

## 10. Build, TypeScript, lint e git diff --check

| Validação | Comando | Resultado |
|---|---|---|
| Build | `npm run build` | ✅ PASS (exit 0) |
| TypeScript | `npx tsc --noEmit` | ✅ PASS (exit 0) |
| Lint (total) | `npm run lint` | ❌ exit 1 — **490 problemas (473 erros, 17 warnings)** — idêntico à baseline, **sem regressão** |
| ESLint (arquivos alterados) | `npx eslint <3 arquivos>` | ✅ 0 erros; **3 warnings pré-existentes** (react-refresh ×2, exhaustive-deps ×1 — já existiam) |
| Whitespace | `git diff --check` | ✅ PASS (exit 0) |
| Git | `git status --short` | conforme §11 |

## 11. Estado do Git e do `.env`

```
D  .env                                    (staged — remoção do índice; arquivo em disco; SEM commit)
 M .gitignore
 M src/lib/reels/reel-publish.ts
 M src/providers/realtime/presence-provider.tsx
 M src/providers/realtime/realtime-provider.tsx
?? .env.example
?? docs/
```

Confirmações:
- **`.env` permanece fisicamente no computador** (`test -f .env` → presente) e **não está mais rastreado** (`git ls-files .env` → vazio; a remoção staged de `5849ddc` aguarda commit do usuário).
- Nenhuma referência ativa a `VITE_SUPABASE_ANON_KEY` em `src/` (grep → zero).
- Realtime usa o cliente público canônico (`@/integrations/supabase/client`).
- **Service role no bundle do navegador: AUSENTE.** O único match em `.output/public/assets` é o literal de detecção `isNewSupabaseApiKey` (`startsWith("sb_publishable_")/("sb_secret_")`), sem material de chave — idêntico à baseline §7.9.
- Nenhuma migration/banco remoto alterado (`git status --short supabase/` vazio; arquivos rastreados intactos).
- `*.pem`/`*.key`/`.dev.vars.*` protegidos pelo `.gitignore`.

## 12. Pendências reais para o Tópico 2B

1. **Commit** da remoção de `.env` + `.gitignore` + `.env.example` + ajustes de código (decisão do usuário; não commitado aqui).
2. **Rotação higiênica opcional** da publishable key (material público, mas apareceu em histórico).
3. Decidir se os providers de `providers/realtime/` serão **montados** no futuro; se sim, confirmar que o canal usa o cliente canônico (já corrigido) e revisar o `react-hooks/exhaustive-deps` do `realtime-provider.tsx` naquele momento.
4. Definição de `SUPABASE_SERVICE_ROLE_KEY` **somente** como secret de deploy (Cloudflare/`.dev.vars`) quando houver server functions — nunca em `.env`/Git.
5. Atualizar `AUDITORIA_IMPLEMENTACAO_MVP.md` para refletir que `VITE_SUPABASE_ANON_KEY` não é mais parte da config aceita (documentação histórica).
6. Manter o checklist da baseline §15 (lint total, lockfile único, rotas duplicadas, schema) como itens independentes do Tópico 2B.

---

## Resumo final

- **status:** CONCLUÍDO
- **arquivos de código alterados:** `src/providers/realtime/realtime-provider.tsx`, `src/providers/realtime/presence-provider.tsx`, `src/lib/reels/reel-publish.ts`
- **variável pública canônica adotada:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- **referência a `VITE_SUPABASE_ANON_KEY`:** REMOVIDA (código e `.env.example`; sem ocorrência ativa em `src/`)
- **Realtime:** CORRIGIDO (usa o cliente canônico; módulos não montados, prontos para uso)
- **service_role no navegador:** AUSENTE (nenhum material; apenas literal de detecção)
- **build:** ✅ PASS (exit 0)
- **TypeScript:** ✅ PASS (exit 0)
- **lint antes e depois:** 490 problemas antes (baseline) → **490 depois** (sem regressão; arquivos alterados: 0 erros, 3 warnings pré-existentes)
- **necessidade de commit:** SIM, mas não executar (remova a remoção staged do `.env`, `.gitignore`, `.env.example` e os 3 arquivos de código)

A configuração de ambiente foi consolidada sem revelar credenciais e nenhum banco remoto foi alterado.
