# Fase 1C-3C-B — Migração local de Likes de Reels

- **Data:** 2026-09-12
- **Escopo:** migração exclusiva de `connexy:reels:likes:v1` para
  `ReelLikeRepository`.
- **Sem commit e sem push.**

## Fonte e destino

A fonte legada permanece `connexy:reels:likes:v1`, no formato
`Record<string, boolean>`. Somente valores exatamente `true` representam Likes
a migrar. Valores `false` são contabilizados como ausência de Like e não geram
inserção nem remoção.

O destino é o store `reel_likes` do banco de domínio já existente, acessado
exclusivamente pelo `ReelLikeRepository`. Não foi criado store, schema,
IndexedDB ou repository adicional.

## Identidade

A entrada pública resolve a identidade segundo a regra já estabelecida no
produto:

```text
auth.user?.id ?? currentUser.id
```

O ID autenticado pode ser fornecido ao `ensureLocalReelsLoaded`; na ausência
dele, o fluxo local/demo usa `currentUser.id`. A função de migração recebe a
identidade resolvida explicitamente e bloqueia antes de ler a fonte caso ela
seja nula ou vazia. Nenhum UUID, ID fixo novo, `reelId` ou fallback arbitrário
é criado.

Limitação: o legado não registra o autor histórico. Portanto, o Like migrado é
atribuído à identidade ativa no momento da migração, não a uma autoria
histórica reconstruída.

## Existência do Reel e órfãos

Cada entrada `true` é validada no `ReelRepository`. `MOCK_REELS` não é usado
como destino implícito. Quando o Reel não existe:

- nenhum Reel artificial é criado;
- nenhum Like órfão é inserido;
- o caso é contabilizado e registrado para diagnóstico;
- a fonte permanece intacta;
- `stages.likes` continua `pending`.

Assim, uma referência não resolvida não é descartada silenciosamente nem
declarada concluída.

## Timestamp e identidade determinística

Todos os Likes inseridos numa mesma execução recebem um único timestamp ISO
sintetizado:

```text
createdAt = migration timestamp
```

Ele não representa a data histórica do Like. A chave primária usa
obrigatoriamente `reelLikeId(reelId, userId)`. Antes de inserir, a migração
consulta `ReelLikeRepository.getByReelAndUser`; registros existentes são
contabilizados e preservados sem sobrescrever `createdAt`.

## Idempotência e retomada

- Uma etapa já marcada `completed` não relê a fonte.
- IDs determinísticos impedem duplicação.
- Falha parcial preserva Likes já inseridos e mantém a etapa pendente.
- Na retomada, os existentes são reconhecidos e somente os restantes são
  inseridos.
- O contador final de Likes corresponde aos Likes da fonte que estão no
  repository (`migrated + skippedAlreadyPresent`) na execução conclusiva.
- JSON inválido, estrutura inválida, identidade ausente, órfão ou falha de
  persistência impedem conclusão segura.

## Marcador

A etapa B exige `stages.reels = completed`. Marcador ausente, inválido ou com
versão incompatível não permite iniciar B diretamente; o facade executa A
antes de B.

Na conclusão, somente estes dados são atualizados:

```text
stages.likes = completed
counts.likes = quantidade contabilizada
```

`stages.reels`, `stages.comments`, `counts.reels` e `counts.comments` são
preservados. O marcador antigo produzido por 1C-3C-A é reconhecido como
`reels=completed, likes=pending, comments=pending`, permitindo executar B sem
repetir A.

## Preservações e ausências

- `connexy:reels:likes:v1` nunca é escrito, limpo ou removido.
- `connexy:reels:published:v1` e `connexy:reels:comments:v1` não são alterados.
- Não há dual-write nem sincronização contínua.
- Feed, UI, rotas, `toggleReelLike` e `publishReel` não foram alterados.
- `MOCK_REELS`, `SEED_COMMENTS` e o IndexedDB de mídia não foram alterados.
- Supabase, autenticação, migrations e policies não foram alterados.
- Comments não foram migrados.

## Testes

`tests/persist-phase-1c-3c-b.test.ts` cobre:

- fonte ausente, vazia, somente `false`, somente `true` e mistura;
- múltiplos Likes, identidade autenticada, fallback demo e identidade ausente;
- existência do Reel, órfãos e ausência de Reel artificial;
- IDs determinísticos e timestamp único por execução;
- reexecução, Like preexistente, falha parcial e retomada;
- preservação byte a byte da fonte;
- marcador parcial, ausente, legado, inválido e de versão incompatível;
- preservação independente de reels/comments e contagem de Likes;
- etapa já concluída e falha ao gravar marcador;
- regressão das etapas A e B0.

## Arquivos alterados nesta fase

- `src/lib/reels/local-reel-persistence.ts`
- `tests/persist-phase-1c-3c-b.test.ts`
- `docs/audits/persistence-phase-1c-3c-b.md`

## Validações

- Testes focados B + regressões A/B0: **61 pass / 0 fail**.
- `bunx tsc --noEmit`: **PASS**.
- `bun run build`: **PASS**.
- `bun test`: **147 pass / 0 fail** (390 assertions).
- ESLint focado: **PASS**, sem novos problemas.
- `git diff --check`: **PASS**.
