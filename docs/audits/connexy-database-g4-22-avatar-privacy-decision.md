# Connexy — G4.22: auditoria e proposta de política de privacidade de avatares

Data: 2026-10-15 · Tipo: **AUDITORIA E PROPOSTA (somente estático/local)** · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` inalterado.

> **Escopo:** auditar a exposição dos avatares e propor uma política técnica/produto para protegê-los sem
> quebrar perfis, biografias, conexões, descoberta de pessoas ou dados legados. **Esta fase não
> implementa nada** (sem código, sem endpoint, sem wiring, sem migration).
>
> **Natureza das conclusões:** análise estática de código, migrations e `supabase/config.toml`.
> **Nenhum** runtime, **nenhuma** requisição HTTP, **nenhum** acesso ao Supabase remoto. Onde o
> repositório sugere um formato, isso **não** prova o estado efetivamente aplicado no projeto remoto.
>
> Regra de leitura: **[F]** fato verificado em arquivo local · **[I]** inferência · **[H]** hipótese
> não comprovada. **A vulnerabilidade C2 permanece ABERTA e NÃO é corrigida por este documento.**

---

## A. Veredito da auditoria

**AUDITORIA CONCLUÍDA — PROPOSTA ENTREGUE. IMPLEMENTAÇÃO BLOQUEADA.**

- **[F]** Hoje o **metadado** do avatar (`profiles.photo_url`) é visível a **qualquer usuário
  autenticado** (`profiles_select_authenticated … using (true)`, `20260925030806_schema_a_core.sql:62-64`;
  SELECT revogado de `anon`/`public`, `:73-74`) e também entregue por RPC de descoberta
  (`get_nearby_profiles`, `security definer`, `:668-729`).
- **[F]** O **objeto** do avatar, porém, é **público** (bucket `avatars` com `public = true`,
  `20260816120000_create_avatars_bucket.sql:7-18`; policy `"Avatars public read"` sem `TO`, `:23-25`).
  Logo, a URL é acessível **sem login**, independentemente da RLS de linha — C2 aberto.
- **[F]** O produto **não definiu** a política de privacidade dos avatares: não existe coluna/flag de
  visibilidade de avatar, e a política de publicações (`PUBLIC|CONNECTIONS|PRIVATE`) **não** se aplica
  a avatar. **Não a assumi** como válida.
- **[I]** A arquitetura atual **não permite** diferenciar avatar público de privado sem **alterar o
  significado de campos existentes ou adicionar campo novo** (§H).
- **Conclusão:** entrego o mapa, a comparação de três modelos, a recomendação **técnica** e a lista de
  decisões. **Não escolhi** a política em nome do proprietário do produto e **não** implementei nada.

---

## B. Baseline

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` |
| `git status --short` inicial | **266** entradas (inclui os incrementos G4.20/G4.21 e relatórios anteriores) |
| Flag `VITE_APP_SCHEMA_A_MEDIA_URL` | **desligada** (`media-url-flag.ts:8` só habilita com `=== "true"`); não foi tocada **[F]** |

Todas as mudanças anteriores foram preservadas; nenhum `reset`/`clean`/`checkout`/`stash`/commit/push.

---

## C. Mapa dos consumidores e dependências

### C.1 Escritores de `profiles.photo_url` **[F]**

| Fluxo | Local | Formato gravado | Gate |
| --- | --- | --- | --- |
| Edição de perfil (bio/avatar UI) | `src/components/bio/bio-avatar.tsx:118` (salvar), `:149` (remover ⇒ `null`) | **URL pública** do bucket `avatars` | `configured` |
| Cadastro — ramo legado | `src/routes/completar-perfil.tsx:247` | **URL pública** (corrigido na G4.20) | `configured && user` |
| Cadastro — ramo Schema A | `src/routes/completar-perfil.tsx:205,216` → `saveOwn` | **caminho canônico** `{uid}/{uuid}.jpg` | `isRemoteProfileEnabled()` (**OFF**) |
| Adaptadores/repositório | `src/lib/adapters/schema-a/profile.ts:106,124,176`; `src/integrations/supabase/remote/profile.repository.ts:9,53` | texto repassado (`photo` ⇄ `photo_url`) | — |
| Trigger de novo usuário | `schema_a_core.sql:126` | `photo_url` inicial (provavelmente `null`/vazio) | auth signup |

