# Connexy — G4.25: auditoria final local de avatares e preparação da remediação C2

Data: 2026-10-20 · Tipo: **AUDITORIA FINAL E PLANEJAMENTO (somente leitura/documentação local)** · Branch `backup/connexy-snapshot-2026-10-02` · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (inalterado).

> **Natureza das conclusões:** resultado de **análise estática** do código atual, migrations,
> contratos de mídia e `supabase/config.toml`. **Nenhum** runtime foi iniciado, **nenhuma** requisição
> HTTP foi feita e **nenhum** serviço remoto foi acessado. Este documento **não** prova o estado real
> do projeto Supabase, das policies aplicadas, do conteúdo dos buckets nem da CDN/borda.
>
> **Esta fase NÃO corrige C2.** Ela consolida o resultado combinado das G4.21, G4.23 e G4.24 e produz
> uma visão final dos caminhos de exibição de avatares reais, das referências legadas e dos bloqueios
> para proteger o Storage. **Nada** foi implementado, configurado, migrado, commitado ou enviado.
>
> Regra de leitura: **[F]** = fato verificado em arquivo local; **[I]** = inferência a partir de
> código/config; **[H]** = hipótese ainda não comprovada (não tratar como segura).

---

## A. Veredito da auditoria

**AUDITORIA CONCLUÍDA. INVENTÁRIO SUFICIENTEMENTE FUNDAMENTADO. REMEDIAÇÃO C2 NÃO EXECUTADA.**

- **[F]** As G4.21/G4.23/G4.24 produziram um **caminho de exibição autenticado funcional** para
  avatares reais: classificador offline (`avatar-media.ts`), serviço server-side de assinatura curta
  (`avatar-media-authorization.server.ts`), endpoint autenticado (`avatar-media.functions.ts`) e
  componente compartilhado (`authenticated-avatar-image.tsx`), já conectados a **24 arquivos** de
  consumidores de perfil.
- **[F]** O resolvedor é **fail-closed**: ausência, recusa de autorização, referência inválida ou
  falha de assinatura **não** reabrem acesso público; o consumidor cai no fallback local. O endpoint
  aceita **apenas** `profileId` UUID e valida bucket/path/dono antes de assinar.
- **[F]** Restam **leitores diretos** de `photo_url`/`photo` em telas específicas. A auditoria os
  classificou (Seção D): a maioria é **demo/mock local/externo**; nenhum leitor direto remanescente
  foi identificado como “avatar real autenticável ainda não migrado” no caminho principal de perfil.
- **[F]** **C2 permanece ABERTO e NÃO corrigido.** Os três buckets ativos (`avatars`, `bio-media`,
  `reels-media`) continuam declarados `public = true`; a policy `"Avatars public read"` (sem `TO`)
  segue válida no repositório e nunca é removida; nenhuma migration torna bucket privado.
- **[I]** Enquanto os buckets forem públicos, o caminho autenticado é **preparação**, não controle de
  confidencialidade. Fechar C2 exige ação remota coordenada, autorizada e reversível.
- **Veredito:** *INVENTÁRIO E PLANO PRONTOS; EXECUÇÃO REMOTA BLOQUEADA ATÉ AUTORIZAÇÃO EXPLÍCITA.*
  Não declarar C2 corrigida.

---

