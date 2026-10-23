# Connexy — Marco G4.3: Plano executável para desbloquear a integração HTTP

- **Marco:** G4.3 — planejamento para desbloquear a cobertura HTTP real de `getPostMediaUrl`.
- **Tipo:** auditoria + planejamento. **Nada é implementado nesta execução.**
- **Data:** 2026-10-14.
- **Executor:** OpenCode.
- **Base:** `docs/audits/connexy-database-g4-2-http-integration.md` (veredito BLOQUEADO).
- **Flags Schema A:** permanecem **OFF**. **C2/Storage:** permanece **não resolvido**.
- **Operações remotas Supabase:** **nenhuma**.

---

## 1. Veredito inicial

**PLANO PRONTO; EXECUÇÃO BLOQUEADA / NÃO VALIDADA POR HTTP.**

A integração HTTP real do `getPostMediaUrl` continua **não validada**. Este documento transforma o
relatório G4.2 em um plano executável, mas a execução depende de decisões e autorizações ainda não
dadas:

- **Bloqueio dominante (arquitetural):** o módulo de server function só é registrado se **entrar no
  grafo de build**. Hoje ele tem 0 importadores (§3.1), então não existe rota `/_serverFn/<id>`. Isso
  só se resolve com **(A)** um consumidor real no produto (decisão de produto/UI) ou **(B)** um ponto
  de registro server-only explícito — este último é artificial e conflita com a regra 9.
- **Bloqueio de verificação (infra):** o runtime real do TanStack Start não roda sob `bun test`; a
  verificação HTTP exige um build/runtime atual (Vite + nitro/Cloudflare) — §3.2/§3.3.
- **Bloqueio de backend (segurança):** autenticação/autorização exigem backend Supabase; o único
  projeto autorizado é `rsukwuqocgjmwwuwtqaf` e qualquer operação remota exige autorização explícita;
  a stack local ativa é de outro ref (§3.4/§8).

Nenhuma flag deve ser ativada automaticamente. Nenhuma rota pública nova deve existir só "para
testar".

---

## 2. Estado atual confirmado (referências exatas)

### 2.1 Endpoint e middleware

- `src/lib/media/media-url.functions.ts:49-65` — `getPostMediaUrl = createServerFn({ method: "POST" })`
  - `.middleware([requireAppSupabaseAuth])` (`:50`, import em `:3`);
  - `.validator(...)` zod `{ postId: uuid, locator }` (`:21-36`);
  - handler extrai bearer de `getRequest().headers` (`:53-56`), resolve config
    (`resolveServerSupabasePublicConfig()`, `:61`), monta cliente
    `createSchemaAClient(url, key, { accessToken: token })` (`:62`) e chama
    `createServerMediaUrlService(...).getMediaUrl(...)` (`:63-64`).
- `src/lib/supabase/auth-middleware.ts` — repo-owned (Marco A1.2):
  - `verifySupabaseBearer(...)` (`:78`) valida `Bearer <jwt>` e usa `supabase.auth.getClaims(token)`;
  - `requireAppSupabaseAuth = createMiddleware({ type: "function" }).server(...)` (`:122`), resolvendo
    config via `resolveServerSupabasePublicConfig()`.
- `src/lib/supabase/auth-attacher.ts:15` — `attachAppSupabaseAuth` (`createMiddleware({ type:"function" }).client`)
  anexa `Authorization: Bearer <access_token>` a partir da sessão do browser.
- `src/start.ts:26-27` — registra `functionMiddleware: [attachAppSupabaseAuth]` e
  `requestMiddleware: [errorMiddleware, csrfMiddleware]`.
- `src/lib/media/media-url-flag.ts:7-8` — `VITE_APP_SCHEMA_A_MEDIA_URL === "true"` (**OFF** por padrão);
  `isMediaUrlSigningEnabled()` (`:27`) exige auth remoto **e** flag.

### 2.2 Padrões de server function já existentes

