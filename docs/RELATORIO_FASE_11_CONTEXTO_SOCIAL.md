# RELATÓRIO — FASE 11: CONTEXTO SOCIAL E ATIVIDADES COMPARTILHADAS

## A. Resumo executivo

Auditoria concluída sobre **atividades compartilhadas**, **interesses em comum** e
**contexto social** do perfil avaliador no modo demo. A regra de interseção já existia em
parte (`commonGround`, `getCommonalities`), mas três partes do perfil exibiam conteúdo
**fabricado** (amigos, atividades e lugares) e quatro cálculos estavam presos à identidade
fixa `lucas`. Foram encontrados **5 problemas reais reproduzidos contra o snapshot commitado
(HEAD) — 0 pass / 5 fail antes; 9 testes novos passam depois** e **3 itens documentados sem
alteração** (P6–P8), todos fora do escopo desta fase.

Correções cirúrgicas, sem nova arquitetura, store, hook ou service; reutilização dos helpers
existentes (`anonymizePresenceList`, `getConnectionIds`-style de `demo-db`,
`listSharedActivities` novo em `presence-privacy`, rotares `Link` já usados no próprio
arquivo). Baseline preservado e elevado:

- `bun test` → **854 pass / 0 fail / 4802 expect / 95 arquivos**
  (antes: 845 pass / 0 fail / 4751 expect / 94 arquivos; +9 testes da Fase 11)
- `bunx tsc --noEmit` → exit 0
- `git diff --check` → exit 0
- `bunx prettier --check` + `bunx eslint` nos 8 arquivos alterados → exit 0
- Working tree: **138 entradas** (baseline capturado no início da fase: 133; +5 = 4 arquivos
  que estavam limpos + o teste novo)

## B. Reprodução (antes × depois)

Antes de corrigir, os problemas foram reproduzidos executando um probe de 5 asserções contra
um snapshot exportado do commit atual (`git archive HEAD` em `/tmp`, árvore separada, sem
tocar no working tree):

```
0 pass / 5 fail   (P1 identidade, P4 check-in, P1-feed comuns, P2 atividade, P3/P5 fabricado)
```

Verificado também que a troca de identidade funcionava no snapshot antigo
(`setDemoIdentity("beatriz")` → `getDemoIdentity().id === "beatriz"`), ou seja, o P1 falha
pelo motivo certo: `commonGround(marina)` devolvia `[]` (sempre `currentUser`) em vez de
`["Arte"]`. Depois das correções, as mesmas asserções (e mais 4) passam nas 9 asserções do
arquivo entregue `tests/phase-11-shared-context.test.ts`.

## C. Problemas reais e correções

### P1 — Interesses/compatibilidade calculados contra `currentUser` estático
- **Arquivos**: `src/lib/mock-data.ts`, `src/lib/feed/commonalities.ts`
- **Sintoma**: `commonGround(person)`, `sharedInterestPercent(person)`,
  `compatibilityScore(person)` e `getCommonalities(person)` usavam sempre o `currentUser`
  (`lucas`). Com a identidade demo trocada (ex.: `beatriz`), "Vocês têm N interesses em
  comum", o percentual e a compatibilidade exibidos não correspondiam a quem está olhando.
  Em `beatriz` vendo `marina`: correto = `["Arte"]` / 25%; obtido = `[]` / 0%.
- **Correção**: parâmetro opcional `viewer: ActiveViewer = getActiveViewer()` em
  `commonGround` (`mock-data.ts:422`), `compatibilityScore` (`:636`) e
  `sharedInterestPercent` (`:647`); `getCommonalities` passa a usar
  `const viewer = getActiveViewer()` (`commonalities.ts:32`). Nenhum call-site externo precisou
  mudar (abordagem escolhida justamente para isso).
- **Nota de implementação**: `mock-data` passou a importar `getDemoIdentity` de
  `demo-identity`, o que cria um ciclo de imports. Ele é seguro **apenas** porque a lista de
  identidades ficou lazy: `demo-identity.ts` substitui o `const DEMO_IDENTITIES` por
  `demoIdentities` + `getDemoIdentitiesList()` (`:16-24`), avaliado na primeira chamada.

### P2 — "Atividade compartilhada" era texto fixo, não participação real
- **Arquivo**: `src/routes/_app.perfil.$id.tsx`, `src/lib/presence/presence-privacy.ts`
- **Sintoma**: a seção sempre renderizava 3 linhas fixas
  (`"Confirmou presença em um evento próximo"`, `` `Curtiu ${...}` ``,
  `` `Fez check-in no ${...}` ``) — nada vinha de participação conjunta em evento/local.
