# Fase 1C-3C-C — Migração local de Comments de Reels

## Status

**PASS**

A Fase C0 resolveu o bloqueio anterior: `StoredReelComment` agora representa
comentários e replies normalizados por `parentId`, com ordem estável opcional
por `siblingOrder`. Esta fase implementa exclusivamente a migração de
`connexy:reels:comments:v1` para `ReelCommentRepository`.

## Fonte e destino

A fonte validada é:

```text
Record<reelId, ReelComment[]>
```

Cada `ReelComment` contém `id`, `text`, snapshot do autor, `createdAt`,
`likes`, `likedByMe` e `replies` recursivas. A constante `COMMENTS_KEY` foi
exportada do módulo legado para evitar duplicar o literal.

O destino é a store `reel_comments`, acessada somente pelo
`ReelCommentRepository`. Nenhum store, índice, schema ou banco foi criado.

## Mapeamento e replies

Cada nó da árvore vira uma entidade `StoredReelComment`:

- raiz: `parentId = null`;
- reply: `parentId = id` do pai;
- replies de replies seguem a mesma regra, sem limite de profundidade;
- IDs originais são preservados;
- `reelId` vem da chave do mapa;
- texto, `authorId`, `authorName`, `authorPhoto`, `likes` e `likedByMe` são
  preservados sem substituição;
- o array `replies` não é persistido aninhado, pois a relação está normalizada.

Um `parentId` explícito é preservado quando compatível. Se divergir da posição
da reply na árvore, o registro e sua subárvore são inválidos; nenhuma relação é
“corrigida” arbitrariamente.

## Ordem

`siblingOrder` existente é preservado. Quando ausente, ele continua ausente:
nenhum número é inventado a partir da posição do array. O repository aplica o
fallback definido na C0:

1. `siblingOrder`;
2. `createdAt`;
3. `id`.

Assim, a leitura permanece determinística após reload.

## Ordem de inserção e integridade

A migração achata a árvore para entidades e executa rodadas pai-antes-dos-
filhos. Um nó só é gravado quando seu pai já existe no repository. O algoritmo
repete até não haver progresso, sem limite de profundidade.

- pai inexistente, autorreferência e ciclos ficam `invalid`;
- pai pertencente a outro Reel fica `invalid`;
- falha ao persistir um pai deixa seus descendentes como `failed`, permitindo
  retomada;
- nenhum nó pendente é descartado silenciosamente.

Antes de processar um grupo, `ReelRepository.exists(reelId)` é obrigatório.
Reels ausentes tornam todos os comentários válidos daquele grupo `orphaned`.
`MOCK_REELS` não é consultado nem transformado em Reel persistido.

## Autor, timestamps e comment likes

O snapshot histórico do autor é obrigatório e preservado. Autor ausente ou
inválido deixa o registro pendente como `invalid`; a identidade ativa nunca é
usada como substituição.

`createdAt` histórico válido é preservado. Quando ausente ou inválido, a
migração usa um único timestamp ISO da execução para todos os casos
sintetizados e informa a quantidade em `synthesizedCreatedAt`. A fonte
malformada permanece intacta para auditoria.

`likes` e `likedByMe` são snapshots compatíveis com `StoredReelComment` e são
preservados diretamente. Nenhuma entidade ou usuário fictício de Like de
comentário é criado.

## Deduplicação, idempotência e retomada

Antes de inserir, a migração consulta o comentário pelo ID original.

- representação semanticamente equivalente: `already_exists`;
- colisão de ID com conteúdo/relação divergente: `invalid`, preservando o
  registro existente;
- segunda execução após conclusão não relê a fonte;
- falha parcial mantém os registros já gravados;
- retomada reconhece os existentes e continua os filhos/restantes.

O resultado contabiliza separadamente `migrated`, `already_exists`,
`orphaned`, `invalid` e `failed`. A soma é verificável contra os nós
encontrados nos fixtures.

## Marcador

A etapa C exige:

```text
stages.reels = completed
stages.likes = completed
stages.comments = pending
```

Marcador ausente, legado da Fase A, inválido ou de versão incompatível bloqueia
C até as etapas anteriores concluírem. Ao finalizar sem órfãos, inválidos ou
falhas, somente estes campos são atualizados:

```text
stages.comments = completed
counts.comments = migrated + already_exists
```

Estados e contadores de reels/likes são preservados.

## Fonte e escopo preservados

- `connexy:reels:comments:v1` nunca é escrito, limpo ou removido.
- Não há dual-write ou sincronização contínua.
- `addReelComment`, `toggleCommentLike` e `publishReel` não foram alterados.
- Feed, UI, CommentsSheet, rotas e contadores visuais não foram alterados.
- Supabase, autenticação, schema e IndexedDB de mídia não foram alterados.
- Dados reais do navegador não foram executados; somente fixtures controlados
  foram migrados nos testes.

## Testes

`tests/persist-phase-1c-3c-c.test.ts` cobre fonte ausente/vazia, raízes,
múltiplos Reels, replies em profundidade arbitrária, árvore A → B → C → D,
múltiplas árvores e siblings, ordem explícita e fallback, relações inválidas,
ciclos, IDs, deduplicação, snapshots, timestamp histórico/sintetizado, órfãos,
falha parcial, retomada, fonte intacta e todos os estados relevantes do
marcador.

As regressões A, B, B0, C0 e 1C-3B permanecem na suíte completa.

## Arquivos alterados nesta fase

- `src/lib/reels/local-reel-persistence.ts`
- `src/lib/reels/reel-local-storage.ts` — somente export de `COMMENTS_KEY`
- `tests/persist-phase-1c-3c-c.test.ts`
- `docs/audits/persistence-phase-1c-3c-c.md`

## Validações

- Testes focados C + regressões A/B/C0: **100 pass / 0 fail**.
- `bunx tsc --noEmit`: **PASS**.
- `bun run build`: **PASS**.
- `bun test`: **200 pass / 0 fail** (489 assertions).
- Lint focado: **PASS**, sem novos problemas.
- `git diff --check`: **PASS**.
