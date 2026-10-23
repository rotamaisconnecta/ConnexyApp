# Connexy — G4.21: auditoria e resolvedor seguro de avatares

Data: 2026-10-15 · Tipo: **AUDITORIA + INCREMENTO LOCAL (offline)** · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` inalterado.

> **Escopo:** auditar o contrato de avatar e, na medida do que é justificável por código e testes
> locais, implementar um resolvedor de mídia para avatares compatível com o contrato existente,
> sem quebrar consumidores e preparando uma migração futura para URLs curtas.
>
> **Natureza das conclusões:** análise estática + testes locais (`bun test`, `eslint`, `prettier`,
> `tsc --noEmit`). **Nenhum** runtime, **nenhuma** requisição HTTP, **nenhum** acesso ao Supabase
> remoto, **nenhuma** migration, **nenhuma** alteração de bucket/policy/flag, **nenhum** commit.
>
> Regra de leitura: **[F]** = fato verificado; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## A. Veredito

**APROVADA COM RESSALVAS.**

- **[F]** A auditoria confirma que **não é possível implementar hoje um resolvedor de avatar que
  assine URLs curtas de forma segura**, porque (1) **não existe regra de privacidade/autorização
  para avatar** (diferente de `posts`, que tem `PUBLIC|CONNECTIONS|PRIVATE`), (2) **não existe
  endpoint autenticado de avatar** equivalente a `getPostMediaUrl`, e (3) reutilizar a autorização
  de publicações para avatar **não é compatível**. Conforme a regra da fase, **não inventei** essas
  regras — estão registradas como decisão pendente (§J).
- **[F]** O que **é** seguro e justificado foi implementado: um **classificador/resolvedor de
  referência de avatar puramente offline** (`src/lib/media/avatar-media.ts`), isolado, que reutiliza
  `parseStorageUrl`/`validateMediaPath` de `media-path.ts`, distingue todos os formatos (público,
  assinado, caminho canônico, externo, local, ausente, inválido), é **fail-closed** e **não** faz
  rede/assinatura/cache.
- **[F]** O módulo **não foi conectado** a nenhum consumidor (justificativa em §E.3): conectar seria
  refatoração sem mudança de comportamento, ou exigiria o assinador (bloqueado), ou alteraria dados
  (remoção), o que é proibido nesta fase.
- **[F]** **C2 permanece ABERTO/NÃO corrigido**: os buckets continuam públicos. Este incremento
  **não** torna avatares privados e **não** é, sozinho, remediação de C2.

---

## B. Baseline

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` |
| `git status --short` inicial | **263** entradas (258 pré-G4.17 + relatórios G4.18, G4.19, G4.20 + correção/teste G4.20) |
| Flag `VITE_APP_SCHEMA_A_MEDIA_URL` | **desligada** — `media-url-flag.ts:8` só habilita com `=== "true"`; nenhum `.env*` declara a chave **[F]** |

As entradas preexistentes (incluindo `.env`/`.env.example`/`package.json`/`bun.lock`/`config.toml`
já modificados em fases anteriores) foram **preservadas**; nenhum `reset`/`clean`/`checkout`/`stash`
automático foi executado.

---

## C. Mapa dos leitores e escritores dos campos de avatar

Campo canônico de avatar: **`profiles.photo_url`** (bucket implícito **`avatars`**, somente imagem —
`media-path.ts:12-16`; `config.toml`). Campo correlato no mesmo bucket por propósito: **`cover_url`**
(`schema-a-storage.ts:44-51`). **Não** confundir com `bio_posts.media_url` (`bio-media`),
`reels.video_url`/`poster_url` (`reels-media`) nem `posts.media` (Schema A).

### C.1 Escritores

