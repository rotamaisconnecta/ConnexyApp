# Connexy — G4.2: auditoria documental de integração HTTP bloqueada

- **Marco:** G4.2 — cobertura HTTP ponta-a-ponta de `getPostMediaUrl` / `requireAppSupabaseAuth`.
- **Tipo:** auditoria **local e documental** (nenhuma mudança de código, config, dependências ou infra).
- **Data:** 2026-10-14.
- **Executor:** OpenCode.
- **Operações remotas Supabase:** **nenhuma**.
- **Veredito:** **BLOQUEADO**.

Este relatório **não declara o endpoint seguro nem validado por HTTP**. O Marco C **não** foi iniciado.

---

## 1. Objetivo e escopo

Registrar por que a cobertura HTTP real do endpoint `getPostMediaUrl` está bloqueada hoje e o plano
mínimo para desbloqueá-la com segurança. A lacuna G4.2 foi apontada no plano de aceleração
(`docs/audits/connexy-database-acceleration-plan.md:176-177, 228, 252`): o endpoint + middleware
`requireAppSupabaseAuth` nunca foi exercitado pelo **transporte HTTP** do TanStack Start — os testes
existentes validam a composição de serviços, mas não a rota.

## 2. Restrições respeitadas

- Nenhuma alteração de código de produção, UI, contrato ou configuração.
- Nenhum harness HTTP criado; nenhuma dependência adicionada.
- Nenhum importador adicionado ao endpoint.
- `.env`, `.env.local`, `.env.example`, `supabase/config.toml` e migrations intocados.
- Nenhuma operação remota no Supabase; nenhum projeto acessado ou modificado.
- Projeto fora de escopo `lzejdgfvtybarpbgwsyp`: **não acessado para escrita nem modificado**; a stack
  local **não foi iniciada, recriada ou alterada** (apenas inspeção read-only de containers/portas).
- Nenhuma flag Schema A ativada.
- Alterações preexistentes do Git preservadas; sem reset/clean/checkout forçado/revert/commit/push.
- Nenhum segredo, token ou credencial reproduzido.

---

## 3. Estado confirmado

### 3.1 O endpoint não tem importadores e não é registrado (verificação 1)

- `src/lib/media/media-url.functions.ts` define o server function em `:49-65`
  (`createServerFn({ method: "POST" }).middleware([requireAppSupabaseAuth]).validator(...).handler(...)`).
- `grep -rn "getPostMediaUrl\|media-url.functions" src` → **0 importadores** (o único match é a própria
  definição; outros matches são `media-url-flag` e `use-local-media-url`, não relacionados).
- O arquivo está **não rastreado** (`?? src/lib/media/media-url.functions.ts`), sem histórico Git.
- **Registro:** o plugin Start coleta server functions por **transformação AST quando o módulo entra no
  grafo de build** — gatilho em `start-plugin-core/dist/esm/start-compiler/compiler.js:63`
  (`ServerFn: /\bcreateServerFn\b|\.\s*handler\s*\(/`), com manifesto montado em
  `start-compiler/server-fn-resolver-module.js`. Sem importador, o módulo não é compilado, **não entra
  no manifesto** e **não é servido** em `/_serverFn/<id>`.

**Conclusão:** não existe rota HTTP para `getPostMediaUrl` hoje.

### 3.2 Limites do `bun test` para o runtime HTTP do Start (verificação 2)

- O roteamento de server functions exige `SERVER_FN_BASE` (`start-server-core/dist/esm/createStartHandler.js:71`)
  e o dispatch em `:260-283`, que chama `handleServerAction` → `getServerFnById`
  (`server-functions-handler.js:11-14`).
- `getServerFnById` re-exporta de `#tanstack-start-server-fn-resolver`
  (`start-server-core/dist/esm/getServerFnById.js:1`), um módulo **virtual**.
- Sob `bun test`:

  ```
  $ bun -e 'await import("#tanstack-start-server-fn-resolver")'
  RESOLVE_ERROR: Cannot find package '#tanstack-start-server-fn-resolver'
  ```

