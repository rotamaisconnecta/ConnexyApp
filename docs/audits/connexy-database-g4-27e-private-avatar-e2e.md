# G4.27E — Validação E2E local de avatar privado

> Fase **G4.27E** — validação local do fluxo real de avatar em bucket privado.
> Esta execução permaneceu **somente leitura** sobre o stack local: nenhum
> container foi reiniciado/recriado, nenhuma migration foi aplicada de forma
> persistente, nenhum bucket/policy/RLS/grant foi alterado, nenhuma operação
> remota foi executada e nenhum commit/push foi feito.
>
> Relatórios-base: `connexy-database-g4-27d-avatar-c2-end-to-end.md` e
> `connexy-database-g4-26d-avatar-c2-hardening.md` (contexto: G4.26B, G4.26C,
> G4.27A, G4.27B, G4.27C).

Regra de evidência: **[F]** = verificado nesta execução; **[I]** = inferência
fundamentada; **[H]** = hipótese não comprovada.

---

## 1. Escopo e limites

| Item | Situação |
| --- | --- |
| Inspeção do repositório, relatórios, código e configuração | executada **[F]** |
| Verificação do estado dos serviços locais | executada **sem reiniciar** **[F]** |
| Testes de regressão não mutantes | executados **[F]** |
| Teste E2E que privatiza o bucket local | **NÃO executado** — exigiria aplicar a migration G4.27B no banco local **[F]** |
| Migrations locais/remotas aplicadas | nenhuma **[F]** |
| Alterações em buckets/policies/RLS/grants | nenhuma **[F]** |
| Operações no projeto remoto | nenhuma **[F]** |
| Commit/push/rebase/reset/clean | nenhum **[F]** |
| Alteração de `.env`, segredos, dependências ou flags | nenhuma **[F]** |
| C-06 / C-08 | não alterados **[F]** |

O teste pré-existente `tests/avatar-media-e2e-local-g4-27e.test.ts` foi **lido,
não executado**. Ele aplica a migration `20261021042744_g4_27b...` no PostgreSQL
local (`begin; <migration>; commit;`) e depois restaura o snapshot. Como o pedido
proíbe explicitamente migrations locais e alterações em bucket/policies, a
execução foi interrompida e a autorização foi consultada; a resposta foi **não
autorizar**. Portanto, **nenhuma prova E2E privada foi produzida**. **[F]**

---

## 2. Estado do ambiente e divergência de identificadores

### 2.1 Serviços locais (somente leitura)

| Container | Estado | Porta |
| --- | --- | --- |
| `supabase_db_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | `127.0.0.1:54322` |
| `supabase_kong_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | `127.0.0.1:54321` |
| `supabase_auth_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | interna |
| `supabase_rest_lzejdgfvtybarpbgwsyp` | Up 10h | interna |
| `supabase_storage_lzejdgfvtybarpbgwsyp` | Up 10h (healthy) | interna |

Nenhum serviço foi iniciado, parado ou recriado. **[F]**

### 2.2 Divergência `rsukwuqocgjmwwuwtqaf` × `lzejdgfvtybarpbgwsyp`

- `supabase/config.toml:1` contém `project_id = "rsukwuqocgjmwwuwtqaf"` **[F]**
- Os containers locais carregam o label `com.supabase.cli.project` =
  `lzejdgfvtybarpbgwsyp` **[F]**
- `supabase/.temp/project-ref` = `rsukwuqocgjmwwuwtqaf` (projeto vinculado
  `connexy-mvp`) **[F]**
- O `.env` legado mantém `SUPABASE_URL` apontando para
  `lzejdgfvtybarpbgwsyp.supabase.co` (ref do stack local); os namespaces
  `VITE_APP_*` apontam para `rsukwuqocgjmwwuwtqaf` **[F]** (valores de URL/ref
  apenas; nenhuma chave foi lida ou registrada).

**Causa evidenciada:** `git diff supabase/config.toml` mostra que o `project_id`
foi alterado de `lzejdgfvtybarpbgwsyp` (ref com que os containers locais foram
criados) para `rsukwuqocgjmwwuwtqaf` (projeto remoto vinculado). O CLI deriva os
nomes dos containers a partir do `config.toml`; portanto `npx supabase status`
procura `supabase_*_rsukwuqocgjmwwuwtqaf`, que não existe, embora os containers
`*_lzejdgfvtybarpbgwsyp` estejam ativos. **[F]** para a alteração e os labels;
**[I]** para o mecanismo exato de resolução de nome do CLI.

Essa divergência **não** impede a descoberta do stack local pelo helper
`tests/helpers/g4-27e-local-stack.ts`, que localiza os containers por prefixo
Docker (`supabase_db_`, `supabase_kong_`) e restringe a URL a
`http://127.0.0.1:54321`. **[F]**

