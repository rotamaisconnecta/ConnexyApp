# Lote G0.1 — Contrato canônico de mídia e plano de transição

- **Data:** 2026-10-12
- **Ferramenta:** OpenCode + Big Pickle (análise local, leitura de código/DB local, documentação).
- **Tipo:** proposta de contrato + plano. **Somente documentação.** Sem código, endpoint, bucket,
  policy, migration, flag ou UI. Direção herdada: **Alternativa 2** aprovada em
  `docs/audits/adr-storage-signing-lote-g0.md`.
- **Restrições respeitadas:** sem Supabase remoto; sem alterar produção/buckets/policies/migrations;
  sem ativar flags; sem conectar UI; arquivos preexistentes preservados; sem commits/push.
- **Convenção:** **Fato** = lido no código/DB local. **Proposta** = precisa de aprovação/autorização.
  **Hipótese** = não comprovado. **Pendente** = exige decisão.

## Estado atual relevante (fatos)

- `posts.media` = `jsonb NOT NULL DEFAULT '[]'`, sem coluna de contrato além do JSON.
- `bio_posts.media_url` (text) = **URL pública completa**; `bio_posts.media_kind` = `image|video`.
- `reels.video_url` (text NOT NULL) = **path** `{uid}/{reelId}.{ext}`; `reels.poster_url` = path.
- `profiles.photo_url` (text) = path (Schema A) **ou** URL pública/assinada (legado).
- Adapter `src/lib/adapters/schema-a/content.ts`: `mediaToJson` grava `{preview, type, mediaId?}`;
  `mediaFromJson` **descarta** itens sem `preview` (`if (typeof record.preview !== "string") continue`).
- `posts.media[].preview` é gravado **vazio** pelo fluxo atual (`_app/create-post.tsx:buildPersistedMedia`),
  e `mediaId` aponta para OPFS/IndexedDB local — **sem identidade remota**.
- Builder `src/lib/storage/schema-a-storage.ts`: path `{ownerId}/{purpose}/{objectId}.{ext}`;
  `isRemoteMediaPath` / `ownerIdFromStoragePath` validam apenas o **1º segmento UUID** (aceita tanto o
  builder quanto os uploads reais `{uid}/{id}.{ext}`). **Sem consumidor de UI** (só teste).
- `StorageHelper` e `UploadService` **não** têm `createSignedUrl`. Único uso: URL assinada de ~5 anos
  em `completar-perfil.tsx:249`. Uploads reais usam `getPublicUrl` (URL pública).
- Buckets `public=true`; SELECT de `storage.objects` é **por bucket** (ver ADR G0 §1.3).

---

## 1. Contrato canônico de mídia (proposto)

### 1.1 Princípios

1. **Identidade primária = `(bucket, path)`**, nunca uma URL pública. URL é forma de entrega, não
   identidade.
2. **Path relativo** ao bucket, com **1º segmento = `auth.uid()` do dono** (compatível com as policies
   de escrita existentes).
3. **Tipo e metadados** preservados (image/video, poster de vídeo, dimensões opcionais).
4. **Autorização nunca confia em bucket/path do cliente** — o servidor deriva a referência a partir
   da **linha autorizada** (RLS), não do request.
5. **Compatibilidade sem reescrita agora** — o contrato distingue referência válida, legado
   reconhecido e inválida; **não modifica** schemas nem reescreve dados neste lote.

### 1.2 Tipos propostos (TypeScript, ilustrativo — não implementado)

```ts
type MediaKind = "image" | "video";

// Identidade canônica de objeto remoto
type MediaObjectRef = {
  bucket: "avatars" | "bio-media" | "reels-media";
  path: string;          // "{ownerId}/{...}.{ext}"  (relativo ao bucket)
  kind: MediaKind;
  posterPath?: string;   // vídeo: path do pôster
};

// Referência classificada (união discriminada)
type MediaRef =
  | { state: "valid";        object: MediaObjectRef }                                   // remoto protegido
  | { state: "legacy-public"; bucket?: string; path?: string; url: string; kind: MediaKind } // URL /public/
  | { state: "legacy-signed";  bucket?: string; path?: string; url: string; kind: MediaKind } // URL /sign/ (token)
  | { state: "local";          mediaId: string; kind: MediaKind }                         // OPFS/IndexedDB (demo)
  | { state: "invalid";        reason: string };                                          // não reconhecida
```