| Server fn | Arquivo:linha | Middleware `.middleware()` | Fonte de identidade |
| --- | --- | --- | --- |
| `getPostMediaUrl` | `media-url.functions.ts:49` | **`requireAppSupabaseAuth` (bearer)** | bearer + `getClaims` |
| `signOut` | `src/lib/auth/sign-out.ts:7` | **nenhum** | `createServerSupabaseClient()` (cookie) |
| `prepareReturnTo` | `src/lib/auth/return-to-prepare.ts:14` | **nenhum** | cookie |
| `getAuthenticatedUserId` | `src/lib/supabase/identity.ts:28` | **nenhum** | `createServerSupabaseClient()` + `getClaims` |
| `getPlatformAdminAccess` | `src/lib/admin/admin-access.ts:24` | **nenhum** | `createServerSupabaseClient()` + `getUser` |
| `getProfileStatusClient` | `src/lib/profile/profile-status.ts:115` | **nenhum** | `createServerSupabaseClient()` |
| `generateConnexyAI` | `src/lib/gemini/generate.ts:103` | **nenhum** | — |

**Fato relevante:** `getPostMediaUrl` é o **único** server function que usa `.middleware([...])` e o
único baseado em **bearer**, em vez de sessão por cookie (`createServerSupabaseClient`,
`src/lib/supabase/server.server.ts:22`). Qualquer reuso do "padrão do repositório" implicaria mudar o
modelo de identidade do endpoint — o que **não** é uma alteração mínima.

### 2.3 Descoberta e registro de server functions (runtime real)

- Gatilho de transformação: `node_modules/@tanstack/start-plugin-core/dist/esm/start-compiler/compiler.js:63`
  (`ServerFn: /\bcreateServerFn\b|\.\s*handler\s*\(/`). O módulo só é transformado se **entrar no grafo
  de build** (for importado/carregado pela Vite).
- Manifesto: `start-compiler/server-fn-resolver-module.js` (`getResolverManifestEntries` `:3`,
  `includeClientReferencedCheck` `:10-13`, entradas `isClientReferenced` `:43-46`).
- Classificação: `start-compiler/handleCreateServerFn.js:134`
  (`isClientReferenced = clientEnv || knownFn || runtimeCodeType === "ssr"`).
- Roteamento HTTP: `@tanstack/start-server-core/dist/esm/createStartHandler.js:71`
  (`SERVER_FN_BASE`) e `:260-283` (dispatch em `/_serverFn/<id>` → `handleServerAction`).
- Resolução: `server-functions-handler.js:11-14` → `getServerFnById` → módulo virtual
  `getServerFnById.js:1` (`#tanstack-start-server-fn-resolver`), base default `/_serverFn`
  (`start-plugin-core/.../schema.js:164`).
- `server-functions-handler.js:14` chama `getServerFnById(serverFnId, { origin: "client" })` — a rota
  HTTP é tratada como **origem cliente**.

### 2.4 Runtime / build

- `package.json` scripts: `dev`=`vite dev` (`:8`), `build`=`vite build --configLoader runner` (`:9`),
  `build:dev` (`:10`), `preview`=`vite preview` (`:11`), `lint`, `format`.
- `src/server.ts:14` — entry SSR importa o virtual `@tanstack/react-start/server-entry`.
- `.output/nitro.json`: `preset: "cloudflare-module"`, `date: 2026-10-09`,
  `commands.preview = "npx wrangler --cwd ./ dev"`, `deploy = "npx wrangler --cwd ./ deploy"`.
- `.output/` é gitignored (`.gitignore:13`). **Não há** dependência `wrangler`/`workerd` em
  `package.json` (apenas `nitro` em `node_modules/.bin`).

### 2.5 Infra de teste

- 124 arquivos `tests/*.test.ts`. Helpers: `tests/helpers/cdp-browser.ts` (Chrome headless via CDP),
  `tests/helpers/schema-a-remote-local.ts` (stack local), `tests/helpers/source-scan.ts`.
- Testes "browser" (`tests/persist-*-browser.test.ts`) usam `Bun.serve` + `bun build` de harness de
  **cliente** — **não** exercitam server functions.
- Nenhum teste referencia `serverFn`, `_serverFn`, `server-entry` ou `react-start` (§ verificado).

### 2.6 Supabase

