# Connexy — G4.20: Remover URLs assinadas de longa duração do cadastro

Data: 2026-10-15 · Tipo: **CORREÇÃO LOCALIZADA + AUDITORIA (somente local)** · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` inalterado.

> **Escopo:** corrigir de forma mínima e verificável o fluxo de `src/routes/completar-perfil.tsx`
> que persistia uma URL assinada de 5 anos em `profiles.photo_url`. **Não** privatiza buckets, **não**
> altera políticas Supabase, **não** ativa o Schema A e **não** afirma que C2 está corrigido.
>
> **Natureza das conclusões:** análise estática + testes locais (`bun test`, `eslint`, `prettier`,
> `tsc --noEmit`). **Nenhum** runtime iniciado, **nenhuma** requisição HTTP, **nenhum** acesso ao
> Supabase remoto.

Regra de leitura: **[F]** = fato verificado; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## 1. Diagnóstico do fluxo original

O `handleSubmit` de `completar-perfil.tsx` tem três ramos de persistência de foto **[F]**:

| Ramo | Condição | Formato gravado em `photo_url`/`photo` |
| --- | --- | --- |
| Demo | `isDemoMode()` (`:175-187`) | blob local (persistência local; não vai ao Storage) |
| Perfil remoto (Schema A) | `isRemoteProfileEnabled()` (`:189-226`) | **caminho canônico** `photo: path` (`:205,216`) |
| Legado configurado | `configured && user` (`:228-270`) | **URL assinada de 5 anos** (defeito desta fase) |

Detalhamento do defeito (ramo legado, agora corrigido):

1. **Bucket/objeto/função:** bucket `avatars`; objeto `path = ${user.id}/${crypto.randomUUID()}.jpg`
   (`completar-perfil.tsx:193-196`); a URL era gerada por
   `supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5)` (`:247-253`). **[F]**
2. **Duração real:** `60 × 60 × 24 × 365 × 5` = **157.680.000 s ≈ 5 anos**. **[F]**
3. **Campo e uso:** persistida em `profiles.photo_url` via
   `ProfileRepository.updateProfile({ photo_url })` (`:257-263`) → `runProfileUpdate`
   (`src/lib/profile/profile-update.ts`). O campo é usado para **exibição** (`<img src={photo_url}>`)
   e para **extração do path na remoção** (`UploadService.extractStoragePathFromUrl`). **Não** é a
   identidade da mídia: a autorização de mídia existente (`getPostMediaUrl`) é exclusiva de `posts` e
   não consome `photo_url`. **[F]**
4. **Dependentes do formato URL:** `_app.home.tsx:80,98`; `_app.pessoas.tsx`; `_app.connecta.tsx`;
   `_app.solicitacao.$id.tsx:514-545`; `presence/presence-live-feed-real.tsx:114-116`;
   `chat/ConnexyChatScreen.tsx:211`; `bio/bio-avatar.tsx:68,106`; `reels/reel-card.tsx:158,211`;
   `reels/comments-sheet.tsx:137`; `discover.tsx:145`; `_app.perfil.$id.tsx`; `use-connections.ts`;
   `feed/FeedNearbyPeople.tsx:33`. Todos renderizam o valor **diretamente como URL**. **[F]**
5. **Caminho seguro já implementado?** O contrato canônico `(bucket,path)`
   (`src/lib/media/media-path.ts`, `src/lib/storage/schema-a-storage.ts`) e o resolvedor assinado
   (`getPostMediaUrl` + `PostMediaFrame`) existem, mas são **específicos de `posts`**. **Não existe
   resolvedor de avatar**. **[F]**
6. **Tratamento legado:** os leitores exibem qualquer string presente em `photo_url`; URLs assinadas
   antigas continuam válidas até expirarem. O extrator `extractStoragePathFromUrl`
   (`src/services/upload.service.ts:51-64`) reconhece **apenas** o marcador `/storage/v1/object/public/`;
   portanto a URL assinada antiga (`/storage/v1/object/sign/`) **não** era extraível — a remoção de
   avatar a partir de `bio-avatar.tsx` falhava silenciosamente para fotos gravadas por esse ramo. **[F]**

**Decisão de correção:** como não há resolvedor de avatar, gravar o **caminho canônico** em
`photo_url` quebraria a exibição (leitores esperam URL) e violaria o requisito de não quebrar
avatares/perfis. Conforme a regra da fase, **não** se contorna a lacuna inventando um resolver. A
alteração mínima e compatível é **parar de emitir a URL assinada longa** e persistir a **URL pública**
do objeto — exatamente o formato já usado para o mesmo bucket/campo em `bio-avatar.tsx:118` e
`upload.service.ts:77`. **[F]/[I]**

---

## 2. Arquivos alterados e justificativa

### 2.1 `src/routes/completar-perfil.tsx` (modificado — correção)

```diff
           uploadedPath = path;