## B. Baseline de Git

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` |
| `git status --short` inicial | **291** entradas |
| `supabase/config.toml` `project_id` | `rsukwuqocgjmwwuwtqaf` (config **local**; sem link remoto) **[F]** |
| Flag `VITE_APP_SCHEMA_A_MEDIA_URL` | **desligada** — `media-url-flag.ts:8` só habilita com `=== "true"`; nenhum `.env*` a declara **[F]** |

As 291 entradas preexistentes foram **preservadas** (incluindo `.env` staged como removido,
`.env.example`, `package.json`, `bun.lock`, `supabase/config.toml`, migrations e os incrementos
G4.20–G4.24). Nenhum `reset`/`clean`/`checkout`/`rebase`/`stash`/commit/push foi executado.

---

## C. Inventário consolidado de leitores e escritores de `profiles.photo_url`

### C.1 Escritores (quem grava o campo) **[F]**

| Fluxo | Local | Formato gravado | Gate |
| --- | --- | --- | --- |
| Edição de avatar (bio/avatar UI) | `src/components/bio/bio-avatar.tsx:117-124` | **URL pública** (`getPublicUrl`) em `photo_url` | `configured` |
| Remoção de avatar | `src/components/bio/bio-avatar.tsx:150` | `null` | `configured` |
| Cadastro — ramo legado | `src/routes/completar-perfil.tsx:247-257` | **URL pública** (corrigido na G4.20; sem `createSignedUrl`) | `configured && user` |
| Cadastro — ramo Schema A | `src/routes/completar-perfil.tsx:205,216` → `saveOwn` | **caminho canônico** `{uid}/{uuid}.jpg` | `isRemoteProfileEnabled()` (**OFF**) |
| Adaptadores | `src/lib/adapters/schema-a/profile.ts:106,124,176` | `photo` ⇄ `photo_url` (string repassada) | — |
| Repositório | `src/integrations/supabase/remote/profile.repository.ts:9,53` | texto (`photo_url`) | — |
| Helpers | `src/services/upload.service.ts:87-95,105-108`; `src/lib/supabase/storage.ts:8-10` | URL pública (`getPublicUrl`) | — |

- **[F]** Não há mais emissão de **URL assinada de longa duração** no cadastro (G4.20). O único
  `createSignedUrl` de avatar no repositório é o do resolvedor server-only com TTL **180 s**
  (`avatar-media-authorization.server.ts:92-94`).
- **[F]** O ramo Schema A persistiria **caminho canônico** em `photo_url`, mas está gated por
  `isRemoteProfileEnabled()` (**OFF**); é lacuna preexistente registrada na G4.20/G4.22.

### C.2 Consumidores que usam o resolvedor autenticado (`AuthenticatedAvatarImage`) **[F]**

24 arquivos contêm `AuthenticatedAvatarImage`:
`_app.home.tsx`, `_app.pessoas.tsx`, `_app.connecta.tsx`, `_app.solicitacao.$id.tsx`,
`_app/discover.tsx`, `_app.perfil.index.tsx`, `_app.perfil.$id.tsx`, `bio/bio-avatar.tsx`,
`discover/nearby-map-item-card.tsx`, `discovery/people-list.tsx`, `discovery/people-list-card.tsx`,
`discovery/person-card.tsx`, `chat/chat-header.tsx`, `chat/thread-avatar.tsx`,
`chat/conversation-card.tsx`, `chat/conversations-screen.tsx`, `chat/group-invite-sheet.tsx`,
`feed/FeedNearbyPeople.tsx`, `feed/cards/networking-card.tsx`, `feed/cards/post-card.tsx`,
`feed/cards/moment-card.tsx`, `presence/presence-live-feed-real.tsx`, `reels/reel-card.tsx`,
`reels/reel-user.tsx`, `reels/comments-sheet.tsx`.

### C.3 Cadeia de resolução (fontes de dados do campo) **[F]**

- `profiles` (home/proposto): `_app.home.tsx:80` → `AuthenticatedAvatarImage` (`:113`).
- Perfil público: `_app.perfil.$id.tsx:104` (`row.photo_url`) → `:323`.
- Descoberta/lista: RPC `get_nearby_profiles` → `NearbyProfile.photo_url`; `_app.pessoas.tsx:100`,
  `_app.discover.tsx:152`, `people-list.tsx`, `people-list-card.tsx`, `person-card.tsx`.
- Conversas reais: `conversations-screen.tsx:159-167` (`other.profile.photo_url`).
- Chat: `ConnexyChatScreen.tsx:211` (`profile.photo_url`) via `activeParticipant.photo` →
  `message-list`/`message-bubble` (prop `participantPhoto`, hoje **não renderizada** em
  `message-bubble.tsx`; a prop é recebida mas não usada em `<img>`).
- Reels/comentários: `reel-card.tsx:159,215`, `comments-sheet.tsx:48,71,138` (join
  `profiles:author_id(name, photo_url)`).
- Presença: `presence-live-feed-real.tsx:42` → `:115-117`.
- Conexões (hook): `use-connections.ts:38` → consumidores de lista.

> **[F]** Em todos os contextos acima o valor persistido é repassado como `legacyUrl`, e o ID do
> perfil é a chave de resolução. Quando o ID não é UUID (demo) ou o valor é `blob:`/`data:`, o
> componente renderiza o valor local diretamente sem chamar o endpoint.

---

## D. Lacunas de migração (leitores diretos remanescentes)

Classificação dos leitores que ainda renderizam imagens diretamente em `<img src>` sem o resolvedor.
**Nenhum** foi classificado como “avatar real autenticável ainda não migrado” no fluxo principal.

### D.1 Demonstração ou conteúdo local **[F]**

| Local | Fonte | Classificação |
| --- | --- | --- |
| `_app.perfil.$id.tsx:411` (`sharedFriends`), `_app.perfil.index.tsx:430` (`people`) | `findPerson`/`listPeople` (mock-data, `i.pravatar.cc`/Unsplash) | demo local |
| `_app.notificacoes.tsx:92,166` | `resolveDemoCatalogPerson` (`functional-conversation-list.ts:26`) | demo local |
| `_app/my-connexy.tsx:66` | `currentUser.photo` (`mock-data.ts:6,10`) | demo local |
| `_app.solicitacao.$id.tsx:121,160` | `mockPerson.photo` (demo/engine) | demo local |
| `feed/cards/premium-card.tsx:81`; `home-premium.ts` | cartões sintéticos (`card.photo`) | demo local |
| `feed/FeedNearbyDrivers.tsx:51`; `feed/cards/route-card.tsx:17`; `reels/reel-driver-card.tsx:22` | `demo-fleet` (motoristas demo) | demo local |
| Rotas de carona (`carona.*.tsx:111,209,216,384`) | `resolveCaronaPerson` → `findPerson`/`currentUser` | demo local |
| `person-detail-sheet.tsx:83,146` | modelo demo de pessoa | demo local |
| `post/demo-post-detail.tsx`, `mention-input.tsx`, `post-preview.tsx`, `publisher/PublisherPreview.tsx` | modelos demo | demo local |
| `event-checkin/*`, `profile/atoms/hero.tsx` | sem consumidores reais no repositório | demo/genérico |

### D.2 Imagem externa legítima **[F]**

| Local | Fonte | Classificação |
| --- | --- | --- |
| `marketplace/*`, `event-card.tsx`, `business-gallery.tsx`, `business-card.tsx` | comércio/evento (fotos de negócio) | mídia não-avatar |
| `mobility/ride/*`, `mobility/driver-*` | veículos/motoristas demo | mídia não-avatar |
| `discover/nearby-map-item-card.tsx:64` | ramo não-`pessoas` (locais) | mídia não-avatar |
| `_app.perfil.$id.tsx:201`, `coverImages`/mocks | Unsplash (demo) | externa legítima |

### D.3 Avatar real ainda não migrado

- **[F]** **Nenhum** consumidor de `profiles.photo_url` real identificado como pendente no fluxo
  principal. Os 24 consumidores de perfil já usam `AuthenticatedAvatarImage`.
- **[I]** Exceção potencial: avatares de terceiros em listas estáticas de amizade
  (`sharedFriends`/`people`) operam sobre `findPerson` (mock-data), sem ID de perfil autenticável.
  Se algum dia essas listas passarem a vir de `profiles`, exigirão wiring.

### D.4 Mídia que não é avatar / referência legada que requer migração **[F]**

- `bio-posts.tsx:45,133` (**URL pública** em `bio_posts.media_url`, bucket `bio-media`) — legado que
  requer migração (fora do escopo de avatar; Etapa 9 do G4.19).
- `reel-card.tsx` (`src={reel.video_url}`) — caminho/poster de `reels-media` (render local OPFS).
- `message-bubble.tsx` (`participantPhoto`) — prop recebida e não usada em `<img>`; sem exposição.

### D.5 Inconclusivo

- **[H]** `feed-composer.tsx:13` (`userPhoto`) recebe a foto do usuário corrente via `Feed`; a origem
  exata (`currentUser.photo` demo vs. perfil remoto) não foi determinada no fluxo de chamada. Sem
  evidência de URL real de Storage.

---

## E. Resultados e limitações das verificações locais

### E.1 Fatos demonstrados pelo código local **[F]**

1. **Falha fechada do resolvedor:** em `authenticated-avatar-image.tsx:41-52`, ausência de `url`
   (`status !== "ready"`), `catch` de exceção e resposta obsoleta resultam em `setResolvedUrl(null)`
   → renderiza `fallback` local. **Não há** caminho que reabra `/object/public/` a partir de falha.
2. **Endpoint mínimo:** `avatar-media.functions.ts:7` aceita só `{ profileId: uuid }`; middleware
   `requireAppSupabaseAuth` (Bearer JWT) obrigatório; `:24` rejeita sem token.
3. **Sem URL/path do cliente:** o serviço lê `photo_url` da linha sob RLS
   (`avatar-media-authorization.server.ts:75-85`), classifica com `expectedOwnerId` e valida
   `validateMediaPath` (`:55-58`). O bucket é fixo em `avatars`; o 1º segmento deve ser o UUID do
   perfil.
4. **Sem reuso indevido de posts:** o serviço **não** usa `getPostMediaUrl`/`authorizeMediaAccess`
   nem regras de `privacy`/conexão (`:20-25`). A regra é “qualquer autenticado”.
5. **Assinatura server-only:** `signAvatarWithServiceRole` (`:87-97`) faz `import()` dinâmico de
   `client.server`; o service role **não** entra no bundle do cliente.
6. **TTL curto:** `AVATAR_MEDIA_URL_TTL_SECONDS = 180` (`:5`), dentro do intervalo 60–300 s do
   contrato G4.19.
7. **Classificador fail-closed:** `avatar-media.ts` rejeita bucket ≠ `avatars`
   (`storage-foreign-bucket`), protocolo não HTTP(S), URL malformada no domínio de Storage e dono
   divergente (`foreign-owner`) (`:101-119`).
8. **Compatibilidade legada:** URLs públicas, assinadas (mesmo expiradas), externas e locais são
   preservadas; **nunca** convertidas em URL pública.
9. **Config local declara buckets públicos:** `config.toml` (`avatars`/`bio-media`/`reels-media`
   `public = true`) e migration `20260816120000:7-18,23-25` cria a policy de leitura pública. A
   migration `20260825025843:1` **não** remove `"Avatars public read"` (só a `authenticated read`).
10. **Flag de mídia de posts OFF:** `media-url-flag.ts:8`; o caminho de assinatura de **posts**
    (`getPostMediaUrl`) permanece sem uso em runtime.

### E.2 Hipóteses sobre a configuração remota **[H]**

- Estado efetivamente aplicado de `storage.buckets.public`, das policies e dos grants no projeto
  `rsukwuqocgjmwwuwtqaf` é **desconhecido**. O repositório **declara** o exposto em E.1.
- Conteúdo real de `profiles.photo_url` (distribuição PUB/SIGN/CANON/EXT/LOCAL) **não** inventariado.
- Não há contagem nem expiração conhecida de URLs assinadas antigas de 5 anos já persistidas.
- Comportamento de CDN/borda e caching do Storage não verificado.
- Não se presume que qualquer policy do repositório esteja aplicada ao projeto remoto.

### E.3 Resultados de testes documentados nas fases anteriores (não reexecutados) **[F]**/**[H]**

