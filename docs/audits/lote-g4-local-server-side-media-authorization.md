# Lote G4 (local) — Autorização server-side de mídia

Data: 2026-10-12 · Tipo: implementação **local** + testes de integração sintéticos.
HEAD `16f8c6b` inalterado. **C2 permanece aberto.** Storage de produção **não** declarado seguro. **G5 não iniciado.**

> **Resumo:** foi implementada e validada localmente a arquitetura server-side de mídia
> (D2 / D-M1–D-M7): um endpoint `createServerFn` verifica a sessão no servidor, carrega a
> publicação por **RLS** com a identidade verificada, autoriza a partir da **linha** e só então
> assina uma URL temporária com credencial **exclusivamente server-side** (service role). O contrato
> **D-M1** foi aplicado ao adapter de `posts.media`. Todos os testes passaram (10 adapter + 12
> integrados locais). A lacuna de confidencialidade por **bucket público/RLS bucket-wide** continua
> comprovada e **não** foi corrigida nesta fase (depende de C2).

## 1. Etapa 1 — Auditoria

- **Estado Git:** branch `backup/connexy-snapshot-2026-10-02`, HEAD `16f8c6b`, sem commits/reset/push.
- **Validação de sessão no servidor:** o padrão seguro existente é o middleware
  `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`): monta um cliente com a
  **publishable key** + `Authorization: Bearer <token>`, chama `auth.getClaims(token)` (verifica a
  assinatura do JWT), exige `claims.sub` e injeta `{ supabase, userId, claims }` no contexto. É
  código Lovable-generated, **órfão** até agora (0 importadores); está previsto nos ADRs como a
  alternativa segura. `resolveAuthenticatedUserId()` (`src/lib/supabase/identity.ts`) é o caminho
  SSR por cookie equivalente (usa `getClaims()` e é fail-closed).
- **Nunca aceitar identidade do cliente:** o endpoint recebe apenas `postId` + **localizador**;
  `bucket`/`path` são apenas localizadores, nunca prova. `viewerId` vem do contexto verificado.
- **`supabaseAdmin`:** `client.server.ts` (service role, `*.server.ts`) existe e **não** tem
  importadores hoje; a política do repositório é importá-lo apenas dinamicamente dentro de handlers
  server. Sua existência **não** autoriza uso genérico — foi usado **somente** como credencial de
  assinatura server-side, depois da autorização, e nunca no bundle do cliente.
- **Infra relevante:** `createSchemaAClient` (Schema A, RLS) vs cliente legado `Database` (sem
  `posts`/`connections`). O middleware injeta o cliente legado, portanto o endpoint constrói um
  `SchemaAClient` por requisição com o **mesmo** bearer já verificado.
- **ADRs/relatórios lidos:** G0 (D-M1–D-M7), G0.1, G0.2, G1, G2, G3.

## 2. Etapa 2 — Arquitetura implementada

Fluxo do endpoint `getPostMediaUrl` (`src/lib/media/media-url.functions.ts`):

1. `requireSupabaseAuth` valida a **sessão real** (JWT via `getClaims`); sem token/inválido ⇒ erro
   antes do handler.
2. `zod` valida a entrada (`postId` UUID + localizador `identity`/`index`).
3. Monta um `SchemaAClient` com o bearer verificado e chama
   `createServerMediaUrlService` (`media-server-authorization.server.ts`).
4. `loadPost` lê a publicação com **RLS** (`posts_select_privacy`): linha não visível ⇒ `null`.
5. `areConnected` lê `connections` com **RLS** para `privacy = CONNECTIONS`.
6. `authorizeMediaAccess` autoriza a partir da **linha**: dono, privacidade e relação vêm de dados
   confiáveis; a identidade `(bucket, path)` precisa **existir** na mídia registrada; valida
   bucket×tipo e dono do path.
7. Só depois assina via `signMediaWithServiceRole` (service role, importado dinamicamente).
8. TTL limitado no servidor (60–300 s; default 300). URL/token **nunca** logados.
9. Erros não distinguem objeto privado inexistente de não autorizado (`forbidden`).

