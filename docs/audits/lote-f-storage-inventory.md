# Lote F — Inventário de Storage, matriz de autorização e plano de migração

- **Data:** 2026-10-12
- **Ferramenta:** OpenCode + Big Pickle (auditoria, rastreamento de referências, documentação).
- **Tipo:** auditoria local somente-leitura + plano. **Sem** alteração de código de produção, buckets,
  objetos, policies, migrations, flags ou recursos remotos. **Sem** commits.
- **Base de decisão:** ADR `docs/audits/adr-bio-posts-to-posts.md` (D1/D2 aprovados) e evidências
  das Fases 9 e 10 (PoC de RLS real e URL assinada), `docs/audits/storage-foundation-1h-15.md`.
- **Convenção:** **Fato** = lido no código/migrations/DB local. **Hipótese** = inferência não
  comprovada no ambiente deste repositório. **Pendente** = exige decisão/autorização.

> Nenhuma URL assinada real, chave ou token é reproduzido aqui. Formatos são descritos de forma
> genérica.

---

## Parte 1 — Inventário de mídia

### 1.1 Buckets (fato — `supabase/config.toml` e migrations `20260816120000`, `20261009120000`; DB local)

| Bucket | `public` | Limite | MIME | Materializado por |
| --- | --- | --- | --- | --- |
| `avatars` | **true** | 5 MiB | jpeg, png, webp | `20260816120000_create_avatars_bucket.sql` |
| `bio-media` | **true** | 10 MiB | jpeg, png, webp, gif | `20261009120000_ensure_bio_reels_storage_buckets.sql` |
| `reels-media` | **true** | 50 MiB | mp4, quicktime, webm, jpeg | `20261009120000_ensure_bio_reels_storage_buckets.sql` |

Não existem `post-media`, `reel-media`, `catalog-covers` nem `chat-attachments` (`SCHEMA_A_DEFERRED_BUCKETS`).

### 1.2 Policies de `storage.objects` (fato — DB local, por bucket)

| Bucket | SELECT | INSERT (WITH CHECK) | UPDATE / DELETE (USING) |
| --- | --- | --- | --- |
| `avatars` | `Avatars public read` (roles=public) **e** `Avatars authenticated read` (roles=authenticated) | `Avatars authenticated insert` + `Avatars owner upload` (roles=authenticated, `foldername[1]=auth.uid()`) | `Avatars owner update` / `Avatars owner delete` (`foldername[1]=auth.uid()`) |
| `bio-media` | `Bio media authenticated read` (roles=authenticated) | `Bio media auth upload` (roles=public, `auth.uid() IS NOT NULL AND foldername[1]=auth.uid()`) | `Bio media owner update` / `Bio media owner delete` (roles=public, `foldername[1]=auth.uid()`) |
| `reels-media` | `Reels media authenticated read` (roles=authenticated) | `Reels media auth upload` (roles=authenticated, `foldername[1]=auth.uid()`) | `Reels media owner update` / `Reels media owner delete` (`foldername[1]=auth.uid()`) |

**Fato crítico:** os três buckets são `public = true`. Em Supabase Storage, `GET` por
`/storage/v1/object/public/{bucket}/{path}` **não passa por RLS do objeto** — restringir `SELECT`
a `authenticated` **não torna o arquivo privado** enquanto o bucket for público. Policies de
`INSERT/UPDATE/DELETE` já são owner-folder (`foldername[1]=auth.uid()`), o que permite gravação
segura hoje.

### 1.3 Campos de referência de mídia

| Campo | Tabela | Formato armazenado | Observação |
| --- | --- | --- | --- |
| `photo_url` | `profiles` (Schema A) | **path relativo** `{uid}/{uuid}.jpg` (Schema A) **ou** URL pública / URL assinada (~5 anos) (legado) | Formato divergente por fluxo |
| `cover_url` | `profiles` | path/URL (mesmo padrão de `photo_url`; sem uploader de capa ativo) | — |
| `media_url` | `bio_posts` (legado) | **URL pública completa** | Bucket `public=true` |
| `media_kind` | `bio_posts` | `"image" \| "video"` | — |
| `video_url` | `reels` | **path relativo** `{uid}/{reelId}.{ext}` | Não resolvido antes de exibir |
| `poster_url` | `reels` | **path relativo** `{uid}/{reelId}-poster.jpg` | idem |
| `media` | `posts` (Schema A) | jsonb `[{ preview, type, mediaId? }]` | `preview` vazio no fluxo persistido → sem URL remota |

