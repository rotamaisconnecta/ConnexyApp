# Lote G1 — Camada de mídia local (implementação)

Data: 2026-10-12 · Estado: **concluído (somente local)** · HEAD `16f8c6b` inalterado.

> Atualizado em G1.2 (correções pós-auditoria independente G1.1) e em G1.4 (isolamento e
> invalidação do cache, achados R1/R3/R4/R5 da auditoria G1.3). Ver seções "G1.2" e "G1.4".

## Escopo autorizado
Decisão do usuário (ver `adr-media-decisions-lote-g0-2.md` §6): **implementar apenas as partes
locais** dos itens 1–3 do ADR G0.2. C2 (alteração de Storage) permanece **bloqueado**; C6 permanece
**pendente**.

## Entregue
| Arquivo | Papel |
| --- | --- |
| `src/lib/media/media-contract.ts` | D-M1: `classifyMediaValue`, `classifyPostMedia`, `normalizePostMedia`, `serializePostMediaItem`, `findMediaItem` + tipos canônicos. Preserva itens sem `preview` com `(bucket,path)` válido. |
| `src/lib/media/media-path.ts` | D-M2: `validateMediaPath`, `isOwnedMediaPath`, `parseStorageUrl` (origem confiável, decodificação única, valida o path decodificado), `getTrustedStorageOrigin`, `MEDIA_KINDS_BY_BUCKET`. |
| `src/lib/media/media-resolver.ts` | D-M4/L2/R1/R3/R4/R5: `createMediaResolver` (estados `ready/legacy/local/forbidden/missing/unavailable`), cache com skew, dedup em voo, cache negativo de TTL curto, evicção FIFO, **escopo de autorização obrigatório e validado**, invalidação explícita por mídia/escopo/tudo com **geração** anti-repopulação, `sign` injetado, `redactMediaUrlForLog`. |
| `src/lib/media/media-authorization.ts` | D-M3/D-M4/M1/M3/L4: `canViewPost`, `authorizeMediaAccess` (localizador por identidade estável ou índice normalizado; dono + bucket×tipo revalidados), `createMediaUrlService` (aplica `clampMediaUrlTtl` e o repassa a `sign`; credenciais injetadas). |
| `src/lib/media/media-url-flag.ts` | `VITE_APP_SCHEMA_A_MEDIA_URL` (default OFF), gate Auth-gated, setter de teste. |

Testes: `tests/media-contract-g1.test.ts`, `tests/media-resolver-g1.test.ts`,
`tests/media-authorization-g1.test.ts`, `tests/media-url-flag-g1.test.ts`.

## Bloqueio declarado (item 4 do escopo G1)
**Não** foi implementado serverFn credenciado de assinatura. Motivo: `storage.objects` SELECT é
**bucket-wide**; assinar com o client do usuário depende dessa policy insegura, e revogá-la (D-M3)
está **bloqueado por C2**. Conforme a regra de interrupção, optou-se por **não improvisar solução
privilegiada** e manter o núcleo server-side com `sign`/credencial **injetados** (nenhuma credencial
no bundle). Sem C2 não há verificação end-to-end nem migração de buckets.

## G1.2 — Correções após auditoria independente
Achados tratados (M1, M2, M3, L1, L2, L3, L4, L5, D1):

- **M1 (identidade estável):** novo `MediaLocator` (`{kind:"identity",bucket,path}` preferido;
  `{kind:"index"}` aceito apenas sobre `normalizePostMedia`). `classifyPostMedia` garante a mesma
  normalização no cliente. Identidade não registrada na publicação ⇒ `missing-media`; caminho
  arbitrário do cliente nunca é prova.
- **M2/L1 (URL/caminho):** `parseStorageUrl` restringe à origem confiável
  (`VITE_APP_SUPABASE_URL` ou `trustedOrigin` explícito), decodifica **uma única vez**, trata falha
  de decode como inválido e valida o path decodificado. `validateMediaPath` também rejeita segmento
  vazio, octeto codificado (`%2e`) e caracteres de controle.
- **M3 (TTL):** `createMediaUrlService` calcula `clampMediaUrlTtl(deps.ttlSeconds)` e o passa
  efetivamente a `sign(object, ttlSeconds)`; `expiresAt` é capeado pelo TTL do serviço.
- **L2 (cache/concorrência):** dedup de chamadas em voo por identidade; cache positivo com skew;
  cache **negativo** de TTL curto (erros transitórios não persistem); limite de entradas com
  evicção FIFO determinística; `authorizationScope` no cache key (resultado não é reutilizado entre
  contextos de autorização diferentes).
