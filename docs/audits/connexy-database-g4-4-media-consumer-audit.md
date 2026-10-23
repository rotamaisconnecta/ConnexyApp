# Connexy — Marco G4.4: Auditoria do consumidor real de mídia remota

- **Marco:** G4.4 — identificar o consumidor real de `getPostMediaUrl`, rastrear o fluxo de mídia (do dado
  persistido à renderização) e recomendar a menor integração arquitetural segura.
- **Tipo:** auditoria. **Nada é implementado nesta execução** (sem mudança de código, UI, rotas, contratos,
  config, dependências, testes existentes ou relatórios anteriores).
- **Data:** 2026-10-14.
- **Executor:** OpenCode.
- **Base:** `docs/audits/connexy-database-g4-2-http-integration.md` (BLOQUEADO) e
  `docs/audits/connexy-database-g4-3-http-unblock-plan.md` (PLANO PRONTO; EXECUÇÃO BLOQUEADA).
- **Flags Schema A:** permanecem **OFF**. **C2/Storage:** permanece **não resolvido**.
- **Operações remotas Supabase:** **nenhuma**. **Infra local:** nenhuma alteração (somente leitura).
- **Segredos:** nenhum valor exibido neste relatório.

---

## 1. Veredito inicial

**CONSUMIDOR REAL AUSENTE. Integração mínima legítima = Opção A (atrás da flag). Validação HTTP continua
BLOQUEADA.**

A auditoria confirma, com referências de código, que **não existe hoje nenhum consumidor de produção** de
`getPostMediaUrl` nem de todo o encadeamento canônico de mídia (contrato → autorização → assinatura →
resolvedor). A UI renderiza mídia por **URLs públicas** (`getPublicUrl`), por **URL direta de coluna**
(`video_url`/`poster_url`) e por **mídia local OPFS** — nenhum desses caminhos passa pelo servidor de
assinatura.

Consequências:

- **Não há integração quebrada** (nada deixou de funcionar), mas também **não há cobertura de produto** para o
  código G1/G4 — ele é, do ponto de vista da UI, **órfão**.
- O Bloqueio arquitetural de G4.2/G4.3 (server function só é registrada se o módulo entrar no **grafo de
  build**) continua dominante: com 0 importadores, não existe rota `/_serverFn/<id>`.
- Como não há consumidor, a **menor integração segura** é criar **um** consumidor real atrás da flag (Opção A),
  e não forçar registro artificial (Opção B).

Nenhuma flag deve ser ativada automaticamente. Nenhuma rota pública nova deve existir só "para testar".

---

## 2. Objetivo, escopo e não-objetivos

### 2.1 Objetivo

Responder, com evidência de código:

1. Quem **realmente** consome mídia remota na UI e por qual caminho (arquivo:linha).
2. Qual é a cadeia canônica G1/G4 e quantos importadores de produção ela tem.
3. Quais alternativas de integração existem (A–D) e qual é a mínima segura.
4. Quais contratos de segurança já estão garantidos no código.
5. Qual plano de testes cobre a integração após a decisão.

### 2.2 Escopo

- Leitura de `src/**` e `tests/**` (read-only) para inventário e rastreio de dependências.
- Verificação estática de contratos de segurança nos módulos de mídia e middleware.
- Redação **somente** deste relatório.

### 2.3 Não-objetivos (explícitos)

- Não implementar consumidor, não editar UI/rotas/testes/config/dependências.
- Não ativar flags; não tocar Storage/C2; não alterar políticas.
- Não iniciar/parar/modificar containers, DB ou serviços; não executar SQL.
- Não fazer operações remotas Supabase; não imprimir segredos.
- Não afirmar cobertura HTTP nem execução de teste que dependa de runtime/backend não autorizado.

---

## 3. Método e comandos de evidência (read-only)