- Há apenas um fallback fake (`fake-start-server-fn-resolver.js` → `getServerFnById` retorna `undefined`).
  Logo, **não há runtime TanStack Start in-process sob `bun test`**; os módulos virtuais são fornecidos
  exclusivamente pelo **plugin Vite** (`#tanstack-router-entry`, `#tanstack-start-entry`,
  `#tanstack-start-server-fn-resolver`, `#tanstack-start-plugin-adapters`).

### 3.3 Build Cloudflare existente — stale, sem presumir atualização (verificação 3)

- `.output/` existe (gitignored — `.gitignore:13`), mas **não** é fonte de verdade:
  - `nitro.json`: `"date": "2026-10-09T04:07:37.821Z"`, `"preset": "cloudflare-module"`,
    `"serverEntry": "server/index.mjs"` → runtime **Cloudflare Workers** (workerd/wrangler).
  - mtime de `.output/nitro.json`: **2026-10-09 01:07**; os fontes de mídia/didática são
    **2026-10-13** (`media-url.functions.ts` 23:21, `auth-middleware.ts` 23:29,
    `external-env.ts` 13:54) → o build é **anterior** às mudanças A1/A1.2.
  - Manifesto do resolver do build lista **6** server functions
    (`generateConnexyAI`, `signOut`, `getAuthenticatedUserId`, `prepareReturnTo`,
    `getPlatformAdminAccess`, `getProfileStatusClient`) — **sem `getPostMediaUrl`**.
  - `grep -rln "getPostMediaUrl" .output` → **nenhum resultado**.

**Conclusão:** o build não representa o fonte atual e não é executável como runtime de teste do endpoint.

### 3.4 Stack Supabase local — identificada, não iniciada nem modificada (verificação 4)

- Inspeção **read-only** (`docker ps`, `ss -ltn`):
  - containers `supabase_{db,kong,auth,rest,storage}_lzejdgfvtybarpbgwsyp`;
  - portas `127.0.0.1:54321` e `127.0.0.1:54322` em LISTEN.
- `lzejdgfvtybarpbgwsyp` é exatamente o projeto marcado como **fora de escopo (nunca tocar)**
  (`acceleration-plan.md:171-173, 294-297`).
- A stack **não foi iniciada, recriada, parada ou modificada**; nenhum comando `supabase` foi executado
  (a CLI `supabase` não está instalada; `npx supabase` poderia disparar download via rede e foi evitado).

---

## 4. Bloqueios e evidências

| # | Bloqueio | Evidência |
| --- | --- | --- |
| B1 | **Arquitetural** — endpoint sem rota HTTP | 0 importadores (§3.1); coleta por AST em `compiler.js:63` |
| B2 | **Runtime de teste** — Start não roda sob `bun test` | `RESOLVE_ERROR` do módulo virtual (§3.2); fallback fake |
| B3 | **Build disponível é stale e de outro runtime** | `nitro.json` (Cloudflare, 2026-10-09) vs fontes 2026-10-13 (§3.3) |
| B4 | **Backend autenticado só existe sob ref fora de escopo** | containers `*_lzejdgfvtybarpbgwsyp` (§3.4) |

### 4.1 Mecanismo HTTP que *seria* exercitado (referência)

O handler (`media-url.functions.ts:52-64`) extrai o bearer de `getRequest().headers` (`:53-56`),
resolve a config pública (`resolveServerSupabasePublicConfig()`, `:61`), monta
`createSchemaAClient(url, key, { accessToken: token })` (`:62`) e delega a
`createServerMediaUrlService(...).getMediaUrl(...)` (`:63-64`). Nada disso é alcançável sem B1/B2.

### 4.2 Cobertura existente (in-process, **não** HTTP)

- `tests/media-server-authorization-live-g4.test.ts` chama `createServerMediaUrlService`
  **diretamente** (`describe.skipIf(!live)`), detectando a stack local via
  `tests/helpers/schema-a-remote-local.ts` (`loadLocalSchemaAEnv` `:66-76`, `isLocalSchemaAReachable`
  `:78-86`). Valida autorização+assinatura **na composição**, sem transporte.
