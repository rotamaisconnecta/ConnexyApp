# Arquitetura da Camada de Persistência Local — Connexy (Fase 1C-1)

- **Data:** 2026-09-11
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Fase anterior:** `docs/audits/persistence-baseline.md` (1C-0)
- **Regra da fase:** criar a fundação arquitetural do contrato de persistência local. Nenhuma entidade real do Connexy foi migrada.

> A existência desta camada NÃO significa que as entidades do Connexy já foram migradas para IndexedDB.

---

## 1. Objetivo

Criar a fundação arquitetural para uma futura persistência local baseada em IndexedDB, definindo:

- contrato único de persistência;
- tipos/interfaces;
- responsabilidades da camada Repository;
- adapter de armazenamento local mínimo;
- convenções de nomes;
- versionamento;
- tratamento de erro;
- serialização;
- isolamento da implementação IndexedDB;
- preparação para a futura substituição por Supabase.

Esta fase **não migrou** as entidades existentes.

---

## 2. Arquitetura

As telas e componentes do Connexy **não** conhecem diretamente a tecnologia de persistência.

```
UI
↓
Hook/Service (futuro)
↓
Repository  (PersistenceRepository<T>)
↓
PersistenceAdapter (StorageAdapter)
↓
IndexedDB
```

No futuro, sem reescrever as telas:

```
UI
↓
Hook/Service
↓
Repository  (SupabaseRepository com o mesmo contrato)
↓
Supabase
```

