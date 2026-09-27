# Fase 1G-3 — Renomeação de produto: Reels → Agora

- **Data:** 2026-09-20
- **Status:** PASS
- **Modo:** nomenclatura de produto/UI. Sem nova infraestrutura.
  Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1G-2 (324 testes / 1891 assertions).

A interface apresenta o módulo como **Agora**. A persistência, os
repositórios, as rotas e o IndexedDB continuam `Reel` / `/reels` /
`connexy-reels-data-local-db`.

## 1. STATUS

**PASS**

Toda a cromagem relevante da UI passou a **Agora**. O menu Mais
mostra o quarto item como Agora e continua apontando para `/reels`.
Feed, likes, comments, follows, saves e connect sobrevivem ao
reload na mesma source of truth. Typecheck, build, lint dos
arquivos desta fase e a suíte completa passaram.

## 2. FILES CHANGED

Produto/UI:

- `src/lib/navigation/more-menu.ts`
- `src/routes/_app.reels.tsx`
- `src/routes/_app/reels/$reelId.tsx`
- `src/routes/_app/create.tsx`
- `src/routes/_app/create/reel.tsx`
- `src/routes/_app.gerenciar.novo-reel.tsx`
- `src/routes/_app.gerenciar.tsx`
- `src/lib/navigation/navigation-items.ts`
- `src/components/roles/RoleCard.tsx`
- `src/components/reels/reel-empty.tsx`
- `src/components/reels/reel-share-sheet.tsx`
- `src/lib/reels/reel-share.ts`
- `src/lib/roles/roles-engine.ts`
- `src/lib/integration/integration-utils.ts`
- `src/lib/integration/integration-reels.ts`
- `src/lib/integration/integration-feed.ts`
- `src/lib/integration/integration-notifications.ts`
- `src/lib/live/live-events.ts`
- `src/lib/context/context-rules.ts`
- `src/components/engine/engine-dashboard.tsx`
- `src/components/integration/live-map-layer.tsx`
- `src/components/driver/driver-engine-cards.tsx`
- `src/routes/__dev/demo.tsx`

Testes:

- `tests/persist-phase-1f-13.test.ts`
- `tests/persist-phase-1f-13-browser.test.ts`
- `tests/persist-phase-1g-3.test.ts` (novo)
- `tests/persist-phase-1g-3-browser.test.ts` (novo)
- `tests/fixtures/mvp-1g-3-browser.ts` (novo)

Relatórios:

- `docs/audits/local-functional-mvp-1g-3.md`
- `docs/audits/local-functional-mvp-baseline.md`

Não foram criados `/agora`, `AgoraRepository` nem
`connexy-agora-data-local-db`.

## 3. UI RENAMED

`Reels` / `Reel` visíveis → **Agora** (frases adaptadas, não
substituição cega):

| Superfície | Antes | Depois |
| --- | --- | --- |
| Menu Mais | Reel | Agora (`to: "/reels"`) |
| Título `/reels` | Reels — Connexy | Agora — Connexy |
| Tab do feed | Reels | Agora |
| Empty / CTA | Nenhum reel / Criar reel | Nada no Agora / Criar no Agora |
| Detalhe | Reel — Connexy | Agora — Connexy |
| Create Hub | Reel → “Criar Reel” | Agora → “Criar Agora” (mesmo padrão “Criar Foto”) |
| Publicação | Novo reel / Publicar reel | Novo no Agora / Publicar no Agora |
| Gerenciar | chip Reels; tile Reel | Agora |
| Role card | Criar Reel | Criar no Agora |
| Partilha | Partilhar reel / Veja este Reel | Partilhar no Agora / Veja isto no Agora |
| Integração, mapa, engine, live | Reels / Reel publicado | Agora / Publicado no Agora |

Rotas internas permanecem `/reels` e `/gerenciar/novo-reel`.

## 4. OCORRÊNCIAS TÉCNICAS MANTIDAS

Continuam de propósito:

- `ReelRepository`, `ReelLikeRepository`, `ReelCommentRepository`
- tipos `Reel`, `ReelComment`, `MOCK_REELS`
- IndexedDB `connexy-reels-data-local-db` e `connexy-reels-local-db`
- chaves `connexy:reels:*`
- arquivos `src/lib/reels/*`, `src/repositories/reel*.ts`
- `id: "reel"` no menu Mais
- rota `/reels` e `CANONICAL_REEL_PUBLISH_ROUTE = "/gerenciar/novo-reel"`
- comentários/logs técnicos (`[reels]`, erros de hierarquia)
- MCP Lovable `list_my_reels` / `List my reels` (API em inglês, tabela `reels`)

