# G4.26A — Preparação local para remediação C2 de avatares (pré-execução)

Fase **somente leitura**: nenhuma operação remota, SQL, migration, bucket, policy, grant,
backfill, rotação de URL ou habilitação de flag foi executada. Este documento **prepara** a
remediação da vulnerabilidade **C2** (avatares publicamente legíveis) descrita no relatório
G4.25, sem declarar a correção como concluída.

- **Baseline Git:** branch `backup/connexy-snapshot-2026-10-02`, HEAD
  `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`.
- **Status inicial:** 291 entradas preexistentes + relatório G4.25 = **292** entradas
  (`git status --short`); com este próprio relatório (untracked), **293** entradas ao final desta
  fase. Verificado por contagem direta.
- **Escopo:** apenas preparação/verificação local. Nenhum segredo, JWT, chave ou URL assinada
  completa é reproduzido aqui.

---

## A. Objetivo e limites

- **Objetivo:** reunir evidências verificáveis (código local, migrations versionadas, testes
  direcionados) para habilitar, sob autorização explícita, a remediação C2 sem reabrir exposição.
- **Limites desta fase:**
  - Nenhuma conexão/link/pull/push ao Supabase remoto; nenhum SQL remoto; nenhuma migration.
  - Nenhuma alteração de bucket/policy/grant/RLS/backfill/rotação de URL/flag.
  - Nenhuma alteração de `.env`, segredos ou configuração de conexão.
  - Nenhuma instalação de dependências; nenhuma operação destrutiva de Git.
  - `VITE_APP_SCHEMA_A_MEDIA_URL` **permanece desligada**.
  - Preservação integral de staged/unstaged/untracked preexistentes.
- **Fora de escopo:** buckets `bio-media` e `reels-media`; remediação real de C2 (fase futura).

---

## B. Natureza da C2 (recapitulação verificada)

A C2 consiste em: **o bucket `avatars` é público (`public = true`) e possui uma policy de leitura
irrestrita**, de modo que qualquer portador da URL `/object/public/avatars/...` acessa a imagem
sem autenticação nem autorização.

Evidência versionada:

- `supabase/migrations/20260816120000_create_avatars_bucket.sql:7-18` cria o bucket com
  `public = true` (e `ON CONFLICT ... DO UPDATE SET public = EXCLUDED.public`).
- `:23-25` cria `CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING
  (bucket_id = 'avatars')` — **SELECT sem exigir `authenticated`**.
- `supabase/migrations/20260825025843_...sql` recria policies de escrita (insert/update/delete)
  mas **não remove** `"Avatars public read"`.
- `supabase/config.toml` (config local): `avatars` `public = true` (não alterar nesta fase).

---

## C. Superfície de consumo local (quem renderiza avatar)

- **Componente compartilhado:** `src/components/media/authenticated-avatar-image.tsx`.
  - Fail-closed reconfirmado (`:37-52`): `status !== "ready"`, `catch` e resposta obsoleta
    resultam em `setResolvedUrl(null)`; `if (!src || failed) return <>{fallback}</>`.
  - Props: `profileId` (UUID), `legacyUrl`, `fallback`.
- **Classificador offline:** `src/lib/media/avatar-media.ts`.
  - `classifyAvatarRef` distingue `missing | local | external | storage-public | storage-signed |
    canonical | rejected`; bucket permitido apenas `avatars` (`:26`, `:101-103`).
  - `resolveAvatarDisplayUrl` devolve URL só para `local/external/storage-public/storage-signed`;
    `canonical`/`missing`/`rejected` → `null` (fallback local) (`:132-147`).
- **Serviço server-side:** `src/lib/media/avatar-media-authorization.server.ts`.
  - `AVATAR_MEDIA_URL_TTL_SECONDS = 180`; valida owner/bucket/path (`:55-57`); assina com
    service role server-only (`:93`, bucket fixo `AVATAR_BUCKET`).
  - `viewerId` nulo → `forbidden` (`:31`); `profile.id !== profileId` → `missing` (`:39`).