- `supabase/config.toml:1` → `project_id = "rsukwuqocgjmwwuwtqaf"` (**projeto autorizado**).
- Stack local ativa: containers `supabase_{db,kong,auth,rest,storage}_lzejdgfvtybarpbgwsyp`,
  portas `127.0.0.1:54321/54322` → ref **`lzejdgfvtybarpbgwsyp`** (**fora de escopo**) e **diferente**
  do `config.toml`. Não deve ser usada, iniciada ou modificada.
- Migrations relevantes existentes (fonte de schema): `20260925030806_schema_a_core.sql`,
  `20260819180000_phase_13b1_connections_discovery_presence.sql`,
  `20260821000000_add_find_pending_request_rpc.sql`,
  `20261009120000_ensure_bio_reels_storage_buckets.sql`.
- Regra de autorização da assinatura: `src/lib/media/media-server-authorization.server.ts:65`
  (`signMediaWithServiceRole`, service role) e `:88` (`createServerMediaUrlService`).

---

## 3. Fatos comprovados × hipóteses

### Fatos comprovados

- F1. `getPostMediaUrl` tem **0 importadores** em `src` e é **untracked**.
- F2. É o **único** server fn com `.middleware([requireAppSupabaseAuth])` e o único baseado em bearer.
- F3. O registro ocorre por transformação **no grafo de build** (compiler.js:63); sem importador, não há
  manifest entry e não há rota `/_serverFn/<id>`.
- F4. O runtime Start não roda sob `bun test` (módulo virtual `#tanstack-start-server-fn-resolver`
  não resolve; fallback fake).
- F5. `.output` é de 2026-10-09, preset Cloudflare, sem `getPostMediaUrl` no manifesto; fontes de mídia
  são de 2026-10-13 (build anterior às mudanças A1/A1.2).
- F6. `config.toml` = `rsukwuqocgjmwwuwtqaf`; stack local ativa = `lzejdgfvtybarpbgwsyp` (divergente).
- F7. A flag de mídia é OFF por padrão; sem flag não há assinatura.
- F8. A rota HTTP é tratada como `origin: "client"` (server-functions-handler.js:14).

### Hipóteses (a validar antes de confiar)

- H1. Que importar o módulo apenas no **entry server** (`src/server.ts`) seja suficiente para registrar
  e servir a rota. Depende de `includeClientReferencedCheck` e de `isClientReferenced` no ambiente SSR
  (handleCreateServerFn.js:134). **Não verificado** em runtime real.
- H2. Que `vite preview` sirva o SSR (com nitro). O `nitro.json` sugere `wrangler dev`; `wrangler` não
  está instalado. **Não verificado**.
- H3. Que o projeto remoto autorizado já possua as migrations/tabelas/RLS necessárias. **Não
  verificado** (exige autorização remota).
- H4. Que a classificação "server-referenced" mantenha a rota acessível (a checagem pode bloquear
  `origin:"client"`). **Não verificado**.

### Limitações

- Nenhum request HTTP real foi feito (não há rota registrada no build atual).
- Nenhuma policy de Storage foi auditada; a segurança de buckets permanece **bloqueada** (C2).
- Não há backend autorizado validado disponível localmente sem preparação isolada.

---

## 4. Menor solução técnica proposta e alternativas rejeitadas

### 4.1 Solução proposta (mínima e legítima) — **Opção A: consumidor real atrás da flag**

Disponibilizar `getPostMediaUrl` como o **resolvedor de mídia remota de posts** na UI, atrás da flag
`VITE_APP_SCHEMA_A_MEDIA_URL` (constante OFF). Isso coloca o módulo no grafo de build (registro
legítimo, `isClientReferenced` proveniente de uso cliente real) e cria a rota `/_serverFn/<id>`
genuinamente exercitável.

- **Candidatos de integração (a confirmar com o dono do produto):**
  `src/components/bio/bio-posts.tsx`, `src/components/post/create-post-form.tsx`,
  `src/routes/_app.perfil.$id.tsx`, `src/routes/_app.perfil.index.tsx`,
  `src/components/media/local-media-frame.tsx`, via `src/lib/media/media-resolver.ts`.
