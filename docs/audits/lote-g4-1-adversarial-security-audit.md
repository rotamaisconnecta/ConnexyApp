# Lote G4.1 — Auditoria adversarial da autorização server-side de mídia

- **Escopo**: auditar a implementação do lote G4 (`getPostMediaUrl` + `createServerMediaUrlService`), procurando falhas de autorização, confusão de identidade, exposição de credencial privilegiada e vazamentos de metadados.
- **Modo**: auditoria local, somente leitura + testes locais não destrutivos. Nenhum arquivo de código do repositório foi criado/alterado. Único arquivo novo: este relatório.
- **Data**: 2026-10-12. **Git baseline**: HEAD `16f8c6b` (inalterado) / branch `backup/connexy-snapshot-2026-10-02`.
- **Ambiente**: React 19 + TanStack Start + Vite 8; bun 1.3.14; stack Supabase local (Docker `supabase_*_lzejdgfvtybarpbgwsyp`, Kong `127.0.0.1:54321`, Postgres `127.0.0.1:54322`). Chaves locais lidas de `/tmp/opencode/consol-keys.env` e **nunca impressas** (`[LOCAL_SECRET_REDACTED]`).

> **Correção de premissa do enunciado**: o enunciado G4.1 cita `src/lib/adapters/schema-a/demo-posts.ts`, que **não existe**. O arquivo real é `src/lib/demo/demo-posts.ts`.

---

## 1. Veredito

- **Nenhuma vulnerabilidade crítica ou alta** encontrada no núcleo de autorização de mídia do G4. A prova de autorização é a linha da publicação carregada via RLS; identidade vem da sessão verificada; `bucket`/`path` do cliente **não** concedem acesso; a credencial privilegiada é server-only e usada **somente após** a autorização.
- **20/20 verificações adversariais** executadas contra o stack local passaram (dados sintéticos, depois removidos).
- Achados **médios** são de *wiring/hardening*, não arquiteturais: (M1) validade da sessão = validade do JWT (sem revogação server-side); (M2) divergência de namespace de env entre middleware e handler.
- **C2 permanece ABERTO/BLOQUEADO** (buckets públicos + SELECT bucket-wide em `storage.objects`; URLs assinadas são portadoras). Nada aqui encerra C2 nem declara o Storage seguro.
- Gap de cobertura: os testes G4 exercitam a **camada de autorização/assinatura real** (RLS + service role), mas **não** o endpoint HTTP `getPostMediaUrl` nem o middleware `requireSupabaseAuth` ponta a ponta (runtime TanStack Start indisponível sob `bun test`). Ver §6.

---

## 2. Arquivos auditados (linhas citadas)

- `src/lib/media/media-url.functions.ts` — serverFn `getPostMediaUrl`.
- `src/lib/media/media-server-authorization.server.ts` — leitor RLS + assinatura service-role + montagem.
- `src/lib/media/media-authorization.ts` — decisão de autorização / TTL.
- `src/lib/media/media-contract.ts`, `media-path.ts` — normalização/validação de identidade.
- `src/lib/media/media-url-flag.ts` — flag e gate.
- `src/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` (gerado pelo Lovable, **não editado**).
- `src/integrations/supabase/remote/client.ts` — `createSchemaAClient`.
- Migração `supabase/migrations/20260925030806_schema_a_core.sql:755` — `posts_privacy_check`.

---

## 3. Comandos executados (segredos redigidos)

```text
# Baseline Git
git status --porcelain > /tmp/opencode/g4-1-git-before.txt   # 221 linhas (120 tracked, 101 untracked)

# Primitivo de token (script temporário fora do repo)
set -a; . /tmp/opencode/consol-keys.env; set +a
SUPABASE_URL=http://127.0.0.1:54321 ANON_KEY=[LOCAL_SECRET_REDACTED] \
  SERVICE_ROLE_KEY=[LOCAL_SECRET_REDACTED] bun run /tmp/opencode/g41-token.ts

# Bateria adversarial de autorização (script temporário fora do repo)
SUPABASE_URL=http://127.0.0.1:54321 ANON_KEY=[LOCAL_SECRET_REDACTED] \
  SERVICE_ROLE_KEY=[LOCAL_SECRET_REDACTED] bun run /tmp/opencode/g41-authz.ts

# Verificação estática de credencial privilegiada
grep -rn "integrations/supabase/client.server" src
grep -rn "supabaseAdmin\|SERVICE_ROLE\|client.server" src/lib/media/
grep -rl "SERVICE_ROLE\|service_role\|supabaseAdmin" .output/public

# Invocação do serverFn fora do runtime (prova do gap de cobertura)
bun run /tmp/opencode/g41-serverfn.ts

# Limpeza dos dados sintéticos (verificada)
docker exec -i supabase_db_lzejdgfvtybarpbgwsyp psql ...
```

