# ADR — Migração da bio de `bio_posts` para `posts`

- **Data:** 2026-10-10
- **Fase:** 7 (contratos de perfil + registro das decisões da bio)
- **Tipo:** nota de decisão arquitetural (ADR). **Somente documentação.**
- **Herdado:** Fase 5 (auditoria `bio_posts` × `posts`), Fase 6 (F0) e auditoria independente da Fase 6.
- **STATUS:** **D1 APROVADO — TRANSIÇÃO PENDENTE. D2 APROVADO — ARQUITETURA E TRANSIÇÃO PENDENTES. D3–D5 pendentes.**
- **MIGRAÇÃO:** **NÃO APROVADA E NÃO EXECUTADA**
- **Atualização:** D1 aprovado em 2026-10-10; D2 aprovado em 2026-10-10 (somente documentação; sem código, SQL, RLS ou buckets).
- **Banco remoto / SQL / migrations / buckets / RLS / flags:** **não tocados nesta fase.**

Este documento registra contexto, riscos, opções e o estado das decisões. As decisões de
privacidade (D1) e de mídia (D2, objetivo de segurança) foram aprovadas fora deste documento;
D3–D5 seguem pendentes. **Nenhuma** migração de dados ou telas foi feita.

> Convenção: **Fato verificado** = lido no código/migrations deste repositório.
> **Hipótese** = inferência ainda não confirmada em ambiente remoto.
> **Pendente** = requer decisão do produto antes de virar implementação.

---

## 0. Contexto

Existem hoje **dois modelos** para conteúdo textual com mídia:

| | `bio_posts` (legado) | `posts` (Schema A) |
| --- | --- | --- |
| Tabela | `public.bio_posts` (migration `20260709023719`) | `public.posts` (migration `20260925030806`) |
| Campos principais | `id`, `author_id`, `text` NOT NULL, `media_url`, `media_kind`, `place_id`, `created_at` | `id`, `author_id`, `text` NULL, `category`, `privacy`, `location_label`, `hashtags`, `media` jsonb, `created_at` |
| Leitura | **anônima** (`GRANT SELECT ... TO anon` + policy `USING (true)`) | **somente `authenticated`**, com regra por `privacy` |
| Privacidade | não existe coluna; é sempre pública | `privacy ∈ {PUBLIC, CONNECTIONS, PRIVATE}` (CHECK) |
| Localização | `place_id` FK → `places` | `location_label` texto livre |
| Mídia | `media_url` (texto) + `media_kind ∈ {image, video}` | `media` jsonb `[{ preview, type, mediaId? }]` |

A tela de gerenciamento da bio (`_app.gerenciar.bio.tsx`) e os consumidores atuais
(`bio-posts.tsx`, `_app.perfil.$id.tsx`, MCP `list-my-moments`/`create_moment`) operam
sobre **`bio_posts`**. O `posts` do Schema A ainda **não tem consumidor de UI** identificado.

A migração é uma troca de **fonte de verdade por domínio**, e não pode começar antes
das decisões de produto abaixo.

---

## D1. Privacidade — **APROVADO — TRANSIÇÃO PENDENTE**

**Fatos verificados**

- `bio_posts` concede `SELECT` a `anon` e tem policy `"Bio posts are public"` `USING (true)`
  → **leitura pública anônima** (migration `20260709023719`, linhas 65-69).
- `posts` revoga `anon` e concede apenas a `authenticated`; a policy
  `posts_select_privacy` libera `PUBLIC`, o próprio autor, e `CONNECTIONS` via `are_connected`
  (migration `20260925030806`, linhas 762-780).
- A tela de gerenciamento da bio **não possui seletor explícito de privacidade**.

**Decisão aprovada (modelo de privacidade)**

O Connexy adotará um modelo em que **a visualização de publicações exige autenticação** e a
**privacidade é controlada explicitamente**. O modelo de `posts` já prevê os níveis
`PUBLIC`, `CONNECTIONS` e `PRIVATE`; o significado operacional de cada nível deverá respeitar
as políticas de acesso **efetivamente implementadas**.

No modelo aprovado, **`PUBLIC` NÃO descreve acesso anônimo**: a leitura exige autenticação.
`PUBLIC` indica apenas a audiência mais ampla **entre usuários autenticados**.

**Justificativa**

- Elimina a leitura anônima de conteúdo (`bio_posts` hoje é anon-público).
- Torna a visibilidade um atributo **explícito** do conteúdo, em vez de um padrão implícito.
- Alinha a bio ao contrato de `posts` (`privacy` + RLS por audiência).