### 1.3 Classificação (fatos + regras propostas)

| Entrada | Detecção | Estado |
| --- | --- | --- |
| Path `{uuid}/{...}` sem esquema de URL | `isRemoteMediaPath(value)` (1º segmento UUID) | `valid` |
| `/storage/v1/object/public/{bucket}/{path}` | `UploadService.extractStoragePathFromUrl` | `legacy-public` |
| `/storage/v1/object/sign/{bucket}/{path}?token=…` | parse do pathname; **descartar o token** | `legacy-signed` |
| `data:` URL ou `blob:` | prefixo | `local` (preview), **nunca** identidade |
| `mediaId` sem path | campo `mediaId` | `local` |
| URL externa arbitrária / path sem UUID no 1º segmento | fallback | `invalid` |

**Regra de ouro:** `bucket`/`path` só são considerados **confiáveis** quando **derivados da linha**
(`posts.media`, `bio_posts.media_url`, `reels.video_url`/`poster_url`, `profiles.photo_url`) lida sob
**RLS do usuário**. Valores vindos do cliente que não correspondam exatamente à linha são `invalid`.

### 1.4 Contrato de `posts.media` (extensão proposta — NÃO aplicada)

Manter compatibilidade com o item atual e adicionar campos canônicos:

```jsonc
// item proposto (todos os campos de identidade opcionais durante a transição)
{
  "type": "image",                        // ou "video"
  "bucket": "bio-media",                  // PROPOSTO (identidade)
  "path": "<ownerUuid>/<objectId>.jpg",   // PROPOSTO (identidade)
  "posterPath": "<ownerUuid>/<id>-poster.jpg", // PROPOSTO (só vídeo)
  "preview": "<data-url>",                // legado/demo — NÃO é identidade
  "mediaId": "<local-opfs-id>"            // legado/demo — NÃO é identidade
}
```

**Impacto do adapter (proposta):** `mediaFromJson` hoje **descarta** itens sem `preview`. Para aceitar
o formato canônico será preciso: (a) aceitar item com `bucket`+`path` válidos; (b) manter `preview`/
`mediaId` como opcionais; (c) nunca derivar identidade de `preview`/`mediaId`. `mediaToJson` passará a
emitir `bucket`/`path` quando o objeto estiver no Storage. **Mudança apenas proposta.**

### 1.5 Exemplos não sensíveis

```jsonc
// válido (novo, bucket privado — assinado sob demanda)
{ "state": "valid", "object": { "bucket": "bio-media", "path": "3f0c.../9a12....jpg", "kind": "image" } }

// legado reconhecido (URL pública antiga — transição)
{ "state": "legacy-public", "bucket": "bio-media", "path": "3f0c.../9a12....jpg",
  "url": "https://<host>/storage/v1/object/public/bio-media/…", "kind": "image" }

// legado assinado (token descartado ao normalizar)
{ "state": "legacy-signed", "bucket": "avatars", "path": "3f0c.../ab.jpg",
  "url": "https://<host>/storage/v1/object/sign/avatars/…?token=[REDACTED]", "kind": "image" }

// inválido (não recebe acesso)
{ "state": "invalid", "reason": "external-url" }
```

---

## 2. Resolvedor cliente (interface futura — NÃO implementado)

### 2.1 Interface proposta

```ts
type MediaResolution =
  | { status: "ready";   url: string; expiresAt: number }  // URL assinada protegida
  | { status: "legacy";  url: string }                     // URL pública/signed legada (transição)
  | { status: "local";   url: string }                     // object URL de mídia local (demo)
  | { status: "forbidden" }                                // sem autorização / referência inválida
  | { status: "missing" }                                  // objeto inexistente
  | { status: "unavailable" };                             // erro/offline (retry possível)

interface MediaResolver {
  resolve(ref: MediaRef, signal?: AbortSignal): Promise<MediaResolution>;
  // lote (otimização): resolveMany(refs) → createSignedUrls no servidor
}
```

### 2.2 Regras de comportamento

- **Quando solicitar:** sob demanda — quando o componente entra em viewport/precisa renderizar
  (`IntersectionObserver`), não no carregamento do bundle. Para listas, resolver em **lote**.
