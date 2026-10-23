# G4.26D — Endurecimento local do C2 de avatares

> Fase **G4.26D** — endurecimento **estritamente local**. Nenhuma operação
> remota, migration aplicada, alteração de bucket/RLS/grant/policy, backfill,
> deploy, commit ou push. Nenhum `.env`, segredo, dependência ou flag alterado.
> Nenhum comando Git destrutivo.
>
> Relatório-base: `docs/audits/connexy-database-g4-26c-avatar-c2-independent-audit.md`.
> Contexto: G4.25, G4.26A, G4.26B.

Regra de evidência: **[F]** = verificado no arquivo/execução local; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## A. Estado inicial e alterações preexistentes

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** |
| `git status --porcelain` (baseline novo) | **298** entradas: 154 `??`, 4 `AM`, 1 `D`, 138 `M`, 1 `MM` **[F]** |

- **Baseline novo estabelecido** nesta passagem (não reutilizadas contagens
  históricas). O valor 298 inclui o relatório G4.26C como untracked.
- **Alterações preexistentes preservadas** — nenhum arquivo foi descartado,
  sobrescrito ou revertido. Destaques já conhecidos e **não** introduzidos aqui:
  - `supabase/config.toml` (`project_id` alterado) — pré-existente (G4.25 §B).
  - `src/routes/completar-perfil.tsx` — mudanças acumuladas das fases G4.20–G4.26B
    (untracked/`M`), preservadas.
  - `tests/persist-phase-1d-5-browser.test.ts` — modificação pré-existente, sem
    relação com avatar/upload. **[F]**
- **Nenhuma contagem histórica tratada como verdade absoluta:** o baseline 298 foi
  medido diretamente; o delta do endurecimento é contabilizado separadamente em §E.

---

## B. Evidência e tratamento de C-04 a C-08

### C-04 — [MÉDIO → RESOLVIDO] Cobertura de runtime da semântica SQL do guard

- **Antes:** o teste G4.26B era apenas varredura estática de string; a função
  `private.g4_26b_is_canonical_avatar_path` nunca era executada. **[F]**
- **Ambiente local descoberto:** container Docker `supabase_db_lzejdgfvtybarpbgwsyp`
  (PostgreSQL **17.6**, porta host **127.0.0.1:54322**, somente loopback),
  com o núcleo Schema A (`20260925030806`) aplicado e `private`/`storage` presentes. **[F]**
- **Execução real:** a **migration G4.26B real** (não uma cópia) foi carregada
  dentro de `BEGIN … ROLLBACK` e o matrix rodou contra o PostgreSQL local:
  - `38/38 PASS`, `0 FAIL`, `0 ERROR`. **[F]**
  - Após `ROLLBACK`: guard ausente (`count = 0`); migrações seguem **13**; última
    continua `20260925030806` → **nada persistido**. **[F]**
- **Cobertura do matrix** (`tests/sql/g4-26b-avatar-canonical-guard.sql`): canônico
  2-seg/3-seg; UUID inválido/curto/versão 0/9/variante c; caminho vazio/`NULL`/só
  espaços; URL HTTP/HTTPS/`data:`/`blob:`; barra inicial; traversal (`..` início/meio);
  backslash; octetos `%2e`/`%2f`; segmento vazio; extensões (`.jpg/.png/.webp/.jpeg`,
  maiúscula, `.php`, >8 chars, com hífen, dois pontos); **caracteres de controle
  `0x01`/`0x7f`**. **[F]**
- **Reprodutibilidade:** novo teste `tests/avatar-canonical-guard-sql-g4-26d.test.ts`
  descobre o container (env `G4_TEST_PSQL_CONTAINER` ou prefixo `supabase_db_`),
  roda a migration + matrix em transação revertida e afirma `0 FAIL` e rollback.
  Sem PostgreSQL local, o teste é **PULADO** (`skipIf`) — nunca aprovado em silêncio.
  Ver §D. **[F]**
