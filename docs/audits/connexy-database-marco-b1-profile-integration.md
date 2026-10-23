# Connexy — Marco B1: Auditoria e preparação da integração do perfil próprio (Schema A)

- **Tipo:** auditoria + teste direcionado. **Nenhuma alteração de produção.** Fase exclusivamente local.
- **Data:** 2026-10-14. **Autor:** OpenCode.
- **Escopo:** decidir o menor caminho seguro para integrar leitura e atualização do **perfil próprio**
  ao Supabase real, reutilizando o contrato/adaptadores/testes já existentes. Sem tocar em publicações,
  conversas, Reels, mídia ou notificações. Sem iniciar o Marco C.
- **Escopo remoto:** nenhuma operação remota (sem `link`/`pull`/`push`/SQL/`db`/buckets). O projeto fora
  de escopo `lzejdgfvtybarpbgwsyp` não foi acessado; o autorizado `rsukwuqocgjmwwuwtqaf` não foi
  consultado. Nenhuma conexão declarada validada.
- **Segredos:** nenhum valor de URL/chave/token/senha é reproduzido. Apenas nomes de variáveis.
- **Flags:** `VITE_APP_SCHEMA_A_AUTH` e `VITE_APP_SCHEMA_A_PROFILE` **não** foram ativadas (permanecem
  lidas como `"true"` apenas, portanto OFF por ausência).

---

## 1. Estado do Git

| | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` |
| Remoto | `origin → https://github.com/rotamaisconnecta/ConnexyApp.git` |
| Rastreados com alteração no worktree (` M`) | 115 |
| Staged (`M `/`A `/`AM`/`D `) | 8 |
| Não rastreados (`??`) | 110 |

**Delta desta fase (exatamente):** +2 arquivos **não rastreados** — `tests/schema-a-profile-repository-b1.test.ts`
(o teste) e `docs/audits/connexy-database-marco-b1-profile-integration.md` (este relatório).

Nenhum `reset`, `clean`, checkout forçado, revert, formatação em massa, commit ou push. Nenhum arquivo
rastreado foi modificado, adicionado ao índice, movido ou removido por esta fase. `.env`, `.env.local`,
`.env.example`, `supabase/config.toml` e migrações **não** foram editados.

---

## 2. Diagnóstico do fluxo de perfil próprio

Dois caminhos coexistem, selecionados por flag:

- **2a — Perfil próprio demo (PRONTO, localStorage):** `src/routes/_app.perfil.index.tsx` →
  `useOwnProfileController` (`src/lib/profile/use-own-profile.ts`) → `saveDemoOwnProfile` quando o modo
  remoto está desligado. É o caminho **ativo hoje** (`VITE_APP_SCHEMA_A_PROFILE` ausente ⇒ OFF).
- **2b — Perfil próprio remoto Schema A (implementado, atrás de flag OFF):** mesma UI/controller, mas
  `loadOwn`/`saveOwn` delegam ao `SchemaAProfile`.

Cadeia do caminho remoto (todos já existentes e testados offline):

| Camada | Arquivo | Papel |
| --- | --- | --- |
| UI | `src/routes/_app.perfil.index.tsx` | tela do perfil próprio |
| Controller | `src/lib/profile/use-own-profile.ts` | `loadOwn()` no mount; `save()` → `saveOwn()` |
| Serviço/Gate | `src/lib/profile/schema-a-profile.ts` | `createSchemaAProfile`, `getSchemaAProfile`, `loadOwn`/`saveOwn`/`copyMappedFieldsOnce`/`peekPrivate`; `productionProfilePort` |
| Porta de flags | `src/lib/profile/schema-a-profile-flag.ts` | `isRemoteProfileEnabled` = Auth remoto **E** flag de perfil |
| Gate de auth | `src/lib/auth/schema-a-auth-flag.ts` | `isRemoteAuthEnabled` = demo off **E** flag **E** público configurado |
| Adaptador | `src/lib/adapters/schema-a/profile.ts` | `toDomainProfile`, `toRemoteProfileUpdate`, `toRemoteProfilePrivateUpdate`, `visibility` |
| Repositório | `src/integrations/supabase/remote/profile.repository.ts` | `getOwn`/`updateOwn`/`getOwnPrivate`/`updateOwnPrivate`; sempre escopado por `auth.uid` |
| Cliente | `src/integrations/supabase/remote/client.ts` | `createSchemaAClient`, `requireAuthUserId` |
| Guarda de update | `src/lib/profile/profile-update.ts` | `buildProfileUpdatePatch`, `runProfileUpdate` (validação/erros) |
| MCP | `src/lib/mcp/tools/get-my-profile.ts`, `update-my-profile.ts` | superfície de leitura/atualização |

Garantias já embutidas no código (offline):
- **Escopo por usuário:** `RemoteProfileRepository` chama `requireAuthUserId(client)` e filtra/actualiza
  por `id = auth.uid` (`profiles`) e `user_id = auth.uid` (`profile_private`); o patch nunca inclui `id`.
