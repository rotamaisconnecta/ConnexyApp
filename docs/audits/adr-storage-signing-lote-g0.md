# ADR — Lote G0: decisão arquitetural de Storage (emissão de URLs assinadas)

- **Data:** 2026-10-12
- **Ferramenta:** OpenCode + Big Pickle (leitura de código/SDK, DB local somente-leitura, documentação).
- **Tipo:** nota de decisão arquitetural. **Somente documentação.** Sem implementação funcional.
- **Herdado:** `adr-bio-posts-to-posts.md` (D1/D2 aprovados), `lote-f-storage-inventory.md`,
  `relatorio-consolidado-a-l.md`; Fase 10 (PoC RLS + URL assinada).
- **STATUS:** **DECISÃO PROPOSTA — IMPLEMENTAÇÃO NÃO INICIADA. BLOQUEADA por autorização + pré-requisitos.**
- **Restrições respeitadas:** sem acesso ao Supabase remoto; sem comandos Supabase; sem criar endpoints;
  sem service role; sem alterar buckets/políticas/migrations/flags/UI/demo; sem commits/push.
- **Convenção:** **Fato** = lido no código/SDK/migrations/DB local. **Hipótese** = não comprovado aqui.
  **Pendente** = exige decisão/autorização.

---

## 0. Contexto e objetivo

Fechar os bloqueios do reconhecimento do Lote G antes de implementar emissão de URLs assinadas:
definir **onde** ocorre a autorização, **com qual credencial** se assina, e **como** evitar que a
sessão autenticada contorne a privacidade da publicação.

---

## 1. Evidências e arquivos examinados

### 1.1 Sessão e clientes Supabase

| Arquivo | Papel | Fatos |
| --- | --- | --- |
| `src/integrations/supabase/client.ts` | cliente de navegador | `createBrowserClient` (`@supabase/ssr`), cookie `sb-auth-token`, `persistSession:true`, roda RLS como o usuário |
| `src/lib/supabase/server.server.ts` | cliente SSR por requisição | `createServerClient` (`@supabase/ssr`), sessão por **cookie**, roda RLS como o usuário; **sem** service role; `createServerSupabaseClient()` |
| `src/integrations/supabase/auth-middleware.ts` | middleware de serverFn | `requireSupabaseAuth` = `createMiddleware({type:"function"}).server`; monta cliente com **publishable key** + `Authorization: Bearer <token>` do header; `persistSession:false`; valida via `auth.getClaims(token)`; injeta `{ supabase, userId, claims }` no contexto |
| `src/lib/supabase/auth-attacher.ts` | attacher de serverFn | `attachAppSupabaseAuth` (client middleware) anexa o Bearer da sessão; registrado em `src/start.ts` (`functionMiddleware`) |
| `src/integrations/supabase/client.server.ts` | cliente privilegiado | `supabaseAdmin` = service role key, **ignora RLS**, server-only. **Fato: não é importado em nenhum lugar do app** (só definido) |
| `src/integrations/supabase/remote/client.ts` | cliente Schema A | `createSchemaAClient(url,key,{accessToken})`; o token é passado via `global.headers.Authorization` (não pela opção `accessToken`); `requireAuthUserId` usa `auth.getUser()` |
| `src/routes/auth_/callback.tsx` | rota de servidor | troca `code`→sessão por cookie com `createServerSupabaseClient` |

**Fato:** os serverFns já usam o client SSR por cookie para rodar **RLS como o usuário**
(`identity.ts`, `profile-status.ts`, `admin-access.ts`, `sign-out.ts`, `auth_.callback.tsx`).
`requireSupabaseAuth` (bearer) **não é usado por nenhum serverFn hoje**.

### 1.2 RLS de `posts` e `are_connected` (fato — DB local)

- Privilégios de `posts`: apenas `authenticated`, `postgres`, `service_role`. **`anon` sem GRANT**
  → negado por privilégio antes do RLS.
