# G4.27E — Opção A, Etapa 1: Readiness de snapshot/restore do Supabase local

> **Etapa exclusivamente de leitura.** Nenhuma migration, `supabase start/stop/db reset`,
> SQL de escrita, snapshot, restore, alteração de bucket/policy/grant/RLS, alteração de
> container/volume, comando remoto, commit ou push foi executado. Apenas consultas
> `SELECT`/introspecção e listagens de arquivos foram realizadas. Este documento propõe
> um plano; **nada dele foi executado**.
>
> Relatório-base: `docs/audits/connexy-database-g4-27e-private-avatar-e2e.md`.
> Contexto: G4.26D, G4.27B, G4.27C, G4.27D.

Regra de evidência: **[F]** = verificado nesta auditoria; **[I]** = inferência
fundamentada; **[H]** = hipótese não comprovada.

---

## 1. Escopo e limites desta etapa

| Item | Situação |
| --- | --- |
| Leitura do relatório G4.27E e do teste/helpers E2E | executada **[F]** |
| Introspecção read-only do PostgreSQL local | executada **[F]** |
| Listagem read-only de containers/volumes/arquivos de storage | executada **[F]** |
| Busca por scripts de backup/snapshot/restore no repositório | executada **[F]** |
| Migration G4.27B aplicada | **não** **[F]** |
| `supabase start/stop/db reset` | **não** **[F]** |
| Snapshot/backup criado | **não** **[F]** |
| Restore executado | **não** **[F]** |
| Alteração de bucket/policy/RLS/grant | **não** **[F]** |
| Alteração de containers/volumes/configuração | **não** **[F]** |
| Operação remota / commit / push | **não** **[F]** |
| C-06 / C-08 | não alterados **[F]** |

Este relatório **não autoriza** execução. Ele apenas avalia se há caminho seguro e
verificável para uma futura execução com autorização explícita.

---

## 2. Estado observado do ambiente

**Janela da auditoria:** `2026-10-22T22:08–22:10 -03:00`
(`2026-10-23T01:08–01:10 UTC`). **[F]**

### 2.1 Containers e volumes

| Container | Estado | Porta publicada |
| --- | --- | --- |
| `supabase_db_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | `127.0.0.1:54322` |
| `supabase_kong_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | `127.0.0.1:54321` |
| `supabase_auth_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | interna |
| `supabase_rest_lzejdgfvtybarpbgwsyp` | Up 10h | interna |
| `supabase_storage_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | interna |

| Volume Docker | Destino | Tamanho |
| --- | --- | --- |
| `supabase_db_lzejdgfvtybarpbgwsyp` | `/var/lib/postgresql/data` | `80.3M` no diretório de dados |
| `supabase_storage_lzejdgfvtybarpbgwsyp` | `/mnt` | `252.0K` em `/mnt/stub/stub` |

Nenhum container foi reiniciado, parado ou recriado. **[F]**

### 2.2 PostgreSQL local

| Item | Valor |
| --- | --- |
| Database | `postgres` |
| Usuário da conexão | `postgres` |
| Versão | `17.6` |
| `data_directory` | `/var/lib/postgresql/data` |
| Tamanho do banco | `18 MB` |
| `max_connections` | `100` |
| Migrations registradas | `13` (última `20260925030806`) |
| Guard `private.g4_26b_is_canonical_avatar_path` | ausente (`0`) |
| `storage.buckets.avatars.public` | `true` |
| Policy `Avatars public read` | presente (`SELECT`, roles `{public}`, `qual = (bucket_id = 'avatars'::text)`) |

**O banco local não reflete o contrato privado remoto** (G4.27C): o bucket segue
público, a policy pública existe e o guard não existe. **[F]**

### 2.3 Dados locais presentes (contagens, sem conteúdo)

| Tabela / conjunto | Linhas |
| --- | --- |
| `auth.users` | `840` |
| `auth.identities` | `840` |
| `auth.sessions` | `5` |
| `public.profiles` | `840` |
| `public.profile_private` | `840` |
| `public.connections` | `228` |
| `storage.objects` | `2` (1 em `avatars`, 1 em `bio-media`) |
| Usuários com e-mail no padrão de fixture `g4-27e-%@local.test` | `0` |

- `839` perfis têm `photo_url IS NULL`; `1` tem URL HTTP externa; **nenhum** perfil
  possui caminho canônico. **[F]**