- **Por que é mínima:** não duplica autenticação/autorização (reusa `requireAppSupabaseAuth` +
  `createServerMediaUrlService`), não cria rota pública nova (usa o RPC do framework), e mantém a flag
  OFF até validação.
- **Risco:** é mudança de produto/UI (proibida nesta fase); só deve ocorrer na etapa B com
  autorização própria.

### 4.2 Alternativa B — ponto de registro **server-only** (artificial) — **não recomendada**

Importar `getPostMediaUrl` apenas para registrar (ex.: no entry `src/server.ts` ou num
`*.server.ts` alcançado pelo server entry), sem consumidor de produto. Registraria a rota, mas:

- é um artefato sem propósito de produto (aprox. a "harness artificial" da regra 9);
- depende das hipóteses H1/H4 (classificação SSR × checagem de origem cliente);
- pode tornar o endpoint chamável sem que o produto o use, ampliando superfície sem necessidade.
- **Decisão:** rejeitada por padrão; só com aprovação explícita e rotulada como **não-produtiva**.

### 4.3 Alternativas rejeitadas

| Alternativa | Motivo da rejeição |
| --- | --- |
| C. Harness que simula o runtime e chama o handler direto | Regra 9: não é HTTP real; falso-positivo |
| D. Reutilizar "rota/servfn já registrado" | Não existe server fn/rota equivalente; os demais usam cookie, não bearer |
| E. Executar `.output` | Build stale + runtime Cloudflare (F5) |
| F. Usar a stack local ativa | Ref fora de escopo (F6); proibido |
| G. Trocar o modelo de identidade do endpoint para cookie | Não é alteração mínima; muda contrato de segurança |

---

## 5. Matriz de testes de aceitação

Legenda de ambiente: **L** = local (sem backend real, cobre apenas erros de auth/config),
**B** = exige backend autorizado `rsukwuqocgjmwwuwtqaf` (com autorização explícita) ou stack local
isolada equivalente.

| # | Cenário | Pré-condições | Ação HTTP | Resultado HTTP esperado | Autorização esperada | Evidência | Amb. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Requisição sem token | rota registrada; flag OFF | `POST /_serverFn/<id>` sem `Authorization` | erro de auth (não-200 contendo `Unauthorized: No authorization header provided`) | negada | status+corpo; sem URL | L |
| T2 | Token inválido/expirado | idem | `Authorization: Bearer <lixo>` | `Unauthorized: Invalid token` | negada | status+corpo | L/B |
| T3 | Usuário A acessa mídia privada **própria** | A autenticado; post privado de A com mídia | POST com bearer de A | sucesso; `ready` (se flag ON) | permitida (autor) | status+corpo com `url`/`expiresAt` | B |
| T4 | Usuário B acessa mídia privada de A | A,B autenticados; sem conexão | POST com bearer de B | 200 sem URL assinada; `forbidden` | negada | corpo sem `url`; sem token no log | B |
| T5 | Não conectado acessa post `CONNECTIONS` | A,B sem conexão | POST de B | `forbidden` | negada | corpo | B |
| T6 | Conectado acessa post `CONNECTIONS` autorizado | A,B conectados | POST de B | `ready` | permitida | corpo com URL | B |
| T7 | Post privado, excluído ou inexistente | post removido/inexistente | POST do solicitante | `missing`/`forbidden` (nunca `ready`) | negada | corpo; sem assinatura | B |
| T8 | Caminho/bucket adulterado ou de outro dono | post de A com mídia de A | POST com `locator.path` de B | `forbidden`/`missing` (rejeita ref não registrada no post) | negada | corpo; **sem** URL | B |
| T9 | Bucket/caminho não permitido | — | POST com bucket não suportado | `forbidden`/`invalid-ref` | negada | corpo | L/B |
| T10 | Expiração e reutilização de URL assinada | URL `ready` obtida | reusar URL após `expiresAt` / cache | objeto nega após TTL; cache não revalida (invalidação) | n/a | `curl` direto ao `url` antes/depois | B |
| T11 | Falha de config (ausente/conflitante) | `APP_*`/`VITE_APP_*` ausentes ou conflitantes | POST | erro explícito de config (fail-closed) | negada; sem rede | corpo/erro; sem valores | L |
| T12 | Indisponibilidade do serviço (auth/DB down) | backend inacessível | POST com bearer | erro fail-closed; sem `ready` | negada | status+corpo | L |
| T13 | Sem vazamento de segredo | captura de `console.*` e corpo | POSTs acima | nenhum token/URL em log | n/a | varredura de log/corpo | L |