- `tests/auth-middleware-durable.test.ts` (18) cobre o middleware; `tests/media-url-flag-g1.test.ts`
  cobre a flag OFF. Nenhum atravessa o limite HTTP.

---

## 5. Fatos verificados × hipóteses × limitações (verificação 5)

**Fatos verificados**

- `getPostMediaUrl` tem 0 importadores e é untracked (§3.1) — verificado por `grep` e `git status`.
- O módulo virtual do resolver não resolve sob `bun` (§3.2) — verificado por execução.
- `.output` é de 2026-10-09, preset `cloudflare-module`, sem `getPostMediaUrl` no manifesto (§3.3).
- A stack local ativa está sob `lzejdgfvtybarpbgwsyp` (§3.4) — verificado por `docker ps`/`ss`.
- Baseline local: 104 testes focados pass, `tsc` exit 0 (§9).

**Hipóteses (não verificadas nesta auditoria)**

- H1: presumir que **qualquer** módulo de server function sem importador seja registrado — **refutada**
  pela coleta por AST (§3.1). Não tratar como fato.
- H2: que `.output` reflita o fonte atual — **refutada** pelos mtimes/manifesto (§3.3).
- H3: que a stack local `lzejdgfvtybarpbgwsyp` seja adequada/segura para testes — **não avaliada** e
  **proibida** nesta fase.

**Limitações**

- Não foi executado nenhum request HTTP real ao endpoint (não há rota).
- Não foi validado o comportamento do endpoint em nenhum runtime.
- Não foram avaliados policies de Storage (C2 permanece **não resolvido**).

---

## 6. Cenários exigidos × status

| Cenário | Exige rota HTTP | Exige Supabase | Status |
| --- | --- | --- | --- |
| Sem auth / token ausente | sim | (distinguir de erro de rede) | BLOQUEADO (sem rota) |
| Token inválido / claims inválidas | sim | sim | BLOQUEADO |
| Config pública ausente/conflitante | sim | não | BLOQUEADO (sem rota) |
| Post inexistente / inacessível | sim | sim | BLOQUEADO |
| Post privado de terceiro | sim | sim | BLOQUEADO |
| Autorizado + URL assinada (TTL) | sim | sim | BLOQUEADO |
| Falha do signer | sim | sim | BLOQUEADO |
| Ausência de vazamento de segredo | sim | — | BLOQUEADO (sem rota) |

Nenhum cenário atravessa o limite HTTP, porque a rota não existe (B1) e não há runtime Start (B2).

---

## 7. Riscos de cada alternativa

| Alternativa | Descrição | Riscos | Decisão |
| --- | --- | --- | --- |
| **A. Documental (escolhida)** | Registrar bloqueio e plano; sem código/harness | Lacuna HTTP permanece aberta (verdade registrada). Nenhum risco de produção/segurança | **Adotada** |
| B. Harness de dev server agora | Subir Vite/Start em `127.0.0.1` e forçar registro | Mudança ampla de infra de teste; flakiness; pode disparar chamadas de rede (SSR/rotas) se não isolado; ainda assim **não cobre** cenários autenticados sem backend; forçar registro é dependente de detalhe interno do dev server | Rejeitada nesta fase |
| C. Adicionar importador/wiring ao endpoint | Tornar o endpoint registrado/servido | Mudança de produção/UI; **fora das restrições**; cria superfície de URL assinada **antes** de C2/Storage resolvido → risco de segurança | Rejeitada nesta fase |
| D. Usar a stack local atual | Testar contra `lzejdgfvtybarpbgwsyp` | Toca projeto **fora de escopo**; sem preflight de isolamento (AGENTS.md); proibido | Rejeitada |
| E. Executar `.output` | Testar o build Cloudflare existente | **Falso-positivo**: testa código obsoleto e runtime diferente (§3.3) | Rejeitada |

---

## 8. Plano de desbloqueio (para fase separada)

1. **Decidir, em fase separada, se o endpoint deve ter um consumidor real no produto.** Sem
   consumidor, não há superfície HTTP legítima a testar (e o wiring é mudança de produto).