- `posts_select_privacy` (authenticated): `privacy='PUBLIC' OR author_id=auth.uid() OR
  (privacy='CONNECTIONS' AND are_connected(auth.uid(), author_id))`.
- `are_connected(p_user_a,p_user_b)`: `STABLE SECURITY DEFINER`, `search_path=''`, retorna boolean
  via `least/greatest` sobre `connections`. Não vaza linhas.

### 1.3 Storage (fato — SDK instalado + DB local)

- `@supabase/supabase-js` e `@supabase/storage-js` **2.111.0**.
- `StorageFileApi.createSignedUrl(path, expiresIn, options?)` e `createSignedUrls(paths[], expiresIn)`
  **existem**. Documentação do SDK (fonte local): exigem **`objects`: SELECT** em RLS. As URLs
  assinadas retornadas têm a forma `/object/sign/{bucket}/{path}?token=…`.
- **Buckets** (`storage.buckets`): `avatars`(public=t), `bio-media`(public=t), `reels-media`(public=t).
- **Policies `storage.objects` (SELECT) são por bucket, NÃO por objeto/dono:**
  - `avatars`: `Avatars public read` (roles=public) **e** `Avatars authenticated read` (authenticated) — ambas `bucket_id='avatars'`.
  - `bio-media`: `Bio media authenticated read` — `bucket_id='bio-media'`.
  - `reels-media`: `Reels media authenticated read` — `bucket_id='reels-media'`.
  - INSERT/UPDATE/DELETE são owner-folder (`foldername[1]=auth.uid()`), o que protege **escrita**.
- `StorageHelper` (`src/lib/supabase/storage.ts`) expõe apenas `upload/getPublicUrl/remove/list` —
  **sem `createSignedUrl`**.

### 1.4 Arquitetura de mídia (herdada do Lote F)

Fluxos e formatos: `lote-f-storage-inventory.md` §1.4. Resumo: `avatars` (path Schema A / URL pública /
URL assinada ~5 anos), `bio-media` (URL pública), `reels-media` (path relativo), `posts.media`
(`{preview,type,mediaId}` sem URL remota). **Sem resolver path→URL** e **sem `createSignedUrl`**.

---

## 2. Investigação A — Autorização (resultado)

**Pergunta:** a sessão autenticada pode consultar a publicação, respeitar RLS e solicitar URL
assinada **sem service role**?

**Resposta, por etapa:**

1. **Consultar `posts` sob RLS sem service role — [FATO/COMPROVADO no código].**
   `createServerSupabaseClient()` (cookie, RLS-as-user) já é o padrão dos serverFns (ex.:
   `profile-status.ts` consulta `profiles` com `.eq("id", userId)`). Logo, um serverFn pode
   selecionar o `posts` por `id` e o RLS `posts_select_privacy` garante que só retorna linha
   autorizada. `requireSupabaseAuth` (bearer) é alternativa equivalente e disponível.

2. **Solicitar URL assinada com a sessão — [HIPÓTESE NÃO VALIDADA].**
   `createSignedUrl` exige `objects: SELECT`. As policies SELECT desses buckets são **por bucket**
   (qualquer `authenticated`), então a assinatura com o client do usuário tende a funcionar para
   **qualquer path**, mas **não comprova** autorização por publicação. **Não executado aqui** (sem
   operações Supabase), portanto permanece hipótese.

3. **Conclusão A:** a sessão **pode** verificar a publicação sob RLS, **mas** as policies de Storage
   **não** conseguem expressar privacidade por publicação. Portanto, autorização de leitura de `posts`
   **não** implica autorização de mídia; e assinar com a sessão do usuário **não** é, por si só, um
   controle de privacidade — permitiria assinatura em âmbito de bucket inteiro (bypass direto pela API
   de Storage, sem passar pela UI).