> **Distinção explícita (regra):** T1/T2/T9/T11/T12/T13 são verificáveis **localmente** (não exigem
> backend). T3–T8/T10 **exigem backend autorizado** (ou stack local isolada), pois dependem de
> sessão/JWT válidos, RLS de `posts`/`connections` e assinatura real. **Um código HTTP isolado não
> comprova autorização correta** — a evidência de autorização é o par (estado do corpo + ausência de
> URL quando negado) com o **mesmo** post/locator.

---

## 6. Plano de execução ordenado por dependências

### A. Preparação local (sem alterações de produção)

- **A1 — Confirmar mecanismo de registro** (fecha H1/H4, não muda código de produto).
  Arquivos envolvidos (somente leitura): `compiler.js`, `server-fn-resolver-module.js`,
  `handleCreateServerFn.js`, `createStartHandler.js`. Pré-requisitos: nenhum.
  Aceitação: documentar se um módulo importado só no SSR aparece no manifesto e se a rota responde.
  Interrupção: se exigir mudança de produção ou não for determinável sem build.
- **A2 — Confirmar runtime de build/preview** (fecha H2).
  Arquivos (leitura): `package.json`, `.output/nitro.json`, `vite.config.ts`.
  Aceitação: definir o comando exato que serve o SSR atual (ex.: `wrangler dev` vs `vite preview`).
  Interrupção: se exigir instalar dependência (`wrangler`) sem autorização.
- **A3 — Inventário de import-protection** (`start-plugin-core/.../import-protection/*`) para saber se
  importar o server fn no server entry é permitido. Aceitação: regra clara.
- Sem alterações de produção.

### B. Alteração mínima para registrar a função no runtime

- **B1 — Decisão de produto:** o endpoint terá consumidor real? (Opção A) — **gate de aprovação**.
- **B2 — (se A)** Fiar o consumidor atrás da flag `VITE_APP_SCHEMA_A_MEDIA_URL` (UI/componente).
  Arquivos prováveis: `src/components/bio/bio-posts.tsx` / `src/routes/_app.perfil.$id.tsx` /
  `src/components/media/local-media-frame.tsx` + `src/lib/media/media-resolver.ts`.
  Pré-requisitos: A1/A2; aprovação de produto + autorização de UI.
  Risco: médio (mudança de UI e de superfície). Aceitação: endpoint aparece no manifesto do build.
  Interrupção: se exigir tocar autenticação/autorização existente.
- **B2' — (se B, não recomendado):** registro server-only artificial, **somente com aprovação
  explícita**, rotulado como não-produtivo. Risco: alto (regra 9; superfície sem propósito).
- Pré-requisito de aceitação: `grep` no manifesto do build comprovar o id de `getPostMediaUrl`.

### C. Teste HTTP real em ambiente isolado

- **C1 — Build atualizado** (`bun run build` → `.output` ou `.nitro`), em cópia isolada se necessário.
- **C2 — Subir o runtime** em `127.0.0.1` (porta livre), sem tocar a stack Supabase existente.
- **C3 — Descobrir o id** do server fn no manifesto e invocar `/_serverFn/<id>` com `fetch` real.
- **C4 — Executar T1/T2/T9/T11/T12/T13** (sem backend) — casos **negativos** de auth/config.
- Aceitação: respostas HTTP reais observadas e registradas; **nenhum** backend remoto tocado.
- Interrupção: se o runtime exigir instalar dependências não autorizadas ou tocar a stack existente.

### D. Validação de autenticação e autorização com backend autorizado

- **D1 — Preparar stack isolada** com o schema do repo (`config.toml` = `rsukwuqocgjmwwuwtqaf`),
  em rede/porta próprias, **sem** usar `lzejdgfvtybarpbgwsup` e sem tocar dados reais (§8).
