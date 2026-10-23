# G4.26E — Consolidação C2 e plano de migração segura de avatares

> Fase **G4.26E** — consolidação e planejamento **estritamente local**. Nenhuma
> operação remota, migration aplicada, alteração de bucket/RLS/grant/policy,
> backfill, rotação de URL, deploy, commit ou push. Nenhum `.env`/`.env.local`,
> segredo, dependência ou flag alterado. Nenhum comando Git destrutivo.
> Nenhuma fase remota iniciada.
>
> Fontes: relatórios G4.25, G4.26A, G4.26B, G4.26C, G4.26D e verificação direta
> do código/migrations/testes.

Regra de evidência: **[F]** = verificado localmente; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## A. Baseline do Git e arquivos preservados

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** |
| `git status --porcelain` (entrada desta fase) | **301** entradas: 157 `??`, 4 `AM`, 1 `D`, 138 `M`, 1 `MM` **[F]** |

- Todas as alterações preexistentes (staged/unstaged/untracked) foram **preservadas**,
  incluindo `.env` (staged como removido), `.env.example`, `package.json`, `bun.lock`,
  `supabase/config.toml`, migrations e todo o trabalho G4.20–G4.26D. **[F]**
- Relatórios lidos: G4.25, G4.26A, G4.26B, G4.26C, G4.26D. **[F]**
- A única adição desta fase é este relatório (ver §J). Nenhum `reset`/`clean`/
  `checkout`/`restore`/`stash`/rebase/commit/push. **[F]**

**Correção factual herdada (registrada, não reeditada):** o G4.25 §D.3 dizia “24
consumidores”; o G4.26A corrigiu para **25**. A contagem direta desta fase confirma
**26 arquivos que usam `AuthenticatedAvatarImage`** = **25 consumidores** + o próprio
componente `authenticated-avatar-image.tsx`. **[F]**

---

## B. Estado consolidado de cada achado

### B.1 Escrita canônica nos escritores ativos **[F]**

| Escritor ativo | Persiste | Validação | Fonte |
| --- | --- | --- | --- |
| `bio-avatar.tsx` (salvar) | `photo_url: path` (canônico `{uid}/{uuid}.jpg`) | `validateMediaPath` + `ownerId === userId`; apaga upload recém-enviado se inválido | `bio-avatar.tsx:117-140` |
| `bio-avatar.tsx` (remover) | `photo_url: null` | remove objeto antigo via `extractStoragePathFromUrl` | `bio-avatar.tsx:153-162` |
| `completar-perfil.tsx` (ramo legado) | `photo_url = path` (canônico) | `validateMediaPath` + `ownerId !== user.id` → remove e aborta | `completar-perfil.tsx:248-253,262` |
| `completar-perfil.tsx` (ramo Schema A, **gated OFF**) | `photo: photoUrl = path` (canônico) | **sem** chamada a `validateMediaPath`/dono | `completar-perfil.tsx:195-206,217` |

- **Nenhum** escritor ativo usa `getPublicUrl` para avatar. **[F]**
- Nota: o ramo Schema A (`isRemoteProfileEnabled()` OFF) persiste canônico porém
  **sem** validação local de formato/dono; é a mesma lacuna preexistente de C-08
  (o `path` é montado como `${user.id}/...`, então o dono é correto por construção). **[F]**

### B.2 Contrato da RPC `get_nearby_profiles` **[F]**

- Migration dedicada: `supabase/migrations/20261020120000_g4_26b_avatar_canonical_discovery_contract.sql`. **[F]**
- **Assinatura preservada** (`p_radius_km`, `p_limit`; `returns table(... photo_url text ...)`). **[F]**
- `photo_url` projetada como caminho canônico **ou `NULL`**:
  `case when private.g4_26b_is_canonical_avatar_path(s.photo_url) then btrim(s.photo_url) else null end`. **[F]**
- Filtros, ordenação, paginação, permissões (`security definer`, `set search_path=''`) e
  os demais campos inalterados. Grants: `revoke execute ... public, anon`; `grant ... authenticated`. **[F]**
- **Não aplicada** — `supabase_migrations.schema_migrations` (local) segue com 13 entradas,
  última `20260925030806`; a G4.26B não está lá. **[F]**

### B.3 Segurança do guard SQL `private.g4_26b_is_canonical_avatar_path` **[F]**

- `language plpgsql`, `immutable`, `set search_path = ''`, sem `security definer`;
  `revoke all ... from public, anon, authenticated`. **[F]**
- Chamado **somente** de dentro da RPC `security definer` (executa como o dono → EXECUTE
  implícito). Puro: sem tabela, `auth.uid()`, I/O ou tempo. **[F]**