- **Posse da referência:** o cliente envia ao servidor **identificador da publicação + índice** (ou o
  `(bucket,path)` já derivado), **nunca** bucket/path arbitrário como fonte de autorização.
- **Cache/expiração:** cachear por `(bucket,path)` com TTL **menor** que a expiração; ao expirar ou em
  `403/400`, re-resolver; sem loop infinito (limite de tentativas).
- **Falha:** `forbidden`/`missing` → não exibir e **nunca** tentar acesso privilegiado; `unavailable`
  → backoff/placeholder.
- **Logs:** **nunca** logar a URL assinada (contém token). Logar apenas `{ bucket, path, status }`;
  redigir query string; não enviar URLs a analytics/APM/error tracking; limpar em error boundaries.
- **Público legado vs protegido:** `legacy-public`/`legacy-signed` são exibidos **diretamente** durante
  a transição (sem assinatura), marcados como legado; `valid` exige resolução server-side. A distinção
  é feita por **classificação**, não por tentativa-e-erro.
- **Referência não reconhecida:** `invalid`/`forbidden` → **nenhum** acesso; o servidor **recusa
  assinar** quando não consegue mapear a referência a uma linha visível sob RLS.

### 2.3 Fronteira

O resolvedor no cliente é **apenas consumidor**; a decisão de autorização e a assinatura ocorrem no
**servidor** (Alternativa 2). O cliente não conhece credencial privilegiada.

---

## 3. Plano de transição do Storage

### 3.1 Inventário de consumidores por bucket (fatos)

| Bucket | Escritores | Leitores | Formatos |
| --- | --- | --- | --- |
| `avatars` | `completar-perfil.tsx` (Schema A → path; legado → URL assinada 5 anos; demo → data URL); `bio-avatar.tsx` (URL pública); `UploadService.uploadAvatar` | `_app.perfil.$id.tsx` (`photo_url`), `_app.pessoas.tsx`, `FeedNearbyPeople`, `schema-a-profile`/`toDomainProfile` → `<img src>` | path, URL pública, URL assinada, data URL |
| `bio-media` | `bio-posts.tsx` (`uploadPostMedia`+`getPublicUrl` → `bio_posts.media_url`); `UploadMedia` genérico; MCP `create_moment` (`media_url` do cliente) | `bio-posts.tsx` `<img>`; `_app.perfil.$id.tsx` (`bio_posts.media_url`); MCP `list_my_moments` | URL pública (legado); `posts.media` (novo, ainda sem upload real) |
| `reels-media` | `reel-publish.ts` (path); `RemoteContentRepository.createReel` | `reel-card.tsx` `<video src={video_url}>`+poster | path (não resolvido → já quebrado no remoto) |

### 3.2 O que pode ser preparado localmente **sem** autorização

- [P] Módulo puro de contrato/classificação (`MediaRef`), adapters e testes unitários.
- [P] Interface do resolvedor + cache/expiração em memória (mock), com testes.
- [P] Lógica de normalização (`/public/` e `/sign/` → path) reaproveitando os parseadores existentes.
- [P] Inventário de referências em ambiente local (contagens/formatos), sem ler o remoto.
- [P] Documentação (este arquivo) e catálogo de decisões pendentes.

### 3.3 O que **exige autorização explícita** (fora deste lote)

- Alterar `public` dos buckets, policies de `storage.objects`, grants.
- Mover/copiar/excluir objetos; reescrever referências no banco.
- Introduzir endpoint/serverFn com credencial privilegiada (`supabaseAdmin`).
- Ativar flags; conectar UI de criação.

### 3.4 Migração reversível (por etapa)

1. **Inventário e validação dos objetos.** Listar por bucket: paths existentes, formato da referência
   correspondente, dono (1º segmento) e associação a `posts`/`bio_posts`/`reels`/`profiles`. Marcar
   órfãos (não apagar).
2. **Migração e verificação das referências.** Reescrever URL→path por etapas; validar leitura antes de
   remover qualquer arquivo; manter tolerância a ambos os formatos.
3. **Novas regras de acesso (autorização separada).** Buckets `public=false`; **restringir/revogar
   SELECT** de `storage.objects` para `authenticated`; assinatura **server-side** após checagem da
   publicação (Alternativa 2).
4. **Compatibilidade durante a transição.** O resolvedor aceita `legacy-public`/`legacy-signed`
   enquanto a reescrita não termina; novos uploads já gravam **path**.
