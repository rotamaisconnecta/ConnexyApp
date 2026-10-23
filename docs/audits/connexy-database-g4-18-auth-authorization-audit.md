# Connexy — G4.18: Auditoria estática de autenticação e autorização da mídia

## 1. Veredito geral

**APROVADO COM RESSALVAS (estática)** para o desenho de autenticação/autorização do endpoint `getPostMediaUrl`, e **REPROVADO** para a confidencialidade de mídia no nível do Storage (buckets públicos), já conhecida como **C2**.

- **Autenticação:** o fluxo é coerente e fail-closed por construção. A identidade vem exclusivamente de um JWT `Bearer` validado no servidor (`auth.getClaims` → verificação de assinatura via JWKS/`getUser` + checagem de `exp`), e a identidade usada na autorização é `claims.sub` — nunca um `userId`/`viewerId` do cliente. A G4.17 comprovou empiricamente que a ausência de credencial é rejeitada no middleware, **antes** do validator e do handler.
- **Autorização:** a prova é a **linha** carregada sob RLS (`posts_select_privacy`) e revalidada em código (`canViewPost` + `authorizeMediaAccess`). `bucket`/`path` do cliente são apenas localizadores e precisam **coincidir** com a mídia registrada na publicação e ser **de propriedade do autor**. PUBLIC **não** significa acesso anônimo ao endpoint (exige auth), porém **é** amplamente acessível via URL pública do Storage (lacuna C2).
- **Assinatura:** ocorre somente **após** a autorização, com service role **server-only** (import dinâmico em `*.server.ts`), TTL limitado a 60–300 s. A credencial privilegiada não aparece no bundle do cliente (verificado em `.output/public`).

**Não classificado como seguro** o que depende de teste ainda não executado: aplicação real de RLS com bearer, assinatura real via service role, verificação JWKS em runtime e o fechamento da lacuna de bucket público. Essas são as lacunas remanescentes.

---

## 2. Evidências de autenticação

### 2.1 Origem do token e da sessão
- O token chega no header HTTP `authorization: Bearer <jwt>`, lido em `src/lib/supabase/auth-middleware.ts:140` (`request.headers.get("authorization")`).
- No navegador, o header é anexado por `attachAppSupabaseAuth` (`src/lib/supabase/auth-attacher.ts:15-22`): `supabase.auth.getSession().access_token` → `Authorization: Bearer <token>`. Registrado como `functionMiddleware` global em `src/start.ts:26`.
- O servidor **não** lê token/sessão de cookie, corpo ou query. No handler, o token é re-lido do mesmo header (`src/lib/media/media-url.functions.ts:42-47,54-56`) e o mesmo bearer é reutilizado para o cliente RLS por requisição.

### 2.2 Validação do token
`verifySupabaseBearer` (`src/lib/supabase/auth-middleware.ts:78-118`):
- `:85-87` ausência de header → `Unauthorized: No authorization header provided`.
- `:89-91` não-`Bearer` → `Unauthorized: Only Bearer tokens are supported`.
- `:93-96` token vazio → `Unauthorized: No token provided`.
- `:98-100` token sem 3 partes (`a.b.c`) → `Unauthorized: Invalid token` (rejeita cedo valores que não são JWT).
- `:102` cria cliente Supabase com a **publishable key** + `Authorization: Bearer <token>`.
- `:104` `supabase.auth.getClaims(token)` — **verificação criptográfica server-side**.
- `:105-111` `error`/sem `claims` → `Unauthorized: Invalid token`; sem `claims.sub` → `Unauthorized: No user ID found in token`.

Verificação em `node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:5321-5390`:
- `:5331` decodifica o JWT; `:5336` `validateExp(payload.exp)` rejeita expirado;
- `:5347` busca a JWK por `kid` (`fetchJwk`) e `:5366-5370` valida a **assinatura** com `crypto.subtle.verify` → `AuthInvalidJwtError('Invalid JWT signature')` se inválida;
- fallback `:5350` `getUser(token)` (validação no GoTrue) quando alg ou `kid` são simétricos/indisponíveis.
- Ou seja: assinatura e expiração são verificadas; um JWT forjado ou de outro projeto é rejeitado. **Observação:** `getClaims` não faz checagem explícita de `aud`/`iss`; a garantia vem da JWKS do projeto configurado (`resolveServerSupabasePublicConfig`) — aceitável, registrado como nota.