- O único objeto em `avatars` não é referenciado por `photo_url` canônico. **[F]**
- **Não é seguro tratar esses dados como descartáveis**: há 840 usuários/perfis e 228
  conexões locais que podem ter valor de desenvolvimento. O snapshot deve cobrir o
  banco inteiro, não apenas o fixture do teste. **[F]**

### 2.4 Storage

| Item | Valor |
| --- | --- |
| Backend | `file` |
| `FILE_STORAGE_BACKEND_PATH` | `/mnt` |
| `TENANT_ID` | `stub` |
| Diretório de objetos | `/mnt/stub/stub` |
| Buckets | `avatars`, `bio-media`, `reels-media` |
| Arquivos | `2` (`avatars=1`, `bio-media=1`, `reels-media=0`) |
| Hash agregado do manifesto atual | `44b7380695f78367fa10da3954775d121e78856cb794bee29bf6b12650b9591c` |

O hash acima é o SHA-256 do conjunto ordenado de hashes dos arquivos; **nomes de
objetos não foram impressos**. **[F]**

### 2.5 Capacidade e atividade

| Item | Valor |
| --- | --- |
| Espaço livre em `/` | `30G` |
| Uso do Docker | volumes locais `84.05MB` |
| Processos escutando em `3000`/`5173` | nenhum |
| Conexões ativas no PostgreSQL | `postgres=4`, `datname` nulo=5 (background/psql) |

Não foi identificado servidor de desenvolvimento do app escutando no host durante a
auditoria. Ainda assim, a janela de execução deve confirmar quiescência antes do
snapshot. **[F]/[I]**

---

## 3. Divergência entre `project_id` e containers

| Evidência | Valor |
| --- | --- |
| `supabase/config.toml:1` | `project_id = "rsukwuqocgjmwwuwtqaf"` **[F]** |
| Labels dos containers | `com.supabase.cli.project=lzejdgfvtybarpbgwsyp` **[F]** |
| `supabase/.temp/project-ref` | `rsukwuqocgjmwwuwtqaf` **[F]** |
| `supabase/.temp/linked-project.json` | projeto vinculado `connexy-mvp` **[F]** |
| `git diff supabase/config.toml` | `lzejdgfvtybarpbgwsyp` → `rsukwuqocgjmwwuwtqaf` (alteração pré-existente) **[F]** |
| CLI instalado | `2.114.0` (`node_modules/.bin/supabase`) **[F]** |

**Causa:** o `project_id` foi alterado (pré-existente) para o ref do projeto remoto
vinculado, enquanto os containers locais foram criados sob o ref
`lzejdgfvtybarpbgwsyp`. O CLI deriva os nomes dos containers do `config.toml` e
procura `supabase_*_rsukwuqocgjmwwuwtqaf`, inexistente. **[F]** para os fatos;
**[I]** para o mecanismo exato de resolução do CLI.

**Implicações para o plano:**

- **Não usar** `supabase status`, `supabase db dump --local`, `supabase start/stop`
  ou qualquer comando do CLI que resolva o projeto pelo `config.toml`. **[F]**
- Backup/restore devem usar **Docker + `pg_dump`/`pg_restore` dentro do container
  `supabase_db_lzejdgfvtybarpbgwsyp`** e o volume `supabase_storage_lzejdgfvtybarpbgwsyp`. **[F]**
- **Não alterar** o `config.toml` para “corrigir” a divergência nesta fase. **[F]**

---

## 4. Arquivos e scripts inspecionados