- **Endpoint:** `src/lib/media/avatar-media.functions.ts:7`
  `inputSchema = z.object({ profileId: z.string().uuid() })` — **não aceita bucket/path/URL** do
  cliente.
- **Consumidores migrados:** **25 arquivos `src/`** usam `AuthenticatedAvatarImage` (excluindo o
  próprio componente). Confirmado também pelo teste
  `tests/avatar-consumer-migration-g4-24.test.ts`, que lista os mesmos 25 arquivos.

> **Correção factual:** o relatório G4.25 (seção D.3) dizia “**24** consumidores”, mas a lista que
> ele mesmo referenciava continha **25**. O número correto é **25**. Corrigido aqui como
> inconsistência factual; nenhuma conclusão do G4.25 muda.

---

## D. O que ainda depende da URL pública

Nenhum consumidor de avatar **migrado** depende da URL pública: todos passam `profileId` (UUID) +
`legacyUrl`, e a resolução passa pelo endpoint (assinatura server-side). Portanto `public = false`
não quebra o fluxo principal, **desde que** `photo_url` persistido esteja em formato classificável.

Referências que **não** são avatar (fora do escopo C2, sem ação aqui):

- `bio-posts.tsx` — URL pública de `bio-media` (Etapa 9 do G4.19).
- `reel-card.tsx` — caminho/poster de `reels-media`.
- `message-bubble.tsx` — `participantPhoto` recebida e não usada em `<img>`.

### D.1 Código morto (achado desta fase) **[F]**

- `src/components/feed/feed.tsx` exporta `Feed`, que repassa `userName`/`userPhoto` a
  `FeedComposer`. **`Feed` não é renderizado em lugar algum**: a rota ativa
  `src/routes/_app/feed.tsx:3,20` usa `SmartFeed`, e `_app.home.tsx:7,165` usa
  `HomePremiumFeed`. `SmartFeed`/`HomePremiumFeed` **não** usam `FeedComposer`.
  - Conclusão: `feed-composer.tsx:13` (`<img src={userPhoto}>`) é **código não alcançável** no app
    atual. O item D.5 do G4.25 ("inconclusivo") fica **resolvido** como *dead code*, e não como
    exposição real de avatar de Storage.
- Não requer migração agora; recomenda-se remoção futura em etapa de limpeza (fora do escopo C2).

### D.2 RPC `get_nearby_profiles` **[F]**

- Definição versionada vigente: `supabase/migrations/20260925030806_schema_a_core.sql:668-739`
  (`security definer`, `set search_path = ''`). Retorna `photo_url text` **bruto** (`:672,725`).
  A versão anterior está em `20260819180000_...sql:322-391` (substituída pela ordem de migração).
- Grants: `REVOKE ... FROM public, anon; GRANT ... TO authenticated`
  (`20260819180000_...sql:404-417`).
- Consumo primário: `ConnectionsRepository.listNearby` (`:16-23`) → `ConnectionsService` →
  `DiscoveryService.getNearbyPeople` → `useDiscovery` (`src/hooks/api/use-discovery.ts`).
- Consumo secundário: `UserRepository.getNearby` (`src/repositories/user.repository.ts:66-72`) →
  `UserService.getNearby` (`src/services/user.service.ts:48`) — mesmo RPC, consumidor distinto.
- Rotas consumidoras: `_app.pessoas.tsx:98-100`, `_app.connecta.tsx:177-179,241-243,321-323`,
  `_app/discover.tsx:451-457` — todas passam `profileId={p.id}` + `legacyUrl={p.photo_url}` a
  `AuthenticatedAvatarImage`.
- Conclusão: o RPC entrega `photo_url` como **legacyUrl**; a renderização **não** depende da URL
  pública. Eventual preocupação é o **formato persistido** de `photo_url`, não o RPC.