### C.2 Contextos de exibição (leitores) **[F]**

| Contexto | Consumidor | Origem do valor |
| --- | --- | --- |
| Avatar próprio (home) | `src/routes/_app.home.tsx:63,80,98` (+`onError` fallback `:101,115-117`) | `profiles` próprio |
| Avatar próprio (edição) | `bio-avatar.tsx:68,106,175-189` | `profiles` próprio |
| Perfil público de terceiro | `src/routes/_app.perfil.$id.tsx:103` | `profiles` (RLS authenticated) |
| Lista de pessoas | `src/routes/_app.pessoas.tsx:97-99` | lista de perfis |
| Conexões / solicitações | `src/routes/_app.connecta.tsx:176-178`; `src/routes/_app.solicitacao.$id.tsx:46,120,129,159,190,218,514-545` | perfis/mocks |
| Descoberta de pessoas | `src/routes/_app/discover.tsx:145`; `src/repositories/connections.repository.ts:17`; `src/repositories/user.repository.ts:67` | **RPC `get_nearby_profiles`** |
| Chat | `src/components/chat/ConnexyChatScreen.tsx:211`; `conversations-screen.tsx:159-163` | perfis de participantes |
| Reels / comentários | `src/components/reels/reel-card.tsx:32,158,211`; `reels/comments-sheet.tsx:7,47,70,137` | autores |
| Feed de presença | `src/components/presence/presence-live-feed-real.tsx:22,41,114-116` | conexões |
| Feed "perto de você" | `src/components/feed/FeedNearbyPeople.tsx:33` | perfis |
| Conexões (hook) | `src/hooks/use-connections.ts:10,38,48` | perfis |
| Demo / mock | `_app.home.tsx:98` (`demoProfile.photo`); `src/lib/mock-data.ts:399` (`listPeople`); `demo-own-profile.ts:67` (Unsplash) | **local/externo** |

### C.3 Dependências estruturais **[F]**

- **Descoberta de pessoas** depende de `get_nearby_profiles` (`security definer`), que **retorna
  `photo_url`** de candidatos descobríveis não conectados/não bloqueados/não pendentes
  (`schema_a_core.sql:668-729`). Qualquer mudança de formato/visibilidade de avatar precisa cobrir
  esse caminho (ele entrega a string, não uma URL assinada).
- **Conexões/solicitações** e **chat** exibem avatar de terceiros; dependem de `profiles` SELECT
  (authenticated) ou de joins/RPC.
- **Biografias** (`bio-posts.tsx`) usam **`bio-media`** (`bio_posts.media_url`), bucket distinto —
  **não** reaproveitar a política de avatar para biografia.
- **Perfil/demo local** usa `blob:`/`data:` e URLs **externas** (Unsplash) — o resolvedor precisa
  preservar esses formatos (§D).
- **Edição de perfil** grava URL pública hoje; qualquer mudança de modelo altera este escritor.

---

## D. Formatos de mídia existentes e compatibilidade com dados legados

**[F]** Formatos que podem estar persistidos em `profiles.photo_url`:

| Formato | Origem | Renderiza hoje? | Resolvedor G4.21 |
| --- | --- | --- | --- |
| URL pública `/storage/v1/object/public/avatars/{uid}/…` | `bio-avatar`, cadastro legado | sim (direto) | `storage-public` → mesma URL |
| URL assinada `/storage/v1/object/sign/avatars/…?token=…` | cadastro antigo (5 anos, G4.19/G4.20) | sim até expirar | `storage-signed` → mesma URL |
| Caminho canônico `{uid}/{uuid}.jpg` | ramo Schema A (**OFF**) | **não** (quebraria `<img>`) | `canonical` → `null` |
| URL externa `https://images.unsplash.com/…` | demo/mocks | sim | `external` → mesma URL |
| `data:` / `blob:` | preview local | sim | `local` → mesma URL |
| vazio/`null` | ausente | fallback (iniciais) | `missing` → `null` |

