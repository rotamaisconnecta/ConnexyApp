# Tópico 2A — Segurança de variáveis de ambiente e consolidação de config

- **Data:** 2026-08-07
- **Repositório:** `/home/ricardo/Downloads/opencode-project/ConnexyApp` (branch `main`, HEAD `34e2093`)
- **Base:** `docs/audits/pre-database-baseline.md` (§9, §10-P0-1, §15-passos 1)
- **Escopo:** remover o `.env` do controle de versão, ignorar artefatos de env/secrets, criar `.env.example` seguro, classificar variáveis (públicas vs server-only) e documentar a consolidação de leitura de config. **Nenhum código de produção foi alterado.**

---

## 1. Resumo executivo

O `.env` (6 variáveis, todas de material **publishable/anon**) estava versionado no Git desde o commit `5849ddc`. Este tópico removeu o `.env` do índice do Git (sem deletar o arquivo, sem reescrever histórico), blindou o `.gitignore` e criou um `.env.example` com apenas **nomes** de variáveis (nenhum valor real).

Descobertas estruturais sobre as variáveis:

- **Duplicação exata:** cada par `SUPABASE_*` / `VITE_SUPABASE_*` tem **o mesmo valor** (verificado por comparação booleana — nenhum valor impresso). A leitura no browser usa `import.meta.env.VITE_*`; no server usa `process.env.SUPABASE_*`.
- **`SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` não têm consumidor** em `src` (só `supabase/config.toml` usa `project_id` em minúsculas, para tooling).
- **`SUPABASE_SERVICE_ROLE_KEY` não está definida** — `supabaseAdmin` (`client.server.ts`) lança erro se importado (já conhecido da baseline §7.7).
- **`VITE_SUPABASE_ANON_KEY` não está definida** mas é referenciada por `src/providers/realtime/*` — os providers quebrariam em runtime se montados.
- **Nenhum valor secreto está no `.env`**: o material é publishable/anon (público por design). O risco da baseline era a **prática** (chave versionada + histórico), não o valor em si.

Estado das validações após as mudanças (nada de código mudou): **build PASS, tsc PASS, lint permanece 490 problemas (473 erros, 17 warnings)** — sem regressão.

---

## 2. Estado anterior (baseline)

| Item | Antes |
|---|---|
| `.env` no índice do Git | ✅ rastreado (`git ls-files .env` → `5849ddc`) |
| `.gitignore` cobre `.env` | ❌ não |
| `.env.example` no repo | ❌ não existia |
| Único arquivo de env em disco | ✅ `.env` (6 vars; sem `.env.local`, `.dev.vars`, etc.) |
| Duplicatas não-VITE / VITE | Pares com o mesmo valor |
| Material no `.env` | Apenas publishable/anon (público) |

---

## 3. Mudanças executadas (apenas configuração / índice)

| Ação | Comando/Arquivo | Efeito |
|---|---|---|
| Remover `.env` do versionamento | `git rm --cached .env` | Remoção **staged** (índice), arquivo **mantido em disco**. Histórico intocado. **Sem commit** — o índice fica diferente de HEAD até o usuário commitar. |
| Blindar `.gitignore` | `.gitignore` | Adicionado bloco `# Env / secrets` (ver §4). |
| Criar modelo seguro | `.env.example` | Nomes + classificação, **nenhum valor real** (ver §5). |

Confirmado: `git check-ignore` cobre `.env`, `.env.production`, `.env.development.local` e **não** cobre `.env.example` (negado por `!.env.example`). `.env` segue presente em disco.

## 4. Mudanças no `.gitignore`

Bloco adicionado após a seção `# Wrangler / Cloudflare`:

```
.dev.vars.*                     (complementa .dev.vars já existente)

# Env / secrets
.env
.env.*
!.env.example
*.pem
*.key
```

Observações:

- `*.local` já existia (linha 17), cobrindo `.env.local`.
- `!.env.example` precisa vir **depois** de `.env.*` para a negação valer — ordem mantida.
- `*.pem` / `*.key` protegem chaves privadas que possam ser geradas (ex.: Cloudflare API tokens, SSH, certificados).
- `.dev.vars.*` complementa `.dev.vars` para variantes por ambiente (`.dev.vars.production`, etc.).

## 5. Classificação das variáveis (somente nomes)

Legenda: **PUBLIC** = pode ir ao bundle do navegador; **SERVER** = só server-side; **SECRET** = nunca versionar; **(não usada)** = sem consumidor em `src`.

| Variável | Leitor (arquivo:linha) | Contexto | Classificação |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `client.ts:35`, `reel-publish.ts:94` | browser (`import.meta.env`) | PUBLIC |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts:37`, `reel-publish.ts:95` | browser | PUBLIC |
| `VITE_SUPABASE_PROJECT_ID` | — | — | PUBLIC (não usada em `src`) |
| `SUPABASE_URL` | `client.server.ts:36`, `auth-middleware.ts:36`, `client.ts:35` (fallback), `reel-publish.ts:94` (fallback) | server (`process.env`) | SERVER |
| `SUPABASE_PUBLISHABLE_KEY` | `auth-middleware.ts:37`, `client.ts:37` (fallback), `reel-publish.ts:95` (fallback) | server | SERVER (material público) |
| `SUPABASE_PROJECT_ID` | — | — | SERVER (não usada em `src`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts:37` | server, bypassa RLS | **SECRET — não definida hoje** |
| `VITE_SUPABASE_ANON_KEY` | `realtime-provider.tsx:24`, `presence-provider.tsx:19` | browser | PUBLIC — **não definida hoje (gap)** |