- **Como preservar a resolução autenticada sem depender de URL pública:** o componente já resolve
  pelo `id` (UUID) lido da linha sob RLS. Ajustar a RPC para (a) continuar devolvendo `id` e demais
  campos, e (b) omitir/zerar `photo_url` cru (ou devolvê-lo apenas quando já for caminho canônico),
  mantendo o resolvedor como única fonte de URL. Como o componente é fail-closed, zerar `photo_url`
  não reabre exposição — apenas força o fallback quando o objeto não estiver em formato resolvível.
- **Riscos de compatibilidade para clientes legados:** qualquer cliente que hoje renderize
  `photo_url` cru em `<img>` deixaria de exibir a imagem se o bucket ficar privado; a RPC é
  `security definer` com `search_path = ''` e mudar seu `returns table` altera a assinatura tipada —
  exige migração versionada coordenada com os tipos (`src/types/phase-13b.ts:30-43`).

---

## E. Formatos de `photo_url` e escritores (task 4)

| Formato | Classificação (`avatar-media.ts`) | Origem / escritor | Migrável deterministicamente? |
|---|---|---|---|
| URL pública `.../object/public/avatars/{uid}/...` | `storage-public` | `bio-avatar.tsx:119` (`getPublicUrl`), `completar-perfil.tsx:247` (`getPublicUrl`) | **Sim** — extrair path `{uid}/...` (owner = 1º segmento) |
| URL assinada legada `.../object/sign/...` | `storage-signed` (repassada) | histórico/legado | Sim, se o path estiver presente; expiração não avaliada localmente |
| Caminho canônico `{uid}/...` | `canonical` → render `null` (fallback) | nenhum escritor atual comprovado | Sim (já é canônico) |
| URL externa HTTP(S) (mocks/demo) | `external` | demo | Não requer migração (não é Storage) |
| `data:`/`blob:` local | `local` | preview local (não persistido) | Não aplicável |
| Vazio/nulo | `missing` | `bio-avatar.tsx:150` (`photo_url: null`) | Não aplicável |
| Protocolo não-HTTP | `rejected` | — | Investigar na execução |

**Escritores verificados (produzem URL pública hoje):**

- `src/components/bio/bio-avatar.tsx:117-123` — `UploadService.uploadAvatar` +
  `supabase.storage.from("avatars").getPublicUrl(path)` → grava `photo_url` = URL pública.
- `src/routes/completar-perfil.tsx:195-261` — upload em `avatars` + `getPublicUrl(path)` → grava
  `photo_url`.
- `src/services/upload.service.ts:87-106` e `src/lib/supabase/storage.ts:8-9` — helpers de upload e
  `getPublicUrl`.

**Guarda de não-persistência de local:** `schema-a-profile.ts:150-151` remove `photo_url`/`cover_url`
do patch quando o valor é local (`isLocalMediaUrl`). `mappedProfileForRemote` (`:63-64`) zera
`photo`/`cover` locais antes de mapear.

**Implicação para a remediação:** como os escritores **atuais** gravam URL pública, a migração
precisa (a) tratar os registros legados (URLs públicas já persistidas) e/ou (b) mudar o escritor
para gravar caminho canônico. Enquanto `photo_url` contiver URL pública, `public = false` fará o
`<img>` dessa URL falhar — mas o componente é fail-closed e cai no fallback, sem reabrir exposição.

---

## F. Verificações executadas nesta fase (task 5)

Todas locais, sem rede. Comandos executados com as ferramentas do repositório.

- **Testes direcionados de avatar (G4.20–G4.24):**
  `bun test tests/avatar-media-g4-21.test.ts tests/avatar-media-authorization-g4-23.test.ts
  tests/avatar-consumer-migration-g4-24.test.ts tests/completar-perfil-avatar-g4-20.test.ts`
  → **36 pass / 0 fail** (123 asserts).