| Arquivo / artefato | Papel |
| --- | --- |
| `docs/audits/connexy-database-g4-27e-private-avatar-e2e.md` | relatório anterior; registra E2E não executado |
| `docs/audits/connexy-database-g4-27d-avatar-c2-end-to-end.md` | validação anterior e pendência E2E |
| `docs/audits/connexy-database-g4-27c-avatar-c2-local-sync.md` | sincronização local/remota e estado esperado |
| `tests/avatar-media-e2e-local-g4-27e.test.ts` | teste E2E que seria executado (lido, não executado) |
| `tests/helpers/g4-27e-local-stack.ts` | descoberta Docker, SQL local, resolução de env |
| `tests/helpers/g4-27e-avatar-fixture.ts` | criação/limpeza de fixture + snapshot/restore do bucket |
| `supabase/migrations/20261021042744_g4_27b_...sql` | migration que o teste aplica localmente |
| `supabase/config.toml` | `project_id` e buckets (`avatars.public = true`) |
| `src/lib/media/avatar-media-authorization.server.ts` | serviço de autorização/assinatura |
| `src/lib/media/avatar-media.functions.ts` | server fn |
| `src/components/media/authenticated-avatar-image.tsx` | consumidor |
| `src/lib/media/avatar-media.ts` | classificação canônica |
| `src/integrations/supabase/client.server.ts` | cliente admin lazy (`SUPABASE_URL`/service role) |
| `src/integrations/supabase/remote/client.ts` | client tipado |
| `src/lib/supabase/external-env.ts` | precedência `APP_*` > `VITE_APP_*` |
| `src/lib/supabase/auth-middleware.ts` | verificação de Bearer |
| `scripts/admin-access.ts`, `scripts/final-auth-race-check.mjs` | verificados; **não** são backup/restore |
| `package.json` | sem script de backup/snapshot/restore |
| `supabase/.temp/*` | ref vinculado (`rsukwuqocgjmwwuwtqaf`) |

**Não existe no repositório script de backup/snapshot/restore do banco ou do
storage**, nem comando em `package.json`. O único mecanismo existente é o
snapshot/restore **pontual** do bucket dentro do helper do teste. **[F]**

---

## 5. Escopo preciso dos dados potencialmente afetados

### 5.1 Efeito da migration G4.27B (`20261021042744`)

| Objeto | Operação | Restaurável pelo helper do teste? |
| --- | --- | --- |
| `private.g4_26b_is_canonical_avatar_path(text)` | `CREATE OR REPLACE` | Sim (drop se não existia) **[F]** |
| Policy `Avatars public read` em `storage.objects` | `DROP` | Sim (recriada a partir de `pg_policies`) **[F]** |
| `storage.buckets` (`avatars.public`) | `false` | Sim (valor capturado antes) **[F]** |
| Demais buckets/policies/tabelas | não tocados | n/a **[F]** |

A migration **não** altera dados de `storage.objects`, `profiles` ou `auth.users`. **[F]**

> Limitação do restore do helper: ele captura a **definição** da função do guard,
> mas não o ACL/`REVOKE` da função. Hoje o guard **não existe** (`0`), então o
> restore apenas o remove — sem impacto. Se o guard existisse antes, o ACL não
> seria integralmente restaurado. **[F]**

### 5.2 Efeito do fixture E2E

| Objeto | Escrita | Limpeza prevista |
| --- | --- | --- |
| `auth.users` | 2 usuários de teste | `admin.deleteUser` **[F]** |
| `auth.identities` / `auth.sessions` | criados pelo GoTrue | cascata ao deletar usuário **[F]** |
| `public.profiles` | 2 linhas (trigger `handle_new_user`) | `DELETE` explícito **[F]** |
| `public.profile_private` | 2 linhas (trigger) | `DELETE` explícito **[F]** |
| `public.profiles.photo_url` | atualizado no perfil do viewer | restaurado/limpo junto com o perfil **[F]** |
| `storage.objects` | 2 linhas (PNG/JPEG) | `storage.remove` + `DELETE` de usuários **[F]** |
| Arquivos em `/mnt/stub/stub/avatars` | 2 arquivos | `storage.remove` **[F]** |
| `supabase_migrations.schema_migrations` | **não** atualizado (aplicação direta via psql) | inalterado **[F]** |

O trigger `handle_new_user` grava **somente** `profiles` e `profile_private`; não
cria conexões nem outras linhas. **[F]**

### 5.3 Dados que **não** devem ser perdidos

- 840 `auth.users` / `profiles` / `profile_private`, 840 `identities`, 5 `sessions`,
  228 `connections` e os 2 objetos de storage existentes. **[F]**
- O E2E **não deve** tocar nesses registros; porém, um restore total mal executado
  pode perdê-los. O plano deve preferir rollback pontual e só usar restore total
  como contingência. **[F]/[I]**

---

## 6. O teste usa somente o Supabase local? Pode alcançar o remoto?

**Por construção, o teste foi projetado para o stack local.** **[F]**

- `g4-27e-local-stack.ts` descobre containers por prefixo Docker e fixa
  `LOCAL_STACK_URL = http://127.0.0.1:54321`. **[F]**