**Impactos**

- **Nenhuma publicação** deve continuar acessível anonimamente **após a transição definitiva**.
- A transição **não pode** alterar silenciosamente a visibilidade das publicações existentes.
- O fato de uma publicação ter sido pública em `bio_posts` **não** define automaticamente a
  estratégia de migração.
- Exige tratamento explícito da intenção de visibilidade, comunicação aos usuários e
  eventuais confirmações/escolhas necessárias.

**Requisitos de transição (PENDENTES DE PLANEJAMENTO)**

1. Nenhuma publicação acessível anonimamente após a transição definitiva.
2. A transição não pode alterar silenciosamente a visibilidade das publicações existentes.
3. Ter sido pública em `bio_posts` não define automaticamente a migração.
4. Especificar como preservar a intenção de visibilidade, informar os usuários e tratar
   eventuais confirmações/escolhas necessárias.
5. `PUBLIC` não deve ser descrito como acesso anônimo (a leitura exige autenticação).
6. O procedimento de transição dos dados existentes continua **pendente de planejamento**
   (ver D4).

**Opções consideradas (histórico — não vinculantes)**

1. **Default `PUBLIC`** para todos os `bio_posts` migrados (preserva comportamento atual).
2. **Default mais restritivo** (ex.: `CONNECTIONS`) e exigir revisão do usuário.
3. **Campo opcional de privacidade na bio**, com default definido pelo produto.
4. **Não migrar a bio** para `posts` neste ciclo (manter `bio_posts` como está).

**Decisão:** **APROVADO** (modelo de privacidade). **TRANSIÇÃO PENDENTE.**

**Nota de escopo:** a aprovação do **modelo** não autoriza, por si só, mudanças de código,
RLS, buckets ou banco de dados. Esta decisão **não** define a privacidade individual de
publicações existentes, que permanece pendente de planejamento (D4).

---

## D2. Privacidade da mídia — **APROVADO — ARQUITETURA E TRANSIÇÃO PENDENTES**

**Decisão aprovada (objetivo de segurança)**

A mídia de uma publicação **deve respeitar a privacidade da publicação**: o acesso ao arquivo
deve respeitar a autorização da publicação. Ocultar a imagem na interface, restringir a
consulta SQL ou conhecer o nível de privacidade **não é suficiente** se o arquivo continuar
recuperável por uma URL pública irrestrita.

**Regra de acesso por nível**

- **`PUBLIC`:** mídia visualizável por usuários **autenticados** autorizados a visualizar a
  publicação. Neste modelo, **`PUBLIC` não significa acesso anônimo**.
- **`CONNECTIONS`:** mídia visualizável somente por usuários autenticados que satisfaçam a
  regra de conexão autorizada.
- **`PRIVATE`:** mídia visualizável somente pelo proprietário da publicação.

**Fatos verificados (auditoria somente leitura — Fase 8)**

- Os **três** buckets (`avatars`, `bio-media`, `reels-media`) estão declarados `public = true`
  em `supabase/config.toml` (linhas 6-14) e nas migrations que os materializam
  (`20260816120000` para `avatars`; `20261009120000` para `bio-media`/`reels-media`).
- As policies de leitura de `storage.objects` foram restringidas para `TO authenticated` nos
  três buckets (`20260825025605` para `bio-media`/`reels-media`; `20260825025843` para `avatars`).
- **Contradição crítica:** com o bucket `public = true`, o objeto continua acessível pela URL
  pública (`/storage/v1/object/public/{bucket}/{path}`), que **não** passa por RLS. Restringir
  a policy de `SELECT` **não** torna o arquivo privado enquanto o bucket for público.
- O fluxo legado de bio **armazena a URL pública completa** em `bio_posts.media_url`
  (`src/components/bio/bio-posts.tsx:45,133` via `getPublicUrl`) e exibe com `<img>`
  (`bio-posts.tsx:299`; `src/routes/_app.perfil.$id.tsx:89`).
- Reels armazenam o **path** do objeto em `reels.video_url`/`poster_url`
  (`src/lib/reels/reel-publish.ts:127-151`), mas o adapter grava `media.videoUrl`
  (`src/lib/adapters/schema-a/content.ts:130`), que no app é uma URL local — **divergência**.
- O onboarding grava em `profiles.photo_url` uma **URL assinada com validade de ~5 anos**
  (`src/routes/completar-perfil.tsx:247-253`), que funciona como **link portador** de longa duração.