- **Testes de mídia/perfil correlatos:**
  `bun test` (10 arquivos: media-contract/resolver/authorization/url-flag, adpater DM1, post
  consumer G4-5, profile-update-patch, schema-a-profile 1h-17/repository-b1/adapters-1h-12)
  → **165 pass / 0 fail** (551 asserts).
- **Type check:** `node_modules/.bin/tsc --noEmit` → **exit 0**.
- **Lint (escopo avatar):** `eslint` nos módulos de avatar, componente, endpoint e testes
  G4.20–G4.24 + `bio-avatar.tsx`/`thread-avatar.tsx` → **exit 0**.
- **Formatação:** `prettier --check` nos módulos, componente e testes de avatar →
  “All matched files use Prettier code style!”.

Nenhum teste remoto/integrado foi executado. Os números acima foram **executados nesta fase**
(locais, sem rede) e são reprodutíveis; resultados documentados em fases anteriores (G4.21/G4.23/
G4.24) não são apresentados aqui como reexecutados. `git diff --check` → exit 0.

---

## G. Matriz de preparação C2 (ordem segura, NÃO executada)

Ordem segura preservada: **inventário remoto → compatibilização dos escritores → backfill
determinístico → cobertura de leitores → ajuste da RPC → validação → só então restrição do bucket.**

| # | Pré-condição | Operação (fase futura) | Evidência necessária | Risco | Critério de aprovação | Rollback | Autorização |
|---|---|---|---|---|---|---|---|
| 1 | HEAD/branch confirmados; status preservado | Inventário remoto autorizado: formatos de `photo_url` e objetos de `avatars` (agregado, sem tokens) | Lista de formatos e contagens (sem URLs completas) | Amostra incompleta deixa legado sem tratamento | 100% dos registros classificados | Descartar snapshot | Explícita p/ leitura de dados reais |
| 2 | Inventário concluído | Compatibilizar escritores: parar de gravar URL pública; gravar caminho canônico `{uid}/{uuid}.jpg` | Diff do escritor + teste de persistência | Gravar formato inválido | Testes verdes + path validado por `validateMediaPath` | Reverter commit do escritor | Autorização de código |
| 3 | Escritores compatibilizados | Backfill determinístico (URL pública/assinada → caminho canônico quando dono determinável); marcar não conversíveis | Relatório antes/depois (contagens, sem segredos) | Corromper `photo_url` | Amostra validada + reversível | Restaurar snapshot e reescrever | Explícita p/ escrita de dados reais |
| 4 | Legado mapeado | Cobrir 100% dos leitores reais com o caminho autenticado (25 consumidores já usam o componente) | Varredura estática + diff | Contexto residual com URL crua | Todos os 25 consumidores usam o endpoint | Reverter wiring | Autorização de código |
| 5 | Leitores cobertos | Ajustar a RPC `get_nearby_profiles` para não devolver URL crua | Migration versionada + tipos atualizados | Quebra de cliente legado; mudança de assinatura `returns table` | Nenhum caminho entrega URL pública | Reverter migration da RPC | Explícita: SQL/migration |
| 6 | RPC ajustada | Validação remota: testes R1–R11 (G4.25 §F.5) | Taxa `ready` vs `forbidden/missing/unavailable` | Confundir “autenticado pode ver” com autorização cross-domínio | Resolução só via endpoint assinado; `anon` negado | Reverter flag/consumidores primeiro | Explícita p/ teste integrado |
| 7 | Validação aprovada | Restringir o bucket: `public = false` + remover `"Avatars public read"` | Migration versionada + policy mínima SELECT autenticada | Quebra de `<img>` deslogado; cache/CDN | Confirmar F.6 (R1–R6) | Restaurar policy mínima; **jamais** `public = true` | Explícita: bucket/policy |
| 8 | Bucket restrito | Higiene: rotacionar/descartar URL assinada de 5 anos; varrer `/object/public/` | Plano de rotação auditado por ambiente | Reabrir exposição | Nenhuma `/object/public/` nova emitida | Desligar flags; manter OFF | Explícita por ambiente |