**[F]** Hoje **coexistem** URL pública e URL assinada de 5 anos em produção (a assinada é o passivo
apontado na G4.19/G4.20). O módulo `src/lib/media/avatar-media.ts` já classifica todos esses estados
**offline** e é **fail-closed** (bucket ≠ `avatars`, protocolo não HTTP(S), URL malformada e dono
divergente são rejeitados), mas **não está conectado** aos consumidores.

---

## E. Políticas de Storage e migrations (somente leitura local)

### E.1 O que o repositório declara **[F]**

| Bucket | `public` (repo) | SELECT (repo) |
| --- | --- | --- |
| `avatars` | `true` (`20260816120000:7-18`) | `"Avatars public read"` **sem `TO`** (⇒ anon) `20260816120000:23-25`; `"Avatars authenticated read"` `20260825025843:2-3`. **A public read NÃO é removida** (`:1` só dropa a `authenticated read` anterior) |
| `bio-media` | `true` (`20261009120000:18-29`) | `"Bio media authenticated read"` bucket-wide (`20260825025605:3-5`) |
| `reels-media` | `true` (`20261009120000:31-42`) | `"Reels media authenticated read"` bucket-wide (`20260825025605:8-10`) |

**RLS de linha:** `profiles` — SELECT só `authenticated` com `using (true)` (`schema_a_core.sql:62-64,73-74`);
`profile_private` é do dono (`:92-104`). `posts` tem RLS por `privacy` (`:762-768`); **`profiles`
não tem privacidade por linha**.

### E.2 Distinção repo × remoto **[H]**

- **[F]** O repositório **declara** buckets públicos e SELECT amplo.
- **[H]** **Não é possível** confirmar, sem acesso remoto, se esses `INSERT`/`ALTER POLICY` foram
  efetivamente aplicados no projeto `rsukwuqocgjmwwuwtqaf`, nem o estado atual de
  `storage.buckets.public`, nem se há policies adicionais no remoto. **Lacuna registrada (§O).**
- **[F]** Sem autorização de C2, **nada** foi consultado ou alterado no remoto.

---

## F. Comparação dos três modelos de acesso

### Modelo 1 — Público (status quo)

- **Experiência:** `<img src>` direto funciona para qualquer pessoa (inclusive `anon`), sem latência de
  assinatura; cache/CDN simples.
- **Segurança:** **nenhuma confidencialidade de objeto** — quem tem a URL lê o arquivo, mesmo
  deslogado ou após desconectar/bloquear. C2 aberto.
- **Impacto nos consumidores:** **nenhum** (é o estado atual).
- **Migração:** nenhuma.
- **Testes:** já cobertos (comportamento atual).
- **Rollback:** n/a.
- **Veredito técnico:** compatível com tudo, mas **incompatível** com qualquer objetivo de privacidade.

### Modelo 2 — Usuários autenticados

- **Experiência:** visualmente igual para usuários logados; **`<img>` deslogado quebra** (ex.: links
  compartilhados, preview externo, SSR sem sessão). Alguns fluxos de demo/anon deixam de ver imagens.
- **Segurança:** **melhora** — exige login para ler o objeto; remove o acesso anônimo. **Mas** qualquer
  autenticado continua lendo **qualquer** avatar (bucket-wide), então não há privacidade entre usuários.
- **Impacto nos consumidores:** **alto.** `public=false` invalida `/object/public/`; para continuar
  exibindo, é preciso (a) URL assinada curta server-side **ou** (b) o cliente enviar `Authorization`
  — que `<img src>` não envia. Logo, exige **endpoint de assinatura de avatar** + wiring do resolvedor.
  A RPC `get_nearby_profiles` teria de devolver identificador/assinatura em vez de `photo_url` cru.
- **Migração:** reescrever/assinar `photo_url`; backfill; rotação de URLs públicas e da assinada de 5
  anos; cobrir descoberta, conexões, chat, reels, comentários, feed, perfil.
- **Testes:** unitários do resolvedor (existem) **+ integrados** (buckets privados, SEED, RLS) que
  exigem autorização de C2 e runtime.
- **Rollback:** reverter consumidores/flag primeiro; **nunca** reabrir bucket público (G4.19 §7).
- **Veredito técnico:** **coerente com o estado atual** (a linha `profiles` já é authenticated-only),
  mas **não garante privacidade entre usuários** e **quebra** acesso anônimo/`<img>` sem sessão.

### Modelo 3 — Acesso controlado por regras de autorização