- G4.21: `bun test tests/avatar-media-g4-21.test.ts` — 18 pass; ESLint/Prettier/`tsc --noEmit` OK
  (documentado como executado localmente na G4.21).
- G4.23: `bun test tests/avatar-media-g4-21.test.ts tests/avatar-media-authorization-g4-23.test.ts`
  — 25 pass / 71 expectativas; ESLint com erro **preexistente** `no-explicit-any` em
  `people-list-card.tsx`; `tsc`/Prettier/`git diff --check` OK.
- G4.24: 9 arquivos, 101 testes pass; ESLint com 1 erro **preexistente**
  (`_app/discover.tsx:509`, `item as any`); `tsc`/Prettier/`git diff --check` OK.
- **[F]** Nesta G4.25 **nenhum** teste foi reexecutado. Os números acima são **resultados
  documentados** nas fases anteriores, não reproduzidos aqui.
- **[F]** **Nenhum** teste remoto/integrado foi executado em nenhuma das fases; os testes são
  locais/sem rede (incluindo varreduras estáticas de fonte via `source-scan`).

### E.4 Limitações da verificação local **[F]**

- Análise estática **não** prova comportamento em runtime nem o estado remoto.
- O wiring de `AuthenticatedAvatarImage` em contextos com dados de RPC (descoberta) depende de que
  o `id` retornado seja UUID de perfil real; IDs demo não iniciam resolução remota.