**Fatores de risco explicitados (todos NÃO resolvidos nesta fase):**

- **URLs assinadas antigas de cinco anos:** são credenciais portadoras; permanecem válidas até
  expirar e não são revogáveis retroativamente (G4.25 §F.7). Rotação obrigatória (linha 8).
- **Referências públicas já persistidas em `photo_url`:** os escritores atuais (`bio-avatar.tsx:119`,
  `completar-perfil.tsx:247`) continuam gravando URL pública; backfill determinístico é a linha 3.
- **Possíveis caches/CDN:** respostas públicas podem ter sido cacheadas na borda; **não verificável
  localmente** — classificado como [H] (G4.25 §E.2).
- **Dependência da RPC em URLs brutas:** a RPC devolve `photo_url` cru; ajuste é a linha 5.
- **Impacto em clientes deslogados:** `<img>` sem sessão quebra ao privatizar (fallback/placeholder);
  não há acesso anônimo por design (Modelo 2, G4.22).
- **Diferença entre proteger `avatars` e `bio-media`/`reels-media`:** esta linha protege **apenas**
  `avatars`; `bio-media` (bio-posts) e `reels-media` (reels) são contratos distintos, com policies
  `public = true` próprias, e **não** são alterados aqui (G4.19 Etapa 9).

**Não presumir:** tornar o bucket privado **não** revoga cópias já baixadas nem todas as URLs
assinadas emitidas antes.

**Regras invariantes em todas as linhas:** fail-closed; `public = true` é proibido no rollback;
`VITE_APP_SCHEMA_A_MEDIA_URL` permanece OFF; não tocar `bio-media`/`reels-media`; não presumir que
tornar o bucket privado revoga cópias já baixadas nem URLs assinadas emitidas antes.

---

## H. Artefatos e comparação Git

- **Relatório G4.25 (fonte):** `docs/audits/connexy-database-g4-25-avatar-c2-readiness.md`.
  - Correções **editoriais** permitidas aplicadas: F.8 `reemiti r` → `reemitir`; D.3 reformulação da
    exceção potencial (parêntese não fechado). **Nenhuma** conclusão/classificação/veredito alterado.
- **Correção factual (registrada, não aplicada ao G4.25 para não alterar além do autorizado):**
  “24 consumidores” → **25** (seção C deste documento).
- **Artefatos de avatar verificados:** `src/components/media/authenticated-avatar-image.tsx`,
  `src/lib/media/avatar-media.ts`, `src/lib/media/avatar-media-authorization.server.ts`,
  `src/lib/media/avatar-media.functions.ts`, `src/lib/media/media-url-flag.ts` (flag OFF).
- **Migrations de avatar verificadas:** `20260816120000_create_avatars_bucket.sql`,
  `20260825025843_...sql`, `20260925030806_schema_a_core.sql` (RPC).
- **Comparação Git:**
  - Início desta fase: **292** entradas em `git status --short` (291 preexistentes + G4.25).
  - Fim desta fase: **293** entradas = 292 + este relatório (untracked). Verificado por contagem
    direta (`git status --short | wc -l` = 293; excluindo este arquivo = 292).
  - Branch (`backup/connexy-snapshot-2026-10-02`) e HEAD
    (`16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`) **inalterados**. Nenhuma operação Git destrutiva
    executada. Todas as alterações preexistentes (staged/unstaged/untracked) preservadas.

---

## I. Encerramento

Esta fase **não** inicia remediação remota e **não** declara C2 corrigida. Ela apenas consolida a
preparação e as evidências locais necessárias para uma fase remota subsequente, condicionada a
autorização explícita. Pré-requisitos remotos ainda pendentes: autorização, snapshot de dados reais,
decisão sobre o formato do escritor (URL pública → caminho canônico) e plano de rollback com policy
mínima. **Parar aqui** é o resultado esperado desta fase.