| Fluxo | Local | Formato gravado | Gate |
| --- | --- | --- | --- |
| Bio/avatar UI | `src/components/bio/bio-avatar.tsx:115-123,149` | **URL pública** (`getPublicUrl`) em `photo_url`; remoção grava `null` | `configured` |
| Cadastro — ramo legado | `src/routes/completar-perfil.tsx:246-248` | **URL pública** (corrigido na G4.20) | `configured && user` |
| Cadastro — ramo Schema A | `src/routes/completar-perfil.tsx:205,216` → `saveOwn` | **caminho canônico** (`photo: path`) | `isRemoteProfileEnabled()` (**OFF**) |
| Adaptadores | `src/lib/adapters/schema-a/profile.ts:106,124`; `toDomainProfile:176` | `photo` ⇄ `photo_url` (string repassada) | — |
| Repositório | `src/integrations/supabase/remote/profile.repository.ts:9,53` | `photo_url` (texto) | — |
| Helpers | `src/services/upload.service.ts:75-79,87-95`; `src/lib/supabase/storage.ts:8-10` | URL pública | — |

### C.2 Leitores/renderizadores (`photo_url` → `<img src>` direto)

`_app.home.tsx:63,80,98` (com fallback de erro inline `avatarFailed`); `_app.pessoas.tsx:97-99`;
`_app.connecta.tsx:176-178`; `_app.solicitacao.$id.tsx:46,120,129,159,190,218,514-545` (usa `photo_url`
de mock/externo também); `_app.perfil.$id.tsx:103` (view model); `_app/discover.tsx:145`;
`use-connections.ts:10,38,48`; `conversations-screen.tsx:159-163`; `ConnexyChatScreen.tsx:211`;
`reels/reel-card.tsx:32,158,211`; `reels/comments-sheet.tsx:7,47,70,137`;
`feed/FeedNearbyPeople.tsx:33`; `presence/presence-live-feed-real.tsx:22,41,114-116`;
`mobility/ride/ride-landing.tsx:68,95-97` (demo).

### C.3 Características de fallback / ciclo de vida

- **[F]** Fallback de ausência: inicial do nome ou ícone (`bio-avatar.tsx:75-80,181-188`).
- **[F]** Fallback de falha de rede: apenas `_app.home.tsx:101,115-117` (`onError` → iniciais). Os
  demais consumidores **não** têm `onError` (uma URL quebrada mostra ícone quebrado).
- **[F]** Logout/troca de usuário: os dados vêm de `ProfileRepository`/`getSchemaAProfile()` por
  sessão; **não há cache de avatar** no cliente. Os estados são re-derivados por fetch de perfil.
- **[F]** Cache: **não existe** cache de URL de avatar (nem isolado por usuário). O único cache de
  mídia é o de **posts** (`media-resolver.ts`), escopado por `authorizationScope`, e não cobre avatar.

### C.4 Distinção explícita (não reutilizar cegamente)

| Tipo | Campo | Bucket | Autorização hoje |
| --- | --- | --- | --- |
| Avatar de perfil | `profiles.photo_url`/`cover_url` | `avatars` | **Nenhuma dedicada** (Render `<img>` direto; `profiles` é `authenticated`-only por RLS de linha) **[F]** |
| Foto de publicação | `posts.media` | `bio-media` | `authorizeMediaAccess`/`canViewPost` (posts) **[F]** |
| Bio legada | `bio_posts.media_url` | `bio-media` | SELECT público de tabela **[F]** |
| Reels | `reels.video_url`/`poster_url` | `reels-media` | render local (OPFS) **[F]** |

> **[F]** A autorização de **posts** depende de `privacy` + `are_connected`; **avatar não tem
> `privacy`**. Reutilizar `getPostMediaUrl` para avatar seria **incorreto**.

---

## D. Contrato identificado e decisões técnicas

### D.1 Contrato implementado (offline, seguro, sem assinatura)

`classifyAvatarRef(value, options) => AvatarRef` e `resolveAvatarDisplayUrl(value, options) => string | null`.

`AvatarRef` discriminado:
`missing` · `local` · `external` · `storage-public` · `storage-signed` · `canonical` · `rejected(reason)`.

Decisões do contrato e como são satisfeitas:

1. **Compatibilidade com legado válido** → formatos já persistidos (URL pública, URL assinada
   legada, externa, local) são **preservados e renderizáveis** (`resolveAvatarDisplayUrl` devolve a
   mesma URL). **[F]**
2. **Distinguir as 4 origens** → `storage-public` vs `storage-signed` (via `parseStorageUrl`),
   `canonical` (via `validateMediaPath`), `external`. **[F]**
