# ADR — Lote G0.2: fechamento das decisões de mídia (D-M1 a D-M7) e critérios C1–C6

- **Data:** 2026-10-12
- **Ferramenta:** OpenCode + Big Pickle (análise local, documentação).
- **Tipo:** nota de decisão. **Somente documentação.** Sem código, endpoint, credencial privilegiada,
  bucket, policy, migration, flag ou UI.
- **Base:** `adr-storage-signing-lote-g0.md`, `media-contract-and-transition-lote-g0-1.md`,
  `lote-f-storage-inventory.md`, `adr-bio-posts-to-posts.md` (D1/D2).
- **Restrições respeitadas:** sem Supabase remoto; sem alterar produção/buckets/policies/migrations/
  flags/UI; arquivos preexistentes preservados; sem commits/push.
- **Convenção:** **Fato** = lido no código/SDK/DB local. **Decisão** = definida neste ADR.
  **Hipótese** = não executada. **BLOQUEADO** = exige autorização do usuário.

---

## 1. Decisões

### D-M1 — Contrato canônico de `posts.media` — **DECIDIDO**

**Item canônico (jsonb, sem DDL nova — a coluna já existe `jsonb NOT NULL DEFAULT '[]'`):**

```jsonc
{
  "type": "image" | "video",                 // obrigatório
  "bucket": "bio-media",                     // identidade (quando remoto)
  "path": "<ownerUuid>/<objectId>.jpg",      // identidade (quando remoto)
  "posterPath": "<ownerUuid>/<id>-poster.jpg", // vídeo (opcional)
  "preview": "<data-url>",                   // legado/demo — NUNCA identidade
  "mediaId": "<local-opfs-id>"               // legado/demo — NUNCA identidade
}
```

**Regras:**
- **Identidade** só existe com `bucket` **e** `path` válidos. `preview`/`mediaId` nunca identificam.
- **Preservar item sem `preview`** — ajuste proposto em `mediaFromJson`
  (`src/lib/adapters/schema-a/content.ts`): aceitar item se `type` válido **e**
  (`preview` é string **ou** `bucket`+`path` válidos **ou** `mediaId` string). Hoje o código faz
  `if (typeof record.preview !== "string") continue`, **descartando** o item canônico sem `preview`.
- **Compatibilidade de dados atuais:** linhas `{preview:"", type, mediaId}` seguem legíveis (o
  `preview` vazio é string). Nenhuma reescrita/DDL neste lote.
- **`DemoPostMedia`** (`src/lib/demo/demo-posts.ts`) ganha `bucket?`, `path?`, `posterPath?`
  (proposta; mantém `preview`/`mediaId`).
- **Fronteira:** `mediaToJson` só emite `bucket`/`path` quando o objeto estiver no Storage; nunca
  converte URL/path do cliente em identidade.

**Critérios de aceitação (G1, testes locais):** round-trip `toRemotePostInsert`→`toDomainPost`
preserva `type` e `(bucket,path)`; item sem `preview` mas com `path` **não** é descartado; item só com
`mediaId` continua local; item malformado vira `invalid` (não privilegiado).

---

### D-M2 — Formato, validação e posse de path — **DECIDIDO**

**Formato canônico:** `{ownerId}/{objectId}.{ext}`
- `ownerId` = `auth.uid()` do autor (1º segmento **obrigatório** = UUID).
- `ext` ∈ `[a-z0-9]{1,8}` compatível com a classe MIME (imagem/vídeo do bucket).
- Arquivos de reel usam o mesmo esquema no `reels-media`: `{ownerId}/{reelId}.{ext}` e
  `{ownerId}/{reelId}-poster.jpg`.
- **Deprecar** o segmento `{purpose}` do builder (`src/lib/storage/schema-a-storage.ts`) como formato
  de escrita; **aceitar ambos na leitura** (validação só checa 1º segmento UUID).

**Validação (rejeitar arbitrário):** rejeitar path absoluto, com `..`, com `/` inicial, sem UUID no 1º
segmento, ou com extensão inválida. Reaproveitar `ownerIdFromStoragePath` / `isRemoteMediaPath`.

**Propriedade:** o 1º segmento **deve** ser o autor da linha. O servidor **re-deriva** ou compara o
path com o valor **armazenado na linha** (RLS-visível); **nunca** aceita `(bucket,path)` do request como
fonte de autorização. O client envia **id da publicação + índice** (ou nada), não o path.

**Critérios de aceitação:** paths `{uid}/x.jpg` e `{uid}/post/x.jpg` aceitos; `../`, `/abs`, `x/y`
(1º não-UUID), extensão inválida → rejeitados; path pertencente a outro autor → rejeitado.

---

### D-M3 — Storage: buckets privados + policies — **DECIDIDO (implementação exige autorização — ver C2)**

