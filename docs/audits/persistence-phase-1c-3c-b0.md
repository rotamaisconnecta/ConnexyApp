# Fase 1C-3C-B0 — Estado independente da migração local de Reels

- **Data:** 2026-09-12
- **Escopo:** somente marcador/estado da migração A/B/C.
- **Sem commit e sem push.**

## Problema identificado

O marcador criado pela Fase 1C-3C-A tinha a forma:

```json
{
  "version": 1,
  "ranAt": "ISO",
  "counts": { "reels": 10, "likes": 0, "comments": 0 }
}
```

A lógica original tratava a presença desse marcador v1 como conclusão da migração, embora
somente `published:v1 → ReelRepository` tivesse sido executada. Assim, as etapas futuras de
likes e comments poderiam ser puladas incorretamente.

## Risco

- considerar A/B/C concluídas após executar somente A;
- impedir a retomada independente de likes ou comments;
- reexecutar Reels desnecessariamente ao tentar corrigir a ambiguidade;
- duplicar trabalho ou perder a possibilidade de auditar fontes legadas.

## Decisão arquitetural

O marcador continua explicitamente versionado como v1 e passa a possuir estado independente:

```json
{
  "version": 1,
  "ranAt": "ISO",
  "counts": { "reels": 10, "likes": 0, "comments": 0 },
  "stages": {
    "reels": "completed",
    "likes": "pending",
    "comments": "pending"
  }
}
```

Cada etapa aceita `pending | completed`. `isReelsMigrationCompleted` só retorna `true` quando
as três etapas estão `completed`. `completeReelsMigrationStage` altera apenas a etapa solicitada
e seu contador, preservando as demais. Contagens inválidas não são gravadas.

## Compatibilidade com 1C-3C-A

Um marcador v1 válido sem `stages` é interpretado como:

```text
reels=completed, likes=pending, comments=pending
```

Isso vale inclusive quando `counts.reels` é zero: a existência do marcador válido registra que
a etapa A foi executada sobre uma fonte vazia. A migração de Reels não é repetida, os IDs no
`ReelRepository` não são duplicados e o marcador é promovido para o formato por etapa somente
quando B ou C concluírem seu próprio trabalho.

Marcadores ausentes, corrompidos ou de versão desconhecida são tratados como estado inicial
seguro (`pending/pending/pending`), nunca como conclusão.

## Uso futuro por B e C

- **B:** verifica `reels=completed` e `likes=pending`; após migrar likes com sucesso, chama
  `completeReelsMigrationStage(io, "likes", count)`. Comments permanece inalterado.
- **C:** verifica `comments=pending`; após migrar comments com sucesso, atualiza somente
  `"comments"`.
- Falha/interrupção antes da conclusão não marca a etapa como concluída. A retomada permanece
  idempotente pelos repositories e IDs determinísticos.

## Testes

`tests/persist-phase-1c-3c-b0.test.ts` cobre:

- estado inicial e marcador ausente;
- conclusão independente de reels/likes/comments;
- estados parciais válidos e conclusão global;
- preservação de etapas concluídas;
- compatibilidade com o marcador legado da etapa A;
- marcador corrompido e versão desconhecida;
- retomada após interrupção;
- rejeição de contagem inválida;
- ausência de escrita nas fontes legadas;
- ausência de reexecução da etapa A e duplicação no repository.

Os testes anteriores de 1C-3C-A continuam cobrindo idempotência por registro, retomada após
falha parcial e deduplicação por ID no `ReelRepository`.

## Arquivos alterados

- `src/lib/reels/local-reel-persistence.ts`
- `tests/persist-phase-1c-3c-b0.test.ts`
- `docs/audits/persistence-phase-1c-3c-b0.md`

## Limitações e garantias

- Likes e comments não foram migrados.
- Nenhuma fonte `connexy:reels:{published,likes,comments}:v1` foi removida ou escrita.
- `MOCK_REELS`, `SEED_COMMENTS` e o IndexedDB de mídia não foram alterados.
- Sem dual-write novo.
- Feed, UI, rotas e `publishReel` não foram alterados.
- Supabase e autenticação não foram alterados.

## Validações

- `bunx tsc --noEmit`: **PASS** (exit 0)
- `bun run build`: **PASS** (exit 0)
- `bun test`: **118 pass / 0 fail** (330 assertions)
- testes focados B0 + regressão A: **32 pass / 0 fail**
- ESLint de `local-reel-persistence.ts` e do teste B0: **PASS**, sem problemas novos
- `git diff --check`: **PASS**
- baseline global documentada anteriormente: aproximadamente 500 problemas preexistentes;
  nenhuma limpeza global foi executada nesta fase