- **Experiência:** depende da regra escolhida (ex.: avatar visível só para conexões; oculto se
  bloqueado; espelhar visibilidade do perfil). Pode introduzir atrito (avatares ocultos onde hoje
  aparecem) e estados "sem avatar" inesperados.
- **Segurança:** **melhor** — autorização por objeto derivada da **linha autorizada**, cache escopado
  por visualizador (`createMediaResolver`), TTL curto. Ainda limitada por C2 enquanto o bucket for
  público.
- **Impacto nos consumidores:** **máximo.** Cada tela precisa do viewer + assinatura autorizada;
  descoberta/feed precisam de política de "quem pode ver" definida; previews, `alt`, fallback e
  estados `forbidden/missing` precisam ser tratados.
- **Migração:** exige **regra de produto nova** + provável **campo de privacidade de avatar** (§H);
  backfill; endpoint; wiring; testes integrados.
- **Testes:** os mais extensos (positivos/negativos por conexão, bloqueio, privacidade, expiração,
  isolamento de cache).
- **Rollback:** por tipo/flag, sem reabrir exposição.
- **Veredito técnico:** **desejável** para privacidade real, mas **bloqueado** por falta de decisão de
  produto e de campo de privacidade — **não** pode ser implementado sem defini-los.

---

## G. Recomendação técnica (separada de decisão de produto)

> **Isto é recomendação de engenharia, não a política.** A escolha do modelo é decisão do
> proprietário do produto (§L).

1. **[I]** Dado que o metadado já é **authenticated-only** (`profiles … using(true)`) e que avatares
   aparecem em descoberta, conexões, chat, reels e comentários, o **Modelo 2 (autenticados)** é o
   **mínimo viável** que (a) fecha o acesso **anônimo** ao objeto e (b) **não** promete privacidade
   entre usuários que o schema não suporta hoje.
2. **[I]** Implementar via **resolvedor + endpoint server-side com assinatura curta** (reutilizando
   `media-path`/`createMediaResolver`/`createMediaUrlService`), **não** via bucket público. **Não**
   reutilizar `getPostMediaUrl`/`authorizeMediaAccess` (dependem de `posts.privacy` — incompatível).
   Criar `getAvatarMediaUrl` **próprio**, com regra explícita (a definir).
3. **[I]** Se o produto exigir **privacidade entre usuários** (Modelo 3), isso **requer** antes:
   (a) um campo/valor de visibilidade de avatar; (b) a regra (conexões? bloqueio? espelhar
   `profiles.visibility`?); (c) cobertura dos fluxos de descoberta.
4. **[I]** Em **ambos** os casos, C2 (bucket privado + revogar SELECT amplo) é pré-requisito para a
   privacidade valer, e deve seguir o plano do G4.19 (Etapas 4–6), com autorização explícita.
5. **[F]** A base já pronta: `avatar-media.ts` (classificador fail-closed) + `media-resolver` (cache
   escopado, TTL) + middleware de auth (`requireAppSupabaseAuth`) — só falta a **regra** e o endpoint.

---

## H. A arquitetura atual diferencia avatar público de privado? (Etapa 7)

**Não. [F]**

- `profiles.photo_url` é um **único texto**; não há `photo_privacy`/`avatar_visibility`.
- `profiles.visibility` (JSON) cobre apenas `confirmed_activity`, `liked_places`,
  `mutual_connections` (`adapters/schema-a/profile.ts:19-35`) — **não** avatar.
- `profile_private` cobre `birth_date`/`home_address`/`work_address` (`schema_a_core.sql:77-83`) —
  **não** avatar.
- **Consequência:** qualquer distinção público/privado **exige** (i) **novo campo/valor** (ex.: uma
  chave `avatar` em `visibility`, ou coluna dedicada) **ou** (ii) **decisão de que avatar não tem
  privacidade própria** (segue o acesso a `profiles`). Ambas são **decisões de produto/schema**, não
  implementáveis nesta fase. Alterar a semântica de `photo_url` para "caminho = privado / URL =
  público" seria **inventar** semântica e **quebraria** consumidores — **rejeitado**.

---

## I. Mudanças necessárias por modelo (caso escolhido)