- **D2 — Criar usuários A/B sintéticos** e posts PUBLIC/CONNECTIONS/PRIVATE.
- **D3 — Executar T3–T8** com JWT reais; comparar estados de autorização.
- Aceitação: positivos assinam; negativos nunca assinam; evidência por par (corpo + ausência de URL).
- Interrupção: necessidade de operação remota sem autorização explícita.

### E. Auditoria de URLs assinadas e acesso direto aos objetos

- **E1 — TTL/expiração/reuso** (T10) sobre o objeto real assinado.
- **E2 — Acesso direto sem assinatura** a `bio-media`/`avatars`/`reels-media`: comprovar se o objeto é
  acessível fora da assinatura (fecha C2). Aceitação: objeto nega acesso direto quando a policy for
  privada; **não** declarar C2 seguro sem essa prova.
- Interrupção: se exigir mudar policies/RLS (autorização própria).

### F. Critérios de liberação ou bloqueio para a etapa seguinte

- **Liberar G4.2** apenas com: (i) rota registrada evidenciada; (ii) T1–T13 com resultados reais;
  (iii) C2 verificado independentemente.
- **Bloquear/reverter** se qualquer etapa exigir: ativar flag, mexer em auth/autorização existente,
  operação remota não autorizada, ou tocar o projeto fora de escopo.

---

## 7. Critérios de aprovação, interrupção e retorno

**Aprovação (por etapa)**

- A: documentação de registro/runtime sem mudança de código.
- B: apenas com aprovação explícita de produto/autorização; evidência no manifesto do build.
- C: respostas HTTP reais registradas para os casos de auth/config.
- D: JWT reais + RLS exercitados; evidência de autorização por par (corpo + ausência de URL).
- E: prova de bloqueio de acesso direto (C2) — **independente** da assinatura.

**Declarações proibidas (verdade do marco)**

- Testes unitários aprovados **não** comprovam integração HTTP.
- Build bem-sucedido **não** comprova autenticação.
- Autenticação bem-sucedida **não** comprova autorização de mídia.
- URL assinada válida **não** comprova proteção do acesso direto ao objeto.
- Storage permanece **bloqueado** até verificação independente de acesso a objetos/policies.

**Interrupção/retorno (rollback lógico)**

- Qualquer necessidade de: ativar flag; alterar `.env`/config/migrations; operação remota;
  tocar `lzejdgfvtybarpbgwsyp`; instalar dependências; quebrar alterações preexistentes do Git →
  **parar e reportar**, sem executar.

---

## 8. Pré-requisitos para futura validação no Supabase autorizado (`rsukwuqocgjmwwuwtqaf`)

> Nenhuma dessas operações foi executada. Todas exigem **autorização explícita** antes de rodar.

1. **Confirmar identidade do projeto** antes de qualquer operação:
   `config.toml:1` = `rsukwuqocgjmwwuwtqaf`; verificar `project_ref`/URL antes de `link`/`pull`/`push`.
2. **Verificar tabelas/funções necessárias**: `posts` (`id, author_id, privacy, media`),
   `connections` (`user_a_id, user_b_id`), RPCs de conexão; buckets `bio-media`, `avatars`,
   `reels-media` (migrations em §2.6).
3. **Verificar RLS**: `posts_select_privacy`, `posts_privacy_check`, `are_connected`, e as policies de
   `storage.objects` por bucket.
4. **Dados sintéticos isolados A/B**: usuários `...@local.test` com prefixo de execução; posts
   PUBLIC/CONNECTIONS/PRIVATE com mídia própria; conexão criada/removida entre A e B.
5. **Isolamento e limpeza**: nunca tocar dados reais; remover apenas artefatos criados (posts,
   connections, objetos de Storage, usuários) — precedente em
   `tests/media-server-authorization-live-g4.test.ts` (`afterAll`).
6. **Autorização obrigatória**: `link`, `pull`, `push`, SQL, criação de bucket, deploy, `supabase start`
   com preflight de recursos (AGENTS.md) e **rede Docker dedicada**.