- `StorageHelper` (`src/lib/supabase/storage.ts`) só expõe `getPublicUrl`; **não há helper de
  URL assinada** nos fluxos de bio/avatar/reels.
- A mídia de `posts` (Schema A) **ainda não sobe** para o Storage: `_app/create-post.tsx` salva
  em IndexedDB (`saveLocalMedia`) e persiste só em demo (ver L3).

**Requisitos de transição (PENDENTES DE PLANEJAMENTO)**

1. Preservar as **mídias existentes** e evitar **links quebrados** durante a transição.
2. Avaliar **URLs já armazenadas**, **links compartilhados**, **cache** e conteúdo que já tenha
   sido **acessado publicamente** — esses acessos não são revogados por mudança de banco.
3. Não considerar um objeto "protegido" só porque a referência no banco mudou: cópias e
   referências públicas residuais continuam recuperáveis.
4. Garantir que, após a transição, nenhum objeto vinculado a publicação `CONNECTIONS` ou
   `PRIVATE` permaneça recuperável por URL pública irrestrita.

**Decisão:** **APROVADO** (objetivo de segurança). **ARQUITETURA E TRANSIÇÃO PENDENTES.**

**Nota de escopo:** a decisão aprova o **objetivo de segurança**, mas **não escolhe
definitivamente** a implementação técnica e **não autoriza alterações remotas** (buckets,
policies, RLS ou dados). Nenhuma solução técnica nem alteração remota foi autorizada nesta
fase. As subseções abaixo são **auditoria e proposta**, não implementação aprovada.

### D2-A. Mapa dos fluxos de mídia (auditoria Fase 8)

| Fluxo | Bucket | Referência armazenada | Leitura/entrega | Proteção observada | Arquivos |
| --- | --- | --- | --- | --- | --- |
| Bio post — upload (legado) | `bio-media` | **URL pública completa** em `bio_posts.media_url` | `<img src>` direto | Nenhuma (bucket `public=true`; URL pública ignora RLS) | `src/components/bio/bio-posts.tsx:39-47,131-135`; `src/services/upload.service.ts:97-103`; `src/lib/supabase/storage.ts` |
| Bio post — leitura no perfil | `bio-media` | idem (`media_url`) | `<img src={media_url}>` | Nenhuma | `src/routes/_app.perfil.$id.tsx:86-96`; `bio-posts.tsx:296-303` |
| Bio post — MCP | `bio-media` | `bio_posts.media_url` (URL fornecida pelo cliente) | retorna `media_url` cru | Nenhuma | `src/lib/mcp/tools/create-moment.ts:21-31`; `src/lib/mcp/tools/list-my-moments.ts:17-22` |
| Avatar — gestão | `avatars` | URL pública em `profiles.photo_url` | `<img src>` | Bucket público; policy `SELECT` só `authenticated` (não protege URL) | `src/components/bio/bio-avatar.tsx:116-128`; `upload.service.ts:87-95` |
| Avatar — onboarding | `avatars` | **URL assinada (~5 anos)** em `photo_url` | `<img src>` | Token portador de longa duração | `src/routes/completar-perfil.tsx:233-263` |
| Reels — vídeo/poster | `reels-media` | **path** em `reels.video_url`/`poster_url` (`publishToSupabase`) | App exibe mídia local (OPFS/IndexedDB); path remoto não resolvido | Bucket público | `src/lib/reels/reel-publish.ts:121-153`; `content.ts:112-138`; `src/integrations/supabase/remote/content.repository.ts:108-138` |
| Schema A `posts` (planejado) | (mapa: `post` → `bio-media`) | `posts.media` jsonb `{preview,type,mediaId}` | `preview` (data URL demo) / mídia local | N/A hoje (não sobe ao Storage) | `src/routes/_app/create-post.tsx:26-104`; `content.ts:56-93`; `src/lib/storage/schema-a-storage.ts:44-51` |
| Uploader genérico | params `destination` | `remoteUrl`/`remotePath` no estado React | `getPublicUrl` | Nenhuma | `src/components/upload/UploadMedia.tsx:168-201`; `src/hooks/api/use-upload.ts`; `src/lib/upload/upload-storage.ts` |

> Mapa `purpose` → bucket já definido em `src/lib/storage/schema-a-storage.ts:44-51`
> (`bio`/`post` → `bio-media`; `reel`/`reel-poster` → `reels-media`; `avatar`/`cover` → `avatars`).