Nenhuma flag `VITE_APP_SCHEMA_A_*` foi ativada; nenhum bucket/objeto/policy/migração foi criado ou alterado; nenhum acesso ao Supabase remoto.

---

## 4. Verificações obrigatórias (1–12)

### (1) `userId` apenas de sessão/JWT validado — ATENDE
`getPostMediaUrl` recebe **somente** `postId` + `locator` (schema Zod, `media-url.functions.ts:32-35`) e usa `viewerId: context.userId` (`:70`), que vem do middleware a partir de `data.claims.sub` (`auth-middleware.ts:93-101`). O corpo da requisição não influencia a identidade. `getMediaUrl` lê `getViewerId()` (nunca do cliente) e rejeita viewer nulo (`media-authorization.ts:157-158`).

### (2) `requireSupabaseAuth` não confunde claims com sessão/revogação — NÃO ATENDE (por design) → achado M1
O middleware verifica a **assinatura** do JWT via `supabase.auth.getClaims(token)` (`auth-middleware.ts:88`) e usa `claims.sub`. Não há checagem de estado de sessão/revogação server-side (`getUser()`/`auth.sessions`). Consequência: um access token válido continua aceito **após logout/revogação** até expirar.
- Evidência primitiva (`g41-token.ts`): token válido → `OK sub=MATCH`; assinatura adulterada → `ERROR(Invalid JWT signature)`; ausente/`""` → `sub=undefined` (bloqueado pelo guard `!data?.claims`); `aaa.bbb.ccc` → **thrown** `Invalid UTF-8 sequence` (não retorno de erro — ver L1).
- Classificado como **médio** (ver §5), não arquitetural.

### (3) Query da publicação usa RLS do usuário — ATENDE
`createSchemaARlsReader` usa o cliente por requisição autenticado com o bearer verificado (`media-server-authorization.server.ts:37-46`), **não** a service role. Provado adversarialmente: B não enxerga a linha `PRIVATE` de A (attack2) e A enxerga a própria linha (attack2b).

### (4) Autorização de conexão com identidade confiável e atual — ATENDE
`areConnected` consulta `connections` via RLS por requisição, com `viewerId` de claims e `authorId` da **linha** (`:47-56`), e só é consultado quando `privacy === "CONNECTIONS"` e o autor ≠ viewer (`media-authorization.ts:170-176`). Provado: desconectado→`forbidden`; conectado→`ready`; reconectado/revogado→`forbidden` (attack5/5b/5c).

### (5) `bucket`/`path` assinados derivam da mídia persistida — ATENDE
A identidade do cliente é apenas **localizador**; a fonte de verdade é `normalizePostMedia(post.media)` e a validação reusa `validateMediaPath` com `ownerId === post.author_id` (`media-authorization.ts:97-124`). Provado: linha de B referenciando objeto de A → `forbidden` (attack1); identidade não registrada → `missing` (attack3).

### (6) Service role server-only, ausente do bundle, sem assinar antes de autorizar — ATENDE
- Única referência a `client.server` é **import dinâmico** dentro de `*.server.ts` (`media-server-authorization.server.ts:69`). Nenhum import estático; `media-url.functions.ts` não referencia service role.
- Assinatura ocorre somente após `authorizeMediaAccess` retornar `allowed` (`media-authorization.ts:178-186`).
- Nenhuma URL/token é logado (`MediaSignResult` só é retornado; comentário em `:21`).
- Verificação estática do bundle público (`.output/public`, **artefato antigo do G4** — pré-G4, ver §7): nenhuma ocorrência de `SERVICE_ROLE|service_role|supabaseAdmin` nem do módulo de assinatura.