### 1.4 Fluxos (origem → armazenamento → consumidores → autorização → risco)

| # | Fluxo | Bucket | Referência gravada | Escrita | Leitura/entrega | Autorização esperada | Risco de compatibilidade |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Avatar — onboarding Schema A | `avatars` | **path** em `profiles.photo_url` | `src/routes/completar-perfil.tsx:189-226` (upload `${user.id}/${uuid}.jpg`, grava `photo: path`) | `getSchemaAProfile().loadOwn()` → `toDomainProfile` (`src/lib/adapters/schema-a/profile.ts:167-202`) → exibido cru | Autenticado (RLS `profiles`); mídia pública hoje | **Path não é URL exibível**: componentes usam `photo_url` direto em `<img src>` → quebra se privado/relativo |
| F2 | Avatar — onboarding legado | `avatars` | **URL assinada (~5 anos)** em `profiles.photo_url` | `src/routes/completar-perfil.tsx:228-270` (`createSignedUrl(path, 60*60*24*365*5)`) | `<img src>` cru | Token portador de longa duração | Link portador quase permanente; sem revogação prática |
| F3 | Avatar — gestão (bio) | `avatars` | **URL pública** em `profiles.photo_url` | `src/components/bio/bio-avatar.tsx:110-143` (`uploadAvatar` + `getPublicUrl`) | `<img src>` cru | Bucket público | URL pública ignora RLS |
| F4 | Bio post — upload/editar/excluir | `bio-media` | **URL pública** em `bio_posts.media_url` | `src/components/bio/bio-posts.tsx:39-54,131-149`; `UploadService.uploadPostMedia` (`src/services/upload.service.ts:97-103`) + `getPublicUrl` | `<img src={media_url}>` (`bio-posts.tsx:296-303`; `_app.perfil.$id.tsx:86-96`) | Bucket público | Exclusão depende de `extractStoragePathFromUrl` (`upload.service.ts:51-64`) que só reconhece o marcador `/public/` |
| F5 | Bio post — MCP | `bio-media` | `bio_posts.media_url` fornecido pelo cliente | `src/lib/mcp/tools/create-moment.ts` (insert `media_url` cru) | `src/lib/mcp/tools/list-my-moments.ts` retorna `media_url` cru | Bucket público | Aceita qualquer URL (não valida bucket/ownership) |
| F6 | Reels — vídeo/pôster | `reels-media` | **path** em `reels.video_url`/`poster_url` | `src/lib/reels/reel-publish.ts:121-153` | `ReelCard` usa `reel.video_url` direto como `<video src>` (`src/components/reels/reel-card.tsx:111`) | Bucket público | Path relativo inválido como `src` remoto; feed remoto não constrói URL |
| F7 | Schema A `posts` | (`bio-media` previsto) | `posts.media` jsonb `{preview,type,mediaId}` | `src/routes/_app/create-post.tsx:72-104` (`saveLocalMedia`, só demo) | `src/lib/adapters/schema-a/content.ts:56-79` | N/A (não sobe ao Storage) | Mídia de `posts` não tem URL remota; `mediaId` aponta para OPFS local |
| F8 | Uploader genérico | `destination.bucket` | `UploadedMedia.url` = URL pública | `src/lib/upload/upload-storage.ts` → `UploadService.uploadMedia` (`upload.service.ts:66-79`) | estado React `remoteUrl`/`remotePath` | Bucket público | `pathPrefix` opcional; sem assinatura |

### 1.5 Builders e helpers

- `src/lib/storage/schema-a-storage.ts` — builder canônico de **path Schema A**:
  `{auth.uid()}/{purpose}/{objectId}.{ext}`; `purpose ∈ {avatar,cover,bio,post,reel,reel-poster}`.
  Mapa: `bio`/`post` → `bio-media`; `reel`/`reel-poster` → `reels-media`; `avatar`/`cover` → `avatars`.
  **Fato:** este módulo é importado **apenas** pelo próprio teste (`tests/schema-a-storage-1h-15.test.ts`);
  **nenhuma UI** o consome ainda.