- **Defeito de paridade revelado e corrigido (C-06 do corpo do guard):** ao executar
  o SQL real, o guard **aceitava** caracteres de controle (`b\x01.jpg`, `b\x7f.jpg`)
  enquanto o validador TS (`media-path.ts:66`) os rejeita. Corrigido adicionando ao
  guard `if v_value ~ '[\x00-\x1f\x7f]' then return false; end if;`
  (`20261020120000_...sql:60-62`). Matrix agora rejeita `0x01`/`0x7f`. **[F]**

### C-05 — [MÉDIO → RESOLVIDO SEM MUDANÇA DE CÓDIGO] Vínculo de proprietário

- **Cadeia inspecionada ponta a ponta:**
  1. RPC `get_nearby_profiles` (`...:146-148`) devolve `photo_url` canônico-ou-`NULL`.
  2. `AuthenticatedAvatarImage` (`authenticated-avatar-image.tsx:25,51`): com
     `profileId` UUID e `legacyUrl` não-local, **ignora** `legacyUrl` e resolve por
     `resolvedUrl` server-side; nunca renderiza o canônico bruto.
  3. Endpoint (`avatar-media.functions.ts`) aceita **somente** `{ profileId: uuid }`.
  4. Serviço (`avatar-media-authorization.server.ts:39,43,56`): relê a linha sob RLS,
     exige `profile.id === profileId`, classifica com `expectedOwnerId: profile.id` e
     **re-valida** `validation.ownerId !== profile.id` → `unavailable`.
- **Conclusão [F]:** um caminho pertencente a outro usuário **não** pode ser
  autorizado como avatar do perfil solicitado. A regra de dono **já existe no
  serviço**; não foi duplicada.
- **Regressão adicionada:** teste G4.26D em `avatar-media-authorization-g4-23.test.ts`
  prova que um caminho canônico de outro dono → `unavailable`, e que o mesmo caminho
  sob o dono real → `ready`; teste G4.24 fixa a seleção `src` do componente (canônico
  nunca usado como `src`). **[F]**
- **Política de produto do Modelo 2 inalterada.**

### C-06 — [BAIXO → PENDÊNCIA DOCUMENTADA] Extensões fora do contrato

- O guard aceita qualquer `^[a-z0-9]{1,8}$` após lowercase (`.php`, `.txt`, …),
  **igual** ao TS (`media-path.ts:24,82`). **[F]**
- **Não alterado:** restringir extensões é **decisão de contrato/formato de produto**;
  alinhar a uma allowlist poderia rejeitar extensões válidas já aceitas (`.jpeg`,
  `.gif`) sem evidência de que são inválidas. O bucket `avatars` já restringe
  `allowed_mime_types` na escrita. Mantido como pendência. **[F]**

### C-07 — [BAIXO → RESOLVIDO] `extractStoragePathFromUrl` não validava o path de URL

- **Antes:** `upload.service.ts:71` devolvia `rest.slice(slashIdx + 1)` **sem**
  revalidar (só o ramo canônico validava). **[F]**
- **Corrigido:** o path extraído de URL pública agora passa por `validateMediaPath`;
  malformado → `null` (`upload.service.ts:63-74`). Sem alterar a assinatura nem o
  comportamento para paths canônicos válidos. **[F]**
- **Regressão adicionada:** `completar-perfil-avatar-g4-20.test.ts` (novo `describe`
  G4.26D) prova rejeição de `../../etc/passwd.jpg`, UUID inválido, sem extensão e
  `%2e%2e`, e preserva a extração do canônico válido. **[F]**
- **Exclusão cross-owner:** `UploadService.deleteFile` → `StorageHelper.remove` usa o
  cliente sob RLS; a policy `"Avatars owner delete"` confina DELETE à pasta do
  `auth.uid()`. Um path hostil **não** exclui objeto de outro dono. **[F]**

### C-08 — [BAIXO → PENDÊNCIA DOCUMENTADA] `photo_url` sem validação na escrita