### Modelo 1 — Público
- **Banco/Storage/API/Frontend:** nenhuma.
- **Testes:** nenhum novo.

### Modelo 2 — Autenticados
- **Banco:** nenhuma coluna nova (a regra "autenticado" deriva de sessão).
- **Storage (migration, requires C2):** `update storage.buckets set public=false where id='avatars'`;
  **remover** `"Avatars public read"` (anon); manter leitura `authenticated` **ou** substituir por
  leitura só via assinatura; manter INSERT/UPDATE/DELETE owner-folder.
- **API:** novo server function **`getAvatarMediaUrl`** (autenticado) → carrega `profiles` por RLS,
  autoriza (regra "autenticado"), assina `avatars` com TTL 60–300 s via service role server-only.
- **Frontend:** conectar `avatar-media.ts` + `createMediaResolver` (escopo = `viewerId`) aos
  componentes de **todos os contextos** (§C.2); tratar `forbidden/missing` com fallback (iniciais);
  ajustar RPC de descoberta para **não** devolver URL crua.
- **Testes:** unitários de `avatar-media` (prontos) + endpoint/authz + integrados de bucket privado.

### Modelo 3 — Controlado por regras
- **Tudo do Modelo 2, mais:**
- **Banco:** **novo campo** de visibilidade de avatar (ex.: `avatar_visibility` em
  `profiles`/`profile_private`, ou chave em `visibility`) + migração de default decidido.
- **API:** `authorizeAvatarAccess(viewerId, profileRow)` com a regra (conexões/bloqueio/etc.),
  análogo a `canViewPost` mas **independente** e explícito.
- **Frontend:** estados por contexto (conexão vs descoberta vs terceiro), UX de avatar oculto.
- **Testes:** matriz positiva/negativa por relação (conexão, bloqueio, privacidade, expiração,
  isolamento de cache) — análoga ao §5.2 do G4.19.

---

## J. Plano de migração de URLs públicas e assinadas legadas

**Nenhuma etapa executada; sem tocar buckets.**

- **M1 — Inventário (leitura, requires C2):** classificar `profiles.photo_url` em
  PUB/SIGN/CANON/EXT/LOCAL/VAZIO (contagem **agregada**, **sem** imprimir tokens). Pré-requisito:
  Etapa 1 do G4.19.
- **M2 — Parar de emitir formatos frágeis:** **[F]** já feito para a URL assinada de 5 anos no
  cadastro (G4.20); falta padronizar o restante (bio-avatar já grava público). Definir se o **destino**
  passa a ser (a) URL assinada por exibição (nada persistido) ou (b) caminho canônico persistido.
- **M3 — Backfill determinístico:** converter PUB/SIGN → **caminho canônico** onde o `{uid}` do path
  for determinável e o dono bater; marcar não conversíveis (ex.: URL externa do MCP/demo) como
  "manter/exibir como externo".
- **M4 — Endpoint + resolvedor:** publicar `getAvatarMediaUrl` (Modelo 2/3) e conectar `avatar-media`.
- **M5 — Corte gradual por contexto** (perfil → conexões → descoberta → chat → reels/comentários),
  com fallback local intacto, habilitando flag por ambiente.
- **M6 — Privatizar `avatars` e revisar policies** (C2; Etapas 5 do G4.19), **depois** de M1–M5.
- **M7 — Higiene:** rotacionar/descartar a URL assinada de 5 anos e varredura por `/object/public/`
  em `photo_url`; confirmar 0 referências públicas ativas.
- **Rollback:** reverter flag/consumidores primeiro; **jamais** reabrir bucket público (G4.19 §7).

---

## K. Riscos, testes de regressão e rollback

| Risco | Tipo | Sev. | Mitigação |
| --- | --- | --- | --- |
| C2 (bucket público) torna resolução irrelevante p/ confidencialidade | Confidencialidade | **Alta** | Só resolve com M6 (C2); não declarar corrigido |
| `public=false` quebra `<img>` sem sessão / links compartilhados / anon | Disponibilidade/UX | **Alta** | Modelo 2/3 + fallback; teste de regressão visual por tela |
| Descoberta (`get_nearby_profiles`) entrega `photo_url` cru | Confidencialidade | **Média** | Ajustar RPC em M4/M5 |
| URLs assinadas de 5 anos persistidas | Confidencialidade | **Alta** | M7 (rotação) |
| Ausência de privacidade por avatar (nada a decidir hoje) | Produto | **Alta** | Bloqueio de implementação (§G/§L) |
| Expor token/URL assinada em log | Confidencialidade | **Baixa** | `redactMediaUrlForLog`; proibir log cru |
| Service role no bundle | Confidencialidade | **Alta** | `*.server.ts` + import dinâmico (G4.18) |