- Regras: rejeita scheme, barra inicial, `..`, `\`, octeto `%XX`, caractere de controle,
  segmento vazio; exige 1º segmento UUID e extensão `[a-z0-9]{1,8}`. **[F]**

### B.4 Paridade de validação SQL/TypeScript (caracteres de controle) **[F]**

- TS `validateMediaPath` rejeita caracteres de controle (`code <= 0x1f || 0x7f`) **desde antes**. **[F]**
- O guard SQL **não** rejeitava; a G4.26D adicionou
  `if v_value ~ '[\x00-\x1f\x7f]' then return false; end if;` (linha 61). **[F]**
- Verificado em runtime real (PostgreSQL 17.6 local, `BEGIN…ROLLBACK`): matrix de **38 casos,
  38 PASS / 0 FAIL**, incluindo `0x01`/`0x7f` rejeitados; nada persistido. **[F]**
- Cobertura automatizada: `tests/avatar-canonical-guard-sql-g4-26d.test.ts` + matrix
  `tests/sql/g4-26b-avatar-canonical-guard.sql`; **pulado** se não houver PG local. **[F]**

> Nota de paridade remanescente: ambos aceitam espaço interno (` b.jpg`) e extensões
> arbitrárias `[a-z0-9]{1,8}` (`.php`). É **decisão de contrato** (C-06), não defesa. **[F]**

### B.5 Validação de proprietário na cadeia RPC → componente → endpoint → serviço **[F]**

1. RPC devolve canônico-ou-`NULL`. **[F]**
2. `AuthenticatedAvatarImage` (`:25,51`): `profileId` UUID + `legacyUrl` não-local ⇒
   **ignora** `legacyUrl` e usa `resolvedUrl` server-side (nunca renderiza canônico bruto). **[F]**
3. Endpoint `avatar-media.functions.ts` aceita **somente** `{ profileId: uuid }`. **[F]**
4. Serviço (`avatar-media-authorization.server.ts:39,43,56`): relê a linha sob RLS, exige
   `profile.id === profileId`, classifica com `expectedOwnerId: profile.id` e revalida
   `validation.ownerId !== profile.id` → `unavailable`. **[F]**
- **Conclusão:** caminho de outro dono **não** pode ser autorizado. Regra existe **no serviço**;
  não duplicada. Regressões G4.26D confirmam. **[F]**

### B.6 Validação dos caminhos extraídos de URLs legadas (C-07) **[F]**

- `UploadService.extractStoragePathFromUrl` (`upload.service.ts:63-74`): canônico → valida
  `validateMediaPath`; URL pública → fatia após `/object/public/<bucket>/` e **revalida** o
  path; malformado → `null`. **[F]**
- Exclusão é RLS-bound (`StorageHelper.remove`), confinada ao owner-folder: path hostil **não**
  exclui objeto de terceiro. **[F]**

### B.7 Estado das pendências C-06 e C-08 **[F]**

- **C-06 (extensões/formatos):** inalterado. Guard e TS aceitam `[a-z0-9]{1,8}`; bucket
  `avatars` já restringe `allowed_mime_types` na escrita. **Aberto** (§G). **[F]**
- **C-08 (validação na escrita):** `toRemoteProfileInsert/Update`
  (`adapters/schema-a/profile.ts:106,124`) e `buildProfileUpdatePatch` repassam `photo_url`
  sem validar formato; só `isLocalMediaUrl` remove `blob:`/`data:`
  (`schema-a-profile.ts:150-151`). **Aberto** (§G). **[F]**

### B.8 Consumidores ativos e referências legadas **[F]**

- **25 consumidores** usam `AuthenticatedAvatarImage`; nenhum caminho de `profiles.photo_url`
  real chega a `<img>` cru. **[F]**
- Varredura independente de **todos** os `<img src={...photo}>` remanescentes (32 sites):
  **0** classificados como avatar real de risco; **20** demo/mock; **7** mídia não-avatar
  (capa de negócio/evento/local); **8** inalcançáveis (componentes sem importador). **[F]**
  - `_app/discover.tsx:460` é o ramo **não-`pessoas`** (capa de local/negócio/evento); o ramo
    `pessoas` (`:450-457`) usa o componente. **[F]**
- **Não declarar C2 concluído:** as verificações acima são **locais**. O estado remoto
  (buckets/policies/grants/CDN e conteúdo real de `photo_url`) é **desconhecido**. **[F]**

---

## C. Investigação da falha de `persist-phase-1d-5-browser.test.ts`

### C.1 Natureza do teste **[F]**

- Teste de navegador real: faz `Bun.spawnSync` de um bundle, sobe um `Bun.serve`, lança
  **Chrome headless** via CDP (`tests/helpers/cdp-browser.ts`), persiste em IndexedDB
  (`demo-db`), recarrega a página e re-instala o harness. **[F]**
- Ponto da falha reportada (`tests/persist-phase-1d-5-browser.test.ts:137`):
  `expect(recipient.inbox).toHaveLength(1)` — **após um `reload()`**. **[F]**

### C.2 Reprodução e resultados **[F]**

| Execução | Resultado |
| --- | --- |
| Teste isolado | **1 pass / 0 fail** |
| 4 arquivos + todos `1f-*`-browser + `1h-*`-browser juntos | **83 pass / 0 fail** |
| Suíte completa (G4.26D, 1ª vez) | 1 **fail** neste teste |
| Suíte completa (G4.26E) × **4 execuções** | **1190 pass / 0 fail** cada |
| Teste isolado sob 4× carga de CPU sintética | **1 pass / 0 fail** (mais lento: 2.93 s vs 1.72 s) |

- **Não é determinístico** e **não se reproduziu** em 4 suítes completas consecutivas. **[F]**
- O teste usa `port: 0` (efêmera) e `mkdtemp` por execução — sem colisão de porta/perfil. **[F]**
- Ambiente: **4 CPUs, 7.7 GiB RAM (≈1.6 GiB livres)**; **21 testes de navegador** lançam
  Chrome headless em paralelo. Contenção de recursos na fase de reload é a hipótese
  principal ([I]). **[F]**

### C.3 Prova de não-regressão por G4.26D **[F]**

- O arquivo é uma **modificação preexistente** (linha de `VITE_CONNEXY_DEMO`), presente em
  ~21 testes de navegador + fixtures do commit base `785dff3 atualizar` — **não** introduzido
  pela G4.26D. **[F]**
- O diff do arquivo **não** contém referências a avatar/upload/canonical/g4_26. **[F]**
- As dependências do teste (`demo-db`, `trip-store`, `presence-preference`, `roles-storage`)
  **não** intersectam nenhum arquivo alterado pela G4.26D
  (`src/services/upload.service.ts`, migration, testes de avatar). **[F]**

### C.4 Classificação **[F]**

**FLAKE AMBIENTAL (não determinístico), NÃO causado por G4.26D.** Mecânica provável [I]: corrida
entre a escrita assíncrona em IndexedDB e o `reload()` sob contenção de CPU — o `reload()`
aguarda `Page.loadEventFired` mas **não** a durabilidade da escrita iniciada por `invite()`.

### C.5 Ação **[F]**

- **Nenhuma alteração feita** no teste (não se altera teste só para passar). **[F]**
- Mantido **visível como pendência não classificada de causa-raiz** (§G), com proposta futura
  opcional (aguardar a durabilidade da escrita antes do reload / serializar os testes de
  navegador), a ser decidida fora do escopo local. **[F]**

---

## D. Inventário dos tipos de referência de avatar conhecidos no código

Classificação pelo resolvedor `classifyAvatarRef` (`src/lib/media/avatar-media.ts`) e pelos
escritores/extratores vigentes: **[F]**

| Tipo | Exemplo de forma | Classificação (`AvatarRef`) | Origem | Conversível com segurança? |
| --- | --- | --- | --- | --- |
| Canônico | `{uuid}/{uuid}.jpg` | `canonical` (render `null`; resolve via endpoint) | escritores atuais | Já canônico. **Sim** |
| URL pública | `.../object/public/avatars/{uuid}/...` | `storage-public` | legado (G4.20–G4.26B) | **Sim** — extrair path; owner = 1º segmento |
| URL assinada | `.../object/sign/avatars/{uuid}/...?token=...` | `storage-signed` | legado | **Sim**, se o path for determinável; token descartado |
| URL externa HTTP(S) | `https://images.../x.png` | `external` | demo/mocks | Não é Storage; **não migrar** |
| Local | `data:` / `blob:` | `local` | preview não persistido (bloqueado na escrita) | Não aplicável |
| Ausente | `NULL`/`` | `missing` | remoção | Não aplicável |
| Inválida/protocolo | `javascript:`, path malformado | `rejected` | lixo | Marcar; **não** converter |
| Bucket estrangeiro | `.../public/bio-media/...` | `rejected` (`storage-foreign-bucket`) | erro/legado | **Não** converter para avatar |