- `toRemoteProfileInsert/Update` (`adapters/schema-a/profile.ts:106,124`) e
  `buildProfileUpdatePatch` (`profile-update.ts:57-95`) repassam `photo_url` sem
  validar formato; só `isLocalMediaUrl` remove `blob:`/`data:` (`schema-a-profile.ts:150-151`). **[F]**
- **Não alterado:** rejeitar não-canônico na escrita é decisão de produto e pode
  quebrar fluxos legados/demo que persistem URL externa/legada legítima; a RPC já
  normaliza não-canônico para `NULL` e o serviço valida dono. Mantido como pendência
  com proposta de correção futura. **[F]**

---

## C. Testes executados e resultados reais

| Comando | Resultado |
| --- | --- |
| `bun test` dos 6 arquivos de avatar (G4.20/21/23/24/26B/26D) | **56 pass / 0 fail**, 178 asserts **[F]** |
| `bun test` — suíte completa | **1189 pass / 46 skip / 1 fail**, 5820 asserts **[F]** |
| `node_modules/.bin/tsc --noEmit` | **exit 0** **[F]** |
| `node_modules/.bin/eslint` (escopo alterado) | **exit 0** **[F]** |
| `node_modules/.bin/prettier --write` (arquivos tocados) | aplicado **[F]** |
| `git diff --check` | **exit 0** **[F]** |
| Matrix SQL do guard (PostgreSQL 17.6 local, rollback) | **38/38 PASS, 0 FAIL** **[F]** |

- **Única falha da suíte completa:** `tests/persist-phase-1d-5-browser.test.ts`.
  - **Não relacionada** a avatar/upload (sem referências a
    `upload.service`/`AuthenticatedAvatarImage`) **[F]**.
  - **Pré-existente** (aparece em `git diff`, 2 inserções, anterior ao G4.26D) **[F]**.
  - **Passa isoladamente** (`1 pass / 0 fail`); falha apenas sob carga paralela do
    navegador/IndexedDB → **flaky**, não regressão do endurecimento. **[F]**
- Amostras de saída do matrix:
  `37|control char 0x01 (rejeitado)|f|f|PASS`,
  `38|control char 0x7f (rejeitado)|f|f|PASS`.

---

## D. Limitações

- **D-01 — teste SQL requer PostgreSQL local:** `tests/avatar-canonical-guard-sql-g4-26d.test.ts`
  é **PULADO** quando nenhum container `supabase_db_*`/`G4_TEST_PSQL_CONTAINER`
  está disponível (ex.: CI sem Docker). Nesse caso, a semântica SQL do guard **não**
  é verificada em runtime e o teste **não** é declarado aprovado — apenas há a
  cobertura estática do G4.26B (pins de string). **[F]**
- **D-02 — execução via `docker exec`, não via `psql` host:** o host não possui
  `psql`/`supabase` CLI; o teste usa o binário dentro do container local. Sem impact.
- **D-03 — estado remoto desconhecido:** buckets/policies/grants/CDN aplicados no
  remoto não são verificáveis localmente. Fora do escopo desta fase. **[F]**
- **D-04 — C2 permanece ABERTO:** nenhum teste local fecha C2. O endurecimento reduz
  pendências para o **planejamento** remoto, não substitui a etapa remota. **[F]**

---

## E. Arquivos alterados e justificativa