- `bio-media`/`reels-media` (mídia de publicação/reel) **não** foram migrados para resolução
  autenticada nesta linha de trabalho; são contratos distintos do avatar.

---

## F. Plano de remediação C2 (documentado, NÃO executado)

**Nenhuma etapa abaixo foi executada. Nada foi alterado no repositório nem no remoto.**

### F.1 Estado de segurança esperado para o bucket `avatars` (alvo) **[I]**

- `storage.buckets.public = false` para `avatars`.
- **Removida** a policy `"Avatars public read"` (acesso `anon`).
- Leitura de objeto mediada por **URL assinada curta** (TTL 60–300 s) emitida server-side, derivada
  da linha do perfil autorizada (regra “autenticado” — G4.22 §F, Modelo 2).
- Escrita preservada por **owner-folder** (`foldername(name)[1] = auth.uid()`): INSERT/UPDATE/DELETE.
- `anon` sem leitura de objeto do bucket `avatars`.
- **Nota:** o modelo de privacidade entre usuários (Modelo 3) **não** é adotado — é decisão de
  produto pendente (G4.22 §L). O alvo documentado é o Modelo 2 (autenticados).

### F.2 Políticas a verificar no ambiente real (antes de mudar) **[H]**

1. Estado aplicado de `storage.buckets.public` para `avatars`, `bio-media`, `reels-media`.
2. Existência/definição de `"Avatars public read"`, `"Avatars authenticated read"`,
   `"Avatars owner upload/update/delete"`.