Notas:

- O `.env` atual define as 6 primeiras; as duas últimas **não existem** no `.env`.
- Os pares `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_PROJECT_ID`/`VITE_SUPABASE_PROJECT_ID` têm valores **idênticos** (verificação por comparação, booleano). A leitura difere: browser pega `import.meta.env.VITE_*`; server pega `process.env.SUPABASE_*`.
- `VITE_SUPABASE_URL` não embute o `SUPABASE_PROJECT_ID` (URL provavelmente customizada). Sem impressão de valores.

## 6. Consolidação de config (documentada — não implementada)

Em fase pré-banco e com a regra de **não criar abstrações genéricas**, a consolidação fica como **contrato documentado** no `.env.example` + recomendações abaixo. Nenhum código de `src` foi alterado.

1. **`.env.example` como fonte canônica de nomes** — único lugar que lista as variáveis e sua classificação.
2. **Não duplicar valores**: os pares não-VITE/VITE carregam o mesmo material. O redutor de risco é **não reescrever a duplicação** ao adicionar secrets; manter só o necessário por contexto:
   - Browser (bundle): `VITE_*`.
   - Server (SSR/Nitro/Worker): `process.env.SUPABASE_*` (via `.env` em dev; `.dev.vars`/Dashboard secrets em produção Cloudflare).
3. **Corrigir o gap do realtime quando os providers forem montados**: `realtime-provider.tsx` e `presence-provider.tsx` criam um segundo `createClient` com `VITE_SUPABASE_ANON_KEY` (inexistente). Devem usar `VITE_SUPABASE_PUBLISHABLE_KEY` (mesmo material de chave) **ou** reutilizar o cliente compartilhado `@/integrations/supabase/client` — evitando um segundo client divergente.
4. **`SUPABASE_SERVICE_ROLE_KEY`**: se um dia for usada, viverá apenas em secrets de deploy/`.dev.vars`, **nunca** no `.env` versionado nem no bundle. Hoje está ausente — `supabaseAdmin` permanece inativo (comportamento desejado).
5. **Rotação**: o material commitado é publishable/anon (público por design), sem rotação urgente. Higiene opcional: regenerar a publishable key em algum momento, já que apareceu em histórico; e, ao ativar o service role, gerar/rotacionar com cuidado.

## 7. Validação após as mudanças

| Validação | Comando | Resultado | Comparação com baseline |
|---|---|---|---|
| Build | `npm run build` | ✅ exit 0 | Igual (PASS) |
| TypeScript | `npx tsc --noEmit` | ✅ exit 0 | Igual (PASS) |
| Lint | `npm run lint` | ❌ exit 1 — **490 problemas (473 erros, 17 warnings)** | Igual (sem regressão) |
| Whitespace | `git diff --check` | ✅ exit 0 | — |
| `.env` em disco | `test -f .env` | ✅ presente | — |
| `.env` ignorado | `git check-ignore .env` | ✅ coberto | — |
| `.env.example` ignorável | `git check-ignore .env.example` | ✅ **não** ignorado (adicionável) | — |

Nenhuma dependência instalada; `package.json`/`package-lock.json`/`bun.lock` intocados; `routeTree.gen.ts` intocado; nenhuma migration/CLI Supabase usada.

## 8. Estado do Git (final)

```
D  .env              (staged — remoção do índice; arquivo em disco; SEM commit)
 M .gitignore
?? .env.example
?? docs/
```

## 9. Próximos passos (na ordem segura)

1. **Commitar** a remoção de `.env` + `.gitignore` + `.env.example` (decisão do usuário; não foi commitado neste tópico).
2. Verificar se `.env` continua intocado em disco e que o CI/deploy não depende do arquivo versionado (hoje nenhum secret está no arquivo, então o deploy não quebra).
3. Quando os providers de realtime forem montados: aplicar a correção de `VITE_SUPABASE_ANON_KEY` (§6.3).
4. Ao conectar a camada real (repos/services) e/ou server functions: definir `SUPABASE_SERVICE_ROLE_KEY` como secret de Cloudflare/`.dev.vars`, nunca em `.env`/Git.
5. Continuar o checklist da baseline §15 (passos 2 em diante: lint, lockfile único, rotas duplicadas, schema).

---

**Estado final:** nenhum código de produção, migration, banco ou lockfile foi alterado. Alterações: `.gitignore` (novo bloco), `.env.example` (novo, sem valores), `.env` (removido do índice, ainda em disco). Build/tsc PASS, lint sem regressão. Nenhum valor, token ou URL foi impresso neste relatório.