- `grep`/busca textual por: `getPostMediaUrl`, `media-resolver`, `createMediaResolver`, `MediaResolver`,
  `media-contract`, `media-path`, `media-authorization`, `media-server-authorization`, `media-url-flag`,
  `schema-a-storage`, `schema-a-content`, `VITE_APP_SCHEMA_A_MEDIA_URL`, `getPublicUrl`, `createSignedUrl`,
  `photo_url`, `media_url`, `video_url`, `poster_url`, `LocalMediaFrame`, `useLocalMediaUrl`,
  `local-media-storage`.
- Leitura integral de `src/lib/media/*`, `src/lib/adapters/schema-a/content.ts`,
  `src/components/media/local-media-frame.tsx`, `src/hooks/use-local-media-url.ts`,
  `src/components/bio/bio-posts.tsx`, `src/components/reels/reel-card.tsx`, `src/routes/_app.perfil.$id.tsx`.
- `git rev-parse HEAD` e `git status --porcelain` (baseline antes/depois da redação).

**Baseline Git desta execução:** HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`; `git status --porcelain`
= 118 `M`, 1 `A`, 3 `AM`, 1 `D`, 114 `??`. O único artefato novo deve ser este relatório.

---

## 4. Inventário dos consumidores reais de mídia (file:linha)

> Regra de evidência: só é listado o que tem **referência concreta** no código. Nenhum componente é
> declarado consumidor de `getPostMediaUrl` — não há tal referência.

### 4.1 Avatares / fotos de perfil (`avatars`, `photo_url`)

- Upload + URL pública: `src/components/bio/bio-avatar.tsx:116` (`uploadAvatar`),
  `:118` (`supabase.storage.from(BUCKETS.avatars).getPublicUrl(path)`), `:122` (`photo_url: newPhotoUrl`).
- Perfil completo (legado, URL assinada longa): `src/routes/completar-perfil.tsx:220` (`storage.from("avatars").remove`),
  `:249` (`createSignedUrl(path, 60*60*24*365*5)`), `:262` (`photo_url`).
- Upload por componente: `src/routes/finalizar-perfil.tsx:16,134` (`UploadMedia`).
- Render direto de `photo_url`: `src/routes/_app.pessoas.tsx:97-99`, `src/routes/_app.home.tsx:98`,
  `src/routes/_app.solicitacao.$id.tsx:514-515`, `src/routes/_app.connecta.tsx:176-178`,
  `src/components/presence/presence-live-feed-real.tsx:114-116`,
  `src/components/feed/FeedNearbyPeople.tsx:33`, `src/routes/_app.perfil.$id.tsx:103`.

### 4.2 Posts de feed / bio (`bio_media`, `media_url`)

- Upload + URL pública: `src/components/bio/bio-posts.tsx:39-46`
  (`uploadPostMedia` → `getPublicUrl` → `mediaUrl`), `:52` (`media_url: mediaUrl`).
- Render direto: `src/components/bio/bio-posts.tsx:296-303` (`<img src={post.media_url} …>`).
- Remoção/troca por `extractStoragePathFromUrl`: `src/components/bio/bio-posts.tsx:75,142,174`.
- Mapeamento para UI: `src/routes/_app.perfil.$id.tsx:89` (`mediaUrl: post.media_url`).
- Upload local (OPFS) ao criar post: `src/routes/_app/create-post.tsx:13` (`saveLocalMedia`).
- Upload componente genérico: `src/components/post/media-uploader.tsx:49` (`UploadMedia`).
- Serviço: `src/services/upload.service.ts:77,97,105` (`getPublicUrl`, `uploadPostMedia`, `getPublicUrl`).

### 4.3 Reels (`reels-media`, `video_url`/`poster_url`)

- Upload direto no bucket: `src/lib/reels/reel-publish.ts:128` (`storage.from("reels-media").upload`).
- Render direto: `src/components/reels/reel-card.tsx:109-112`
  (`<video src={reel.video_url} poster={reel.poster_url ?? undefined} …>`).
- Rascunho/local: `src/lib/reels/reel-draft.ts:2`, `src/lib/reels/reel-local-media-db.ts:12`
  (`local-media-storage`).

### 4.4 Mídia local (OPFS) — chat, posts locais e demo

- Frame/resolvedor local: `src/components/media/local-media-frame.tsx:1-13`,
  `src/hooks/use-local-media-url.ts:1-34`.
- Backend local: `src/lib/media/local-media-storage.ts:1-6` (OPFS primário; IndexedDB metadados; object URLs
  temporárias — "nunca armazenamento").
- Consumidores: `src/routes/_app.perfil.index.tsx:31`, `src/components/post/demo-post-detail.tsx:18`,
  `src/components/chat/ConnexyChatScreen.tsx:69`, `src/components/chat/message-bubble.tsx:17`,
  `src/components/chat/audio-player.tsx:5`.
- Outros usos: `src/hooks/api/use-chat.ts:11`, `src/lib/chat/chat-message-actions.ts:9`,
  `src/lib/media/share-local-photo.ts:2`, `src/lib/demo/demo-db.ts:15`.

### 4.5 Catálogo

- Upload: `src/components/catalog/catalog-image-fields.tsx:32-42` (`UploadMedia`).
- Persistência/render: `src/integrations/supabase/remote/catalog.repository.ts:103,123` (`photo_url`).

### 4.6 Síntese do inventário

| Fluxo | Bucket/fonte | Upload | Render | Passa pelo servidor de assinatura? |
|---|---|---|---|---|
| Avatar | `avatars` / `photo_url` | `bio-avatar.tsx:116`, `completar-perfil.tsx` | `photo_url` direto (várias rotas) | **Não** |
| Post de feed | `bio_media` / `media_url` | `bio-posts.tsx:39-46` | `bio-posts.tsx:296-303` | **Não** |
| Bio (perfil) | `posts.media` (jsonb) | — (não há upload canônico na UI) | `_app.perfil.$id.tsx:89` (via `media_url`) | **Não** |
| Reels | `reels-media` / `video_url` | `reel-publish.ts:128` | `reel-card.tsx:109-112` | **Não** |
| Chat/local | OPFS | `use-chat.ts:11`, `create-post.tsx:13` | `LocalMediaFrame`/`useLocalMediaUrl` | **Não** |
| Catálogo | bucket catálogo / `photo_url` | `catalog-image-fields.tsx:32-42` | `catalog.repository.ts` | **Não** |

**Conclusão §4:** todos os caminhos de produção usam URL pública, URL de coluna ou OPFS. **Nenhum** usa
`getPostMediaUrl`, `createServerMediaUrlService` ou o resolvedor canônico.

---

## 5. Cadeia canônica G1/G4 e ausência de consumo na UI

### 5.1 Grafo de dependências de produção

```
getPostMediaUrl                         src/lib/media/media-url.functions.ts:49   ← 0 importadores
  └─(import dinâmico) media-server-authorization.server.ts:58-59
        src/lib/media/media-server-authorization.server.ts:88  createServerMediaUrlService
        └─ media-authorization.ts:149  createMediaUrlService
              ├─ media-contract.ts      (normalizePostMedia, classifyMediaValue, …)
              │     └─ media-path.ts:7  (validateMediaPath)
              │           └─ src/lib/storage/schema-a-storage.ts:2  ownerIdFromStoragePath
              └─ media-path.ts:9
  └─(tipo) media-resolver.ts            MediaSignResult  (resolvedor cliente, 0 consumidores de runtime)