3. Policies equivalentes em `bio-media` e `reels-media` (bucket-wide `authenticated`).
4. Grants de `anon`/`authenticated` sobre `storage.objects`.
5. RLS de `profiles` (SELECT authenticated `using(true)`) e da RPC `get_nearby_profiles`.

### F.3 Impacto da retirada de acesso anônimo **[I]**

- **Imagens antigas:** URLs públicas já emitidas em `photo_url` deixam de carregar para `anon` e, se
  os buckets ficarem privados, para `<img>` sem sessão; passam a depender do resolvedor autenticado.
- **URLs assinadas de 5 anos** persistidas continuam credenciais portadoras até expirar; exigem
  rotação/descarte (M7).
- **Consumidores legados:** `bio-posts` (`bio-media`) e Reels (`reels-media`) dependem de seus
  buckets; retirar acesso anônimo de `avatars` **não** os altera, mas a proteção completa dos buckets
  de publicação é escopo separado (G4.19 Etapa 9).
- **Descoberta:** a RPC entrega `photo_url` cru; se o objeto for privado, o valor não é mais
  renderizável sem resolução — é preciso ajustar a RPC para não devolver URL crua.
- **Links compartilhados/preview externo:** `<img>` deslogado quebra (G4.22 §F, Modelo 2).