### 2.3 Estado do contrato no banco local

| Verificação (Docker local) | Resultado |
| --- | --- |
| `storage.buckets.avatars.public` | `true` |
| Policy `Avatars public read` | presente (1) |
| Guard `private.g4_26b_is_canonical_avatar_path` | ausente (0) |
| `supabase_migrations.schema_migrations` | 13, última `20260925030806` |

Conclusão: o banco local **não** reflete o contrato privado já aplicado no
remoto (G4.27C). Para executar a prova E2E privada seria necessário aplicar a
migration G4.27B localmente. **[F]**

---

## 3. Fluxo real inspecionado

| Componente | Local | Verificação |
| --- | --- | --- |
| Componente consumidor | `src/components/media/authenticated-avatar-image.tsx` | Recebe apenas `profileId`; ignora `legacyUrl` não local quando há UUID; resolve via server fn; usa fallback em falha; não monta URL pública. **[F]** |
| Server function | `src/lib/media/avatar-media.functions.ts` | `createServerFn({method:"POST"})`, middleware `requireAppSupabaseAuth`, valida `profileId` como UUID, exige `Authorization: Bearer`, repassa o token e `context.userId`; cliente não envia path/bucket/URL. **[F]** |
| Serviço de autorização | `src/lib/media/avatar-media-authorization.server.ts` | Exige `viewerId`; relê o perfil sob RLS; valida path canônico/dono/bucket `avatars`; assina com service role e TTL `180s`; retorna `missing`/`forbidden`/`unavailable`/`ready`. **[F]** |
| Assinatura | `...avatar-media-authorization.server.ts:91-95` | `supabaseAdmin.storage.from("avatars").createSignedUrl(path, ttl)` exclusivamente no servidor. **[F]** |
| Classificação/validação | `src/lib/media/avatar-media.ts`, `src/lib/media/media-path.ts` | Bucket permitido `avatars`; rejeita dono divergente, protocolo não HTTP, path inválido e bucket estrangeiro; `canonical` nunca vira URL exibível sem assinatura. **[F]** |
| Upload | `src/services/upload.service.ts` | Persiste o caminho canônico `{userId}/{uuid}.{ext}` no bucket `avatars`. **[F]** |

Não foi encontrado, nos caminhos ativos, `<img>` bruto alimentado por
`profiles.photo_url` sem passar pelo componente autenticado. **[F]**

---

## 4. Arquivos e testes inspecionados

**Relatórios:** G4.26D, G4.26C, G4.26B, G4.27A, G4.27B, G4.27C, G4.27D. **[F]**

**Configuração/infra:** `supabase/config.toml`, `supabase/.temp/project-ref`,
containers Docker locais, `supabase/migrations/20261021042457_...` e
`20261021042744_...`. **[F]**

**Código:** arquivos listados na §3. **[F]**

**Testes existentes (lidos):**
- `tests/avatar-media-e2e-local-g4-27e.test.ts` (**não executado**)
- `tests/helpers/g4-27e-avatar-fixture.ts` (fixture de PNG/JPEG real + snapshot/restore do bucket)
- `tests/helpers/g4-27e-local-stack.ts` (descoberta Docker + credenciais do Kong, sem imprimir valores)
- testes de regressão G4.20/21/23/24/26B/26D **[F]**

O teste E2E pré-existente (mtime 2026-10-21) já cobre, se executado: usuário
autenticado, upload sob RLS, path canônico, assinatura server-side, download e
decodificação real do PNG/JPEG, rejeição anônima (URL pública e download direto),
URL adulterada/expirada, dono estrangeiro, `missing`/`forbidden`/`unavailable` e
restauração do bucket. Contudo, **isso é conteúdo não executado**, não evidência.

---

## 5. Comandos executados e resultados

| Comando | Resultado |
| --- | --- |
| `docker ps` / `docker inspect` (leitura) | 5 containers locais ativos; labels e portas conferidos **[F]** |
| `psql` read-only no container local | bucket `public=true`; policy pública presente; guard ausente; 13 migrations **[F]** |
| `bun test` dos 5 arquivos de avatar (G4.20/21/23/24/26B) | **54 pass / 0 fail**, 173 asserts, ~870 ms **[F]** |
| `bun test tests/avatar-canonical-guard-sql-g4-26d.test.ts` | **2 pass / 0 fail**, 5 asserts; migrations executadas **dentro de `BEGIN…ROLLBACK`** **[F]** |
| Verificação pós-teste do banco local | `bucket_public=true`, `guard=0`, `public_read=1`, `migrations=13/20260925030806` → **nada persistido** **[F]** |
| `./node_modules/.bin/tsc --noEmit` | **exit 0** **[F]** |
| `git diff --check` | **exit 0** **[F]** |