### (7) Tratamento de erros — ATENDE
- Publicação inexistente **ou** não autorizada ⇒ ambos `forbidden` (não revela existência, `media-authorization.ts:166-167`).
- Mídia ausente/incompleta ⇒ `missing` **após** autorização; para viewer não autorizado ⇒ `forbidden` antes do lookup (attack7d).
- Privacidade inválida ⇒ `canViewPost` default `false` **e** `posts_privacy_check` no banco rejeita o valor (attack6).
- Erro de `loadPost`/`areConnected`/`sign` ⇒ `unavailable` (sem propagar stack/URL). attack8: signer lança → `unavailable`, sem vazamento.

### (8) TTL / cache / reuso entre usuários — ATENDE com ressalva (dependente de C2)
TTL é limitado no servidor (60–300s) e re-capeado (`media-authorization.ts:39-53,151,191-193`). Não há cache no endpoint; cada serviço é criado por requisição com `viewerId` fixo. **Ressalva**: a URL assinada é **portadora** — qualquer um que a possua baixa o objeto (attack9b comprovou fetch sem sessão). Isso é a lacuna já rastreada em C2, não um defeito novo do G4.

### (9) Revogação (desconexão/privacidade/logout) — PARCIAL
- Novas assinaturas refletem o estado atual: desconexão e mudança de privacidade ⇒ `forbidden` (attack5/5c, attack2b).
- URLs **já emitidas** permanecem válidas até expirar (portadoras) — inerente ao modelo de assinatura, ver C2.
- **Logout**: token não expirado continua aceito (M1). Separar "novas assinaturas" (correto) de "URLs já emitidas" (válidas até o TTL) é a recomendação.

### (10) Round-trip D-M1 — ATENDE
`normalizePostMedia` preserva itens com `(bucket,path)` mesmo sem `preview` (`media-contract.ts:137-173`); `mediaToJson` emite identidade só quando presente e `mediaFromJson` normaliza. Já coberto por `tests/media-adapter-dm1-g4.test.ts` (10 pass) e pelos casos adversariais 3/7/7b/7c.
Ressalva menor (L3): o adapter persiste strings de identidade sem validá-las; a validação ocorre no momento de servir.

### (11) Regressões `profiles.photo_url`, `bio_posts.media_url`, `reels.video_url`/`poster_url` — ATENDE
Somente `src/lib/adapters/schema-a/content.ts` e `src/lib/demo/demo-posts.ts` foram alterados no G4; nenhuma lógica de assinatura foi introduzida nesses caminhos legados. Suíte completa verde (§6).

### (12) Testes exercitam HTTP + validação de token? — NÃO (gap registrado)
Os testes G4 exercitam `createServerMediaUrlService` (autorização + assinatura reais, com RLS e service role). **Não** exercitam `getPostMediaUrl` nem o middleware HTTP:
```
import OK, keys: [ "getPostMediaUrl" ]
FAILED: No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.
```
O primitivo de token foi testado isoladamente (§4.2). Portanto a fiação de transporte/token é verificada **estaticamente + no primitivo**, não ponta a ponta.

---

## 5. Riscos por gravidade

| ID | Gravidade | Achado | Evidência |
|----|-----------|--------|-----------|
| M1 | Médio | Validade da sessão = validade do JWT; `getClaims` não checa revogação. Token não expirado segue válido após logout/revogação. | `auth-middleware.ts:88-95`; `g41-token.ts` |
| M2 | Médio | Namespace de env divergente: middleware lê `VITE_APP_SUPABASE_URL`; handler lê `APP_SUPABASE_URL \|\| VITE_APP_SUPABASE_URL`. Se divergirem, o token é validado em um projeto e o RLS em outro → falha **fechada** (`forbidden`), mas endpoint inoperante; falta de uma das vars → 500. | `auth-middleware.ts:36-37`; `media-url.functions.ts:38-40` |
| L1 | Baixo | Token de 3 segmentos malformado faz `getClaims` **lançar** (`Invalid UTF-8 sequence`) em vez de retornar erro; middleware não captura → erro não tratado (fecha, mas higiene ruim). | `g41-token.ts` |
| L2 | Baixo | Extração de token duplicada: middleware já entrega `context.supabase`, mas o handler relê o bearer e cria um 2º cliente. Sem impacto de segurança. | `media-url.functions.ts:60-70` |
| L3 | Baixo | Adapter grava identidades sem validar (`mediaToJson`); validação só no servir. Higiene de dados. | `content.ts` |
| — | Info | `missing` vs `forbidden` só distingue **após** autorização; viewer não autorizado recebe `forbidden` antes do lookup. | attack7d |
| — | Info | `posts_privacy_check` (CHECK) é defesa-em-profundidade para `canViewPost` default-false. | `20260925030806_schema_a_core.sql:755` |