- **Correção**: novo helper puro `listSharedActivities(records, viewerId, personId, friendIds)`
  (`presence-privacy.ts:256`) que (1) filtra os check-ins de cada um pela **mesma regra de
  visibilidade** da lista de presentes (`anonymizePresenceList` — anônimo nunca aparece;
  "apenas amigos" só com conexão real), (2) deduplica por `targetId` mantendo o check-in mais
  recente, (3) devolve a **interseção por `targetId`** e ordena por recência. O perfil chama
  `listSharedActivities(checkins, viewerId, person.id, friendIds)` (`perfil:196`) e só
  renderiza a seção quando `sharedActivities.length > 0` (`perfil:463`).
- **Navegação**: cada item envolve o `ActivityItem` existente num `Link` com o id **preservado**
  — `event` → `/event/$eventId` com `params={{ eventId: activity.targetId }}`; `place` →
  `/local/$id` com `params={{ id: activity.targetId }}`. Não usei
  `getDiscoverItemNavigation` porque ele faz `id.replace(/^evt-/, "")` e geraria `/event/1`
  (inexistente: os eventos mock têm id `evt-1`).

### P3 — "Amigos em comum" era fatiamento do catálogo com contador fixo
- **Arquivo**: `src/routes/_app.perfil.$id.tsx`
- **Sintoma**: `people.filter(...).slice(0, 6)` (qualquer pessoa, sem grafo) + rótulo fixo
  `"12 amigos em comum"`.
- **Correção**: interseção real do grafo demo —
  `getConnectionIds(viewerId)` ∩ `getConnectionIds(person.id)` (`perfil:184-194`), mapeada por
  `findPerson`; rótulo dinâmico `"{n} amigo(s) em comum"`; seção só existe quando
  `sharedFriends.length > 0`. Novo helper `getConnectionIds(userId)` em `demo-db.ts:256`
  (peers via `getConnectionPeerId`, reusando `getConnectionsForUser`).
- **Comportamento esperado (honesto)**: no banco demo atual todas as arestas envolvem o
  viewer, então o perfil de terceiros normalmente exibirá **nenhum** amigo em comum — a seção
  some em vez de inventar. O teste "amigos em comum vêm do grafo real" cria duas conexões
  (`connectUser`) e prova que a interseção devolve o par correto.

### P4 — Check-in gravava a identidade fixa `lucas`
- **Arquivo**: `src/providers/presence/presence-provider.tsx`
- **Sintoma**: `const CURRENT_USER_ID = "lucas"` alimentava `checkIn`, `leave`,
  `updateVisibility` e `getPresentList`; com outra identidade ativa, o registro saía com
  outro usuário (e os "presentes" ficavam errados).
- **Correção**: `getActiveViewer()` importado de `mock-data` (`:48`) usado em
  `checkIn` (`:436`), `leave` (`:472`), `updateVisibility` (`:483`) e `getPresentList`
  (`:498`); `CURRENT_USER_ID` removido. O gate `MOCK_PRESENCE_ENABLED` (DEV + sem Supabase
  público + flag) não foi tocado.

### P5 — `displayPlaces` injetava 3 lugares fixos
- **Arquivo**: `src/routes/_app.perfil.$id.tsx`
- **Sintoma**: `[...favoritePlaces, findPlace("cafe-central"), findPlace("sunset-parque"),
  findPlace("vinil-store")]` — lugares que a pessoa não curtiu apareciam em "Lugares que
  curtiu" e alimentavam as linhas fabricadas de atividade e as imagens de publicação.
- **Correção**: `displayPlaces` passou a ser apenas os favoritos reais da pessoa
  (`perfil:174-183`, com dedupe); a seção continua com guarda `displayPlaces.length > 0`.

## D. Arquivos alterados e criados (Fase 11)

Alterados (em cima das modificações pré-existentes da branch; apenas trechos da Fase 11):

| Arquivo | Mudança |
| --- | --- |
| `src/lib/mock-data.ts` | `ActiveViewer` + `getActiveViewer()`; parâmetro `viewer` nos 3 helpers de interseção |
| `src/lib/demo/demo-identity.ts` | lista de identidades lazy (resolve o ciclo de imports) |
| `src/lib/demo/demo-db.ts` | novo `getConnectionIds(userId)` |
| `src/lib/feed/commonalities.ts` | `getCommonalities` usa `getActiveViewer()` |
| `src/lib/presence/presence-privacy.ts` | `SharedActivity` + `listSharedActivities()` |
| `src/providers/presence/presence-provider.tsx` | identidade ativa em check-in/leave/visibilidade/presentes |
| `src/routes/_app.perfil.$id.tsx` | `viewerId`, `sharedActivities` real, `sharedFriends` real, `displayPlaces` real, guardas de estado vazio, navegação `Link` |