- **Regra de conversão [I]:** só converter para canônico quando o **primeiro segmento** do path
  for um **UUID determinável** e a extensão for válida. Sem dono determinável → **não** converter;
  a leitura continua via endpoint (que valida dono) e cai no fallback se não resolver.
- **Sem números reais:** o inventário de contagens por tipo depende de leitura remota autorizada
  (§I). Não se inventam contagens. **[F]**

---

## E. Plano de migração por etapas (NÃO executado)

> Invariante: **nenhuma restrição de bucket precede a cobertura de leitura** e nunca
> `public = true` no rollback; `VITE_APP_SCHEMA_A_MEDIA_URL` permanece OFF; não tocar
> `bio-media`/`reels-media`.

| # | Pré-condições (critério de entrada) | Operação | Critério de parada/abortar se | Rollback |
| --- | --- | --- | --- | --- |
| 1 | Autorização explícita p/ leitura; HEAD/branch confirmados | **Inventário remoto** agregado: formatos de `photo_url` + objetos de `avatars` (sem tokens/URLs completas) | Contagem por tipo não fecha 100% ou amostra ambígua | Descartar snapshot (nada alterado) |
| 2 | Step 1 concluído | **Aplicar a migration** `20261020120000` (guard + RPC canônica) na janela autorizada | Migration falha/health-check falha → parar (sem `--ignore-health-check`) | Reverter migration da RPC |
| 3 | RPC canônica aplicada | **Backfill determinístico**: PUB/SIGN → CANON quando owner determinável; marcar não conversíveis | Qualquer `photo_url` corrompido ou contagem divergente | Restaurar snapshot e reescrever |
| 4 | Backfill validado | **Confirmar cobertura dos leitores** (25 consumidores já usam o componente; revalidar scan) | Qualquer leitor real de `photo_url` fora do componente | Reverter wiring |
| 5 | Leitores cobertos | **Validação remota** R1–R11 (G4.25 §F.5) com `avatars` ainda público | `anon` ainda lê objeto após restrição, ou `ready` fora de [60,300] s | Reverter flag/consumidores primeiro |
| 6 | Validação aprovada | **Restringir bucket**: `public=false` + remover `"Avatars public read"`; SELECT mínimo autenticado | `<img>` deslogado quebra fora do esperado; cache/CDN inesperado | Restaurar **policy mínima**; jamais `public=true` |
| 7 | Bucket restrito | **Higiene**: rotacionar/descartar URL assinada de 5 anos; varrer `/object/public/` | Nova emissão de `/object/public/` detectada | Desligar flags; manter OFF |