-          const { data: signed, error: signedError } = await supabase.storage
-            .from("avatars")
-            .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
-          if (signedError || !signed?.signedUrl) {
-            throw new Error("Falha ao processar a foto. Tente novamente.");
-          }
-          photoUrl = signed.signedUrl;
+          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
+          photoUrl = urlData.publicUrl;
```

Justificativa:
- **Remove a credencial portadora de longa duração** (o defeito): não há mais `createSignedUrl` nem
  TTL de 5 anos neste fluxo. **[F]**
- **Mantém a exibição**: `getPublicUrl` devolve uma URL pronta para `<img src>`, igual ao que
  `bio-avatar.tsx:118` já grava em `photo_url`. **[F]**
- **Restaura a compatibilidade de remoção**: a URL resultante contém `/object/public/`, extraível por
  `extractStoragePathFromUrl`. **[F]**
- **Mínimo e sem invenção**: usa o mecanismo existente (`supabase.storage.from(bucket).getPublicUrl`),
  não cria coluna/formato, não introduz dependência, não ativa flag. **[F]**
- Não altera os ramos demo nem Schema A, nem `upload`/remoção de rollback (`:194-196,220,266`). **[F]**

### 2.2 `tests/completar-perfil-avatar-g4-20.test.ts` (novo — teste direcionado)

Varredura estática do arquivo de rota (padrão já usado em `tests/media-post-consumer-g4-5.test.ts`
e `tests/schema-a-profile-1h-17.test.ts` via `tests/helpers/source-scan.ts`) + verificação do
contrato de formato da referência persistida via `UploadService.extractStoragePathFromUrl`. Detalhes
na §4.

---

## 3. Estratégia de compatibilidade com dados legados

- **Nenhum registro existente é alterado** (sem backfill, sem remoção em massa) — conforme a fase. **[F]**
- **URLs assinadas já persistidas** continuam válidas até a expiração de 5 anos e continuam sendo
  renderizadas pelos leitores atuais. A correção **não** as revoga nem rotaciona (isso é a Etapa 3 do
  G4.19, fora do escopo). **[F]**
- **Novos cadastros** passam a gravar a URL pública. O campo `profiles.photo_url` já convivia com
  formatos mistos (URL pública via `bio-avatar.tsx`; caminho via ramo Schema A), então o novo formato
  é consistente com o consumidor existente. **[F]**
- **Remoção de avatar**: passa a funcionar de forma determinística para fotos novas, pois o extrator
  reconhece `/object/public/`. Para fotos antigas gravadas como URL assinada, a remoção continua sem
  efeito (comportamento **preexistente**, não introduzido por esta fase). **[F]**
- **Caminho canônico ideal (bloqueado):** persistir `(bucket,path)` + resolvedor de avatar é a direção
  arquitetural preferida (G4.19), mas depende de um resolvedor **inexistente** para avatar. Registrado
  como decisão pendente (§5) e **não** contornado nesta fase. **[F]/[I]**

---

## 4. Testes executados e resultados

Todos **locais**, sem rede.

| Comando | Resultado |
| --- | --- |
| `bun test tests/completar-perfil-avatar-g4-20.test.ts` | **7 pass / 0 fail** |
| `bun test` (9 arquivos: schema-a-profile-1h-17, profile-update-patch, schema-a-profile-repository-b1, schema-a-adapters-1h-12, media-url-flag-g1, media-contract-g1, media-authorization-g1, media-post-consumer-g4-5, media-adapter-dm1-g4) | **147 pass / 0 fail** |
| `bun test tests/persist-phase-1d-1.test.ts` | **19 pass / 0 fail** |
| `eslint src/routes/completar-perfil.tsx tests/completar-perfil-avatar-g4-20.test.ts` | exit 0 |
| `prettier --check` (mesmos arquivos) | “All matched files use Prettier code style!” |
| `tsc --noEmit` | exit 0 |

O novo teste verifica:
- o cadastro **não** chama `createSignedUrl`; **[F]**
- o cadastro **não** contém TTL de 5 anos (`365`) nem TTL longo (`60 * 60 * 24`); **[F]**
- o cadastro persiste `getPublicUrl`/`urlData.publicUrl` no bucket `avatars`; **[F]**
- o rollback de upload em falha (`uploadedPath` + `remove`) permanece; **[F]**
- uma URL pública de avatar é extraível para o path canônico (remoção), enquanto a URL assinada
  antiga **não** é — documentando o ganho de compatibilidade. **[F]**

**Advertência de cobertura (importante):** o teste é uma **guarda estática + contrato de formato**.
Ele **não** executa o `handleSubmit` real contra o Storage (isso exigiria runtime/remoto, fora do
escopo). Portanto o comportamento fim-a-fim de um cadastro real **não** está coberto; a correção é
verificada no código e no contrato do formato persistido, não por execução integrada.

---

## 5. Limitações restantes

- **C2 permanece ABERTO e NÃO corrigido.** Os buckets `avatars`/`bio-media`/`reels-media` continuam
  públicos; a mídia de avatar continua publicamente alcançável via `/object/public/`. Esta fase não
  privatiza buckets, não altera políticas e não adiciona autorização por objeto. **[F]**
- **Resolvedor de avatar inexistente.** O caminho canônico `(bucket,path)` + assinatura para avatar é
  a direção desejada, mas está **bloqueado** por falta de resolvedor e de fluxo de exibição que aceite
  path. Decisão explícita necessária antes de migrar avatares para o modelo seguro. **[F]/[I]**
- **URLs assinadas antigas não rotacionadas.** Permanecem válidas até expirar (Etapa 3 do G4.19). **[F]**
- **Ramo Schema A grava caminho em `photo_url`** (`completar-perfil.tsx:205,216`; também
  `adapters/schema-a/profile.ts:106,124`), o que quebraria a exibição se esse ramo estivesse ativo.
  Lacuna **preexistente**, gated por `isRemoteProfileEnabled()`, **não** tocada nesta fase (fora de
  escopo). **[F]**
- **Sem teste integrado** de cadastro real (runtime/remoto fora de escopo). **[F]**
- **Sem rate limiting/rotação** — dependências futuras já registradas no G4.18/G4.19. **[F]**

---

## 6. Estado do Git (antes/depois)

| Momento | HEAD | Branch | `git status --short` |
| --- | --- | --- | --- |
| Antes desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 260 entradas |
| Depois desta fase | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | `backup/connexy-snapshot-2026-10-02` | 263 entradas |

- **Delta desta fase (3 entradas):**
  - `M src/routes/completar-perfil.tsx` (modificado — correção);
  - `?? tests/completar-perfil-avatar-g4-20.test.ts` (novo);
  - `?? docs/audits/connexy-database-g4-20-long-lived-media-url.md` (este relatório).
- **Mudanças preexistentes preservadas:** as 260 entradas anteriores (incluindo o relatório G4.19 e o
  amplo conjunto de arquivos já modificados no snapshot) foram **mantidas intactas**. Nenhum
  `reset`/`clean`/`checkout`/`rebase`/`stash`/commit/push.
- Nenhuma alteração de dependências (`package.json`/lockfiles), `.env`/`.env.local`, `config.toml`,
  migrations, buckets, políticas ou flags.

---

## 7. Confirmação de ausência de operações remotas

- **Nenhum runtime iniciado** (Wrangler/workerd não executados).
- **Nenhuma requisição HTTP** e **nenhum** acesso ao Supabase remoto.
- **Nenhum** login, token ou credencial produzido/coletado; nenhum segredo impresso.
- **Nenhuma** migração/SQL executados; nenhum bucket/política/flag alterado;
  `VITE_APP_SCHEMA_A_MEDIA_URL` permanece **desligada**.
- Verificações executadas: `bun test`, `eslint`, `prettier`, `tsc --noEmit` — todas locais.
- **C2 NÃO foi corrigido nesta fase.**