Criado:

- `tests/phase-11-shared-context.test.ts` — **9 testes** (6 do roteiro da fase + 3 de
  identidade/grafo): interseção real, exclusão de não-compartilhados, anônimo nunca aparece,
  navegação com id preservado, estado vazio sem conteúdo fabricado, interseção exata de
  interesses, "A vendo B ≠ B vendo A" (25% × 50%, e `compatibilityScore` difere em 20 entre
  identidades), identidade ativa em presença/feed/perfil (escaneamento de fonte) e grafo real
  de conexões.

Fora do repositório (gitignored, `git status` não muda):

- `.env.local` → `VITE_APP_ENABLE_MOCK_PRESENCE=1` (linha 7). Era a única porta faltante do
  gate `MOCK_PRESENCE_ENABLED` (`isPublicSupabaseConfigured()` já devolve `false` em modo
  demo): sem ela nenhum check-in demo é semeado e a seção corrigida nunca poderia ser
  observada na UI. O mecanismo de seed já existe (§10 do roteiro); é DEV-only e desligável
  removendo a linha.

Preservados (conferidos antes e depois): correções das Fases 9 e 10, `stats` e
`fallbackPublicationImages`, Gemini, Chat/People/Discovery/Home, e as 133 alterações
pré-existentes do working tree.

## E. Validação

| Verificação | Antes (Fase 10) | Depois (Fase 11) |
| --- | --- | --- |
| `bun test` | 845 pass / 0 fail / 4751 expect / 94 | 854 pass / 0 fail / 4802 expect / 95 |
| `bunx tsc --noEmit` | exit 0 | exit 0 |
| `git diff --check` | exit 0 | exit 0 |
| Probe pré-correção (HEAD) | — | 0 pass / 5 fail |
| Conjunto Fase 11 (9 testes) | — | 9 pass / 0 fail |
| `prettier --check` + `eslint` (arquivos da fase) | — | exit 0 |
| Entradas do working tree | 133 | 138 (+5) |

Verificação no navegador (`http://127.0.0.1:5173`, modo demo): o Vite reiniciou sozinho ao
detectar a mudança em `.env.local` (o módulo servido expõe
`VITE_APP_ENABLE_MOCK_PRESENCE: "1"`), `GET /perfil/beatriz` responde 200 e os módulos
transformados já contêm `getActiveViewer` / `listSharedActivities`.

## F. Observações de design confirmadas (sem correção) e itens documentados

- **P6 — `stats` e `fallbackPublicationImages` (deixados como estão)**: números 128/24/35 e
  imagens fixas de publicação são conteúdo de catálogo pré-existente, **não** contexto social
  compartilhado (escopo da fase). Documentado; sugeriria derivar de dados reais numa fase de
  Feed/Perfil.
- **P7 — `currentUser.interests` como input do Gemini** (`ConnexyChatScreen.tsx`,
  `_app.solicitacao.$id.tsx`): é insumo do modelo, não exibido como contexto compartilhado, e
  o roteiro proíbe mexer no Gemini sem necessidade direta. Fora de escopo.
- **P8 — "12 amigos" no perfil próprio** (`_app.perfil.index.tsx`): pertence ao perfil próprio,
  não ao contexto social de terceiros. Fora de escopo.
- **Visibilidade**: a interseção reusa `anonymizePresenceList` com `friendIds` = conexões do
  viewer — nada de regra nova de privacidade.
- **Navegação**: `Link` ternário explícito no próprio componente, consistente com "Lugares que
  curtiu" do mesmo arquivo (e sem o strip de prefixo `evt-`).
- **Estado vazio respeitado**: sem registros de presença, sem conexões em comum ou sem
  favoritos, as seções **somem** (nada de dado fictício para preencher a tela).
- **Modo produção**: sem demo, `viewerId` vem da sessão Supabase e `commonGround` cai no
  `currentUser` do catálogo — como os check-ins demo não existem em prod, a seção fica vazia
  (degradação segura, sem exibição incorreta).

## G. Conclusão

A **FASE 11 — Contexto Social e Atividades Compartilhadas** está **CONCLUÍDA**. Auditoria
executada antes de alterar; 5 problemas reais reproduzidos e corrigidos de forma cirúrgica
(identidade ativa em interesses/compatibilidade/comuns e no check-in, atividade compartilhada
vinda da interseção de presença real, amigos em comum vindos do grafo real e lugares sem
injeção fixa), 3 itens documentados sem alteração por estarem fora do escopo; baseline
preservado e elevado (854 testes, tsc 0, diff --check 0, lint/format limpos). Nenhum commit
foi criado.
