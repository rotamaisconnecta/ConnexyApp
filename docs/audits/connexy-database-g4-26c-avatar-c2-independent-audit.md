# G4.26C — Auditoria independente pós-G4.26B (preparação C2 de avatares)

> Fase: **G4.26C** — auditoria **estritamente local, somente leitura**. Nenhuma
> operação remota, migration aplicada, backfill, alteração de bucket/policy/grant,
> flag, dependência, `.env` ou segredo foi executada.
> Branch: `backup/connexy-snapshot-2026-10-02` — HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (inalterados).
> A revisão inspecionou o código diretamente; os relatórios G4.25/G4.26A/G4.26B foram
> usados como **contexto**, não como prova substituta.

Regra de evidência: **[F]** = fato verificado no arquivo local; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## A. Escopo e método

Verificações executadas (todas offline): leitura de código/migrations/testes,
`diff` textual da RPC nova contra a vigente, port em Node da lógica do guard SQL
(`/tmp` descartável, sem tocar no repositório), execução dos testes locais de
avatar, `tsc --noEmit`, `eslint` de escopo e checagem de `git status`. Nenhum
arquivo do repositório foi alterado nesta passagem.

---

## B. Baseline e preservação de trabalho

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** |
| `git status --porcelain` no início | **297** entradas **[F]** |
| `git status --porcelain` ao final | **297** entradas (inalterado) **[F]** |

- **Achado INFORMATIVO (C-01):** a contagem é 297, não 296 como no encerramento do
  G4.26B — porque o **próprio relatório G4.26B** foi criado como untracked ao fim
  daquela fase, somando +1. O relatório G4.26B diz "296" (sem contar a si mesmo);
  é apenas contagem histórica, não discrepância.
- **Achado INFORMATIVO (C-02):** `git diff` (vs. HEAD) em `src/routes/completar-perfil.tsx`
  mostra, no lado removido, `createSignedUrl(path, 60*60*24*365*5)` (URL assinada de
  5 anos). Isso é o estado do **HEAD**, não do início do G4.26B: as fases não
  commitadas (G4.20) já haviam trocado a assinatura por `getPublicUrl` antes do
  G4.26B trocar por caminho canônico. Nenhum trabalho foi perdido; é acúmulo de
  fases untracked. **[F]**
- **Achado INFORMATIVO (C-03):** `supabase/config.toml` aparece como `M`, mas a
  mudança é **pré-existente** (`project_id` `lzejdgfvtybarpbgwsyp` → `rsukwuqocgjmwwuwtqaf`),
  já registrada no G4.25 §B, **não** introduzida por esta linha de trabalho. **[F]**

---

## C. Achados

### C-04 — [MÉDIO] Nenhum teste prova a semântica SQL do guard em runtime

- **Arquivo/linha:** `supabase/migrations/20261020120000_g4_26b_avatar_canonical_discovery_contract.sql:25-82`;
  `tests/avatar-canonical-contract-g4-26b.test.ts:93-127`.
- **Evidência [F]:** o teste da migration é **varredura estática de string**
  (`toContain`), não execução SQL. Não há banco local nos testes; portanto
  `private.g4_26b_is_canonical_avatar_path` nunca é *executada* em CI.