5. **Tratamento das URLs públicas antigas.** **Não** assumir revogação automática. URLs `/public/` já
   vistas/copiadas e URLs assinadas já emitidas seguem válidas até expirar; tornar o bucket privado
   **não** invalida cópias/downloads/caches. Mitigar rotacionando caminhos e documentando o risco
   residual.
6. **Testes de regressão.** Positivos (dono/conexão/PUBLIC autenticado) e negativos (anônimo, sem
   conexão, PRIVATE, path de terceiro, post sem mídia, assinatura expirada); **tentativa de bypass
   direto à API de Storage deve falhar**; leitura de legado durante a transição.
7. **Rollback e encerramento.** Reativar `public=true`; reverter referências via inventário; desligar
   assinatura por flag. Encerrar a compatibilidade legada quando: zero novas referências públicas,
   todos os objetos de `CONNECTIONS`/`PRIVATE` inacessíveis por URL pública, e nenhuma URL pública nova
   emitida.

### 3.5 Matriz de risco por bucket (impacto do flip para privado)

| Bucket | Se `public=false` | Risco principal | Mitigação |
| --- | --- | --- | --- |
| `avatars` | `/public/` antigas quebram; paths Schema A passam a exigir assinatura | avatares exibidos em muitos pontos | reescrever p/ path + resolver; cache na transição |
| `bio-media` | `bio_posts.media_url` (URL pública) quebra | feed/perfil/MCP | reescrever URL→path + assinar; MCP passa a retornar path/URL assinada |
| `reels-media` | paths já inválidos como `src`; passam a exigir resolução | vídeo grande, custo de assinatura | resolver + considerar Al.3 p/ Reels |

---

## 4. Decisões pendentes

1. **D-M1 — Contrato de `posts.media`:** confirmar campos `bucket`/`path`/`posterPath` e ajuste de
   `mediaFromJson` (hoje descarta item sem `preview`). **(Proposta neste doc.)**
2. **D-M2 — Formato canônico de path:** unificar builder `{uid}/{purpose}/{id}.{ext}` vs. uploads reais
   `{uid}/{id}.{ext}` (ou coexistência aceita por ambos).
3. **D-M3 — Política de autorização de Storage:** restringir/revogar SELECT + assinatura server-only
   (Alternativa 2); o que fazer com owners (permitir SELECT só ao próprio path?).
4. **D-M4 — URL assinada:** TTL, cache, lote (`createSignedUrls`) e comportamento em listas grandes.
5. **D-M5 — Legado:** prazo e critério de corte das URLs públicas; comunicação aos usuários.
6. **D-M6 — Reels grandes:** assinatura vs. entrega mediada (Alternativa 3).
7. **D-M7 — MCP:** `create_moment`/`list_my_moments` (hoje URL crua) → migrar para path/assinatura.

---

## 5. Critérios objetivos para desbloquear o Lote G1

- **C1.** D-M1 e D-M2 **decididos** (contrato de `posts.media` e formato de path).
- **C2.** **Autorização** aprovada para: buckets `public=false`; restrição/revogação do SELECT de
  `storage.objects`; assinatura server-side.
- **C3.** Módulo de contrato + resolvedor com **testes unitários locais** (classificação, cache, erros).
- **C4.** Especificação do serverFn de assinatura (autorização via `posts` RLS + mapeamento linha→path;
  credencial server-only) com casos positivos/negativos definidos.
- **C5.** Plano de rollback e critério de encerramento do legado acordados (D-M5).
- **C6.** Confirmação (execução local) de que a URL `/public/` ignora RLS e de que a assinatura com a
  sessão do usuário é impedida após a restrição — hipóteses do ADR G0 §9.

Com C1–C6 resolvidos, o **Lote G1** pode implementar, **em ambiente local**, contrato + resolvedor +
serverFn, com testes positivos/negativos, sem tocar o remoto. Nenhum código/flag/UI/bucket foi alterado
neste lote.

---

## Referências
- `docs/audits/adr-storage-signing-lote-g0.md` (decisão da Alternativa 2)
- `docs/audits/lote-f-storage-inventory.md` (inventário/plano)
- `docs/audits/adr-bio-posts-to-posts.md` (D1/D2)
- `docs/audits/relatorio-consolidado-a-l.md` (A–L)
