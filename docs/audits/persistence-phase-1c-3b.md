# Fase 1C-3B — Schema + Repositories locais de Reels, Curtidas e Comentários

- **Data:** 2026-09-12
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Fase anterior:** `docs/audits/persistence-phase-1c-3a.md` (auditoria de Reels — leitura) e `docs/audits/persistence-architecture.md` (1C-1) / `persistence-phase-1c-2.md` (1C-2).
- **Regra da fase:** criar a **camada funcional de repositórios** locais de Reels/Curtidas/Comentários sobre a infraestrutura genérica 1C-1. Fase de **fundação**, não de migração completa: a UI **não** foi conectada aos novos repositórios.

---

## 1. Objetivo

Materializar (somente código + testes) um armazenamento local correto para o trio Reels / Curtidas / Comentários:

- coleções **independentes** (`reels`, `reel_likes`, `reel_comments`) relacionadas por `reelId` — curtidas e comentários **não** embutidos no Reel;
- regra de negócio de curtida (1 curtida por usuário por Reel) garantida na camada de domínio;
- contadores deriváveis da coleção (sem contadores duplicados);
- cascata de exclusão preparada na camada de repositório;
- identidade pronta para múltiplos usuários (curtida = `reelId` + `userId`);
- compatibilidade total com a infraestrutura genérica 1C-1 e com as instalações IndexedDB existentes.

Sem commit, sem conexão à UI, sem tocar mídia, Supabase ou dados antigos.

---

## 2. Modelo escolhido

Fonte de verdade: modelo real verificado na auditoria 1C-3A (código de produção, não idealização de domínio).

- **`StoredReel`** espelha `StoredPublishedReel` do fluxo de publicação atual: `id`, `caption`, `category`, `author` (snapshot `StoredReelAuthor`), `context` (`{tipo,id,titulo}|null`), `durationS`, `createdAt` (timestamp epoch ms, ISO), `persistence` (`"supabase"|"local"`).
- **`StoredReelLike`**: `id` (determinístico), `reelId`, `userId`, `createdAt`. Sem contador embutido.
- **`StoredReelComment`** espelha `ReelComment` da UI **sem** `replies` (UI atual não renderiza respostas — gap conhecido); mantém `likes`/`likedByMe` como campos espelhados/denormalizados nesta fase (sem agregação; documentado). Sem campo de edição.

Derivados (não persistidos): `isLiked`, `likeCount`, `commentCount` — calculados por queries.

---

## 3. Stores criados

Novo banco **dedicado** `connexy-reels-data-local-db` v1, criado pelo mesmo mecanismo genérico (PersistenceSchema + `applyUpgrade`):

| Store | Conteúdo |
| --- | --- |
| `reels` | metadata persistente do Reel (`StoredReel`), chave `id` |
| `reel_likes` | `StoredReelLike`, chave determinística `reelLikeId(reelId, userId)` |
| `reel_comments` | `StoredReelComment`, chave `id` |

Justificativa do banco separado: isolar domínio de mídia (a mídia de Reels permanece intacta em `connexy-reels-local-db`) e isolar de instalações de chat existentes (`connexy-app-local-db`).

---

## 4. Índices

- `reel_likes`: índice `by_reel` (keyPath `reelId`) — listar/contar curtidas por Reel sem varrer a store.
- `reel_comments`: índice `by_reel` (keyPath `reelId`) — listar/contar comentários por Reel.
- `reels`: sem índice (a ordenação do feed é feita na camada de domínio).

---

## 5. Repositories

Convenção 1C-2 (`src/repositories/*.repository.ts`, estendem `LocalRepository<T>` da 1C-1 — não repetem adapter/serializer/erros):

- **`src/repositories/reel.repository.ts`** → `ReelRepository` estende `LocalRepository<StoredReel>`: `listOrderedByRecent` (createdAt desc). Exporta também `deleteReelWithCascade`.
- **`src/repositories/reel-like.repository.ts`** → `ReelLikeRepository` estende `LocalRepository<StoredReelLike>`: `getByReelAndUser`, `isLiked`, `addLike` (idempotente), `removeLike`, `listByReel`, `countByReel`.
- **`src/repositories/reel-comment.repository.ts`** → `ReelCommentRepository` estende `LocalRepository<StoredReelComment>`: `listByReel` (ordem cronológica determinística), `countByReel`.