7. **Bloqueio de infra**: a stack local ativa usa outro ref e ocupa `54321/54322`; uma stack isolada
   precisa de portas próprias e preflight. Se não houver caminho verificável sem tocar o fora de
   escopo, **registrar bloqueio** — não usar `lzejdgfvtybarpbgwsyp` como alternativa.

---

## 9. Riscos residuais e o que continuará bloqueado

- **Risco H1/H4**: o registro server-only pode não resultar em rota acessível; só se confirma via build
  real. Se a única via for consumidor de produto, a correção deixa de ser "mínima".
- **Risco de superfície**: habilitar a rota antes de C2 expõe um endpoint de assinatura; a flag OFF e o
  gate de autorização são a mitigação.
- **Risco de C2**: buckets potencialmente públicos com SELECT bucket-wide tornam a URL assinada
  "portadora"; sem política privada verificada, a mídia **não** é segura.
- **Continuará bloqueado até as etapas C/D/E**: a afirmação de integração HTTP validada; a segurança de
  Storage (C2); qualquer conclusão sobre autorização real de mídia.
- **Não bloqueante**: catálogo/notificações remotos, rate limiting/cache de mídia (hardening).

---

## 10. Comandos de teste propostos (não executados)

> Não executados por exigirem alterações de produção (etapa B), build/runtime (etapa C) ou backend
> (etapas D/E), ou por dependerem de autorização.

```bash
# A1/A2 — preparação (somente leitura) — NÃO executado neste marco
grep -rn "includeClientReferencedCheck\|isClientReferenced" node_modules/@tanstack/start-plugin-core/dist/esm
node_modules/.bin/nitro --help

# C1 — build atualizado (produz artefato gitignored) — requer autorização
bun run build

# C2/C3 — subir runtime isolado e descobrir o id — requer runtime/porta próprios
# (ex.: wrangler dev no preset cloudflare-module OU vite preview; a confirmar em A2)
grep -o 'functionName: "[^"]*"' <output>/server/__23tanstack-start-server-fn-resolver-*.mjs

# C4 — casos negativos de auth/config via HTTP real — requer rota registrada (etapa B)
curl -sS -i -X POST 'http://127.0.0.1:PORT/_serverFn/<id>' -H 'content-type: application/json' -d '{}'
curl -sS -i -X POST 'http://127.0.0.1:PORT/_serverFn/<id>' -H 'authorization: Bearer invalid' -d '{}'

# D — casos autorizados/negados com JWT reais — requer backend autorizado e autorização explícita
#    (executar T3–T8 comparando corpo e ausência de URL quando negado)
```

Nenhum destes comandos foi executado nesta auditoria.

---

## Anexo — Inspeções realmente executadas nesta auditoria (2026-10-14)

- `grep -rn "getPostMediaUrl\|media-url.functions" src` → 0 importadores.
- `git status --porcelain src/lib/media/media-url.functions.ts` → `??` (untracked).
- `grep -rn "createServerFn" src` → inventário de server functions (§2.2).
- `grep -rn "\.middleware(\|requireAppSupabaseAuth" src/lib` → só `media-url.functions.ts`.
- Leitura de `src/start.ts`, `src/server.ts`, `auth-attacher.ts`, `auth-middleware.ts`,
  `server.server.ts`, `media-server-authorization.server.ts`, `media-authorization.ts`,
  `media-url-flag.ts`, `identity.ts`, `admin-access.ts`, `profile-status.ts`, `sign-out.ts`,
  `return-to-prepare.ts`, `client.server.ts`.
- Leitura de `package.json`, `.output/nitro.json`, `.output/package.json`, `supabase/config.toml`.
- `grep`/`sed` em `start-compiler/compiler.js`, `server-fn-resolver-module.js`,
  `handleCreateServerFn.js`, `createStartHandler.js`, `server-functions-handler.js`,
  `schema.js`.
- `docker ps` e `ss -ltn` (read-only) → stack `lzejdgfvtybarpbgwsyp` em `54321/54322`.
- `bun test` (baseline de composição/middleware/flag) e `bunx tsc --noEmit` — ver G4.2 (104 pass; tsc 0).

Nenhum build, nenhum request HTTP, nenhum servidor iniciado, nenhuma operação remota.