- `resolveLocalEnv()` ignora `process.env` quando a URL não é local; o `.env` tem
  `SUPABASE_URL` com ref `lzejdgfvtybarpbgwsyp` em domínio `*.supabase.co`, que
  **não** é aceito como local. **[F]**
- O `beforeAll` sobrescreve `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
  `APP_*` e `VITE_APP_*` para `127.0.0.1:54321` antes de importar
  `supabaseAdmin`, e aborta se a URL do storage admin não começar pela URL local. **[F]**
- `verifySupabaseBearer` é chamado com `{url, key}` locais explícitos. **[F]**
- O teste baixa apenas URLs assinadas/origens locais (`fetch(result.url)` e
  `${env.url}/...`). **[F]**

**Riscos residuais de alcance remoto:**

1. **Cache de módulo:** `supabaseAdmin` é um `Proxy` com inicialização lazy e cache
   global do processo. Se o mesmo processo `bun test` já tiver inicializado o
   cliente com env remoto, o import no teste reutilizaria a instância cacheada. O
   teste mitiga com a checagem da URL do storage admin, que **aborta** se não for
   local. Ainda assim, recomenda-se executar **somente esse arquivo**, em processo
   isolado. **[F]/[I]**
2. **`import.meta.env`:** `readPublicSupabaseEnv()` lê `import.meta.env`; em teste
   server-side o caminho usado não chama `resolveServerSupabasePublicConfig`, mas
   uma futura variante de navegador precisaria de env local explícito. **[I]**
3. **`.env` com URLs hospedadas:** o helper as rejeita por não serem
   `127.0.0.1`/`localhost`, mas o `.env` **não deve ser alterado**. **[F]**

Conclusão: **não há caminho remoto previsto no fluxo do teste**, desde que
executado isoladamente e com a checagem de URL local ativa. **[F]/[I]**

---

## 7. Estratégia de snapshot sugerida (não executada)

### 7.1 Princípio

Cobrir **três camadas** de forma consistente:

1. **PostgreSQL** — dump lógico completo da database `postgres` (schema + dados),
   incluindo `auth`, `public`, `storage`, `private`, `supabase_migrations`,
   extensões e ACLs.
2. **Storage de arquivos** — tar do diretório `/mnt/stub/stub` (backend `file`).
3. **Manifesto de estado** — valores explícitos de bucket/policies/guard/migrations
   e hashes dos arquivos, para verificação independente do dump.

### 7.2 Pré-condição de consistência

- Quiescer escritores do app (nenhum servidor `vite`/`bun dev` escutando; nenhuma
  conexão de aplicação ativa). **[F]** para o estado atual; confirmar na janela.
- Idealmente, tirar o dump e o tar na mesma janela sem escritas, para que
  `storage.objects` (dump) e arquivos (tar) correspondam. **[I]**
- Não é necessário parar containers para o `pg_dump`: ele produz um snapshot
  consistente via MVCC. **[F]** (ferramenta disponível: `pg_dump 17.6`).
- O backend de storage é `file`; não há snapshot atômico nativo. A consistência
  vem da quiescência + verificação cruzada. **[F]/[I]**

### 7.3 Artefatos propostos

| Artefato | Origem | Conteúdo |
| --- | --- | --- |
| `db.dump` | `docker exec ... pg_dump -Fc` | database `postgres` completa |
| `globals.sql` (opcional) | `pg_dumpall --globals-only` | roles/ACL do cluster (sensível) |
| `storage.tar.gz` | `docker exec ... tar -C /mnt -cf - stub` | arquivos dos buckets |
| `state.sql.txt` | consultas `SELECT` | bucket flags, policies, guard, migrations |
| `storage-manifest.sha256` | `sha256sum` dos arquivos | hashes por arquivo |
| `SHA256SUMS` | `sha256sum` dos artefatos | integridade do backup |

- Tamanho estimado: banco `18 MB`; storage `252 KB`; dump comprimido deve ficar na
  ordem de poucos MB. Espaço livre atual `30 GB` é suficiente. **[F]/[I]**
- **Local:** diretório fora do repositório, com permissão `0700` (ex.:
  `/tmp/opencode/g4-27e-backup-<timestamp>/` apenas para a janela; para retenção,
  usar caminho dedicado fora do repo). **Não commitar** — o dump contém e-mails,
  hashes de senha, sessões e metadados de storage. **[F]**
- `pg_dump` deve ser executado **dentro do container**
  `supabase_db_lzejdgfvtybarpbgwsyp` (o host não tem `psql`, e o CLI resolveria o
  `project_id` errado). **[F]**

### 7.4 Limitações do snapshot

- É **lógico**, não físico: não captura WAL, configuração do cluster, roles
  customizadas fora do dump (por isso o `globals.sql` opcional) nem o estado de
  conexões. **[F]/[I]**
- `pg_dump` não bloqueia escritas; escritas concorrentes após o início do dump não
  entram no backup. Por isso a quiescência é obrigatória. **[F]**
- O tar do storage não é atômico; arquivos podem mudar durante a leitura. A
  verificação cruzada com `storage.objects` e o manifesto por hash detecta. **[I]**
- `/tmp` pode ser limpo; para retenção, usar local durável. **[F]**
- O dump contém segredos/dados sensíveis; não deve ser incluído em relatórios,
  chats ou commits. **[F]**

---

## 8. Estratégia de restauração e verificação

### 8.1 Camada 1 — rollback pontual (preferencial)

O próprio E2E executa, no `afterAll`:

1. `cleanupAvatarFixture` — remove os 2 arquivos, `profile_private`, `profiles` e
   `auth.users` dos usuários de teste. **[F]**
2. `restoreLocalAvatarBucket` — remove o guard, restaura `avatars.public` e
   recria a policy `Avatars public read` a partir do snapshot. **[F]**

Depois, uma verificação **independente** deve comparar com o manifesto prévio:

- `auth.users`/`profiles`/`profile_private` voltam a `840`; `connections` a `228`;
  `storage.objects` a `2`. **[F]** (valores prévios)
- Nenhum usuário `g4-27e-%@local.test`. **[F]**
- `avatars.public = true`; policy `Avatars public read` presente com a mesma
  definição; guard ausente. **[F]**
- `supabase_migrations` continua `13` / última `20260925030806`. **[F]**
- 2 arquivos de storage; hash agregado igual a
  `44b7380695f78367fa10da3954775d121e78856cb794bee29bf6b12650b9591c`. **[F]**

**Limitações do rollback pontual:**

- O snapshot do helper é mantido **em memória** e só é atribuído ao chamador se
  `privatizeLocalAvatarBucket` retornar com sucesso. Se o processo morrer
  (`SIGKILL`) ou falhar entre o `commit` da migration e o retorno, o `afterAll`
  pode não restaurar. **[F]**
- O restore não cobre ACL do guard (irrelevante hoje, pois ele não existe). **[F]**
- A limpeza de usuários pode falhar se surgirem FKs `RESTRICT` inesperadas; para
  usuários novos isso não é esperado. **[I]**

### 8.2 Camada 2 — rollback pontual manual

Se o `afterAll` não restaurar, executar um roteiro SQL derivado do manifesto
prévio (com autorização):

- remover objetos/linhas remanescentes do fixture;
- `UPDATE storage.buckets SET public = true WHERE id='avatars'`;
- recriar a policy pública com `qual = (bucket_id = 'avatars'::text)`, `SELECT`,
  roles `{public}`;
- `DROP FUNCTION IF EXISTS private.g4_26b_is_canonical_avatar_path(text)`.

Esse roteiro deve ser **gerado a partir do estado capturado**, não digitado de
memória. **[F]/[I]**

### 8.3 Camada 3 — restore total (contingência, autorização separada)

Só se as camadas 1–2 falharem. Duas opções, ambas **destrutivas** e fora do escopo
desta etapa:

| Opção | Como | Risco |
| --- | --- | --- |
| A. `pg_restore --clean --if-exists` no database `postgres` | online, requer encerrar conexões | alto: drop/recreate de objetos, falhas de dependência/ACL |
| B. Parar containers, substituir o volume do DB por uma cópia restaurada e restaurar arquivos de storage, depois iniciar | controle total | requer `docker stop/start` (proibido nesta etapa) e janela autorizada |

Para o escopo do E2E, a **Camada 1 é suficiente** na maioria dos cenários; a
Camada 3 existe apenas como contingência. **[I]**

### 8.4 Como verificar que o snapshot é restaurável **sem** arriscar os originais

1. `pg_restore --list db.dump` — valida o TOC do dump. **[F]** (ferramenta 17.6)
2. **Restore em database descartável:** criar `g4_27e_verify_<timestamp>` no
   **mesmo** PostgreSQL local, rodar `pg_restore -d g4_27e_verify_... db.dump` e
   comparar:
   - contagens de `auth.users`, `profiles`, `profile_private`, `connections`,
     `storage.objects`;
   - `storage.buckets` (flags), policies de avatar, guard, migrations;
   - `pg_restore` exit code `0`.
   Depois, `DROP DATABASE g4_27e_verify_...`. Isso **escreve** apenas no database
   descartável, nunca no `postgres` original. **[I]** (requer autorização de
   execução; não feito agora).
3. **Restore do storage em diretório descartável:** extrair `storage.tar.gz` em
   `/tmp/opencode/g4-27e-storage-verify/` e comparar o manifesto SHA-256 com
   `storage-manifest.sha256`; remover o diretório. Não tocar em `/mnt`. **[I]**
4. Só considerar o snapshot **restaurável** se os passos 1–3 passarem. Um arquivo
   criado com sucesso **não** é prova de restore. **[F]**

### 8.5 Verificação pós-restore no ambiente real

Comparar o manifesto pré e pós:

- contagens exatas das tabelas afetadas e das 840 linhas de base;
- flags/policies/guard/migrations;
- hash agregado do storage;
- ausência de usuários/objetos de fixture;
- `git status`/HEAD inalterados (sem commits).

Se qualquer item divergir, **não** declarar restaurado: executar a Camada 2 e, se
necessário, a Camada 3 com autorização separada. **[F]**

---

## 9. Riscos identificados

| # | Risco | Severidade | Mitigação |
| --- | --- | --- | --- |
| R-01 | Perda de escritas concorrentes após o dump | Alta | quiescência + verificação de atividade + janela curta |
| R-02 | `afterAll` não executar (kill/crash) e bucket ficar privado | Média | backup externo + runbook manual (Camada 2) |
| R-03 | Falha de limpeza deixar 2 usuários/objetos | Baixa/Média | verificação de ausência + rollback manual |
| R-04 | `supabaseAdmin` cacheado apontar para remoto | Média | executar arquivo isolado + guard de URL local |
| R-05 | CLI resolver `project_id` errado | Média | usar somente Docker + `pg_dump`/`pg_restore` |
| R-06 | `config.toml` tem `avatars.public=true`; um restart recriaria público | Baixa | não usar `supabase start/stop`; restore explícito |
| R-07 | Restore total destrutivo (`--clean`) apagar dados | Alta | só com autorização separada; preferir Camadas 1–2 |
| R-08 | Dump contém dados sensíveis | Alta (privacidade) | diretório `0700` fora do repo; não commitar/imprimir |
| R-09 | Divergência storage DB ↔ arquivos | Média | quiescência + manifesto/hash + verificação cruzada |
| R-10 | Snapshot do guard não preserva ACL | Baixa | hoje guard ausente; documentar para o futuro |
| R-11 | `pg_restore` em scratch falhar por extensões/ACL | Média | validar antes; ajustar flags (`--no-owner` etc.) ou abortar |
| R-12 | C-06/C-08 alterados por engano | Baixa | não tocar; revisar diff final |

---

## 10. Pré-requisitos e critérios de abortar

### 10.1 Pré-requisitos

1. **Autorização explícita** para cada estágio (backup read-only, restore em
   database descartável, execução do E2E, rollback/restore).
2. Confirmar que o alvo é **somente** `127.0.0.1:54321/54322`; nenhuma URL
   hospedada. **[F]**
3. Quiescência: nenhum dev server/app escrevendo; `pg_stat_activity` sem clientes
   de aplicação. **[F]** no estado atual.
4. Diretório de backup fora do repo, `0700`, com espaço (atual `30G`). **[F]**
5. Registrar `git status`/HEAD antes e depois (baseline atual: 311 entradas,
   HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`). **[F]**