- **Ponto de não-retorno:** Step 6 (`public=false`) — exige snapshot de `photo_url` e plano de
  reversão de policy **testado** antes. **[F]**

### E.1 Critérios de cobertura dos leitores (pré-privatização) **[F]**

1. 100% dos 25 consumidores usam `AuthenticatedAvatarImage` (verificado por scan). **[F]**
2. Zero `<img src={...profile.photo_url}>` cru em caminho de dado real (verificado: 0/32). **[F]**
3. Endpoint aceita só `profileId`; serviço valida dono/bucket/path. **[F]**

---

## F. Riscos: URLs públicas, URLs assinadas antigas e caches

- **URLs públicas já persistidas/compartilhadas [I]:** continuam servindo `anon` **enquanto** o
  bucket for público. Ao privatizar, deixam de servir `anon`, mas **não** são revogadas para quem
  já baixou. Backfill (Step 3) reduz a dependência; o resolvedor autenticado passa a ser a fonte.
- **URLs assinadas antigas (5 anos) [I]:** credenciais portadoras válidas até expirar; não
  revogáveis retroativamente. Requerem rotação/descarte (Step 7). Não são regeneráveis sem backfill.
- **URLs assinadas curtas [F]:** TTL 180 s; não revogáveis nesse intervalo (janela pequena).
- **CDN/borda/cache [H]:** respostas públicas podem ter sido cacheadas; **não verificável localmente**.
  Após `public=false`, a borda pode ainda servir cópias cacheadas por algum tempo.
- **Referências sem dono determinável [I]:** **não** converter; manter como `rejected`/`external` e
  deixar o resolvedor decidir (fail-closed → fallback). Nunca reabrir `/object/public/`.
- **Referências externas/demo [F]:** não são Storage; sem ação.

---

## G. Pendências de produto

1. **C-06 — formato/extensões de imagem.** Decidir se o guard/RPC deve restringir a
   `jpg|jpeg|png|webp` (alinhado a `allowed_mime_types` do bucket) ou manter `[a-z0-9]{1,8}`.
   Enquanto aberto, ambos os lados aceitam `.php` etc. (format-only, sem impacto de confidencialidade).
   **Exige decisão de produto; não resolvido.** **[F]**
