# Fase 1F-2 — Create canônico de Reel

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-1 (257 testes / 995 assertions).

## 1. Problema

A auditoria 1E encontrou dois caminhos de “publicar Reel”:

1. `/create/reel` → `usePublisherForm` → toast “Publicando...” / “Publicado com sucesso!” → `/home` **sem persistir**.
2. `/gerenciar/novo-reel` → `publishReel` → `ReelRepository` → IndexedDB → Feed.

O Create Hub apontava o CTA Reel para o caminho falso.

## 2. Causa

`CREATE_PANEL` em `src/routes/_app/create.tsx` usava `route: "/create/reel"`. Essa rota montava um formulário visual que chamava `usePublisherForm()`, o qual espera 800 ms, mostra toast e navega para `/home` sem gravar no `ReelRepository`.

O fluxo canônico de 1D-3 (`/gerenciar/novo-reel`) não foi alterado e continuou sendo o único que persiste.

## 3. Fluxo antigo

```text
/create → Reel → /create/reel → usePublisherForm
→ toast “Publicando...” → /home
→ nenhum Reel no IndexedDB / Feed
```

## 4. Fluxo novo

```text
/create → Reel → /gerenciar/novo-reel
→ seleção de mídia + título/descrição
→ publishReel → ReelRepository → IndexedDB store reels
→ getReelFeed (persistido + MOCK_REELS)
```

Atalhos residuais para `/create/reel` (roles-engine, RoleSelector, context-rules) caem no mesmo destino via redirect com `replace: true`.

## 5. Rota canônica

`/gerenciar/novo-reel`

Constante compartilhada: `CANONICAL_REEL_PUBLISH_ROUTE` em
`src/lib/reels/canonical-reel-publish-route.ts`.

`/create/reel` permanece como rota de compatibilidade e redireciona para a canônica. O arquivo não foi removido.

## 6. Persistência utilizada

Nenhuma chave, IndexedDB, store ou repository novos.

| Dado | Fonte |
| --- | --- |
| Reel publicado | `ReelRepository`, store `reels`, IndexedDB `connexy-reels-data-local-db` |
| Mídia | banco de mídia já existente (`connexy-reels-local-db`) |
| Feed | `getReelFeed()` / `persisted-reels-reader` (1D-3) |
| Likes / comments / replies | repositories e stores já existentes (intactos) |

Função de publicação: `publishReel` em `src/lib/reels/reel-publish.ts`. Sem dual-write. Sem Supabase.

## 7. Alteração aplicada

Mínima:

- CTA Reel do hub `/create` aponta para `/gerenciar/novo-reel`.
- Loader de `/create/reel` faz `throw redirect({ to: "/gerenciar/novo-reel", replace: true })`.
- Formulário falso e `usePublisherForm` foram removidos **somente** de `/create/reel`.

Não foram copiados o formulário nem a lógica de `/gerenciar/novo-reel`. Não foram alterados `ReelRepository`, `reel-feed`, likes, comments ou replies.

## 8. usePublisherForm

O hook permanece intacto. Consumidores atuais (não alterados):

- `/create/photo`
- `/create/video`
- `/create/text`
- `/create/event`
- `/create/place`
- `/create/place-business`
- `/create/offer`
- `/create/ride`
- `/create/moment`

Código residual documentado: o toast de publicação falsa continua nesses tipos. Fora do escopo de 1F-2.

## 9. Testes

Focados:

- `tests/persist-phase-1f-2.test.ts`
- `tests/persist-phase-1f-2-browser.test.ts`
- `tests/fixtures/create-reel-browser.ts`

Cobertura:

1. Create Hub aponta Reel para `/gerenciar/novo-reel`.
2. `/create/reel` redireciona e não contém `usePublisherForm` / “Publicando...”.
3. `/gerenciar/novo-reel` continua acessível e usa `publishReel`.
4. Uma publicação via `publishReel` grava um único registro (`storedCount === 1`).
5. O Reel entra no Feed.
6. Reload preserva o mesmo id no Feed e no IndexedDB.
7. Zero chamadas de rede.

Os testes de 1D-3 não foram duplicados nem alterados.

Suíte completa: **262 pass / 1024 assertions / 0 fail**.

## 10. Browser E2E

Vite em `http://localhost:8080`, sessão demo (Lucas). O seletor de arquivo da UI não é automatizável (mesma limitação de 1D-3). A persistência foi exercitada no Chrome real pelo mesmo `publishReel` usado por `/gerenciar/novo-reel`.

| Cenário | Resultado |
| --- | --- |
| A. `/create` → Criar Reel | URL `/gerenciar/novo-reel`, botão “Publicar reel” |
| B. Formulário canônico + `publishReel` | `persistence: "local"`, id gravado |
| C. Feed `/reels` | caption “Reel 1F-2 live Create Hub” visível |
| D. reload em `/reels` | o mesmo Reel permanece |
| E. `/create/reel` | redirect para `/gerenciar/novo-reel`; sem “Publicando...”; Publicar sem vídeo permanece no formulário (não vai para `/home`) |

Harness CDP: `hubRoute` e `redirectTo` = `/gerenciar/novo-reel`; uma publicação; Feed após reload; `networkCalls === 0`.

## 11. Código legado residual

Mantido de propósito (redirect cobre):

- `src/lib/roles/roles-engine.ts` (`route: "/create/reel"`)
- `src/components/roles/RoleSelector.tsx` (`REELS_CREATOR` → `/create/reel`)
- `src/lib/context/context-rules.ts` (“Criar reel do evento” → `/create/reel`)

O FAB do Feed e o empty state já apontavam para `/gerenciar/novo-reel` (1D-3). O plus da bottom nav abre `/create?category=reel` (hub, não o formulário falso).

## 12. Pendências

- Foto, vídeo, texto, evento, local, oferta, carona e momento do Create Hub ainda usam `usePublisherForm` (toast → `/home`, sem persistir).
- Wizards de Meu Connexy continuam visuais.
- Seguir / guardar / conectar no Feed continuam React (1D-3).
- Links residuais ainda nomeiam `/create/reel`; o redirect os torna inofensivos.

## 13. Validação

- Typecheck: PASS (`bunx tsc --noEmit`)
- Build: PASS (`bun run build`)
- Lint dos arquivos alterados: PASS
- Lint global: não corrigido (baseline 1E)
- Supabase: não acessado nem alterado
- 1D-3 Reels/Feed: intacta
- Commit/push: não realizados