### 2.3 Identidade derivada de credencial verificada
- `requireAppSupabaseAuth` (`src/lib/supabase/auth-middleware.ts:122-145`): resolve a config pública (`:127`), pega a requisição (`:134`), lê o header (`:140`), chama `verifySupabaseBearer` (`:141`) e injeta `next({ context: verified })` (`:143`).
- `context.userId = claims.sub` (`:113-117`) → usado como `viewerId` no serviço (`src/lib/media/media-url.functions.ts:63`; `media-server-authorization.server.ts:81,92`).
- **Não existe** caminho em que `viewerId`/`userId` venham do cliente. O schema de entrada aceita somente `postId` + `locator` (`media-url.functions.ts:21-36`).

### 2.4 Falha interrompe antes de acesso privilegiado
- Ordem: middleware → `validator` (zod) → `handler` (`media-url.functions.ts:49-64`). Exceções do middleware propagam antes do validator/handler.
- Comprovado empiricamente na G4.17: requisição anônima → HTTP 200 com nó `$TSR/Error` `"Unauthorized: No authorization header provided"`, `result === undefined`; execução atingiu o middleware e **não** o handler.

### 2.5 Erros não revelam detalhes internos
- Mensagens genéricas e estáveis (`Unauthorized: ...`), sem stack/causa ao cliente. O `ShallowErrorPlugin` serializa apenas `message` (G4.17 §4).
- O erro de configuração nomeia **variáveis** ausentes, não valores (`external-env.ts:84-88`); log server-side `console.error(`[Supabase] ${message}`)` sem segredos (`auth-middleware.ts:130`).

---

## 3. Matriz de autorização (por privacidade e cenário)

Base legal: RLS `posts_select_privacy` (`supabase/migrations/20260925030806_schema_a_core.sql:762-768`) e revalidação em código `canViewPost` (`src/lib/media/media-authorization.ts:56-67`) + `authorizeMediaAccess` (`:78-125`).

| Cenário | Caminho | Resultado esperado | Fundamento |
| --- | --- | --- | --- |
| Sem credencial (anônimo) | — | erro de auth (barrado antes do handler) | `auth-middleware.ts:85-87`; G4.17 |
| PUBLIC, qualquer viewer autenticado, item canônico presente | RLS vê a linha; `canViewPost` true | `ready` (após flag/auth) | policy `privacy='PUBLIC'`; `canViewPost:63` |
| PUBLIC, anônimo via URL pública do Storage | fora do endpoint | **acesso direto ao objeto** | buckets `public=true` (C2) |
| CONNECTIONS, viewer conectado | RLS `are_connected` true | `ready` | policy `:767`; `canViewPost:65` |
| CONNECTIONS, viewer não conectado | linha invisível / `areConnected` false | `forbidden` | `:763-768`; `canViewPost` |
| PRIVATE, dono | `author_id = uid` | `ready` | policy `author_id = auth.uid()`; `canViewPost:64` |
| PRIVATE, não dono | linha invisível | `forbidden` | idem |
| Publicação inexistente | `loadPost` → `null` | `forbidden` (indistinto) | `media-authorization.ts:167` |
| Publicação excluída | sem soft-delete; linha removida → `null` | `forbidden` (indistinto) | tabela `posts` sem `deleted_at`; `:167` |
| `locator.identity` com `(bucket,path)` arbitrário/inexistente na linha | `findMediaItem` → `null` | `missing` | `media-authorization.ts:110` |
| `locator.identity` com path de outro autor | `validateMediaPath(...).ownerId !== author_id` | `invalid-ref` → `forbidden` | `:120-123` |
| bucket fora da whitelist / incompatível com o tipo | `isMediaBucket`/`bucketSupportsKind` | filtrado/`invalid-ref` | `:99-118`; `media-contract.ts:79-95,211-213` |
| `locator.index` inválido | `Number.isInteger`/limites | `invalid-ref` | `:105-109` |
| Tentar injetar identidade no corpo | não há campo de identidade | ineficaz | `media-url.functions.ts:33-36` |
| `are_connected` / `loadPost` falha (erro de consulta) | catch | `unavailable` (fail-closed) | `:163-165,171-175` |
| Flag de mídia OFF ou Auth remoto OFF | `isMediaUrlSigningEnabled()` false | `unavailable` (sem `sign`) | `:155`; `media-url-flag.ts:27-30` |