### D2-B. Alternativas arquiteturais (proposta — NÃO aprovada) e plano de transição

**Alternativa 1 — Bucket privado + URLs assinadas.**
Gerar URL temporária após verificar a autorização do usuário para a publicação.
- Vantagens: um único mecanismo; revogação aproximada por expiração; permite `PUBLIC` autenticado.
- Desvantagens: URLs assinadas são **portadoras** (quem tiver o link acessa até expirar); exige
  renovação/refresh de cache; assinatura deve ser mintada no servidor após checagem.
- Riscos: chamadas que contornem a tela ainda precisam passar pelo backend que assina; cache/CDN
  pode reter conteúdo; reutilização indevida do link dentro da janela de validade.
- Requisitos: expiração curta; `StorageHelper` precisa de `createSignedUrl`; camada de autorização
  por publicação; reescrever referências para **path** (não URL).
- Compatibilidade: média — muda o modelo de referência e a leitura; alinha com `posts.media` path.

**Alternativa 2 — Bucket público para mídia pública + privado para restrita.**
- Vantagens: melhor desempenho/cache para `PUBLIC`; menos assinaturas.
- Desvantagens: **conflita com D1/D2**, pois "bucket público" implica acesso **anônimo**, e
  `PUBLIC` aqui **não** é anônimo.
- Riscos: mover objetos, referências antigas, **cópias residuais** no bucket público; impossível
  garantir que `CONNECTIONS`/`PRIVATE` nunca caia no público.
- Requisitos: política de roteamento por privacidade; migração de objetos e referências.
- Compatibilidade: baixa/média — só aceitável se o produto **relaxar** `PUBLIC` para anônimo.

**Alternativa 3 — Entrega mediada por endpoint autorizado.**
Endpoint autentica, verifica a privacidade e entrega/redireciona o arquivo.
- Vantagens: autorização sempre no servidor (não apenas "escondida na tela"); um ponto de auditoria.
- Desvantagens: mais complexidade, custo e latência; cache precisa ser controlado; possível gargalo.
- Riscos: cabeçalhos de cache incorretos vazam conteúdo; precisa de storage privado por trás.
- Requisitos: endpoint + verificação por publicação + storage privado; política de cache.
- Compatibilidade: média — pode combinar com a Alternativa 1 (endpoint que **assina**).

**Recomendação preliminar (hipótese, a comprovar):** **Alternativa 1**, possivelmente mediada
pela Alternativa 3 para arquivos grandes (Reels). Buckets **privados**; referências guardadas como
**path**; URL assinada de **vida curta** mintada apenas **após** checagem de autorização da
publicação; `PUBLIC` exige autenticação (nunca anônimo). **Pontos a comprovar:** comportamento real
da URL pública de bucket público (confirmar que ignora RLS); custo/erros de assinatura; reescrita
de referências existentes; impacto em Reels e no onboarding.

**Plano de preservação e migração (conceitual — exige autorização separada):**

1. **Inventariar** objetos e associações: mapear cada `bio_posts.media_url`, `reels.video_url`/
   `poster_url`, `profiles.photo_url`/`cover_url` e `posts.media[].preview` a um bucket/path.
2. **Classificar** referências: URL pública antiga vs path; objeto com dono comprovado vs órfão.
3. **Preservar** fotos/vídeos/metadados: nunca apagar antes de reescrever a referência e validar.
4. **Proteger novos** objetos desde a criação (bucket privado; gravar **path**, não URL).
5. **Migrar por etapas:** reescrever referências (URL→path) → mover objetos para bucket privado →
   validar leitura autorizada → invalidar/eliminar URLs públicas antigas.
6. **Tratar legado acessível:** assumir que URLs públicas **já vistas/baixadas/compartilhadas**
   podem permanecer acessíveis; rotacionar caminhos quando necessário; documentar o risco residual.
7. **Validar acesso permitido e negado** para cada nível (`PUBLIC` autenticado, `CONNECTIONS`,
   `PRIVATE`) e para anônimo (deve falhar).
8. **Rollout gradual** com monitoramento (taxa de 403/404, erros de assinatura) e **reversão**.
9. **Critérios de encerramento** das referências públicas antigas: zero referências de URL pública
   em produção, todos os objetos vinculados a publicações restritas em bucket privado, e nenhuma
   nova URL pública emitida.