**Estratégia (Alternativa 2):**
1. `avatars`, `bio-media`, `reels-media` → **`public = false`**.
2. **Revogar/remover** as policies de **SELECT** de `storage.objects` para `authenticated` nesses
   buckets (hoje são por bucket), para impedir **auto-assinatura** direta pela API de Storage.
3. **Manter** as policies de **INSERT/UPDATE/DELETE** owner-folder (`foldername[1]=auth.uid()`) —
   uploads continuam pelo client do usuário.
4. **Assinatura** passa a ser **exclusivamente server-side** (serverFn com credencial privilegiada
   server-only), após verificação de autorização da publicação.

**Limites de alteração (a autorizar):** apenas `storage.buckets.public` e as policies SELECT desses 3
buckets; **nenhum** objeto movido/excluído; **nenhuma** reescrita de referência nesta decisão.

**Não afirmar:** que virar privado invalida URLs `/public/` antigas, caches ou cópias já baixadas.

**Critérios de aceitação:** anônimo e autenticado **não** obtêm o objeto por URL direta; usuário
autenticado **não** consegue `createSignedUrl` direto (SELECT revogado); URL assinada server-side
funciona.

---

### D-M4 — Assinatura: TTL, lote, expiração e erros — **DECIDIDO**

- **TTL curto:** padrão **300s** (5 min), configurável em faixa **60–300s**.
- **Lote:** `createSignedUrls` com **máximo 100** paths por chamada.
- **Cache no cliente:** TTL = `expiresAt − skew(30s)`; re-resolver ao expirar/invalidar.
- **Expiração/respostas:** expirado ou `400` → re-resolver (limite de tentativas); `401/403` →
  `forbidden` (sem retry); `404` → `missing`; falha de rede → `unavailable` com backoff.
- **Erro do servidor de assinatura:** retornar status tipado (`forbidden|missing|invalid|unavailable`),
  **sem** vazar detalhes internos.
- **Logs:** **nunca** registrar a URL assinada/token; logar só `{bucket, path, status, ttl}`.

**Critérios de aceitação:** URL expira e é re-resolvida; `createSignedUrls` respeita o teto;
`forbidden`/`missing` não geram loop; nenhum token em log.

---

### D-M5 — Legado: migração e corte de URLs públicas — **DECIDIDO**

**Critérios mensuráveis de migração:**
- 100% dos **novos** itens de `posts.media` com referência canônica `(bucket,path)`.
- Referências legadas (`bio_posts.media_url`, `profiles.photo_url`, `reels.video_url`/`poster_url`)
  reapontadas para **path** por bucket, validadas por leitura antes de qualquer remoção.

**Critérios de corte (encerrar compatibilidade legada):**
- **0** referências de URL `/public/` no banco para os buckets protegidos.
- Teste negativo comprovado: nenhum objeto de publicação `CONNECTIONS`/`PRIVATE` acessível por URL
  pública.
- Nenhuma **nova** URL pública emitida.

**Rollback:** reativar `public=true`; reverter referências a partir do inventário; desligar a
assinatura por flag; **nenhum** objeto/dado removido durante a migração.

**Reafirmação:** URLs antigas, caches e cópias **não** são revogados automaticamente; o corte lógico
(zero referências) é distinto da revogação física (impossível garantir).

---

### D-M6 — Reels: requisitos e entrega — **DECIDIDO (fora do G1)**

- Tamanho: limite do bucket `reels-media` = **50 MiB** (já vigente).
- **Poster obrigatório** (path `{ownerId}/{reelId}-poster.jpg`); se ausente, gerar/negar conforme produto.
- Vídeo: entrega sensível a **range/cache**; candidato a **Alternativa 3** (entrega mediada) ou URL
  assinada com `cacheNonce`.
- **`ReelCard`** hoje usa `video_url` cru como `<video src>` → precisa do **resolver** (path→URL) —
  hoje **quebrado** no remoto.
- **Não implementar streaming neste lote.**

---

### D-M7 — MCP — **DECIDIDO (fora do G1, deve sujeitar-se à mesma autorização)**

- MCP usa `supabaseForUser(ctx)` (bearer, RLS-as-user) — **Fato**.
- **Não** recebe credencial privilegiada; **não** assina nesta fase.
- `create_moment` hoje grava `media_url` **cru** (URL fornecida pelo cliente) — deve passar a gravar
  **path** validado; `list_my_moments` deve retornar **path** (resolução fica no cliente/servidor).
- Sujeito à **mesma autorização** de D-M3: sem SELECT, MCP não auto-assina; nunca retorna URL pública
  de bucket protegido.
- Resolução de mídia no MCP: **fora** do G1.

---

## 2. Critérios C1–C6