Conclusões: a autorização é derivada de dados confiáveis (linha + RLS), revalidada em profundidade, e falha fechada. Contornar via `postId`/bucket/path/identidade fornecidos pelo cliente **não** concede acesso. A exceção é o acesso direto ao objeto no Storage (linha abaixo e §5).

---

## 4. Auditoria de assinatura, service role, TTL e cache

### 4.1 Autorização antes da assinatura
- `createMediaUrlService.getMediaUrl` (`media-authorization.ts:154-196`): gate → viewer → `loadPost` → (se CONNECTIONS) `areConnected` → `authorizeMediaAccess` → **somente então** `deps.sign(decision.object, ttlSeconds)` (`:184-189`).
- `decision.object` é derivado da linha autorizada, não do request (`:112-124`).

### 4.2 Service role
- `signMediaWithServiceRole` (`media-server-authorization.server.ts:65-75`): `await import("@/integrations/supabase/client.server")` **dentro** da função e `.storage.from(object.bucket).createSignedUrl(object.path, ttlSeconds)`.
- `client.server.ts:32-56`: lê `process.env['SUPABASE_URL']` e `process.env['SUPABASE_SERVICE_ROLE_KEY']` (sem prefixo `VITE_`), `client.server.ts:64-69` Proxy com criação lazy; banner "não expor ao cliente".
- Únicos importadores de `supabaseAdmin`/`client.server`: `media-server-authorization.server.ts:69` (confirmado por busca). Único chamador de `signMediaWithServiceRole`: o próprio serviço (`:95`).
- Verificação do bundle: `grep -rl "SUPABASE_SERVICE_ROLE_KEY\|service_role" .output/public` → **nenhum** resultado.