6. Não usar CLI `supabase` para DB; usar Docker. **[F]**
7. Não alterar `.env`, `config.toml`, C-06/C-08. **[F]**

### 10.2 Critérios de abortar

- Qualquer endpoint não local detectado. **[F]**
- Escritor ativo não quiescível durante o backup. **[F]**
- Falha em `pg_dump`, `tar`, `pg_restore --list`, restore em scratch ou divergência
  de hash/contagem. **[F]**
- Espaço livre abaixo de um limiar seguro (ex.: `< 2 GB`). **[F]**
- Estado prévio diferente do esperado (guard presente, bucket não público, policy
  diferente, contagens divergentes, migrations ≠ 13). **[F]**
- Qualquer sinal de acesso remoto (URL/host fora de loopback, credenciais
  remotas). **[F]**
- Qualquer necessidade de `supabase start/stop/db reset` antes de autorização
  específica. **[F]**
- Alteração inesperada de arquivos rastreados/preexistentes. **[F]**

---

## 11. Plano de execução proposto (NÃO executado)

| Etapa | Ação | Altera estado? | Gate |
| --- | --- | --- | --- |
| 0 | Aprovação humana deste relatório | não | autorização |
| 1 | Revalidar ambiente read-only (containers, volumes, DB, git) | não | — |
| 2 | Confirmar quiescência (`pg_stat_activity`, portas) | não | abortar se houver escritor |
| 3 | Criar diretório de backup `0700` fora do repo | sim (host) | autorização |
| 4 | `pg_dump -Fc` do database `postgres` via `docker exec` | leitura | — |
| 5 | (Opcional) `pg_dumpall --globals-only` | leitura | — |
| 6 | `tar` do storage `/mnt/stub/stub` via `docker exec` | leitura | — |
| 7 | Gerar manifesto de estado + hashes + `SHA256SUMS` | sim (host) | — |
| 8 | Verificar dump (`pg_restore --list`) e tar (`tar -tzf`) | não | abortar se falhar |
| 9 | Restore em database descartável + storage scratch e comparar | sim (scratch) | autorização específica |
| 10 | Revalidar que o ambiente original não mudou | não | abortar se mudou |
| 11 | Executar **somente** `bun test tests/avatar-media-e2e-local-g4-27e.test.ts` | sim (local) | autorização específica |
| 12 | Verificação pós-E2E independente (contagens/policies/guard/hashes) | leitura | — |
| 13 | Se necessário, rollback pontual manual (Camada 2) | sim (local) | autorização |
| 14 | Se necessário, restore total (Camada 3) | sim (destrutivo) | autorização separada |
| 15 | Atualizar relatório com evidências reais | não | — |