**Não houve bloqueio que exigisse mudança arquitetural ampla** — o padrão existente
(`createServerFn` + middleware de auth + service role server-only) foi suficiente.

> **Não conectado à UI**: `getPostMediaUrl` tem 0 importadores; a flag
> `VITE_APP_SCHEMA_A_MEDIA_URL` **não** está configurada (nem em `.env`/`.env.local`/`config.toml`).

## 3. Estado Git antes/depois

| | Antes | Depois |
| --- | --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` | idem |
| HEAD | `16f8c6b` | `16f8c6b` |
| Linhas `git status --porcelain` | 214 (118 rastreadas) | 220 (120 rastreadas, 100 não rastreadas) |

O repositório já continha ~113 arquivos rastreados modificados **antes** desta fase (estado do
snapshot); o delta **desta fase** é exatamente:

- **Rastreados modificados (2):** `src/lib/adapters/schema-a/content.ts`, `src/lib/demo/demo-posts.ts`.
- **Novos (4 + este relatório):** `src/lib/media/media-server-authorization.server.ts`,
  `src/lib/media/media-url.functions.ts`, `tests/media-adapter-dm1-g4.test.ts`,
  `tests/media-server-authorization-live-g4.test.ts`, este relatório.

Nenhum `reset`/`clean`/checkout destrutivo, nenhum commit/push. `.env`, `.env.local`,
`supabase/config.toml` e migrations **não** foram tocados.

## 4. Etapa 3 — Compatibilidade D-M1

`DemoPostMedia` foi **estendido de forma aditiva**: `bucket?`, `path?`, `posterPath?` e `preview`
passou a ser opcional (identidade canônica pode não ter preview). `content.ts` agora:

- `mediaToJson`: emite `type` + `bucket`/`path`/`posterPath`/`preview`/`mediaId` **apenas quando
  presentes** (não inventa campos, não inventa path).
- `mediaFromJson`: usa `normalizePostMedia` (mesma normalização do servidor). Mantém itens
  canônicos sem preview, legado (URL/data URL) e locais (`mediaId`); descarta só itens sem
  identidade alguma ou com tipo inválido.

Compatibilidade preservada: produtores existentes ainda setam `preview`; consumidores
(`LocalMediaFrame.fallbackUrl?: string | null`, `img src`, `happening-now`) toleram `undefined`.
Suíte existente permanece verde (incl. `schema-a-adapters-1h-12`).

## 5. Etapa 4/5 — Matriz de testes (evidências reais)

Comandos: `bun test` (suíte), env local exportado para os live.

| Verificação | Resultado real |
| --- | --- |
| Mídia unitária (G1–G1.4) `tests/media-*.test.ts` | **60 pass / 0 fail** |
| Adapter D-M1 (novo) `tests/media-adapter-dm1-g4.test.ts` | **10 pass / 0 fail** |
| Integração G4 (local) `tests/media-server-authorization-live-g4.test.ts` | **12 pass / 0 fail** |
| Integração G3 (local, re-run) | **10 pass / 0 fail** |
| Suíte completa `bun test` | **1071 pass / 46 skip / 0 fail** (1093→1117 testes) |
| Tipos `bunx tsc --noEmit` | exit 0 |
| ESLint (arquivos novos/alterados) | 0 erros |
| Limpeza pós-teste (psql local) | `g4*` users=0, posts "g4 synthetic"=0, connection rows=0, objetos recentes=0 |

### Cenários de integração (Etapa 4)

| Cenário | Status | Evidência |
| --- | --- | --- |
| Anônimo sem assinatura | **Comprovado** | `forbidden` com viewer `null` |
| Proprietário em PUBLIC/CONNECTIONS/PRIVATE | **Comprovado** | `ready` nos três, com **service role real** |
| Usuário conectado em CONNECTIONS | **Comprovado** | `ready` após `connect` |
| Usuário desconectado em CONNECTIONS | **Comprovado** | `forbidden` (e após `disconnect`) |
| Não proprietário em PRIVATE | **Comprovado** | `forbidden` |
| Sessão ausente/inválida/expirada | **Parcial** | `viewerId null ⇒ forbidden`; token inválido é barrado pelo middleware `requireSupabaseAuth` (verificação por código; sem HTTP end-to-end no bun) |
| `bucket/path` arbitrário / outro dono / bucket incompatível | **Comprovado** | `missing` / `forbidden` / `forbidden` |
| Objeto inexistente sem vazamento | **Comprovado** | resultado ≠ `ready`, indistinto de não autorizado |
| Mudança de privacidade e desconexão bloqueiam novas assinaturas | **Comprovado** | PUBLIC→PRIVATE ⇒ `forbidden`; disconnect ⇒ `forbidden` |
| TTL máximo e expiração real | **Comprovado** | TTL limitado a ≤300 (≥60) e `expiresAt` coerente; expiração real de URL 1 s provada em G3/C6-11 |
| Isolamento de cache entre usuários | **Parcial** | Autorização por espectador comprovada (owner `ready`, outro `forbidden`); o **cache** vive no `media-resolver` (coberto por unitários G1.4) e não há cache no endpoint |
| Nenhum segredo/token nos logs | **Comprovado** | captura de `console` + scan do fonte (sem `console.`/token) |
| Flag desligada sem emissão | **Comprovado** | `unavailable` e 0 chamadas ao signer |
| Acesso direto ao objeto separado do acesso à linha | **Comprovado (lacuna)** | linha PRIVATE invisível a B, mas `storage.download` de B retorna sem erro |

> Testes unitários **não** contam como integração: os cenários de integração usam Supabase local
> real (RLS + Storage + service role). Cenários que dependem de tornar buckets privados/revogar
> policies estão marcados **Bloqueado (C2)** abaixo.

## 6. Limitações relacionadas aos buckets públicos

- Os três buckets (`avatars`, `bio-media`, `reels-media`) permanecem `public = true` e com SELECT
  `bucket-wide` para `authenticated`. A assinatura server-side foi implementada, mas a garantia de
  confidencialidade **só se completa com C2** (buckets privados + revogação da SELECT + assinatura).
- Enquanto isso, o teste de "acesso direto ao objeto" comprova que qualquer autenticado baixa
  qualquer objeto, independentemente da privacidade da **linha**. **Cenário BLOQUEADO (C2):**
  comprovar que `/object/public/` passa a falhar e que a auto-assinatura é bloqueada após a
  revogação.
- G4 **não** alterou buckets, policies, dados ou migrations.

## 7. Riscos remanescentes

- **URL assinada = credencial portadora:** URLs já emitidas permanecem válidas até expirar;
  invalidar cache/mudar privacidade **não** as revoga.
- **Service role:** o signer ignora RLS por design; sua segurança depende inteiramente de a
  autorização de aplicação estar correta e de o endpoint ser o único caminho. Consumidores futuros
  **devem** usar o `createServerFn`, nunca o signer diretamente.
- **Divergência de env no wiring:** o middleware `requireSupabaseAuth` lê
  `import.meta.env.VITE_APP_SUPABASE_URL`, enquanto o handler lê
  `process.env.APP_SUPABASE_URL || VITE_APP_SUPABASE_URL`. Em produção é preciso garantir que ambas
  apontem para o **mesmo** projeto externo.
- **Sem rate limiting/caching server-side** no endpoint atual.
- **`posts.media` legado** pode conter referências fora da origem confiável (rejeitadas
  fail-closed); exige inventário/backfill antes de corte.
- Endpoint **não conectado** à UI e **flag OFF**.

## 8. Recomendação da próxima fase

1. **C2 (pré-requisito de segurança):** com autorização explícita, aplicar `public=false` nos três
   buckets, revogar a SELECT bucket-wide e manter a assinatura server-side; então reexecutar G4/G3 e
   comprovar o fechamento da lacuna de acesso direto.
2. Só depois, conectar o endpoint à UI **atrás da flag**, com eventos de invalidação.
3. Unificar o wiring de variáveis (`APP_SUPABASE_*` × `VITE_APP_SUPABASE_*`) e adicionar
   rate limiting.
4. Inventário/backfill das referências legadas de mídia (D-M1).

**C2 segue aberto; o Storage de produção não é declarado seguro; G5 não foi iniciado.**