```

### 5.2 Importadores verificados

| Módulo | Importadores de produção | Importadores em teste |
|---|---|---|
| `media-url.functions.ts` (`getPostMediaUrl`) | **0** | — |
| `media-server-authorization.server.ts` | `media-url.functions.ts:58-59` (dinâmico) | `tests/media-server-authorization-live-g4.test.ts` |
| `media-authorization.ts` | `media-server-authorization.server.ts:3-8`, `media-url.functions.ts:6` (tipo) | `tests/media-authorization-g1.test.ts` |
| `media-contract.ts` | `adapters/schema-a/content.ts:2`, `media-authorization.ts:1-8`, `media-resolver.ts:1` (tipo) | `tests/media-contract-g1.test.ts` |
| `media-path.ts` | `media-contract.ts:7`, `media-authorization.ts:9` | `tests/media-contract-g1.test.ts` |
| `media-resolver.ts` | **0** (só tipo) | `tests/media-resolver-g1.test.ts` |
| `media-url-flag.ts` | `media-server-authorization.server.ts:10` | `tests/media-*-g1.test.ts`, `…live-g4.test.ts` |
| `schema-a-storage.ts` | `media-path.ts:2` | `tests/schema-a-storage-1h-15.test.ts` |
| `schema-a-content.ts` | **0** | `tests/schema-a-content-*.test.ts` |

### 5.3 Fatos-chave

- **F1.** `getPostMediaUrl` tem **0 importadores** em `src` (única ocorrência: a própria definição,
  `media-url.functions.ts:49`). Logo não entra no grafo de build → sem rota HTTP (consistente com G4.2).
- **F2.** O resolvedor **cliente** `media-resolver.ts` também tem **0 consumidores de runtime**; é importado
  apenas para o **tipo** `MediaSignResult` por `media-authorization.ts:10` e
  `media-server-authorization.server.ts:9`.
- **F3.** O adaptador `schema-a-content.ts` (que converteria `posts.media` canônico) tem **0 importadores de
  produção**; só aparece em testes.
- **F4.** A flag `VITE_APP_SCHEMA_A_MEDIA_URL` é lida **somente** em `media-url-flag.ts:8` e consumida
  **somente** em `media-server-authorization.server.ts:91`. Como esse módulo só é alcançado por
  `getPostMediaUrl` (órfão), **a flag não influencia nenhum caminho de UI**.
- **F5.** A duplicidade de modelo de identidade (bearer em `getPostMediaUrl` vs. cookie nos demais server
  fns) permanece como em G4.3 — mas é irrelevante para a UI enquanto não houver consumidor.

**Conclusão §5:** o encadeamento G1/G4 está **completo e testado em unidade**, porém **desconectado do
produto**. Qualquer cobertura HTTP só fará sentido depois de existir um consumidor real.

---

## 6. Alternativas de integração (A–D)

### 6.1 Opção A — Consumidor real atrás da flag *(recomendada)*

Disponibilizar `getPostMediaUrl` como o resolvedor de mídia de **posts canônicos** (`posts.media` com
`(bucket, path)`), atrás de `VITE_APP_SCHEMA_A_MEDIA_URL`, com fallback para o caminho legado (URL pública/
local) quando a flag estiver OFF.

- **Prós:** resolve o bloqueio arquitetural de forma legítima (módulo entra no grafo); mudança de UI mínima e
  reversível; flag OFF preserva 100% do comportamento atual.
- **Contras:** exige que a fonte de dados forneça a **identidade canônica** `(bucket, path)` em `posts.media`
  (hoje os posts de UI carregam `media_url` público / OPFS). Requer sessão bearer
  (`attachAppSupabaseAuth`, `src/start.ts:26`) e backend autorizado para validação.

### 6.2 Opção B — Registro server-only artificial *(não recomendada)*

Importar o módulo só para efeito de registro (ex.: em `src/server.ts`).

- **Contra:** cria superfície de servidor sem caso de uso de produto — conflita com a regra de não criar rota
  "para testar". Mantém o código órfão na UI.

### 6.3 Opção C — Plugar o resolvedor cliente nos consumidores atuais

Fazer `bio-posts.tsx`/`reel-card.tsx` passarem a resolver via `media-resolver.ts`.

- **Contra:** hoje esses componentes leem **URLs de coluna** (`media_url`, `video_url`), não o contrato
  canônico `(bucket, path)`. Seria necessário persistir identidade canônica primeiro — mudança maior que a
  Opção A e que toca o modelo de dados/UI. O próprio `media-resolver.ts` não tem consumidor hoje.

### 6.4 Opção D — Manter como está (somente documentar)

- **Prós:** risco zero de produto; nenhuma alteração.
- **Contra:** deixa G4 permanentemente não validado e o código órfão; dívida de "falso senso de cobertura".

### 6.5 Comparativo

| Critério | A | B | C | D |
|---|---|---|---|---|
| Registra a server fn legitimamente | Sim | Sim (artificial) | Sim | Não |
| Risco de UI | Baixo (flag OFF) | Médio | Alto | Nulo |
| Toca modelo de dados | Não* | Não | Sim | Não |
| Habilita validação HTTP | Sim | Sim | Sim | Não |

\* A Opção A depende de a fonte de posts expor identidade canônica; se não expuser, isso vira pré-requisito
de dados (não de UI).

---

## 7. Verificação dos contratos de segurança no código

Verificado estaticamente (sem execução), com referências:

- **Identidade não vem do corpo.** `getPostMediaUrl` valida apenas `{ postId, locator }`
  (`media-url.functions.ts:21-36`) e usa `viewerId: context.userId` (`:63`), originado do middleware bearer
  `requireAppSupabaseAuth` (`:50`, `:3`). O corpo não influencia a identidade.
- **Autorização a partir da linha (não do request).** O leitor carrega o post via RLS
  (`media-server-authorization.server.ts:37-46`) e a privacidade é decidida por `canViewPost`
  (`media-authorization.ts:56-67`). O `locator` só localiza; a prova é o item registrado em `post.media`
  (`media-authorization.ts:78-124`), com dono/bucket/tipo revalidados (`:112-124`).
- **Não revelar existência.** Post inexistente e não autorizado retornam igual (`media-authorization.ts:166-167`).
- **Flag OFF ⇒ sem assinatura.** `createMediaUrlService` retorna `unavailable` quando `!isEnabled()`
  (`media-authorization.ts:155`); a flag é OFF por padrão (`media-url-flag.ts:7-8`).
- **Assinatura server-only.** `signMediaWithServiceRole` importa `supabaseAdmin` dinamicamente e só é
  alcançável no servidor (`media-server-authorization.server.ts:65-75`); o módulo é `*.server.ts`.
- **TTL limitado.** `clampMediaUrlTtl` força 60–300s (`media-authorization.ts:39-53,151`) e o `expiresAt`
  nunca excede o TTL do serviço (`:190-194`).
- **Redação de URL para log disponível.** `redactMediaUrlForLog` (`media-resolver.ts:256-259`); não há log de
  URL assinada no caminho atual.
- **Mídia local (OPFS) não é coberta.** `local-media-storage.ts` produz object URLs locais fora do Supabase;
  não passa por autorização (aceitável por ser local, mas fora do escopo do contrato G4).
- **URLs públicas e C2.** `getPublicUrl` (`upload.service.ts:77,105`, `bio-posts.tsx:45`,
  `bio-avatar.tsx:118`) pressupõem bucket público + SELECT bucket-wide — **C2 permanece ABERTO**.

**Conclusão §7:** os contratos de segurança do encadeamento G4 estão implementados e coerentes entre si. O
risco atual **não é de vazamento**, e sim de **cobertura de produto inexistente**.

---

## 8. Plano de testes proposto (matriz)

> Nada é executado nesta fase. Separa-se o que roda **localmente** (`bun test`, sem HTTP) do que exige
> **runtime TanStack Start + Supabase autorizado** `rsukwuqocgjmwwuwtqaf` (sujeito a autorização explícita).

### 8.1 Já existente (não alterar)

- Contrato/normalização/classificação: `tests/media-contract-g1.test.ts`.
- Autorização/TTL: `tests/media-authorization-g1.test.ts`.
- Resolvedor cliente: `tests/media-resolver-g1.test.ts`.
- Montagem server-side + RLS/service role: `tests/media-server-authorization-live-g4.test.ts`.
- Flag: `tests/media-url-flag-g1.test.ts`.

### 8.2 Proposto após decisão (local)

- **T-L1.** Teste estático de acoplamento: `getPostMediaUrl` passa a ter ≥1 importador real (garante registro
  no grafo). Complementa a lacuna de G4.2 sem simular runtime.
- **T-L2.** Regressão da flag: com gerador/consumidor, flag OFF ⇒ caminho legado intacto (sem chamada ao
  servidor).

### 8.3 Proposto após decisão (HTTP, requer runtime + backend autorizado)

- **T-H1.** Sem `Authorization: Bearer` ⇒ rejeição de auth; 0 assinaturas.
- **T-H2.** Flag OFF ⇒ `unavailable`; 0 assinaturas.
- **T-H3.** Matriz de privacidade PUBLIC / CONNECTIONS / PRIVATE × (dono, conectado, não conectado).
- **T-H4.** `locator.identity` vs `locator.index` coerentes; forjar `bucket`/`path` ⇒ `forbidden`.
- **T-H5.** Post inexistente ⇒ `forbidden` (não revelar existência).
- **T-H6.** TTL efetivo dentro de 60–300s; URL expira.
- **T-H7.** Nenhuma URL assinada/token em log.

Critério de aceitação: T-H* só contam como cobertura se atravessarem o **limite HTTP real** (não simulado).

---

## 9. Riscos, bloqueios e dependências

- **B-A (arquitetural).** Sem consumidor real, não há rota HTTP; dominante até a decisão A–D. *(F1, §5)*
- **B-B (runtime).** O runtime TanStack Start não roda sob `bun test`; verificação HTTP exige build/runtime
  atual (Vite + nitro/Cloudflare) — ver G4.2/G4.3.
- **B-C (backend).** Auth/autorização/assinatura exigem Supabase; o único projeto autorizado é
  `rsukwuqocgjmwwuwtqaf`, e qualquer operação remota precisa de autorização explícita. A stack local ativa é
  de outro ref (fora de escopo).
- **R-1 (dados).** Para a Opção A, os posts de UI precisam expor identidade canônica `(bucket, path)`; hoje
  carregam URL pública/OPFS.
- **R-2 (falso senso de cobertura).** Existem testes de unidade robustos, mas **nenhuma** cobertura HTTP — não
  confundir as duas.
- **R-3 (C2/Storage).** Buckets/políticas públicas permanecem abertas; integração G4 não resolve C2.
- **R-4 (identidade).** `getPostMediaUrl` é o único server fn bearer; um consumidor futuro deve fornecer
  `Authorization` (o attacher já existe em `src/start.ts:26`).

---

## 10. Recomendação final e próximos passos

**Recomendação:** adotar a **Opção A** — criar **um** consumidor real de `getPostMediaUrl` para mídia de posts
canônicos, atrás de `VITE_APP_SCHEMA_A_MEDIA_URL`, com fallback legado quando a flag estiver OFF — como o
menor passo arquiteturalmente legítimo que (i) registra a server function no grafo de build, (ii) preserva o
comportamento atual com a flag OFF e (iii) habilita a futura validação HTTP. Manter a **Opção D** (manter e
documentar) como alternativa de custo zero caso a decisão de produto não venha.

**Prerequisitos antes de qualquer implementação:**
1. Decisão de produto sobre qual superfície (posts canônicos) passa a usar o resolvedor assinado.
2. Garantir que a fonte desses posts forneça a identidade canônica `(bucket, path)` (R-1).
3. Autorização explícita para validar contra `rsukwuqocgjmwwuwtqaf` (B-C), quando aplicável.

**Restrições mantidas nesta execução:** apenas este relatório foi criado; nenhuma flag ativada; nenhuma
operação remota; nenhuma alteração de infraestrutura, código, UI, testes ou documentos anteriores.