- `src/lib/supabase/storage.ts` — `StorageHelper` expõe `upload`, `getPublicUrl`, `remove`, `list`.
  **Não** expõe `createSignedUrl` (requisito da D2-B / Alternativa 1).
- `src/services/upload.service.ts` — `BUCKETS = {avatars, bioMedia}`; `buildMediaPath` gera
  `{prefix?}/{uuid}.{ext}`; `extractStoragePathFromUrl` só parseia URLs `/public/`.

### 1.6 Divergências de formato detectadas (fato)

1. **Builder Schema A vs. paths reais.** O builder produz `.../{purpose}/{objectId}.{ext}`
   (segundo segmento = propósito); os uploads reais produzem `{uid}/{uuid}.{ext}`
   (`avatars`, `bio-media`) e `{uid}/{reelId}.{ext}` (`reels-media`) — **sem** segmento de propósito.
   Ambos são compatíveis com as policies (que só checam `foldername[1]`), mas os formatos não são
   idênticos; um migrador/validador precisa normalizar.
2. **Path × URL.** Flows para bucket privado devem gravar **path** (F1, F6, F7-alvo); flows legados
   gravam **URL pública/assinada** (F2, F3, F4, F5, F8). `extractStoragePathFromUrl` não reconhece
   `{uid}/{uuid}.jpg` cru nem URLs assinadas.
3. **Leitura não resolve path.** Não existe função no repositório que converta path armazenado em
   URL exibível (`grep` por `resolveMediaUrl`/`publicUrlFor`/`signedUrlFor`: nenhum resultado; o
   único importador de `schema-a-storage` é o teste). Componentes assumem `photo_url`/`video_url`
   já completos.
4. **`posts.media.preview` vazio** no fluxo persistido (`create-post.tsx` grava `preview: ""`),
   então `posts.media` não carrega URL recuperável — upstream (Lote D) não conecta Storage.

---

## Parte 2 — Matriz de autorização

Legenda: **RLS-linha** = proteção da linha na tabela (`posts`); **Assinatura** = autorização para
emitir URL assinada; **Objeto público** = acesso direto ao arquivo por URL pública; **Resíduo** =
validade residual após mudança.

| Ator | RLS-linha `posts` (fato, Fase 10) | Assinatura esperada (D2) | Objeto por URL pública hoje | Resíduo |
| --- | --- | --- | --- | --- |
| **Anônimo** (sem sessão) | Negado (`42501 permission denied for table posts`, barrado por privilégio antes do RLS) | Negado (sem sessão) | **Permitido** (bucket `public=true` ignora RLS) | URL pública continua válida indefinidamente |
| **Proprietário** | Vê PUBLIC + CONNECTIONS + PRIVATE próprios | Emitir para qualquer post próprio | Permitido | — |
| **Conexão autorizada** (`are_connected`) | Vê PUBLIC + CONNECTIONS (não PRIVATE) | Emitir p/ PUBLIC e CONNECTIONS; negar PRIVATE | Permitido | URL obtida continua válida após remover conexão |
| **Sem conexão** (autenticado) | Vê PUBLIC (não CONNECTIONS/PRIVATE) | Emitir só PUBLIC; negar CONNECTIONS/PRIVATE | Permitido | URL obtida continua válida |

**Distinções obrigatórias (fatos da Fase 9/10):**

1. **RLS-linha protege a linha**, não o arquivo. `posts_select_privacy` filtra linhas por
   `privacy`/`author_id`/`are_connected` (`20260925030806`).
2. **Assinatura é o único ponto de autorização da mídia.** Deve ocorrer **no servidor**, após checar
   autorização da publicação; `StorageHelper` ainda não tem `createSignedUrl` (lacuna).
3. **Acesso direto por URL pública não revalida nada.** Enquanto `public=true`, quem tiver o link
   lê o arquivo, autenticado ou não.
4. **Resíduo de URL assinada** (comprovado na Fase 10): a URL permanece `200` até expirar
   (observado: válida, e após a janela curta de teste → `400`). Expirar **não** revoga cópias,
   downloads ou caches já feitos; a URL é **portadora**.