3. **URL pública não é “privada” nem “autorizada”** → o módulo **não** decide autorização; apenas
   classifica. **[F]**
4. **URL assinada expirada não vira pública** → nunca convertemos; `storage-signed` é repassado como
   está e a expiração **não** é avaliada localmente (não decodificamos token). **[F]**
5. **Rejeitar caminho/bucket/protocolo/URL malformada** → bucket ≠ `avatars` ⇒ `storage-foreign-bucket`;
   esquema ∉ {http,https,data,blob} ⇒ `non-http-protocol`; URL malformada ⇒ `unrecognized`; URL no
   próprio domínio de Storage sem forma válida ⇒ `unrecognized` (fail-closed). **[F]**
6. **Evitar tratar caminho de um usuário como de outro** → `expectedOwnerId` opcional rejeita
   `foreign-owner` (caminho e URL). **[F]**
7. **Não expor credencial no bundle** → módulo sem `supabase`, `fetch`, `createSignedUrl`,
   `service_role`, `await` (teste de fonte). **[F]**
8. **Identidade ≠ autorização** → `canonical` exige dono explícito; nenhuma decisão remota. **[F]**

### D.2 Por que NÃO assinar (resolvedor seguro completo fica bloqueado) **[F]/[I]**

- **Sem regra de privacidade de avatar.** `posts` tem `PUBLIC/CONNECTIONS/PRIVATE`; avatar **não**
  tem. Definir "quem vê o avatar de quem" é **decisão de negócio** não tomada.
- **Sem endpoint de avatar.** `getPostMediaUrl` (`media-url.functions.ts`) é posts-only; não há
  `getAvatarMediaUrl`. Criar um exigiria decidir a regra acima e o carregamento RLS da linha.
- **Reuso incompatível.** `authorizeMediaAccess` depende de `post.media` + `canary` de privacidade —
  não se aplica a `photo_url`.
- **C2.** Mesmo com assinatura perfeita, os buckets públicos mantêm o objeto acessível via
  `/object/public/`. Não afirmar privacidade.
- **Regra da fase:** na ausência de decisão, **não improvisar** implementação insegura → é isso que
  o incremento evita; a assinatura fica **BLOQUEADA até decisão** (§J).

### D.3 Sobre cache / resolução assíncrona

O classificador implementado é **síncrono e puro**, portanto **não há cache** e os casos de
"isolamento de cache entre usuários / invalidação após logout / respostas obsoletas" **não se
aplicam** a ele. A resolução **assíncrona** já existente (`createMediaResolver`) **não** foi alterada
nem estendida a avatar; sua cobertura de isolamento de escopo/in-flight continua em
`tests/media-resolver-g1.test.ts`. Quando a assinatura de avatar for autorizada, recomenda-se
**reutilizar** `createMediaResolver` (escopo por `viewerId`) em vez de criar outro cache.

---

## E. Arquivos alterados e justificativa individual

### E.1 `src/lib/media/avatar-media.ts` (novo)

- **O que é:** classificador/resolvedor **puro e offline** de referência de avatar.
- **Por que:** é a única metade do contrato que pode ser implementada sem inventar regras de
  privacidade; reutiliza `media-path.ts` (sem duplicar parsing); habilita a migração futura.
- **Não faz:** rede, assinatura, cache, autorização, escrita de dados, leitura de credencial.

### E.2 `tests/avatar-media-g4-21.test.ts` (novo)

Testes do contrato (ver §F).

### E.3 Consumidores — **nenhuma alteração** (decisão)

- **Não reconectar consumidores:** fazê-los usar `resolveAvatarDisplayUrl` seria refatoração de
  UI sem mudança de comportamento observável (o valor renderizado é idêntico para os formatos
  atuais) e tocaria ~14 arquivos — contraria “mínimo / não reestruturar”.
- **Não wire no fluxo de remoção** (`bio-avatar.tsx:124-129,150-159`): passaria a **apagar objetos**
  de URLs assinadas/canônicas — **alterar/remover dados**, proibido nesta fase (Etapa 6).
- **Não wire no cadastro/adaptação:** gravar caminho canônico em `photo_url` mudaria a semântica do
  campo sem resolvedor de exibição (quebraria `<img src>`), proibido.