API mínima do §20 atendida na íntegra. Nenhum detalhe contra IndexedDB vaza para o consumidor.

---

## 6. Identidade

- Sem global de usuário importado; identidade é **parâmetro de método** (`userId`).
- Curtida usa `reelLikeId(reelId, userId)` (`"${reelId}::${userId}"`) como chave primária — prontidão para múltiplos usuários.
- Comentários guardam `authorId`/`authorName`/`authorPhoto` no registro.
- `StoredReel.author` mantém snapshot (exibição do feed).

---

## 7. Regra de unicidade de Like

Restrição esperada: no máximo **1 curtida por usuário por Reel** (consistência).

- A infraestrutura genérica 1C-1 **não expõe índice único composto**.
- Decisão compatível adotada: **chave primária determinística** `reelLikeId(reelId, userId)` + **`addLike` idempotente** (segunda curtida do mesmo usuário no mesmo Reel retorna a curtida existente, sem duplicar).
- Ordem de prioridade atendida (auditoria §8): consistência > simplicidade > compatibilidade futura Supabase > baixo acoplamento.
- Testado: mesmo usuário → 1 registro; usuários diferentes no mesmo Reel → registros distintos (isolamento de usuário).

---

## 8. Contadores

- `countByReel` (curtidas e comentários) **deriva** da coleção (listagem por índice + `length`).
- Nenhum contador duplicado persistido no Reel — `StoredReel` não contém `likeCount`/`commentCount`/`isLiked`.

---

## 9. Cascata

- Exclusão de Reel com limpeza de curtidas/comentários órfãos: `deleteReelWithCascade(reels, likes, comments, reelId)` em `src/repositories/reel.repository.ts`.
- Regra de negócio na **camada de domínio** (não escondida no adapter genérico); idempotente (ignora ausentes).
- Fluxo de exclusão da UI **não** foi alterado para usá-la nesta fase.

---

## 10. Compatibilidade com mídia

- A mídia de Reels continua em `connexy-reels-local-db` / store `media` via `src/lib/reels/reel-local-media-db.ts` — **intocada**.
- O novo banco `connexy-reels-data-local-db` é independente (nomes/versões distintos); não há `onupgradeneeded` conflitante nem reescrita de `connexy-reels-local-db`.

---

## 11. Compatibilidade com 1C-1

- Usa `PersistenceSchema`/`StorageAdapter`/`PersistenceError`/`LocalRepository`/`jsonSerializer` existentes.
- Nenhuma mudança em `src/lib/persistence/*`, nenhuma mudança em `src/lib/persistence/types.ts` (`reel_likes`/`reel_comments` já constam de RESERVED_COLLECTIONS; o store `reels` é inédito e sem conflito).
- Versionamento via `version: 1` do novo banco (mesmo mecanismo determinístico da 1C-2; sem abreviaturas, idempotente, não-destrutivo). Nenhuma store existente foi alterada.
- Nenhuma extensão genérica necessária (sem refatoração → sem gatilho §33).

---

## 12. Dados antigos preservados

- **Nenhuma chave de localStorage foi removida nem migrada**: `connexy:reels:likes:v1`, `connexy:reels:comments:v1`, `connexy:reels:published:v1`, `connexy:reels:sound:v1` continuam existindo e intocadas.
- `MOCK_REELS` (hardcoded) e `SEED_COMMENTS` (hardcoded na rota) permanecem como estão; **sem auto-migração**.
- **Nenhum dual-write novo**: os novos repositórios são uma **camada disponível**; nada escreve simultaneamente no legacy e no novo.

---

## 13. UI não migrada

- Nenhum componente/tela conectado: `_app.reels.tsx`, `$reelId.tsx`, `comments-sheet.tsx`, telas de feed/autor não usam os novos repositórios.
- Nenhuma rota, layout, navegação ou sessão fora de Reels modificada.
- O fluxo da UI continua exatamente como antes (comportamento inalterado — mudanças visuais/rotas não fazem parte desta fase).

