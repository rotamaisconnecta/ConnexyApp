# Fase 1C-3C-D — Reload e preparação de leitura persistida

- **Data:** 2026-09-12
- **Escopo:** validação em IndexedDB real e ponto de leitura isolado.
- **Sem integração com Feed, commit ou push.**

## Objetivo

Validar a sequência completa A → B → C em um IndexedDB real, atravessando
reloads do documento e recriação dos adapters/repositories, sem duplicação,
perda ou alteração das fontes legadas. Preparar, sem conectar, um ponto de
leitura dos Reels persistidos para a fase futura do Feed.

## Estratégia de reload

O runner Bun não fornece IndexedDB e o projeto não possui `fake-indexeddb`,
Playwright ou Puppeteer. Nenhuma dependência foi instalada e nenhuma
implementação de storage em memória foi criada para esta fase.

O teste `persist-phase-1c-3c-d.test.ts` inicia o Chrome headless já disponível
no ambiente, carrega um bundle da camada real do aplicativo por HTTP e utiliza
o `IndexedDbAdapter` nativo do browser. Cada reload:

1. destrói o contexto JavaScript do documento;
2. recarrega o bundle;
3. cria novos adapters e repositories;
4. reabre o mesmo `connexy-reels-data-local-db` no perfil temporário;
5. lê novamente os dados.

O perfil e banco exclusivos do teste são removidos ao final.

## Cenário completo validado

Fixture:

- **2 Reels** persistidos;
- **2 Likes** persistidos;
- **8 Comments** persistidos;
- **5 Replies**;
- **3 árvores** distribuídas em 2 Reels;
- profundidade máxima **4** (`comment-a → reply-b → reply-c → reply-d`).

Sequência executada:

```text
migração A → migração B → migração C
→ reload → leitura
→ nova tentativa A/B/C
→ reload → leitura
→ reload → leitura
```

Os três snapshots após reload são integralmente iguais. IDs, quantidades,
relações, ordenação, autores, timestamps e snapshots de Likes permanecem
estáveis. A segunda tentativa de migração retorna zero inserções e não altera o
marcador.

## Replies e integridade

Foram confirmados após os reloads:

- `reply-b.parentId = comment-a`;
- `reply-c.parentId = reply-b`;
- `reply-d.parentId = reply-c`;
- `reply-e.siblingOrder = 1`;
- ordem de siblings `reply-b, reply-e`;
- autor, `createdAt`, `likes` e `likedByMe` de reply preservados;
- nenhum reply promovido a raiz;
- nenhum `parentId` quebrado.

## Marcador

O marcador completo sobrevive aos reloads com:

```text
reels=completed
likes=completed
comments=completed
```

Também foram gravados e recarregados, sem executar migração:

```text
reels=completed, likes=completed, comments=pending
reels=completed, likes=pending, comments=pending
```

O reload isolado não promove estágios pendentes nem altera contadores de outros
estágios.

## Fontes legadas

As strings originais de:

- `connexy:reels:published:v1`;
- `connexy:reels:likes:v1`;
- `connexy:reels:comments:v1`;

foram comparadas byte a byte depois das migrações e reloads. Permaneceram
inalteradas.

## Camada preparada para o Feed

Foi criado `getPersistedReels()` em
`src/lib/reels/persisted-reels-reader.ts`. A função:

- abre o schema existente;
- consulta somente `ReelRepository.listOrderedByRecent()`;
- retorna `StoredReel[]`;
- fecha seu adapter;
- não executa migração;
- não escreve;
- não importa nem consulta localStorage, `MOCK_REELS`, Supabase ou Media DB;
- propaga falhas de persistência sem fallback.

O teste bloqueia `localStorage.getItem` e `fetch` durante essa leitura e confirma
que somente os dois Reels do IndexedDB são retornados. A função não foi
conectada ao Feed.

## Arquitetura validada

```text
IndexedDbAdapter
  ├─ ReelRepository
  ├─ ReelLikeRepository
  └─ ReelCommentRepository

getPersistedReels → ReelRepository (somente leitura)
```

O marcador permanece no localStorage apenas como estado da migração. Dados de
domínio permanecem no IndexedDB dedicado. O teste não consulta nem altera o
banco de mídia.

## Arquivos alterados

- `src/lib/reels/persisted-reels-reader.ts`
- `tests/fixtures/reels-reload-browser.ts`
- `tests/persist-phase-1c-3c-d.test.ts`
- `docs/audits/persistence-phase-1c-3c-d.md`

## Escopo preservado

- Feed, UI, componentes e rotas: inalterados.
- `publishReel`: inalterado.
- Supabase e autenticação: inalterados.
- Media DB: inalterado.
- Sem dual-read, dual-write ou fallback para mocks.
- Sem commit e sem push.

## Validações

- Reload real focado: **1 pass / 28 assertions / 0 fail**.
- Suíte completa: **201 pass / 0 fail** (517 assertions).
- `bunx tsc --noEmit`: **PASS**.
- `bun run build`: **PASS**.
- Lint focado: **PASS**, sem novos problemas.
- `git diff --check`: **PASS**.
