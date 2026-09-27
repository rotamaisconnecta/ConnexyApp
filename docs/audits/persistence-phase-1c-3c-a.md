# Fase 1C-3C-A — Migração controlada de Reels publicados para ReelRepository

- **Data:** 2026-09-12
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Fases anteriores:** `docs/audits/persistence-phase-1c-3c-0.md` (plano) · `persistence-phase-1c-3b.md` (fundação) · `persistence-phase-1c-3a.md` (auditoria).
- **Natureza:** implementação **incremental** — migra somente os Reels publicados (`published:v1` → `ReelRepository`). Feed, likes, comentários, mídia, Supabase e publicarReel permanecem intactos.

---

## 1. Objetivo

Garantir que o conteúdo de `connexy:reels:published:v1` possa ser carregado com segurança no novo `ReelRepository` (store `reels`, banco `connexy-reels-data-local-db`):

- local, one-time, idempotente, retomável;
- seguro contra interrupções;
- sem apagar/sobrescrever a fonte antiga (rollback);
- sem duplicar registros; IDs originais preservados;
- compatível com reload; independente do Supabase.

## 2. Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `src/lib/reels/local-reel-persistence.ts` | **criado** — módulo de migração (`ensureLocalReelsLoaded`, `migrateLegacyPublishedReels`, `toStoredReel`, marcador) |
| `src/lib/reels/reel-local-storage.ts` | **1 linha** — `PUBLISHED_KEY` exportado (fonte literal única da chave antiga) |
| `tests/persist-phase-1c-3c-a.test.ts` | **criado** — testes focados (18) |

Mudança mínima no módulo legado: apenas export da constante de chave; nenhuma alteração de comportamento de `reel-local-storage.ts`.

## 3. Formato antigo

`connexy:reels:published:v1` (localStorage), gravado por `saveStoredPublishedReel`:

```json
{ "version": 1, "items": [ { "id": "reel-<ts>-<rand>", "caption": "...",
  "category": "MOMENT", "author": { id, name, handle, photoUrl, verified, profession, isFollowing },
  "context": { "tipo": "local|negocio|oferta|evento", "id": "...", "titulo": "..." } | null,
  "durationS": 15, "createdAt": "ISO", "persistence": "supabase|local" } ] }
```

- **Leitura atual** (`getStoredPublishedReels`): parse seguro; `items` deve ser array; itens filtrados por `id` string.
- **Chave inexistente** → `[]`; **JSON inválido** → `{}` → `[]`; **array vazio** → `[]`.
- **Consumidores:** `reel-feed.getPublishedReels`/`buildPublishedReel`, `reel-publish.saveStoredPublishedReel`, `deleteStoredPublishedReel` (sem chamadores).

A migração **não** reutiliza `getStoredPublishedReels` para ler (ele mascara JSON inválido como vazio); ela lê o JSON **bruto** para distinguir os casos exigidos (§16/Teste 9).

## 4. Formato novo

`StoredReel` (definido na 1C-3B, `src/lib/persistence/domain/reels-entities.ts`), persistido pelo `ReelRepository` na store `reels` do banco dedicado `connexy-reels-data-local-db` (sem tocar `connexy-reels-local-db`/`media`).

## 5. Transformação (`published:v1` → `StoredReel`)

`toStoredReel(item)` — 1:1 para todos os campos suportados:

| Legado | StoredReel | Nota |
| --- | --- | --- |
| `id` | `id` | preservado integralmente (sem novo id/timestamp) |
| `caption` | `caption` | — |
| `category` | `category` | validado contra as 9 categorias |
| `author` | `author` | validado (`id,name,handle,photoUrl` string); `verified`/`profession`/`isFollowing` ausentes → `false`/`null`/`false` (neutral; sem inventar conteúdo) |
| `context` | `context` | `null` ou `{tipo,id,titulo}` com `tipo` no conjunto |
| `durationS` | `durationS` | número finito |
| `createdAt` | `createdAt` | string ISO |
| `persistence` | `persistence` | `"supabase"|"local"` |

**Nenhum campo novo é criado.** Campo legado ausente em `StoredReel` → não existe (o legado só tem o que o `StoredReel` suporta); registros que não satisfazem a validação estrutural são **rejeitados** (marcados `invalid`, mantidos na fonte, logados) — nunca aproximados para migrar.

## 6. Marcador de migração

Chave: `connexy:reels:migration-status:v1` (constante `REELS_MIGRATION_MARKER_KEY`).

```json
{ "version": 1, "ranAt": "ISO", "counts": { "reels": N, "likes": 0, "comments": 0 } }
```