### Arquivos criados

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/persistence/types.ts` | Contratos (`PersistedEntity`, `PersistenceSchema`, `Serializer<T>`, `StorageAdapter`, `PersistenceRepository<T>`), convenção de coleções reservadas |
| `src/lib/persistence/errors.ts` | `PersistenceError` + códigos identificáveis + normalizador `toPersistenceError` |
| `src/lib/persistence/serializer.ts` | Serializador padrão JSON (`jsonSerializer<T>()`) |
| `src/lib/persistence/local/indexed-db.ts` | `IndexedDbAdapter` (API nativa, sem lib) |
| `src/lib/persistence/local/local-repository.ts` | `LocalRepository<T>` + `createLocalRepository<T>()` |
| `tests/persist-phase-1c-1.test.ts` | Testes mínimos do contrato |

---

## 3. Contrato

### 3.1 Entidade e chave

Toda entidade persistente possui uma chave estável `id: EntityId` (string).

```ts
interface PersistedEntity {
  id: EntityId;
}
```

### 3.2 Repository (pequeno por deliberação)

```ts
interface PersistenceRepository<T extends PersistedEntity> {
  readonly store: StoreName;
  get(id: EntityId): Promise<T | null>;
  list(): Promise<T[]>;
  put(record: T): Promise<T>;                       // upsert
  update(id: EntityId, changes: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: EntityId): Promise<void>;
  clear(): Promise<void>;
  exists(id: EntityId): Promise<boolean>;
}
```

Métodos: `get`, `list`, `put`, `update`, `delete`, `clear`, `exists`. Nenhum método especulativo foi adicionado.

### 3.3 Adapter

```ts
interface StorageAdapter {
  readonly schema: PersistenceSchema;
  get<T extends PersistedEntity>(store: StoreName, id: EntityId): Promise<T | null>;
  getAll<T extends PersistedEntity>(store: StoreName): Promise<T[]>;
  getAllKeys(store: StoreName): Promise<EntityId[]>;
  put<T extends PersistedEntity>(store: StoreName, value: T): Promise<void>;
  delete(store: StoreName, id: EntityId): Promise<void>;
  clear(store: StoreName): Promise<void>;
  close(): Promise<void>;
}
```

---

## 4. Adapter IndexedDB

- `src/lib/persistence/local/indexed-db.ts` — implementa `StorageAdapter` usando **IndexedDB nativo** (sem Dexie, sem lib).
- `open()` cacheia a `Promise<IDBDatabase>`; recusa com `ADAPTER_UNAVAILABLE` quando `indexedDB` não existe (ex.: SSR/test runner).
- `applyUpgrade()` cria as stores definidas e ausentes; migrações futuras entram nesse hook (nunca dropando dados).
- Erros de transação/request são convertidos em `PersistenceError`.
- **Coexistência:** a store `connexy-reels-local-db/media` (fluxo de Reels) **não é tocada**, continua com seu próprio banco e nunca é aberta por esta camada.

---

## 5. Versionamento

- `PersistenceSchema.name` → nome do banco; `PersistenceSchema.version` → versão do banco (mecanismo de upgrade).
- `PersistenceSchema.stores` → definição das stores (nome + keyPath; padrão `"id"`).
- Estratégia:
  1. Ao abrir, o browser compara a versão armazenada com a versão declarada; se maior, dispara `onupgradeneeded` → `applyUpgrade()` cria stores novas;
  2. Migrações futuras (renomear/transformar store) devem **bump** `version` e estender `applyUpgrade()`;
  3. Upgrade bloqueado por outra conexão (`onblocked`) gera `SCHEMA_MISMATCH` — falha explícita, sem workaround.
- Nenhuma migration complexa foi criada nesta fase.

---

## 6. Tratamento de erros

- Todos os erros viram `PersistenceError` com `code` identificável: `ADAPTER_UNAVAILABLE`, `DATABASE_OPEN_FAILED`, `SCHEMA_MISMATCH`, `STORE_MISSING`, `NOT_FOUND`, `SERIALIZATION`, `UNKNOWN`.
- Erros não são escondidos silenciosamente: operações rejeitam a promise com o erro convertido (`LocalRepository.update` de registro inexistente → `NOT_FOUND`).
- `toPersistenceError()` preserva a causa original.

---

## 7. Serialização

- `jsonSerializer<T>()` (padrão): `encode` reduz o valor a JSON puro (`JSON.parse(JSON.stringify(...))`) antes de gravar; `decode` retorna o valor.
- Nada de funções, referências React ou objetos de UI é persistido.
- Limitações documentadas: `Blob`/`File`/`Buffer`/`Map`/`Set`/`Date` (vira string ISO)/`BigInt`/referências circulares não são suportados pelo serializador padrão. Mídia de Reels **não** passa por esta camada nesta fase.

---

## 8. O que continua em localStorage

Regra pretendida (Fase 1C-2 em diante):

**localStorage** — preferências, configuração, flags, dados pequenos, estado explicitamente local:
- preferências de presença e som; roles/modo; contexto do engine; rascunho de driver; config do dispatcher; anti-spam de popup; flags de UX (swipe-hint, posição de carousel, permissão de câmera); estado de sessão/DEV demo.

**IndexedDB** — entidades, coleções, histórico, mensagens, mídia, dados maiores:
- já existente: `connexy-reels-local-db` (mídia de Reels);
- futuras (candidatas da baseline): conversas/mensagens/grupos, posts, perfil demo, reels (metadata), curtidas/comentários de reels, trip + histórico, ride blocks, estado do dispatcher, check-ins de presença, histórico do AI, eventos live, engajamento do marketplace.

**Nada foi migrado nesta fase.** Os `safeGet/safeSet` existentes continuam exatamente como estão.

---

## 9. Relação futura com Supabase

- O contrato `PersistenceRepository<T>` será implementado por `SupabaseRepository` no futuro, com a mesma assinatura — a UI depende apenas das interfaces, não do adapter.
- Nesta fase o Supabase **não foi alterado**: sem migrations, sem schema novo, sem chamada a repositórios reais.

---

## 10. Limitações atuais (esta fase)

- `update()` é `read-modify-write` (não atômico em nível de store).
- Coleções reservadas (`RESERVED_COLLECTIONS`) **não foram criadas** — são apenas convenção para a Fase 1C-2.
- Não há migrations complexas, sincronização, fila offline, dual-write novo ou cache — tudo isso fica para fases posteriores.
- A camada ainda não é consumida por nenhuma tela/hook do app (por design).
- Testes desta fase usam um adapter fake compartilhado (Bun/não expõe IndexedDB); o `IndexedDbAdapter` só valida o erro de ambiente fora do browser.

---

## 11. Fase 1C-2 — Conversas e Mensagens

> Conversas e Mensagens são a primeira migração-piloto para a camada de persistência local. As demais entidades permanecem inalteradas.

### Stores criadas

Banco novo e **independente** de `connexy-reels-local-db` (Reels não é tocado; a store `media` não é migrada):

| Banco | Versão | Store | Índices |
|---|---|---|---|
| `connexy-app-local-db` | 1 | `conversations` | — |
| `connexy-app-local-db` | 1 | `messages` | `by_conversation` → `conversationId` |

- `messages.by_conversation` cobre a consulta real de mensagens por conversa; a ordenação por `at` é feita na camada de domínio (volume local pequeno).
- Não foram criados índices especulativos para outras entidades.
- O contrato `StorageAdapter` foi estendido com `getAllByIndex(store, indexName, value)` e `StoreDefinition` ganhou `indexes[]` — criação de índices via busca em `createObjectStore` (sem dropar dados).

### Repositories criados

- `src/repositories/message.repository.ts` → `MessageRepository` (extends `LocalRepository<StoredMessage>`): `listByConversation`, `lastInConversation`.
- `src/repositories/conversation.repository.ts` → `ConversationRepository` (extends `LocalRepository<StoredConversation>`): `listOrderedByUpdatedAt`, `ensureExists`, `applyLastMessage`.
- `src/lib/persistence/domain/chat-entities.ts` → `StoredMessage` / `StoredConversation` (modelo canônico armazenado).
- `src/lib/persistence/domain/chat-schema.ts` → `chatPersistenceSchema` (nome/versão/stores/índices).
- `src/lib/chat/local-chat-persistence.ts` → facade com adapter/repositories singleton, cache síncrono e migração one-time (app não conhece IndexedDB).

### Entidades migradas

- **Mensagens** — antes: `localStorage["connexy:demo:db"].messages` (blob demo, JSON). Depois: store `messages` (IndexedDB) via `MessageRepository`. A camada demo (`demo-db.ts`) agora delega e emite evento; o array `messages` legado permanece no blob apenas como dado preservado, sem novos escritos — **sem dual-write**.
- **Conversas** — antes: derivadas (conexões/grupos + última mensagem), sem agregação persistida. Depois: store `conversations` (IndexedDB) via `ConversationRepository`, com registro criado em `connectUser` (`ensureExists`) e atualizado a cada mensagem (`applyLastMessage`: último conteúdo + timestamps).

### Estratégia de IDs

- `messages.id` e `conversations.id` são strings (mantém `demo-msg-*`, `demo-media-*`, `demo-shared-*`, id de par/grupo).
- Relacionamento preservado: `messages.conversationId → conversations.id`. Nenhuma cópia — a mensagem existe **apenas** em `messages`.

### Migração de dados e localStorage

- Existe fonte legada real (`connexy:demo:db.messages`). Foi criada migração **one-time idempotente**: só roda quando há mensagens legadas e a store `messages` está vazia; pula ids já presentes; origem preservada.
- **Nenhuma chave de localStorage foi removida.** `connexy:demo:db` continua com conexões/solicitações/grupos; `connexy.mock.conversation-invites` (status de convite por pessoa) e as demais chaves não são tocadas.

### Limitações e riscos restantes

- A lista de conversas (`conversations-screen.tsx`) continua derivando apresentação (MOCK + conexões/grupos + última mensagem do cache); o `ConversationRepository` é a persistência do agregado, não a fonte da renderização da lista.
- `muted`/`pinned`/`unreadCount` continuam sendo estado de UI/derivação (não persistidos) — evitou-se campo especulativo sem integração.
- Cache síncrono faz bootstrap do localStorage legado e reconcilia com IndexedDB em seguida (janela curta; semáforo por promise + evento de refresh).
- Sem sincronização entre abas, sem offline queue, sem Realtime — por design desta fase.

---

## 12. Próxima fase (revisada após 1C-2)

Depois de validada a primeira migração-piloto (Conversas/Mensagens), analisar a próxima entidade candidata da baseline — ver `docs/audits/persistence-phase-1c-2.md` para a recomendação detalhada.

---

## 13. Evolução: Reels → IndexedDB (Fase 1C-3B)

A auditoria `docs/audits/persistence-phase-1c-3a.md` mapeou o domínio completo de Reels (fontes de verdade, mídia em IndexedDB própria, curtidas/comentários/publicação em localStorage `:v1`, `MOCK_REELS` hardcoded, caminho Supabase dormente). A Fase 1C-3B cria a **camada funcional de repositórios** (apenas disponível; a UI não foi conectada — por design desta fase):

### Bancos e stores

- **Novo banco dedicado `connexy-reels-data-local-db`** (domínio), independente de:
  - `connexy-reels-local-db` + store `media` (mídia de Reels — **não tocada**);
  - `connexy-app-local-db` (chat 1C-2).
- Stores criadas no v1 do novo banco:
  - `reels` (metadata persistente do Reel, formato igual a `StoredPublishedReel`);
  - `reel_likes` (curtida por usuário), índice `by_reel` → `reelId`;
  - `reel_comments` (comentário por Reel, **indepedente**, não embutido), índice `by_reel` → `reelId`.

### Camada de domínio

- `src/lib/persistence/domain/reels-entities.ts`: `StoredReel`, `StoredReelLike`, `StoredReelComment`, `StoredReelAuthor`, `StoredReelContextRef`, `reelLikeId(reelId, userId)`.
- `src/lib/persistence/domain/reels-schema.ts`: `reelsPersistenceSchema` (nome/versão/stores/índices) consumido pelo adapter genérico 1C-1.
- `src/repositories/reel.repository.ts` → `ReelRepository` (+ `deleteReelWithCascade`).
- `src/repositories/reel-like.repository.ts` → `ReelLikeRepository`: `getByReelAndUser`, `isLiked`, `addLike` (idempotente), `removeLike`, `listByReel`, `countByReel`.
- `src/repositories/reel-comment.repository.ts` → `ReelCommentRepository`: `listByReel` (cronológica), `countByReel`.

### Decisões arquiteturais

- **Unicidade de curtida sem índice único composto** (a infra genérica não expõe um): chave primária determinística `reelLikeId(reelId, userId)` + `addLike` **idempotente**. Usuários diferentes no mesmo Reel → curtidas distintas.
- **Contadores derivados**: `countByReel` (likes/comments) calcula da coleção; nenhum contador duplicado persistido.
- **Cascata na camada de domínio** (`deleteReelWithCascade`), não escondida no adapter.
- **Dados antigos preservados**: as chaves `connexy:reels:{likes,comments,published,sound}:v1` e `MOCK_REELS`/`SEED_COMMENTS` não foram migradas nem removidas; **sem dual-write** para os novos repositórios nesta fase.
- **Sem facade singleton** (`local-reel-persistence.ts`) nesta fase — apenas os repositórios.

**Plano de integração ao Feed (auditoria/planejamento):** `docs/audits/persistence-phase-1c-3c-0.md` define a estratégia de seed (catálogo demo `MOCK_REELS`/`SEED_COMMENTS` permanece em código), migração one-time de `published:v1`/`likes:v1`/`comments:v1` para os repositórios, identidade de likes, contadores derivados e a ordem da futura fase 1C-3C. Sem implementação nesta etapa.

---

*Fase 1C-1 — apenas infraestrutura. Fase 1C-2 — primeira migração-piloto (Conversas e Mensagens → IndexedDB). Fase 1C-3B — camada de repositórios de Reels/Curtidas/Comentários disponível (UI não conectada). As demais entidades do Connexy permanecem inalteradas; Reels-mídia, Supabase, autenticação e armazenamentos não-migrados não foram tocados.*