2. **C-08 — referências não canônicas na escrita.** Decidir se adaptadores/`buildProfileUpdatePatch`
   devem rejeitar `photo_url` não-canônico, sem quebrar formatos legados/demo legítimos. O tool MCP
   `update_my_profile` **não** expõe `photo_url` (não é vetor hoje). **Exige decisão de produto.** **[F]**
3. **Flake `persist-phase-1d-5-browser`.** Causa-raiz **não determinada** (corrida IndexedDB×reload
   sob contenção [I]); **não** é regressão de G4.26D. **Não classificado** quanto à causa-raiz;
   mantido visível. **[F]**
4. **Sem evidência para resolver C-06/C-08 sem novas regras:** mantidas **abertas**. **[F]**

---

## H. Plano de validação e rollback

### H.1 Validação (ambiente remoto, proposta) **[I]**

| # | Cenário | Esperado pós-migração |
| --- | --- | --- |
| V1 | `anon` em `/object/public/avatars/...` | **negado** (bucket privado) |
| V2 | `anon` no endpoint `getAvatarMediaUrl` | erro de auth |
| V3 | Autenticado resolve avatar próprio | `ready`, `expiresAt − now ∈ [60,300] s` |
| V4 | Autenticado resolve avatar de terceiro | `ready` (Modelo 2) |
| V5 | `profileId` inválido/ausente | `forbidden`/`missing` |
| V6 | `photo_url` de bucket/path alheio | `missing`/`unavailable` |
| V7 | Objeto removido/ausente | `missing` |
| V8 | URL assinada expira | falha após TTL |
| V9 | RPC canônica: valor não-canônico | `NULL` entregue; sem URL pública |
| V10 | Nenhum `/object/public/` novo emitido | confirmado |
| V11 | Nenhum token/URL assinada em logs | confirmado |

### H.2 Rollback **[F]**

- Reverter **flag/consumidores primeiro**; restaurar **policies mínimas** (owner-folder para
  mutação; SELECT mínimo autenticado).
- **Jamais** `public = true`; **jamais** reemitir URL de 5 anos.
- Reverter a RPC para a versão core anterior, se necessário (assinatura compatível).
- Restaurar snapshot de `photo_url` a partir da cópia feita no Step 3.
- **Risco do rollback:** restaurar policy antiga pode **reaplicar** SELECT ampla/pública — usar
  sempre as definições mínimas, revisadas antes de aplicar.

---

## I. Operações que exigirão autorização explícita

Todas tocam o Supabase remoto e estão **bloqueadas**: **[F]**

1. Confirmar projeto-alvo e **inspecionar** buckets/policies/grants/CDN aplicados.
2. **Inventário** agregado de `profiles.photo_url` e objetos de `avatars` (sem tokens).
3. **Aplicar** a migration `20261020120000` (guard + RPC canônica).
4. **Backfill** de referências legadas (Step 3) e marcação de não conversíveis.
5. **Alterar bucket** `avatars`: `public=false` + remover `"Avatars public read"` + SELECT mínimo.
6. **Rotacionar/descartar** URLs assinadas de 5 anos; varrer `/object/public/`.
7. Executar os testes V1–V11 no ambiente real.
8. Habilitar flag por ambiente (se aplicável) e operar janela/monitoramento/rollback acordados.

---

## J. Veredito de prontidão

**PRONTO PARA PLANEJAR A FASE REMOTA — NÃO É AUTORIZAÇÃO PARA EXECUTÁ-LA.**

- Contratos locais **consolidados e verificados**: escrita canônica nos escritores ativos; RPC
  canônica-ou-`NULL` (não aplicada); guard SQL seguro com paridade de controle de caracteres
  comprovada em runtime; cadeia de proprietário revalidada; extração de path legado endurecida;
  **0** leitores reais fora do componente. **[F]**
- **C2 permanece ABERTO.** Nada remoto foi alterado; bucket `avatars` segue declarado público no
  repositório. Tornar o bucket privado **não** revoga cópias já baixadas nem URLs assinadas antigas. **[F]**
- **Pendências abertas:** C-06, C-08 (decisões de produto) e o flake de navegador (causa-raiz não
  determinada). Nenhuma bloqueia o **planejamento**; devem ser resolvidas/decididas antes de executar. **[F]**
- **Nenhuma fase remota foi iniciada.** Aguarda-se autorização explícita. **[F]**

---

## Delta de Git desta fase

- Início: **301** entradas. Fim: **302** = 301 + este relatório (untracked). HEAD/branch inalterados.
  Nenhuma operação Git destrutiva. **[F]**