**Fato adicional:** `supabaseAdmin` existe e ignora RLS, mas **não está em uso** — introduzi-lo cria
uma nova superfície privilegiada que deve ficar estritamente no servidor.

---

## 3. Investigação B — Mídias públicas existentes

Referência completa em `lote-f-storage-inventory.md` (§1.4). Impactos por bucket **se tornar privado**:

| Bucket | Referências públicas persistidas | Formatos | Consumidores | Se `public=false` (impacto) |
| --- | --- | --- | --- | --- |
| `avatars` | `profiles.photo_url` (URL pública via `bio-avatar`; URL assinada ~5 anos via `completar-perfil` legado; **path** via Schema A) | URL/path | `<img>` cru em perfil/pessoas/feed | URLs `/public/` antigas **quebram**; paths Schema A **nunca** funcionaram; exigirá resolver path→URL assinada |
| `bio-media` | `bio_posts.media_url` (**URL pública completa**) | URL | `<img>` em perfil/bio; MCP retorna cru | URLs antigas **quebram**; necessário reescrever referência e reexibir via assinatura |
| `reels-media` | `reels.video_url`/`poster_url` (**path**) | path | `<video src={video_url}>` (path cru, já quebrado no remoto) | Path continua inválido; exige resolver path→URL assinada |
| `posts` (Schema A) | `posts.media` (`{preview,type,mediaId}`, sem URL) | jsonb | Lote D (sem UI) | Nada a migrar ainda; novos uploads devem gravar **path** |

**Distinções obrigatórias (não confundir):**

- **Proteção de novas emissões:** passar a assinar URLs de curta duração após autorização.
- **Proteção dos objetos:** `public=false` impede leitura anônima **do objeto** por URL pública daqui
  em diante.
- **Invalidação de URLs antigas:** **não** é automática. URLs `/public/` **já vistas/copiadas** e
  URLs assinadas **já emitidas** seguem válidas até expirar (URL assinada é **portadora**; Fase 10
  observou `200`→`400` só após a janela). Tornar o bucket privado **não** revoga cópias/downloads.
- **Cache/CDN:** retenção de borda **não é comprovável localmente** — listado como limite.

**Fato relevante:** como as policies SELECT são **por bucket**, mesmo com `public=false` **qualquer
usuário autenticado** ainda poderia assinar **qualquer** objeto desses buckets via API de Storage.

---

## 4. Investigação C — Alternativas

### Alternativa 1 — Cliente Storage sob identidade autenticada + policies específicas
Assinar com o JWT do usuário; confiar no RLS de `storage.objects`.
- Fronteira de confiança: **Storage**.
- Verificação: policy SELECT de `objects`.
- Privilégios: nenhum privilegiado.
- Risco de acesso direto: **alto** — policies atuais são por bucket; qualquer autenticado assina
  qualquer objeto (bypass da UI).
- Compatibilidade RLS/`are_connected`: **baixa** — Storage não conhece `posts`/privacidade; exigiria
  policy com predicado de privacidade (função/join), hoje inexistente.
- Migração: baixa (não muda bucket), mas **não resolve** privacidade.
- Testes: negativos por nível (hoje falhariam).
- Limitações locais: só é possível comprovar o comportamento das policies executando Storage local.

### Alternativa 2 — Endpoint server-side com autorização explícita + credencial privilegiada só no servidor **(recomendada)**
ServerFn (ou rota de servidor) que: (1) resolve o usuário (cookie SSR ou bearer); (2) carrega a
publicação sob **RLS do usuário** (`posts_select_privacy`) e confirma visibilidade; (3) valida que o
`path` solicitado pertence à mídia da publicação; (4) assina **curta duração**. Assinatura com
credencial **server-only** (`supabaseAdmin`) e **SELECT de `storage.objects` revogado/restrito** para
`authenticated` nesses buckets, de modo que usuários **não** possam assinar diretamente pela API.
- Fronteira de confiança: **servidor da aplicação** (ponto único de decisão).
- Verificação: RLS de `posts` + checagem app → `path` da publicação.
- Privilégios: service role **exclusivamente no servidor** (nunca no bundle do cliente).
- Risco de acesso direto: **mitigado** — sem SELECT não há assinatura direta; bucket privado fecha a
  URL pública.