| Critério | Status | Evidência |
| --- | --- | --- |
| **C1** — contrato e formato de path definidos | **APROVADO** | D-M1 e D-M2 neste ADR (item canônico + `{ownerId}/{objectId}.{ext}` + validação/posse) |
| **C2** — autorização de implementação e limites de alteração do Storage | **BLOQUEADO** | Requer **autorização explícita** para alterar `storage.buckets.public` e policies SELECT (D-M3). Nada foi alterado. |
| **C3** — módulo e testes locais especificados | **APROVADO** | Módulo de contrato/classificação + resolvedor + testes unitários (G0.1 §1–2); critérios de aceitação em D-M1/D-M2/D-M4 |
| **C4** — contrato do server function conforme runtime TanStack Start | **APROVADO** | Padrão existente: `createServerFn({method:"POST"}).validator(zod).handler(async ({data})=>…)` (ex. `src/lib/gemini/generate.ts`); client SSR por requisição `createServerSupabaseClient()` (RLS-as-user) já usado em `profile-status.ts`/`admin-access.ts`; `supabaseAdmin` server-only (`client.server.ts`) |
| **C5** — estratégia de rollback e corte do legado | **APROVADO** | D-M5 (critérios de migração/corte mensuráveis + rollback) |
| **C6** — hipóteses do ADR G0 confirmadas por evidência **disponível** | **PENDENTE** | Fatos confirmados (policies SELECT por bucket; buckets `public=true`; `createSignedUrl` exige `objects: SELECT`). **Não executado:** comportamento real da URL `/public/` ignorando RLS e bloqueio de auto-assinatura após revogar SELECT — exigem execução local (G1). |

> Não marcar como comprovado o que exige teste ainda não executado (C6 permanece **PENDENTE**).

---

## 3. Escopo da primeira entrega (G1)

**Incluído:**
- Módulo puro de contrato (`MediaRef`/classificação) + ajuste de adapter (D-M1) + testes.
- Resolvedor cliente (interface + cache/expiração em memória) + testes.
- ServerFn de assinatura (autorização via `posts` RLS + mapeamento linha→path) — contrato definido (C4).
- **Somente publicações comuns** (`posts`), bucket `bio-media`.

**Fora do G1 (salvo dependência comprovada):**
- **Reels grandes** (D-M6) — streaming/Alternativa 3.
- **MCP** (D-M7).
- **Migração efetiva dos buckets** (flip `public=false`, revogação de SELECT, reescrita de referências)
  — depende de **C2**.

---

## 4. Pré-requisitos e autorização

- **[P1]** Aprovar D-M1 e D-M2 (contrato/path) — propostos neste ADR.
- **[P2] (BLOQUEIO)** **Autorização explícita** para a alteração de Storage de D-M3:
  `public=false` em `avatars`/`bio-media`/`reels-media` e revogação das policies SELECT de
  `storage.objects` para `authenticated`, com assinatura server-side. **Sem essa autorização, o G1
  pode implementar apenas o módulo/resolvedor/serverFn locais, mas não verificar end-to-end nem migrar
  os buckets.**
- **[P3]** Definir a flag de habilitação da assinatura (nome/propósito) para rollback — sem ativá-la.
- **[P4]** Dados de teste locais e casos positivos/negativos (D-M4/D-M5).

---

## 5. Conclusão sobre o desbloqueio do G1

- **G1 parcialmente desbloqueado:** as partes **100% locais e sem Storage** (contrato D-M1, path D-M2,
  resolvedor, serverFn + testes unitários) **podem** começar.
- **G1 end-to-end bloqueado por C2 [P2]:** qualquer verificação real de assinatura, `public=false` ou
  revogação de SELECT **exige autorização explícita** do usuário e **não** deve ser executada agora.
- **C6** só será comprovado durante o G1, por execução local.

**Ação necessária:** obter autorização para **[P2]** antes de qualquer alteração de Storage.

---

## Referências
- `docs/audits/adr-storage-signing-lote-g0.md`
- `docs/audits/media-contract-and-transition-lote-g0-1.md`
- `docs/audits/lote-f-storage-inventory.md`
- `docs/audits/adr-bio-posts-to-posts.md`

---

## 6. Atualização — decisão do usuário (2026-10-12)

- **Escolha:** prosseguir **apenas com as partes locais** do G1.
- **Efeito:** C2 permanece **BLOQUEADO**; **nenhuma** alteração de Storage (flip `public=false`,
  revogação de SELECT) autorizada. A migração de buckets e a verificação end-to-end seguem pendentes de
  nova autorização.
- **G1 (próximo lote) — escopo habilitado:** contrato D-M1, path D-M2, resolvedor cliente, serverFn de
  assinatura + **testes unitários locais**, sem tocar buckets/policies/remoto.
- **G0.2 encerra como documentação:** o G1 **não** é implementado neste lote.