2. **Validar o mecanismo de registro e execução no runtime TanStack Start utilizado pelo projeto**
   (plugin Vite/`start-plugin-core`, `SERVER_FN_BASE`, `getServerFnById`) — confirmar como um server
   function é registrado e servido no runtime de produção real, não em `bun test`.
3. **Preparar um ambiente de teste isolado, sem dados ou projetos fora de escopo** (stack local
   própria com isolamento comprovado e preflight de recursos conforme AGENTS.md).
4. **Testar autenticação, autorização de publicação, assinatura e erros por HTTP** contra esse
   ambiente (casos positivos e negativos).
5. **Validar separadamente o acesso direto aos objetos Storage** (C2), sem confundir com a assinatura.
6. **Só encerrar G4.2 quando houver evidência de execução HTTP real**, incluindo casos positivos e
   negativos.

---

## 9. Testes e inspeções realmente executados

Inspeções/comandos (todos locais; nenhum altera estado):

- `grep -rn "getPostMediaUrl\|media-url.functions" src` → 0 importadores.
- `git status --porcelain src/lib/media/media-url.functions.ts` → `??` (untracked).
- `bun -e 'import("#tanstack-start-server-fn-resolver")'` → `RESOLVE_ERROR`.
- `grep`/`sed` em `nitro.json` e no manifesto `__23tanstack-start-server-fn-resolver-*.mjs`;
  `grep -rln "getPostMediaUrl" .output` → ausente.
- `ls --time-style=long-iso` de fontes vs `.output/nitro.json` (comparação de frescor).
- `docker ps` e `ss -ltn` (read-only) para identificar a stack local.
- Leitura de `tests/helpers/schema-a-remote-local.ts` e
  `tests/media-server-authorization-live-g4.test.ts`.

Testes (baseline da suíte, **sem alteração de código**):

```
$ bun test tests/media-url-flag-g1.test.ts tests/media-authorization-g1.test.ts \
    tests/media-contract-g1.test.ts tests/media-resolver-g1.test.ts \
    tests/media-adapter-dm1-g4.test.ts tests/media-duration.test.ts \
    tests/auth-middleware-durable.test.ts tests/supabase-external-env.test.ts
104 pass, 0 fail, 278 expect() calls
```

- `bunx tsc --noEmit` → exit **0**.

> Estes testes são de **composição/middleware/flag**, não de HTTP. Nenhuma rota HTTP foi exercitada.

---

## 10. Confirmação: sem mudanças de produção e sem operações remotas

- **Produção/UI/config/dependências:** nenhuma alteração.
- **Harness HTTP:** nenhum criado. **Importadores do endpoint:** nenhum adicionado.
- **Supabase remoto:** nenhuma operação (login/link/pull/push/SQL/buckets).
- **Stack local:** não iniciada, recriada, parada ou modificada (apenas inspeção read-only).
- **Flags Schema A:** não ativadas. **C2/Storage:** não resolvido; não declarado seguro.
- **Git:** alterações preexistentes preservadas; sem reset/clean/checkout forçado/revert/commit/push.
  Estado atual: 115 ` M`, 8 staged; untracked 113 (112 antes deste relatório + este arquivo).
- **Segredos:** nenhum reproduzido ou persistido.

---

## 11. Veredito

**BLOQUEADO.**

A cobertura HTTP real de `getPostMediaUrl` não é executável neste ambiente por três razões
independentes:

1. **Arquitetural** — 0 importadores ⇒ módulo não compilado/registrado ⇒ **não existe rota**
   `/_serverFn/<id>` (B1).
2. **Runtime de teste** — módulos virtuais do Start não resolvem sob `bun test`; o único build
   presente é **stale** e de preset **Cloudflare Workers** (B2/B3).
3. **Backend/segurança** — cenários autenticados exigem Supabase, e a única stack local ativa está
   sob a ref **fora de escopo** (B4).

Nenhuma rota HTTP foi exercitada; **nada foi declarado como testado por HTTP**. O desbloqueio segue o
plano da §8, em fase separada.