- Compatibilidade RLS/`are_connected`: **alta** — reutiliza a policy de `posts` (fonte de verdade).
- Migração: **média** — requer migration de bucket/policies (autorização separada), normalização de
  path e resolver no cliente; reversível.
- Testes: positivos (owner/CONNECTIONS/PUBLIC autenticado) e negativos (anônimo, sem conexão, PRIVATE,
  path de terceiro, post sem mídia, URL pública negada, assinatura expirada) + tentativa de bypass
  direto à API de Storage (deve falhar).
- Limitações locais: cache/CDN e limites de distribuição só comprováveis com execução real.

### Alternativa 3 — Entrega mediada por endpoint (sem URL assinada)
Endpoint autentica, autoriza e **streama/redireciona** o objeto (storage privado por trás).
- Fronteira: servidor; verificação igual à Al. 2.
- Vantagens: autorização sempre no servidor; um ponto de auditoria; bom para Reels grandes.
- Desvantagens: mais latência/custo; controle de cache manual.
- Compatibilidade: média; pode combinar com a Al. 2 (endpoint que assina).

### Comparativo

| Critério | Al.1 (sessão+policies) | Al.2 (endpoint+server) | Al.3 (entrega mediada) |
| --- | --- | --- | --- |
| Fronteira de confiança | Storage | Servidor | Servidor |
| Verificação de autorização | policy SELECT | RLS `posts` + app | RLS `posts` + app |
| Privilégio | nenhum | service role (server) | service role (server) |
| Risco de acesso direto | **alto** | **baixo** | **baixo** |
| Compatível c/ RLS/`are_connected` | **não** (hoje) | **sim** | **sim** |
| Complexidade de migração | baixa (mas não resolve) | média | média/alta |
| Necessário agora | **não** | **sim** | opcional (Reels) |

---

## 5. Decisão recomendada e justificativa

**Adotar a Alternativa 2**, com a Alternativa 3 reservada para arquivos grandes (Reels).

**Justificativa (baseada em fatos):** as policies SELECT de `storage.objects` são **por bucket**, não
por publicação; portanto confiar na sessão do usuário (Al. 1) **não** protege privacidade e abre bypass
pela API de Storage. A única fonte de verdade de privacidade é `posts` (`posts_select_privacy` +
`are_connected`), que vive no banco relacional. Logo, a autorização deve ocorrer no **servidor**, e a
assinatura deve usar credencial **servidor-only**, com SELECT de Storage restringido para impedir
autoassinatura. O app já possui o client SSR cookie (RLS-as-user) e o `supabaseAdmin`, ambos
server-only — a infraestrutura existe, mas ainda não foi usada para assinatura.

**Reafirmação de D2:** `PUBLIC` exige **autenticação** (nunca anônimo); URL assinada é portadora e
expiração **não** revoga cópias; tornar bucket privado **não** invalida URLs antigas automaticamente.

---

## 6. Pré-requisitos para implementação (todos exigem autorização separada)

1. **Decisão/autorização** para alterar Storage (buckets `public=false`, policies), fora deste lote.
2. **Modelo de referência = path** (não URL) para novos uploads; resolver a divergência de builder
   (`{uid}/{purpose}/{id}.{ext}` vs. uploads reais `{uid}/{id}.{ext}`).
3. **Coluna/contrato** em `posts.media` para o `path` do objeto (hoje `mediaId`/`preview` sem path).
4. **ServerFn/rota de assinatura** que faça a checagem `posts`→`path` antes de assinar.
5. **Credencial server-only** (`supabaseAdmin`) + remoção/restrição do SELECT de `storage.objects`
   para `authenticated` nesses buckets (para fechar a autoassinatura).