**Regressão (proposta):** reaproveitar `avatar-media-g4-21` (offline) + `media-resolver-g1`
(escopo/in-flight) + `media-authorization-g1`; adicionar integrados de avatar por relação (§I) quando
houver C2. **Rollback:** flag → consumidores → snapshot de `photo_url` (M1) → policies anteriores
(mutação owner-folder; SELECT mínimo); **proibido** tornar bucket público ou reemitir URL longa.

---

## L. Decisões que exigem aprovação explícita

1. **Política de privacidade do avatar** — Público x Autenticados x Controlado por regras (§F).
2. **Se avatar segue/M espelha a visibilidade de `profiles`** ou tem visibilidade própria (§H).
3. **Se bloqueio entre usuários e "não conectado" ocultam avatares** (afeta descoberta).
4. **Se `anon` (deslogado) deve ver algum avatar** (links compartilhados, preview).
5. **Destino do campo:** manter `photo_url` como URL vs migrar para caminho canônico (M2).
6. **Autorização de C2** (buckets privados + revogação de SELECT amplo) e janela de execução.
7. **Habilitação de flag por ambiente** (`VITE_APP_SCHEMA_A_MEDIA_URL`) — hoje deve permanecer OFF.
8. **Política de rotação das URLs assinadas de 5 anos** (M7).

---

## M. Baseline e comparação final do Git

| Momento | HEAD | Branch | `git status --short` |
| --- | --- | --- | --- |
| Antes desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 266 entradas |
| Depois desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 266 + este relatório |

- **Delta desta fase:** apenas `docs/audits/connexy-database-g4-22-avatar-privacy-decision.md` (novo).
- As **266** entradas preexistentes foram **preservadas** (incluindo `.env`, `.env.example`,
  `package.json`, `bun.lock`, `supabase/config.toml` e relatórios/telas anteriores, que já estavam
  modificados **antes** desta fase). Nenhum `reset`/`clean`/`checkout`/`rebase`/`stash`/commit/push.
- Nenhuma alteração de código, testes, dependências, `.env`, `config.toml`, migrations, buckets,
  policies ou flags.

---

## N. Confirmação de ausência de alterações remotas/destrutivas

- **Nenhum runtime** iniciado; **nenhuma** requisição HTTP; **nenhum** acesso ao Supabase remoto.
- **Nenhuma** migration/SQL; **nenhuma** alteração de bucket/policy/flag; `VITE_APP_SCHEMA_A_MEDIA_URL`
  permanece **desligada**.
- **Nenhum** dado lido/escrito/apagado no remoto; **nenhum** segredo impresso.
- **Nenhum** commit/push/reset/stash/clean. **C2 NÃO foi corrigido.** Análise exclusivamente por
  leitura estática local.

---

## O. Lacunas de evidência (registradas, não resolvidas)

1. **[H]** Estado **efetivamente aplicado** no projeto remoto (buckets/policies/grants) é
   desconhecido — sem acesso autorizado. O repositório **declara** o exposto em §E.1.
2. **[H]** Conteúdo real de `profiles.photo_url` (distribuição PUB/SIGN/CANON/EXT/LOCAL) não
   inventariado — sem M1/C2.
3. **[H]** Não há contagem de URLs assinadas de 5 anos ativas nem sua expiração.
4. **[F]** Não há decisão de produto registrada para privacidade de avatar (§L).
5. **[I]** Comportamento de CDN/borda e caching do Supabase não verificado.

**Encerramento:** sem as decisões de §L e sem autorização de C2, a fase **não implementa**. O caminho
técnico está especificado (M1–M7, §I) e o incremento seguro já existente (`avatar-media.ts`) permanece
isolado. **Próximo passo:** aprovar a política de avatar (decisão 1) e, em seguida, autorizar C2 +
M1 (inventário de leitura).