### F.4 Ordem segura para compatibilizar leitores e restringir objetos (C2) **[I]**

> Regra: **nenhuma restrição de bucket precede a cobertura de leitura.**

1. **Baseline de leitura no remoto** (agregado, sem tokens; Etapa 1 do G4.19) — só após autorização.
2. **Endurecer escrita** para formato canônico (sem tocar buckets) — parar de emitir URL frágil.
3. **Backfill determinístico** das referências legadas (PUB/SIGN → CANON quando o dono for
   determinável); marcar não conversíveis.
4. **Cobrir 100% dos leitores reais** com o caminho autenticado (o principal já está migrado;
   auditar contextos residuais com dado real).
5. **Ajustar a RPC de descoberta** para não devolver URL crua.
6. **Só então restringir o bucket** (`public = false` + remover `"Avatars public read"`).
7. **Higiene:** rotacionar/descartar a URL de 5 anos; varrer `/object/public/`.

### F.5 Testes de autenticação e acesso anônimo (ambiente remoto, propostos) **[I]**

| # | Cenário | Esperado pós-C2 |
| --- | --- | --- |
| R1 | `anon` em `/storage/v1/object/public/avatars/...` | **negado** (bucket privado) |
| R2 | `anon` no endpoint `getAvatarMediaUrl` | erro de auth (middleware) |
| R3 | Autenticado resolve avatar próprio | `ready`, TTL ≤300 s |
| R4 | Autenticado resolve avatar de terceiro | `ready` (Modelo 2: qualquer autenticado) |
| R5 | Sem token/ID inválido no endpoint | `forbidden`/`missing` |
| R6 | `profileId` de bucket/path alheio | `missing`/`unavailable` |
| R7 | Objeto ausente/removido | `missing` |
| R8 | URL assinada expira | `>180 s` falha |
| R9 | `<img>` deslogado em link compartilhado | fallback/placeholder (sem objeto) |
| R10 | Rotação de URL pública antiga | nova resolução apenas autenticada |
| R11 | Ausência de token/URL assinada em logs | nenhum segredo em log |

### F.6 Critérios objetivos para confirmar bloqueio da leitura anônima **[I]**

1. `storage.buckets.public = false` para `avatars` **confirmado no remoto**.
2. `SELECT` de `anon` em `/object/public/avatars/...` **negado** (R1).
3. `anon` sem leitura de `storage.objects` para `avatars` (policy pública ausente).
4. `getAvatarMediaUrl` sem Bearer **negado** (R2).
5. Nenhuma resposta positiva emite URL `/object/public/` — apenas `/object/sign/` com
   `expiresAt − now ∈ [60,300]`.
6. Nenhum token/URL assinada em logs.
7. Snapshot e plano de rollback de policy **testados** antes da mudança.

### F.7 Riscos de URLs públicas previamente compartilhadas e URLs assinadas válidas **[I]**

- **URLs públicas já compartilhadas:** continuam acessíveis **enquanto** o bucket for público
  (independentemente da RLS de `profiles`). Ao privatizar, deixam de servir `anon` mas **não** podem
  ser “revogadas” retroativamente para quem já as baixou.