- **Sem sessão ⇒ erro controlado:** `requireAuthUserId` lança `RemoteRepositoryError(AUTH)`.
- **Só campos permitidos:** `updateOwn` copia apenas as colunas de `PUBLIC_PROFILE_FIELDS`; patch vazio
  ⇒ `VALIDATION`.
- **Data URL não persiste:** `saveOwn` remove `photo_url`/`cover_url` quando o valor é mídia local
  (`isLocalMediaUrl`).
- **Integridade identidade:** `loadOwn` exige `profiles.id === auth.uid` e `profile_private.user_id === auth.uid`.
- **Mapeamento:** normalização e visibilidade cobertas por `tests/schema-a-adapters-1h-12.test.ts`.

---

## 3. Decisão do B1 §4: implementar vs. bloquear

**Decisão: NÃO alterar o código de produção. Fluxo BLOQUEADO para validação remota.**

Fundamento: a implementação local do fluxo de perfil próprio **já existe, está atrás de flag OFF e tem
contrato/adaptadores/testes**. A única coisa que falta para "integrar ao Supabase real" é a
**estrutura remota**, que **não pode ser confirmada sem acesso remoto** (proibido nesta fase):

1. Existência de `profiles` e `profile_private` no projeto autorizado.
2. Trigger de cadastro criando `profiles`/`profile_private` com `id`/`user_id = auth.uid`.
3. Políticas RLS de `select`/`update` próprias (permitir ler/atualizar só a própria linha).

Qualquer edição de produção agora (ex.: reescrever a porta de produção, ligar flags, ajustar queries)
seria "contornar a dependência" vedada pelo B1 §4. Portanto **paramos a implementação** e documentamos
exatamente o que precisa ser confirmado (§8/§9). Nenhuma alteração vertical de código era necessária.

---

## 4. Arquivos alterados nesta fase

1. **`tests/schema-a-profile-repository-b1.test.ts` (novo) — 12 testes.** Primeiro teste **unitário**
   do `RemoteProfileRepository` concreto (antes só havia cobertura em testes *live* pulados). Fecha a
   lacuna do B1 §5 sem tocar em produção:
   - `getOwn` filtra `profiles` por `id = auth.uid`;
   - `updateOwn` escopado a `id = auth.uid`, ignora `id` forjado e encaminha só campos permitidos;
   - patch vazio ⇒ `VALIDATION` **sem** disparar query;
   - sessão ausente / `getUser` com erro ⇒ `AUTH` **sem** query;
   - linha ausente ⇒ `NOT_FOUND`; RLS (`42501`) ⇒ `RLS`; único (`23505`) ⇒ `UNIQUE`;
   - `getOwnPrivate`/`updateOwnPrivate` escopados a `user_id = auth.uid`, com `user_id` imutável no patch;
   - `getPrivateByUserId` de terceiro continua exigindo sessão autenticada.

   Estes são **testes de contrato offline** (client falso na fronteira `SchemaAClient`): comprovam o
   comportamento do código, **não** a conexão real (ver §7).

2. **`docs/audits/connexy-database-marco-b1-profile-integration.md` (novo):** este relatório.

**Nenhum arquivo de produção** (`src/**`) foi criado ou modificado nesta fase.

---

## 5. Fluxo antes × depois

| | Antes desta fase | Depois desta fase |
| --- | --- | --- |
| Comportamento em runtime | idêntico | idêntico (nada mudou em produção) |
| Caminho ativo | 2a demo (localStorage) | 2a demo (localStorage) |
| Caminho remoto (2b) | implementado, flag OFF | implementado, flag OFF |
| Prova do escopo por `auth.uid` | só em teste *live* (pulado) | + 12 testes unitários do repositório |
| Flags | OFF | OFF |
| Exposição remota | nenhuma | nenhuma |

Leitura (remota, quando ligada): `loadOwn()` ⇒ `requireIdentity()` → `profiles.getOwn()` (id = uid)
→ `profile_private.getOwnPrivate()` (user_id = uid) → `toDomainProfile` → `DemoOwnProfile`.
Gravação: `saveOwn()` ⇒ mapeia → remove mídia local → `updateOwn(patch)` (id = uid) →
`updateOwnPrivate(patch)` (user_id = uid) → recarrega.

---

## 6. Testes executados e resultados reais

Runner: `bun test` (não há script de teste em `package.json`).

| Comando | Resultado |
| --- | --- |
| `bun test tests/schema-a-profile-repository-b1.test.ts` | **12 pass / 0 fail** (39 `expect()`) |
| `bun test tests/schema-a-profile-1h-17.test.ts tests/schema-a-profile-live-1h-17.test.ts tests/schema-a-adapters-1h-12.test.ts tests/profile-update-patch.test.ts tests/phase-10-profile-identity.test.ts tests/schema-a-profile-repository-b1.test.ts` | **81 pass / 3 skip / 0 fail** (84 testes, 6 arquivos) |
| `./node_modules/.bin/prettier --check` / `bunx prettier --check` (arquivo novo) | **exit 0** |
| `./node_modules/.bin/eslint` / `bunx eslint` (arquivo novo) | **exit 0** |
| `bunx tsc --noEmit` | **exit 0** |

