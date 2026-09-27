# Fase 1F-7 — Reels residuais: Seguir, Guardar e Conectar

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-6 (294 testes / 1415 assertions).

## 1. Auditoria

### SEGUIR

- **Encontrado:** botão `ReelFollowButton`; `handleToggleFollow` só mutava
  `reel.author.isFollowing` em React. Snapshot `isFollowing` no autor do
  Reel e `followingIds: []` no engine/presence. Seguir empresa no
  marketplace também é React.
- **Arquivos:** `reel-follow-button.tsx`, `_app.reels.tsx`, `reel-types.ts`,
  `reels-entities.ts`, `engine-types.ts`.
- **Store/repository:** nenhum FollowRepository. IndexedDB de Reels não tem
  store de follow.
- **Persistência:** inexistente para pessoas.
- **Estado atual (antes):** C (UI mock) / D (grafo).
- **Reutilização:** o blob social `connexy:demo:db` já guarda relações entre
  identidades. Não havia coleção `follows`.

### GUARDAR

- **Encontrado:** `savedByMe` mutado em React no feed e no detalhe.
- **Infraestrutura:** `connexy:demo:saved-details` — lista genérica de ids
  (`isDetailSaved` / `toggleSavedDetail`), usada por locais e negócios.
- **Estado atual (antes):** A — persistência reutilizável, Reel desconectado.
- **Reutilização:** sim, com `reel.id` (`reel-001`, `reel-<timestamp>-…`).

### CONECTAR

- **Encontrado:** `onConnect={() => {}}` no feed. `ReelConnectButton` sem
  estado.
- **Infraestrutura:** 1D-2 em `demo-db` (`sendRequest`, `acceptRequest`,
  `isConnected`, `getOutgoingPendingRequest`) e `/solicitacao/$id`.
- **Estado atual (antes):** A — sistema social completo, Reel desconectado.
- **Identidade do autor:** `reel.author.id` (pessoas do catálogo:
  `beatriz`, `rafael`, …; alguns mocks usam `b1`/`cafe-central`/`d1`).

## 2. Classificação

| Comportamento | Infraestrutura | Persistência | Origem | Reutilizável? | Ação |
| --- | --- | --- | --- | --- | --- |
| Seguir | UI + snapshot no autor | Nenhuma | React / fixture | Parcial (demo-db) | Adaptar `connexy:demo:db` com `follows[]` |
| Guardar | `saved-details` | `connexy:demo:saved-details` | 1F-1 | Sim | Ligar `reel.id` |
| Conectar | demo-db 1D-2 | `connexy:demo:db` requests/connections | 1D-2 | Sim | Navegar para `/solicitacao/$id` |

## 3. Decisão

Não criar FollowRepository, SaveRepository nem chave nova.

- **Seguir:** menor adaptação do blob já existente `connexy:demo:db`.
- **Guardar:** `toggleSavedDetail(reel.id)`.
- **Conectar:** só autores que existem no catálogo demo de pessoas;
  pending/connected reutilizam 1D-2. Negócio/local/evento não geram
  conexão paralela.

## 4. Implementação

Reel → `author.id` / `reel.id` → demo-db / saved-details → localStorage.

Like, comment, reply, ReelRepository e o schema IndexedDB não foram
alterados.

### Arquivos

- `src/lib/demo/demo-db.ts` — `follows[]`, `isFollowing`, `toggleFollow`
- `src/lib/demo/use-demo-db.ts` — `useDemoIsFollowing`
- `src/lib/marketplace/saved-details.ts` — evento de subscribe
- `src/lib/reels/reel-social-state.ts` — overlay saved/follow/connect
- `src/components/reels/reel-actions.tsx`
- `src/components/reels/reel-connect-button.tsx`
- `src/components/reels/reel-follow-button.tsx`
- `src/components/reels/reel-save-button.tsx`
- `src/routes/_app.reels.tsx`
- `src/routes/_app/reels/$reelId.tsx`
- `src/routes/_app.perfil.$id.tsx`
- `tests/persist-phase-1f-7.test.ts`
- `tests/persist-phase-1f-7-browser.test.ts`
- `tests/fixtures/mvp-1f-7-browser.ts`

## 5. Testes

Focados: 5 testes / 76 assertions.

Suíte completa: **299 pass / 1491 assertions / 0 fail**.

Harness CDP: seguir, guardar, favorite de local coexistindo, convite 1D-2,
reload, unfollow, `networkCalls = 0`.

## 6. Validação

- Typecheck PASS
- Build PASS
- Lint dos arquivos alterados PASS
- Supabase não alterado
- 1D-1 … 1F-6 intactas