- escrita **somente após** todos os registros processados com sucesso (migrated/skipped), sem `failed`/`invalid`;
- presença de marcador válido `version===1` ⇒ migração concluída → função retorna sem reler a fonte;
- marcador de versão diferente/inválida ⇒ tratado como não concluído (reexecuta e regrava);
- falha de escrita do marcador ⇒ aviso e retomada na próxima execução (trabalho já feito é idempotente).

## 7. Idempotência

- **marcador** impede re-execução não necessária;
- **`get(id)` antes de `put`** por registro (via `repo.exists`) — IDs originais estáveis, sem timestamps/ids aleatórios;
- segunda execução (mesmo sem marcador) não duplica (skips `skippedAlreadyPresent`).

## 8. Interrupção / falhas

- Falha de gravação de um registro: loga, `failed += 1`, continua com os demais; **marcador não é gravado** → próxima execução retoma (sem duplicar os já migrados).
- Registro estruturalmente inválido: `invalid += 1`, mantido na fonte, logado; marcador **não** é gravado até saneamento.
- JSON inválido da chave: `error: "invalid-json"`, `completed:false`, fonte preservada, sem marcador.
- Forma inesperada (não é array nem `{items:[]}`): `error: "invalid-structure"`, mesmo comportamento.
- IndexedDB indisponível: erro propagado como `PersistenceError` padrão (adapter 1C-1); o chamador decide (padrão 1C-2: log, UI nunca quebra).
- Reuso dos padrões existentes (`PersistenceError`, safe storage); **sem sistema de erros paralelo**.

## 9. Rollback

`connexy:reels:published:v1` **permanece intacta** (nunca removida/limpa/substituída/sobrescrita pela migração). Os únicos toques no localStorage são o marcador `connexy:reels:migration-status:v1` (chave nova). Rollback/auditoria possíveis durante toda a fase.

## 10. Quando executar (ponto de chamada recomendado)

Esta fase **não conecta o Feed** (regra §13 da fase: dual-write e conexão são etapas posteriores 1C-3C-C+/D). O mecanismo (`ensureLocalReelsLoaded()`) está pronto e provado; a invocação lazy recomendada é o **início do carregamento do Feed na fase 1C-3C-D** (quando `getReelFeed` passar a ler do `ReelRepository`), no mesmo estilo de `ensureLocalChatLoaded()` da 1C-2 — chamada fire-and-forget sem lançar exceções para dados legados. Nesta fase, executar via testes.

## 11. Testes

`tests/persist-phase-1c-3c-a.test.ts` (18 testes; memory adapter sobre `reelsPersistenceSchema` + IO fake injetável):

1. chave inexistente → sem falha, 0 Reels, marcador, idempotente;
2. vazio (`{version:1,items:[]}`) → concluído, sem duplicação; 2b. `[]` bruto;
3. 1 Reel → 1 `StoredReel` correspondente;
4. vários Reels → todos migrados, ids preservados;
5. segunda execução → sem duplicação;
6. IDB já contém Reel → skip (`skippedAlreadyPresent`), sem duplicar;
7. falha intermediária simulada → não aborta; execução seguinte retoma sem duplicar;
7b. registro inválido → válidos migram, marcador fica pendente até saneamento;
8. marcado concluído → não reexecuta nem relê a fonte;
9. JSON inválido → erro controlado, fonte preservada, sem marcador; 9b. forma inesperada;
extras: fonte nunca alterada; marcador de versão inválida regravado; transformação campo a campo, contexto 1:1, contexto malformado rejeitado, registros incompletos rejeitados.

## 12. Limitações

- Likes/comentários **não** são migrados nesta fase (1C-3C-B/C);
- `publishReel` ainda escreve somente em `published:v1` (dual-write é 1C-3C-C+); como o Feed ainda lê de lá, não há quebra — mas a paridade total de escrita acontece nas fases seguintes;
- registros inválidos bloqueiam o marcador até saneamento (comportamento proposital: nada é descartado silenciosamente);
- `sound:v1`, `MOCK_REELS`, `SEED_COMMENTS` permanecem como catálogo/config — fora do escopo (decisão 1C-3C-0);
- atribuição de likes a usuário segue pendente (HIGH documentado no plano 1C-3C-0; fora desta etapa).

---

## Validações

| Verificação | Resultado |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun run build` | OK |
| `bun test` | **104 pass / 0 fail** (86 anteriores + 18 novos) |
| `bun lint` | **503 (483 erros, 20 avisos)** — idêntico ao baseline (0 novos) |

**Git: alterações locais no working tree, sem commit/push.**