Nenhum achado exige **correção arquitetural**; M1/M2 são de hardening/configuração.

---

## 6. Testes adversariais executados (resultado real)

**Primitivo de token** (`g41-token.ts`):
```
valid => OK sub=MATCH
tampered-signature => ERROR(Invalid JWT signature)
malformed-3parts => THREW Error: Invalid UTF-8 sequence
empty-string => OK sub=undefined
undefined => OK sub=undefined
header.payload-only => ERROR(Invalid JWT structure)
guard(undefined/empty/garbage/2parts): rejected ; guard(valid): passed-guard
```

**Bateria de autorização** (`g41-authz.ts`) — **20 pass / 0 fail**:
```
attack1  B-row-with-A-path (owner mismatch) ........ forbidden
attack2  B-client+A-viewer on PRIVATE (RLS) ........ forbidden
attack2b A-client+B-viewer on PRIVATE .............. forbidden
attack3  unregistered path .......................... missing
attack4  anonymous .................................. forbidden
attack5  disconnected ............................... forbidden
attack5b connected .................................. ready
attack5c revoked again .............................. forbidden
attack6  invalid privacy rejected at DB ............. true   (posts_privacy_check)
attack7  no-identity media -> no signature .......... true
attack7b non-array media -> no signature ............ true
attack7d unauthorized viewer on malformed media ..... forbidden
attack7c missing object ............................. true
attack8  signer throw -> unavailable ................ unavailable
attack8b no result url leak ......................... true
attack9  owner PRIVATE ready ........................ ready
attack9b anyone with URL can fetch it (bearer) ...... true    (dependência C2)
attack9c B still cannot get a new signature ......... forbidden
attack10 owner service ready ........................ ready
attack10b other service forbidden ................... forbidden
```

Suítes de referência (já verdes no G4): mídia unit 60, adapter D-M1 10, integração G4 12, G3 10; suíte total 1071 pass / 46 skip / 0 fail.

**Nota operacional de teste**: `supabase.auth.admin.deleteUser` falhou localmente com erro opaco porque não há `ON DELETE CASCADE` de `profiles`/`profile_private` para `auth.users`. Isso afeta o harness de teste (não o código G4). Limpeza concluída via SQL na ordem: `storage.objects` (Storage API), `posts`, `connections`, `profile_private`, `profiles`, `auth.identities`, `auth.sessions`, `auth.users`.

---

## 7. Estado do repositório / artefatos

- **Arquivos de código criados/alterados nesta auditoria**: **nenhum**.
- **Scripts de teste**: criados fora do repo, em `/tmp/opencode/` (`g41-token.ts`, `g41-authz.ts`, `g41-serverfn.ts`, `g41-cleanup.ts`).
- **Dados sintéticos**: todos removidos e verificados (`g41%@local.test` users = 0; posts `g41`/`g41 synthetic` = 0; `profiles` órfãos = 0; objetos `bio-media` recentes = 0).
- **Build**: `.output` é **stale** (mtime 2026-10-09, anterior ao G4 de 2026-10-12) e está em `.gitignore`. A varredura do bundle é evidência fraca; **nenhum build novo foi gerado** (evitando alterar estado).
- **Git**: HEAD `16f8c6b` e branch inalterados; delta final = apenas o presente relatório.

---

## 8. Conclusão

O núcleo de autorização de mídia do lote G4 está **correto contra os testes adversariais locais** executados: identidade só da sessão verificada, prova de acesso = linha sob RLS, sem confiar em `bucket`/`path`/`author_id`/`viewer_id` do cliente, credencial privilegiada server-only e pós-autorização, e sem vazamento de metadados em erros. Restam achados **médios** de hardening/configuração (M1 sessão/revogação; M2 namespace de env), **baixos** (L1–L3) e o **gap de cobertura** do endpoint HTTP (item 12).

**C2 permanece ABERTO/BLOQUEADO** e **este relatório não encerra o C2 nem declara o Storage seguro**. Não foram feitas alterações de código; nenhuma falha exigiu correção arquitetural. Aguardando revisão antes de qualquer lote seguinte.