Os 3 *skips* são os testes **live** (`schema-a-profile-live-1h-17`) que exigem Supabase **local** via
`tests/helpers/schema-a-remote-local.ts`; eles **não** rodaram (nenhum `supabase start` foi executado).

Referências existentes mantidas verdes: `schema-a-profile-1h-17`, `schema-a-adapters-1h-12`,
`profile-update-patch`, `phase-10-profile-identity`.

---

## 7. Comprovado localmente × não validado remotamente

| Item | Status |
| --- | --- |
| Escopo por `auth.uid` no repositório (`profiles.id`, `profile_private.user_id`) | **Comprovado (offline)** |
| Rejeição de id forjado / campos não permitidos / patch vazio | **Comprovado (offline)** |
| Sessão ausente/inválida ⇒ `AUTH`; linha ausente ⇒ `NOT_FOUND`; RLS/UNIQUE mapeados | **Comprovado (offline)** |
| Mapeamento domínio↔remoto, visibilidade, normalização, data URL | **Comprovado (offline)** |
| Preservação do modo demo | **Comprovado (offline)** |
| Tabelas `profiles`/`profile_private` existirem no projeto autorizado | **NÃO validado (remoto)** |
| Trigger de cadastro criando as duas linhas por `auth.uid` | **NÃO validado (remoto)** |
| RLS de select/update próprios | **NÃO validado (remoto)** |
| Persistência real ponta-a-ponta (HTTP) | **NÃO validado (remoto)** |
| `productionProfilePort` usando o par URL/key correto | **Parcial** — lê `import.meta.env.VITE_APP_*` direto (ver §10) |

**Nota:** os 12 testes novos são prova de **contrato de código** com client simulado na fronteira
`SchemaAClient`. **Não** são prova de conexão, de tabela, de trigger ou de RLS reais.

---

## 8. Itens que exigem confirmação remota (autorização separada)

1. `profiles` e `profile_private` existentes no projeto **autorizado** `rsukwuqocgjmwwuwtqaf`, com as
   colunas consumidas pelos adaptadores (`PROFILE_*`/`PRIVATE_*`).
2. Trigger (ex.: `handle_new_user`) inserindo `profiles(id = auth.uid)` e
   `profile_private(user_id = auth.uid)` no signup.
3. Políticas RLS: `select`/`update` próprios; `select` de perfis públicos conforme `visibility`.
4. `APP_SUPABASE_URL` / `APP_SUPABASE_PUBLISHABLE_KEY` definidos e sem conflito com `VITE_APP_*`
   (herança do Marco A1; `.env` exige autorização para editar).
5. Validação live do fluxo (rodar `schema-a-profile-live-1h-17` contra stack local autorizado).

---

## 9. Critérios para encerrar o Marco B

- [ ] Cadastro real (`/cadastro` com `signUp`) **ou** redirecionamento para o fluxo real.
- [ ] Tabelas + trigger + RLS confirmados no projeto autorizado.
- [ ] `loadOwn`/`saveOwn` persistindo no Supabase real (teste live verde).
- [ ] `VITE_APP_SCHEMA_A_AUTH` e `VITE_APP_SCHEMA_A_PROFILE` ativados **somente após** validar cada fluxo.
- [ ] Data URL não persistida em `photo_url`/`cover_url` (já coberto offline).
- [ ] Nenhuma referência ativa ao projeto fora de escopo.

Enquanto os itens 1–4 de §8 não forem confirmados, o Marco B permanece **bloqueado** (não por domínio).

---

## 10. Riscos e limitações registrados

- **Token capturado uma vez:** `lazyProfilePort()` (`schema-a-profile.ts:206`) memoiza a porta de
  produção, que captura o `access_token` no momento da criação (`productionProfilePort`,
  `createSchemaAClient(url, key, { accessToken })`). Em sessão longa, o token pode expirar sem refresh,
  e uma troca de usuário na mesma aba poderia reutilizar token antigo até recarregar a página. Deve ser
  revisto na integração remota (refresh/renovação), sob validação live.
- **`productionProfilePort` lê `VITE_APP_*` direto** (`schema-a-profile.ts:186-187`) em vez do resolver
  canônico `src/lib/supabase/external-env.ts` (Marco A1). Consistente com o contexto de navegador, mas é
  uma padronização futura possível — não alterada para manter a mudança mínima.
- **Perfil de terceiro (2c)** segue `PARCIAL` (`_app.perfil.$id.tsx` lê direto no SSR/loader); **fora do
  escopo** do B1.
- **`VITE_SUPABASE_*` legado** permanece intencionalmente ignorado pelo resolver.
- **`tests/schema-a-client-types-1h-16`** trava o conjunto de importadores diretos de
  `@/integrations/supabase/types`; nesta fase nenhum importador novo foi criado (o teste não foi afetado).

---

## 11. Confirmação de ausência de operação remota

Não houve `supabase link/pull/push/db/reset/start`, login, execução de SQL, acesso a buckets, build/deploy
nem qualquer requisição ao Supabase remoto. Nenhuma variável de ambiente foi editada. Nenhuma flag foi
ativada. Fase estritamente local.

**Parar aqui e aguardar revisão antes de qualquer etapa seguinte.**