Produto/UI = Agora. Código interno = Reel.

## 5. MENU MAIS

Exatamente seis itens, mesma ordem e mesmas rotas:

```text
Locais     → /locais
Eventos    → /events
Negócios   → /marketplace
Agora      → /reels
Ofertas    → /marketplace
Gerenciar  → /gerenciar
```

## 6. TESTES

```text
quantidade anterior: 324 testes / 1891 assertions
novos testes:        4 (3 unitários 1G-3 + 1 browser CDP)
total:               328 pass
assertions:          1951
falhas:              0
```

Os testes 1F-13 que assertavam o label visível `"Reel"` no menu Mais
foram atualizados para `"Agora"`. Testes técnicos (`ReelRepository`,
`connexy-reels-data-local-db`, `CANONICAL_REEL_PUBLISH_ROUTE`) não
foram alterados.

## 7. TYPECHECK

PASS (`bunx tsc --noEmit`)

## 8. BUILD

PASS (`bun run build`)

## 9. LINT

PASS nos arquivos alterados desta fase (`bunx eslint` na lista
tocada). Lint global permanece o baseline preexistente (não limpo).

## 10. BROWSER/CDP

Vite `:8080`, `VITE_APP_DEMO_MODE=true`.

Ao vivo:

- `/profile` → Mais opções → Locais, Eventos, Negócios, **Agora**,
  Ofertas, Gerenciar
- clique em **Agora** → `http://localhost:8080/reels`, título
  `Agora — Connexy`, tab Agora, feed carregado (catálogo + item
  persistido da 1F-2)
- reload de `/reels` → mesmo título, tab Agora, dados presentes
- `/create` → “Criar Agora”
- `/gerenciar` → tile **Agora** (sem Reel/Reels visíveis)
- IndexedDB após reload: `connexy-reels-data-local-db` e
  `connexy-reels-local-db`; sem `connexy-agora-data-local-db`

Harness CDP 1G-3: publicar, like, comment, follow, save, connect,
reload, `networkCalls = 0`, bancos originais.

## 11. NETWORK

```text
networkCalls = 0
```

No harness 1G-3. No browser ao vivo, os únicos hits com “supabase”
no nome são módulos Vite locais (`src/lib/supabase/*.ts`), não
HTTP remoto. `apiCalls` para `supabase.co` / `/rest/v1/` = 0.

## 12. SUPABASE

```text
Supabase calls = 0
```

Não houve login, link, SQL, migration nem bucket remoto.

## 13. REGRESSÕES

Nenhuma regressão funcional. `/reels` continua a abrir o feed.
Likes, comments, follows, saves e connect usam as mesmas stores.
Caption persistida `Reel 1F-2 live Create Hub` é conteúdo de
usuário da 1F-2, não cromagem do produto.

## 14. BUSCA FINAL

Ocorrências restantes de `Reels` / `Reel` / `reels` / `reel`:

**Aceitáveis (infraestrutura):**

- Repositories, tipos, `MOCK_REELS`, schema IndexedDB
- `connexy-reels-data-local-db`, `connexy-reels-local-db`
- arquivos e rotas `/reels`, `/gerenciar/novo-reel`
- `id: "reel"`, `kind: "reel"`, stores `reels` / `reel_likes`
- logs, comentários técnicos, testes técnicos
- MCP `list_my_reels` (ferramenta Lovable, não UI Connexy)

**Não restaram sem justificativa:**

- label visível “Reels” no menu Mais
- título “Reels — Connexy”
- botão/tab de navegação “Reels”
- empty states / CTAs “Criar reel” / “Publicar reel”

Conteúdo persistido de sessão anterior (`Reel 1F-2 live Create Hub`)
não é label do produto.

## 15. SOURCE OF TRUTH

```text
Agora
→ infraestrutura existente de Reels
→ IndexedDB connexy-reels-data-local-db
```

Mídia continua em `connexy-reels-local-db`. Sem
`connexy-agora-data-local-db`, sem `AgoraRepository`.

## 16. DECISÃO

**PASS**

Não criar uma próxima fase automaticamente. Não fazer commit/push.