6. **Resolver no cliente** (path→URL assinada sob demanda) substituindo `<img src={photo_url}>` e
   `<video src={video_url}>` crus.
7. **`StorageHelper` estendido** com `createSignedUrl` (ou wrapper server-only dedicado).
8. **Testes** positivos/negativos por nível + tentativa de bypass direto à API de Storage.

---

## 7. Estratégia de migração reversível (conceitual)

1. Inventariar objetos/referências por bucket (herdado do Lote F §3.1).
2. Classificar referência e privacidade (URL antiga × path × URL assinada; associação a `posts`).
3. Novos uploads: gravar **path**; manter buckets públicos **até validar**.
4. Reescrever referências URL→path em etapas; **não** apagar arquivos antes de validar leitura.
5. Introduzir assinatura server-side e o resolver no cliente.
6. Testes positivos/negativos; exercitar tentativa de bypass direto.
7. Flipping de `public=false` por bucket **após** validação; restringir SELECT.
8. Monitorar 403/404/erros de assinatura; **rollback** reativando `public=true` e revertendo
   referências a partir do inventário. Nunca assumir que o flip invalida URLs antigas.

---

## 8. Critérios de aceitação e rollback

**Aceitação:**
- Nenhuma nova referência de URL pública para buckets privados.
- Anônimo e não-autorizado **não** obtêm URL nem conteúdo.
- `PRIVATE` acessível só ao dono; `CONNECTIONS` só a conexões; `PUBLIC` só a autenticados.
- Assinatura só é emitida **após** checagem `posts`; tentativa de assinatura direta pelo usuário
  **falha**.
- Expiração de URL comprovada; rollback exercitado localmente.

**Rollback:** reativar `public=true`; reverter referências via inventário; manter assinatura desativada
por flag; nenhum dado/objeto excluído.

---

## 9. Questões ainda não comprovadas (hipóteses)

1. Comportamento real de `createSignedUrl` com o client do usuário sob as policies atuais (não
   executado).
2. Confirmação local de que a URL `/public/` ignora RLS para estes buckets (documentado; exercitável
   no Lote G).
3. Comportamento de cache/CDN e retenção de cópias.
4. Disponibilidade da sessão por cookie dentro de um serverFn de assinatura em produção (padrão já
   usado por outros serverFns, mas **não** testado para Storage).
5. Forma final do contrato `posts.media` com `path` (design pendente).

---

## 10. Recomendação objetiva sobre o Lote G

**O Lote G NÃO pode avançar para implementação de emissão de URLs assinadas ainda.** Bloqueadores:

- **[BLOQUEIO-1]** Policies de `storage.objects` são por bucket → assinar com o usuário permite
  bypass da privacidade. Requer decisão para restringir/revogar SELECT e assinar server-only.
- **[BLOQUEIO-2]** Buckets `public=true` e referências em URL pública → privacidade não efetiva.
- **[BLOQUEIO-3]** Falta o contrato de `path` em `posts.media` e o resolver path→URL no cliente.
- **[BLOQUEIO-4]** Alterações de bucket/policies exigem **autorização separada** (proibidas neste lote).

**Recomendação:** aprovar a **Alternativa 2** como direção arquitetural e resolver BLOQUEIO-1..4
(decisão + autorização de migration + contrato de `path`) antes de implementar. Com esses
pré-requisitos definidos, o Lote G pode avançar com implementação local + testes positivos/negativos,
sem tocar o ambiente remoto.

---

## Referências
- `docs/audits/adr-bio-posts-to-posts.md` (D1/D2)
- `docs/audits/lote-f-storage-inventory.md` (inventário/matriz/plano)
- `docs/audits/relatorio-consolidado-a-l.md` (A–L)