- **L3 (flag):** testes dedicados para `isMediaUrlFlagEnabled`, `isMediaUrlSigningEnabled` e
  `setMediaUrlGateForTests` (default OFF; só `"true"` habilita; subordinada ao Auth remoto; demo não
  habilita; sem vazamento de estado).
- **L4 (bucket×tipo):** `bucketSupportsKind` aplicado em `authorizeMediaAccess`.
- **L5 (URL em `path`):** `classifyMediaValue` rejeita HTTP(S) em `path` (`url-in-path`); só
  `preview` pode ser URL legada, e apenas de origem confiável.

## G1.4 — Isolamento e invalidação do cache
Achados tratados (R1, R3, R4, R5 da auditoria G1.3). Somente `media-resolver.ts` e seus testes.

- **R1 (escopo explícito):** `authorizationScope` passa de opcional para **obrigatório**. Escopo
  ausente, vazio, só espaços, com caractere de controle ou não-string lança
  `MediaResolverScopeError` (`requireAuthorizationScope`). Não existe cache sem escopo. A
  identidade de mídia `(bucket,path)`, a identidade de cache (`scope + (bucket,path)`) e a
  autorização (decidida no servidor) permanecem **separadas**. O futuro chamador deve derivar o
  escopo da sessão autenticada/validada no servidor; um valor vindo do usuário final **nunca** é
  prova de identidade.
- **R3/R4 (invalidação explícita):** nova API `invalidateMedia(bucket, path)` (uma mídia no escopo),
  `invalidateScope(scope?)` (um viewer/escopo) e `invalidateAll()`/`clearCache()` (tudo). Todas
  removem **positivos e negativos**. Resultados `forbidden`/`missing`/`unavailable` seguem com TTL
  **curto** (default 5s) e **não** são decisões permanentes.
  Eventos que a integração futura deve usar para invalidar: **logout, troca de conta, mudança de
  privacidade, alteração de conexões e revogação de acesso**. Invalidação local **não** revoga URLs
  assinadas já emitidas: uma URL obtida continua válida até expirar ou ser invalidada pelo próprio
  Storage.
- **R5 (clearCache × in-flight):** o cache usa **geração** por instância de `Map` (via `WeakMap`).
  Cada assinatura captura a geração no início; se houve invalidação durante o `await`, o resultado
  **não** é gravado no cache. `clearCache()` limpa entradas, incrementa a geração e zera o mapa de
  operações em andamento; o `finally` só remove a entrada se ainda for a mesma promise (não apaga
  uma operação nova). Operações em voo **não** são compartilhadas entre escopos (mapa por resolver,
  chave com escopo). Não há cancelamento fictício: a promise original ainda resolve para seu
  chamador, apenas deixa de popular o cache.
- Cache key continua embutindo o escopo; o cache armazena a autorização capturada e **não** a
  revalida — por isso a invalidação explícita acima é obrigatória (stale ≤ TTL+skew).

## Verificação real
### Testes unitários (locais, `bun test`)
- Específicos de mídia: 60 pass / 0 fail (G1.4 adicionou 6 casos: escopo inválido/isolamento,
  invalidação de positivo e negativo, clear em voo, troca de escopo, escopos simultâneos).
- Suíte completa (G1.4): 1061 pass / 20 skip / 0 fail.

### Validações estáticas
- `bunx tsc --noEmit`: exit 0.
- `bunx eslint` (módulos + testes de mídia, sem `--fix` global): 0 erros.

### Testes integrados reais
- **Nenhum.** Não há teste end-to-end de RLS, bucket, `are_connected` ou assinatura real. Testes
  unitários **não** comprovam comportamento integrado.

### Segurança de buckets e políticas — PENDENTE
- Os buckets `avatars`/`bio-media`/`reels-media` continuam **públicos** e acessíveis por URL pública
  independentemente da RLS. **Não** se deve tratar a segurança do Storage como resolvida.

### Git
- HEAD `16f8c6b`; delta vs baseline conforme o relatório G1.2. Zero operações remotas; flags, UI,
  demo e buckets intactos.

## Pendências herdadas
- **C2/D-M3**: requer autorização explícita para `public=false` nos buckets e revogação de SELECT.
- **C6**: hipóteses do ADR G0 não comprovadas localmente.
- **R2 (G1.3)**: assinatura segura depende de C2; bloqueado.
- **R6 (G1.3)**: URLs legadas fora da origem confiável são rejeitadas (fail-closed); exige
  inventário/backfill antes de integrar (`profiles.photo_url`, `bio_posts.media_url`, MCP).
- **R7 (G1.3)**: nenhum ponto de integração existe ainda (nenhum chamador de `createMediaResolver`).
- Integração de `normalizePostMedia`/`DemoPostMedia` no adapter/demo **adiada**.
- Reels (D-M6) e MCP (D-M7) seguem fora do G1.