### E.4 Não alterados (reafirmação)

`media-path.ts`, `media-contract.ts`, `media-resolver.ts`, `media-authorization.ts`,
`media-url.functions.ts`, `media-server-authorization.server.ts`, `media-url-flag.ts`,
`bio-avatar.tsx`, `completar-perfil.tsx`, adaptadores, `.env*`, `config.toml`, buckets, policies,
`package.json`/lockfiles: **inalterados** por esta fase.

---

## F. Testes executados, comandos e resultados exatos

| Comando | Resultado |
| --- | --- |
| `bun test tests/avatar-media-g4-21.test.ts` | **18 pass / 0 fail** (44 `expect()`) |
| `bun test` (13 arquivos: media-contract-g1, media-resolver-g1, media-authorization-g1, media-url-flag-g1, media-adapter-dm1-g4, media-post-consumer-g4-5, completar-perfil-avatar-g4-20, profile-update-patch, schema-a-profile-1h-17, schema-a-profile-repository-b1, schema-a-storage-1h-15, schema-a-adapters-1h-12, local-media-opfs) | **191 pass / 0 fail** |
| `eslint src/lib/media/avatar-media.ts tests/avatar-media-g4-21.test.ts` | exit 0 |
| `prettier --check` (mesmos arquivos) | “All matched files use Prettier code style!” |
| `tsc --noEmit` | exit 0 |

Cobertura do novo teste (contratos de segurança e compatibilidade, não reimplementação):

- ausência: `null`/`undefined`/vazio/whitespace ⇒ `missing`; não-string ⇒ `not-string`. **[F]**
- local: `data:` e `blob:` ⇒ `local`. **[F]**
- externa HTTPS válida ⇒ `external`. **[F]**
- URL pública de avatar ⇒ `storage-public` (path sem query). **[F]**
- URL assinada legada (válida e “expirada”) ⇒ `storage-signed`, URL preservada, **nunca** convertida. **[F]**
- bucket não permitido (`bio-media`, `reels-media`) ⇒ `storage-foreign-bucket`. **[F]**
- URL no próprio domínio de Storage sem forma válida (`/rest/...`, `/object/public/avatars/`) ⇒
  `unrecognized` (fail-closed). **[F]**
- caminho canônico válido ⇒ `canonical` com `ownerId`; inválido (`lucas/...`, sem extensão, `..`) ⇒
  `invalid-path`. **[F]**
- protocolo não HTTP(S) (`javascript:`, `ftp:`) ⇒ `non-http-protocol`; HTTP(S) malformada ⇒
  `unrecognized`. **[F]**
- isolamento de dono: `expectedOwnerId` rejeita caminho/URL de outro ⇒ `foreign-owner`; aceita o
  próprio. **[F]**
- `trustedOrigin=null` ⇒ nada é tratado como Storage (vira `external`). **[F]**
- `resolveAvatarDisplayUrl`: preserva públicos/assinados/externos/locais; **`null`** para canônico,
  ausente e rejeitado (fallback local). **[F]**
- fonte do módulo: sem `fetch(`/`console.`/`createSignedUrl`/`service_role`/`supabase`/`await`. **[F]**

**Não executados / não aplicáveis:** testes integrados no projeto remoto (exigem autorização de C2 e
runtime), testes de assinatura de avatar (endpoint inexistente) e testes de cache assíncrono do
avatar (o resolvedor implementado é síncrono puro). **Nada** remoto foi chamado; **nenhuma**
autorização remota é declarada comprovada.

---

## G. Compatibilidade com dados legados e consumidores existentes

- **[F]** O módulo preserva **todos** os formatos hoje persistidos em `photo_url`: URL pública
  (`bio-avatar.tsx`, `completar-perfil.tsx` legado), URL assinada legada de 5 anos (dados antigos) e
  imagens locais/externas (demo). `resolveAvatarDisplayUrl` devolve a mesma string.
- **[F]** Caminho canônico (gravável apenas no ramo Schema A, **flag OFF**) resolve para `null`
  (fallback local). Como o módulo **não está conectado**, **nenhum** consumidor atual muda de
  comportamento; a compatibilidade é garantida por não haver wiring.