### 4.3 Bucket/path derivados de dados confiáveis e validação
- `bucket` ∈ whitelist `{avatars,bio-media,reels-media}` (`media-path.ts:12-22`); `bucketSupportsKind` casa bucket×tipo (`media-contract.ts:211-213`).
- `validateMediaPath` (`media-path.ts:59-85`): rejeita absoluto, `..`, `\`, segmento vazio, octeto codificado (`%xx`), caracteres de controle; exige 1º segmento = UUID e extensão válida. Aplicado na classificação da linha e novamente na autorização.
- `ownerId === post.author_id` obrigatório (`media-authorization.ts:121`). Isso impede path traversal, bucket arbitrário e referência cruzada entre publicações.

### 4.4 TTL
- Limites em `media-authorization.ts:39-41`; `clampMediaUrlTtl` (`:44-53`) força inteiro em `[60,300]`, default 300; aplicado em `:151` e passado a `sign` (`:186`); `expiresAt` capado por `min(signed.expiresIn, ttlSeconds)` (`:192-193`).
- Cliente capa de novo em 300 s (`post-media-resolver.ts:108,126`).

### 4.5 Cache, invalidação e concorrência
- Não há cache no endpoint; cada chamada assina de novo.
- Cache do cliente (`media-resolver.ts`) é escopado: `cacheKey = `${scope}\u0000${bucket}/${path}`` (`:131-133`) com `scope = viewerId` (`use-secure-post-media-url.ts:77`). Troca de usuário não reutiliza URL de outro.
- In-flight dedup por chave escopada (`:157-189`); geração compartilhada por `Map` (`:108-119`) impede repopulação após `invalidate*`.
- **Ressalvas:** (a) URL assinada é credencial portadora — mudança de privacidade/desconexão **não revoga** URLs já emitidas (válidas até o TTL ≤300 s); (b) não há rate limiting no endpoint.

---

## 5. Vulnerabilidades, lacunas e hipóteses não comprovadas

1. **[Alta — C2] Buckets públicos e leitura bucket-wide.** `avatars`, `bio-media`, `reels-media` têm `public = true` (`supabase/migrations/20260816120000_create_avatars_bucket.sql:7-18`; `20261009120000_ensure_bio_reels_storage_buckets.sql:18-42`). A leitura é por bucket: `avatars` sem `TO` (efetivamente `public`) (`20260816120000:23-25`); `bio-media`/`reels-media` `TO authenticated` mas **sem** filtro por linha (`20260825025605...:3-10`). Logo, qualquer objeto é acessível fora da autorização por linha (inclusive via `/object/public/`), tornando a privacidade `PRIVATE`/`CONNECTIONS` **não** garantida para acesso direto. Fechamento depende de C2 (buckets privados + revogação da SELECT + assinatura). Já registrado no lote G4.
2. **[Média] URL assinada não revogável.** Janela de até 300 s após mudança de privacidade/desconexão/exclusão.
3. **[Baixa] Sem rate limiting** no endpoint; abuso de assinatura é limitado apenas pelo TTL.
4. **[Baixa] Divergência de namespace de env.** `isPublicSupabaseConfigured()` lê `import.meta.env.VITE_APP_*` (`src/lib/supabase/config.ts:12-17`), enquanto o middleware resolve `APP_*` > `VITE_APP_*` (`external-env.ts:102-106`). Se apenas `APP_*` estiver definido no servidor, `isRemoteAuthEnabled()`/`isMediaUrlSigningEnabled()` podem ser `false` → `unavailable` (fail-closed), mas a config de auth ainda resolve. Coerência de wiring a consolidar.
5. **[Baixa] Interpolação no filtro PostgREST.** `areConnected` monta `.or(\`and(user_a_id.eq.${viewerId},...\`)` (`media-server-authorization.server.ts:51-53`). `viewerId` (claims.sub) e `authorId` (coluna uuid) são UUIDs verificados, sem `,`/`)`, então não há injeção prática. Recomenda-se padronizar via `canonicalUserPair`/queries parametrizadas.
6. **[Informativa] `getClaims` não valida `aud`/`iss`** explicitamente; confia na JWKS do projeto configurado.
7. **[Informativa] Divergência documental.** O relatório-fonte `docs/audits/lote-g4-local-server-side-media-authorization.md` descreve `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`), mas o endpoint usa o middleware **project-owned** `requireAppSupabaseAuth` (`src/lib/supabase/auth-middleware.ts`), equivalente e centralizado em `external-env`. Sem impacto funcional.

### Hipóteses NÃO comprovadas (não classificar como seguras)
- Aplicação real de `posts_select_privacy`/`connections_select_party` com o bearer do usuário (RLS end-to-end).
- Verificação JWKS/`getUser` de fato ocorrendo no runtime (depende de rede ao projeto externo).
- Assinatura real via service role (presença de `SUPABASE_SERVICE_ROLE_KEY` no runtime e TTL efetivo).
- Comportamento da lacuna C2 (que `/object/public/` contorna a autorização) no ambiente remoto.

---

## 6. Pré-requisitos e matriz proposta para o futuro teste autenticado

**Sem executar agora.** Restrições: não fazer login/obter tokens nesta fase.

### 6.1 Como obter sessão de teste legítima sem compartilhar credenciais com o agente
- Usar um **projeto Supabase de teste autorizado** (o futuro `rsukwuqocgjmwwuwtqaf`), nunca o de produção.
- Criar usuários **sintéticos** via Admin API/SQL local (`auth.users` + `profiles`), com e-mails de teste e senhas geradas no ambiente do operador.
- O operador executa o login **localmente** e passa ao agente **apenas o resultado da requisição HTTP** (status/corpo), nunca a senha, o token ou o `SUPABASE_SERVICE_ROLE_KEY`. Alternativamente, gerar o `Authorization: Bearer` no ambiente do operador e invocar o runtime local; o token não deve ser escrito no relatório.

