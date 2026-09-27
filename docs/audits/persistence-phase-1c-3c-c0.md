# Fase 1C-3C-C0 — Suporte estrutural a replies

- **Data:** 2026-09-12
- **Escopo:** modelo e repository local de comentários.
- **Sem migração de dados, commit ou push.**

## Bloqueio encontrado na Fase C

`ReelComment` aceita `replies: ReelComment[]` recursivamente. Cada reply possui
ID, autor, texto, timestamp, likes, estado `likedByMe` e pode possuir outras
replies. O `StoredReelComment` anterior não continha `replies`, `parentId` ou
qualquer vínculo hierárquico. Uma migração direta descartaria a relação
pai/filho e potencialmente todos os dados das respostas.

## Estrutura anterior

```text
StoredReelComment {
  id, reelId, text,
  authorId, authorName, authorPhoto,
  createdAt, likes, likedByMe
}
```

Comentários eram entidades independentes indexadas somente por `reelId`.

## Modelo final

O modelo permanece normalizado, com uma entidade por comentário ou reply:

```text
StoredReelComment {
  id
  reelId
  parentId?: string | null
  siblingOrder?: number | null
  text
  authorId
  authorName
  authorPhoto
  createdAt
  likes
  likedByMe
}
```

- `parentId = null` ou ausente representa comentário raiz.
- `parentId = <id>` representa reply direta daquele comentário.
- A cadeia de `parentId` representa qualquer profundidade, sem limite
  artificial.
- IDs e snapshots permanecem em cada entidade, permitindo deduplicação por ID.

Os campos são opcionais no contrato para manter compatibilidade binária e de
tipos com registros da Fase 1C-3B. O repository interpreta `parentId` ausente
como `null`.

## Ordem estável

O array legado possui ordem observável: `getReplies` devolve as respostas na
ordem armazenada, sem ordenação por timestamp. `createdAt` sozinho não é
suficiente porque timestamps podem empatar, estar ausentes ou ser inválidos.

Por isso, `siblingOrder` preserva a posição original entre irmãos. A ordenação
do repository segue:

1. `siblingOrder`, quando presente;
2. `createdAt`;
3. `id` como desempate determinístico.

Registros 1C-3B sem `siblingOrder` continuam ordenáveis por `createdAt + id`.
Nenhum timestamp histórico é substituído ou inventado nesta fase.

## Repository e integridade

`ReelCommentRepository.put` agora valida:

- `siblingOrder` inteiro e não negativo;
- ausência de autorreferência;
- existência do comentário pai;
- pai pertencente ao mesmo Reel;
- ausência de ciclos em toda a cadeia ancestral.

`listByParent(reelId, parentId)` lista raízes ou filhos diretos em ordem
estável. `listByReel`, `get`, `put`, `update`, `countByReel` e a idempotência
por ID permanecem disponíveis. `delete` remove o comentário e todos os seus
descendentes para não criar órfãos.

Uma migração futura deverá inserir cada árvore em percurso pai-antes-dos-filhos
e fornecer `siblingOrder` a partir do índice de cada array legado.

## Índice e versionamento

Não foi adicionado `by_parent`.

A reconstrução e a validação já partem de um Reel específico; `by_reel`
recupera o conjunto completo e o repository filtra `parentId` em memória. Isso
evita um índice e um upgrade sem necessidade comprovada para o volume local
atual.

O schema permanece na versão **1**. IndexedDB armazena objetos sem schema fixo,
e `parentId`/`siblingOrder` não são índices nem alterações de keyPath. Logo,
registros existentes continuam legíveis e nenhuma transformação, recriação ou
upgrade destrutivo é necessário.

## Compatibilidade

- Comentários 1C-3B sem `parentId` são tratados como raízes.
- `listByReel` mantém ordenação cronológica, agora com desempate por ID.
- O teste de regressão completo da Fase 1C-3B permanece passando.
- O banco, stores e índice `by_reel` existentes permanecem inalterados.
- Nenhum dado existente foi lido, regravado ou removido.

## Testes

`tests/persist-phase-1c-3c-c0.test.ts` cobre:

- raiz, reply de primeiro nível e cadeia explícita A → B → C → D;
- profundidade arbitrária;
- múltiplos filhos e múltiplas árvores no mesmo Reel;
- `parentId` correto, raiz nula e raiz legada sem campo;
- ordem por `siblingOrder` e fallback determinístico;
- persistência, leitura, `listByReel`, `listByParent` e reload conceitual;
- IDs preservados e upsert idempotente;
- rejeição de pai ausente, autorreferência, ciclo e pai de outro Reel;
- rejeição de ordem inválida;
- exclusão segura da subárvore;
- ausência de `by_parent` e permanência do schema v1.

## Limitações e escopo preservado

- A migração `comments:v1 → ReelCommentRepository` não foi implementada.
- `ensureLocalReelsLoaded`, marcador e `stages.comments` não foram alterados.
- Nenhum dado real do localStorage foi lido ou alterado.
- Feed, UI, CommentsSheet, rotas e `publishReel` não foram alterados.
- Likes, Supabase, autenticação e mídia não foram alterados.
- Não há dual-write.

## Arquivos alterados

- `src/lib/persistence/domain/reels-entities.ts`
- `src/repositories/reel-comment.repository.ts`
- `tests/persist-phase-1c-3c-c0.test.ts`
- `docs/audits/persistence-phase-1c-3c-c0.md`

## Validações

- Testes C0 + regressão 1C-3B: **50 pass / 0 fail**.
- `bunx tsc --noEmit`: **PASS**.
- `bun run build`: **PASS**.
- `bun test`: **166 pass / 0 fail** (420 assertions).
- Lint focado: **PASS**, sem novos problemas.
- `git diff --check`: **PASS**.