Nenhuma chave, JWT ou segredo foi impresso neste relatório. **[F]**

---

## 6. Evidência de carga real e de rejeição não autorizada

**Não produzida nesta fase.** **[F]**

- Não houve upload real de imagem de teste, assinatura de URL seguida de
  download e decodificação no stack local.
- Não houve prova de que um usuário não autenticado recebe negação ao tentar
  acessar o objeto privado no ambiente local.
- Os testes de regressão aprovados usam mocks e/ou SQL em rollback; eles
  comprovam o comportamento lógico, **não** o carregamento real em bucket privado.
- O único artefato capaz de produzir essa prova (`avatar-media-e2e-local-g4-27e.test.ts`)
  **não foi executado** por exigir alteração local de bucket/policies.

Isso está alinhado com a regra do pedido: não declarar aprovação sem evidência
real de carga e de rejeição. **[F]**

---

## 7. Limitações e pendências

1. **E2E privado não executado** — bloqueio de política, não de código. **[F]**
2. **Banco local público** — `avatars.public=true`, policy pública e guard
   ausente; diverge do remoto (privado). **[F]**
3. **Divergência de project ref** — `config.toml`/`.temp` = `rsukw...`; containers
   = `lzejdg...`; `supabase status` não encontra o stack. Causa: alteração
   pré-existente do `project_id`. **[F]/[I]**
4. **C-06** (allowlist de extensões) — **ABERTO**, não alterado. **[F]**
5. **C-08** (validação de `photo_url` na escrita) — **ABERTO**, não alterado. **[F]**
6. **V1–V11 remotos** — não executados; nenhuma operação remota nesta fase. **[F]**
7. **CDN/cache/URLs antigas** — fora do escopo local. **[H]**

### Menor próximo passo seguro

**Opção A (recomendada para a prova privada local):** autorizar explicitamente,
em janela controlada, a execução única de
`bun test tests/avatar-media-e2e-local-g4-27e.test.ts`, com verificação
pré/pós de `storage.buckets.public`, policy `Avatars public read`, existência do
guard e contagem de migrations, garantindo snapshot/restore. Escopo: somente
Docker local, sem remote, sem commit.

**Opção B (validação remota autorizada):** em janela remota autorizada, criar
fixture não sensível (usuário + imagem gerada) e executar V1–V11, comprovando
carga por URL assinada e negação anônima no projeto `rsukwuqocgjmwwuwtqaf`.

Qualquer uma das opções exige **autorização explícita**; nenhuma foi executada.

---

## 8. Confirmação de preservação e ausência de operações proibidas

| Item | Confirmação |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` (inalterada) **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (inalterado) **[F]** |
| `git status --porcelain` no início | **310** entradas (166 `??`, 4 `AM`, 1 `D`, 138 `M`, 1 `MM`) **[F]** |
| Alterações preexistentes | preservadas; nada descartado/revertido **[F]** |
| Artefatos G4.27E pré-existentes | teste + 2 helpers já estavam no working tree (mtime 2026-10-21), não criados nesta execução **[F]** |
| Delta desta execução | apenas este relatório (novo `??`) **[F]** |
| Operações remotas | nenhuma **[F]** |
| Migrations persistentes | nenhuma; o teste SQL rodou em transação revertida **[F]** |
| Bucket/policies/RLS/grants | inalterados; estado local confirmado após os testes **[F]** |
| C-06 / C-08 | não alterados **[F]** |
| `.env`/segredos/dependências/flags | não alterados **[F]** |
| `VITE_APP_SCHEMA_A_MEDIA_URL` | permanece OFF **[F]** |
| Commit/push/rebase/reset/clean | nenhum **[F]** |

---

## 9. Veredito

**BLOQUEADA.**

Justificativa: o fluxo está implementado e os testes de regressão não mutantes
passam (**54 pass** nos testes de avatar, **2 pass** no guard SQL em rollback,
`tsc` exit 0), mas **não há evidência de carga real de imagem em bucket privado
nem de rejeição de acesso não autorizado**. O único caminho disponível para
produzir essa evidência exigiria aplicar a migration G4.27B no banco local
(alterando bucket/policies), o que está fora dos limites desta fase; a
autorização foi solicitada e negada. Sem essa prova, a fase **não pode** ser
declarada aprovada.

**Próxima ação dependente de autorização explícita:** executar a Opção A (E2E
local com snapshot/restore) ou a Opção B (validação remota autorizada).