- **Impacto:** um erro sutil na regex/`string_to_array` do PL/pgSQL só apareceria
  ao aplicar no remoto. A lógica, porém, foi replicada em Node nesta auditoria e
  passou em 17/17 casos (traversal, `\`, `%2e`, segmento vazio, UUID inválido, sem
  extensão, dois pontos, URL pública, `data:`), o que reduz materialmente o risco.
- **Correção mínima sugerida:** adicionar um teste que rode o SQL num runtime
  isolado (ou um `pgTAP`/script opcional), **sem** conectar ao Supabase remoto, ao
  aplicar a migration.

### C-05 — [MÉDIO] Guard SQL valida formato, não vínculo de dono com a linha

- **Arquivo/linha:** migration `:147` (`private.g4_26b_is_canonical_avatar_path(s.photo_url)`).
- **Evidência [F]:** o guard só verifica que o 1º segmento é um UUID, **não** que
  ele é igual a `s.id`. A TS `validateMediaPath` idem (não compara com owner);
  quem compara dono é o **serviço** (`avatar-media-authorization.server.ts:56`,
  `validation.ownerId !== profile.id`).
- **Impacto:** se `profiles.photo_url` contivesse o caminho de **outro** dono, a RPC
  o devolveria como não-nulo. **Não há escalada de leitura:** o componente
  (`authenticated-avatar-image.tsx:51`) ignora `legacyUrl` quando `profileId` é UUID
  e resolve pelo endpoint, que re-lê a linha sob RLS e rejeita dono divergente
  (`:56`) → `unavailable`. Ainda assim, o contrato "canônico" do RPC é mais fraco
  do que sugere o relatório G4.26B ("caminho canônico" sem qualificar dono).
- **Correção mínima sugerida:** no SQL, exigir
  `split_part(btrim(s.photo_url), '/', 1) = s.id::text` além do formato; ou
  documentar explicitamente que a vínculo de dono é responsabilidade do serviço.

### C-06 — [BAIXO] Guard SQL aceita extensões arbitrárias alfanuméricas

- **Arquivo/linha:** migration `:75-78` (`v_ext ~ '^[a-z0-9]{1,8}$'`).
- **Evidência [F]:** aceita `.php`, `.txt`, etc. A TS `validateMediaPath`
  (`media-path.ts:24,82`) tem a mesma regra. O bucket `avatars` restringe
  `allowed_mime_types` a jpg/png/webp na **escrita**, então objetos estranhos não
  deveriam existir.
- **Impacto:** apenas classificatório; não permite leitura indevida (assinatura
  exige objeto existente e bucket `avatars`). Consistente com o cliente.
- **Correção mínima sugerida:** nenhuma obrigatória; opcionalmente alinhar as duas
  listas de extensão a `jpg|jpeg|png|webp`.

### C-07 — [BAIXO] `extractStoragePathFromUrl` não valida o path extraído de URL

- **Arquivo/linha:** `src/services/upload.service.ts:52-75`.
- **Evidência [F]:** para entrada canônica, valida com `validateMediaPath`; para
  **URL pública**, apenas fatia a string após `/object/public/<bucket>/` e
  devolve o resto **sem** revalidar traversal/segmentos. Um `photo_url` hostil (que
  não deveria existir) poderia produzir um path estranho usado em
  `UploadService.deleteFile(BUCKETS.avatars, [oldPath])`
  (`bio-avatar.tsx:132,158`).
- **Impacto:** baixo. A remoção usa `StorageHelper.remove` →
  `supabase.storage.from("avatars").remove(...)` (`storage.ts:12-14`), cliente
  **sob RLS**; a policy `"Avatars owner delete"` (`20260825025843_...sql:14-16`)
  confina DELETE à pasta do próprio `auth.uid()`. Não é possível excluir objeto de
  outro dono. Além disso, o único chamador opera sobre o **próprio** perfil.
- **Correção mínima sugerida:** aplicar `validateMediaPath` também ao path extraído
  de URL, devolvendo `null` se inválido (defesa em profundidade).

### C-08 — [BAIXO] Adaptadores/repositório passam `photo_url` sem validar formato

- **Arquivo/linha:** `src/lib/adapters/schema-a/profile.ts:106,124`;
  `src/repositories/profile.repository.ts:13-24` → `src/lib/profile/profile-update.ts:57-95`.
- **Evidência [F]:** `toRemoteProfileInsert/Update` gravam `profile.photo`
  diretamente; `buildProfileUpdatePatch` não valida formato de `photo_url` (só
  `name`/`handle`). A única guarda é `isLocalMediaUrl` (`schema-a-profile.ts:150-151`),
  que remove valores `blob:`/`data:`.
- **Impacto:** um caller futuro poderia persistir URL pública/externa. Como a RPC
  normaliza não-canônico para `NULL` (após aplicação) e o serviço valida dono, não
  há vazamento — apenas inconsistência de dados. O tool MCP `update_my_profile`
  **não** expõe `photo_url` (`update-my-profile.ts:31-39`), então não é vetor hoje.
- **Correção mínima sugerida:** validar `photo_url` com `validateMediaPath` (ou
  classificar via `classifyAvatarRef`) nos adaptadores de escrita, rejeitando
  formatos não canônicos.

### C-09 — [INFORMATIVO] Escritores ativos remanescentes de URL pública são de outros buckets

- **Arquivo/linha:** `src/components/bio/bio-posts.tsx:45,133` (`getPublicUrl` de
  `bio-media`); `src/services/upload.service.ts:78-90,116-119` (`uploadMedia`/
  `getPublicUrl` para mídia de posts).
- **Evidência [F]:** nenhum escritor ativo de **avatar** persiste URL pública. Os
  escritores de avatar são `bio-avatar.tsx:126` (caminho canônico), 
  `completar-perfil.tsx:253` (ramo legado, caminho canônico) e
  `completar-perfil.tsx:206,217` (ramo Schema A, caminho canônico, gated OFF), além
  de `bio-avatar.tsx:153` (`null`).
- **Impacto:** `bio-media`/`reels-media` são contratos distintos (fora do escopo C2).
- **Correção mínima sugerida:** nenhuma nesta linha; registrar que a higiene de
  `/object/public/` para `bio-media` é escopo G4.19 Etapa 9.

### C-10 — [INFORMATIVO] Privilégios do guard `private.*` são coerentes

- **Arquivo/linha:** migration `:84-85` (`revoke all ... from public, anon, authenticated`);
  `20260925030806_schema_a_core.sql:11-13` (`create schema private; revoke all ...; grant usage ... to postgres, service_role, authenticated`).
- **Evidência [F]:** o guard é chamado **apenas** de dentro de `get_nearby_profiles`,
  que é `security definer` (`:99`). Nesse contexto a execução ocorre com os
  privilégios do **dono** da função (papel de migração, que possui o objeto e o
  `USAGE` em `private`), independentemente do `revoke` para `authenticated` — logo o
  RPC **não** quebra. O guard é `immutable`, `set search_path = ''`, sem acesso a
  tabela/`auth.uid()`/I/O — não necessita `security definer`. **Não se presume que
  `private` garante segurança por si:** a proteção real aqui é o `revoke` explícito
  e o fato de a função ser pura.
- **Risco [I]:** se o objeto for re-`create or replace` por outro papel que não o
  dono do RPC, ou se houver `ALTER FUNCTION ... SECURITY DEFINER` por terceiros, a
  superfície mudaria. Não observado no repositório.
- **Correção mínima sugerida:** nenhuma. Opcional: documentar o dono esperado e
  fixar `alter function ... owner to` se o pipeline permitir.

### C-11 — [INFORMATIVO] RPC reescrita é idêntica exceto pela projeção de `photo_url`

- **Arquivo/linha:** `20260925030806_schema_a_core.sql:668-739` (vigente) vs.
  migration nova `:89-163`.
- **Evidência [F]:** `diff` textual do corpo das duas funções produz **uma única
  diferença** — a linha de projeção (`photo_url` bruto → `CASE ... guard ... else null`).
  Filtros (`is_blocked_between`, `are_connected`, `connection_requests`), joins,
  `normalized`/`scored`, ordenação (`order by s.km, s.id`), paginação
  (`limit least(...)`) e os demais campos (`compatibility_score`, `proximity_tier`,
  `distance_km`) permanecem **byte a byte** iguais. `returns table` também é
  idêntico. Grants mantidos (`revoke ... public, anon`; `grant ... authenticated`).
- **Impacto:** compatibilidade preservada; consumidores legados não quebram por
  assinatura.
- **Correção mínima sugerida:** nenhuma.

### C-12 — [INFORMATIVO] Consumidores da RPC não renderizam `photo_url` diretamente

- **Arquivo/linha:** `_app.pessoas.tsx:100`, `_app.connecta.tsx:179`,
  `_app/discover.tsx:152,451-457`, `nearby-map-item-card.tsx:56-61`,
  `people-list*.tsx`, `person-card.tsx`.
- **Evidência [F]:** os itens de tipo `pessoas` são sempre renderizados via
  `AuthenticatedAvatarImage` (resolução por `p.id` UUID). O `<img src={item.photo}>`
  de `_app/discover.tsx:458-463` só se aplica a `eventos/negocios/locais`
  (`p.cover`/`event.photo`/`business.cover`) — mídia não-avatar. Nenhuma rota contém
  `src={...photo_url}`.
- **Impacto:** com a RPC devolvendo `NULL` para legado não-canônico, a UI cai no
  resolvedor por `profileId`; sem regressão. **Antes do backfill**, perfis com URL
  pública persistida deixariam de ter `legacyUrl`, mas continuam resolvendo pelo
  endpoint.
- **Correção mínima sugerida:** nenhuma.

### C-13 — [INFORMATIVO] Compatibilidade de leitura e fail-closed preservados

- **Arquivo/linha:** `authenticated-avatar-image.tsx:24-52`;
  `avatar-media-authorization.server.ts:30-71`; `avatar-media.functions.ts:7,17-35`.
- **Evidência [F]:** `shouldResolve` exige `UUID_RE.test(profileId) && !isLocalPreview`;
  em falha/obsolescência/`catch` o componente faz `setResolvedUrl(null)` e renderiza
  `fallback` — **nunca** uma URL pública. Para canônico, `legacyUrl` não é usado como
  `src` (linha 51 escolhe `resolvedUrl`). O endpoint aceita **apenas**
  `{ profileId: uuid }`; o serviço re-lê `photo_url` sob RLS e valida
  bucket/dono/path antes de assinar com TTL 180 s. Testes G4.23 confirmam: público/
  assinado expirado re-assinados, dono estrangeiro `unavailable`, anônimo `forbidden`.
- **Impacto:** defesa em profundidade intacta.
- **Correção mínima sugerida:** nenhuma.

### C-14 — [INFORMATIVO] Sem alteração de bucket/RLS/grants/flag/deps/segredos

- **Arquivo/linha:** migration nova (nenhuma ocorrência de `storage.buckets`,
  `create policy`, `insert into storage`, `update public.profiles`); 
  `media-url-flag.ts:8` (flag só liga com `=== "true"`, ausente em `.env.example`).
- **Evidência [F]:** a migration contém apenas o guard e a RPC. `config.toml`
  (bucket público) **não** foi alterado por esta linha (C-03). Nenhum `.env`/`.env.local`
  tocado; `package.json`/`bun.lock` alterados são pré-existentes (baseline), não
  desta fase.
- **Correção mínima sugerida:** nenhuma.

---

## D. Verificações obrigatórias — resultado por item

1. **Branch/HEAD/alterações preexistentes:** confirmados; 297 entradas antes e
   depois; nada descartado/sobrescrito. **[F]** (`C-01`, `C-02`, `C-03`).
2. **Validação canônica rejeita formatos ruins:** sim — TS (`validateMediaPath` +
   `classifyAvatarRef`) e SQL (port testado: 17/17 casos: URL, malformado,
   traversal, `\`, `%2e`, UUID inválido, dono estrangeiro). **[F]** (`C-05`, `C-06`).
3. **RPC retorna `NULL` para não-canônico sem alterar o resto:** sim — `diff` de
   corpo = 1 hunk (projeção). Filtros/ordenação/paginação/permissões intactos. **[F]** (`C-11`).
4. **Segurança/compat do guard `private.*`:** coerente; puro, `immutable`,
   `search_path=''`, `revoke` explícito; chamado sob `security definer`. **[F]/[I]** (`C-10`).
5. **Interação RPC ↔ componente ↔ endpoint ↔ dono:** correta e fail-closed;
   `legacyUrl` canônico ignorado; validação de dono no serviço. **[F]** (`C-12`, `C-13`).
6. **`extractStoragePathFromUrl` legado + canônico:** correto; path de URL não
   revalidado (baixo, RLS contém). **[F]** (`C-07`).
7. **Escritores ativos que ainda geram URL pública:** nenhum de avatar; só
   `bio-media`/helpers (fora de escopo). **[F]** (`C-09`).
8. **Fail-closed sem fallback público:** confirmado. **[F]** (`C-13`).
9. **Testes/lacunas:** 49 pass / 0 fail nos 5 arquivos de avatar; lacunas = ausência
   de teste de runtime do SQL (C-04) e de vínculo de dono no guard (C-05). **[F]**
10. **Sem alteração de bucket/RLS/grants/backfill/flags/deps/segredos:** confirmado. **[F]** (`C-14`).

---

## E. Evidências de execução (read-only)

- `bun test tests/avatar-media-g4-21.test.ts tests/avatar-media-authorization-g4-23.test.ts tests/avatar-consumer-migration-g4-24.test.ts tests/completar-perfil-avatar-g4-20.test.ts tests/avatar-canonical-contract-g4-26b.test.ts`
  → **49 pass / 0 fail** (161 asserts).
- `node_modules/.bin/tsc --noEmit` → **exit 0**.
- `node_modules/.bin/eslint` (escopo: `upload.service.ts`, `bio-avatar.tsx`,
  `completar-perfil.tsx`, testes G4.20/G4.26B) → **exit 0**.
- `git status --porcelain | wc -l` → **297** (inalterado); HEAD/branch inalterados.
- Port em Node da lógica do guard SQL (arquivo descartável em `/tmp`) → 17/17 OK.

Nenhuma conexão/rede; nenhuma migration aplicada; nenhum arquivo do repositório alterado.

---

## F. Veredito

**APROVADA COM PENDÊNCIAS.**

A preparação do G4.26B está **correta e segura para planejar** a etapa remota de C2:

- Escritores ativos de avatar agora persistem **caminho canônico** validado; nenhum
  persiste URL pública de avatar.
- A RPC `get_nearby_profiles` foi reescrita com **uma única** mudança de projeção,
  preservando filtros, ordenação, paginação, permissões e demais campos; não entrega
  URL pública bruta.
- Leitura permanece fail-closed, resolvida server-side por `profileId`, com
  validação de dono — sem reabrir acesso público.
- Nenhum bucket/RLS/grant/flag/dependência/segredo foi alterado.

Pendências (não bloqueantes para **planejar** a etapa remota; apenas para execução):

| Ref | Severidade | Pendência |
| --- | --- | --- |
| C-04 | Médio | Falta teste de **runtime** da semântica SQL do guard (hoje só estático). |
| C-05 | Médio | Guard SQL valida formato, não vínculo `owner == s.id` (compensado pelo serviço). |
| C-06/C-07/C-08 | Baixo | Endurecimento de defesa em profundidade (extensões, path de URL, validação na escrita). |

Este veredito avalia **apenas a prontidão para planejar**; **não** autoriza a
execução remota nem significa que C2 esteja fechado. Nenhum defeito **crítico** ou
**alto** foi encontrado. C2 permanece **aberto** até a etapa remota autorizada.