| Arquivo | Mudança | Justificativa |
| --- | --- | --- |
| `supabase/migrations/20261020120000_g4_26b_avatar_canonical_discovery_contract.sql` | +4 linhas: rejeição de caracteres de controle no guard + comentário | C-04 (paridade SQL↔TS); migration **não aplicada**. **[F]** |
| `src/services/upload.service.ts` | +? : revalida o path extraído de URL legada | C-07 (defesa em profundidade). **[F]** |
| `tests/sql/g4-26b-avatar-canonical-guard.sql` | **novo** matrix executável (38 casos) | C-04 — artefato reproduzível para o runtime SQL. **[F]** |
| `tests/avatar-canonical-guard-sql-g4-26d.test.ts` | **novo** runner (rollback, skip-if-sem-PG) | C-04 — cobertura de runtime automatizada. **[F]** |
| `tests/completar-perfil-avatar-g4-20.test.ts` | +2 testes (describe G4.26D) | C-07 — regressão da extração de path. **[F]** |
| `tests/avatar-media-authorization-g4-23.test.ts` | +1 teste | C-05 — regressão de dono estrangeiro no serviço. **[F]** |
| `tests/avatar-consumer-migration-g4-24.test.ts` | +1 teste | C-05 — componente nunca renderiza canônico bruto. **[F]** |
| `tests/avatar-canonical-contract-g4-26b.test.ts` | +1 teste estático | C-04 — pin da regra de controle de caracteres (CI sem PG). **[F]** |

- **Não alterados por decisão:** `adapters/schema-a/profile.ts`,
  `profile-update.ts`, `schema-a-profile.ts` (C-08) e as listas de extensão (C-06) —
  ver §B. **[F]**
- `git status --porcelain`: **298 → 300** (apenas os 2 novos artefatos de teste;
  relatório G4.26D soma +1). Nenhum arquivo pré-existente foi perdido. **[F]**

---

## F. Confirmação de ausência de operações remotas

- **Nenhuma** chamada ao Supabase remoto (HTTP/auth/storage/DB). **[F]**
- **Nenhuma** migration aplicada: o guard foi criado e revertido em transação;
  `supabase_migrations.schema_migrations` permanece com **13** entradas e última
  `20260925030806`. **[F]**
- **Nenhuma** alteração de bucket, RLS, grants ou policies. **[F]**
- **Nenhum** backfill, rotação de URL, deploy, commit ou push. **[F]**
- **Nenhuma** alteração de `.env`/`.env.local`/segredos/dependências/flags. **[F]**
  `VITE_APP_SCHEMA_A_MEDIA_URL` continua OFF.
- **Nenhum** comando Git destrutivo (`reset`/`clean`/`checkout`/`restore`/`stash`/rebase).
  Foram usados apenas comandos de leitura. **[F]**
- O acesso a PostgreSQL ocorreu **exclusivamente** no container local
  (`127.0.0.1:54322`), conforme autorizado pela etapa. Nenhum segredo foi impresso
  (credenciais representadas como `[LOCAL_SECRET_REDACTED]`). **[F]**

---

## G. Pendências para a etapa de preparação remota

1. **C-02 (recomendações G4.26C já endereçadas):** C-04 e C-05 **resolvidos**; C-07
   **resolvido**; paridade de controle de caracteres **corrigida**.
2. **C-06 — contrato de extensões (decisão de produto):** definir se o guard deve
   restringir a `jpg|jpeg|png|webp` (alinhado ao bucket) ou manter `[a-z0-9]{1,8}`.
   Requer decisão antes de qualquer ajuste. **[F]**
3. **C-08 — validação na escrita (decisão de produto):** avaliar rejeição de
   `photo_url` não-canônico nos adaptadores sem quebrar formatos legados/demo. **[F]**
4. **Aplicação remota da migration `20261020120000`:** quando autorizada, incluir o
   novo teste SQL de runtime no pipeline (com PostgreSQL local/CI) e confirmar
   rollback/no-persistência. **[F]**
5. **Base para a privatização do bucket `avatars`:** o contrato RPC + resolução
   server-side já são fail-closed; falta apenas a etapa remota autorizada. **[F]**

---

## Veredito da fase

**C2 permanece ABERTO.** O endurecimento local resolveu **C-04, C-05 e C-07** e
corrigiu o defeito de paridade (caracteres de controle) revelado pelo teste de
runtime. **C-06 e C-08** foram deliberadamente mantidos como pendências por
envolverem decisões de produto/contrato. Nenhuma operação remota foi executada e
nenhum teste local fecha C2.

Aguarda-se **autorização explícita** para prosseguir — **nenhuma fase remota foi
iniciada**.