- **URLs assinadas longas (5 anos):** são credenciais portadoras; permanecem válidas até expirar e
  **não** são regeneráveis sem backfill. Rotação é obrigatória para fechar a exposição.
- **URLs assinadas curtas recém-emitidas:** válidas até 180 s e não revogáveis nesse intervalo.
- **CDN/cache de borda:** pode reter respostas públicas; não verificável localmente.

### F.8 Monitoramento e rollback **[I]**

- **Monitoramento:** taxa de resolução `ready` vs. `forbidden/missing/unavailable`; incidência de
  fallback (avatar ausente); presença de `/object/public/` em respostas/logs; erro de assinatura.
- **Rollback (não reabrir exposição):** reverter **flag/consumidores** primeiro; restaurar
  **policies anteriores mínimas** (owner-folder para mutação; SELECT mínimo); jamais
  `public = true`, jamais reemitir URL de 5 anos.
- **Risco do rollback:** restaurar uma policy antiga pode **reaplicar** a SELECT ampla/pública. Todo
  rollback deve usar as definições **mínimas**, com revisão antes de aplicar.
- **Ponto de não-retorno:** `public = false` é o passo mais sensível; exige snapshot de `photo_url` e
  plano de reversão de policy testado.

### F.9 Etapas que exigem autorização explícita **[F]**

Toda operação remota: login/link/pull/push, SQL, migrations, alteração de bucket/policy/grant,
execução de teste integrado, rotação de dados e habilitação de flag por ambiente. **Nenhuma** foi
iniciada nesta fase.

---

## G. Operações que dependem de autorização remota

1. Confirmar projeto de destino e **inspecionar** o estado aplicado de buckets/policies/grants.
2. Baseline agregado de `profiles.photo_url` e de objetos de `avatars` (sem tokens).
3. Planejar e aplicar `public = false` + remoção da policy pública de `avatars`.
4. Ajustar a RPC `get_nearby_profiles` para não devolver URL crua.
5. Rotacionar/descartar URLs assinadas de 5 anos e varrer `/object/public/`.
6. Executar os testes R1–R11 no ambiente real.
7. Definir janela, monitoramento e rollback acordados; habilitar flag por ambiente quando aplicável.

**Fora do repositório:** todas as operações acima tocam o Supabase remoto e estão bloqueadas até
autorização explícita da etapa corrente.

---

## H. Comparação final do Git com o baseline

| Momento | HEAD | Branch | `git status --short` |
| --- | --- | --- | --- |
| Antes desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 291 entradas |
| Depois desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 291 + este relatório (G4.25) |

- **Delta desta fase:** apenas `docs/audits/connexy-database-g4-25-avatar-c2-readiness.md` (novo).
- As **291** entradas preexistentes foram **preservadas**; nenhum `reset`/`clean`/`checkout`/`rebase`/
  `stash`/commit/push.
- HEAD e branch **inalterados**.

---

## I. Confirmação de ausência de alterações na aplicação, configurações e ambiente remoto

- **Nenhum runtime** iniciado; **nenhuma** requisição HTTP; **nenhum** acesso ao Supabase remoto.
- **Nenhuma** migration/SQL; **nenhuma** alteração de bucket, policy, grant ou flag
  (`VITE_APP_SCHEMA_A_MEDIA_URL` permanece **desligada**).
- **Nenhuma** alteração de `.env`/`.env.local`/`supabase/config.toml`/segredos; **nenhuma** alteração
  de `package.json`/lockfiles/dependências.
- **Nenhuma** alteração de código de aplicação, testes existentes ou migrations; **nenhum** dado
  lido/escrito/apagado.
- **Nenhum** commit/push/reset/stash/clean; **nenhum** segredo ou URL assinada completa impressa.
- **C2 NÃO foi corrigido.** A fase é exclusivamente de leitura e documentação local, com o único
  arquivo novo sendo este relatório autorizado.