5. **Cache/CDN** e distribuição de borda **não são comprováveis neste ambiente local** — estão
   listados como limite, não como fato validado.

---

## Parte 3 — Plano de migração (proposta; NÃO implementada)

**Recomendação (alinha com D2-B/Alternativa 1):** buckets **privados** (`public=false`), referências
gravadas como **path**, URL assinada de **vida curta** emitida **apenas após** verificação de
autorização da publicação; `PUBLIC` exige autenticação (nunca anônimo). Alternativa 3 (endpoint
mediador) pode combinar para arquivos grandes (Reels).

**Não assumir** que tornar o bucket privado resolve automaticamente URLs públicas antigas, nem que
expirar uma assinatura revoga cópias/downloads anteriores.

### Sequência reversível

1. **Inventário de objetos e referências.** Mapear cada `bio_posts.media_url`, `reels.video_url`/
   `poster_url`, `profiles.photo_url`/`cover_url` e `posts.media[]` a `(bucket, path, owner)`.
   Classificar: URL pública antiga vs URL assinada vs path vs órfão. (Somente leitura.)
2. **Classificação de mídia e privacidade.** Associar cada objeto à publicação e ao nível
   (`PUBLIC`/`CONNECTIONS`/`PRIVATE`); objetos de `bio_posts` migram com decisão de privacidade
   (D1: intenção explícita, sem alterar silenciosamente). Objetos não vinculados = órfãos (não apagar).
3. **Estratégia de novos uploads.** Gravar **path** (não URL) via builder Schema A; subir para
   bucket privado; normalizar o formato de path (resolver a divergência 1.6.1). `StorageHelper`
   ganha `createSignedUrl` **no servidor**.
4. **Compatibilidade e transição das URLs antigas.** Reescrever referências URL→path por etapas;
   manter leitura tolerante a ambos formatos durante a transição; preservar arquivos até validar.
5. **Verificação de autorização antes da emissão.** Camada server-side que consulta o nível da
   publicação (RLS + `are_connected`) e só então assina; nunca assinar sem checagem.
6. **Testes positivos e negativos.** Reusar a matriz da Fase 10: positivo (owner/connection/PUBLIC),
   negativo (anônimo, sem conexão, PRIVATE, path fora da própria pasta, post sem objeto), ciclo de
   vida da assinatura (200 → 400).
7. **Plano de rollback.** Manter buckets públicos **até** validar; reverter `public=false`→`true` se
   necessário; reverter reescrita de referências a partir do inventário (backup de mapeamento);
   nunca apagar antes de confirmar leitura. Rollback por etapa, com critério de parada.
8. **Critérios objetivos para liberar a interface.**
   - Zero referências de URL pública em novos uploads.
   - Todos os objetos de publicações `CONNECTIONS`/`PRIVATE` em bucket privado e inacessíveis por URL
     pública (teste negativo comprovado).
   - Emissão de assinatura só após autorização (teste por nível).
   - Fluxos F1/F4/F6/F7 com leitura resolvendo path→URL assinada, sem link quebrado.
   - Plano de rollback exercitado em ambiente local.

> Operações que **exigiriam autorização separada** (fora deste lote): alterar `public` de buckets,
> aplicar RLS/policies, mover/copiar/excluir objetos, reescrever referências em produção, criar
> endpoint/função, gerar URLs assinadas reais.

---

## Parte 4 — Relatório consolidado A–L

> O relatório A–L canônico está em `docs/audits/relatorio-consolidado-a-l.md` (evita duplicação).
> Resumo: Lotes A–C e E **[provados]**; Lote D **[foundation local, sem UI]**, flag inativa;
> Lote F **[bloqueado por decisão de arquitetura D2]**. **Nenhum teste remoto** reexecutado.
> UI **não liberada**. Git preservado (HEAD `16f8c6b`, sem commits). Supabase remoto não tocado.

---

## Encerramento
- Status: **Lote F auditado; migração não executada** (bloqueada por D2/autorização).
- Liberação de UI: **NÃO** — ver critérios da Parte 3.8.
- Nenhuma mudança de produção, flag, bucket, RLS, migration ou recurso remoto.