- **[F]** Consumidores atuais continuam renderizando `photo_url` diretamente (inalterados).
- **[I]** Migrar os consumidores para o módulo é seguro do ponto de vista de formato, mas só traz
  valor quando existir o caminho de assinatura para `canonical` (hoje bloqueado).

---

## H. Limitações

1. **[F] Privacidade real do Storage:** buckets `avatars`/`bio-media`/`reels-media` seguem
   `public = true` e SELECT bucket-wide; **C2 não foi corrigido**. O incremento não é controle de
   acesso.
2. **[F] URLs públicas:** continuam emitidas e servidas publicamente; qualquer um com a URL lê o
   objeto.
3. **[F] URLs assinadas antigas:** a de 5 anos permanece bearer até expirar e **não** é rotacionada.
4. **[F] Sem validação remota:** nada foi executado contra o Supabase real; classificação é
   estática/offline.
5. **[F] Expiração de token não avaliada:** o módulo não decodifica o `token`; uma URL assinada
   expirada é classificada como `storage-signed` (não é pública, mas pode já não carregar).
6. **[F] Sem assinatura de avatar:** o resolvedor completo (URL curta autorizada) **não** foi
   implementado por falta de regra de privacidade e endpoint — **bloqueado para decisão**.
7. **[H] Privacidade desejada do avatar** (público para autenticados? restrito a conexões? oculto em
   perfis privados?) não é dedutível do código atual.

---

## I. Confirmação de ausência de operações remotas / proibidas

- **Nenhum runtime** iniciado; **nenhuma** requisição HTTP; **nenhum** acesso ao Supabase remoto.
- **Nenhuma** migration/SQL; **nenhuma** alteração de bucket, policy ou flag
  (`VITE_APP_SCHEMA_A_MEDIA_URL` permanece **desligada**).
- **Nenhuma** alteração de `.env`/`.env.local`/`supabase/config.toml`/segredos; **nenhuma**
  alteração de `package.json`/lockfiles/dependências.
- **Nenhum** dado apagado/alterado; **nenhum** `reset`/`clean`/`checkout`/`stash`/commit/push.
- **C2 NÃO foi corrigido.** Este documento descreve apenas análise local e um módulo offline.

---

## J. Próximo passo recomendado

**Local (sem autorização remota):**
1. Agregar o módulo `avatar-media.ts` aos consumidores **quando** o caminho de assinatura existir —
   hoje seria refatoração sem ganho; manter isolado.
2. Definir, em **ADR**, a regra de privacidade do avatar (público p/ autenticados? conexões?
   espelhar `profiles` RLS?) — **decisão de negócio necessária**.
3. Se a decisão for “somente autenticados”, desenhar `getAvatarMediaUrl` reutilizando
   `createMediaUrlService`/`createMediaResolver` com escopo = `viewerId`, **sem** reutilizar a
   autorização de posts.
4. Formalizar o backfill/rotação do `photo_url` (Etapa 3 do G4.19) antes de qualquer corte.

**Exige autorização explícita + planejamento de migração remota:**
5. Privatizar buckets e revisar políticas SELECT (Etapas 4–6 do G4.19) e só então validar os
   cenários integrados (§5.2 do G4.19). Enquanto isso, **não** declarar avatares privados.

---

## Anexo — `git status --short` final vs baseline

- **Baseline desta fase:** 263 entradas.
- **Final:** 266 entradas.
- **Delta desta fase (3):**
  - `?? src/lib/media/avatar-media.ts` (novo — módulo offline);
  - `?? tests/avatar-media-g4-21.test.ts` (novo — testes);
  - `?? docs/audits/connexy-database-g4-21-avatar-resolver.md` (este relatório).
- **Preexistentes preservadas:** as 263 entradas anteriores (incluindo `.env` como `D`, `.env.example`,
  `package.json`, `bun.lock`, `supabase/config.toml` e os relatórios/telas das fases anteriores)
  **não** foram tocadas por esta fase. As alterações de `.env`/config/lock observadas no
  `git status` são **pré-existentes**, não atribuíveis à G4.21.
- HEAD e branch **inalterados**.