> Operações que **exigiriam autorização separada**: alterar `public` dos buckets; aplicar RLS/novas
> policies; mover/copiar/excluir objetos; reescrever referências no banco; criar endpoint/função;
> gerar URLs assinadas reais.

---

## D3. Localização — **PENDENTE**

**Fatos verificados**

- `bio_posts.place_id` é `UUID REFERENCES public.places(id) ON DELETE SET NULL`.
- `posts.location_label` é `TEXT` (sem FK).

**Opções (não escolhidas)**

1. **Manter a referência relacional** (adicionar `place_id` a `posts` — extensão de schema).
2. **Traduzir para rótulo** (`location_label`) no momento da migração, perdendo o vínculo.
3. **Planejar extensão de schema** com ambos (FK + label de fallback).

**Impacto:** a opção 2 perde a capacidade de navegar/relacionar por `places`; a opção 3 é a
mais custosa, mas a mais fiel. Não escolher sem validação de produto.

**Decisão:** PENDENTE.

---

## D4. Transição e compatibilidade — **PENDENTE**

Planejamento **necessário** antes de migrar (nada disto está aprovado ou executado):

- **Backfill** dos dados existentes de `bio_posts` → `posts`.
- **Leitura compatível durante a transição** (ler de onde enquanto os writes acontecem?).
- Tratamento de **falhas e duplicação** (idempotência, reexecução, mapeamento de id).
- Critérios objetivos para **retirar a leitura e a escrita legadas**.
- Comportamento das **rotas públicas de perfil** (hoje `bio_posts` é anon-público) durante e
  após a transição.
- Compatibilidade com as **ferramentas MCP** (`list-my-moments`, `create_moment`) que hoje
  escrevem/leem `bio_posts`.

**Decisão:** PENDENTE. **Nenhuma migração foi aprovada ou executada nesta fase.**

---

## D5. Lacunas técnicas conhecidas

Marcadas por tipo (fato / hipótese / pendente). **Não serão resolvidas nesta fase.**

| # | Item | Tipo | Observação |
| --- | --- | --- | --- |
| L1 | `FeedRepository.like/unlike` referencia a tabela `likes`, que **não** consta nas migrations analisadas | **Fato** (código) | Caminho possivelmente morto; não remover nesta fase. |
| L2 | `useFeed`/`FeedService.getFeed` e `RemoteContentRepository` sem consumidor de UI identificado | **Fato** (busca no repo) | Podem ser superfície futura ou código ainda não ligado. |
| L3 | `_app/create-post.tsx` persiste apenas no modo demo (`saveDemoPost`) | **Fato** (código) | Não grava em `posts` nem em `bio_posts`. |
| L4 | Caminhos legados de edição de perfil (`bio-mood.tsx`, `bio-interests.tsx`, `bio-personal-data.tsx`) continuam fora do fluxo Schema A | **Fato** (código) | Escrevem via repositório de perfil legado. |
| L5 | `bio_posts.text` é NOT NULL; `posts.text` é NULL | **Fato** (DDL) | Migração precisa garantir `text` não nulo ou tratamento explícito. |
| L6 | `posts` usa `location_label`; `bio_posts` usa FK `place_id` | **Fato** (DDL) | Ver D3. |
| L7 | Bucket `bio-media` `public=true` × policy de leitura `authenticated` | **Fato** + **Hipótese** | Precisa avaliação conjunta de storage/RLS (ver D2). |

---

## Resumo das decisões pendentes

- **D1 Privacidade:** **modelo APROVADO** (visualização autenticada + privacidade explícita;
  `PUBLIC` ≠ anônimo). Transição dos dados existentes **PENDENTE** — **produto + engenharia**.
- **D2 Privacidade da mídia:** **objetivo APROVADO** (a mídia segue a privacidade da publicação;
  `PUBLIC` ≠ anônimo). Arquitetura e transição **PENDENTES** — **produto + engenharia de storage/RLS**.
- **D3 Localização:** referência vs rótulo vs extensão — **produto + schema**.
- **D4 Transição:** backfill, compatibilidade, rollback e corte do legado — **engenharia + produto**.
- **D5 Lacunas:** dívidas técnicas registradas, sem resolução nesta fase — **engenharia**.

D1 (modelo de privacidade) e D2 (objetivo de segurança da mídia) estão **aprovadas**; as
**arquiteturas** e os **procedimentos de transição** dos dados existentes e as decisões D3–D5
permanecem pendentes. Nenhuma migração de dados foi executada e nenhuma mudança de código,
RLS ou bucket foi feita.