---

## 14. Supabase não alterado

- Nenhuma migrate, RLS, schema, bucket, cliente, ou fluxo Supabase alterado/enviado.
- Sem testes contra Supabase nesta fase (regra §26).
- `persistence: "supabase"` é apenas um rótulo espelhado no modelo — permanece sem consumidor.

---

## 15. Testes

`tests/persist-phase-1c-3b.test.ts` (bun:test, memory adapter sobre `reelsPersistenceSchema`; "reload" = nova instância de adapter/repo no mesmo disco):

- ReelRepository: create/get, getById null, list, ordenação recente, update (preserva id), update ausente → `PersistenceError`/`NOT_FOUND`, delete.
- ReelLikeRepository: create, getByReelAndUser, idempotência do mesmo usuário, usuários distintos, `isLiked` por usuário (isolamento de usuário), listByReel, countByReel, removeLike idempotente.
- ReelCommentRepository: create/getById, ordenação cronológica, countByReel, delete, isolamento entre Reels.
- Relacionamentos: reel-1 × reel-2 não cruzam likes/comentários.
- Cascata: `deleteReelWithCascade` limpa filhas do Reel excluído e preserva outro Reel; idempotente para Reel sem filhas.
- Reload conceitual: Reels/curtidas/comentários sobrevivem a nova instância; cenário salvar→destruir→recriar→recuperar.
- Schema/isolamento: stores corretas, índice `by_reel` → `reelId`, banco ≠ `connexy-reels-local-db`, ids determinísticos.

**31 novos testes.** Total: **86 pass / 0 fail** (55 existentes + 31 novos).

---

## 16. Validações

| Verificação | Resultado |
| --- | --- |
| `bun test` | 86 pass / 0 fail |
| `bunx tsc --noEmit` | exit 0 (sem erros) |
| `bun run build` | OK (nitro/prebuild completo) |
| `bun lint` | **503 problemas (483 erros, 20 avisos)** — idêntico ao baseline; os 9 problemas desta fase (prettier) foram corrigidos nos arquivos novos antes da validação final |

Nenhuma regressão nos 55 testes existentes (nenhum fix mascarado/desabilitado).

---

## 17. Riscos restantes

- **`StoredReelComment` denormalizado**: `likes`/`likedByMe` espelhados sem agregação — futuro sync precisa reconciliar.
- **Sem `replies`** (respostas) persistidas: o produto não renderiza respostas hoje; adicionar depois = mudança de modelo + versionamento de banco.
- **Sem curitda/comentário no Supabase**: o caminho dormente (comments-sheet) permanece sem consumidor; os repositórios locais escritos por esta fase podem precisar de reconciliação futura.
- **Sem `indexed by_user`**: listagens por usuário exigirão varredura ou novo índice no futuro (não é requisito desta fase).
- **Sem facade singleton** (`local-reel-persistence.ts`): consumidores atuais devem instanciar repositórios com adapter; eventual melhoria futura.
- **Unicidade de curtida** depende da chave determinística (idempotência em `addLike`); conflito de escrita concorrente não é protegido por transação IndexedDB única neste desenho (aceito na fase de fundação).

---

## 18. Próxima fase recomendada

1. **Facade/provider** `local-reel-persistence.ts` (padrão 1C-2) + cache síncrono, para a UI acessar sem conhecer IndexedDB.
2. **Conectar o feed** (`_app.reels.tsx`) aos repositórios na ordem: conteúdo (publicado/salvo) → curtidas (`isLiked`/`countByReel`) → comentários (`listByReel`/`countByReel`), com **dual-write + migração one-time** das chaves `connexy:reels:*:v1` decidida explicitamente.
3. Se/quando a reconciliação remota for exigida, avaliar `userId` real (auth) e o caminho Supabase dormente de likes/comentários.
4. Validar respostas (`replies`) como mudança explícita de modelo antes de investir.

Fase de fundação encerrada: sistema atual preservado, camada nova disponível (sem conexão), provada por 31 testes dedicados. **Git: alterações locais não commitadas.**