Comandos exemplificativos (forma, **não executados**):

```bash
# DB dump (streaming para host, dentro do container correto)
docker exec supabase_db_lzejdgfvtybarpbgwsyp pg_dump -U postgres -d postgres -Fc > db.dump

# Storage tar (somente leitura do volume)
docker exec supabase_storage_lzejdgfvtybarpbgwsyp tar -C /mnt -cf - stub | gzip > storage.tar.gz

# Verificações
pg_restore --list db.dump
tar -tzf storage.tar.gz
sha256sum db.dump storage.tar.gz > SHA256SUMS
```

> O `pg_restore`/`createdb`/E2E **não** estão autorizados por este documento.

---

## 12. Veredito

**APTO COM RESSALVAS.**

Há um caminho tecnicamente viável e verificável para snapshot/restore local:

- `pg_dump`/`pg_restore` 17.6 disponíveis dentro do container; banco de `18 MB`;
- storage em backend `file`, volume `supabase_storage_lzejdgfvtybarpbgwsyp`;
- rollback pontual já implementado no helper do teste;
- plano de verificação independente (manifesto + restore em scratch) definido;
- espaço em disco suficiente e ambiente sem escritores de app no momento.

As ressalvas que impedem classificá-la como “apta sem condições”:

1. Existem **840 usuários/perfis** e 228 conexões locais — dados não descartáveis;
   o backup completo e a verificação de restore são obrigatórios.
2. **Não há script de backup/restore no repositório**; o procedimento precisa ser
   executado manualmente e com autorização.
3. O restore total é **destrutivo** e exige parada de containers ou
   `pg_restore --clean`, ambos fora do escopo atual.
4. O `afterAll` pode não restaurar em caso de kill/crash; é necessário runbook
   manual e backup externo.
5. Persiste o risco residual de cache de módulo/`import.meta.env` alcançar o
   remoto, mitigado pelo guard de URL local e execução isolada.
6. A divergência de `project_id` proíbe o uso do CLI para backup/restore.

**Nenhuma etapa do plano foi executada.** A execução permanece bloqueada até
autorização explícita do usuário, estágio por estágio.