### 6.2 Como confirmar que a identidade corresponde ao usuário esperado
- Decodificar o JWT (sem expor o token) e conferir `sub` == UUID do usuário de teste esperado.
- Buscar `profiles.id`/`handle` do usuário sintético e compará-los; registrar apenas o UUID sintético.

### 6.3 Cenários positivos e negativos (matriz proposta)
| # | Publicação | Ator | Esperado |
| --- | --- | --- | --- |
| P1 | PUBLIC | dono | `ready` |
| P2 | PUBLIC | conectado | `ready` |
| P3 | PUBLIC | não conectado autenticado | `ready` |
| P4 | CONNECTIONS | dono | `ready` |
| P5 | CONNECTIONS | conectado | `ready` |
| P6 | PRIVATE | dono | `ready` |
| N1 | CONNECTIONS | não conectado | `forbidden` |
| N2 | PRIVATE | não dono | `forbidden` |
| N3 | qualquer | anônimo | erro de auth (barrado) |
| N4 | inexistente | autenticado | `forbidden` |
| N5 | qualquer | bucket/path de outro post | `missing`/`forbidden` |
| N6 | qualquer | path com `..`/absoluto/`%2e` | `forbidden` |
| N7 | qualquer | token expirado/adulterado | erro de auth |
| N8 | flag OFF | qualquer | `unavailable` (sem assinatura) |

### 6.4 Como verificar que nenhuma URL é emitida para não autorizados
- Para cada negativo: exigir `status ∈ {forbidden,missing,unavailable}` e **ausência** de `url` no nó `ready`; desserializar a resposta cross-JSON (G4.16) e afirmar `result.status !== "ready"`.
- Para positivos: exigir URL com token de assinatura e `expiresAt − now ∈ [60,300]`; verificar que a URL aponta para o mesmo `(bucket,path)` autorizado.
- Prova adicional de isolamento: repetir P com o mesmo objeto e atores distintos; confirmar que o cache (escopo `viewerId`) não devolve URL de outro ator.

### 6.5 Como evitar dados pessoais/mídias reais
- Usuários 100% sintéticos (`g4-a`, `g4-b`), sem nomes/e-mails reais.
- Mídia sintética (ex.: PNG 1×1 gerado) gravada em pasta sintética dentro dos buckets existentes; limpeza após o teste.
- Nunca usar objetos, paths ou posts reais.

### 6.6 Limitações que permanecerão sem validação remota
- Segurança do Supabase **de produção** e a lacuna C2 (fechamento de buckets).
- Comportamento de CDN/cache de borda e invalidação.
- Cotas/limites do provedor (rate limiting, tamanho).

---

## 7. Estado do Git

| Momento | HEAD | Branch | `git status --short` |
| --- | --- | --- | --- |
| Antes desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 258 entradas |
| Depois desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 258 + este relatório (G4.18) |

- Delta **desta fase**: apenas `docs/audits/connexy-database-g4-18-auth-authorization-audit.md` (novo).
- As 258 entradas preexistentes (incluindo o relatório G4.17) foram **preservadas**; nenhum `reset`/`clean`/`checkout`/commit/push.
- Nenhuma alteração de código de aplicação, testes existentes, dependências, configurações, `.env`/`.env.local`, migrations, lockfiles ou flags.

---

## 8. Confirmação de ausência de runtime, requisições e operações remotas

- **Nenhum runtime iniciado** (Wrangler/workerd não executados); `pgrep` confirmou zero processos.
- **Nenhuma requisição HTTP** e **nenhuma** chamada ao Supabase remoto.
- **Nenhum** login, token, cookie ou credencial produzido/coletado; nenhum segredo impresso (apenas nomes de variáveis, como `SUPABASE_SERVICE_ROLE_KEY`).
- **Nenhuma** migração/SQL executados; `VITE_APP_SCHEMA_A_MEDIA_URL` permanece **desligada**.
- Análise realizada por leitura estática de código, migrations e bundle `.output/public` (verificação de não vazamento da service role).
